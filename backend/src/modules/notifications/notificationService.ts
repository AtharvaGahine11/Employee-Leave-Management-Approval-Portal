import { prisma } from '../../config/prisma.js';
import { emitToUser, emitToRole } from '../../socket/socketManager.js';
import { sendEmailNotification } from '../../services/emailService.js';
import { logger } from '../../utils/logger.js';

export interface CreateNotificationParams {
  recipientId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  link?: string;
  emailSubject?: string;
  emailHtml?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    // 1. Create Notification record in PostgreSQL
    const notification = await prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        link: params.link || null,
      },
    });

    // 2. Emit real-time Socket.IO event
    emitToUser(params.recipientId, 'new_notification', notification);

    // 3. Send Email if details provided
    if (params.emailSubject && params.emailHtml) {
      const recipient = await prisma.employee.findUnique({
        where: { id: params.recipientId },
        select: { email: true, name: true },
      });

      if (recipient?.email) {
        await sendEmailNotification({
          to: recipient.email,
          subject: params.emailSubject,
          html: params.emailHtml,
        });
      }
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
  }
};

export const createRoleNotification = async (
  role: 'MANAGER' | 'HR',
  title: string,
  message: string,
  link?: string
) => {
  try {
    const recipients = await prisma.employee.findMany({
      where: { role, active: true },
      select: { id: true, email: true },
    });

    for (const user of recipients) {
      await createNotification({
        recipientId: user.id,
        title,
        message,
        link,
      });
    }

    emitToRole(role, 'role_notification', { title, message, link });
  } catch (error) {
    logger.error(`Failed to create role notification for ${role}:`, error);
  }
};

export const getUserNotifications = async (recipientId: string, limit = 50) => {
  return prisma.notification.findMany({
    where: { recipientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const markNotificationAsRead = async (notificationId: string, recipientId: string) => {
  return prisma.notification.updateMany({
    where: { id: notificationId, recipientId },
    data: { read: true },
  });
};

export const markAllNotificationsAsRead = async (recipientId: string) => {
  return prisma.notification.updateMany({
    where: { recipientId, read: false },
    data: { read: true },
  });
};
