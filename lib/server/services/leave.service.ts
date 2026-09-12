import { prisma } from "@/lib/server/prisma";
import { LeaveType, LeaveStatus, AuditAction } from "@prisma/client";
import { BalanceService } from "./balance.service";
import { AuditService } from "./audit.service";
import { NotificationService } from "./notification.service";
import { CreateLeaveInput } from "../validators/leave.schema";
import { calculateWorkingDays } from "@/lib/utils";
import { dataStore } from "@/lib/data/store";

export class LeaveService {
  /**
   * Helper: Check for overlapping active leave requests for an employee.
   */
  static async checkOverlappingLeave(employeeId: string, startDate: Date, endDate: Date, excludeRequestId?: string) {
    try {
      const activeStatuses: LeaveStatus[] = ["PENDING_MANAGER", "PENDING_HR", "APPROVED"];

      const overlapping = await prisma.leaveRequest.findFirst({
        where: {
          employeeId,
          status: { in: activeStatuses },
          id: excludeRequestId ? { not: excludeRequestId } : undefined,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      return !!overlapping;
    } catch (error) {
      // Fallback check against in-memory prototype data if DB is unseeded
      const all = dataStore.getLeaveRequests();
      const s = startDate.toISOString().split("T")[0];
      const e = endDate.toISOString().split("T")[0];

      return all.some((r) => {
        if (r.employeeId !== employeeId) return false;
        if (!["PENDING_MANAGER", "PENDING_HR", "APPROVED"].includes(r.status)) return false;
        return r.startDate <= e && r.endDate >= s;
      });
    }
  }

  /**
   * Submits a new leave request enforcing all corporate business rules.
   */
  static async createLeaveRequest(employeeId: string, input: CreateLeaveInput) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end date.");
    }

    if (start > end) {
      throw new Error("Start date cannot be after end date.");
    }

    // 1. Calculate working days (auto-exclude Saturday & Sunday)
    const totalDays = calculateWorkingDays(input.startDate, input.endDate);
    if (totalDays <= 0) {
      throw new Error("Leave request must cover at least 1 working day (Monday - Friday).");
    }

    // 2. Validate Leave Type Rules
    if (input.leaveType === "CASUAL_LEAVE") {
      if (totalDays > 3) {
        throw new Error("Casual Leave (CL) cannot exceed 3 consecutive days per instance.");
      }
    }

    if (input.leaveType === "SICK_LEAVE") {
      if (totalDays >= 3 && !input.fileUrl) {
        throw new Error("Medical certificate attachment is mandatory for Sick Leave (SL) of 3 or more consecutive days.");
      }
    }

    if (input.leaveType === "EARNED_LEAVE") {
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        throw new Error("Earned Leave (EL) must be requested at least 3 days in advance.");
      }
    }

    // 3. Overlapping Leave Check
    const hasOverlap = await this.checkOverlappingLeave(employeeId, start, end);
    if (hasOverlap) {
      throw new Error("You already have an active leave request (Pending or Approved) overlapping these dates.");
    }

    // 4. Check & Reserve Quota inside atomic transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        const employee = await tx.employee.findUnique({
          where: { id: employeeId },
          include: { manager: true, department: true },
        });

        if (!employee || !employee.isActive) {
          throw new Error("Employee account is inactive or not found.");
        }

        // Reserve balance in LeaveBalance table
        await BalanceService.reservePendingBalance(tx, employeeId, input.leaveType, totalDays);

        // Generate Request ID
        const count = await tx.leaveRequest.count();
        const requestId = `LR-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

        // Create Leave Request record
        const leaveReq = await tx.leaveRequest.create({
          data: {
            requestId,
            employeeId,
            leaveType: input.leaveType,
            startDate: start,
            endDate: end,
            totalDays,
            reason: input.reason,
            status: LeaveStatus.PENDING_MANAGER,
            managerId: employee.managerId || null,
          },
          include: {
            employee: true,
            manager: true,
          },
        });

        // Add attachment if provided
        if (input.fileUrl && input.fileName) {
          await tx.leaveAttachment.create({
            data: {
              leaveRequestId: leaveReq.id,
              uploaderId: employeeId,
              fileUrl: input.fileUrl,
              fileName: input.fileName,
              fileType: input.fileType || "application/pdf",
              fileSize: input.fileSize || 1024,
            },
          });
        }

        // Log Audit Entry
        await tx.leaveAuditLog.create({
          data: {
            leaveRequestId: leaveReq.id,
            actorId: employeeId,
            action: AuditAction.LEAVE_SUBMITTED,
            newStatus: LeaveStatus.PENDING_MANAGER,
            remarks: `Submitted ${input.leaveType} application for ${totalDays} working days.`,
          },
        });

        return leaveReq;
      });

      // Notify Manager after successful commit
      if (result.managerId && result.manager) {
        NotificationService.sendNotification({
          recipientId: result.managerId,
          recipientEmail: result.manager.email,
          title: `New Leave Request: ${result.requestId}`,
          message: `${result.employee.name} submitted a ${input.leaveType} request for ${totalDays} days (${input.startDate} to ${input.endDate}). Pending your manager review.`,
          link: "/approvals",
        });
      }

      return result;
    } catch (error: any) {
      // Fallback for demo store if DB connection fails
      if (error.message && error.message.includes("Can't reach database")) {
        const mockRes = dataStore.createLeaveRequest({
          employeeId,
          leaveType: input.leaveType,
          startDate: input.startDate,
          endDate: input.endDate,
          totalDays,
          reason: input.reason,
        });
        if (mockRes.success && mockRes.request) return mockRes.request;
        throw new Error(mockRes.error || "Submission failed");
      }
      throw error;
    }
  }

  /**
   * Cancels a pending leave request before final HR approval.
   */
  static async cancelLeaveRequest(requestId: string, actorId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const req = await tx.leaveRequest.findUnique({
          where: { id: requestId },
        });

        if (!req) throw new Error("Leave request not found.");

        if (req.employeeId !== actorId) {
          throw new Error("You are not authorized to cancel this leave request.");
        }

        if (req.status === "APPROVED") {
          throw new Error("Approved leave requests cannot be cancelled. Contact HR.");
        }

        if (req.status === "CANCELLED" || req.status.startsWith("REJECTED")) {
          throw new Error("This request has already been finalized.");
        }

        // Release reserved pending balance
        await BalanceService.releasePendingBalance(tx, req.employeeId, req.leaveType, req.totalDays);

        // Update status to CANCELLED
        const updated = await tx.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: LeaveStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });

        // Audit Log
        await tx.leaveAuditLog.create({
          data: {
            leaveRequestId: req.id,
            actorId,
            action: AuditAction.LEAVE_CANCELLED,
            previousStatus: req.status,
            newStatus: LeaveStatus.CANCELLED,
            remarks: "Leave request cancelled by employee.",
          },
        });

        return updated;
      });
    } catch (error: any) {
      // Prototype fallback
      const mockRes = dataStore.cancelLeaveRequest({ requestId, employeeId: actorId, employeeName: "Employee" });
      if (mockRes.success) return dataStore.getLeaveRequests().find((r) => r.id === requestId);
      throw new Error(error.message || mockRes.error || "Cancellation failed");
    }
  }
}
