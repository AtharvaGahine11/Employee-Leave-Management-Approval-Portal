import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notificationService.js';
import { prisma } from '../../config/prisma.js';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notifications = await getUserNotifications(userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  await markNotificationAsRead(id, userId);

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
  });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await markAllNotificationsAsRead(userId);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
