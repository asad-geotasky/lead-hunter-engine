import { Lead, GoogleFilterOptions } from '@/types/lead';
import { calculateOpportunityScore } from '../scoring';

interface GooglePlacesNewResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    googleMapsUri?: string;
    primaryTypeDisplayName?: { text: string };
    reviews?: Array<{
      authorAttribution?: { displayName: string };
      text?: { text: string };
      rating?: number;
      relativePublishTimeDescription?: string;
    }>;
  }>;
}

export async function searchGooglePlaces(
  query: string,
  apiKey: string,
  city: string,
  niche: string,
  limit: number = 20,
  options?: GoogleFilterOptions
): Promise<Lead[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.nationalPhoneNumber',
    'places.googleMapsUri',
    'places.primaryTypeDisplayName',
    'places.reviews',
  ].join(',');

  const body: Record<string, any> = {
    textQuery: query || `${niche} in ${city}`,
    pageSize: Math.min(20, Math.max(1, limit)),
  };

  if (options?.languageCode) {
    body.languageCode = options.languageCode;
  }
  if (options?.regionCode) {
    body.regionCode = options.regionCode;
  }
  if (options?.minRating && options.minRating > 0) {
    body.minRating = options.minRating;
  }
  if (options?.openNow !== undefined) {
    body.openNow = options.openNow;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as GooglePlacesNewResponse;
  const places = data.places || [];

  return places.map((place) => {
    const reviews = (place.reviews || []).slice(0, 3).map((r) => ({
      author: r.authorAttribution?.displayName || 'Verified Customer',
      text: r.text?.text || '',
      rating: r.rating || 5,
      relativeTime: r.relativePublishTimeDescription || 'recently',
    }));

    const rawLead: Partial<Lead> = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      placeId: place.id,
      businessName: place.displayName?.text || 'Local Business',
      category: place.primaryTypeDisplayName?.text || niche,
      address: place.formattedAddress || `${city}`,
      city,
      phone: place.nationalPhoneNumber || '',
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      reviews,
      website: place.websiteUri || null,
      googleMapsUrl: place.googleMapsUri || `https://maps.google.com/?q=${encodeURIComponent(place.displayName?.text || '')}`,
      phoneIntelligence: {
        lineType: 'UNKNOWN',
        isCallableMobile: false,
        confidence: 'ESTIMATED',
        notes: 'Needs enrichment',
      },
      ownerDiscovery: {
        confidence: 'UNVERIFIED',
      },
      websiteAudit: {
        hasWebsite: !!place.websiteUri,
      },
      pipeline: {
        stage: 'DISCOVERED',
        notes: [],
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
