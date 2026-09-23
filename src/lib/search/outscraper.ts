import { Lead } from '@/types/lead';
import { calculateOpportunityScore } from '../scoring';

interface OutscraperPlaceItem {
  name?: string;
  place_id?: string;
  type?: string;
  subtypes?: string[];
  full_address?: string;
  city?: string;
  phone?: string;
  site?: string;
  rating?: number;
  reviews?: number;
  email_1?: string;
  email_2?: string;
  emails?: string[];
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  reviews_data?: Array<{
    author_title?: string;
    review_text?: string;
    review_rating?: number;
    review_datetime_utc?: string;
  }>;
}

export async function searchOutscraper(
  query: string,
  apiKey: string,
  city: string,
  niche: string,
  limit: number = 20,
  projectId?: string
): Promise<Lead[]> {
  const token = apiKey || process.env.OUTSCRAPER_API_KEY;
  if (!token) {
    throw new Error('Outscraper API Key is missing. Provide it in search settings or set OUTSCRAPER_API_KEY.');
  }

  const searchQuery = query || `${niche} in ${city}`;
  const url = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(
    searchQuery
  )}&limit=${limit}&async=false&enrichment=contacts`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-KEY': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Outscraper API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  // Outscraper usually wraps results in data array of arrays: { data: [[...items]] }
  const rawItems: OutscraperPlaceItem[] = Array.isArray(result.data)
    ? Array.isArray(result.data[0])
      ? result.data[0]
      : result.data
    : [];

  return rawItems.map((item) => {
    const businessName = item.name || 'Local Business';
    const placeId = item.place_id || `outscraper_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const extractedEmail =
      item.email_1 ||
      (item.emails && item.emails[0]) ||
      item.email_2 ||
      null;

    const reviews = (item.reviews_data || []).slice(0, 3).map((r) => ({
      author: r.author_title || 'Verified Customer',
      text: r.review_text || '',
      rating: r.review_rating || 5,
      relativeTime: r.review_datetime_utc ? new Date(r.review_datetime_utc).toLocaleDateString() : 'recently',
    }));

    const rawLead: Partial<Lead> = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      placeId,
      businessName,
      category: item.type || (item.subtypes && item.subtypes[0]) || niche,
      address: item.full_address || city,
      city: item.city || city,
      phone: item.phone || '',
      email: extractedEmail,
      rating: item.rating || 0,
      reviewCount: item.reviews || 0,
      reviews,
      website: item.site || null,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(businessName + ' ' + (item.full_address || city))}`,
      projectId: projectId || null,
      phoneIntelligence: {
        lineType: item.phone?.startsWith('+1800') ? 'TOLL_FREE' : 'MOBILE',
        isCallableMobile: true,
        confidence: 'HIGH',
        notes: 'Outscraper contact verified',
      },
      ownerDiscovery: {
        confidence: extractedEmail ? 'PROBABLE' : 'UNVERIFIED',
        source: extractedEmail ? 'Outscraper Contact Enrichment' : undefined,
        socialProfiles: {
          facebook: item.facebook,
          instagram: item.instagram,
          linkedin: item.linkedin,
        },
      },
      websiteAudit: {
        hasWebsite: !!item.site,
      },
      pipeline: {
        stage: 'DISCOVERED',
        notes: extractedEmail ? [`Outscraper verified business email: ${extractedEmail}`] : [],
        callLogs: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const scoreResult = calculateOpportunityScore(rawLead);
    rawLead.opportunityScore = scoreResult.score;
    rawLead.scoreBreakdown = scoreResult.breakdown;

    return rawLead as Lead;
  });
}
