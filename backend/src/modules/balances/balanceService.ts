import { prisma } from '../../config/prisma.js';
import { LeaveStatus } from '../../types/enums.js';
import { AppError } from '../../middleware/errorHandler.js';

export const getEmployeeLeaveBalances = async (employeeId: string, year = new Date().getFullYear()) => {
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: {
      leaveType: true,
    },
  });

  return balances.map((b) => ({
    id: b.id,
    leaveTypeId: b.leaveTypeId,
    code: b.leaveType.code,
    name: b.leaveType.name,
    year: b.year,
    openingBalance: b.openingBalance,
    approvedDays: b.approvedDays,
    pendingDays: b.pendingDays,
    availableDays: b.openingBalance - (b.approvedDays + b.pendingDays),
    maxConsecutive: b.leaveType.maxConsecutive,
    carryForward: b.leaveType.carryForward,
    encashment: b.leaveType.encashment,
    minNoticeDays: b.leaveType.minNoticeDays,
  }));
};

export const verifyAvailableBalance = async (
  employeeId: string,
  leaveTypeId: string,
  requestedDays: number,
  year = new Date().getFullYear()
) => {
  const balance = await prisma.leaveBalance.findFirst({
    where: { employeeId, leaveTypeId, year },
    include: { leaveType: true },
  });

  if (!balance) {
    throw new AppError('Leave balance record not found for this leave type and year.', 404, 'BALANCE_NOT_FOUND');
  }

  const available = balance.openingBalance - (balance.approvedDays + balance.pendingDays);

  if (requestedDays > available) {
    throw new AppError(
      `Insufficient leave balance for ${balance.leaveType.name}. Requested: ${requestedDays} days, Available: ${available} days.`,
      422,
      'INSUFFICIENT_BALANCE'
    );
  }

  return { balance, available };
};

export const updatePendingDays = async (
  employeeId: string,
  leaveTypeId: string,
  daysDelta: number,
  year = new Date().getFullYear(),
  tx: any = prisma
) => {
  const current = await tx.leaveBalance.findFirst({
    where: { employeeId, leaveTypeId, year },
  });

  if (!current) return;

  const newPending = Math.max(0, current.pendingDays + daysDelta);
  const newAvailable = Math.max(0, current.openingBalance - (current.approvedDays + newPending));

  await tx.leaveBalance.update({
    where: { id: current.id },
    data: {
      pendingDays: newPending,
      availableDays: newAvailable,
    },
  });
};

export const finalizeApprovedDays = async (
  employeeId: string,
  leaveTypeId: string,
  approvedDaysCount: number,
  year = new Date().getFullYear(),
  tx: any = prisma
) => {
  const current = await tx.leaveBalance.findFirst({
    where: { employeeId, leaveTypeId, year },
  });

  if (!current) {
    throw new AppError('Leave balance record not found for finalization.', 404, 'BALANCE_NOT_FOUND');
  }

  // Deduct from pendingDays, add to approvedDays
  const newPending = Math.max(0, current.pendingDays - approvedDaysCount);
  const newApproved = current.approvedDays + approvedDaysCount;
  const newAvailable = Math.max(0, current.openingBalance - (newApproved + newPending));

  await tx.leaveBalance.update({
    where: { id: current.id },
    data: {
      pendingDays: newPending,
      approvedDays: newApproved,
      availableDays: newAvailable,
    },
  });
};

export const releasePendingDaysOnRejectionOrCancel = async (
  employeeId: string,
  leaveTypeId: string,
  daysCount: number,
  year = new Date().getFullYear(),
  tx: any = prisma
) => {
  const current = await tx.leaveBalance.findFirst({
    where: { employeeId, leaveTypeId, year },
  });

  if (!current) return;

  const newPending = Math.max(0, current.pendingDays - daysCount);
  const newAvailable = Math.max(0, current.openingBalance - (current.approvedDays + newPending));

  await tx.leaveBalance.update({
    where: { id: current.id },
    data: {
      pendingDays: newPending,
      availableDays: newAvailable,
    },
  });
};
