import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead } from '@/lib/storage';
import { enrichLead } from '@/lib/enrichment';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const enriched = await enrichLead(lead, {
      twilioSid: body.twilioSid,
      twilioToken: body.twilioToken,
      openCorporatesKey: body.openCorporatesKey,
    });

    await updateLead(id, enriched);

    return NextResponse.json({ success: true, lead: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error enriching lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
