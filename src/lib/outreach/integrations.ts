import { Lead } from '@/types/lead';

export interface SyncPayload {
  platform: 'instantly' | 'smartlead' | 'webhook';
  apiKey?: string;
  campaignId?: string;
  webhookUrl?: string;
  hostOrigin?: string;
}

export interface LeadOutreachRecord {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  line_type: string;
  city: string;
  category: string;
  opportunity_score: number;
  website_preview_url: string;
  mockup_screenshot_url: string;
  best_review: string;
  cold_email_subject: string;
  cold_email_body: string;
  sms_pitch: string;
}

export function formatLeadForOutreach(lead: Lead, hostOrigin: string = 'http://localhost:3000'): LeadOutreachRecord {
  const ownerFullName = lead.ownerDiscovery?.ownerName || 'Business Owner';
  const nameParts = ownerFullName.split(' ');
  const firstName = nameParts[0] || 'there';
  const lastName = nameParts.slice(1).join(' ') || '';

  const mockupUrl = lead.outreach?.mockupUrl || `${hostOrigin}/preview/${lead.id}`;
  const screenshotUrl = lead.outreach?.mockupScreenshotUrl
    ? `${hostOrigin}${lead.outreach.mockupScreenshotUrl}`
    : `${hostOrigin}/screenshots/${lead.id}.png`;

  const bestReview = lead.reviews && lead.reviews.length > 0 ? lead.reviews[0].text : '';

  // Extract or simulate business email
  const slug = lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = lead.website
    ? `contact@${lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}`
    : `info@${slug}.com`;

  return {
    email,
    first_name: firstName,
    last_name: lastName,
    company_name: lead.businessName,
    phone: lead.phone || '',
    line_type: lead.phoneIntelligence?.lineType || 'UNKNOWN',
    city: lead.city,
    category: lead.category,
    opportunity_score: lead.opportunityScore,
    website_preview_url: mockupUrl,
    mockup_screenshot_url: screenshotUrl,
    best_review: bestReview,
    cold_email_subject: lead.outreach?.coldEmailSubject || `Website demo for ${lead.businessName}`,
    cold_email_body: lead.outreach?.coldEmailBody || '',
    sms_pitch: lead.outreach?.smsPitch || '',
  };
}

/**
 * Syncs leads to Instantly.ai Campaigns
 */
export async function pushToInstantly(
  leads: Lead[],
  apiKey: string,
  campaignId: string,
  hostOrigin: string
): Promise<{ success: boolean; synced: number; error?: string }> {
  if (!apiKey || !campaignId) {
    throw new Error('Instantly API Key and Campaign ID are required.');
  }

  const formattedLeads = leads.map((l) => {
    const record = formatLeadForOutreach(l, hostOrigin);
    return {
      email: record.email,
      first_name: record.first_name,
      last_name: record.last_name,
      company_name: record.company_name,
      phone: record.phone,
      custom_variables: {
        website_preview_url: record.website_preview_url,
        mockup_screenshot_url: record.mockup_screenshot_url,
        best_review: record.best_review,
        opportunity_score: record.opportunity_score,
        city: record.city,
        line_type: record.line_type,
      },
    };
  });

  const url = `https://api.instantly.ai/api/v1/lead/add`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      campaign_id: campaignId,
      skip_if_in_workspace: false,
      leads: formattedLeads,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Instantly API returned ${response.status}: ${errText}`);
  }

  return { success: true, synced: formattedLeads.length };
}

/**
 * Syncs leads to Smartlead.ai Campaigns
 */
export async function pushToSmartlead(
  leads: Lead[],
  apiKey: string,
  campaignId: string,
  hostOrigin: string
): Promise<{ success: boolean; synced: number; error?: string }> {
  if (!apiKey || !campaignId) {
    throw new Error('Smartlead API Key and Campaign ID are required.');
  }

  const leadList = leads.map((l) => {
    const record = formatLeadForOutreach(l, hostOrigin);
    return {
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
      phone_number: record.phone,
      company_name: record.company_name,
      custom_fields: {
        mockup_url: record.website_preview_url,
        screenshot_url: record.mockup_screenshot_url,
        best_review: record.best_review,
        score: record.opportunity_score,
        city: record.city,
      },
    };
  });

  const url = `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads?api_key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_list: leadList }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Smartlead API returned ${response.status}: ${errText}`);
  }

  return { success: true, synced: leadList.length };
}

/**
 * Syncs leads to Custom Webhook (Zapier, Make, n8n)
 */
export async function pushToWebhook(
  leads: Lead[],
  webhookUrl: string,
  hostOrigin: string
): Promise<{ success: boolean; synced: number; error?: string }> {
  if (!webhookUrl) {
    throw new Error('Webhook URL is required.');
  }

  const payload = {
    source: 'LeadHunter Engine',
    timestamp: new Date().toISOString(),
    count: leads.length,
    leads: leads.map((l) => formatLeadForOutreach(l, hostOrigin)),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'LeadHunter-Engine/2.0',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Webhook returned status ${response.status}: ${errText}`);
  }

  return { success: true, synced: leads.length };
}
