import { prisma } from '../../config/prisma.js';
import { LeaveStatus, AuditAction, Role } from '../../types/enums.js';
import { logAudit } from '../audit/auditService.js';
import { createNotification, createRoleNotification } from '../notifications/notificationService.js';
import { logger } from '../../utils/logger.js';

export const runInactionCheckJob = async () => {
  logger.info('⏰ Running SLA Inaction Check (48h Reminder & 72h Escalation)...');
  const now = new Date();

  // 1. Find all PENDING_MANAGER requests
  const pendingRequests = await prisma.leaveRequest.findMany({
    where: { status: LeaveStatus.PENDING_MANAGER },
    include: {
      employee: {
        include: {
          manager: true,
          department: true,
        },
      },
      auditLogs: true,
    },
  });

  let reminderCount = 0;
  let escalationCount = 0;
  const actions: Array<{ requestId: string; employeeName: string; type: 'REMINDER' | 'ESCALATION'; hoursElapsed: number }> = [];

  for (const req of pendingRequests) {
    const submittedTime = req.submittedAt ? req.submittedAt.getTime() : req.createdAt.getTime();
    const hoursElapsed = Math.round(((now.getTime() - submittedTime) / (1000 * 60 * 60)) * 10) / 10;

    // 72 HOURS: ESCALATE TO HR
    if (hoursElapsed >= 72) {
      // Check if already escalated
      if (req.status !== LeaveStatus.ESCALATED) {
        await prisma.leaveRequest.update({
          where: { id: req.id },
          data: { status: LeaveStatus.ESCALATED },
        });

        await logAudit({
          leaveRequestId: req.id,
          actorId: req.employee.id,
          actorRole: Role.EMPLOYEE,
          action: AuditAction.ESCALATED,
          previousStatus: LeaveStatus.PENDING_MANAGER,
          newStatus: LeaveStatus.ESCALATED,
          metadata: { hoursElapsed, reason: 'Automated 72h manager inaction escalation' },
        });

        // Notify HR and Manager
        await createRoleNotification(
          'HR',
          'Leave Request Escalated!',
          `Leave request ${req.requestId} for ${req.employee.name} has been escalated to HR due to 72 hours of manager inaction.`,
          `/hr/leaves/${req.id}`
        );

        if (req.employee.managerId) {
          await createNotification({
            recipientId: req.employee.managerId,
            title: 'Leave Request Escalated to HR',
            message: `Leave request ${req.requestId} for ${req.employee.name} was escalated to HR due to inaction exceeding 72 hours.`,
            type: 'DANGER',
          });
        }

        escalationCount++;
        actions.push({
          requestId: req.requestId,
          employeeName: req.employee.name,
          type: 'ESCALATION',
          hoursElapsed,
        });
      }
    }
    // 48 HOURS: SEND MANAGER REMINDER
    else if (hoursElapsed >= 48) {
      // Prevent duplicate reminders within last 24h
      const hasRecentReminder = req.auditLogs.some(
        (log) =>
          log.action === AuditAction.REMINDER_SENT &&
          log.timestamp.getTime() > now.getTime() - 1000 * 60 * 60 * 24
      );

      if (!hasRecentReminder && req.employee.managerId) {
        await createNotification({
          recipientId: req.employee.managerId,
          title: 'Reminder: Pending Leave Approval',
          message: `Leave request ${req.requestId} from ${req.employee.name} has been pending for over 48 hours. Please review.`,
          type: 'WARNING',
          link: `/manager/leaves/${req.id}`,
          emailSubject: `[ELAP Reminder] Action Pending: Leave Request ${req.requestId}`,
          emailHtml: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #f59e0b;">Pending Approval Reminder</h2>
              <p>Hi ${req.employee.manager?.name || 'Manager'},</p>
              <p>This is an automated reminder that leave request <strong>${req.requestId}</strong> from <strong>${req.employee.name}</strong> has been pending your review for over 48 hours.</p>
              <p>If no action is taken within 72 hours, the request will be automatically escalated to HR.</p>
            </div>
          `,
        });

        await logAudit({
          leaveRequestId: req.id,
          actorId: req.employee.managerId,
          actorRole: Role.MANAGER,
          action: AuditAction.REMINDER_SENT,
          metadata: { hoursElapsed },
        });

        reminderCount++;
        actions.push({
          requestId: req.requestId,
          employeeName: req.employee.name,
          type: 'REMINDER',
          hoursElapsed,
        });
      }
    }
  }

  logger.info(`✅ SLA Inaction Check Complete: ${reminderCount} Reminders sent, ${escalationCount} Escalated.`);
  return { reminderCount, escalationCount, actions };
};

/**
 * Demo Helper: Manually age a leave request for live presentations
 */
export const simulateAgingForDemo = async (requestId: string, hours: number) => {
  const agingDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  const updated = await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      submittedAt: agingDate,
      createdAt: agingDate,
    },
  });
  return updated;
};
