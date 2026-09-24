import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/auth/systemMailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      // Don't disclose user existence for security
      return NextResponse.json({
        success: true,
        message: 'If an unverified account exists with this email, a new verification link has been sent.',
      });
    }

    if (user.isVerified) {
      return NextResponse.json({
        success: true,
        message: 'This account is already verified. You can proceed to login.',
      });
    }

    const newToken = crypto.randomUUID();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: newToken },
    });

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const mailResult = await sendVerificationEmail(user.email, user.name, newToken, origin);

    return NextResponse.json({
      success: true,
      message: 'A fresh verification email has been sent. Please check your inbox.',
      emailSent: mailResult.success,
      warning: mailResult.message,
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to resend verification email.' }, { status: 500 });
  }
}
