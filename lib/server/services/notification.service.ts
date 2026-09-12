import { prisma } from "@/lib/server/prisma";

export interface SendNotificationParams {
  recipientId: string;
  recipientEmail?: string;
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  link?: string;
}

export class NotificationService {
  /**
   * Dispatches in-app notification and attempts email dispatch via Resend
   */
  static async sendNotification(params: SendNotificationParams) {
    try {
      // 1. Create In-App Notification record in Database
      const notif = await prisma.notification.create({
        data: {
          recipientId: params.recipientId,
          title: params.title,
          message: params.message,
          type: params.type || "INFO",
          link: params.link || null,
        },
      });

      // 2. Event-driven Resend email delivery (non-blocking)
      this.sendEmailNotification(params).catch((err) => {
        console.warn("Resend email dispatch error (fallback to in-app portal truth):", err.message);
      });

      return notif;
    } catch (error) {
      console.error("Failed to create in-app notification:", error);
      return null;
    }
  }

  private static async sendEmailNotification(params: SendNotificationParams) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey.includes("placeholder")) {
      console.log(`[Email Mock Dispatch] To: ${params.recipientEmail || params.recipientId} | Subject: ${params.title} | Body: ${params.message}`);
      return;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "ELAP Portal <notifications@elap.portal>",
          to: params.recipientEmail,
          subject: params.title,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0e1424; color: #f1f5f9; border-radius: 12px;">
            <h2 style="color: #38bdf8;">${params.title}</h2>
            <p style="font-size: 14px; line-height: 1.6;">${params.message}</p>
            ${params.link ? `<a href="${params.link}" style="display: inline-block; padding: 10px 20px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">View Application in Portal</a>` : ""}
            <hr style="border: 0; border-top: 1px solid #1e293b; margin-top: 25px;" />
            <p style="font-size: 11px; color: #94a3b8;">This is an automated notification from Employee Leave Management & Approval Portal (ELAP).</p>
          </div>`,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn("Resend API response failure:", errText);
      }
    } catch (err) {
      console.warn("Resend network error:", err);
    }
  }

  static async getRecipientNotifications(recipientId: string, limit = 20) {
    try {
      return await prisma.notification.findMany({
        where: { recipientId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      console.error("Failed to fetch recipient notifications:", error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      return null;
    }
  }
}
