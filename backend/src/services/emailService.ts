import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

let resendClient: Resend | null = null;
if (config.resendApiKey && !config.resendApiKey.startsWith('re_demo')) {
  resendClient = new Resend(config.resendApiKey);
}

// Nodemailer SMTP fallback if configured
let smtpTransporter: Transporter | null = null;
if (config.smtp.host && config.smtp.user) {
  smtpTransporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmailNotification = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    if (resendClient) {
      const response = await resendClient.emails.send({
        from: config.emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      logger.info(`📧 [Resend] Email sent to ${options.to} (ID: ${response.data?.id})`);
      return true;
    } else if (smtpTransporter) {
      const info = await smtpTransporter.sendMail({
        from: config.emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      logger.info(`📧 [SMTP] Email sent to ${options.to} (MessageId: ${info.messageId})`);
      return true;
    } else {
      logger.info(`📧 [DEMO EMAIL NOTIFICATION]`);
      logger.info(`   To: ${options.to}`);
      logger.info(`   Subject: "${options.subject}"`);
      logger.info(`   (Set RESEND_API_KEY or SMTP credentials in backend/.env for live delivery)`);
      return true;
    }
  } catch (error) {
    logger.error(`❌ Email delivery failed to ${options.to}:`, error);
    // Never throw error or rollback DB transaction on email failure!
    return false;
  }
};

/**
 * Standard Email Shell Template with Responsive Styling
 */
const emailShell = (title: string, badgeText: string, badgeBg: string, badgeColor: string, contentHtml: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #818cf8;">ELAP Portal Notification</span>
                    <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff;">${title}</h1>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor};">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              ELAP &bull; Employee Leave Management &amp; Approval Portal<br>
              This is an automated system notification. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const generateLeaveApprovedEmployeeEmail = (params: {
  employeeName: string;
  requestId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  remarks?: string;
  actionUrl?: string;
}) => {
  const content = `
    <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">Dear <strong>${params.employeeName}</strong>,</p>
    <p style="font-size: 14px; margin: 0 0 20px 0; color: #475569; line-height: 1.5;">
      Great news! Your leave request has received <strong style="color: #16a34a;">Final Approval</strong> from Human Resources. Your leave quota balance has been updated accordingly.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" style="font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 40%;">Request ID:</td>
          <td style="color: #0f172a; font-weight: 700; font-family: monospace;">${params.requestId}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Leave Type:</td>
          <td style="color: #0f172a; font-weight: 600;">${params.leaveTypeName}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Duration:</td>
          <td style="color: #0f172a; font-weight: 600;">${params.startDate} &rarr; ${params.endDate} (${params.daysCount} days)</td>
        </tr>
        ${params.remarks ? `
        <tr>
          <td style="color: #64748b;">HR Remarks:</td>
          <td style="color: #0f172a; font-style: italic;">"${params.remarks}"</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #64748b;">Current Status:</td>
          <td><strong style="color: #16a34a;">APPROVED (Final)</strong></td>
        </tr>
      </table>
    </div>

    ${params.actionUrl ? `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${params.actionUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
        View Leave Details in ELAP &rarr;
      </a>
    </div>
    ` : ''}

    <p style="font-size: 13px; color: #64748b; margin: 0;">Have a pleasant time off!</p>
  `;

  return emailShell('Leave Request Approved 🎉', 'APPROVED', '#dcfce7', '#166534', content);
};

export const generateLeaveApprovedManagerEmail = (params: {
  managerName: string;
  employeeName: string;
  requestId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  remarks?: string;
  actionUrl?: string;
}) => {
  const content = `
    <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">Hi <strong>${params.managerName}</strong>,</p>
    <p style="font-size: 14px; margin: 0 0 20px 0; color: #475569; line-height: 1.5;">
      This is to inform you that leave request <strong>${params.requestId}</strong> submitted by your direct report <strong style="color: #0f172a;">${params.employeeName}</strong> has received <strong>Final Approval from HR</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" style="font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #64748b; width: 40%;">Employee:</td>
          <td style="color: #0f172a; font-weight: 700;">${params.employeeName}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Request ID:</td>
          <td style="color: #0f172a; font-weight: 700; font-family: monospace;">${params.requestId}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Leave Type:</td>
          <td style="color: #0f172a; font-weight: 600;">${params.leaveTypeName}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Dates Approved:</td>
          <td style="color: #0f172a; font-weight: 600;">${params.startDate} &rarr; ${params.endDate} (${params.daysCount} days)</td>
        </tr>
        ${params.remarks ? `
        <tr>
          <td style="color: #64748b;">HR Remarks:</td>
          <td style="color: #0f172a; font-style: italic;">"${params.remarks}"</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${params.actionUrl ? `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${params.actionUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
        View Team Schedule &rarr;
      </a>
    </div>
    ` : ''}

    <p style="font-size: 13px; color: #64748b; margin: 0;">Please ensure team coverage during this absence period.</p>
  `;

  return emailShell('Team Member Leave Approved', 'TEAM UPDATE', '#e0e7ff', '#3730a3', content);
};

