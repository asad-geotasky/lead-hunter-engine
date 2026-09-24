import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

export interface SmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

export async function getSystemSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { id: 'system_config' },
    });

    if (setting && setting.smtpHost && setting.smtpUser && setting.smtpPass) {
      return {
        smtpHost: setting.smtpHost,
        smtpPort: setting.smtpPort,
        smtpSecure: setting.smtpSecure,
        smtpUser: setting.smtpUser,
        smtpPass: setting.smtpPass,
        smtpFrom: setting.smtpFrom || setting.smtpUser,
      };
    }
  } catch (err) {
    console.error('Failed to read system SMTP from DB, falling back to ENV:', err);
  }

  // Fallback to environment variables
  if (process.env.SYSTEM_SMTP_HOST && process.env.SYSTEM_SMTP_USER && process.env.SYSTEM_SMTP_PASS) {
    return {
      smtpHost: process.env.SYSTEM_SMTP_HOST,
      smtpPort: parseInt(process.env.SYSTEM_SMTP_PORT || '587', 10),
      smtpSecure: process.env.SYSTEM_SMTP_SECURE === 'true',
      smtpUser: process.env.SYSTEM_SMTP_USER,
      smtpPass: process.env.SYSTEM_SMTP_PASS,
      smtpFrom: process.env.SYSTEM_SMTP_FROM || process.env.SYSTEM_SMTP_USER,
    };
  }

  return null;
}

export async function testSmtpConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (error: any) {
    return { success: false, message: error?.message || 'SMTP verification failed.' };
  }
}

export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; message?: string }> {
  const config = await getSystemSmtpConfig();
  const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(toEmail)}`;

  if (!config) {
    console.warn(`[System Mailer Warning] No SMTP configured. Verification link for ${toEmail}: ${verifyUrl}`);
    return {
      success: false,
      message: `System SMTP is not yet configured. Please configure System SMTP in settings or use this verification link directly: ${verifyUrl}`,
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">LeadHunter Engine</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Account Email Verification</p>
      </div>
      <div style="background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
        <p style="font-size: 16px; line-height: 1.5; color: #f1f5f9;">Hello ${name || 'User'},</p>
        <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">
          Thank you for creating an account on LeadHunter Engine. Please confirm your email address by clicking the secure button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);">
            Verify My Account
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
          If the button above does not work, copy and paste this URL into your browser:<br/>
          <a href="${verifyUrl}" style="color: #38bdf8; word-break: break-all;">${verifyUrl}</a>
        </p>
      </div>
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        LeadHunter Engine Automated Security Notification
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"LeadHunter Engine" <${config.smtpFrom}>`,
    to: toEmail,
    subject: 'Confirm your LeadHunter Engine Account',
    html,
  });

  return { success: true };
}

export async function sendPasswordResetEmail(
  toEmail: string,
  name: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; message?: string }> {
  const config = await getSystemSmtpConfig();
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(toEmail)}`;

  if (!config) {
    console.warn(`[System Mailer Warning] No SMTP configured. Password reset link for ${toEmail}: ${resetUrl}`);
    return {
      success: false,
      message: `System SMTP is not configured. Direct reset link: ${resetUrl}`,
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; font-size: 24px; margin: 0;">LeadHunter Engine</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>
      <div style="background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
        <p style="font-size: 16px; line-height: 1.5; color: #f1f5f9;">Hello ${name || 'User'},</p>
        <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">
          We received a request to reset your LeadHunter Engine password. Click the button below to set a new password. This link is valid for 1 hour.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
          If you did not request this, you can safely ignore this email. Your password will remain unchanged.<br/>
          <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
        LeadHunter Engine Automated Security Notification
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"LeadHunter Engine" <${config.smtpFrom}>`,
    to: toEmail,
    subject: 'Reset your LeadHunter Engine Password',
    html,
  });

  return { success: true };
}
