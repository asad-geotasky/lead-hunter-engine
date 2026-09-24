import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { testSmtpConnection, getSystemSmtpConfig } from '@/lib/auth/systemMailer';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const config = await getSystemSmtpConfig();
    const hasConfig = Boolean(config && config.smtpHost && config.smtpUser);

    return NextResponse.json({
      configured: hasConfig,
      config: hasConfig
        ? {
            smtpHost: config!.smtpHost,
            smtpPort: config!.smtpPort,
            smtpSecure: config!.smtpSecure,
            smtpUser: config!.smtpUser,
            smtpPass: config!.smtpPass ? '••••••••' : '',
            smtpFrom: config!.smtpFrom,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching system SMTP config:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch SMTP config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Only logged in users (or admin) can change SMTP settings
    // If no users exist yet, allow initial configuration
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      const session = await getCurrentUser();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
      }
    }

    const body = await req.json();
    const {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFrom,
      testOnly,
    } = body;

    if (!smtpHost || !smtpPort || !smtpUser) {
      return NextResponse.json({ error: 'Host, Port, and User are required.' }, { status: 400 });
    }

    // If password is kept as '••••••••', retrieve existing pass from DB
    let actualPass = smtpPass;
    if (smtpPass === '••••••••' || !smtpPass) {
      const existing = await prisma.systemSetting.findUnique({
        where: { id: 'system_config' },
      });
      if (existing?.smtpPass) {
        actualPass = existing.smtpPass;
      }
    }

    const configToTest = {
      smtpHost: smtpHost.trim(),
      smtpPort: parseInt(smtpPort, 10),
      smtpSecure: Boolean(smtpSecure),
      smtpUser: smtpUser.trim(),
      smtpPass: actualPass,
      smtpFrom: (smtpFrom || smtpUser).trim(),
    };

    // If testOnly flag is provided, test connection and return
    if (testOnly) {
      const testResult = await testSmtpConnection(configToTest);
      return NextResponse.json(testResult);
    }

    // Optionally test before saving or save directly
    const testResult = await testSmtpConnection(configToTest);
    if (!testResult.success) {
      return NextResponse.json(
        { error: `SMTP verification test failed: ${testResult.message}. Please check your credentials.` },
        { status: 400 }
      );
    }

    // Upsert system setting
    await prisma.systemSetting.upsert({
      where: { id: 'system_config' },
      update: {
        smtpHost: configToTest.smtpHost,
        smtpPort: configToTest.smtpPort,
        smtpSecure: configToTest.smtpSecure,
        smtpUser: configToTest.smtpUser,
        smtpPass: configToTest.smtpPass,
        smtpFrom: configToTest.smtpFrom,
      },
      create: {
        id: 'system_config',
        smtpHost: configToTest.smtpHost,
        smtpPort: configToTest.smtpPort,
        smtpSecure: configToTest.smtpSecure,
        smtpUser: configToTest.smtpUser,
        smtpPass: configToTest.smtpPass,
        smtpFrom: configToTest.smtpFrom,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'System SMTP configuration saved and tested successfully!',
    });
  } catch (error: any) {
    console.error('Error saving system SMTP config:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update SMTP settings.' },
      { status: 500 }
    );
  }
}
