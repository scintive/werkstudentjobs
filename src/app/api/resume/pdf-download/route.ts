import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Lazy import puppeteer to avoid bundling/runtime issues
let _puppeteer: any = null;
async function getPuppeteer() {
  if (_puppeteer) return _puppeteer;
  try {
    _puppeteer = (await import('puppeteer')).default;
  } catch (e) {
    console.error('🐛 Failed to import puppeteer (pdf):', e);
    throw new Error('Puppeteer not available');
  }
  return _puppeteer;
}
import type { ResumeData } from '@/lib/types';

export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const { resumeData, template = 'swiss', userProfile, showSkillLevelsInResume = false, html: htmlDirect } = await request.json();

    if (!resumeData) {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
    }

    console.log('PDF Generation: Received request for theme:', template);
    console.log('PDF Generation: Resume data keys:', Object.keys(resumeData));
    console.log('PDF Generation: Skills data:', JSON.stringify(resumeData.skills, null, 2));
    console.log('PDF Generation: Experience count:', resumeData.experience?.length || 0);
    console.log('PDF Generation: Certifications count:', resumeData.certifications?.length || 0);
    console.log('PDF Generation: Education count:', resumeData.education?.length || 0);
    console.log('PDF Generation: userProfile provided:', !!userProfile);
    console.log('PDF Generation: showSkillLevelsInResume:', showSkillLevelsInResume);
    
    // If raw HTML provided, use it directly; otherwise call preview API
    let html = htmlDirect as string | undefined;
    if (!html) {
      const origin = process.env.NEXTJS_URL || `http://localhost:${process.env.PORT || '3001'}`;
      const previewResponse = await fetch(`${origin}/api/resume/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          template,
          userProfile,
          showSkillLevelsInResume
        })
      });
      
      if (!previewResponse.ok) {
        throw new Error('Failed to generate HTML from preview API');
      }
      
      const previewData = await previewResponse.json();
      html = previewData.html;
    }
    
    console.log('PDF Generation: Generated HTML, length:', html.length);

    // Launch Puppeteer with the same settings as prototype-cli
    const puppeteer = await getPuppeteer();
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Set content and wait for fonts
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded']
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    // Add a small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF with A4 settings matching prototype-cli
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true
    });

    console.log('PDF Generation: Generated PDF, size:', pdfBuffer.length);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${template}-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
