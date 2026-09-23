import { NextRequest, NextResponse } from 'next/server';
import { searchGooglePlaces } from '@/lib/search/googlePlaces';
import { generateMockLeads } from '@/lib/search/mockSearch';
import { upsertLeads } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, city, apiKey, filterNoWebsite, minScore } = body;

    if (!niche || !city) {
      return NextResponse.json(
        { error: 'Both niche and city are required' },
        { status: 400 }
      );
    }

    let leads = [];

    if (apiKey && apiKey.trim() !== '') {
      leads = await searchGooglePlaces(`${niche} in ${city}`, apiKey.trim(), city, niche);
    } else {
      leads = generateMockLeads(niche, city, 10);
    }

    if (filterNoWebsite) {
      leads = leads.filter((l) => !l.website);
    }
    if (minScore && typeof minScore === 'number') {
      leads = leads.filter((l) => l.opportunityScore >= minScore);
    }

    const stats = await upsertLeads(leads);

    return NextResponse.json({
      success: true,
      count: leads.length,
      stats,
      leads,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown search error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
