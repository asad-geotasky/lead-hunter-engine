import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, updateLead } from '@/lib/storage';
import { pushToInstantly, pushToSmartlead, pushToWebhook } from '@/lib/outreach/integrations';
import { Lead } from '@/types/lead';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, apiKey, campaignId, webhookUrl, leadIds } = body;

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    const allLeads = await getAllLeads();
    const targetLeads: Lead[] = leadIds && Array.isArray(leadIds) && leadIds.length > 0
      ? allLeads.filter((l) => leadIds.includes(l.id))
      : allLeads;

    if (targetLeads.length === 0) {
      return NextResponse.json({ error: 'No matching leads found to sync' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const hostOrigin = `${protocol}://${host}`;

    let result;
    if (platform === 'instantly') {
      result = await pushToInstantly(targetLeads, apiKey, campaignId, hostOrigin);
    } else if (platform === 'smartlead') {
      result = await pushToSmartlead(targetLeads, apiKey, campaignId, hostOrigin);
    } else if (platform === 'webhook') {
      result = await pushToWebhook(targetLeads, webhookUrl, hostOrigin);
    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    // Automatically update pipeline stage to CONTACTED for synced leads
    const now = new Date().toLocaleDateString();
    for (const lead of targetLeads) {
      const existingNotes = lead.pipeline.notes || [];
      const updatedNotes = [`[${now}] Synced to ${platform.toUpperCase()} sequence`, ...existingNotes];

      await updateLead(lead.id, {
        pipeline: {
          ...lead.pipeline,
          stage: 'CONTACTED',
          lastContactedAt: new Date().toISOString(),
          notes: updatedNotes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      platform,
      count: targetLeads.length,
      synced: result.synced,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
