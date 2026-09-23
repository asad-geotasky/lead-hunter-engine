import nodemailer from 'nodemailer';
import { Mailbox, Lead, Campaign } from '@/types/lead';
import { incrementMailboxSent, createEmailLog } from '../storage';

export async function testMailboxConnection(mailbox: {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: mailbox.smtpHost || 'smtp.gmail.com',
      port: mailbox.smtpPort || 465,
      secure: mailbox.smtpPort === 465,
      auth: {
        user: mailbox.smtpUser,
        pass: mailbox.smtpPass,
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to connect to SMTP server';
    return { success: false, message: msg };
  }
}

export function renderEmailVariables(
  template: string,
  lead: Lead,
  baseUrl: string = ''
): string {
  const previewUrl = baseUrl ? `${baseUrl}/preview/${lead.id}` : `/preview/${lead.id}`;
  const owner = lead.ownerDiscovery?.ownerName || 'Business Owner';

  return template
    .replace(/\{\{businessName\}\}/g, lead.businessName)
    .replace(/\{\{city\}\}/g, lead.city)
    .replace(/\{\{category\}\}/g, lead.category)
    .replace(/\{\{phone\}\}/g, lead.phone || '')
    .replace(/\{\{website\}\}/g, lead.website || 'None')
    .replace(/\{\{ownerName\}\}/g, owner)
    .replace(/\{\{opportunityScore\}\}/g, String(lead.opportunityScore))
    .replace(/\{\{previewUrl\}\}/g, previewUrl);
}

export function selectBestMailbox(mailboxes: Mailbox[]): Mailbox | null {
  const eligible = mailboxes.filter(
    (m) => m.isActive && m.sentToday < m.dailyLimit
  );

  if (eligible.length === 0) return null;

  // Round-robin / load-balance: pick the mailbox with lowest sent count today
  eligible.sort((a, b) => a.sentToday - b.sentToday);
  return eligible[0];
}

export async function sendColdEmail({
  mailbox,
  lead,
  subject,
  body,
  campaignId,
  baseUrl = '',
}: {
  mailbox: Mailbox;
  lead: Lead;
  subject: string;
  body: string;
  campaignId: string;
  baseUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const recipient = lead.email;
  if (!recipient || !recipient.includes('@')) {
    await createEmailLog({
      campaignId,
      leadId: lead.id,
      mailboxId: mailbox.id,
      recipient: recipient || 'unknown',
      subject,
      status: 'FAILED',
      error: 'Lead has no valid email address',
    });
    return { success: false, error: 'Lead has no valid email address' };
  }

  const renderedSubject = renderEmailVariables(subject, lead, baseUrl);
  const renderedBody = renderEmailVariables(body, lead, baseUrl);

  try {
    const transporter = nodemailer.createTransport({
      host: mailbox.smtpHost || 'smtp.gmail.com',
      port: mailbox.smtpPort || 465,
      secure: mailbox.smtpPort === 465,
      auth: {
        user: mailbox.smtpUser,
        pass: mailbox.smtpPass,
      },
    });

    const previewUrl = baseUrl ? `${baseUrl}/preview/${lead.id}` : `/preview/${lead.id}`;

    // Clean plain HTML formatting
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #222;">
        ${renderedBody.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}
        
        <br/><br/>
        <div style="padding: 14px 18px; background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px; margin: 16px 0;">
          <strong>Interactive Mobile Demo & Opportunity Breakdown:</strong><br/>
          <a href="${previewUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">
            ${previewUrl}
          </a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${mailbox.senderName}" <${mailbox.email}>`,
      to: recipient,
      replyTo: mailbox.replyTo || mailbox.email,
      subject: renderedSubject,
      text: renderedBody,
      html: htmlContent,
    });

    // Record success & increment today's sent count
    await incrementMailboxSent(mailbox.id);
    await createEmailLog({
      campaignId,
      leadId: lead.id,
      mailboxId: mailbox.id,
      recipient,
      subject: renderedSubject,
      status: 'SENT',
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown mail sending error';
    await createEmailLog({
      campaignId,
      leadId: lead.id,
      mailboxId: mailbox.id,
      recipient,
      subject: renderedSubject,
      status: 'FAILED',
      error: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
}
