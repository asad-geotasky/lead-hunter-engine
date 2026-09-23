export type PipelineStage = 
  | 'DISCOVERED'
  | 'ENRICHED'
  | 'DEMO_READY'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'MEETING'
  | 'WON'
  | 'LOST';

export type LineType = 'MOBILE' | 'LANDLINE' | 'VOIP' | 'TOLL_FREE' | 'UNKNOWN';

export interface LeadReview {
  author: string;
  text: string;
  rating: number;
  relativeTime?: string;
}

export interface PhoneIntelligence {
  lineType: LineType;
  carrier?: string;
  isCallableMobile: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  notes?: string;
}

export interface OwnerDiscovery {
  ownerName?: string;
  title?: string;
  confidence: 'CONFIRMED' | 'PROBABLE' | 'UNVERIFIED';
  source?: string;
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    yelp?: string;
  };
}

export interface WebsiteAudit {
  hasWebsite: boolean;
  hasSsl?: boolean;
  isMobileResponsive?: boolean;
  cmsDetected?: string;
  pageSpeedScore?: number;
  staleCopyrightYear?: number;
  issuesDetected?: string[];
}

export interface OutreachKit {
  coldEmailSubject: string;
  coldEmailBody: string;
  smsPitch: string;
  phoneScript: {
    gatekeeperHook: string;
    ownerPitch: string;
    objectionHandler: string;
  };
  mockupSlug: string;
  mockupUrl: string;
  mockupScreenshotUrl?: string;
  htmlEmailBody?: string;
}

export interface Lead {
  id: string;
  placeId: string;
  businessName: string;
  category: string;
  address: string;
  city: string;
  phone: string;
  rating: number;
  reviewCount: number;
  reviews: LeadReview[];
  website: string | null;
  googleMapsUrl: string;
  
  opportunityScore: number;
  scoreBreakdown: Array<{ reason: string; points: number }>;

  phoneIntelligence: PhoneIntelligence;
  ownerDiscovery: OwnerDiscovery;
  websiteAudit: WebsiteAudit;
  outreach?: OutreachKit;

  pipeline: {
    stage: PipelineStage;
    lastContactedAt?: string;
    notes?: string[];
    callLogs?: Array<{ date: string; summary: string; outcome: string }>;
  };

  createdAt: string;
  updatedAt: string;
}

export interface SearchQuery {
  niche: string;
  city: string;
  filterNoWebsite?: boolean;
  maxReviews?: number;
  minRating?: number;
  useMock?: boolean;
}
