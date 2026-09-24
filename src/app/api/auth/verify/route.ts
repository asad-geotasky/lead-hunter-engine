import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.redirect(new URL('/login?error=Invalid%20verification%20link', req.url));
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=Invalid%20or%20expired%20verification%20token', req.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.redirect(new URL('/login?verified=true', req.url));
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=Verification%20failed', req.url));
  }
}

export async function POST(req: Request) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json({ error: 'Token and email are required.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}
