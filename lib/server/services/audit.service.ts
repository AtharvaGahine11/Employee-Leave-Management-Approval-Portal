import { prisma } from "@/lib/server/prisma";
import { AuditAction, LeaveStatus } from "@prisma/client";

export interface CreateAuditParams {
  leaveRequestId?: string;
  actorId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  previousStatus?: LeaveStatus | null;
  newStatus?: LeaveStatus | null;
  remarks?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async logAction(params: CreateAuditParams) {
    try {
      return await prisma.leaveAuditLog.create({
        data: {
          leaveRequestId: params.leaveRequestId || null,
          actorId: params.actorId,
          action: params.action,
          entityType: params.entityType || "LeaveRequest",
          entityId: params.entityId || params.leaveRequestId || null,
          previousStatus: params.previousStatus || null,
          newStatus: params.newStatus || null,
          remarks: params.remarks || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });
    } catch (error) {
      console.error("Audit log error:", error);
      // Ensure audit failures do not break the main transaction logging
      return null;
    }
  }

  static async getAuditTrail(leaveRequestId?: string, limit = 100) {
    try {
      return await prisma.leaveAuditLog.findMany({
        where: leaveRequestId ? { leaveRequestId } : undefined,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              employeeId: true,
              role: true,
              department: { select: { name: true } },
            },
          },
          leaveRequest: {
            select: {
              requestId: true,
              leaveType: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
    } catch (error) {
      console.error("Failed to fetch audit trail:", error);
      return [];
    }
  }
}
