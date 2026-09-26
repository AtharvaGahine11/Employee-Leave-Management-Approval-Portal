import { prisma } from '../../config/prisma.js';
import { LeaveTypeCode, LeaveStatus } from '../../types/enums.js';
import { AppError } from '../../middleware/errorHandler.js';
import { verifyAvailableBalance } from '../balances/balanceService.js';

export interface ValidateLeaveInput {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  excludeRequestId?: string;
}

export const validateLeaveRequest = async (input: ValidateLeaveInput) => {
  const { employeeId, leaveTypeId, startDate, endDate, reason, excludeRequestId } = input;

  // 1. Basic field checks
  if (!startDate || !endDate) {
    throw new AppError('Start date and end date are required.', 400, 'INVALID_DATE');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new AppError('Invalid date format provided.', 400, 'INVALID_DATE');
  }

  if (end < start) {
    throw new AppError('End date cannot be before start date.', 400, 'INVALID_DATE_RANGE');
  }

  // 2. Future date check (BR-06)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw new AppError('Leave start date cannot be in the past.', 400, 'PAST_DATE_NOT_ALLOWED');
  }

  // 3. Reason check
  if (!reason || reason.trim().length < 5) {
    throw new AppError('A valid leave reason is required (minimum 5 characters).', 400, 'REASON_REQUIRED');
  }

  // 4. Calculate total leave days
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 5. Fetch leave type configuration
  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
  });

  if (!leaveType || !leaveType.active) {
    throw new AppError('Selected leave type is invalid or inactive.', 400, 'INVALID_LEAVE_TYPE');
  }

  // 6. Check Consecutive Days Rule for CL (Casual Leave: max 3 consecutive days)
  if (leaveType.code === LeaveTypeCode.CL && leaveType.maxConsecutive && daysCount > leaveType.maxConsecutive) {
    throw new AppError(
      `Casual Leave (CL) cannot exceed ${leaveType.maxConsecutive} consecutive days per instance. Requested: ${daysCount} days.`,
      422,
      'MAX_CONSECUTIVE_EXCEEDED'
    );
  }

  // 7. Check Advance Notice Rule for EL (Earned Leave: minimum 3 days in advance)
  if (leaveType.code === LeaveTypeCode.EL && leaveType.minNoticeDays > 0) {
    const minAdvanceDate = new Date(today);
    minAdvanceDate.setDate(minAdvanceDate.getDate() + leaveType.minNoticeDays);
    minAdvanceDate.setHours(0, 0, 0, 0);

    if (start < minAdvanceDate) {
      throw new AppError(
        `Earned Leave (EL) requires a minimum of ${leaveType.minNoticeDays} days advance notice. Earliest start date allowed: ${minAdvanceDate.toISOString().split('T')[0]}.`,
        422,
        'ADVANCE_NOTICE_REQUIRED'
      );
    }
  }

  // 8. Overlapping leave check (BR-07)
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: {
        in: [
          LeaveStatus.PENDING_MANAGER,
          LeaveStatus.PENDING_HR,
          LeaveStatus.ESCALATED,
          LeaveStatus.APPROVED,
        ],
      },
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
      OR: [
        {
          startDate: { lte: end },
          endDate: { gte: start },
        },
      ],
    },
  });

  if (overlapping) {
    throw new AppError(
      `Overlapping leave request detected for request ${overlapping.requestId} (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]}).`,
      409,
      'OVERLAPPING_LEAVE'
    );
  }

  // 9. Verify available balance
  await verifyAvailableBalance(employeeId, leaveTypeId, daysCount, start.getFullYear());

  return { start, end, daysCount, leaveType };
};
