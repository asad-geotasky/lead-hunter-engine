import { 
  Lead, 
  SearchProvider, 
  ApifyFilterOptions, 
  OutscraperFilterOptions, 
  GoogleFilterOptions 
} from '@/types/lead';
import { searchGooglePlaces } from './googlePlaces';
import { searchApify } from './apifyScraper';
import { searchOutscraper } from './outscraper';
import { generateMockLeads } from './mockSearch';

export interface UnifiedSearchParams {
  niche: string;
  city: string;
  provider?: SearchProvider;
  apiKey?: string;
  projectId?: string;
  limit?: number;
  apifyOptions?: ApifyFilterOptions;
  outscraperOptions?: OutscraperFilterOptions;
  googleOptions?: GoogleFilterOptions;
  websiteFilter?: 'all' | 'no-website' | 'has-website';
  hasPhoneOnly?: boolean;
  hasEmailOnly?: boolean;
  minReviews?: number;
  minRating?: number;
}

export async function executeUnifiedSearch(params: UnifiedSearchParams): Promise<Lead[]> {
  const {
    niche,
    city,
    provider = 'mock',
    apiKey = '',
    projectId,
    limit = 20,
    apifyOptions,
    outscraperOptions,
    googleOptions,
    websiteFilter = 'all',
    hasPhoneOnly = false,
    hasEmailOnly = false,
    minReviews = 0,
    minRating = 0,
  } = params;

  let leads: Lead[] = [];
  const query = `${niche} in ${city}`;

  switch (provider) {
    case 'apify':
      leads = await searchApify(
        query, 
        apiKey, 
        city, 
        niche, 
        limit, 
        projectId, 
        apifyOptions || {
          websiteFilter,
          hasPhoneOnly,
          extractEmails: true,
        }
      );
      break;

    case 'outscraper':
      leads = await searchOutscraper(
        query, 
        apiKey, 
        city, 
        niche, 
        limit, 
        projectId, 
        outscraperOptions || {
          websiteFilter,
          skipEmptyPhone: hasPhoneOnly,
          skipEmptyEmail: hasEmailOnly,
          dropDuplicates: true,
        }
      );
      break;

    case 'google':
      leads = await searchGooglePlaces(
        query, 
        apiKey, 
        city, 
        niche, 
        limit, 
        googleOptions || {
          minRating,
        }
      );
      if (projectId) {
        leads = leads.map((l) => ({ ...l, projectId }));
      }
      break;

    case 'mock':
    default:
      leads = generateMockLeads(niche, city, limit);
      if (projectId) {
        leads = leads.map((l) => ({ ...l, projectId }));
      }
      break;
  }

  // Assign generated email to mock leads if missing for test campaigns
  leads = leads.map((l) => {
    if (!l.email) {
      const cleanName = l.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      l.email = `contact@${cleanName || 'localbiz'}.com`;
    }
    if (projectId && !l.projectId) {
      l.projectId = projectId;
    }
    return l;
  });

  // Cross-provider post-filters
  if (websiteFilter === 'no-website') {
    leads = leads.filter((l) => !l.website);
  } else if (websiteFilter === 'has-website') {
    leads = leads.filter((l) => !!l.website);
  }

  if (hasPhoneOnly) {
    leads = leads.filter((l) => !!l.phone && l.phone.trim() !== '');
  }

  if (hasEmailOnly) {
    leads = leads.filter((l) => !!l.email && l.email.includes('@'));
  }

  if (minReviews > 0) {
    leads = leads.filter((l) => (l.reviewCount || 0) >= minReviews);
  }

  if (minRating > 0) {
    leads = leads.filter((l) => (l.rating || 0) >= minRating);
  }

  return leads;
}
