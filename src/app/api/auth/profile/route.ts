import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update profile.' }, { status: 500 });
  }
}
