import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../middleware/errorHandler.js';
import { LeaveStatus, AuditAction, Role } from '../../types/enums.js';
import { validateLeaveRequest } from './leaveValidation.js';
import { updatePendingDays, releasePendingDaysOnRejectionOrCancel, getEmployeeLeaveBalances } from '../balances/balanceService.js';
import { logAudit } from '../audit/auditService.js';
import { createNotification } from '../notifications/notificationService.js';

export const createLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.id;
  const { leaveTypeId, startDate, endDate, reason, isDraft } = req.body;

  // Validate server-side
  const { start, end, daysCount, leaveType } = await validateLeaveRequest({
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    reason,
  });

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { manager: true, department: true },
  });

  if (!employee) {
    throw new AppError('Employee profile not found.', 404, 'PROFILE_NOT_FOUND');
  }

  // Generate unique Request ID (LR-YYYY-XXX)
  const count = await prisma.leaveRequest.count();
  const requestId = `LR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

  const status = isDraft ? LeaveStatus.DRAFT : LeaveStatus.PENDING_MANAGER;

  // Execute in database transaction
  const leaveRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.leaveRequest.create({
      data: {
        requestId,
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        daysCount,
        reason,
        status,
        submittedAt: isDraft ? null : new Date(),
      },
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!isDraft) {
      // Update pending balance
      await updatePendingDays(employeeId, leaveTypeId, daysCount, start.getFullYear(), tx);
    }

    return created;
  });

  // Log Audit
  await logAudit({
    leaveRequestId: leaveRequest.id,
    actorId: employeeId,
    actorRole: req.user!.role,
    action: isDraft ? AuditAction.LEAVE_CREATED : AuditAction.LEAVE_SUBMITTED,
    previousStatus: isDraft ? null : LeaveStatus.DRAFT,
    newStatus: status,
    metadata: { requestId: leaveRequest.requestId, daysCount, leaveTypeCode: leaveType.code },
  });

  // Send Notification if submitted
  if (!isDraft && employee.managerId) {
    await createNotification({
      recipientId: employee.managerId,
      title: 'New Leave Request Pending Review',
      message: `${employee.name} (${employee.department.name}) submitted a ${leaveType.name} request for ${daysCount} days (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}).`,
      type: 'INFO',
      link: `/manager/approvals`,
      emailSubject: `[ELAP] Action Required: Leave Request ${leaveRequest.requestId} from ${employee.name}`,
      emailHtml: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Leave Request Pending Your Approval</h2>
          <p>Hi ${employee.manager?.name || 'Manager'},</p>
          <p><strong>${employee.name}</strong> has submitted a new leave request in ELAP:</p>
          <ul>
            <li><strong>Request ID:</strong> ${leaveRequest.requestId}</li>
            <li><strong>Leave Type:</strong> ${leaveType.name}</li>
            <li><strong>Dates:</strong> ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]} (${daysCount} days)</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>
          <p>Please log in to the portal to review and approve or reject this request.</p>
        </div>
      `,
    });
  }

  res.status(201).json({
    success: true,
    data: leaveRequest,
  });
});

export const getEmployeeLeaves = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.id;
  const { status, leaveTypeId, search } = req.query;

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      ...(status ? { status: status as LeaveStatus } : {}),
      ...(leaveTypeId ? { leaveTypeId: leaveTypeId as string } : {}),
      ...(search
        ? {
            OR: [
              { requestId: { contains: search as string } },
              { reason: { contains: search as string } },
            ],
          }
        : {}),
    },
    include: {
      leaveType: true,
      approvals: {
        include: {
          approver: { select: { id: true, name: true, role: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: leaves,
  });
});

export const getLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = req.user!.id;
  const balances = await getEmployeeLeaveBalances(employeeId);

  res.status(200).json({
    success: true,
    data: balances,
  });
});

export const getLeaveDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      leaveType: true,
      employee: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          designation: true,
          phone: true,
          managerId: true,
          department: true,
          manager: {
            select: { id: true, name: true, email: true, designation: true },
          },
        },
      },
      approvals: {
        include: {
          approver: {
            select: { id: true, name: true, email: true, role: true, designation: true },
          },
        },
        orderBy: { actedAt: 'asc' },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      attachments: true,
      auditLogs: {
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  // Record-level authorization check
  const isApplicant = leaveRequest.employeeId === currentUser.id;
  const isManager = currentUser.role === Role.MANAGER && leaveRequest.employee.managerId === currentUser.id;
  const isHR = currentUser.role === Role.HR;

  if (!isApplicant && !isManager && !isHR) {
    throw new AppError('You are not authorized to view this leave request.', 403, 'FORBIDDEN');
  }

  // Fetch applicant's current balances for context
  const balances = await getEmployeeLeaveBalances(leaveRequest.employeeId);

  res.status(200).json({
    success: true,
    data: {
      leaveRequest,
      balances,
    },
  });
});

export const submitDraftRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const employeeId = req.user!.id;

  const draft = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { leaveType: true, employee: { include: { department: true } } },
  });

  if (!draft || draft.employeeId !== employeeId) {
    throw new AppError('Draft leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  if (draft.status !== LeaveStatus.DRAFT) {
    throw new AppError('Only requests in DRAFT status can be submitted.', 400, 'INVALID_STATUS');
  }

  // Re-validate before submitting
  await validateLeaveRequest({
    employeeId,
    leaveTypeId: draft.leaveTypeId,
    startDate: draft.startDate,
    endDate: draft.endDate,
    reason: draft.reason,
    excludeRequestId: draft.id,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const resReq = await tx.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.PENDING_MANAGER,
        submittedAt: new Date(),
      },
      include: { leaveType: true },
    });

    await updatePendingDays(employeeId, draft.leaveTypeId, draft.daysCount, draft.startDate.getFullYear(), tx);
    return resReq;
  });

  await logAudit({
    leaveRequestId: id,
    actorId: employeeId,
    actorRole: req.user!.role,
    action: AuditAction.LEAVE_SUBMITTED,
    previousStatus: LeaveStatus.DRAFT,
    newStatus: LeaveStatus.PENDING_MANAGER,
  });

  if (draft.employee.managerId) {
    await createNotification({
      recipientId: draft.employee.managerId,
      title: 'New Leave Request Submitted',
      message: `${draft.employee.name} submitted leave request ${draft.requestId} for ${draft.daysCount} days.`,
      type: 'INFO',
      link: `/manager/approvals`,
    });
  }

  res.status(200).json({
    success: true,
    data: updated,
  });
});

export const cancelLeaveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: true, leaveType: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  // Check ownership (only applicant or HR can cancel)
  if (leaveRequest.employeeId !== currentUser.id && currentUser.role !== Role.HR) {
    throw new AppError('You can only cancel your own leave requests.', 403, 'FORBIDDEN');
  }

  // BR-08: Cancellation allowed ONLY BEFORE final HR approval (i.e. not APPROVED, REJECTED, or CANCELLED)
  if (
    leaveRequest.status === LeaveStatus.APPROVED ||
    leaveRequest.status === LeaveStatus.REJECTED_BY_MANAGER ||
    leaveRequest.status === LeaveStatus.REJECTED_BY_HR ||
    leaveRequest.status === LeaveStatus.CANCELLED
  ) {
    throw new AppError(
      `Leave request cannot be cancelled in its current state ('${leaveRequest.status}'). Requests can only be cancelled before final HR approval.`,
      400,
      'CANNOT_CANCEL'
    );
  }

  const previousStatus = leaveRequest.status as LeaveStatus;

  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED },
    });

    // Release pending balance if it affected pending count
    if (previousStatus !== LeaveStatus.DRAFT) {
      await releasePendingDaysOnRejectionOrCancel(
        leaveRequest.employeeId,
        leaveRequest.leaveTypeId,
        leaveRequest.daysCount,
        leaveRequest.startDate.getFullYear(),
        tx
      );
    }
  });

  await logAudit({
    leaveRequestId: id,
    actorId: currentUser.id,
    actorRole: currentUser.role,
    action: AuditAction.LEAVE_CANCELLED,
    previousStatus,
    newStatus: LeaveStatus.CANCELLED,
  });

  // Notify manager if assigned
  if (leaveRequest.employee.managerId) {
    await createNotification({
      recipientId: leaveRequest.employee.managerId,
      title: 'Leave Request Cancelled',
      message: `${leaveRequest.employee.name} cancelled leave request ${leaveRequest.requestId}.`,
      type: 'WARNING',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Leave request cancelled successfully.',
  });
});
