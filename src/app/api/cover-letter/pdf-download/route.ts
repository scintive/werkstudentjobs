import { NextRequest, NextResponse } from 'next/server';

// Lazy import puppeteer to avoid bundling issues
let _puppeteer: any = null;
let _chromium: any = null;

// Try puppeteer-core first (for Vercel), fallback to puppeteer (for local)
async function getPuppeteer() {
  if (_puppeteer) return _puppeteer;
  try {
    // Try puppeteer-core first (needed for @sparticuz/chromium)
    _puppeteer = (await import('puppeteer-core')).default;
    console.log('✅ Using puppeteer-core');
  } catch (e) {
    try {
      // Fallback to regular puppeteer for local development
      _puppeteer = (await import('puppeteer')).default;
      console.log('✅ Using puppeteer');
    } catch (e2) {
      console.error('🐛 Failed to import puppeteer (cover letter):', e2);
      throw new Error('Puppeteer not available');
    }
  }
  return _puppeteer;
}

async function getChromium() {
  if (_chromium) return _chromium;
  // Only use chromium on Vercel (production)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const chromiumModule = await import('@sparticuz/chromium');
      _chromium = chromiumModule.default;
      console.log('✅ Using @sparticuz/chromium for serverless');
    } catch (e) {
      console.log('⚠️ @sparticuz/chromium not available');
      return null;
    }
  }
  return _chromium;
}

/**
 * POST /api/cover-letter/pdf-download
 * Generate beautiful PDF from cover letter with professional templates
 */
export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const body = await request.json();
    const { coverLetter, userProfile, job, template = 'professional' } = body;

    if (!coverLetter || !userProfile || !job) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate filename: UserFullName_CompanyName_CoverLetter.pdf
    const userName = (userProfile.personalInfo?.name || userProfile.name || 'User')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    const companyName = (job.companies?.name || job.company_name || 'Company')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    const filename = `${userName}_${companyName}_CoverLetter.pdf`;

    console.log('📄 Cover letter filename:', filename);

    // Generate HTML from template
    const html = generateCoverLetterHTML(coverLetter, userProfile, job, template);

    // Launch Puppeteer with serverless Chrome if on Vercel
    const puppeteer = await getPuppeteer();
    const chromium = await getChromium();
    
    const launchOptions: any = {
      headless: chromium?.headless !== undefined ? chromium.headless : true,
      args: chromium 
        ? [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox']
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
      defaultViewport: chromium?.defaultViewport
    };

    // Use serverless Chrome executable on Vercel
    if (chromium) {
      launchOptions.executablePath = await chromium.executablePath();
      console.log('✅ Chromium executable path:', launchOptions.executablePath);
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    // Return PDF with proper filename
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Cover letter PDF generation failed:', error);
    return NextResponse.json(
      { error: 'PDF generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateCoverLetterHTML(
  coverLetter: any,
  userProfile: any,
  job: any,
  template: string
): string {
  const templates = {
    professional: generateProfessionalTemplate,
    modern: generateModernTemplate,
    elegant: generateElegantTemplate,
    minimal: generateMinimalTemplate
  };

  const generator = templates[template as keyof typeof templates] || templates.professional;
  return generator(coverLetter, userProfile, job);
}

function generateProfessionalTemplate(coverLetter: any, userProfile: any, job: any): string {
  const fullText = `${coverLetter.content.intro}\n\n${coverLetter.content.body_paragraphs.join('\n\n')}\n\n${coverLetter.content.closing}`;
  const today = new Date().toLocaleDateString('de-DE');

  // Extract user info from either personalInfo object or direct properties
  const userName = userProfile.personalInfo?.name || userProfile.name || 'Your Name';
  const userEmail = userProfile.personalInfo?.email || userProfile.email || 'email@example.com';
  const userPhone = userProfile.personalInfo?.phone || userProfile.phone || '';
  const userLocation = userProfile.personalInfo?.location || userProfile.location || 'Your City, Germany';

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Cover Letter - ${userName}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm 2.5cm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1a1a1a;
          background: white;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.8cm;
        }
        .sender h1 {
          font-size: 16pt;
          font-weight: normal;
          color: #1e40af;
          margin-bottom: 0.2cm;
        }
        .sender-details {
          font-size: 9pt;
          color: #4b5563;
          line-height: 1.4;
        }
        .right-column {
          text-align: right;
        }
        .recipient-compact {
          margin-bottom: 0.5cm;
        }
        .recipient-compact h2 {
          font-size: 10pt;
          font-weight: normal;
          color: #1f2937;
          margin-bottom: 0.1cm;
        }
        .recipient-compact p {
          font-size: 8.5pt;
          color: #4b5563;
          line-height: 1.3;
        }
        .date {
          font-size: 9pt;
          color: #6b7280;
          margin-top: 0.3cm;
        }
        .separator-line {
          border-bottom: 2px solid #2563eb;
          margin-bottom: 0.6cm;
        }
        .subject {
          font-weight: normal;
          margin-bottom: 0.7cm;
          padding: 0.2cm 0;
          font-size: 10pt;
        }
        .salutation {
          margin-bottom: 0.5cm;
        }
        .content p {
          margin-bottom: 0.6cm;
          text-align: justify;
          line-height: 1.6;
        }
        .closing {
          margin-top: 0.8cm;
        }
        .closing p {
          font-weight: normal;
        }
        .signature-space + p {
          font-weight: normal;
        }
        .signature-space {
          margin-top: 1.2cm;
          margin-bottom: 0.2cm;
        }
      </style>
    </head>
    <body>
      <div class="header-row">
        <div class="sender">
          <h1>${userName}</h1>
          <div class="sender-details">
            ${userEmail}${userPhone ? ` • ${userPhone}` : ''}<br>
            ${userLocation}
          </div>
        </div>
        <div class="right-column">
          <div class="recipient-compact">
            <h2>${job.companies?.name || job.company_name || 'Hiring Manager'}</h2>
            <p>${job.location_street || ''}</p>
            <p>${job.location_zip ? job.location_zip + ' ' : ''}${job.location_city || ''}</p>
          </div>
          <div class="date">${today}</div>
        </div>
      </div>

      <div class="separator-line"></div>

      <div class="subject">
        ${coverLetter.content.subject || `Application for ${job.title}`}
      </div>

      <div class="content">
        <div class="salutation">${coverLetter.content.salutation || 'Dear Hiring Team'},</div>

        ${fullText.split('\n\n').map(para => `<p>${para}</p>`).join('')}
      </div>

      <div class="closing">
        <p>${coverLetter.content.sign_off || 'Mit freundlichen Grüßen'}</p>
        <div class="signature-space"></div>
        <p>${userName}</p>
      </div>
    </body>
    </html>
  `;
}

function generateModernTemplate(coverLetter: any, userProfile: any, job: any): string {
  const fullText = `${coverLetter.content.intro}\n\n${coverLetter.content.body_paragraphs.join('\n\n')}\n\n${coverLetter.content.closing}`;
  const today = new Date().toLocaleDateString('de-DE');

  // Extract user info from either personalInfo object or direct properties
  const userName = userProfile.personalInfo?.name || userProfile.name || 'Your Name';
  const userEmail = userProfile.personalInfo?.email || userProfile.email || 'email@example.com';
  const userPhone = userProfile.personalInfo?.phone || userProfile.phone || '';
  const userLocation = userProfile.personalInfo?.location || userProfile.location || 'Your City, Germany';

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Cover Letter - ${userName}</title>
      <style>
        @page {
          size: A4;
          margin: 0 2cm 2cm 6cm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.7;
          color: #0f172a;
          background: white;
        }
        .sidebar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6cm;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          color: white;
          padding: 2cm 1.5cm;
        }
        .sidebar h1 {
          font-size: 20pt;
          font-weight: normal;
          margin-bottom: 0.5cm;
          line-height: 1.2;
        }
        .sidebar-details {
          font-size: 9pt;
          line-height: 1.5;
          opacity: 0.95;
        }
        .sidebar-details p {
          margin-bottom: 0.3cm;
        }
        .main {
          margin-left: 6cm;
          padding: 2cm 2cm 2cm 2.5cm;
        }
        .date {
          font-size: 10pt;
          color: #64748b;
          margin-bottom: 1cm;
        }
        .recipient {
          margin-bottom: 1.2cm;
        }
        .recipient h2 {
          font-size: 13pt;
          font-weight: normal;
          color: #0f172a;
          margin-bottom: 0.2cm;
        }
        .recipient p {
          font-size: 10pt;
          color: #64748b;
        }
        .subject {
          background: #f1f5f9;
          padding: 0.4cm 0.6cm;
          border-left: 4px solid #0ea5e9;
          margin-bottom: 1cm;
          font-weight: normal;
        }
        .content p {
          margin-bottom: 0.7cm;
          text-align: justify;
        }
        .closing {
          margin-top: 1.2cm;
        }
        .signature {
          margin-top: 1.5cm;
          font-weight: normal;
        }
        .keywords {
          position: absolute;
          bottom: 1.5cm;
          left: 8.5cm;
          right: 2cm;
          padding: 0.5cm;
          background: #f8fafc;
          border-radius: 0.3cm;
          font-size: 9pt;
          color: #64748b;
        }
        .keywords strong {
          color: #0ea5e9;
        }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <h1>${userName}</h1>
        <div class="sidebar-details">
          <p>${userEmail}</p>
          ${userPhone ? `<p>${userPhone}</p>` : ''}
          <p>${userLocation}</p>
        </div>
      </div>

      <div class="main">
        <div class="date">${today}</div>

        <div class="recipient">
          <h2>${job.companies?.name || job.company_name || 'Hiring Manager'}</h2>
          <p>${job.location_city || 'City'}</p>
        </div>

        <div class="subject">
          Application for ${job.title}
        </div>

        <div class="content">
          <p>Dear Hiring Team,</p>
          ${fullText.split('\n\n').map(para => `<p>${para}</p>`).join('')}
        </div>

        <div class="closing">
          <p>${coverLetter.content.sign_off || 'Best regards'}</p>
          <div class="signature">${userName}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateElegantTemplate(coverLetter: any, userProfile: any, job: any): string {
  const fullText = `${coverLetter.content.intro}\n\n${coverLetter.content.body_paragraphs.join('\n\n')}\n\n${coverLetter.content.closing}`;
  const today = new Date().toLocaleDateString('de-DE');

  // Extract user info from either personalInfo object or direct properties
  const userName = userProfile.personalInfo?.name || userProfile.name || 'Your Name';
  const userEmail = userProfile.personalInfo?.email || userProfile.email || 'email@example.com';
  const userPhone = userProfile.personalInfo?.phone || userProfile.phone || '';
  const userLocation = userProfile.personalInfo?.location || userProfile.location || 'Your City, Germany';

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Cover Letter - ${userName}</title>
      <style>
        @page {
          size: A4;
          margin: 2.5cm 3cm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #1e293b;
          background: #fdfbf7;
        }
        .header {
          text-align: center;
          margin-bottom: 1cm;
          padding-bottom: 0.6cm;
          border-bottom: 1px solid #d4af37;
        }
        .header h1 {
          font-size: 18pt;
          font-weight: normal;
          color: #0f172a;
          margin-bottom: 0.3cm;
          letter-spacing: 0.05em;
        }
        .header-details {
          font-size: 9pt;
          color: #64748b;
          font-family: 'Inter', Arial, sans-serif;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #d4af37, transparent);
          margin: 0.6cm 0;
        }
        .recipient {
          margin-bottom: 0.6cm;
          font-family: 'Inter', Arial, sans-serif;
        }
        .recipient h2 {
          font-size: 11pt;
          font-weight: normal;
          color: #0f172a;
          margin-bottom: 0.2cm;
        }
        .subject {
          font-style: italic;
          color: #64748b;
          margin-bottom: 0.7cm;
          font-size: 10pt;
        }
        .content p {
          margin-bottom: 0.6cm;
          text-align: justify;
          hyphens: auto;
        }
        .content p:first-letter {
          font-size: 150%;
          font-weight: normal;
          color: #d4af37;
        }
        .closing {
          margin-top: 1.5cm;
          font-family: 'Inter', Arial, sans-serif;
        }
        .signature {
          margin-top: 2cm;
          text-align: right;
          font-style: italic;
        }
        .footer {
          position: absolute;
          bottom: 2cm;
          left: 3cm;
          right: 3cm;
          text-align: center;
          font-size: 9pt;
          color: #94a3b8;
          font-family: 'Inter', Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${userName}</h1>
        <div class="header-details">
          ${userEmail}${userPhone ? ` • ${userPhone}` : ''} • ${userLocation}
        </div>
      </div>

      <div class="recipient">
        <h2>${job.companies?.name || job.company_name || 'Hiring Manager'}</h2>
        <p>${job.location_city || 'City'}</p>
        <p style="margin-top: 0.5cm; font-size: 10pt;">${today}</p>
      </div>

      <div class="subject">
        RE: ${job.title}
      </div>

      <div class="divider"></div>

      <div class="content">
        ${fullText.split('\n\n').map(para => `<p>${para}</p>`).join('')}
      </div>

      <div class="closing">
        <p>${coverLetter.content.sign_off || 'With warm regards'}</p>
        <div class="signature">${userName}</div>
      </div>
    </body>
    </html>
  `;
}

function generateMinimalTemplate(coverLetter: any, userProfile: any, job: any): string {
  const fullText = `${coverLetter.content.intro}\n\n${coverLetter.content.body_paragraphs.join('\n\n')}\n\n${coverLetter.content.closing}`;
  const today = new Date().toLocaleDateString('de-DE');

  // Extract user info from either personalInfo object or direct properties
  const userName = userProfile.personalInfo?.name || userProfile.name || 'Your Name';
  const userEmail = userProfile.personalInfo?.email || userProfile.email || 'email@example.com';
  const userPhone = userProfile.personalInfo?.phone || userProfile.phone || '';

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Cover Letter - ${userName}</title>
      <style>
        @page {
          size: A4;
          margin: 2.5cm 3cm;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', 'Helvetica', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #111827;
          background: white;
        }
        .header {
          margin-bottom: 1cm;
        }
        .header h1 {
          font-size: 15pt;
          font-weight: normal;
          color: #000;
          margin-bottom: 0.2cm;
        }
        .header-details {
          font-size: 9pt;
          color: #6b7280;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1cm;
          font-size: 9pt;
          color: #6b7280;
        }
        .content p {
          margin-bottom: 0.6cm;
          text-align: justify;
          line-height: 1.6;
        }
        .closing {
          margin-top: 1cm;
        }
        .signature {
          margin-top: 1.5cm;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${userName}</h1>
        <div class="header-details">
          ${userEmail}${userPhone ? ` • ${userPhone}` : ''}
        </div>
      </div>

      <div class="meta">
        <div>
          ${job.companies?.name || job.company_name || 'Company'}<br>
          ${job.location_city || 'City'}
        </div>
        <div>${today}</div>
      </div>

      <div class="content">
        <p>RE: ${job.title}</p>
        ${fullText.split('\n\n').map(para => `<p>${para}</p>`).join('')}
      </div>

      <div class="closing">
        <p>${coverLetter.content.sign_off || 'Best regards'}</p>
        <div class="signature">${userName}</div>
      </div>
    </body>
    </html>
  `;
}
