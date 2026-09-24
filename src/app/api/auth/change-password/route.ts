import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { comparePassword, hashPassword } from '@/lib/auth/password';

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect current password. Please try again.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully changed.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update password.' },
      { status: 500 }
    );
  }
}
