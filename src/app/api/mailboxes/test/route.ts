import { NextRequest, NextResponse } from 'next/server';
import { testMailboxConnection } from '@/lib/outreach/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = body;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'SMTP User and App Password are required' }, { status: 400 });
    }

    const result = await testMailboxConnection({
      smtpHost: smtpHost || 'smtp.gmail.com',
      smtpPort: smtpPort ? Number(smtpPort) : 465,
      smtpSecure: smtpSecure ?? true,
      smtpUser: smtpUser.trim(),
      smtpPass: smtpPass.trim(),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SMTP verification error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
