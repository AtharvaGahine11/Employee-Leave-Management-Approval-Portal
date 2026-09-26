import { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../middleware/errorHandler.js';
import { AuditAction, Role } from '../../types/enums.js';
import { logAudit } from '../audit/auditService.js';
import { emitToRequestRoom } from '../../socket/socketManager.js';
import { createNotification } from '../notifications/notificationService.js';

export const getRequestComments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const comments = await prisma.comment.findMany({
    where: { leaveRequestId: id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.status(200).json({
    success: true,
    data: comments,
  });
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body } = req.body;
  const authorId = req.user!.id;

  if (!body || body.trim().length === 0) {
    throw new AppError('Comment body cannot be empty.', 400, 'INVALID_COMMENT');
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: true },
  });

  if (!leaveRequest) {
    throw new AppError('Leave request not found.', 404, 'REQUEST_NOT_FOUND');
  }

  // Authorization check: Applicant, Manager, or HR
  const isApplicant = leaveRequest.employeeId === authorId;
  const isManager = req.user!.role === Role.MANAGER && leaveRequest.employee.managerId === authorId;
  const isHR = req.user!.role === Role.HR;

  if (!isApplicant && !isManager && !isHR) {
    throw new AppError('You are not authorized to comment on this request.', 403, 'FORBIDDEN');
  }

  const comment = await prisma.comment.create({
    data: {
      leaveRequestId: id,
      authorId,
      body: body.trim(),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  // Emit real-time Socket event
  emitToRequestRoom(id, 'new_comment', comment);

  // Log Audit
  await logAudit({
    leaveRequestId: id,
    actorId: authorId,
    actorRole: req.user!.role,
    action: AuditAction.COMMENT_ADDED,
    metadata: { commentId: comment.id },
  });

  // Notify counter-party
  if (isApplicant && leaveRequest.employee.managerId) {
    await createNotification({
      recipientId: leaveRequest.employee.managerId,
      title: 'New Comment on Leave Request',
      message: `${req.user!.name} commented on request ${leaveRequest.requestId}: "${body.trim().slice(0, 60)}..."`,
      link: `/manager/leaves/${id}`,
    });
  } else if (!isApplicant) {
    await createNotification({
      recipientId: leaveRequest.employeeId,
      title: 'New Comment on Your Leave Request',
      message: `${req.user!.name} (${req.user!.role}) commented on request ${leaveRequest.requestId}: "${body.trim().slice(0, 60)}..."`,
      link: `/employee/leaves/${id}`,
    });
  }

  res.status(201).json({
    success: true,
    data: comment,
  });
});

export const searchComments = asyncHandler(async (req: Request, res: Response) => {
  const { query, leaveRequestId, role } = req.query;
  const user = req.user!;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new AppError('Search query parameter is required.', 400, 'INVALID_QUERY');
  }

  const searchTerm = query.trim();

  let requestFilter: any = {};
  if (user.role === Role.EMPLOYEE) {
    requestFilter = { employeeId: user.id };
  } else if (user.role === Role.MANAGER) {
    requestFilter = {
      OR: [
        { employeeId: user.id },
        { employee: { managerId: user.id } },
      ],
    };
  }

  const comments = await prisma.comment.findMany({
    where: {
      body: { contains: searchTerm },
      ...(leaveRequestId ? { leaveRequestId: leaveRequestId as string } : {}),
      leaveRequest: requestFilter,
      ...(role ? { author: { role: role as string } } : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          department: { select: { name: true } },
        },
      },
      leaveRequest: {
        select: {
          id: true,
          requestId: true,
          employee: { select: { name: true, employeeId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.status(200).json({
    success: true,
    data: comments,
  });
});
