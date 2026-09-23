import { Lead } from '@/types/lead';
import { calculateOpportunityScore } from '../scoring';

const FIRST_NAMES = ['David', 'Sarah', 'Michael', 'Emily', 'Robert', 'Jessica', 'James', 'Maria', 'William', 'Ashley'];
const LAST_NAMES = ['Miller', 'Johnson', 'Smith', 'Davis', 'Wilson', 'Martinez', 'Taylor', 'Anderson', 'Thomas', 'Harris'];

export function generateMockLeads(niche: string, city: string, count: number = 8): Lead[] {
  const formattedNiche = niche.charAt(0).toUpperCase() + niche.slice(1);
  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);

  const businessTemplates = [
    { prefix: 'Apex', hasWebsite: false, rating: 4.8, reviews: 7, isMobile: true },
    { prefix: 'Precision', hasWebsite: false, rating: 4.9, reviews: 14, isMobile: true },
    { prefix: 'ProMaster', hasWebsite: true, rating: 4.2, reviews: 42, isMobile: false, staleWeb: true },
    { prefix: 'Heritage', hasWebsite: false, rating: 4.6, reviews: 19, isMobile: false },
    { prefix: 'Reliable', hasWebsite: false, rating: 5.0, reviews: 5, isMobile: true },
    { prefix: 'Summit', hasWebsite: true, rating: 4.7, reviews: 88, isMobile: false },
    { prefix: 'Cornerstone', hasWebsite: false, rating: 4.3, reviews: 11, isMobile: true },
    { prefix: 'Blue Ribbon', hasWebsite: true, rating: 3.8, reviews: 18, isMobile: false, noSsl: true },
  ];

  return businessTemplates.slice(0, count).map((item, idx) => {
    const ownerFirst = FIRST_NAMES[(idx * 3) % FIRST_NAMES.length];
    const ownerLast = LAST_NAMES[(idx * 2) % LAST_NAMES.length];
    const ownerName = `${ownerFirst} ${ownerLast}`;
    const businessName = `${item.prefix} ${formattedNiche} of ${formattedCity}`;
    
    // Generate realistic phone number
    const areaCode = 512 + (idx % 10);
    const mid = 200 + idx * 17;
    const end = 1000 + idx * 243;
    const phone = `(${areaCode}) ${mid}-${end}`;

    const reviews = [
      {
        author: 'Marcus Vance',
        text: `Called them on a Tuesday afternoon. They showed up quickly, diagnosed the issue with great care, and the pricing was super fair. Highly recommend them in ${formattedCity}!`,
        rating: 5,
        relativeTime: '2 weeks ago',
      },
      {
        author: 'Elena Rostova',
        text: `Top notch professionalism! You can tell they take true pride in their craft. Will definitely be using them again.`,
        rating: item.rating >= 4.5 ? 5 : 4,
        relativeTime: '1 month ago',
      },
    ];

    const lead: Partial<Lead> = {
      id: `mock_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      placeId: `mock_place_${idx}_${formattedCity.toLowerCase()}`,
      businessName,
      category: formattedNiche,
      address: `${100 + idx * 45} Main St, ${formattedCity}, State`,
      city: formattedCity,
      phone,
      rating: item.rating,
      reviewCount: item.reviews,
      reviews,
      website: item.hasWebsite ? `https://www.${item.prefix.toLowerCase()}${niche.toLowerCase().replace(/\s+/g, '')}.com` : null,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(businessName)}`,
      phoneIntelligence: {
        lineType: item.isMobile ? 'MOBILE' : 'LANDLINE',
        carrier: item.isMobile ? 'T-Mobile USA' : 'AT&T Landline Network',
        isCallableMobile: item.isMobile,
        confidence: 'HIGH',
        notes: item.isMobile ? 'Classified as direct wireless line' : 'Front desk or office routing',
      },
      ownerDiscovery: {
        ownerName,
        title: 'Founder / Managing Director',
        confidence: 'PROBABLE',
        source: 'State Corporate Registry',
        socialProfiles: {
          facebook: `https://facebook.com/${item.prefix.toLowerCase()}.${formattedCity.toLowerCase()}`,
          yelp: `https://yelp.com/biz/${item.prefix.toLowerCase()}-${niche.toLowerCase()}-${formattedCity.toLowerCase()}`,
        },
      },
      websiteAudit: {
        hasWebsite: item.hasWebsite,
        hasSsl: item.noSsl ? false : true,
        isMobileResponsive: item.staleWeb ? false : true,
        cmsDetected: item.hasWebsite ? (item.staleWeb ? 'WordPress 4.8' : 'Custom HTML') : undefined,
        staleCopyrightYear: item.staleWeb ? 2018 : 2024,
        issuesDetected: item.hasWebsite 
          ? (item.staleWeb ? ['Non-responsive viewport', 'Outdated copyright'] : item.noSsl ? ['Missing SSL certificate'] : [])
          : ['No website found on Google Places profile'],
      },
      pipeline: {
        stage: 'DISCOVERED',
        notes: [],
        callLogs: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const scoreResult = calculateOpportunityScore(lead);
    lead.opportunityScore = scoreResult.score;
    lead.scoreBreakdown = scoreResult.breakdown;

    return lead as Lead;
  });
}
