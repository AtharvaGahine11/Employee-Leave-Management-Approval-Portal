import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../middleware/errorHandler.js';
import { LeaveStatus, AuditAction, Role } from '../../types/enums.js';
import { finalizeApprovedDays, releasePendingDaysOnRejectionOrCancel } from '../balances/balanceService.js';
import { logAudit } from '../audit/auditService.js';
import { createNotification, createRoleNotification } from '../notifications/notificationService.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/env.js';
import { generateLeaveApprovedEmployeeEmail, generateLeaveApprovedManagerEmail } from '../../services/emailService.js';

// ==========================================
// MANAGER TIER 1 APPROVALS
// ==========================================

export const getManagerLeaves = asyncHandler(async (req: Request, res: Response) => {
  const managerId = req.user!.id;
  const { status, search } = req.query;

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: {
        managerId,
      },
      ...(status ? { status: status as LeaveStatus } : {}),
      ...(search
        ? {
            OR: [
              { requestId: { contains: search as string } },
              { employee: { name: { contains: search as string } } },
              { reason: { contains: search as string } },
              { comments: { some: { body: { contains: search as string } } } },
            ],
          }
        : {}),
    },
    include: {
      leaveType: true,
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          designation: true,
          department: { select: { name: true, code: true } },
        },
      },
      approvals: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

export const managerApprove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;
  const managerId = req.user!.id;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { include: { department: true } }, leaveType: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  // Authorization check: must be reporting manager or HR
  if (leaveRequest.employee.managerId !== managerId && req.user!.role !== Role.HR) {
    throw new AppError('You are not authorized to approve leave for this employee.', 403, 'FORBIDDEN');
  }

  // Concurrency & Status check: must be PENDING_MANAGER or ESCALATED
  if (leaveRequest.status !== LeaveStatus.PENDING_MANAGER && leaveRequest.status !== LeaveStatus.ESCALATED) {
    throw new AppError(
      `This leave request has already been processed or is not pending manager review (Current status: ${leaveRequest.status}).`,
      409,
      'ALREADY_PROCESSED'
    );
  }

  const previousStatus = leaveRequest.status as LeaveStatus;

  const updatedRequest = await prisma.$transaction(async (tx) => {
    // 1. Create Approval record
    await tx.approval.create({
      data: {
        leaveRequestId: id,
        approverId: managerId,
        tier: Role.MANAGER,
        decision: LeaveStatus.APPROVED,
        comment: comment || 'Approved by Manager',
      },
    });

    // 2. Update Leave Request Status to PENDING_HR
    const resReq = await tx.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.PENDING_HR },
    });

    return resReq;
  });

  // 3. Log Audit
  await logAudit({
    leaveRequestId: id,
    actorId: managerId,
    actorRole: req.user!.role,
    action: AuditAction.MANAGER_APPROVED,
    previousStatus,
    newStatus: LeaveStatus.PENDING_HR,
    metadata: { comment: comment || 'Manager approved' },
  });

  // 4. Notify HR and Employee
  await createRoleNotification(
    'HR',
    'Manager Approved Leave Pending HR Final Decision',
    `Leave request ${leaveRequest.requestId} for ${leaveRequest.employee.name} (${leaveRequest.daysCount} days) was approved by Manager and requires HR final approval.`,
    `/hr/leaves/${id}`
  );

  await createNotification({
    recipientId: leaveRequest.employeeId,
    title: 'Leave Request Approved by Manager',
    message: `Your leave request ${leaveRequest.requestId} was approved by your manager and forwarded to HR for final sign-off.`,
    type: 'INFO',
    link: `/employee/leaves/${id}`,
    emailSubject: `[ELAP] Leave Request ${leaveRequest.requestId} Approved by Manager (Pending HR Final Sign-off)`,
    emailHtml: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">Tier 1 Manager Approval Granted</h2>
        <p>Dear ${leaveRequest.employee.name},</p>
        <p>Your leave request <strong>${leaveRequest.requestId}</strong> (${leaveRequest.leaveType.name} for ${leaveRequest.daysCount} days) has been reviewed and <strong>approved by your manager</strong>.</p>
        <p>It has now been forwarded to Human Resources for final approval.</p>
        <p style="margin-top: 20px;"><a href="${config.clientUrl}/employee/leaves/${id}" style="background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View Request Status</a></p>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: 'Leave request approved and forwarded to HR.',
    data: updatedRequest,
  });
});

export const managerReject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;
  const managerId = req.user!.id;

  // BR-04: Mandatory rejection comment
  if (!comment || comment.trim().length === 0) {
    throw new AppError('Rejection comment is mandatory when rejecting a leave request.', 400, 'MISSING_REJECTION_COMMENT');
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: true, leaveType: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  if (leaveRequest.employee.managerId !== managerId && req.user!.role !== Role.HR) {
    throw new AppError('You are not authorized to reject leave for this employee.', 403, 'FORBIDDEN');
  }

  if (leaveRequest.status !== LeaveStatus.PENDING_MANAGER && leaveRequest.status !== LeaveStatus.ESCALATED) {
    throw new AppError(
      `This leave request cannot be rejected in its current status ('${leaveRequest.status}').`,
      409,
      'ALREADY_PROCESSED'
    );
  }

  const previousStatus = leaveRequest.status as LeaveStatus;

  await prisma.$transaction(async (tx) => {
    // 1. Create Approval Record
    await tx.approval.create({
      data: {
        leaveRequestId: id,
        approverId: managerId,
        tier: Role.MANAGER,
        decision: LeaveStatus.REJECTED_BY_MANAGER,
        comment: comment.trim(),
      },
    });

    // 2. Update Request Status to REJECTED_BY_MANAGER (Terminal)
    await tx.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.REJECTED_BY_MANAGER },
    });

    // 3. Release pending balance
    await releasePendingDaysOnRejectionOrCancel(
      leaveRequest.employeeId,
      leaveRequest.leaveTypeId,
      leaveRequest.daysCount,
      leaveRequest.startDate.getFullYear(),
      tx
    );
  });

  // 4. Log Audit
  await logAudit({
    leaveRequestId: id,
    actorId: managerId,
    actorRole: req.user!.role,
    action: AuditAction.MANAGER_REJECTED,
    previousStatus,
    newStatus: LeaveStatus.REJECTED_BY_MANAGER,
    metadata: { rejectionComment: comment.trim() },
  });

  // 5. Notify Employee
  await createNotification({
    recipientId: leaveRequest.employeeId,
    title: 'Leave Request Rejected by Manager',
    message: `Your leave request ${leaveRequest.requestId} was rejected by your manager. Reason: "${comment.trim()}"`,
    type: 'DANGER',
    link: `/employee/leaves/${id}`,
    emailSubject: `[ELAP] Leave Request ${leaveRequest.requestId} Rejected`,
    emailHtml: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #dc2626;">Leave Request Rejected</h2>
        <p>Dear ${leaveRequest.employee.name},</p>
        <p>Your leave request <strong>${leaveRequest.requestId}</strong> has been rejected by your manager.</p>
        <p><strong>Reason provided:</strong> "${comment.trim()}"</p>
      </div>
    `,
  });

  res.status(200).json({
    success: true,
    message: 'Leave request rejected successfully.',
  });
});

// ==========================================
// HR TIER 2 APPROVALS
// ==========================================

export const getHrLeaves = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, status, leaveTypeId, search, startDate, endDate } = req.query;

  const requests = await prisma.leaveRequest.findMany({
    where: {
      ...(departmentId ? { employee: { departmentId: departmentId as string } } : {}),
      ...(status ? { status: status as LeaveStatus } : {}),
      ...(leaveTypeId ? { leaveTypeId: leaveTypeId as string } : {}),
      ...(startDate && endDate
        ? {
            startDate: { gte: new Date(startDate as string) },
            endDate: { lte: new Date(endDate as string) },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { requestId: { contains: search as string } },
              { employee: { name: { contains: search as string } } },
              { employee: { employeeId: { contains: search as string } } },
              { reason: { contains: search as string } },
              { comments: { some: { body: { contains: search as string } } } },
            ],
          }
        : {}),
    },
    include: {
      leaveType: true,
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          designation: true,
          department: { select: { id: true, code: true, name: true } },
          manager: { select: { name: true } },
        },
      },
      approvals: {
        include: { approver: { select: { name: true, role: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

export const hrApprove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;
  const hrId = req.user!.id;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { include: { manager: true } }, leaveType: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  // Concurrency check: must be PENDING_HR, PENDING_MANAGER, or ESCALATED
  if (
    leaveRequest.status !== LeaveStatus.PENDING_HR &&
    leaveRequest.status !== LeaveStatus.PENDING_MANAGER &&
    leaveRequest.status !== LeaveStatus.ESCALATED
  ) {
    throw new AppError(
      `This leave request cannot receive HR final approval in status '${leaveRequest.status}'.`,
      409,
      'ALREADY_PROCESSED'
    );
  }

  const previousStatus = leaveRequest.status as LeaveStatus;

  // ATOMIC DATABASE TRANSACTION (Section 42)
  const updatedRequest = await prisma.$transaction(async (tx) => {
    // 1. Create Approval Record for HR
    await tx.approval.create({
      data: {
        leaveRequestId: id,
        approverId: hrId,
        tier: Role.HR,
        decision: LeaveStatus.APPROVED,
        comment: comment || 'Final HR Approval Granted',
      },
    });

    // 2. Update Request Status to APPROVED (Terminal)
    const resReq = await tx.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.APPROVED },
    });

    // 3. Finalize Leave Balance Deduction
    await finalizeApprovedDays(
      leaveRequest.employeeId,
      leaveRequest.leaveTypeId,
      leaveRequest.daysCount,
      leaveRequest.startDate.getFullYear(),
      tx
    );

    return resReq;
  });

  // 4. Log Audit
  await logAudit({
    leaveRequestId: id,
    actorId: hrId,
    actorRole: Role.HR,
    action: AuditAction.HR_APPROVED,
    previousStatus,
    newStatus: LeaveStatus.APPROVED,
    metadata: { comment: comment || 'Final HR approval granted' },
  });

  // 5. Notify Employee and Manager via in-app & Email
  const formattedStart = new Date(leaveRequest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedEnd = new Date(leaveRequest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // A. Notify Employee via Email & In-App
  await createNotification({
    recipientId: leaveRequest.employeeId,
    title: 'Leave Request Approved! 🎉',
    message: `Your leave request ${leaveRequest.requestId} (${leaveRequest.daysCount} days) has received final approval from HR.`,
    type: 'SUCCESS',
    link: `/employee/leaves/${id}`,
    emailSubject: `[ELAP] Final Approval: Leave Request ${leaveRequest.requestId} Approved 🎉`,
    emailHtml: generateLeaveApprovedEmployeeEmail({
      employeeName: leaveRequest.employee.name,
      requestId: leaveRequest.requestId,
      leaveTypeName: leaveRequest.leaveType.name,
      startDate: formattedStart,
      endDate: formattedEnd,
      daysCount: leaveRequest.daysCount,
      remarks: comment || undefined,
      actionUrl: `${config.clientUrl}/employee/leaves/${id}`,
    }),
  });

  // B. Notify Manager via Email & In-App
  if (leaveRequest.employee.managerId) {
    const managerName = leaveRequest.employee.manager?.name || 'Manager';
    await createNotification({
      recipientId: leaveRequest.employee.managerId,
      title: 'Leave Request Approved by HR',
      message: `Leave request ${leaveRequest.requestId} for ${leaveRequest.employee.name} (${leaveRequest.daysCount} days) has received final approval from HR.`,
      type: 'SUCCESS',
      link: `/manager/leaves/${id}`,
      emailSubject: `[ELAP Team Notification] Leave Approved: ${leaveRequest.employee.name} (${leaveRequest.requestId})`,
      emailHtml: generateLeaveApprovedManagerEmail({
        managerName,
        employeeName: leaveRequest.employee.name,
        requestId: leaveRequest.requestId,
        leaveTypeName: leaveRequest.leaveType.name,
        startDate: formattedStart,
        endDate: formattedEnd,
        daysCount: leaveRequest.daysCount,
        remarks: comment || undefined,
        actionUrl: `${config.clientUrl}/manager/leaves/${id}`,
      }),
    });
  }

  res.status(200).json({
    success: true,
    message: 'Leave request approved and balance finalized.',
    data: updatedRequest,
  });
});

export const hrReject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment } = req.body;
  const hrId = req.user!.id;

  // BR-04: Mandatory rejection comment
  if (!comment || comment.trim().length === 0) {
    throw new AppError('Rejection comment is mandatory when rejecting a leave request.', 400, 'MISSING_REJECTION_COMMENT');
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: true, leaveType: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  if (
    leaveRequest.status !== LeaveStatus.PENDING_HR &&
    leaveRequest.status !== LeaveStatus.PENDING_MANAGER &&
    leaveRequest.status !== LeaveStatus.ESCALATED
  ) {
    throw new AppError(
      `This leave request cannot be rejected in its current status ('${leaveRequest.status}').`,
      409,
      'ALREADY_PROCESSED'
    );
  }

  const previousStatus = leaveRequest.status as LeaveStatus;

  await prisma.$transaction(async (tx) => {
    // 1. Create Approval Record for HR
    await tx.approval.create({
      data: {
        leaveRequestId: id,
        approverId: hrId,
        tier: Role.HR,
        decision: LeaveStatus.REJECTED_BY_HR,
        comment: comment.trim(),
      },
    });

    // 2. Update Status to REJECTED_BY_HR (Terminal)
    await tx.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.REJECTED_BY_HR },
    });

    // 3. Release pending balance
    await releasePendingDaysOnRejectionOrCancel(
      leaveRequest.employeeId,
      leaveRequest.leaveTypeId,
      leaveRequest.daysCount,
      leaveRequest.startDate.getFullYear(),
      tx
    );
  });

  // 4. Log Audit
  await logAudit({
    leaveRequestId: id,
    actorId: hrId,
    actorRole: Role.HR,
    action: AuditAction.HR_REJECTED,
    previousStatus,
    newStatus: LeaveStatus.REJECTED_BY_HR,
    metadata: { rejectionComment: comment.trim() },
  });

  // 5. Notify Employee & Manager
  await createNotification({
    recipientId: leaveRequest.employeeId,
    title: 'Leave Request Rejected by HR',
    message: `Your leave request ${leaveRequest.requestId} was rejected by HR. Reason: "${comment.trim()}"`,
    type: 'DANGER',
    link: `/employee/leaves/${id}`,
  });

  if (leaveRequest.employee.managerId) {
    await createNotification({
      recipientId: leaveRequest.employee.managerId,
      title: 'Leave Request Rejected by HR',
      message: `Leave request ${leaveRequest.requestId} for ${leaveRequest.employee.name} was rejected by HR.`,
      type: 'WARNING',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Leave request rejected by HR.',
  });
});
