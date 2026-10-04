import { Lead } from '@/types/lead';

export interface SyncPayload {
  platform: 'instantly' | 'smartlead' | 'webhook' | 'plunk';
  apiKey?: string;
  campaignId?: string;
  webhookUrl?: string;
  plunkUrl?: string;
  plunkEvent?: string;
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

/**
 * Syncs leads to self-hosted Plunk (e.g. https://smtp.geotasky.com/api/v1/track)
 */
export async function pushToPlunk(
  leads: Lead[],
  apiKey: string,
  hostUrl: string = 'https://smtp.geotasky.com',
  eventName: string = 'lead_discovered',
  hostOrigin: string = 'http://localhost:3000'
): Promise<{ success: boolean; synced: number; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Plunk Secret API Key (sk_...) is required.');
  }

  // Ensure host URL format is clean
  let cleanHost = (hostUrl || 'https://smtp.geotasky.com').trim().replace(/\/+$/, '');
  let targetEndpoint = cleanHost;
  if (!targetEndpoint.endsWith('/track')) {
    if (targetEndpoint.endsWith('/api/v1')) {
      targetEndpoint = `${targetEndpoint}/track`;
    } else if (targetEndpoint.endsWith('/v1')) {
      targetEndpoint = `${targetEndpoint}/track`;
    } else {
      targetEndpoint = `${targetEndpoint}/api/v1/track`;
    }
  }

  let syncedCount = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const record = formatLeadForOutreach(lead, hostOrigin);
    const email = (lead.email && lead.email.trim() !== '') ? lead.email.trim() : record.email;

    if (!email) {
      continue;
    }

    // Strict string sanitization: Plunk enforces that every metadata key in data
    // can ONLY be a string or array of strings (no raw numbers, booleans, or nulls)
    const rawData: Record<string, unknown> = {
      companyName: lead.businessName || '',
      businessName: lead.businessName || '',
      firstName: record.first_name || '',
      lastName: record.last_name || '',
      ownerName: lead.ownerDiscovery?.ownerName || '',
      phone: lead.phone || '',
      city: lead.city || '',
      category: lead.category || '',
      website: lead.website || '',
      opportunityScore: String(lead.opportunityScore ?? 0),
      lineType: String(lead.phoneIntelligence?.lineType || 'UNKNOWN'),
      websitePreviewUrl: record.website_preview_url || '',
      coldEmailSubject: record.cold_email_subject || '',
      coldEmailBody: record.cold_email_body || '',
      source: 'LeadHunter Engine',
    };

    const sanitizedData: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawData)) {
      if (val !== undefined && val !== null) {
        sanitizedData[key] = String(val);
      }
    }

    const payload = {
      email,
      subscribed: true,
      event: (eventName && eventName.trim()) ? eventName.trim() : 'lead_discovered',
      data: sanitizedData,
    };

    try {
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        syncedCount++;
      } else {
        const text = await res.text();
        let parsedMessage = text;
        try {
          const jsonErr = JSON.parse(text);
          if (jsonErr.message) parsedMessage = jsonErr.message;
        } catch {
          // keep text
        }
        errors.push(`${lead.businessName} (${email}): ${res.status} ${parsedMessage}`);
      }
    } catch (err: any) {
      errors.push(`${lead.businessName}: ${err?.message || 'Network error'}`);
    }
  }

  if (syncedCount === 0 && errors.length > 0) {
    throw new Error(`Failed to sync to Plunk: ${errors[0]}`);
  }

  return { success: true, synced: syncedCount };
}

