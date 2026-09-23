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
  email?: string | null;
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

  projectId?: string | null;

  pipeline: {
    stage: PipelineStage;
    lastContactedAt?: string;
    notes?: string[];
    callLogs?: Array<{ date: string; summary: string; outcome: string }>;
  };

  createdAt: string;
  updatedAt: string;
}

export type SearchProvider = 'apify' | 'outscraper' | 'google' | 'mock';

export interface SearchQuery {
  niche: string;
  city: string;
  provider?: SearchProvider;
  apiKey?: string;
  projectId?: string;
  filterNoWebsite?: boolean;
  maxReviews?: number;
  minRating?: number;
  minScore?: number;
  limit?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  targetCity?: string | null;
  leadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Mailbox {
  id: string;
  email: string;
  senderName: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  replyTo?: string | null;
  dailyLimit: number;
  sentToday: number;
  lastResetDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  projectName?: string;
  name: string;
  subject: string;
  bodyTemplate: string;
  delaySeconds: number;
  status: 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  sentCount?: number;
  totalLeads?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  campaignId: string;
  leadId: string;
  mailboxId?: string | null;
  mailboxEmail?: string;
  recipient: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
}
