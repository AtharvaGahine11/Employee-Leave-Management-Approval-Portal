import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { LeaveStatus, Role } from '../../types/enums.js';

let cachedSummaryReport: any = null;
let lastSummaryTime = 0;
const REPORT_CACHE_TTL = 15 * 1000;

export const getLeaveSummaryReport = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, startDate, endDate } = req.query;

  const isUnfiltered = !departmentId && !startDate && !endDate;
  const now = Date.now();

  if (isUnfiltered && cachedSummaryReport && now - lastSummaryTime < REPORT_CACHE_TTL) {
    res.status(200).json({
      success: true,
      data: cachedSummaryReport,
    });
    return;
  }

  const dateFilter =
    startDate && endDate
      ? {
          startDate: { gte: new Date(startDate as string) },
          endDate: { lte: new Date(endDate as string) },
        }
      : {};

  const deptFilter = departmentId ? { employee: { departmentId: departmentId as string } } : {};

  // Run total employees count and requests query in parallel
  const [totalEmployees, requests] = await Promise.all([
    prisma.employee.count({ where: { active: true } }),
    prisma.leaveRequest.findMany({
      where: { ...dateFilter, ...deptFilter },
      include: {
        leaveType: true,
        employee: {
          select: {
            department: { select: { name: true, code: true } },
          },
        },
      },
    }),
  ]);

  const totalRequests = requests.length;
  const pendingManager = requests.filter((r) => r.status === LeaveStatus.PENDING_MANAGER).length;
  const pendingHr = requests.filter((r) => r.status === LeaveStatus.PENDING_HR).length;
  const approved = requests.filter((r) => r.status === LeaveStatus.APPROVED).length;
  const rejected = requests.filter(
    (r) => r.status === LeaveStatus.REJECTED_BY_MANAGER || r.status === LeaveStatus.REJECTED_BY_HR
  ).length;
  const cancelled = requests.filter((r) => r.status === LeaveStatus.CANCELLED).length;
  const escalated = requests.filter((r) => r.status === LeaveStatus.ESCALATED).length;

  const totalApprovedDays = requests
    .filter((r) => r.status === LeaveStatus.APPROVED)
    .reduce((sum, r) => sum + r.daysCount, 0);

  // Department breakdown
  const departmentBreakdown: Record<string, { total: number; approved: number; pending: number }> = {};
  requests.forEach((r) => {
    const deptName = r.employee.department.name;
    if (!departmentBreakdown[deptName]) {
      departmentBreakdown[deptName] = { total: 0, approved: 0, pending: 0 };
    }
    departmentBreakdown[deptName].total += 1;
    if (r.status === LeaveStatus.APPROVED) {
      departmentBreakdown[deptName].approved += 1;
    } else if (r.status === LeaveStatus.PENDING_MANAGER || r.status === LeaveStatus.PENDING_HR || r.status === LeaveStatus.ESCALATED) {
      departmentBreakdown[deptName].pending += 1;
    }
  });

  // Leave Type breakdown
  const leaveTypeBreakdown: Record<string, number> = {};
  requests.forEach((r) => {
    const code = r.leaveType.code;
    leaveTypeBreakdown[code] = (leaveTypeBreakdown[code] || 0) + 1;
  });

  const resultData = {
    metrics: {
      totalEmployees,
      totalRequests,
      pendingManager,
      pendingHr,
      approved,
      rejected,
      cancelled,
      escalated,
      totalApprovedDays,
    },
    departmentBreakdown: Object.entries(departmentBreakdown).map(([name, data]) => ({
      name,
      ...data,
    })),
    leaveTypeBreakdown: Object.entries(leaveTypeBreakdown).map(([code, count]) => ({
      code,
      count,
    })),
  };

  if (isUnfiltered) {
    cachedSummaryReport = resultData;
    lastSummaryTime = Date.now();
  }

  res.status(200).json({
    success: true,
    data: resultData,
  });
});

export const exportLeavesCSV = asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, status, leaveTypeId, startDate, endDate } = req.query;

  const requests = await prisma.leaveRequest.findMany({
    where: {
      ...(departmentId ? { employee: { departmentId: departmentId as string } } : {}),
      ...(status ? { status: status as LeaveStatus } : {}),
      ...(leaveTypeId ? { leaveTypeId: leaveTypeId as string } : {}),
      ...(startDate && endDate
        ? {
            startDate: { gte: new Date(startDate as string) },
            endDate: { lte: new Date(endDate as string) },
          }
        : {}),
    },
    include: {
      leaveType: true,
      employee: {
        select: {
          employeeId: true,
          name: true,
          email: true,
          department: { select: { name: true } },
          manager: { select: { name: true } },
        },
      },
      approvals: {
        include: { approver: { select: { name: true, role: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // CSV Generation
  const headers = [
    'Request ID',
    'Employee ID',
    'Employee Name',
    'Email',
    'Department',
    'Reporting Manager',
    'Leave Type',
    'Start Date',
    'End Date',
    'Days',
    'Status',
    'Reason',
    'Submitted At',
  ];

  const rows = requests.map((r) => [
    r.requestId,
    r.employee.employeeId,
    `"${r.employee.name}"`,
    r.employee.email,
    `"${r.employee.department.name}"`,
    `"${r.employee.manager?.name || 'N/A'}"`,
    r.leaveType.code,
    r.startDate.toISOString().split('T')[0],
    r.endDate.toISOString().split('T')[0],
    r.daysCount,
    r.status,
    `"${(r.reason || '').replace(/"/g, '""')}"`,
    r.submittedAt ? r.submittedAt.toISOString() : 'N/A',
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=ELAP_Leave_Report_${new Date().toISOString().split('T')[0]}.csv`);
  res.status(200).send(csvContent);
});
