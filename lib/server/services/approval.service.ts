import { prisma } from "@/lib/server/prisma";
import { LeaveStatus, AuditAction } from "@prisma/client";
import { BalanceService } from "./balance.service";
import { NotificationService } from "./notification.service";
import { dataStore } from "@/lib/data/store";

export interface ReviewParams {
  requestId: string;
  actorId: string;
  actorName: string;
  approved: boolean;
  remarks?: string;
}

export class ApprovalService {
  /**
   * Manager Review Tier 1
   */
  static async managerReview(params: ReviewParams) {
    if (!params.approved && (!params.remarks || !params.remarks.trim())) {
      throw new Error("Mandatory rejection comment is required for manager rejection.");
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const req = await tx.leaveRequest.findUnique({
          where: { id: params.requestId },
          include: { employee: true },
        });

        if (!req) throw new Error("Leave request not found.");

        if (req.status !== LeaveStatus.PENDING_MANAGER) {
          throw new Error(`Request is in '${req.status}' state and cannot undergo manager review.`);
        }

        if (params.approved) {
          // Approve & move to PENDING_HR
          const updated = await tx.leaveRequest.update({
            where: { id: req.id },
            data: {
              status: LeaveStatus.PENDING_HR,
              managerId: params.actorId,
              managerActionAt: new Date(),
              managerRemarks: params.remarks || "Manager endorsement granted.",
            },
          });

          await tx.leaveAuditLog.create({
            data: {
              leaveRequestId: req.id,
              actorId: params.actorId,
              action: AuditAction.MANAGER_APPROVED,
              previousStatus: LeaveStatus.PENDING_MANAGER,
              newStatus: LeaveStatus.PENDING_HR,
              remarks: params.remarks || "Manager endorsement granted.",
            },
          });

          return updated;
        } else {
          // Reject & release reserved quota
          await BalanceService.releasePendingBalance(tx, req.employeeId, req.leaveType, req.totalDays);

          const updated = await tx.leaveRequest.update({
            where: { id: req.id },
            data: {
              status: LeaveStatus.REJECTED_BY_MANAGER,
              managerId: params.actorId,
              managerActionAt: new Date(),
              managerRemarks: params.remarks?.trim(),
            },
          });

          await tx.leaveAuditLog.create({
            data: {
              leaveRequestId: req.id,
              actorId: params.actorId,
              action: AuditAction.MANAGER_REJECTED,
              previousStatus: LeaveStatus.PENDING_MANAGER,
              newStatus: LeaveStatus.REJECTED_BY_MANAGER,
              remarks: params.remarks?.trim(),
            },
          });

          return updated;
        }
      });

      // Notifications
      if (params.approved) {
        // Notify HR group
        const hrUsers = await prisma.employee.findMany({ where: { role: "HR", isActive: true } });
        for (const hr of hrUsers) {
          NotificationService.sendNotification({
            recipientId: hr.id,
            recipientEmail: hr.email,
            title: `Pending HR Sign-off: ${result.requestId}`,
            message: `Manager ${params.actorName} endorsed leave request for ${result.requestId}. Pending your final HR sign-off.`,
            link: "/leave-requests",
          });
        }
      } else {
        // Notify Applicant of Manager Rejection
        NotificationService.sendNotification({
          recipientId: result.employeeId,
          title: `Leave Request Rejected: ${result.requestId}`,
          message: `Your manager ${params.actorName} declined your request. Reason: "${params.remarks}"`,
          type: "DANGER",
          link: "/leave/history",
        });
      }

      return result;
    } catch (error: any) {
      // Prototype Store Fallback
      const res = dataStore.managerReview({
        requestId: params.requestId,
        managerId: params.actorId,
        managerName: params.actorName,
        approved: params.approved,
        remarks: params.remarks || "",
      });
      if (res.success) return dataStore.getLeaveRequests().find((r) => r.id === params.requestId);
      throw new Error(error.message || res.error || "Manager review failed");
    }
  }

  /**
   * HR Review Tier 2 (Final Authorization & Balance Deduction)
   */
  static async hrReview(params: ReviewParams) {
    if (!params.approved && (!params.remarks || !params.remarks.trim())) {
      throw new Error("Mandatory rejection comment is required for HR rejection.");
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const req = await tx.leaveRequest.findUnique({
          where: { id: params.requestId },
          include: { employee: true },
        });

        if (!req) throw new Error("Leave request not found.");

        if (req.status !== LeaveStatus.PENDING_HR) {
          throw new Error(`Request is in '${req.status}' state and cannot undergo HR review.`);
        }

        if (params.approved) {
          // Final HR approval: Permanently deduct leave balance
          await BalanceService.finalizeHrApprovalDeduction(tx, req.employeeId, req.leaveType, req.totalDays);

          const updated = await tx.leaveRequest.update({
            where: { id: req.id },
            data: {
              status: LeaveStatus.APPROVED,
              hrId: params.actorId,
              hrActionAt: new Date(),
              hrRemarks: params.remarks || "Final HR authorization granted.",
            },
          });

          await tx.leaveAuditLog.create({
            data: {
              leaveRequestId: req.id,
              actorId: params.actorId,
              action: AuditAction.HR_APPROVED,
              previousStatus: LeaveStatus.PENDING_HR,
              newStatus: LeaveStatus.APPROVED,
              remarks: params.remarks || "Final HR authorization granted. Quota updated.",
            },
          });

          return updated;
        } else {
          // HR Reject: Release pending reserved balance
          await BalanceService.releasePendingBalance(tx, req.employeeId, req.leaveType, req.totalDays);

          const updated = await tx.leaveRequest.update({
            where: { id: req.id },
            data: {
              status: LeaveStatus.REJECTED_BY_HR,
              hrId: params.actorId,
              hrActionAt: new Date(),
              hrRemarks: params.remarks?.trim(),
            },
          });

          await tx.leaveAuditLog.create({
            data: {
              leaveRequestId: req.id,
              actorId: params.actorId,
              action: AuditAction.HR_REJECTED,
              previousStatus: LeaveStatus.PENDING_HR,
              newStatus: LeaveStatus.REJECTED_BY_HR,
              remarks: params.remarks?.trim(),
            },
          });

          return updated;
        }
      });

      // Notify Applicant of Final HR Decision
      NotificationService.sendNotification({
        recipientId: result.employeeId,
        title: params.approved ? `Leave Request APPROVED: ${result.requestId}` : `Leave Request REJECTED by HR: ${result.requestId}`,
        message: params.approved
          ? `Your leave request ${result.requestId} has received final HR authorization.`
          : `HR declined your request. Reason: "${params.remarks}"`,
        type: params.approved ? "SUCCESS" : "DANGER",
        link: "/leave/history",
      });

      return result;
    } catch (error: any) {
      // Prototype Store Fallback
      const res = dataStore.hrReview({
        requestId: params.requestId,
        hrId: params.actorId,
        hrName: params.actorName,
        approved: params.approved,
        remarks: params.remarks || "",
      });
      if (res.success) return dataStore.getLeaveRequests().find((r) => r.id === params.requestId);
      throw new Error(error.message || res.error || "Review failed");
    }
  }
}
