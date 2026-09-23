import { NextRequest, NextResponse } from 'next/server';
import { getAllCampaigns, createCampaign } from '@/lib/storage';

export async function GET() {
  try {
    const campaigns = await getAllCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch campaigns';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, name, subject, bodyTemplate, delaySeconds } = body;

    if (!projectId || !name || !subject || !bodyTemplate) {
      return NextResponse.json(
        { error: 'Project, Campaign Name, Subject, and Email Body are required' },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      projectId,
      name: name.trim(),
      subject: subject.trim(),
      bodyTemplate,
      delaySeconds: delaySeconds ? Number(delaySeconds) : 90,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create campaign';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
