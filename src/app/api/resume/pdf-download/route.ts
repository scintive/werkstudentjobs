import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy import puppeteer to avoid bundling/runtime issues
let _puppeteer: any = null;
let _chromium: any = null;

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

async function getChromium() {
  if (_chromium) return _chromium;
  try {
    const chromiumModule = await import('@sparticuz/chromium');
    _chromium = chromiumModule.default;
  } catch (e) {
    console.log('⚠️ @sparticuz/chromium not available, using default Chrome');
    return null;
  }
  return _chromium;
}

import type { ResumeData } from '@/lib/types';

/**
 * GET /api/resume/pdf-download?variant_id=xxx
 * Download resume PDF for a specific variant
 */
export async function GET(request: NextRequest) {
  let browser;

  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variant_id');

    if (!variantId) {
      return NextResponse.json({ error: 'variant_id is required' }, { status: 400 });
    }

    console.log('📥 GET PDF Download - variant_id:', variantId);

    // Create server supabase client with auth from request
    const supabase = createServerSupabase(request);

    // Fetch variant data from Supabase
    const { data: variant, error: variantError } = await supabase
      .from('resume_variants')
      .select(`
        *,
        jobs(
          id,
          title,
          companies(
            name
          )
        )
      `)
      .eq('id', variantId as any)
      .single();

    if (variantError || !variant) {
      console.error('❌ Variant not found:', variantError);
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const variantData = variant as any;

    // Fetch base resume data
    const { data: baseResume, error: resumeError } = await supabase
      .from('resume_data')
      .select('*')
      .eq('id', variantData.base_resume_id as any)
      .single();

    if (resumeError || !baseResume) {
      console.error('❌ Base resume not found:', resumeError);
      return NextResponse.json({ error: 'Base resume not found' }, { status: 404 });
    }

    // Merge base resume with variant data
    const resumeData = {
      ...(baseResume as any),
      ...(variantData.tailored_data || {}),
    };
    
    // Get template from variant column or from tailored_data as fallback
    const selectedTemplate = variantData.template || (variantData.tailored_data as any)?._template || 'swiss';
    console.log('📋 PDF Export: Using template:', selectedTemplate);

    // Generate filename: UserFullName_CompanyName_Resume.pdf
    const userName = (resumeData.personal_info?.name || resumeData.personalInfo?.name || 'User')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    const companyName = (variantData.jobs?.companies?.name || 'Company')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    const filename = `${userName}_${companyName}_Resume.pdf`;

    console.log('📄 Generated filename:', filename);

    // Generate HTML from preview API
    const origin = process.env.NEXTJS_URL || `http://localhost:${process.env.PORT || '3000'}`;
    const previewResponse = await fetch(`${origin}/api/resume/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeData,
        template: selectedTemplate,
        userProfile: resumeData,
        showSkillLevelsInResume: false
      })
    });

    if (!previewResponse.ok) {
      throw new Error('Failed to generate HTML from preview API');
    }

    const previewData = await previewResponse.json();
    const html = (previewData as any)?.html;

    if (typeof html !== 'string') {
      throw new Error('Preview response missing HTML payload');
    }

    const htmlContent = html as string;

    // Launch Puppeteer with serverless Chrome if on Vercel
    const puppeteer = await getPuppeteer();
    const chromium = await getChromium();
    
    const launchOptions: any = {
      headless: true,
      args: chromium 
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=VizDisplayCompositor'
          ]
    };

    // Use serverless Chrome executable on Vercel
    if (chromium) {
      launchOptions.executablePath = await chromium.executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded']
    });
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF
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

    console.log('✅ PDF Generated successfully, size:', pdfBuffer.length);

    // Return PDF with proper filename
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ GET PDF generation error:', error);

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
    
    if (typeof html !== 'string') {
      throw new Error('Preview response missing HTML payload');
    }

    const htmlContent = html;

    console.log('PDF Generation: Generated HTML, length:', htmlContent.length);

    // Launch Puppeteer with serverless Chrome if on Vercel
    const puppeteer = await getPuppeteer();
    const chromium = await getChromium();
    
    const launchOptions: any = {
      headless: true,
      args: chromium 
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=VizDisplayCompositor'
          ]
    };

    // Use serverless Chrome executable on Vercel
    if (chromium) {
      launchOptions.executablePath = await chromium.executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // Set content and wait for fonts
    await page.setContent(htmlContent, {
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
