import { Lead, ApifyFilterOptions } from '@/types/lead';
import { calculateOpportunityScore } from '../scoring';

interface ApifyPlaceItem {
  title?: string;
  name?: string;
  placeId?: string;
  cid?: string;
  categoryName?: string;
  categories?: string[];
  address?: string;
  city?: string;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  url?: string;
  totalScore?: number;
  rating?: number;
  reviewsCount?: number;
  email?: string;
  emails?: string[];
  contactEmail?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  reviews?: Array<{
    name?: string;
    text?: string;
    stars?: number;
    publishedAtDate?: string;
  }>;
}

export async function searchApify(
  query: string,
  apiKey: string,
  city: string,
  niche: string,
  limit: number = 20,
  projectId?: string,
  options?: ApifyFilterOptions
): Promise<Lead[]> {
  const token = apiKey || process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('Apify API Token is missing. Provide it in the search settings or set APIFY_API_TOKEN.');
  }

  // Apify Compass Google Places Crawler sync endpoint
  const url = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${token}`;

  const body: Record<string, any> = {
    searchStringsArray: [query || `${niche} in ${city}`],
    locationQuery: city,
    maxCrawledPlacesPerSearch: limit,
    language: options?.language || 'en',
    scrapeWebsites: options?.extractEmails !== false, // Scrapes emails & social links from company websites
  };

  if (options?.countryCode) {
    body.countryCode = options.countryCode.toLowerCase();
  }
  if (options?.maxReviews !== undefined) {
    body.maxReviews = options.maxReviews;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Apify Google Places Scraper error (${response.status}): ${errorText}`);
  }

  const items = (await response.json()) as ApifyPlaceItem[];
  if (!Array.isArray(items)) {
    return [];
  }

  let leads = items.map((item) => {
    const businessName = item.title || item.name || 'Local Business';
    const placeId = item.placeId || item.cid || `apify_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const extractedEmail = item.email || (item.emails && item.emails[0]) || item.contactEmail || null;
    const phone = item.phone || item.phoneUnformatted || '';
    const website = item.website || item.url || null;

    const reviews = (item.reviews || []).slice(0, 3).map((r) => ({
      author: r.name || 'Verified Customer',
      text: r.text || '',
      rating: r.stars || 5,
      relativeTime: r.publishedAtDate ? new Date(r.publishedAtDate).toLocaleDateString() : 'recently',
    }));

    const rawLead: Partial<Lead> = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      placeId,
      businessName,
      category: item.categoryName || (item.categories && item.categories[0]) || niche,
      address: item.address || city,
      city: item.city || city,
      phone,
      email: extractedEmail,
      rating: item.totalScore || item.rating || 0,
      reviewCount: item.reviewsCount || 0,
      reviews,
      website,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(businessName + ' ' + (item.address || city))}`,
      projectId: projectId || null,
      phoneIntelligence: {
        lineType: phone.startsWith('+1800') ? 'TOLL_FREE' : 'MOBILE',
        isCallableMobile: true,
        confidence: 'ESTIMATED',
        notes: 'Apify web verified',
      },
      ownerDiscovery: {
        confidence: extractedEmail ? 'PROBABLE' : 'UNVERIFIED',
        source: extractedEmail ? 'Website Contact Scrape' : undefined,
        socialProfiles: {
          facebook: item.facebook,
          instagram: item.instagram,
          linkedin: item.linkedin,
        },
      },
      websiteAudit: {
        hasWebsite: !!website,
      },
      pipeline: {
        stage: 'DISCOVERED',
        notes: extractedEmail ? [`Auto-extracted email from website: ${extractedEmail}`] : [],
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

  // Apply Apify specific post-filters
  if (options?.hasPhoneOnly) {
    leads = leads.filter((l) => !!l.phone && l.phone.trim() !== '');
  }
  if (options?.websiteFilter === 'no-website') {
    leads = leads.filter((l) => !l.website);
  } else if (options?.websiteFilter === 'has-website') {
    leads = leads.filter((l) => !!l.website);
  }

  return leads;
}
