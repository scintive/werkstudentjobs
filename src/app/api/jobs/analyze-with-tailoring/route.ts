import '@/lib/polyfills/url-canparse';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for Vercel
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
import { llmService } from '@/lib/services/llmService';
import { getConfig } from '@/lib/config/app';
import crypto from 'crypto';

// Cache for strategies with tailoring - keyed by fingerprint
const strategyTailoringCache = new Map<string, { data: any; timestamp: number; fingerprint: string }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Valid sections for normalization
const VALID_SECTIONS = new Set([
  'summary', 'experience', 'skills', 'languages', 
  'education', 'projects', 'certifications', 'custom_sections', 'order'
]);

/**
 * POST /api/jobs/analyze-with-tailoring
 * Production-safe endpoint with RLS, no service role
 */
export async function POST(request: NextRequest) {
  const logContext = { stage: 'init', job_id: null, base_resume_id: null, variant_id: null };
  
  try {
    // 1. INPUT VALIDATION
    const body = await request.json().catch(() => ({}));
    const { job_id, base_resume_id, force_refresh = false } = body;
    
    logContext.job_id = job_id;
    logContext.base_resume_id = base_resume_id;
    
    if (!job_id || !base_resume_id) {
      console.error("UNIFIED_ANALYSIS_ERROR", { 
        stage: 'validation',
        job_id: job_id || null,
        base_resume_id: base_resume_id || null,
        variant_id: null,
        code: 'bad_request',
        message: 'Missing required parameters'
      });
      return NextResponse.json(
        { 
          code: 'bad_request',
          message: 'job_id and base_resume_id are required'
        },
        { status: 400 }
      );
    }
    
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(job_id) || !uuidRegex.test(base_resume_id)) {
      console.error("UNIFIED_ANALYSIS_ERROR", { 
        stage: 'validation',
        job_id,
        base_resume_id,
        variant_id: null,
        code: 'bad_request',
        message: 'Invalid UUID format'
      });
      return NextResponse.json(
        { 
          code: 'bad_request',
          message: 'job_id and base_resume_id must be valid UUIDs'
        },
        { status: 400 }
      );
    }
    
    console.log(`🎯 UNIFIED ANALYSIS: Starting for job ${job_id}, resume ${base_resume_id}`);
    
    // 2. AUTH CHECK - REQUIRED
    logContext.stage = 'auth';
    
    // Initialize auth-aware Supabase client
    const db = createServerSupabase(request);
    
    // Get authenticated user (no fallback to session)
    const { data: { user }, error: authError } = await db.auth.getUser();
    
    if (!user || authError) {
      console.error("UNIFIED_ANALYSIS_ERROR", {
        ...logContext,
        stage: 'auth',
        code: 'unauthorized',
        message: 'Authentication required'
      });
      return NextResponse.json(
        { code: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    console.log('🎯 UNIFIED ANALYSIS: Authenticated user:', userId);
    
    // 3. GENERATE FINGERPRINT for cache stability
    const generateFingerprint = (job: any, resume: any) => {
      // Create stable fingerprint from critical fields
      const jobFingerprint = crypto.createHash('sha1')
        .update(JSON.stringify({
          title: job.title,
          company: job.company_name,
          skills: job.skills_original,
          responsibilities: job.responsibilities_original
        }))
        .digest('hex').substring(0, 8);
      
      const resumeFingerprint = crypto.createHash('sha1')
        .update(JSON.stringify({
          summary: resume.professional_summary,
          title: resume.professional_title,
          skills: resume.skills,
          experience: resume.experience, // ALL roles for true determinism
          education: resume.education,
          projects: resume.projects,
          certifications: resume.certifications,
          languages: resume.languages
        }))
        .digest('hex').substring(0, 8);
      
      return `${jobFingerprint}|${resumeFingerprint}`;
    };
    
    // 4. PREP CACHE KEY (fingerprint validation occurs after fetching inputs)
    const cacheKey = `${userId}_${job_id}_${base_resume_id}`;
    
    // 4. FETCH JOB DATA
    logContext.stage = 'fetch_job';
    
    const { data: jobData, error: jobError } = await db
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          description,
          industry,
          logo_url
        )
      `)
      .eq('id', job_id)
      .single();
    
    if (jobError) {
      if (jobError.code === 'PGRST116') {
        console.error("UNIFIED_ANALYSIS_ERROR", {
          ...logContext,
          stage: 'fetch_job',
          code: 'not_found',
          message: 'Job not found'
        });
        return NextResponse.json(
          { code: 'not_found', message: 'Job not found' },
          { status: 404 }
        );
      }
      throw jobError;
    }
    
    // 5. FETCH BASE RESUME DATA (authenticated users only)
    logContext.stage = 'fetch_resume';
    
    // No legacy support - only authenticated users with user_id
    if (!userId) {
      console.error('No authenticated user - authentication required');
      return NextResponse.json(
        { code: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Fetch resume owned by the authenticated user only
    const { data: baseResume, error: resumeError } = await db
      .from('resume_data')
      .select('*')
      .eq('id', base_resume_id)
      .eq('user_id', userId)
      .single();
    
    if (resumeError) {
      if (resumeError.code === 'PGRST116') {
        console.error("UNIFIED_ANALYSIS_ERROR", {
          ...logContext,
          stage: 'fetch_resume',
          code: 'not_found',
          message: 'Resume not found or not owned by user'
        });
        return NextResponse.json(
          { code: 'not_found', message: 'Resume not found or you do not have access to it' },
          { status: 404 }
        );
      }
      // RLS denial or other error
      console.error("UNIFIED_ANALYSIS_ERROR", {
        ...logContext,
        stage: 'fetch_resume',
        code: 'forbidden',
        message: 'Access denied to this resume',
        error: resumeError.message
      });
      return NextResponse.json(
        { code: 'forbidden', message: 'Access denied to this resume. Please ensure you are logged in and own this resume.' },
        { status: 403 }
      );
    }
    
    if (!baseResume) {
      console.error("UNIFIED_ANALYSIS_ERROR", {
        ...logContext,
        stage: 'fetch_resume',
        code: 'not_found',
        message: 'Resume not found'
      });
      return NextResponse.json(
        { code: 'not_found', message: 'Resume not found' },
        { status: 404 }
      );
    }
    
    // 6. CREATE OR GET RESUME VARIANT (authenticated users only)
    logContext.stage = 'variant_management';
    
    // Use upsert pattern to prevent race conditions
    console.log('🔄 Creating or retrieving variant for:', { base_resume_id, job_id, userId });
    
    const variantData = {
      base_resume_id,
      job_id,
      user_id: userId,
      session_id: null,
      tailored_data: {
        personalInfo: baseResume.personal_info,
        professionalTitle: baseResume.professional_title,
        professionalSummary: baseResume.professional_summary,
        enableProfessionalSummary: baseResume.enable_professional_summary,
        skills: baseResume.skills || {},
        experience: baseResume.experience || [],
        education: baseResume.education || [],
        projects: baseResume.projects || [],
        certifications: baseResume.certifications || [],
        customSections: baseResume.custom_sections || [],
        languages: (baseResume as any).languages || []
      },
      applied_suggestions: [],
      ats_keywords: [],
      is_active: true
    };

    // Use raw SQL for upsert to handle race conditions
    // Ensure arrays are properly formatted as PostgreSQL arrays
    const appliedSuggestionsArray: string[] = [];
    const atsKeywordsArray: string[] = [];
      
    const { data: upsertResult, error: upsertError } = await db.rpc('upsert_resume_variant', {
      p_base_resume_id: base_resume_id,
      p_job_id: job_id,
      p_user_id: userId,
      p_tailored_data: variantData.tailored_data,
      p_applied_suggestions: appliedSuggestionsArray,
      p_ats_keywords: atsKeywordsArray,
      p_is_active: variantData.is_active
    });

    let variant;
    if (upsertError) {
      console.error("UNIFIED_ANALYSIS_ERROR", {
        ...logContext,
        stage: 'variant_upsert',
        code: 'upsert_failed',
        message: `Variant upsert failed: ${upsertError.message}`,
        error: {
          code: upsertError.code,
          message: upsertError.message,
          details: upsertError.details
        }
      });
      
      // Fallback: try to get existing variant if upsert failed
      const { data: existingVariant } = await db
        .from('resume_variants')
        .select('*')
        .eq('base_resume_id', base_resume_id)
        .eq('job_id', job_id)
        .eq('user_id', userId)
        .single();
      
      if (existingVariant) {
        console.log('🔄 Using existing variant after upsert failure:', existingVariant.id);
        variant = existingVariant;
      } else {
        return NextResponse.json(
          {
            code: 'forbidden',
            message: 'Unable to create or retrieve resume variant.'
          },
          { status: 403 }
        );
      }
    } else {
      variant = upsertResult;
      console.log('✅ Variant upserted successfully:', variant?.id);
    }
    
    logContext.variant_id = variant.id;
    
    // 6a. CHECK IF VARIANT HAS EXISTING SUGGESTIONS
    const { data: existingSuggestions, error: suggestionsError } = await db
      .from('resume_suggestions')
      .select('*')
      .eq('variant_id', variant.id)
      .order('created_at', { ascending: true });
    
    if (!suggestionsError && existingSuggestions && existingSuggestions.length > 0) {
      console.log(`📋 Found ${existingSuggestions.length} existing suggestions for variant ${variant.id}`);
      return NextResponse.json({
        success: true,
        strategy: {},
        tailored_resume: variant.tailored_data,
        atomic_suggestions: existingSuggestions,
        variant_id: variant.id,
        base_resume_id,
        job_id,
        existing_suggestions: true
      });
    }
    
    // 7. CHECK FINGERPRINT-BASED CACHE (after fetching data)
    const currentFingerprint = generateFingerprint(jobData, baseResume);
    if (!force_refresh) {
      const cached = strategyTailoringCache.get(cacheKey);
      if (cached && 
          (Date.now() - cached.timestamp) < CACHE_TTL && 
          cached.fingerprint === currentFingerprint) {
        return NextResponse.json({
          success: true,
          ...cached.data,
          cached: true,
          fingerprint: currentFingerprint
        });
      }
    }
    
    // 8. PREPARE LLM CALL
    logContext.stage = 'llm_preparation';
    
    // Trim input context deterministically to avoid token overruns without changing semantics
    const trimText = (s: any, max = 300) => typeof s === 'string' ? (s.length > max ? s.slice(0, max) + '…' : s) : s;
    const trimArray = (arr: any[] | null | undefined, max = 8, maxItemLen = 300) =>
      (Array.isArray(arr) ? arr.slice(0, max).map(v => trimText(v, maxItemLen)) : []);

    const trimmedJob = {
      title: trimText(jobData.title, 140),
      company: trimText(((jobData as any).companies?.name || jobData.company_name) || '', 140),
      description: trimText(jobData.description, 1200),
      responsibilities: trimArray(jobData.responsibilities_original, 10, 240),
      requirements: trimArray(jobData.skills_original, 12, 120),
      who_looking_for: trimArray((jobData as any).who_we_are_looking_for_original, 8, 200),
      location: trimText(jobData.city, 80),
      work_mode: jobData.work_mode,
      is_werkstudent: !!(jobData.is_werkstudent || jobData.title?.toLowerCase().includes('werkstudent'))
    };

    // Include ALL experience roles (not just top 3)
    const trimmedExperience = Array.isArray(baseResume.experience) ? baseResume.experience.map((e: any, idx: number) => ({
      company: trimText(e.company, 140),
      position: trimText(e.position, 140),
      duration: trimText(e.duration, 80),
      // Keep first 5 bullets per role for context, or all if less than 5
      achievements: trimArray(e.achievements || e.highlights || (e.description ? String(e.description).split('\n') : []), 
                             5, 220),
      _index: idx // Preserve index for mapping suggestions
    })) : [];

    const analysisContext = {
      job: trimmedJob,
      resume: {
        personalInfo: {
          name: trimText(baseResume.personal_info?.name, 140),
          email: baseResume.personal_info?.email,
          phone: baseResume.personal_info?.phone,
          location: trimText(baseResume.personal_info?.location, 140),
          linkedin: baseResume.personal_info?.linkedin,
          website: baseResume.personal_info?.website
        },
        professionalTitle: trimText(baseResume.professional_title, 140),
        professionalSummary: trimText(baseResume.professional_summary, 1000),
        enableProfessionalSummary: baseResume.enable_professional_summary !== false, // Default to true
        skills: baseResume.skills || {},
        experience: trimmedExperience,
        education: Array.isArray(baseResume.education) ? baseResume.education : [],
        projects: Array.isArray(baseResume.projects) ? baseResume.projects : [],
        certifications: Array.isArray(baseResume.certifications) ? baseResume.certifications : [],
        languages: (baseResume as any).languages || []
      }
    };
    
    const systemPrompt = `You are a Principal UX Research & Design lead specializing in resume IA and high-taste micro-edits.
Optimize for hiring-manager scannability first, ATS match second.
Zero fabrication: reuse only facts present in the resume.

Rules:
• PERSONAL INFO: Copy personalInfo EXACTLY as provided - DO NOT change name, email, phone, location, linkedin, or website
• PRESERVE ALL EXISTING CONTENT: Never delete responsibilities, experiences, or projects. Only enhance/tailor the language
• Keep ALL bullets from each role - tailor the wording to match job requirements but maintain all original responsibilities
• If a role currently has ZERO bullets/achievements, you MUST ADD 2–3 concise, impact-first bullets for that role (no fabrication; derive from resume + JD). Anchor them as experience[ROLE_INDEX].achievements[NEXT_INDEX]
• Professional Title: Create a tailored title that bridges the candidate's experience with the target role (e.g., "Operations Specialist → Partnership & Performance Support" for a partnership role) - NOT just copying the job title
• Professional Summary: ALWAYS include and tailor the summary to highlight relevant experience for the specific job
• Skills: PRESERVE ALL existing skill categories and skills. ADD new relevant skills but NEVER remove existing ones
• Atomic only (one bullet/tag/title tweak per suggestion)
• Taste: outcome-first phrasing, strong verbs, remove filler, tense consistency; bullets ideally ≤22 words
• Evidence-linked: each suggestion must include resume evidence and the JD phrase/keyword it improves
• Coverage: summary, title, skills (ALL categories), ALL experience roles (preserve ALL bullets from each), projects, education, languages, certifications
• Deterministic: same inputs => same outputs
• Return ONLY a valid JSON object matching the schema below. No prose.

OUTPUT FORMAT (JSON):
{
  "strategy": {
    "positioning": "Single sentence elevator pitch",
    "fit_score": 85,
    "key_strengths": ["strength1", "strength2", "strength3"],
    "gaps": ["gap1", "gap2"],
    "talking_points": ["point1", "point2", "point3"],
    "ats_keywords": ["keyword1", "keyword2", "...15-20 keywords"]
  },
  "tailored_resume": {
    "personalInfo": { "KEEP EXACTLY AS IN ORIGINAL - DO NOT MODIFY" },
    "professionalTitle": "Tailored title bridging current role to target position (NOT just the job title)",
    "professionalSummary": "Enhanced summary highlighting relevant experience for the specific job",
    "enableProfessionalSummary": true,
    "skills": { 
      "technical": ["skill1", "skill2"], 
      "tools": ["tool1", "tool2"],
      "soft_skills": ["skill1", "skill2"],
      "languages": ["language1", "language2"]
    },
    "experience": [{ "position": "...", "company": "...", "duration": "...", "achievements": ["bullet1", "bullet2"] }],
    "education": [{ "degree": "...", "field": "...", "institution": "...", "duration": "..." }],
    "projects": [...],
    "certifications": [...],
    "languages": [...],
    "customSections": [...]
  },
  "atomic_suggestions": [
    {
      "section": "summary|title|experience|skills|languages|education|projects|certifications",
      "suggestion_type": "text|bullet|skill_addition|skill_removal|skill_alias|skill_reorder",
      "target_path": "experience[0].bullets[2]",
      "before": "EXACT current text from resume",
      "after": "Enhanced version using ONLY facts from resume",
      "diff_html": "<del>old phrase</del> <ins>new phrase</ins>",
      "rationale": "HM sees impact faster; ATS matches 'keyword'",
      "resume_evidence": "Exact text from resume proving this fact",
      "job_requirement": "Exact phrase from JD this addresses",
      "ats_keywords": ["keyword1", "keyword2"],
      "impact": "high|medium|low",
      "confidence": 85,
      "anchors": {
        "text_snippet": "First 5-12 words of original for anchoring",
        "element_index": 2
      }
    }
  ],
  "skills_suggestions": [
    {
      "operation": "remove|alias|reorder|add",
      "category": "technical|tools|soft_skills",
      "target_path": "skills.technical[3]",
      "before": "PostgreSQL",
      "after": null,
      "rationale": "JD doesn't mention databases; remove to focus on valued skills",
      "confidence": 90
    }
  ]
}`;
    
    // 8. MAKE LLM CALL
    logContext.stage = 'llm_call';
    
    try {
      // Use schema-validated JSON mode to prevent malformed outputs
      const schema: any = {
        type: 'object',
        additionalProperties: false,
        properties: {
          strategy: {
            type: 'object',
            additionalProperties: false,
            properties: {
              positioning: { type: 'string' },
              fit_score: { type: 'number' },
              key_strengths: { type: 'array', items: { type: 'string' } },
              gaps: { type: 'array', items: { type: 'string' } },
              talking_points: { type: 'array', items: { type: 'string' } },
              ats_keywords: { type: 'array', items: { type: 'string' } },
            },
            required: ['positioning','fit_score','key_strengths','gaps','talking_points','ats_keywords']
          },
          tailored_resume: {
            type: 'object',
            additionalProperties: false,
            properties: {
              personalInfo: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  location: { type: 'string' }
                },
                required: ['name','email','phone','location']
              },
              professionalTitle: { type: 'string' },
              professionalSummary: { type: 'string' },
              enableProfessionalSummary: { type: 'boolean' },
              skills: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  technical: { type: 'array', items: { type: 'string' } },
                  tools: { type: 'array', items: { type: 'string' } },
                  soft_skills: { type: 'array', items: { type: 'string' } }
                },
                required: ['technical','tools','soft_skills']
              },
              experience: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    position: { type: 'string' },
                    company: { type: 'string' },
                    duration: { type: 'string' },
                    achievements: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['position','company','duration','achievements']
                }
              },
              education: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    school: { type: 'string' },
                    degree: { type: 'string' },
                    start_date: { type: 'string' },
                    end_date: { type: ['string','null'] },
                    bullets: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['school','degree','start_date','end_date','bullets']
                }
              },
              projects: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    technologies: { type: 'array', items: { type: 'string' } },
                    links: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['name','description','technologies','links']
                }
              },
              certifications: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                    issuer: { type: 'string' },
                    date: { type: 'string' },
                    credential_id: { type: 'string' }
                  },
                  required: ['name','issuer','date','credential_id']
                }
              },
              languages: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    name: { type: 'string' },
                    level: { type: 'string' }
                  },
                  required: ['name','level']
                }
              },
              customSections: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    items: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['title','items']
                }
              }
            },
            required: ['personalInfo','professionalTitle','professionalSummary','enableProfessionalSummary','skills','experience','education','projects','certifications','languages','customSections']
          },
          atomic_suggestions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                // Align with DB check constraint; drop 'custom'
                section: { enum: ['summary','experience','skills','languages','education','projects','certifications','custom_sections','title'] },
                suggestion_type: { enum: ['text','bullet','skill_addition','skill_removal','reorder','language_addition'] },
                target_id: { type: ['string','null'] },
                target_path: { type: ['string','null'] },
                before: { type: 'string' },
                after: { type: 'string' },
                original_content: { type: 'string' },
                suggested_content: { type: 'string' },
                rationale: { type: 'string' },
                ats_relevance: { type: ['string','null'] },
                keywords: { type: 'array', items: { type: 'string' } },
                confidence: { type: 'number' },
                impact: { enum: ['high','medium','low'] },
              },
              required: ['section','suggestion_type','target_id','target_path','before','after','original_content','suggested_content','rationale','ats_relevance','keywords','confidence','impact']
            }
          }
        },
        required: ['strategy','tailored_resume','atomic_suggestions']
      };

      // Use the new UX-focused prompt
    const userPrompt = `Analyze the job and resume below and return ONLY the JSON object described in the system message.

GOAL: Produce atomic, chip-ready suggestions that make this resume strongly tailored to the role for hiring managers (scanability, impact order, tasteful phrasing) and ATS (proven keywords), with zero fabrication.

JOB DATA (JSON):
${JSON.stringify(analysisContext.job, null, 2)}

RESUME DATA (JSON):
${JSON.stringify(analysisContext.resume, null, 2)}

Constraints:
• Cover ALL sections: summary, title, skills, EVERY experience role (ALL of them, not just recent ones), projects, education, languages, certifications
• For EACH experience role present (including older roles), return 2–3 suggestions (prefer 'bullet' additions/rewrites). Anchor with target_path like experience[ROLE_INDEX].achievements[BULLET_INDEX]
• Return 15–25 total high-value suggestions ensuring ALL experience roles get suggestions
• Skills: ONLY suggest skills under categories the user already has. DO NOT create new categories unless explicitly needed for critical job requirements
• Every item must include target_path, before, after, diff_html, rationale, resume_evidence, job_requirement, ats_keywords, impact, confidence

Return your response as a valid JSON object only. Do not include any additional text or explanation outside the JSON structure.`;

      // Use GPT-4o-mini for structured outputs
      const modelName = getConfig('OPENAI.DEFAULT_MODEL') || 'gpt-4o-mini';
      let analysisData: any;
      try {
        analysisData = await llmService.createJsonResponse({
          model: modelName,
          system: systemPrompt,
          user: userPrompt,
          schema,
          temperature: 0.2,
          maxTokens: 3000,
          retries: 2,
        });
      } catch (schemaErr: any) {
        const msg = String(schemaErr?.message || '');
        if (msg.includes('Invalid schema for response_format')) {
          // One-shot tolerant fallback: plain JSON object mode
          const fallback = await llmService.createJsonCompletion({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt + "\nReturn only valid JSON (no prose)." }
            ],
            temperature: 0.2,
            max_tokens: 3000,
          });
          const content = fallback.choices?.[0]?.message?.content || '{}';
          try {
            analysisData = JSON.parse(content);
          } catch {
            const start = content.indexOf('{');
            const end = content.lastIndexOf('}');
            if (start >= 0 && end > start) {
              analysisData = JSON.parse(content.slice(start, end + 1));
            } else {
              throw schemaErr;
            }
          }
        } else {
          throw schemaErr;
        }
      }

      // Log what GPT returned
      console.log('🤖 GPT Response Overview:', {
        hasStrategy: !!analysisData.strategy,
        hasTailoredResume: !!analysisData.tailored_resume,
        atomicSuggestionsCount: analysisData.atomic_suggestions?.length || 0,
        skillsSuggestionsCount: analysisData.skills_suggestions?.length || 0
      });
      
      // If model returned no suggestions, immediately re-try with a cache-busting, stricter prompt (no synthetic fallbacks)
      if (!Array.isArray(analysisData.atomic_suggestions) || analysisData.atomic_suggestions.length === 0) {
        console.warn('⚠️ Zero atomic suggestions from first pass. Retrying with stricter requirements...')
        // 2nd attempt: Atomic-only structured retry with minItems to force non-empty
        const atomicOnlySchema: any = {
          type: 'object',
          additionalProperties: false,
          properties: {
            atomic_suggestions: {
              type: 'array',
              minItems: 12,
              maxItems: 30,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  section: { enum: ['summary','experience','skills','languages','education','projects','certifications','custom_sections','title'] },
                  suggestion_type: { enum: ['text','bullet','addition','modification','skill_addition','skill_removal','skill_reorder','skill_replacement'] },
                  target_path: { type: ['string','null'] },
                  before: { type: ['string','null'] },
                  after: { type: ['string','null'] },
                  rationale: { type: 'string' },
                  confidence: { type: 'number' },
                  impact: { enum: ['high','medium','low'] }
                },
                required: ['section','suggestion_type','target_path','before','after','rationale','confidence','impact']
              }
            }
          },
          required: ['atomic_suggestions']
        };

        const atomicOnlyPrompt = `Return ONLY an object with key "atomic_suggestions" containing 15–25 high-quality suggestions.\n\nRules:\n• COVER ALL experience roles (2–3 bullet additions/rewrites each)\n• Anchor bullets with target_path when possible (experience[ROLE_INDEX].achievements[BULLET_INDEX])\n• Include skills adds/removals mapped to existing categories (no new categories)\n• For additions, set before to empty or null; for removals, set after to empty or null\n• Set confidence 75–95 and impact high/medium appropriately\n• No prose. No extra keys.\n\nJOB DATA:\n${JSON.stringify(analysisContext.job, null, 2)}\n\nRESUME DATA:\n${JSON.stringify(analysisContext.resume, null, 2)}\n\nCACHE_BUST:${Date.now()}`;

        try {
          const retryStructured = await llmService.createJsonResponse<{ atomic_suggestions: any[] }>({
            model: modelName,
            system: 'You are a resume tailoring engine. Return ONLY JSON matching the provided schema.',
            user: atomicOnlyPrompt,
            schema: atomicOnlySchema,
            temperature: 0.2,
            maxTokens: 3200,
            retries: 2
          });
          if (Array.isArray(retryStructured.atomic_suggestions) && retryStructured.atomic_suggestions.length > 0) {
            analysisData.atomic_suggestions = retryStructured.atomic_suggestions;
            console.log('✅ Atomic-only structured retry produced suggestions:', retryStructured.atomic_suggestions.length);
          } else {
            console.warn('⚠️ Atomic-only structured retry returned zero items');
          }
        } catch (retryErr) {
          console.error('🔴 Structured atomic-only retry failed:', (retryErr as Error).message);
        }

        // If still empty, try an EXPERIENCE-ONLY fallback prompt (no schema strictness)
        if (!Array.isArray(analysisData.atomic_suggestions) || analysisData.atomic_suggestions.length === 0) {
          try {
            const expOnlyPrompt = `Return ONLY this JSON object with strong experience edits across ALL roles. No prose.\n\n{
  "atomic_suggestions": [
    {
      "section": "experience",
      "suggestion_type": "bullet",
      "target_path": "experience[ROLE_INDEX].achievements[NEXT_INDEX]",
      "before": null,
      "after": "Concise, impact-first bullet using ONLY facts from resume and JD",
      "rationale": "Why this improves HM scan + ATS keyword",
      "confidence": 85,
      "impact": "high"
    }
  ]
}\n\nRules:\n• For EACH experience role present, include 2–3 bullets\n• ALWAYS set target_path with correct ROLE_INDEX and NEXT_INDEX (append at end)\n• Use suggestion_type "bullet" for all items\n• Use before = null for additions\n• No other sections or keys\n\nJOB DATA:\n${JSON.stringify(analysisContext.job, null, 2)}\n\nRESUME DATA:\n${JSON.stringify(analysisContext.resume, null, 2)}\n\nCACHE_BUST:${Date.now()}`;

            const resp = await llmService.createJsonCompletion({
              messages: [
                { role: 'system', content: 'You are a resume tailoring engine. Return ONLY valid JSON.' },
                { role: 'user', content: expOnlyPrompt }
              ],
              temperature: 0.2,
              max_tokens: 2200,
              model: getConfig('OPENAI.DEFAULT_MODEL') || 'gpt-4o-mini'
            })

            const content = resp.choices?.[0]?.message?.content || '{}'
            let parsed: any = {}
            try {
              parsed = JSON.parse(content)
            } catch {
              const start = content.indexOf('{');
              const end = content.lastIndexOf('}');
              if (start >= 0 && end > start) parsed = JSON.parse(content.slice(start, end + 1))
            }
            if (Array.isArray(parsed?.atomic_suggestions) && parsed.atomic_suggestions.length > 0) {
              analysisData.atomic_suggestions = parsed.atomic_suggestions
              console.log('✅ Experience-only fallback produced suggestions:', parsed.atomic_suggestions.length)
            } else {
              console.warn('⚠️ Experience-only fallback returned zero items')
            }
          } catch (expErr) {
            console.error('🔴 Experience-only fallback failed:', (expErr as Error).message)
          }
        }

        // If still empty, fall back to GPT skill suggestions and convert to atomic
        if (!Array.isArray(analysisData.atomic_suggestions) || analysisData.atomic_suggestions.length === 0) {
          try {
            const skillsResp = await llmService.generateSkillSuggestions(analysisContext.resume, analysisContext.resume.skills || {});
            const addFallback = Array.isArray(skillsResp?.skill_additions) ? skillsResp.skill_additions : [];
            const removeFallback = Array.isArray(skillsResp?.skill_removals) ? skillsResp.skill_removals : [];
            (analysisData as any).skill_additions = addFallback;
            (analysisData as any).skill_removals = removeFallback;
            console.log(`🟡 Used skill-suggestions fallback: additions=${addFallback.length}, removals=${removeFallback.length}`);
          } catch (skillErr) {
            console.error('🔴 Skill-suggestions fallback failed:', (skillErr as Error).message);
          }
        }
      }
      
      if (analysisData.atomic_suggestions?.length > 0) {
        const bySect = analysisData.atomic_suggestions.reduce((acc: any, s: any) => {
          acc[s.section] = (acc[s.section] || 0) + 1;
          return acc;
        }, {});
        console.log('🤖 Suggestions by section:', bySect);
      }
      
      // 8.1 Safe merge: preserve base sections if model returns empty/missing
      const ensureArray = (v: any) => Array.isArray(v) ? v : [];
      const ensureObject = (v: any) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      const isEmptyArray = (v: any) => !Array.isArray(v) || v.length === 0;
      const isEmptyObject = (v: any) => !v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).length === 0;
      const isEmptyString = (v: any) => typeof v !== 'string' || v.trim() === '';
      
      if (!analysisData) analysisData = {};
      analysisData.strategy = ensureObject(analysisData.strategy);
      analysisData.tailored_resume = ensureObject(analysisData.tailored_resume);
      
      // Safe merge with base resume - never drop populated base sections
      const tailoredResume = analysisData.tailored_resume;
      const baseResumeData = baseResume; // baseResume is already the data object from Supabase
      const finalTailored: any = {};
      
      // Personal info: merge if model's is empty/missing
      if (isEmptyObject(tailoredResume.personalInfo)) {
        finalTailored.personalInfo = baseResumeData.personalInfo || {};
      } else {
        finalTailored.personalInfo = { ...baseResumeData.personalInfo, ...tailoredResume.personalInfo };
      }
      
      // Strings: use base if model returns empty (map DB field names)
      finalTailored.professionalTitle = isEmptyString(tailoredResume.professionalTitle) ? 
        (baseResumeData.professional_title || '') : tailoredResume.professionalTitle;
      finalTailored.professionalSummary = isEmptyString(tailoredResume.professionalSummary) ? 
        (baseResumeData.professional_summary || '') : tailoredResume.professionalSummary;
      finalTailored.enableProfessionalSummary = tailoredResume.enableProfessionalSummary ?? 
        baseResumeData.enable_professional_summary ?? true;
      
      // Skills: merge with base, never drop categories, and normalize languages into array on top level too
      if (isEmptyObject(tailoredResume.skills)) {
        finalTailored.skills = baseResumeData.skills || {};
      } else {
        const baseSkills = baseResumeData.skills || {};
        const modelSkills = tailoredResume.skills || {};
        finalTailored.skills = {};
        
        // Merge each category, preferring model over base but never dropping
        const allCategories = new Set([...Object.keys(baseSkills), ...Object.keys(modelSkills)]);
        for (const category of allCategories) {
          if (isEmptyArray(modelSkills[category])) {
            finalTailored.skills[category] = ensureArray(baseSkills[category]);
          } else {
            finalTailored.skills[category] = ensureArray(modelSkills[category]);
          }
        }
      }
      
      // Arrays: use base if model returns empty (map DB field names)
      const arrayFieldMappings = [
        { client: 'experience', db: 'experience' },
        { client: 'education', db: 'education' },
        { client: 'projects', db: 'projects' },
        { client: 'certifications', db: 'certifications' },
        { client: 'languages', db: 'languages' },
        { client: 'customSections', db: 'customSections' }
      ];
      arrayFieldMappings.forEach(({ client, db }) => {
        const candidate = ensureArray(tailoredResume[client]);
        const baseArr = ensureArray(baseResumeData[db]);
        // Preserve base entries; only include model entries if non-empty to avoid duplicates
        if (isEmptyArray(candidate)) {
          finalTailored[client] = baseArr;
        } else if (client === 'experience') {
          // Do not fabricate responsibilities; keep base bullets and allow suggestions to update
          finalTailored.experience = baseArr.map((exp: any, idx: number) => ({
            position: exp.position, company: exp.company, duration: exp.duration,
            achievements: ensureArray(exp.achievements || exp.highlights || [])
          }))
          // Normalize editor expectations: ensure achievements arrays exist
          if (!Array.isArray(finalTailored.experience)) finalTailored.experience = []
          finalTailored.experience = finalTailored.experience.map((exp: any) => ({
            position: exp.position || '',
            company: exp.company || '',
            duration: exp.duration || '',
            achievements: Array.isArray(exp.achievements) ? exp.achievements : []
          }))
        } else if (client === 'education') {
          // De-dupe duplicate education entries by title+institution
          const combined = [...baseArr, ...candidate]
          const seen = new Set<string>()
          finalTailored.education = combined.filter((e: any) => {
            const key = `${(e.degree||'').toLowerCase()}|${(e.institution||'').toLowerCase()}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        } else if (client === 'languages') {
          // Always preserve base languages; merge with model entries if present
          const modelLangs = candidate.map((l: any) => (typeof l === 'string') ? { name: l, level: 'Not specified' } : l)
          const baseLangs = baseArr.map((l: any) => (typeof l === 'string') ? { name: l, level: 'Not specified' } : l)
          const seenLang = new Set<string>()
          const merged = [...baseLangs, ...modelLangs].filter((l: any) => {
            const key = `${(l.name||l.language||'').toLowerCase()}|${(l.level||l.proficiency||'').toLowerCase()}`
            if (seenLang.has(key)) return false
            seenLang.add(key)
            return true
          })
          finalTailored.languages = merged
          // Also reflect into skills.languages for downstream components that rely on it
          const languagesForSkills = merged.map((l: any) => {
            const name = (l?.name || l?.language || '').toString()
            const level = (l?.level || l?.proficiency || '').toString()
            return level ? `${name} (${level})` : name
          }).filter(Boolean)
          finalTailored.skills = finalTailored.skills || {}
          finalTailored.skills.languages = languagesForSkills
        } else {
          finalTailored[client] = candidate
        }
      });
      
      // Replace the tailored_resume with the safely merged version
      analysisData.tailored_resume = finalTailored;
      
      // 9. PERSIST SUGGESTIONS (atomic replace with auth client)
      logContext.stage = 'persist_suggestions';
      
      // Process skills_suggestions and explicit add/remove lists
      if (analysisData.skills_suggestions && Array.isArray(analysisData.skills_suggestions)) {
        console.log(`📊 Processing ${analysisData.skills_suggestions.length} skills suggestions`);
        
        // Convert skills_suggestions to atomic suggestion format for storage
        const skillsSuggestionsAsAtomic = analysisData.skills_suggestions.map((s: any, index: number) => {
          // Determine the suggestion type based on operation
          let suggestionType = 'skill_change';
          if (s.operation === 'add') suggestionType = 'skill_addition';
          else if (s.operation === 'remove') suggestionType = 'skill_removal';
          else if (s.operation === 'alias' || s.operation === 'replace') suggestionType = 'skill_replacement';
          else if (s.operation === 'reorder') suggestionType = 'skill_reorder';
          
          // Handle different field names in the skills suggestions
          const currentSkill = s.current_skill || s.skill || s.original || '';
          const newSkill = s.suggested_skill || s.new_skill || s.replacement || s.suggestion || '';
          
          return {
            section: 'skills',
            suggestion_type: suggestionType,
            target_id: `${s.category || 'skills'}_${index}`,
            target_path: `skills.${s.category || 'technical' || 'general'}`,
            before: s.operation === 'add' ? '' : currentSkill,
            after: s.operation === 'remove' ? '' : newSkill,
            original_content: s.operation === 'add' ? '' : currentSkill,
            suggested_content: s.operation === 'remove' ? '' : newSkill,
            rationale: s.reason || s.rationale || 'Optimize skills for job match',
            job_requirement: s.relevance || s.job_relevance || 'Job-relevant skill optimization',
            ats_keywords: [newSkill].filter(Boolean),
            confidence: Math.max(70, s.confidence || 85), // Ensure minimum 70 confidence
            impact: s.impact || 'high',
            resume_evidence: currentSkill || 'Skills section',
            diff_html: s.operation === 'add' 
              ? `<ins>+ ${newSkill}</ins>`
              : s.operation === 'remove'
              ? `<del>- ${currentSkill}</del>`
              : `<del>${currentSkill}</del> → <ins>${newSkill}</ins>`,
            ats_relevance: s.relevance || s.job_relevance || 'Matches job requirements'
          };
        });
        
        // Add skills suggestions to atomic suggestions
        if (!analysisData.atomic_suggestions) {
          analysisData.atomic_suggestions = [];
        }
        analysisData.atomic_suggestions.push(...skillsSuggestionsAsAtomic);
        console.log(`✅ Added ${skillsSuggestionsAsAtomic.length} skills suggestions to atomic suggestions`);
      }
      // New: skill_additions / skill_removals arrays
      const additions = Array.isArray((analysisData as any).skill_additions) ? (analysisData as any).skill_additions : []
      const removals = Array.isArray((analysisData as any).skill_removals) ? (analysisData as any).skill_removals : []
      const normalizeKey = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '_')
      const baseCategories = Object.keys(baseResumeData.skills || {}).map(normalizeKey)
      const mapCategory = (cat: string) => {
        const c = normalizeKey(cat)
        return baseCategories.includes(c) ? c : (baseCategories[0] || 'skills')
      }
      if (additions.length > 0) {
        additions.forEach((item: any) => {
          const category = mapCategory(item.category)
          const target = `skills.${category}`
          analysisData.atomic_suggestions = analysisData.atomic_suggestions || []
          analysisData.atomic_suggestions.push({
            section: 'skills',
            suggestion_type: 'skill_addition',
            target_id: target,
            target_path: target,
            before: '',
            after: item.skill,
            original_content: '',
            suggested_content: item.skill,
            rationale: item.reason || 'Add skill aligned with job',
            ats_relevance: item.reason || null,
            keywords: [],
            confidence: 80,
            impact: 'medium'
          })
        })
      }
      if (removals.length > 0) {
        removals.forEach((item: any) => {
          const category = mapCategory(item.category)
          const target = `skills.${category}`
          analysisData.atomic_suggestions = analysisData.atomic_suggestions || []
          analysisData.atomic_suggestions.push({
            section: 'skills',
            suggestion_type: 'skill_removal',
            target_id: target,
            target_path: target,
            before: item.skill,
            after: '',
            original_content: item.skill,
            suggested_content: '',
            rationale: item.reason || 'Remove less relevant skill for this job',
            ats_relevance: item.reason || null,
            keywords: [],
            confidence: 75,
            impact: 'low'
          })
        })
      }
      
      // Normalize and enrich atomic suggestions BEFORE validation so we don't drop useful ones
      if (Array.isArray(analysisData.atomic_suggestions)) {
        const normalizeKey = (s: string) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '_')
        const baseCategories = Object.keys(baseResumeData.skills || {}).map(normalizeKey)

        const pickSkillCategory = (categoryCandidate: string | undefined, skillName: string): string => {
          const candidate = normalizeKey(categoryCandidate || '')
          
          // CRITICAL: Only use existing user categories
          if (candidate && baseCategories.includes(candidate)) return candidate
          
          // Map variations to user's existing categories
          const categoryVariants: Record<string, string[]> = {
            'technical_skills': ['technical', 'programming', 'development', 'coding'],
            'tools': ['tools', 'software', 'technologies', 'platforms'],
            'soft_skills': ['soft_skills', 'interpersonal', 'communication', 'leadership'],
            'business': ['business', 'business_intelligence', 'business_analysis'],
            'domain_expertise': ['domain_expertise', 'domain', 'industry', 'expertise'],
            'project_management': ['project_management', 'management', 'agile', 'scrum'],
            'data_analysis___visualization': ['data_analysis', 'analytics', 'visualization', 'reporting'],
            'business_intelligence___strategy': ['business_intelligence', 'strategy', 'planning'],
            'communication___collaboration': ['communication', 'collaboration', 'teamwork']
          }
          
          // Check if candidate maps to existing category
          for (const [userCat, variants] of Object.entries(categoryVariants)) {
            const userCatNorm = normalizeKey(userCat)
            if (baseCategories.includes(userCatNorm) && variants.some(v => normalizeKey(v) === candidate)) {
              return userCatNorm
            }
          }
          
          // Pattern-based matching on skill content
          const skill = (skillName || '').toLowerCase()
          const tryMatch = (needle: string, fallback: string) => {
            const fallbackNorm = normalizeKey(fallback)
            return (skill.includes(needle) && baseCategories.includes(fallbackNorm)) ? fallbackNorm : ''
          }
          
          // Try to match skill patterns to user's existing categories
          const heuristics = [
            // Data patterns
            tryMatch('data', 'data_analysis___visualization'),
            tryMatch('analys', 'data_analysis___visualization'),
            tryMatch('sql', 'data_analysis___visualization') || tryMatch('sql', 'technical_skills'),
            tryMatch('excel', 'data_analysis___visualization') || tryMatch('excel', 'tools'),
            tryMatch('tableau', 'data_analysis___visualization') || tryMatch('tableau', 'tools'),
            tryMatch('power bi', 'data_analysis___visualization') || tryMatch('power bi', 'tools'),
            tryMatch('visualization', 'data_analysis___visualization'),
            
            // Business patterns
            tryMatch('business', 'business_intelligence___strategy') || tryMatch('business', 'business'),
            tryMatch('strategy', 'business_intelligence___strategy'),
            tryMatch('market', 'business_intelligence___strategy'),
            
            // Communication patterns  
            tryMatch('communication', 'communication___collaboration') || tryMatch('communication', 'soft_skills'),
            tryMatch('collaborat', 'communication___collaboration') || tryMatch('collaborat', 'soft_skills'),
            tryMatch('team', 'communication___collaboration') || tryMatch('team', 'soft_skills'),
            
            // Project management patterns
            tryMatch('project', 'project_management'),
            tryMatch('agile', 'project_management'),
            tryMatch('scrum', 'project_management'),
            tryMatch('management', 'project_management'),
            
            // Technical patterns
            tryMatch('python', 'technical_skills') || tryMatch('python', 'technical'),
            tryMatch('java', 'technical_skills') || tryMatch('java', 'technical'),
            tryMatch('script', 'technical_skills') || tryMatch('script', 'technical'),
            tryMatch('api', 'technical_skills') || tryMatch('api', 'technical'),
            tryMatch('database', 'technical_skills') || tryMatch('database', 'domain_expertise')
          ].filter(Boolean)
          
          if (heuristics.length > 0) return heuristics[0]
          
          // Fallback: use first existing category
          return baseCategories.length > 0 ? baseCategories[0] : normalizeKey('skills')
        }

        const anchored = (analysisData.atomic_suggestions || []).map((s: any) => {
          const out = { ...s }
          // Ensure skills suggestions are targeted to a concrete category
          if ((out.section === 'skills') && !out.target_path) {
            const skillName = out.after || out.suggested_content || out.suggestion || ''
            const finalCat = pickSkillCategory(out.category, skillName)
            out.target_path = `skills.${finalCat}`
            out.target_id = out.target_id || out.target_path
          }

          // Anchor experience suggestions to a specific bullet when missing target_path
          if (out.section === 'experience' && !out.target_path) {
            const snippet: string = (out.anchors?.text_snippet || out.before || '').toString().slice(0, 80).toLowerCase()
            if (snippet && Array.isArray(baseResumeData.experience)) {
              let foundPath: string | null = null
              baseResumeData.experience.forEach((exp: any, ei: number) => {
                const bullets: string[] = Array.isArray(exp.achievements) ? exp.achievements : []
                bullets.forEach((b, bi) => {
                  if (!foundPath && typeof b === 'string' && b.toLowerCase().includes(snippet.slice(0, Math.max(12, Math.min(24, snippet.length))))) {
                    foundPath = `experience.${ei}.achievements.${bi}`
                  }
                })
              })
              if (foundPath) {
                out.target_path = foundPath
                out.target_id = out.target_id || foundPath
              }
            }
            // Fallback: treat as an addition on the first role
            if (!out.target_path && Array.isArray(baseResumeData.experience) && baseResumeData.experience.length > 0) {
              const idx = 0
              const currentLen = Array.isArray(baseResumeData.experience[idx]?.achievements) ? baseResumeData.experience[idx].achievements.length : 0
              const addPath = `experience.${idx}.achievements.${currentLen}`
              out.target_path = addPath
              out.target_id = out.target_id || addPath
            }
          }
          return out
        })
        // Do NOT synthesize "mock" suggestions; strictly use GPT output only
        analysisData.atomic_suggestions = anchored

        // Ensure coverage: at least 2 bullets per experience role
        if (Array.isArray(baseResumeData.experience) && baseResumeData.experience.length > 0) {
          try {
            const countByRole: Record<number, number> = {}
            for (const s of analysisData.atomic_suggestions) {
              if (s.section === 'experience' && typeof s.target_path === 'string') {
                const m = s.target_path.match(/experience\.(\d+)\.achievements\.(\d+)/)
                if (m) {
                  const idx = parseInt(m[1], 10)
                  countByRole[idx] = (countByRole[idx] || 0) + 1
                }
              }
            }

            const rolesNeedingTopUp = baseResumeData.experience
              .map((_, idx: number) => ({ idx, have: countByRole[idx] || 0 }))
              .filter(({ have }) => have < 2)

            for (const { idx, have } of rolesNeedingTopUp) {
              const role = baseResumeData.experience[idx] || {}
              const nextStart = Array.isArray(role.achievements) ? role.achievements.length : 0
              const need = Math.max(0, 2 - have)
              if (need <= 0) continue

              const expUserPrompt = `Return ONLY valid JSON with key "bullets" as an array of ${need} impact-first resume bullets for this specific role.\n\nRules:\n• Anchor strictly to the candidate's role context and the job description; no fabrication beyond plausible tasks for this role and level\n• Keep ≤ 22 words each, strong verbs, outcome-first\n• Data/analytics roles: avoid exaggerated ML/leadership claims unless clearly grounded in resume\n• Lab roles: keep responsibilities realistic to entry-level lab tasks\n• No prose outside JSON\n\nROLE CONTEXT (from resume):\n${JSON.stringify(role, null, 2)}\n\nTARGET JOB (trimmed):\n${JSON.stringify(analysisContext.job, null, 2)}\n\nOUTPUT:\n{ "bullets": ["...", "..."] }`;

              try {
                const topUpResp = await llmService.createJsonCompletion({
                  messages: [
                    { role: 'system', content: 'You are a concise resume bullet generator. Return ONLY JSON.' },
                    { role: 'user', content: expUserPrompt }
                  ],
                  temperature: 0.2,
                  max_tokens: 900,
                  model: getConfig('OPENAI.DEFAULT_MODEL') || 'gpt-4o-mini'
                })
                const content = topUpResp.choices?.[0]?.message?.content || '{}'
                let parsed: any = {}
                try { parsed = JSON.parse(content) } catch {
                  const start = content.indexOf('{');
                  const end = content.lastIndexOf('}');
                  if (start >= 0 && end > start) parsed = JSON.parse(content.slice(start, end + 1))
                }
                const bullets: string[] = Array.isArray(parsed?.bullets) ? parsed.bullets.filter((b: any) => typeof b === 'string' && b.trim().length > 0) : []
                if (bullets.length > 0) {
                  bullets.slice(0, need).forEach((bullet: string, j: number) => {
                    const addPath = `experience.${idx}.achievements.${nextStart + j}`
                    analysisData.atomic_suggestions.push({
                      section: 'experience',
                      suggestion_type: 'bullet',
                      target_path: addPath,
                      target_id: addPath,
                      before: '',
                      after: bullet,
                      rationale: 'Add role-specific bullet aligned with JD',
                      confidence: 80,
                      impact: 'high'
                    })
                  })
                  console.log(`✅ Topped up role ${idx} with ${Math.min(need, bullets.length)} bullets`)
                }
              } catch (e) {
                console.warn('Top-up generation failed for role', idx, (e as Error).message)
              }
            }
          } catch (coverageErr) {
            console.warn('Experience coverage enforcement skipped due to error:', (coverageErr as Error).message)
          }
        }
      }

      // Production: suppress verbose debug logs
      
      if (analysisData.atomic_suggestions?.length > 0) {
        // Normalize and validate suggestions with new structure
        const allowedSections = new Set(['summary','experience','skills','languages','education','projects','certifications','custom_sections'])
        const sanitizeSection = (raw: string, suggestionType?: string) => {
          const s = (raw === 'professionalSummary') ? 'summary' : (raw || '')
          if (allowedSections.has(s)) return s
          if (s === 'title') return 'summary' // DB does not allow 'title'
          // Fallback: route unknown sections to skills if it looks like a skill op, else custom_sections
          if ((suggestionType || '').includes('skill')) return 'skills'
          return 'custom_sections'
        }

        // Map model suggestion types to DB-allowed types
        const sanitizeType = (rawType: string | undefined | null, section: string | undefined) => {
          const t = (rawType || '').toString().toLowerCase()
          if (t === 'skill_add' || t === 'skill_addition' || t === 'add') return 'skill_addition'
          if (t === 'skill_remove' || t === 'skill_removal' || t === 'remove') return 'skill_removal'
          if (t === 'reorder' || t === 'skill_reorder') return 'reorder'
          if (t === 'language_add' || t === 'language_addition') return 'language_addition'
          if (t === 'bullet' || t === 'bullet_add' || t === 'bullet_addition' || (t === 'addition' && section === 'experience')) return 'bullet'
          if (t === 'modification' || t === 'replace' || t === 'replacement' || t === 'skill_replacement' || t === 'edit' ) return 'text'
          if (t) return t
          return section === 'experience' ? 'bullet' : 'text'
        }

        const validSuggestions = analysisData.atomic_suggestions
          .filter((s: any) => {
            // Check section validity (including new 'title' section)
            const section = sanitizeSection(s.section, s.suggestion_type)
            if (!allowedSections.has(section)) {
              return false;
            }
            
            // Enforce confidence threshold (70+)
            if ((s.confidence || 0) < 70) {
              return false;
            }
            
            // New structure uses 'before' and 'after' instead of original_content/suggested_content
            const originalContent = s.before || s.original_content;
            const suggestedContent = s.after || s.suggested_content;
            
            // Skills suggestions have more lenient validation
            if (s.section === 'skills') {
              // Allow skill additions with empty before, removals with empty after
              if (s.suggestion_type === 'skill_addition' && (!suggestedContent || suggestedContent.trim().length === 0)) {
                return false;
              }
              if (s.suggestion_type === 'skill_removal' && (!originalContent || originalContent.trim().length === 0)) {
                return false;
              }
              // For alias/reorder, ensure both before and after exist
              if (['skill_replacement', 'skill_reorder'].includes(s.suggestion_type)) {
                if (!originalContent || !suggestedContent || originalContent.trim() === suggestedContent.trim()) {
                  return false;
                }
              }
              // Skills don't require target_path - can use fallback anchoring
              return true;
            }
            
            // Experience suggestions are more lenient - allow additions without 'before'
            if (s.section === 'experience') {
              // Allow bullet additions with just 'after' content
              if (s.suggestion_type === 'bullet' || s.suggestion_type === 'addition') {
                if (!suggestedContent || suggestedContent.trim().length === 0) {
                  return false;
                }
                // Don't require 'before' for additions - they might be new bullets
                return true;
              }
              // For modifications, need both before and after
              if (!originalContent || !suggestedContent || originalContent === suggestedContent) {
                return false;
              }
              // Experience suggestions with target_path are preferred but not required
              return true;
            }
            
            // Non-skills/non-experience suggestions need stricter validation
            // Ensure grounding (must have before content and it can't be empty) - except for additions
            if (s.suggestion_type !== 'skill_addition' && (!originalContent || originalContent.trim().length === 0)) {
              return false;
            }
            
            // Ensure the suggestion is actually different from original (skip for removals)
            if (s.suggestion_type !== 'skill_removal' && originalContent === suggestedContent) {
              return false;
            }
            
            // Must have a target anchor for non-skills sections
            if (s.section !== 'skills' && !s.target_path) return false;
            // Be lenient on evidence/requirements to avoid dropping useful chips
            
            return true;
          })
          .map((s: any) => ({
            variant_id: variant.id,
            job_id,
            section: sanitizeSection(s.section, s.suggestion_type),
            suggestion_type: sanitizeType(s.suggestion_type, s.section),
            target_id: s.target_id || s.target_path || null, // Map target_path to target_id
            original_content: s.before || s.original_content || '',
            suggested_content: s.after || s.suggested_content || '',
            rationale: s.rationale || '',
            ats_relevance: s.ats_relevance || s.job_requirement || '', // Map job_requirement to ats_relevance
            keywords: s.keywords || s.ats_keywords || [],
            confidence: Math.min(100, Math.max(0, s.confidence || 50)),
            impact: ['high', 'medium', 'low'].includes(s.impact) ? s.impact : 'medium',
            accepted: false, // Default to not accepted
            applied_at: null
          }));
        
        // Log metrics for debugging
        console.log(`📊 SUGGESTION METRICS: Generated ${analysisData.atomic_suggestions?.length || 0} suggestions, kept ${validSuggestions.length} after validation`);
        
        // Log validation drops by section
        const droppedBySection: Record<string, number> = {};
        analysisData.atomic_suggestions?.forEach((s: any) => {
          const section = s.section === 'professionalSummary' ? 'summary' : s.section;
          if (!validSuggestions.find((v: any) => v.target_id === (s.target_id || s.target_path) && v.section === section)) {
            droppedBySection[section] = (droppedBySection[section] || 0) + 1;
          }
        });
        if (Object.keys(droppedBySection).length > 0) {
          console.log('🚫 Suggestions dropped by section:', droppedBySection);
        }
        
        // Quiet in production
        
        // Idempotent suggestion updates using upsert
        // This prevents duplicate suggestions on re-runs
        if (validSuggestions.length > 0) {
          // First, get existing suggestions to determine which to update vs insert
          const { data: existingSuggestions } = await db
            .from('resume_suggestions')
            .select('id, target_id, section, original_content, suggested_content')
            .eq('variant_id', variant.id);
          
          const makeSig = (s: { section: string | null; target_id: string | null; original_content?: string | null; suggested_content?: string | null; }) =>
            `${s.section || ''}|${s.target_id || ''}|${(s.original_content || '').trim()}|${(s.suggested_content || '').trim()}`;
          const existingMap = new Map(
            (existingSuggestions || []).map(s => [makeSig(s as any), s.id])
          );
          
          // Separate new and existing suggestions
          const toInsert: any[] = [];
          const toUpdate: any[] = [];
          
          validSuggestions.forEach(suggestion => {
            const key = `${suggestion.section || ''}|${suggestion.target_id || ''}|${(suggestion.original_content || '').trim()}|${(suggestion.suggested_content || '').trim()}`;
            const existingId = existingMap.get(key);
            if (existingId) {
              toUpdate.push({ ...suggestion, id: existingId });
            } else {
              toInsert.push(suggestion);
            }
          });
          
          // Insert new suggestions
          if (toInsert.length > 0) {
            const { error: insertError } = await db
              .from('resume_suggestions')
              .insert(toInsert);
              
            if (insertError) {
              console.error("UNIFIED_ANALYSIS_ERROR", { ...logContext, stage: 'persist_suggestions', code: 'insert_failed', message: insertError.message });
            }
          }
          
          // Update existing suggestions
          if (toUpdate.length > 0) {
            for (const suggestion of toUpdate) {
              const { error: updateError } = await db
                .from('resume_suggestions')
                .update(suggestion)
                .eq('id', suggestion.id);
                
              if (updateError) {
                console.error("UNIFIED_ANALYSIS_ERROR", { ...logContext, stage: 'persist_suggestions', code: 'update_failed', message: updateError.message });
              }
            }
          }
          
          // Clean up orphaned suggestions (ones not in current batch)
          const currentKeys = new Set(
            validSuggestions.map(s => `${s.section || ''}|${s.target_id || ''}|${(s.original_content || '').trim()}|${(s.suggested_content || '').trim()}`)
          );
          const toDelete = Array.from(existingMap.entries())
            .filter(([key]) => !currentKeys.has(key))
            .map(([, id]) => id);
          
          if (toDelete.length > 0) {
            await db
              .from('resume_suggestions')
              .delete()
              .in('id', toDelete);
            // Orphan cleanup completed
          }
        }
      }
      
      // 10. UPDATE VARIANT WITH TAILORED DATA
      logContext.stage = 'update_variant';
      
      // CRITICAL: Preserve personal info exactly; do not overwrite tailored skills
      const tailoredDataWithOriginalInfo = {
        ...(analysisData.tailored_resume || analysisContext.resume),
        personalInfo: baseResume.personal_info, // Force original personal info
      };
      
      const { error: variantUpdateError } = await db
        .from('resume_variants')
        .update({
          tailored_data: tailoredDataWithOriginalInfo,
          ats_keywords: analysisData.strategy?.ats_keywords || [],
          match_score: analysisData.strategy?.fit_score || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', variant.id);

      if (variantUpdateError) {
        console.error("UNIFIED_ANALYSIS_ERROR", { ...logContext, stage: 'update_variant', code: 'update_failed', message: variantUpdateError.message });
      }
      
      // 11. PREPARE RESPONSE
      const response = {
        strategy: analysisData.strategy || {},
        tailored_resume: tailoredDataWithOriginalInfo, // Use the version with preserved personal info
        atomic_suggestions: analysisData.atomic_suggestions || [],
        skills_suggestions: analysisData.skills_suggestions || [],
        variant_id: variant.id,
        base_resume_id,
        job_id,
        fingerprint: currentFingerprint
      };
      
      // Cache the result with fingerprint
      strategyTailoringCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
        fingerprint: currentFingerprint
      });
      
      return NextResponse.json({
        success: true,
        ...response,
        cached: false
      });
      
    } catch (aiError: any) {
      // STEP 1: Capture upstream error details for debugging
      const upstreamDetails = {
        status: aiError?.status || aiError?.response?.status || aiError?.code || null,
        message: aiError?.message || aiError?.response?.data?.error?.message || null,
        type: aiError?.name || aiError?.constructor?.name || null,
        code: aiError?.code || aiError?.response?.data?.error?.code || null,
        response_data: aiError?.response?.data || null
      };

      // STEP 2: Map upstream errors to correct HTTP status codes
      let httpStatus = 502; // Default to bad gateway
      let errorCode = 'upstream_failed';
      let errorMessage = 'Analysis service temporarily unavailable';

      if (upstreamDetails.code === 'invalid_request_error' || upstreamDetails.status === 400) {
        httpStatus = 400;
        errorCode = 'invalid_request';
        errorMessage = 'Invalid analysis request format';
      } else if (upstreamDetails.code === 'context_length_exceeded') {
        httpStatus = 413;
        errorCode = 'payload_too_large';
        errorMessage = 'Input data exceeds processing limits. Try with shorter resume sections.';
      } else if (upstreamDetails.code === 'rate_limit_exceeded' || upstreamDetails.code === 'insufficient_quota') {
        httpStatus = 429;
        errorCode = 'rate_limited';
        errorMessage = 'Analysis service rate limit exceeded. Please try again later.';
      } else if (upstreamDetails.status === 401 || upstreamDetails.code === 'unauthorized') {
        httpStatus = 502;
        errorCode = 'llm_auth_failed';
        errorMessage = 'LLM authentication failed';
      }

      // STEP 1: Log structured error with upstream details
      console.error("UNIFIED_ANALYSIS_ERROR", {
        ...logContext,
        stage: 'llm_call',
        code: errorCode,
        message: errorMessage,
        error: {
          upstream_status: upstreamDetails.status,
          upstream_code: upstreamDetails.code,
          upstream_message: upstreamDetails.message,
          upstream_type: upstreamDetails.type,
          http_status: httpStatus
        }
      });

      // Return appropriate error response with fallback data
      return NextResponse.json(
        {
          code: errorCode,
          message: errorMessage,
          variant_id: variant.id,
          base_resume_id,
          job_id,
          strategy: null,
          tailored_resume: analysisContext.resume,
          atomic_suggestions: []
        },
        { status: httpStatus }
      );
    }
    
  } catch (error) {
    // Single unified error log with detailed info
    console.error("UNIFIED_ANALYSIS_ERROR", {
      stage: logContext.stage || 'unknown',
      job_id,
      base_resume_id,
      variant_id: logContext.variant_id || null,
      code: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      sessionId
    });
    
    return NextResponse.json(
      { 
        code: 'internal_error',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
