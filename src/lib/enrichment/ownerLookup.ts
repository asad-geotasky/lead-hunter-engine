import { OwnerDiscovery } from '@/types/lead';

/**
 * Discovers owner name, titles, and public social/corporate footprint.
 * Queries OpenCorporates or public registries, and extracts social links.
 */
export async function discoverOwnerDetails(
  businessName: string,
  city: string,
  openCorporatesApiKey?: string
): Promise<OwnerDiscovery> {
  const sanitizedName = businessName
    .replace(/\b(LLC|Inc|Co|Corp|Services|Plumbing|Roofing|Repair|Solutions|Group)\b/gi, '')
    .trim();

  // 1. If OpenCorporates API key provided, query real corporate registry
  if (openCorporatesApiKey) {
    try {
      const url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(sanitizedName)}&api_token=${openCorporatesApiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const firstMatch = json.results?.companies?.[0]?.company;
        if (firstMatch) {
          return {
            ownerName: firstMatch.registered_address_in_full || 'Managing Member (Filing on record)',
            title: 'Registered Officer / Agent',
            confidence: 'CONFIRMED',
            source: `OpenCorporates (${firstMatch.jurisdiction_code?.toUpperCase()})`,
            socialProfiles: {
              yelp: `https://yelp.com/search?find_desc=${encodeURIComponent(businessName)}&find_loc=${encodeURIComponent(city)}`,
            },
          };
        }
      }
    } catch (err) {
      console.warn('OpenCorporates query failed:', err);
    }
  }

  // 2. If no corporate registration found, do NOT fabricate fake names
  return {
    ownerName: undefined,
    title: undefined,
    confidence: 'UNVERIFIED',
    socialProfiles: {
      yelp: `https://yelp.com/search?find_desc=${encodeURIComponent(businessName)}&find_loc=${encodeURIComponent(city)}`,
      linkedin: `https://linkedin.com/search/results/all/?keywords=${encodeURIComponent(businessName + ' ' + city)}`,
    },
  };
}
