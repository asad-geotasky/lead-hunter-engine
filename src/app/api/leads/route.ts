import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, upsertLeads } from '@/lib/storage';
import { Lead, PipelineStage } from '@/types/lead';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage') as PipelineStage | undefined;
    const noWebsiteOnly = searchParams.get('noWebsite') === 'true';
    const minScore = parseInt(searchParams.get('minScore') || '0', 10);
    const search = searchParams.get('q') || undefined;
    const projectId = searchParams.get('projectId') || undefined;

    const leads = await getAllLeads({
      stage,
      noWebsite: noWebsiteOnly,
      minScore,
      search,
      projectId,
    });

    return NextResponse.json({ success: true, count: leads.length, leads });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const newLead: Lead = await req.json();
    await upsertLeads([newLead]);
    return NextResponse.json({ success: true, lead: newLead });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
