import { prisma } from '../../config/prisma.js';
import { AuditAction, LeaveStatus, Role } from '../../types/enums.js';
import { logger } from '../../utils/logger.js';

export interface LogAuditOptions {
  leaveRequestId?: string;
  actorId: string;
  actorRole: Role;
  action: AuditAction;
  previousStatus?: LeaveStatus | null;
  newStatus?: LeaveStatus | null;
  metadata?: Record<string, any>;
}

export const logAudit = async (options: LogAuditOptions) => {
  try {
    const auditRecord = await prisma.auditLog.create({
      data: {
        leaveRequestId: options.leaveRequestId || null,
        actorId: options.actorId,
        actorRole: options.actorRole,
        action: options.action,
        previousStatus: options.previousStatus || null,
        newStatus: options.newStatus || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            role: true,
          },
        },
      },
    });

    logger.info(`📝 Audit logged: ${options.action} by ${options.actorRole} (Actor: ${options.actorId})`);
    return auditRecord;
  } catch (error) {
    logger.error('Failed to write audit log:', error);
    // Audit failures should not silently fail critical logic, but log errors
  }
};

export const getAuditLogsForRequest = async (leaveRequestId: string) => {
  return prisma.auditLog.findMany({
    where: { leaveRequestId },
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
    },
    orderBy: { timestamp: 'desc' },
  });
};

export interface AuditFilterOptions {
  limit?: number;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getAllAuditLogs = async (options: AuditFilterOptions = {}) => {
  const { limit = 100, action, search, startDate, endDate } = options;

  const dateFilter =
    startDate && endDate
      ? {
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }
      : {};

  const searchFilter = search
    ? {
        OR: [
          { actor: { name: { contains: search } } },
          { actor: { employeeId: { contains: search } } },
          { leaveRequest: { requestId: { contains: search } } },
          { metadata: { contains: search } },
        ],
      }
    : {};

  return prisma.auditLog.findMany({
    where: {
      ...(action && action !== 'ALL' ? { action } : {}),
      ...dateFilter,
      ...searchFilter,
    },
    take: limit,
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
          leaveType: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: { timestamp: 'desc' },
  });
};
