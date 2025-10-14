import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, jobId, userName, companyName, jobTitle } = body;

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 });
    }

    // Helper to generate file names
    const sanitize = (str: string) => str.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const userNameSanitized = sanitize(userName || 'User');
    const companyNameSanitized = sanitize(companyName || 'Company');
    let jobTitleSanitized = sanitize(jobTitle || 'Position');

    if (jobTitleSanitized.length > 30) {
      jobTitleSanitized = jobTitleSanitized.substring(0, 27) + '...';
    }

    // Fetch resume PDF
    const resumeResponse = await fetch(`${req.nextUrl.origin}/api/resume/pdf-download?variant_id=${variantId}`);
    if (!resumeResponse.ok) {
      throw new Error('Failed to fetch resume PDF');
    }
    const resumeBlob = await resumeResponse.arrayBuffer();

    // Fetch cover letter PDF
    const coverLetterResponse = await fetch(`${req.nextUrl.origin}/api/cover-letter/check?variant_id=${variantId}`);
    if (!coverLetterResponse.ok) {
      throw new Error('Failed to fetch cover letter');
    }
    const coverLetterData = await coverLetterResponse.json();

    if (!coverLetterData.exists) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    // Fetch cover letter PDF
    const coverLetterPdfResponse = await fetch(`${req.nextUrl.origin}/api/cover-letter/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId })
    });

    if (!coverLetterPdfResponse.ok) {
      throw new Error('Failed to generate cover letter PDF');
    }
    const coverLetterBlob = await coverLetterPdfResponse.arrayBuffer();

    // Create ZIP file
    const zip = new JSZip();
    zip.file(`${userNameSanitized}_${companyNameSanitized}_Resume.pdf`, resumeBlob);
    zip.file(`${userNameSanitized}_${companyNameSanitized}_CoverLetter.pdf`, coverLetterBlob);

    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${userNameSanitized}_${jobTitleSanitized}_${companyNameSanitized}_ApplicationKit.zip"`,
      },
    });
  } catch (error) {
    console.error('Error creating application kit:', error);
    return NextResponse.json(
      { error: 'Failed to create application kit' },
      { status: 500 }
    );
  }
}
