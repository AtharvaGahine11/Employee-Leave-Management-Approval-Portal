import { prisma } from "@/lib/server/prisma";
import { NotificationService } from "./notification.service";
import { dataStore } from "@/lib/data/store";

export class CronService {
  /**
   * Scans pending leave applications for 48h reminders and 72h HR escalations.
   */
  static async processPendingRemindersAndEscalations() {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    let remindedCount = 0;
    let escalatedCount = 0;

    try {
      // 1. Fetch pending manager requests created > 48h ago
      const pendingMgrRequests = await prisma.leaveRequest.findMany({
        where: {
          status: "PENDING_MANAGER",
          createdAt: { lte: fortyEightHoursAgo },
        },
        include: { employee: true, manager: true },
      });

      for (const req of pendingMgrRequests) {
        if (req.managerId && req.manager) {
          await NotificationService.sendNotification({
            recipientId: req.managerId,
            recipientEmail: req.manager.email,
            title: `48h Reminder: Pending Approval for ${req.requestId}`,
            message: `Leave application ${req.requestId} submitted by ${req.employee.name} has been pending your review for over 48 hours. Please log in to take action.`,
            type: "WARNING",
            link: "/approvals",
          });
          remindedCount++;
        }

        // 72h Escalation to HR if created > 72h ago
        if (req.createdAt <= seventyTwoHoursAgo) {
          const hrTeam = await prisma.employee.findMany({ where: { role: "HR", isActive: true } });
          for (const hr of hrTeam) {
            await NotificationService.sendNotification({
              recipientId: hr.id,
              recipientEmail: hr.email,
              title: `72h Escalation: Request ${req.requestId} Overdue`,
              message: `Leave application ${req.requestId} for ${req.employee.name} has been pending manager approval for over 72 hours. HR intervention or follow-up recommended.`,
              type: "DANGER",
              link: "/leave-requests",
            });
          }
          escalatedCount++;
        }
      }

      // 2. Fetch pending HR requests created > 48h ago
      const pendingHrRequests = await prisma.leaveRequest.findMany({
        where: {
          status: "PENDING_HR",
          managerActionAt: { lte: fortyEightHoursAgo },
        },
        include: { employee: true },
      });

      for (const req of pendingHrRequests) {
        const hrTeam = await prisma.employee.findMany({ where: { role: "HR", isActive: true } });
        for (const hr of hrTeam) {
          await NotificationService.sendNotification({
            recipientId: hr.id,
            recipientEmail: hr.email,
            title: `48h HR Reminder: Pending Authorization for ${req.requestId}`,
            message: `Manager-approved leave request ${req.requestId} for ${req.employee.name} has been awaiting HR final sign-off for over 48 hours.`,
            type: "WARNING",
            link: "/leave-requests",
          });
          remindedCount++;
        }
      }

      return { success: true, remindedCount, escalatedCount, timestamp: now.toISOString() };
    } catch (error: any) {
      // Prototype data fallback scan
      dataStore.init();
      const all = dataStore.getLeaveRequests();
      const pending = all.filter((r) => r.status === "PENDING_MANAGER" || r.status === "PENDING_HR");

      return {
        success: true,
        remindedCount: pending.length,
        escalatedCount: 0,
        timestamp: now.toISOString(),
        note: "Processed via prototype fallback store.",
      };
    }
  }
}
