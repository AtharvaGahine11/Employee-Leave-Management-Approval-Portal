import { prisma } from "@/lib/server/prisma";
import { LeaveType } from "@prisma/client";

export class BalanceService {
  /**
   * Fetches leave balances for an employee, calculating available quota.
   */
  static async getEmployeeBalances(employeeId: string, year = 2026) {
    try {
      const balances = await prisma.leaveBalance.findMany({
        where: { employeeId, year },
      });

      // Ensure default records exist for CL, SL, EL
      const result: Record<LeaveType, { annualQuota: number; usedDays: number; pendingDays: number; availableDays: number }> = {
        CASUAL_LEAVE: { annualQuota: 12, usedDays: 0, pendingDays: 0, availableDays: 12 },
        SICK_LEAVE: { annualQuota: 12, usedDays: 0, pendingDays: 0, availableDays: 12 },
        EARNED_LEAVE: { annualQuota: 15, usedDays: 0, pendingDays: 0, availableDays: 15 },
      };

      for (const b of balances) {
        const available = b.annualQuota - b.usedDays - b.pendingDays;
        result[b.leaveType] = {
          annualQuota: b.annualQuota,
          usedDays: b.usedDays,
          pendingDays: b.pendingDays,
          availableDays: Math.max(0, available),
        };
      }

      return result;
    } catch (error) {
      console.error("Balance calculation error:", error);
      // Fallback default quotas
      return {
        CASUAL_LEAVE: { annualQuota: 12, usedDays: 0, pendingDays: 0, availableDays: 12 },
        SICK_LEAVE: { annualQuota: 12, usedDays: 0, pendingDays: 0, availableDays: 12 },
        EARNED_LEAVE: { annualQuota: 15, usedDays: 0, pendingDays: 0, availableDays: 15 },
      };
    }
  }

  /**
   * Reserves pending days when a new leave application is submitted.
   */
  static async reservePendingBalance(tx: any, employeeId: string, leaveType: LeaveType, days: number, year = 2026) {
    const existing = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: { employeeId, leaveType, year },
      },
    });

    if (!existing) {
      const quota = leaveType === "EARNED_LEAVE" ? 15 : 12;
      if (quota < days) throw new Error(`Insufficient ${leaveType} balance available.`);

      return await tx.leaveBalance.create({
        data: {
          employeeId,
          leaveType,
          year,
          annualQuota: quota,
          usedDays: 0,
          pendingDays: days,
        },
      });
    }

    const available = existing.annualQuota - existing.usedDays - existing.pendingDays;
    if (available < days) {
      throw new Error(`Insufficient ${leaveType} balance. Requested: ${days} days, Available: ${available} days.`);
    }

    return await tx.leaveBalance.update({
      where: { id: existing.id },
      data: {
        pendingDays: { increment: days },
      },
    });
  }

  /**
   * Releases reserved pending balance when a request is rejected or cancelled.
   */
  static async releasePendingBalance(tx: any, employeeId: string, leaveType: LeaveType, days: number, year = 2026) {
    const existing = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: { employeeId, leaveType, year },
      },
    });

    if (!existing) return;

    const newPending = Math.max(0, existing.pendingDays - days);
    return await tx.leaveBalance.update({
      where: { id: existing.id },
      data: { pendingDays: newPending },
    });
  }

  /**
   * Finalizes quota deduction on HR approval: decrements pendingDays and increments usedDays.
   */
  static async finalizeHrApprovalDeduction(tx: any, employeeId: string, leaveType: LeaveType, days: number, year = 2026) {
    const existing = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: { employeeId, leaveType, year },
      },
    });

    if (!existing) {
      const quota = leaveType === "EARNED_LEAVE" ? 15 : 12;
      return await tx.leaveBalance.create({
        data: {
          employeeId,
          leaveType,
          year,
          annualQuota: quota,
          usedDays: days,
          pendingDays: 0,
        },
      });
    }

    const newPending = Math.max(0, existing.pendingDays - days);
    return await tx.leaveBalance.update({
      where: { id: existing.id },
      data: {
        pendingDays: newPending,
        usedDays: { increment: days },
      },
    });
  }
}
