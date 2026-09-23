import { NextRequest, NextResponse } from 'next/server';
import { getCampaignEmailLogs, getAllCampaigns } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaigns = await getAllCampaigns();
    const campaign = campaigns.find((c) => c.id === id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const logs = await getCampaignEmailLogs(id);
    return NextResponse.json({ success: true, campaign, logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch campaign details';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
