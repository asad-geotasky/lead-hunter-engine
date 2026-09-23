import { NextRequest, NextResponse } from 'next/server';
import { deleteMailbox } from '@/lib/storage';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await deleteMailbox(id);
    return NextResponse.json({ success: ok });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete mailbox';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
