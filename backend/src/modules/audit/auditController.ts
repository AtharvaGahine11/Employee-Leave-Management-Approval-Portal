import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAllAuditLogs, getAuditLogsForRequest } from './auditService.js';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { limit, action, search, startDate, endDate } = req.query;
  const logs = await getAllAuditLogs({
    limit: limit ? parseInt(limit as string, 10) : 100,
    action: action as string | undefined,
    search: search as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
  });

  res.status(200).json({
    success: true,
    data: logs,
  });
});

export const exportAuditLogsCSV = asyncHandler(async (req: Request, res: Response) => {
  const { action, search, startDate, endDate } = req.query;
  const logs = await getAllAuditLogs({
    limit: 1000,
    action: action as string | undefined,
    search: search as string | undefined,
    startDate: startDate as string | undefined,
    endDate: endDate as string | undefined,
  });

  const headers = [
    'Log ID',
    'Timestamp',
    'Action',
    'Actor ID',
    'Actor Name',
    'Actor Role',
    'Department',
    'Request ID',
    'Leave Type',
    'Previous Status',
    'New Status',
    'Metadata Details',
  ];

  const rows = logs.map((log) => [
    log.id,
    log.timestamp.toISOString(),
    log.action,
    log.actor.employeeId,
    `"${log.actor.name}"`,
    log.actorRole,
    `"${log.actor.department?.name || 'N/A'}"`,
    log.leaveRequest?.requestId || 'N/A',
    log.leaveRequest?.leaveType?.code || 'N/A',
    log.previousStatus || 'N/A',
    log.newStatus || 'N/A',
    `"${(log.metadata || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=ELAP_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`
  );
  res.status(200).send(csvContent);
});

export const getRequestAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const logs = await getAuditLogsForRequest(id);

  res.status(200).json({
    success: true,
    data: logs,
  });
});
