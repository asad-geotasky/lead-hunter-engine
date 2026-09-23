import { Lead } from '@/types/lead';
import { analyzePhoneNumber } from './phoneLookup';
import { discoverOwnerDetails } from './ownerLookup';
import { auditWebsite } from './websiteAudit';
import { calculateOpportunityScore } from '../scoring';

export async function enrichLead(
  lead: Lead,
  config?: {
    twilioSid?: string;
    twilioToken?: string;
    openCorporatesKey?: string;
  }
): Promise<Lead> {
  // 1. Phone Intelligence
  const phoneIntelligence = await analyzePhoneNumber(
    lead.phone,
    config?.twilioSid,
    config?.twilioToken
  );

  // 2. Owner & Social Footprint
  const ownerDiscovery = await discoverOwnerDetails(
    lead.businessName,
    lead.city,
    config?.openCorporatesKey
  );

  // 3. Technical Website Audit (if website exists)
  const websiteAudit = await auditWebsite(lead.website);

  const updatedLead: Lead = {
    ...lead,
    phoneIntelligence,
    ownerDiscovery,
    websiteAudit,
    updatedAt: new Date().toISOString(),
  };

  // 4. Recalculate Opportunity Score with fresh signals
  const scoreResult = calculateOpportunityScore(updatedLead);
  updatedLead.opportunityScore = scoreResult.score;
  updatedLead.scoreBreakdown = scoreResult.breakdown;

  if (updatedLead.pipeline.stage === 'DISCOVERED') {
    updatedLead.pipeline.stage = 'ENRICHED';
  }

  return updatedLead;
}
