import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead } from '@/lib/storage';
import { generateOutreachKit } from '@/lib/outreach/scriptGenerator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    const outreachKit = generateOutreachKit(lead, origin);

    const updated = await updateLead(id, {
      outreach: outreachKit,
      pipeline: {
        ...lead.pipeline,
        stage: lead.pipeline.stage === 'DISCOVERED' || lead.pipeline.stage === 'ENRICHED'
          ? 'DEMO_READY'
          : lead.pipeline.stage,
      },
    });

    return NextResponse.json({ success: true, lead: updated, outreach: outreachKit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating outreach';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
