import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead } from '@/lib/storage';
import { captureLeadMockup } from '@/lib/screenshot';
import fs from 'fs';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lead = await getLeadById(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${host}`;

    const screenshotUrl = await captureLeadMockup(id, origin);

    // Update lead outreach record with screenshot URL
    if (lead.outreach) {
      const updatedOutreach = {
        ...lead.outreach,
        mockupScreenshotUrl: screenshotUrl,
      };
      await updateLead(id, { outreach: updatedOutreach });
    }

    return NextResponse.json({
      success: true,
      screenshotUrl,
      fullUrl: `${origin}${screenshotUrl}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Screenshot generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filePath = path.join(process.cwd(), 'public', 'screenshots', `${id}.png`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Screenshot not yet generated' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error retrieving screenshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
