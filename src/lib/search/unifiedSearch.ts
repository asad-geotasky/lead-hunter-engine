import { Lead, SearchProvider } from '@/types/lead';
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
  filterNoWebsite?: boolean;
  minScore?: number;
  limit?: number;
}

export async function executeUnifiedSearch(params: UnifiedSearchParams): Promise<Lead[]> {
  const {
    niche,
    city,
    provider = 'mock',
    apiKey = '',
    projectId,
    filterNoWebsite,
    minScore,
    limit = 20,
  } = params;

  let leads: Lead[] = [];
  const query = `${niche} in ${city}`;

  switch (provider) {
    case 'apify':
      leads = await searchApify(query, apiKey, city, niche, limit, projectId);
      break;

    case 'outscraper':
      leads = await searchOutscraper(query, apiKey, city, niche, limit, projectId);
      break;

    case 'google':
      leads = await searchGooglePlaces(query, apiKey, city, niche);
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

  // Apply filters
  if (filterNoWebsite) {
    leads = leads.filter((l) => !l.website);
  }
  if (minScore && typeof minScore === 'number' && minScore > 0) {
    leads = leads.filter((l) => l.opportunityScore >= minScore);
  }

  return leads;
}
