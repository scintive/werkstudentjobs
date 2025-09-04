import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';
import type { ResumePatch } from '@/lib/types/jobStrategy';

// Cache for bullet suggestions (keyed by job_id + bullet_hash + keyword_hash)
const patchCache = new Map<string, { patch: Omit<ResumePatch, 'id' | 'accepted' | 'created_at'>; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Generate hash for bullet content
 */
function generateBulletHash(text: string): string {
  return Buffer.from(text.trim().toLowerCase()).toString('base64').slice(0, 8);
}

/**
 * POST /api/jobs/resume/patches
 * Generate AI-powered bullet rewrite suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      job_id, 
      user_profile_id, 
      target,
      ats_keywords = [],
      must_haves = [],
      full_context = null
    } = await request.json();
    
    if (!job_id || !user_profile_id || !target) {
      return NextResponse.json(
        { error: 'job_id, user_profile_id, and target are required' },
        { status: 400 }
      );
    }
    
    if (!target.section || !target.target_id || !target.text) {
      return NextResponse.json(
        { error: 'target must include section, target_id, and text' },
        { status: 400 }
      );
    }
    
    console.log(`🎯 PATCHES: Generating suggestion for ${target.section}:${target.target_id}`);
    
    // Check cache
    const bulletHash = generateBulletHash(target.text);
    const keywordHash = generateBulletHash(ats_keywords.join(','));
    const cacheKey = `${job_id}_${bulletHash}_${keywordHash}`;
    
    const cached = patchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('🎯 PATCHES: Cache hit');
      return NextResponse.json({
        success: true,
        patch: {
          ...cached.patch,
          id: `patch_${Date.now()}`,
          accepted: null,
          created_at: new Date().toISOString()
        },
        cached: true
      });
    }
    
    // Fetch minimal job context (with error handling)
    let jobData = null;
    try {
      const { data } = await supabase
        .from('jobs')
        .select('title, companies(name), company_name, work_mode')
        .eq('id', job_id)
        .single();
      jobData = data;
    } catch (error) {
      console.log(`🎯 PATCHES: Could not fetch job ${job_id}, using fallback data`);
    }
    
    // Create compact prompt for bullet rewriting (with fallbacks)
    const rewritePrompt = {
      bullet: target.text,
      role: jobData?.title || 'Software Developer',
      company: jobData?.companies?.name || jobData?.company_name || 'Company',
      allowed_keywords: ats_keywords.slice(0, 8), // Top 8 keywords only
      job_must_haves: must_haves.slice(0, 4), // Top 4 requirements only
      section_type: target.section
    };
    
    // Generate section-specific prompts for different resume sections
    const generateSectionPrompt = (section: string, targetText: string, context: any) => {
      const jobTitle = context?.job?.title || 'Software Developer';
      const jobRequirements = context?.job?.skills_required || [];
      const profileExperiences = context?.profile?.experiences || [];
      const profileProjects = context?.profile?.projects || [];

      switch (section) {
        case 'summary':
          return {
            systemPrompt: `You are a senior resume strategist specializing in professional summaries for ${jobTitle} roles.

LANGUAGE: Respond in clear, professional English only.

RULES:
- Craft a compelling 2-3 sentence professional summary
- Highlight most relevant experience from user's background
- Include 2-3 industry keywords naturally
- Quantify impact when possible
- Align with job requirements: ${jobRequirements.slice(0, 5).join(', ')}
- Don't invent facts - use only provided profile data
- Do NOT repeat the original text verbatim
- Make a meaningful improvement (structure, verbs, metrics) — the output must differ from the input
- Output valid JSON only

Context: User has ${profileExperiences.length} experiences and ${profileProjects.length} projects.`,
            schema: `{
  "proposed_text": "Enhanced professional summary (2-3 sentences)",
  "reasoning": "Why this summary fits the role better",
  "used_keywords": ["keyword1", "keyword2"],
  "alignment_score": 85
}`
          };

        case 'title':
          return {
            systemPrompt: `You are a resume strategist optimizing professional titles for ${jobTitle} roles.

RULES:
- Suggest a professional title that aligns with the target job
- Use industry-standard terminology
- Keep it concise (2-6 words)
- Include relevant keywords from job requirements
- Match seniority level based on experience
- Do NOT return the same title as provided
- Output must be different from input
- Output valid JSON only

Job requirements focus: ${jobRequirements.slice(0, 3).join(', ')}`,
            schema: `{
  "proposed_text": "Optimized professional title",
  "reasoning": "Why this title is better aligned",
  "used_keywords": ["keyword1"],
  "seniority_match": "entry/mid/senior"
}`
          };

        case 'experience':
          return {
            systemPrompt: `You are a resume writer specializing in achievement bullets for ${jobTitle} roles.

RULES:
- Transform the bullet using STAR method (Situation, Task, Action, Result)
- Start with strong action verb
- Include quantified metrics when possible from context
- Align with job requirements: ${jobRequirements.slice(0, 4).join(', ')}
- Keep to 18-25 words
- Use relevant keywords naturally
- Don't invent metrics - enhance existing ones
- Do NOT echo the original text; rephrase and improve
- Output valid JSON only

Context: Position at ${context?.current_experience?.company || 'Company'} as ${context?.current_experience?.position || 'Role'}`,
            schema: `{
  "proposed_text": "Enhanced achievement bullet with metrics",
  "reasoning": "How this aligns with job requirements",
  "used_keywords": ["keyword1", "keyword2"],
  "impact_score": 90
}`
          };

        case 'skills':
          return {
            systemPrompt: `You are a skills strategist for ${jobTitle} positions.

RULES:
- Analyze current skills vs. job requirements
- Focus on TOP 3 most critical skills only
- Suggest only missing skills that are essential
- Keep categories minimal and focused
- Output valid JSON only
- BE VERY CONCISE

Job requires: ${jobRequirements.slice(0, 5).join(', ')}`,
            schema: `{
  "critical_missing": ["skill1", "skill2"],
  "reasoning": "Brief explanation",
  "used_keywords": ["keyword1"]
}`
          };

        case 'projects':
          return {
            systemPrompt: `You are a project description optimizer for ${jobTitle} roles.

RULES:
- Enhance project description to highlight relevant skills
- Connect project outcomes to job requirements
- Include technologies/methodologies mentioned in job posting
- Quantify impact when possible
- Keep description concise but impactful
- Use industry terminology
- Ensure the result differs from the original (no verbatim repeat)
- Output valid JSON only

Project: ${context?.current_project?.name || 'Project'}
Technologies used: ${context?.current_project?.technologies?.join(', ') || 'Various'}
Job requirements: ${jobRequirements.slice(0, 4).join(', ')}`,
            schema: `{
  "proposed_text": "Enhanced project description",
  "reasoning": "How this project demonstrates job-relevant skills",
  "used_keywords": ["keyword1", "keyword2"],
  "relevance_score": 85
}`
          };

        default:
          return {
            systemPrompt: `You are a resume optimization expert.

RULES:
- Optimize the provided text for ATS and recruiter appeal
- Include relevant keywords naturally
- Keep factual and don't invent information
- Output valid JSON only`,
            schema: `{
  "proposed_text": "Optimized text",
  "reasoning": "Why this is better",
  "used_keywords": ["keyword1"]
}`
          };
      }
    };

    const promptData = generateSectionPrompt(target.section, target.text, full_context);
    let systemPrompt = promptData.systemPrompt;

    // Style guide (if full context provided)
    let styleGuideNote = '';
    try {
      if (full_context && full_context.job && full_context.profile) {
        const guide = await llmService.generateStyleGuide({ job: full_context.job, profile: full_context.profile });
        if (guide) {
          styleGuideNote = `\n\nSTYLE GUIDE:\n- Voice: ${guide.voice}\n- Tone: ${guide.tone}\n- Keywords: ${(guide.keywords || []).join(', ')}\n- Action Verbs: ${(guide.action_verbs || []).join(', ')}\n- Notes: ${guide.notes}`
        }
      }
    } catch (e) {
      console.log('🎯 PATCHES: Style guide unavailable, continuing');
    }
    systemPrompt = `${systemPrompt}${styleGuideNote}`;
    
    // Create user prompt with full context
    const userPrompt = `Current ${target.section}:
"${target.text}"

Job Context:
- Title: ${jobData?.title || 'Unknown Position'}  
- Company: ${jobData?.companies?.name || jobData?.company_name || 'Unknown Company'}

${full_context ? `
Profile Context:
- Name: ${full_context.profile?.name || 'User'}
- Current Role: ${full_context.profile?.current_role || 'Professional'}
- Experience: ${full_context.profile?.experiences?.length || 0} positions
- Projects: ${full_context.profile?.projects?.length || 0} projects
- Skills: ${Object.keys(full_context.profile?.skills || {}).join(', ')}
` : ''}

Please optimize this ${target.section} section for the target job.`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3, // Balanced creativity
        max_tokens: 500
      });
      
      let suggestion;
      try {
        const rawContent = aiResponse.choices?.[0]?.message?.content || '{}';
        console.log('🎯 PATCHES: Raw AI response length:', rawContent.length);
        
        // Check if response was truncated and try to fix
        let cleanedContent = rawContent.trim();
        if (!cleanedContent.endsWith('}')) {
          console.log('🎯 PATCHES: Detected truncated JSON, attempting to fix');
          // Find the last complete object/array
          const lastBraceIndex = cleanedContent.lastIndexOf('}');
          const lastBracketIndex = cleanedContent.lastIndexOf(']');
          const cutoffIndex = Math.max(lastBraceIndex, lastBracketIndex);
          
          if (cutoffIndex > 0) {
            cleanedContent = cleanedContent.substring(0, cutoffIndex + 1);
            // Add missing closing braces
            const openBraces = (cleanedContent.match(/\{/g) || []).length;
            const closeBraces = (cleanedContent.match(/\}/g) || []).length;
            const missingBraces = openBraces - closeBraces;
            if (missingBraces > 0) {
              cleanedContent += '}'.repeat(missingBraces);
            }
          }
        }
        
        suggestion = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('🎯 PATCHES: JSON parse error:', parseError);
        console.error('🎯 PATCHES: Raw content that failed:', aiResponse.choices?.[0]?.message?.content);
        
        // Graceful fallback: signal no usable suggestion
        suggestion = {
          proposed_text: '',
          reasoning: 'AI parsing failed; skipping suggestion',
          used_keywords: [],
          error: 'JSON parsing failed'
        };
      }
      
      let patch: Omit<ResumePatch, 'id' | 'accepted' | 'created_at'> = {
        section: target.section,
        target_id: target.target_id,
        old_text: target.text,
        proposed_text: suggestion.proposed_text || suggestion.proposed,
        reasoning: suggestion.reasoning,
        used_keywords: suggestion.used_keywords || [],
        proposed_skills: suggestion.proposed_skills || null
      };

      // If the model returned identical or empty text, try a single forced-change retry
      const origTrim = (target.text || '').trim();
      const propTrim = (patch.proposed_text || '').trim();
      if ((!propTrim || propTrim.toLowerCase() === origTrim.toLowerCase()) && target.section !== 'skills') {
        try {
          const forceSystem = `${systemPrompt}\n\nADDITIONAL HARD RULES:\n- You MUST rephrase and improve; the output MUST differ from input.\n- Use different verbs, structure, and concise metrics.`;
          const forceResp = await llmService.createJsonCompletion({
            messages: [
              { role: 'system', content: forceSystem },
              { role: 'user', content: userPrompt }
            ],
            model: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 450
          });
          const forced = JSON.parse(forceResp.choices?.[0]?.message?.content || '{}');
          const forcedText = (forced.proposed_text || forced.proposed || '').trim();
          if (forcedText && forcedText.toLowerCase() !== origTrim.toLowerCase()) {
            patch.proposed_text = forcedText;
            patch.reasoning = forced.reasoning || patch.reasoning;
            patch.used_keywords = forced.used_keywords || patch.used_keywords;
          }
        } catch (e) {
          console.log('🎯 PATCHES: Forced-change retry failed');
        }
      }
      
      // Cache the suggestion
      patchCache.set(cacheKey, {
        patch,
        timestamp: Date.now()
      });
      
      console.log(`🎯 PATCHES: Generated suggestion with ${patch.used_keywords.length} keywords`);
      
      return NextResponse.json({
        success: true,
        patch: {
          ...patch,
          id: `patch_${Date.now()}`,
          accepted: null,
          created_at: new Date().toISOString()
        },
        cached: false,
        tokens_used: aiResponse.length // Approximate
      });
      
    } catch (aiError) {
      console.error('🎯 PATCHES: AI suggestion failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Patch suggestion failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('🎯 PATCHES: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Patch generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/resume/patches
 * Retrieve cached patches for a job/profile combination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const job_id = searchParams.get('job_id');
  const user_profile_id = searchParams.get('user_profile_id');
  
  if (!job_id || !user_profile_id) {
    return NextResponse.json(
      { error: 'job_id and user_profile_id are required' },
      { status: 400 }
    );
  }
  
  // In a real implementation, you'd fetch from database
  // For now, return cache status
  const cacheEntries = Array.from(patchCache.entries())
    .filter(([key]) => key.startsWith(job_id))
    .map(([key, value]) => ({
      cache_key: key,
      age_seconds: Math.round((Date.now() - value.timestamp) / 1000),
      patch: value.patch
    }));
  
  return NextResponse.json({
    success: true,
    cached_patches: cacheEntries,
    cache_stats: {
      total_entries: patchCache.size,
      job_specific: cacheEntries.length
    }
  });
}
