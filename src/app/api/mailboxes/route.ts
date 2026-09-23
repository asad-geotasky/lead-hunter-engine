import { NextRequest, NextResponse } from 'next/server';
import { getAllMailboxes, saveMailbox } from '@/lib/storage';

export async function GET() {
  try {
    const mailboxes = await getAllMailboxes();
    // Mask sensitive passwords in GET response for security
    const masked = mailboxes.map((m) => ({
      ...m,
      smtpPass: m.smtpPass ? '••••••••••••••••' : '',
    }));
    return NextResponse.json({ success: true, mailboxes: masked });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch mailboxes';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, senderName, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, replyTo, dailyLimit, isActive } = body;

    if (!email || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Email, SMTP user, and Google App Password are required.' }, { status: 400 });
    }

    const saved = await saveMailbox({
      email: email.trim(),
      senderName: (senderName || email).trim(),
      smtpHost: smtpHost || 'smtp.gmail.com',
      smtpPort: smtpPort ? Number(smtpPort) : 465,
      smtpSecure: smtpSecure ?? true,
      smtpUser: smtpUser.trim(),
      smtpPass: smtpPass.trim(),
      replyTo: replyTo ? replyTo.trim() : null,
      dailyLimit: dailyLimit ? Number(dailyLimit) : 50,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, mailbox: { ...saved, smtpPass: '••••••••••••••••' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save mailbox';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
