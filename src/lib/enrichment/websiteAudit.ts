import { WebsiteAudit } from '@/types/lead';

/**
 * Audits a business website for technical weaknesses and redesign opportunities.
 */
export async function auditWebsite(websiteUrl: string | null): Promise<WebsiteAudit> {
  if (!websiteUrl || websiteUrl.trim() === '') {
    return {
      hasWebsite: false,
      issuesDetected: ['No website listed on public profiles (Primary Web-Dev Opportunity)'],
    };
  }

  let formattedUrl = websiteUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timeout);

    const hasSsl = formattedUrl.startsWith('https://') && res.ok;
    const html = await res.text();
    const lowerHtml = html.toLowerCase();

    // Check viewport for mobile responsiveness
    const isMobileResponsive = lowerHtml.includes('name="viewport"') || lowerHtml.includes("name='viewport'");

    // Check CMS
    let cmsDetected = 'Custom / Unknown';
    if (lowerHtml.includes('wp-content') || lowerHtml.includes('wordpress')) {
      cmsDetected = 'WordPress (Legacy)';
    } else if (lowerHtml.includes('wix.com') || lowerHtml.includes('_wix_')) {
      cmsDetected = 'Wix';
    } else if (lowerHtml.includes('squarespace')) {
      cmsDetected = 'Squarespace';
    } else if (lowerHtml.includes('weebly')) {
      cmsDetected = 'Weebly';
    } else if (lowerHtml.includes('godaddy')) {
      cmsDetected = 'GoDaddy Website Builder';
    }

    // Check copyright year
    const copyrightMatch = html.match(/©\s*(20\d\d)/) || html.match(/copyright\s*(20\d\d)/i);
    const staleCopyrightYear = copyrightMatch ? parseInt(copyrightMatch[1], 10) : undefined;

    const issuesDetected: string[] = [];
    if (!hasSsl) issuesDetected.push('Missing or invalid SSL security certificate');
    if (!isMobileResponsive) issuesDetected.push('No mobile viewport tag detected (fails on smartphones)');
    if (staleCopyrightYear && staleCopyrightYear <= 2022) {
      issuesDetected.push(`Outdated copyright year (${staleCopyrightYear}) suggests neglected maintenance`);
    }
    if (cmsDetected.includes('Legacy') || cmsDetected.includes('GoDaddy') || cmsDetected.includes('Weebly')) {
      issuesDetected.push(`Built on restrictive platform: ${cmsDetected}`);
    }

    return {
      hasWebsite: true,
      hasSsl,
      isMobileResponsive,
      cmsDetected,
      staleCopyrightYear,
      issuesDetected,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      hasWebsite: true,
      hasSsl: false,
      isMobileResponsive: false,
      issuesDetected: [`Website failed to load: ${message}`],
    };
  }
}
