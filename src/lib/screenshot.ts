import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');

function getBrowserExecutablePath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('No compatible Chrome or Edge browser executable found on system.');
}

export async function captureLeadMockup(
  leadId: string,
  hostOrigin: string = 'http://localhost:3000'
): Promise<string> {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const outputPath = path.join(SCREENSHOTS_DIR, `${leadId}.png`);
  const executablePath = getBrowserExecutablePath();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 850,
      deviceScaleFactor: 1.5,
    });

    const targetUrl = `${hostOrigin}/preview/${leadId}`;
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    // Hide agency floating banner for clean screenshot
    await page.evaluate(() => {
      const topBanner = document.querySelector('.sticky');
      if (topBanner) {
        (topBanner as HTMLElement).style.display = 'none';
      }
    });

    // Wait a brief moment for fonts and images to settle
    await new Promise((r) => setTimeout(r, 600));

    // Capture the above-the-fold viewport (hero + value props)
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 850,
      },
    });

    return `/screenshots/${leadId}.png`;
  } finally {
    await browser.close();
  }
}
