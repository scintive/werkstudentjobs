import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { llmService } from '@/lib/services/llmService';
import { validateFile, checkRateLimit } from '@/lib/utils/apiValidation';
// Lazy import puppeteer to avoid bundling/runtime issues
let _puppeteer: unknown = null;
async function getPuppeteer() {
  if (_puppeteer) return _puppeteer;
  try {
    _puppeteer = (await import('puppeteer')).default;
  } catch (e) {
    console.error('🐛 Failed to import puppeteer:', e);
    throw new Error('Puppeteer not available');
  }
  return _puppeteer;
}

// Primary: Node PDF parser (no network/headless deps)
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  try {
    // Import pdf-parse safely
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(buffer);
    if (data?.text && data.text.trim().length > 50) {
      return data.text as string;
    }
  } catch (e) {
    console.warn('📄 pdf-parse failed or returned empty text, will try fallback:', (e as Error).message);
  }

  // Fallback: Puppeteer + PDF.js (requires network to CDN)
  const base64 = buffer.toString('base64');
  const puppeteer = await getPuppeteer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><head>
      <meta charset="utf-8" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script>window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>
    </head><body></body></html>`, { waitUntil: 'load' });
    const text = await page.evaluate(async (b64: string) => {
      const raw = atob(b64);
      const len = raw.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = raw.charCodeAt(i);
      const pdfjsLib = (window as typeof window & { pdfjsLib: unknown }).pdfjsLib;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const task = (pdfjsLib as any).getDocument({ data: bytes });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = await (task as any).promise;
      let all = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (let p = 1; p <= (pdf as any).numPages; p++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const page = await (pdf as any).getPage(p);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content = await (page as any).getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txt = (content as any).items.map((it: Record<string, any>) => {
          const item = it as Record<string, unknown>;
          return item.str;
        }).join(' ');
        all += '\n\n' + txt;
      }
      return all;
    }, base64);
    await browser.close();
    return text;
  } catch (err) {
    try { await browser.close(); } catch {}
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for expensive PDF extraction operation
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`pdf-extract:${ip}`, 10, 300000)) { // 10 requests per 5 minutes
      return NextResponse.json(
        { error: 'Too many extraction requests. Please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': '300' } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file upload for security
    const validation = validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['application/pdf'],
      allowedExtensions: ['.pdf']
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Extract text from PDF
    let extractedText = '';
    try {
      extractedText = await extractTextFromPDF(file);
    } catch (pdfErr) {
      console.error('📄 PDF extraction failed:', pdfErr);
      return NextResponse.json({ error: 'PDF extraction failed', details: pdfErr instanceof Error ? pdfErr.message : 'Unknown PDF error' }, { status: 500 });
    }

    // Initialize LLM client
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (llmService as any).client = llmService.initializeClient();
    } catch (e) {
      console.error('🔐 OpenAI client init failed:', e);
      return NextResponse.json({ error: 'AI unavailable', details: e instanceof Error ? e.message : 'Init failed' }, { status: 500 });
    }
    
    // Use LLM service to structure the profile
    let profile: unknown;
    try {
      profile = await llmService.extractProfileFromText(extractedText);

      // Cast profile for property access
      const profileData = profile as Record<string, unknown>;

      // DEBUG: Log what GPT extracted for experience and certifications
      console.log('🔍 === GPT EXTRACTION DEBUG ===');
      const experience = profileData.experience as unknown[] | undefined;
      console.log('🔍 Experience count:', (experience || []).length);
      if (experience && experience.length > 0) {
        experience.forEach((exp: unknown, idx: number) => {
          const expData = exp as Record<string, unknown>;
          const responsibilities = expData.responsibilities as unknown[] | undefined;
          console.log(`🔍 Experience ${idx + 1}:`, {
            company: expData.company,
            position: expData.position,
            duration: expData.duration,
            responsibilities_count: (responsibilities || []).length,
            responsibilities: responsibilities
          });
        });
      }
      const certifications = profileData.certifications as unknown[] | undefined;
      console.log('🔍 Certifications count:', (certifications || []).length);
      if (certifications && certifications.length > 0) {
        console.log('🔍 Certifications:', JSON.stringify(certifications, null, 2));
      }
      console.log('🔍 === END DEBUG ===');

      // Validate that we got a proper profile back
      if (!profile || typeof profile !== 'object' || Object.keys(profile).length === 0) {
        console.error('🧠 Profile extraction returned empty or invalid object:', profile);
        throw new Error('Profile extraction returned empty or invalid data');
      }

      // Check for required fields
      if (!profileData.personal_details) {
        console.error('🧠 Profile missing personal_details:', profile);
        throw new Error('Profile extraction missing required personal details');
      }
    } catch (aiErr) {
      console.error('🧠 Profile extraction LLM failed:', aiErr);
      return NextResponse.json({ error: 'Profile extraction failed', details: aiErr instanceof Error ? aiErr.message : 'AI error' }, { status: 500 });
    }

    // Cast profile for remaining property access
    const profileData = profile as Record<string, unknown>;
    const education = profileData.education as unknown[] | undefined;

    // Format education entries - try GPT first, fallback to manual expansion
    if (education && Array.isArray(education)) {
      console.log('🔍 RAW PROFILE EDUCATION BEFORE FORMATTING:', JSON.stringify(education, null, 2));
      console.log('🔍 EDUCATION FIELD NAMES:', Object.keys(education[0] || {}));

      // Use LLM service for reliable education formatting (now with manual expansion fallback)
      try {
        profileData.education = await llmService.formatEducationEntries(education);
        console.log('🔍 LLM SERVICE FORMATTED EDUCATION:', JSON.stringify(profileData.education, null, 2));
      } catch (error) {
        console.warn('🔍 LLM formatting failed, keeping original:', error);
      }
    } else {
      console.log('🔍 NO EDUCATION DATA OR NOT ARRAY:', education);
    }

    // Manual degree expansion function
    function expandDegreeAbbreviation(degree: string): string {
      const expansions: Record<string, string> = {
        'BSc': 'Bachelor of Science',
        'B.Sc': 'Bachelor of Science', 
        'B.Sc.': 'Bachelor of Science',
        'MSc': 'Master of Science',
        'M.Sc': 'Master of Science',
        'M.Sc.': 'Master of Science',
        'BA': 'Bachelor of Arts',
        'B.A': 'Bachelor of Arts',
        'B.A.': 'Bachelor of Arts',
        'MA': 'Master of Arts',
        'M.A': 'Master of Arts',
        'M.A.': 'Master of Arts',
        'AS': 'Associate of Science',
        'A.S': 'Associate of Science',
        'A.S.': 'Associate of Science',
        'AA': 'Associate of Arts',
        'A.A': 'Associate of Arts',
        'A.A.': 'Associate of Arts',
        'PhD': 'Doctor of Philosophy',
        'Ph.D': 'Doctor of Philosophy',
        'Ph.D.': 'Doctor of Philosophy'
      };
      
      return expansions[degree] || degree;
    }

    // INTELLIGENT SKILL ORGANIZATION - Combined into profile extraction for faster loading
    console.log('🧠🎯 === ORGANIZING SKILLS INTELLIGENTLY ===');
    let organizedSkills = null;

    try {
      // Extract current skills array from profile
      const currentSkills: string[] = [];
      const skills = profileData.skills as Record<string, unknown> | undefined;
      if (skills) {
        Object.values(skills).forEach((skillArray: unknown) => {
          if (Array.isArray(skillArray)) {
            currentSkills.push(...skillArray);
          }
        });
      }

      console.log('🧠🎯 Current skills found:', currentSkills.length);

      // Organize skills intelligently using GPT
      if (process.env.OPENAI_API_KEY) {
        organizedSkills = await llmService.organizeSkillsIntelligently(profile, currentSkills);
        const organizedSkillsData = organizedSkills as Record<string, unknown> | null;
        const organizedCategories = organizedSkillsData?.organized_categories as Record<string, unknown> | undefined;
        console.log('🧠🎯 Categories created:', Object.keys(organizedCategories || {}).length);
      } else {
        console.log('🧠🎯 No OpenAI key, using fallback organization');
        organizedSkills = {
          organized_categories: {
            "Core Skills": {
              skills: currentSkills.slice(0, 5),
              suggestions: ["Communication", "Problem Solving", "Time Management"],
              reasoning: "Essential professional skills"
            },
            "Technical Skills": {
              skills: currentSkills.slice(5),
              suggestions: ["Microsoft Office", "Data Analysis", "Project Management"],
              reasoning: "Basic technical competencies"
            }
          },
          profile_assessment: {
            career_focus: "Professional Development",
            skill_level: "entry",
            recommendations: "Build foundational skills"
          },
          category_mapping: {},
          source: 'fallback'
        };
      }
    } catch (error) {
      console.error('🧠🎯 Skill organization failed (non-critical):', error);
      // Don't fail the entire extraction if skill organization fails
      // Just return null and let the frontend handle it
    }

    // Debug custom sections extraction
    const customSections = profileData.custom_sections;
    console.log('🔍 PROFILE EXTRACTION - Custom sections extracted:', JSON.stringify(customSections, null, 2));
    console.log('🔍 PROFILE EXTRACTION - Profile keys:', Object.keys(profile));

    return NextResponse.json({
      success: true,
      profile,
      organizedSkills, // Include organized skills in the response
      message: 'Profile extracted and skills organized successfully'
    });

  } catch (error) {
    console.error('Profile extraction error (outer):', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extract profile from resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
