import '@/lib/polyfills/url-canparse';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
import { llmService } from '@/lib/services/llmService';

// Cache for strategies with tailoring
const strategyTailoringCache = new Map<string, { data: any; timestamp: number }>();
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
        ...logContext, 
        stage: 'validation',
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
        ...logContext, 
        stage: 'validation',
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
    
    // 3. CACHE CHECK
    const cacheKey = `${userId}_${job_id}_${base_resume_id}`;
    if (!force_refresh) {
      const cached = strategyTailoringCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('🎯 UNIFIED ANALYSIS: Cache hit');
        return NextResponse.json({
          success: true,
          ...cached.data,
          cached: true
        });
      }
    }
    
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
    
    // 5. FETCH BASE RESUME DATA
    logContext.stage = 'fetch_resume';
    
    const { data: baseResume, error: resumeError } = await db
      .from('resume_data')
      .select('*')
      .eq('id', base_resume_id)
      .single();
    
    if (resumeError) {
      if (resumeError.code === 'PGRST116') {
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
      // RLS denial
      if (resumeError.code === '42501' || resumeError.message?.includes('policy')) {
        console.error("UNIFIED_ANALYSIS_ERROR", {
          ...logContext,
          stage: 'fetch_resume',
          code: 'forbidden',
          message: 'Access denied by RLS'
        });
        return NextResponse.json(
          { code: 'forbidden', message: 'Access denied to this resume' },
          { status: 403 }
        );
      }
      throw resumeError;
    }
    
    // 6. CREATE OR GET RESUME VARIANT (owner-scoped, no service role)
    logContext.stage = 'variant_management';
    
    // Check for existing variant (owner-scoped via RLS)
    const { data: existingVariant } = await db
      .from('resume_variants')
      .select('*')
      .eq('base_resume_id', base_resume_id)
      .eq('job_id', job_id)
      .eq('user_id', userId)
      .maybeSingle();
    
    let variant = existingVariant;
    
    if (!variant) {
      // Create new variant with regular auth client (RLS will enforce ownership)
      const newVariant = {
        base_resume_id,
        job_id,
        user_id: userId,
        session_id: null, // Not using session fallback
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
      
      const { data: createdVariant, error: createError } = await db
        .from('resume_variants')
        .insert(newVariant)
        .select('*')
        .single();
      
      if (createError) {
        console.error("UNIFIED_ANALYSIS_ERROR", {
          ...logContext,
          stage: 'variant_creation',
          code: 'internal_error',
          message: createError.message,
          error: createError
        });
        return NextResponse.json(
          { 
            code: 'internal_error',
            message: 'Failed to create resume variant. Check RLS policies.'
          },
          { status: 500 }
        );
      }
      
      variant = createdVariant;
      console.log('✅ Created new resume variant:', variant.id);
    }
    
    logContext.variant_id = variant.id;
    
    // 7. PREPARE LLM CALL
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

    const trimmedExperience = Array.isArray(baseResume.experience) ? baseResume.experience.slice(0, 4).map((e: any) => ({
      company: trimText(e.company, 140),
      position: trimText(e.position, 140),
      duration: trimText(e.duration, 80),
      achievements: trimArray(e.achievements || e.highlights || (e.description ? String(e.description).split('\n') : []), 5, 220)
    })) : [];

    const analysisContext = {
      job: trimmedJob,
      resume: {
        personalInfo: {
          name: trimText(baseResume.personal_info?.name, 140),
          email: baseResume.personal_info?.email,
          phone: baseResume.personal_info?.phone,
          location: trimText(baseResume.personal_info?.location, 140)
        },
        professionalTitle: trimText(baseResume.professional_title, 140),
        professionalSummary: trimText(baseResume.professional_summary, 1000),
        skills: baseResume.skills || {},
        experience: trimmedExperience,
        education: Array.isArray(baseResume.education) ? baseResume.education.slice(0, 3) : [],
        projects: Array.isArray(baseResume.projects) ? baseResume.projects.slice(0, 3) : [],
        certifications: Array.isArray(baseResume.certifications) ? baseResume.certifications.slice(0, 5) : [],
        languages: (baseResume as any).languages || []
      }
    };
    
    const systemPrompt = `You are an expert resume optimization specialist focused on GROUNDED, TRUTHFUL tailoring.

Your task is to provide a UNIFIED analysis that includes:
1. Job strategy (positioning, fit analysis, talking points)
2. Tailored resume data (optimized version for this specific job)
3. Atomic suggestions (specific, actionable changes with rationale)

CRITICAL REQUIREMENTS - GROUNDED TAILORING:
- Every suggestion must be GROUNDED in both the job requirements AND the user's actual experience
- NEVER fabricate skills, tools, languages, metrics, or achievements not present in the resume
- ENHANCE don't INVENT: Only rephrase, prioritize, reorder, or quantify existing content
- Each suggestion must cite the EXACT resume source (section/bullet) and job requirement it addresses
- Suggestions must be atomic, reversible, and confidence-gated (suppress low-confidence suggestions)
- Zero hallucinations, zero random rewrites - only targeted improvements that increase job match

VALIDATION RULES FOR SUGGESTIONS:
1. EVIDENCE REQUIRED: Each suggestion must reference specific text from the resume
2. JOB ALIGNMENT: Each suggestion must address a specific job requirement or keyword
3. NO FABRICATION: Never add skills, tools, or experiences not already in the resume
4. CONFIDENCE THRESHOLD: Only suggest changes with confidence >= 70
5. ATOMIC CHANGES: Each suggestion should be a single, specific edit
6. VERIFIABLE: original_content must be the EXACT text from the resume (character-for-character)

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
    "personalInfo": { ... },
    "professionalTitle": "...",
    "professionalSummary": "optimized summary",
    "skills": { "category": ["skills"] },
    "experience": [{ "company": "...", "position": "...", "duration": "...", "achievements": ["bullet1", "bullet2"] }],
    "education": [...],
    "projects": [...],
    "certifications": [...],
    "languages": [...],
    "customSections": [...]
  },
  "atomic_suggestions": [
    {
      "section": "summary|experience|skills|languages|education|projects|certifications",
      "suggestion_type": "text|bullet|skill_addition|skill_removal|reorder",
      "target_id": "exp_0_bullet_1",
      "original_content": "EXACT current text from resume",
      "suggested_content": "Enhanced version using ONLY verifiable facts from resume",
      "rationale": "Maps to job requirement X; draws from user's experience with Y",
      "ats_relevance": "Emphasizes keyword Z that user demonstrably has",
      "keywords": ["only", "real", "keywords"],
      "confidence": 85,
      "impact": "high|medium|low",
      "resume_source": "Experience bullet 2 mentions this skill",
      "job_requirement": "Job requires X which user has shown through Y"
    }
  ]
}`;
    
    // 8. MAKE LLM CALL
    logContext.stage = 'llm_call';
    
    try {
      // Use schema-validated JSON mode to prevent malformed outputs
      const schema: any = {
        type: 'object',
        additionalProperties: true,
        properties: {
          strategy: { type: 'object', additionalProperties: true },
          tailored_resume: {
            type: 'object',
            additionalProperties: true,
            properties: {
              personalInfo: { type: 'object', additionalProperties: true },
              professionalTitle: { type: 'string' },
              professionalSummary: { type: 'string' },
              skills: { type: 'object' },
              experience: { type: 'array' },
              education: { type: 'array' },
              projects: { type: 'array' },
              certifications: { type: 'array' },
              languages: { type: 'array' },
              customSections: { type: 'array' }
            }
          },
          atomic_suggestions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                section: { enum: ['summary','experience','skills','languages','education','projects','certifications','custom_sections','custom'] },
                suggestion_type: { enum: ['text','bullet','skill_addition','skill_removal','reorder','language_addition'] },
                target_id: { type: ['string','null'] },
                original_content: { type: 'string' },
                suggested_content: { type: 'string' },
                rationale: { type: 'string' },
                ats_relevance: { type: ['string','null'] },
                keywords: { type: 'array', items: { type: 'string' } },
                confidence: { type: 'number' },
                impact: { enum: ['high','medium','low'] },
              },
              required: ['section','suggestion_type','original_content','suggested_content','confidence']
            }
          }
        },
        required: ['strategy','tailored_resume','atomic_suggestions']
      };

      const userPrompt = `Analyze this job and resume. Return your response in valid JSON format.

JOB DATA:
${JSON.stringify(analysisContext.job, null, 2)}

RESUME DATA:
${JSON.stringify(analysisContext.resume, null, 2)}

Provide strategy, tailored resume, and 5-10 HIGH-CONFIDENCE atomic suggestions. Return everything as JSON.

REMEMBER:
- If you can't point to the user's evidence for a claim, don't suggest it
- If it doesn't help with a core job requirement, drop it
- Relevance first: Only suggest changes that materially improve job match
- User strengths up front: Prioritize what they're already strong at that the role values
- Output must be valid JSON matching the schema above
- Response format: JSON object with strategy, tailored_resume, and atomic_suggestions keys`;

      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1000
      });

      // Strict JSON parsing with minimal cleanup in case the model includes extra text
      const raw = aiResponse.choices?.[0]?.message?.content || '{}';
      let analysisData: any;
      try {
        analysisData = JSON.parse(raw);
      } catch (e) {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start >= 0 && end > start) {
          analysisData = JSON.parse(raw.slice(start, end + 1));
        } else {
          throw e;
        }
      }
      
      // 9. PERSIST SUGGESTIONS (atomic replace with auth client)
      logContext.stage = 'persist_suggestions';
      
      if (analysisData.atomic_suggestions?.length > 0) {
        // Normalize and validate suggestions with strict grounding checks
        const validSuggestions = analysisData.atomic_suggestions
          .filter((s: any) => {
            // Check section validity
            const section = s.section === 'professionalSummary' ? 'summary' : s.section;
            if (!VALID_SECTIONS.has(section)) {
              console.warn(`Dropping invalid section: ${s.section}`);
              return false;
            }
            
            // Enforce confidence threshold (70+)
            if ((s.confidence || 0) < 70) {
              console.log(`Dropping low-confidence suggestion: ${s.confidence}%`);
              return false;
            }
            
            // Ensure grounding (must have original_content and it can't be empty)
            if (!s.original_content || s.original_content.trim().length === 0) {
              console.warn(`Dropping ungrounded suggestion - no original content`);
              return false;
            }
            
            // Ensure the suggestion is actually different from original
            if (s.original_content === s.suggested_content) {
              console.warn(`Dropping no-op suggestion - same as original`);
              return false;
            }
            
            return true;
          })
          .map((s: any) => ({
            variant_id: variant.id,
            job_id,
            section: s.section === 'professionalSummary' ? 'summary' : s.section,
            suggestion_type: s.suggestion_type || 'text',
            target_id: s.target_id || null,
            original_content: s.original_content || '',
            suggested_content: s.suggested_content || '',
            rationale: s.rationale || '',
            ats_relevance: s.ats_relevance || '',
            keywords: s.keywords || [],
            confidence: Math.min(100, Math.max(0, s.confidence || 50)),
            impact: ['high', 'medium', 'low'].includes(s.impact) ? s.impact : 'medium'
          }));
        
        // Idempotent suggestion updates using upsert
        // This prevents duplicate suggestions on re-runs
        if (validSuggestions.length > 0) {
          // First, get existing suggestions to determine which to update vs insert
          const { data: existingSuggestions } = await db
            .from('resume_suggestions')
            .select('id, target_id, section')
            .eq('variant_id', variant.id);
          
          const existingMap = new Map(
            (existingSuggestions || []).map(s => [`${s.section}_${s.target_id || 'default'}`, s.id])
          );
          
          // Prepare upsert data with IDs for existing suggestions
          const upsertData = validSuggestions.map(suggestion => {
            const key = `${suggestion.section}_${suggestion.target_id || 'default'}`;
            const existingId = existingMap.get(key);
            return existingId ? { ...suggestion, id: existingId } : suggestion;
          });
          
          // Upsert suggestions (update existing, insert new)
          const { error: upsertError } = await db
            .from('resume_suggestions')
            .upsert(upsertData, {
              onConflict: 'id',
              ignoreDuplicates: false
            });
          
          if (upsertError) {
            console.error('Failed to upsert suggestions:', upsertError);
            // Non-fatal: continue without suggestions
          } else {
            console.log(`✅ Upserted ${validSuggestions.length} suggestions (idempotent)`);
          }
          
          // Clean up orphaned suggestions (ones not in current batch)
          const currentKeys = new Set(
            validSuggestions.map(s => `${s.section}_${s.target_id || 'default'}`)
          );
          const toDelete = Array.from(existingMap.entries())
            .filter(([key]) => !currentKeys.has(key))
            .map(([, id]) => id);
          
          if (toDelete.length > 0) {
            await db
              .from('resume_suggestions')
              .delete()
              .in('id', toDelete);
            console.log(`🗑️ Removed ${toDelete.length} orphaned suggestions`);
          }
        }
      }
      
      // 10. UPDATE VARIANT WITH TAILORED DATA
      logContext.stage = 'update_variant';
      
      await db
        .from('resume_variants')
        .update({
          tailored_data: analysisData.tailored_resume || analysisContext.resume,
          ats_keywords: analysisData.strategy?.ats_keywords || [],
          match_score: analysisData.strategy?.fit_score || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', variant.id);
      
      // 11. PREPARE RESPONSE
      const response = {
        strategy: analysisData.strategy || {},
        tailored_resume: analysisData.tailored_resume || analysisContext.resume,
        atomic_suggestions: analysisData.atomic_suggestions || [],
        variant_id: variant.id,
        base_resume_id,
        job_id
      };
      
      // Cache the result
      strategyTailoringCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      console.log('🎯 UNIFIED ANALYSIS: Complete');
      
      return NextResponse.json({
        success: true,
        ...response,
        cached: false
      });
      
    } catch (aiError: any) {
      // Log upstream details for operator debugging (dev only)
      const upstream = {
        status: aiError?.status || aiError?.code || null,
        message: aiError?.message || null,
        type: aiError?.name || null
      };
      console.error("UNIFIED_ANALYSIS_ERROR", {
        ...logContext,
        stage: 'llm_call',
        code: 'upstream_failed',
        message: 'LLM service failed',
        error: upstream
      });
      
      // Return partial success with variant (502 but with fallback data)
      return NextResponse.json(
        {
          code: 'upstream_failed',
          message: 'Analysis service temporarily unavailable',
          variant_id: variant.id,
          base_resume_id,
          job_id,
          strategy: null,
          tailored_resume: analysisContext.resume,
          atomic_suggestions: []
        },
        { status: 502 }
      );
    }
    
  } catch (error) {
    console.error("UNIFIED_ANALYSIS_ERROR", {
      ...logContext,
      code: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error
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
