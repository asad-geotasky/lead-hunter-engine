import { NextRequest, NextResponse } from 'next/server';
import { executeUnifiedSearch } from '@/lib/search/unifiedSearch';
import { upsertLeads } from '@/lib/storage';
import { SearchProvider } from '@/types/lead';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      niche,
      city,
      provider = 'mock',
      apiKey,
      projectId,
      websiteFilter = 'all',
      hasPhoneOnly = false,
      hasEmailOnly = false,
      minReviews = 0,
      minRating = 0,
      limit = 20,
    } = body;

    if (!niche || !city) {
      return NextResponse.json(
        { error: 'Both niche and city are required' },
        { status: 400 }
      );
    }

    const leads = await executeUnifiedSearch({
      niche: niche.trim(),
      city: city.trim(),
      provider: provider as SearchProvider,
      apiKey: apiKey ? apiKey.trim() : undefined,
      projectId,
      websiteFilter,
      hasPhoneOnly: Boolean(hasPhoneOnly),
      hasEmailOnly: Boolean(hasEmailOnly),
      minReviews: minReviews ? Number(minReviews) : 0,
      minRating: minRating ? Number(minRating) : 0,
      limit: limit ? Number(limit) : 20,
    });

    const stats = await upsertLeads(leads);

    return NextResponse.json({
      success: true,
      provider,
      count: leads.length,
      stats,
      leads,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown search error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
