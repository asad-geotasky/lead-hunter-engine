import { Lead } from '@/types/lead';

export function calculateOpportunityScore(lead: Partial<Lead>): {
  score: number;
  breakdown: Array<{ reason: string; points: number }>;
} {
  const breakdown: Array<{ reason: string; points: number }> = [];
  let score = 0;

  // 1. Web Presence Intent Signal
  if (!lead.website || lead.website.trim() === '') {
    score += 35;
    breakdown.push({ reason: 'No website listed (Prime Web-Dev Target)', points: 35 });
  } else {
    // If they have a website, check audit signals
    if (lead.websiteAudit) {
      if (lead.websiteAudit.hasSsl === false) {
        score += 15;
        breakdown.push({ reason: 'Website lacks SSL (Insecure HTTP)', points: 15 });
      }
      if (lead.websiteAudit.isMobileResponsive === false) {
        score += 15;
        breakdown.push({ reason: 'Website is not mobile responsive', points: 15 });
      }
      if (lead.websiteAudit.staleCopyrightYear && lead.websiteAudit.staleCopyrightYear < 2022) {
        score += 10;
        breakdown.push({
          reason: `Outdated website copyright (${lead.websiteAudit.staleCopyrightYear})`,
          points: 10,
        });
      }
    }
  }

  // 2. Review Profile (The "Top Drawer" opportunity: good rating, needs more scale)
  const rating = lead.rating || 0;
  const reviewCount = lead.reviewCount || 0;

  if (rating >= 4.0 && reviewCount > 0 && reviewCount <= 20) {
    score += 20;
    breakdown.push({
      reason: `High rating (${rating}★) with low review count (${reviewCount}) - primed for digital expansion`,
      points: 20,
    });
  } else if (reviewCount === 0) {
    score += 10;
    breakdown.push({ reason: 'Zero Google reviews listed (Fresh or unclaimed presence)', points: 10 });
  } else if (rating >= 4.5) {
    score += 10;
    breakdown.push({ reason: `Exceptional reputation (${rating}★)`, points: 10 });
  }

  // 3. Phone Intelligence
  if (lead.phoneIntelligence?.isCallableMobile) {
    score += 15;
    breakdown.push({ reason: 'Verified direct mobile number (Enables direct SMS & owner calls)', points: 15 });
  } else if (lead.phone && lead.phone.length > 5) {
    score += 5;
    breakdown.push({ reason: 'Direct business phone available', points: 5 });
  }

  // 4. Owner Discovery
  if (lead.ownerDiscovery?.ownerName) {
    score += 15;
    breakdown.push({
      reason: `Owner identified: ${lead.ownerDiscovery.ownerName} (${lead.ownerDiscovery.source || 'Registry'})`,
      points: 15,
    });
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    breakdown,
  };
}
