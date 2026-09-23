import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampaigns,
  getAllLeads,
  getAllMailboxes,
  getCampaignEmailLogs,
  updateCampaignStatus,
} from '@/lib/storage';
import { selectBestMailbox, sendColdEmail } from '@/lib/outreach/mailer';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await req.json().catch(() => ({}));
    const { singleLeadId, testEmail, maxToSend = 10 } = body;

    const campaigns = await getAllCampaigns();
    const campaign = campaigns.find((c) => c.id === campaignId);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    let mailboxes = await getAllMailboxes();
    const activeMailboxes = mailboxes.filter((m) => m.isActive);

    if (activeMailboxes.length === 0) {
      return NextResponse.json(
        { error: 'No active mailboxes configured. Please add at least one Gmail/SMTP mailbox in Settings.' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Test send scenario
    if (testEmail) {
      const bestMb = selectBestMailbox(activeMailboxes);
      if (!bestMb) {
        return NextResponse.json(
          { error: 'All configured mailboxes have exceeded their daily limit today.' },
          { status: 429 }
        );
      }

      // Create dummy or first lead for test
      const allLeads = await getAllLeads({ projectId: campaign.projectId });
      const sampleLead = allLeads[0] || {
        id: 'test_lead_001',
        placeId: 'sample_place',
        businessName: 'Sample Restaurant & Bar',
        category: 'Restaurant',
        address: '123 Main St, New York, NY',
        city: 'New York',
        phone: '+1 212-555-0199',
        email: testEmail,
        rating: 4.8,
        reviewCount: 154,
        reviews: [],
        website: 'https://example.com',
        googleMapsUrl: '',
        opportunityScore: 85,
        scoreBreakdown: [],
        phoneIntelligence: { lineType: 'MOBILE', isCallableMobile: true, confidence: 'HIGH' },
        ownerDiscovery: { ownerName: 'John Doe', confidence: 'CONFIRMED' },
        websiteAudit: { hasWebsite: true },
        pipeline: { stage: 'DISCOVERED' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await sendColdEmail({
        mailbox: bestMb,
        lead: { ...sampleLead, email: testEmail },
        subject: campaign.subject,
        body: campaign.bodyTemplate,
        campaignId: campaign.id,
        baseUrl,
      });

      return NextResponse.json({
        success: result.success,
        error: result.error,
        message: result.success ? `Test email sent successfully via ${bestMb.email}!` : result.error,
      });
    }

    // Full or partial batch campaign send
    let targetLeads = await getAllLeads({ projectId: campaign.projectId });
    if (singleLeadId) {
      targetLeads = targetLeads.filter((l) => l.id === singleLeadId);
    }

    // Exclude leads already sent in this campaign
    const existingLogs = await getCampaignEmailLogs(campaignId);
    const sentLeadIds = new Set(
      existingLogs.filter((l) => l.status === 'SENT').map((l) => l.leadId)
    );

    const unsentLeads = targetLeads.filter(
      (l) => l.email && l.email.includes('@') && !sentLeadIds.has(l.id)
    );

    if (unsentLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending leads with valid email addresses to send in this project.',
        sent: 0,
        failed: 0,
      });
    }

    await updateCampaignStatus(campaignId, 'RUNNING');

    let sentCount = 0;
    let failedCount = 0;
    const leadsToProcess = unsentLeads.slice(0, maxToSend);

    for (const lead of leadsToProcess) {
      // Refresh mailboxes to get updated sentToday counts
      mailboxes = await getAllMailboxes();
      const currentBest = selectBestMailbox(mailboxes);

      if (!currentBest) {
        // Daily limit exhausted across all mailboxes
        break;
      }

      const res = await sendColdEmail({
        mailbox: currentBest,
        lead,
        subject: campaign.subject,
        body: campaign.bodyTemplate,
        campaignId: campaign.id,
        baseUrl,
      });

      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    await updateCampaignStatus(campaignId, 'COMPLETED');

    return NextResponse.json({
      success: true,
      message: `Batch send finished: ${sentCount} sent, ${failedCount} failed.`,
      sent: sentCount,
      failed: failedCount,
      totalRemaining: unsentLeads.length - sentCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error executing campaign send';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
