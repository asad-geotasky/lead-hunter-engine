import { Lead, OutreachKit } from '@/types/lead';

export function generateOutreachKit(lead: Lead, hostOrigin: string = 'http://localhost:3000'): OutreachKit {
  const owner = lead.ownerDiscovery?.ownerName || 'Business Owner';
  const ownerFirst = owner.split(' ')[0] || 'there';
  const business = lead.businessName;
  const city = lead.city;
  const niche = lead.category || 'service';
  const mockupSlug = lead.id;
  const mockupUrl = `${hostOrigin}/preview/${mockupSlug}`;
  const mockupScreenshotUrl = `/screenshots/${mockupSlug}.png`;
  const fullScreenshotUrl = `${hostOrigin}${mockupScreenshotUrl}`;
  const isMobile = lead.phoneIntelligence?.lineType === 'MOBILE';

  // 1. Cold Email (Question -> Site Demo -> Visual Snapshot -> Offer)
  const coldEmailSubject = `Quick question regarding ${business} in ${city} (site preview)`;
  
  const bestReview = lead.reviews[0]?.text
    ? `"${lead.reviews[0].text.slice(0, 100)}..."`
    : `the great ${lead.rating}★ feedback your customers leave you`;

  const coldEmailBody = `Hi ${ownerFirst},

I was looking for top-rated ${niche} services in ${city} and came across ${business}. Your customer reviews are impressive—especially noting ${bestReview}.

I noticed you don't have a modern website linked to your Google profile, which means you're likely losing 10-15 direct call inquiries every month to competitors who show up with instant mobile booking.

Instead of just pitching you, my team actually mocked up a custom, mobile-friendly landing page for ${business} using your real reviews and services:

👉 View Your Live Preview: ${mockupUrl}
📸 (I've also attached a snapshot preview of the design for your convenience).

Are you open to a quick 3-minute chat this week to see how this could bring you 5-10 extra booked jobs per month? (No cost or commitment either way).

Best regards,
Agency Lead Engine`;

  // 2. Rich HTML Email (Ready to paste into Gmail / Outlook / Instantly / Smartlead)
  const htmlEmailBody = `
<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; max-width: 600px;">
  <p>Hi ${ownerFirst},</p>
  <p>I was looking for top-rated ${niche} services in ${city} and came across <strong>${business}</strong>. Your customer reviews are impressive—especially noting ${bestReview}.</p>
  <p>I noticed you don't have a modern website linked to your Google profile, which means you're likely losing 10-15 direct calls every month to competitors.</p>
  <p>Instead of just pitching you, my team mocked up a custom, mobile-friendly website demo for <strong>${business}</strong>:</p>
  
  <div style="margin: 20px 0; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    <a href="${mockupUrl}" target="_blank" style="text-decoration: none; display: block;">
      <img src="${fullScreenshotUrl}" alt="Website Mockup for ${business}" style="width: 100%; height: auto; display: block; border-bottom: 1px solid #e2e8f0;" />
      <div style="background-color: #2563eb; color: #ffffff; text-align: center; padding: 12px; font-weight: bold; font-size: 14px;">
        👉 Click Here to Test Your Live Interactive Demo &rarr;
      </div>
    </a>
  </div>

  <p>Are you open to a quick 3-minute chat this week to see how this could bring you 5-10 extra booked jobs per month? (No cost or commitment either way).</p>
  <p>Best regards,<br/><strong>Agency Lead Engine</strong></p>
</div>
`.trim();

  // 3. Direct SMS Pitch
  const smsPitch = isMobile
    ? `Hey ${ownerFirst}, saw ${business} on Google in ${city}. Love the reviews! Built you a quick free demo website preview so local customers can book you faster: ${mockupUrl} - let me know what you think!`
    : `Hi ${business} team, saw your 5-star reviews in ${city}! We built a free modern website preview for you: ${mockupUrl} - would love to pass it to ${owner}!`;

  // 4. Phone Script
  const phoneScript = {
    gatekeeperHook: `Hi there! I was hoping to speak with ${owner} quickly regarding the new web preview we designed for ${business} in ${city}. Are they in today or on a job?`,
    ownerPitch: `Hey ${ownerFirst}, this is [Your Name]. I know you're busy running ${business}, so I'll be brief. I saw you guys have stellar ${lead.rating}★ reviews on Google, but no direct website for people on smartphones to book you instantly. I actually built a free working preview of what your site could look like—pulling your best reviews. It's live right now at ${mockupUrl}. Can I text or email you the link real quick to take a look?`,
    objectionHandler: `• If they say "We already get enough word-of-mouth": "That's awesome—most great ${niche} companies survive on referrals. But right now, high-paying jobs in ${city} are searching on Google and going straight to competitors. This just plugs that leak."
• If they say "Just use Facebook": "Facebook is great for existing clients, but when people have an emergency in ${city}, they search Google. A clean 1-page site converts those searchers into callers immediately."
• If they say "Send me an email": "Will do right away! What's the best email address where you check notifications personally?"`,
  };

  return {
    coldEmailSubject,
    coldEmailBody,
    htmlEmailBody,
    smsPitch,
    phoneScript,
    mockupSlug,
    mockupUrl,
    mockupScreenshotUrl,
  };
}
