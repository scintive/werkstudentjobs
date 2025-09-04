import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';
import { fastMatchingService } from '@/lib/services/fastMatchingService';
import { cookies } from 'next/headers';
import type { 
  JobStrategy, 
  CompactJobData, 
  CompactProfileData, 
  MatchContext 
} from '@/lib/types/jobStrategy';
import type { UserProfile } from '@/lib/types';

// In-memory strategy cache (keyed by job_id + profile_hash)
const strategyCache = new Map<string, { strategy: JobStrategy; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Generate profile hash for cache invalidation
 */
function generateProfileHash(profile: UserProfile): string {
  const key = JSON.stringify({
    skills: profile.skills,
    experience: profile.experience,
    languages: profile.languages,
    personal: profile.personal_details
  });
  return Buffer.from(key).toString('base64').slice(0, 12);
}

/**
 * Create compact job data for AI context (token-efficient)
 */
function createCompactJobData(job: any): CompactJobData {
  // Extract top requirements from job using correct field names
  const allRequirements = [
    ...(job.skills_original || []),
    ...(job.tools_original || []),
    ...(job.responsibilities_original || [])
  ];
  
  return {
    title: job.title,
    company: job.companies?.name || job.company_name || 'Unknown',
    must_haves: allRequirements.slice(0, 8), // Top 8 critical requirements
    nice_to_haves: (job.nice_to_have_original || []).slice(0, 6), // Top 6 nice-to-haves
    work_mode: job.work_mode || 'Unknown',
    language_required: job.language_required || job.german_required || 'Unknown',
    location: job.location_city || 'Unknown'
  };
}

/**
 * Create compact profile data for AI context
 */
function createCompactProfileData(profile: UserProfile): CompactProfileData {
  // Extract top skills across all categories
  const allSkills: string[] = [];
  if (profile.skills && typeof profile.skills === 'object') {
    Object.values(profile.skills).forEach(skillArray => {
      if (Array.isArray(skillArray)) {
        allSkills.push(...skillArray);
      }
    });
  }
  
  // Extract achievements from experience
  const achievements = (profile.experience || [])
    .filter(exp => exp && typeof exp === 'object')
    .slice(0, 5) // Top 5 most recent roles
    .map(exp => ({
      text: exp.description || exp.summary || '',
      impact: exp.achievements || exp.impact || '',
      company: exp.company || '',
      role: exp.position || exp.title || ''
    }));
  
  return {
    professional_title: profile.personal_details?.professional_title || 'Professional',
    top_achievements: achievements,
    top_skills: allSkills.slice(0, 8), // Top 8 skills
    languages: profile.languages || [],
    location: profile.personal_details?.city || profile.personal_details?.location
  };
}

/**
 * POST /api/jobs/analyze
 * Generate Job Strategy with caching
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id, user_profile_id } = await request.json();
    
    if (!job_id || !user_profile_id) {
      return NextResponse.json(
        { error: 'job_id and user_profile_id are required' },
        { status: 400 }
      );
    }
    
    console.log(`🎯 STRATEGY: Analyzing job ${job_id} for profile ${user_profile_id}`);
    
    // Set session context for RLS (similar to resumeDataService)
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get('user_session')?.value;
      if (sessionId) {
        await supabase.rpc('set_session_context', { session_id: sessionId });
        console.log(`🎯 STRATEGY: Set session context: ${sessionId}`);
      }
    } catch (error) {
      console.log('🎯 STRATEGY: Session context not available, continuing...');
    }
    
    // Fetch job data
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          description,
          website_url,
          industry,
          employee_count
        )
      `)
      .eq('id', job_id)
      .single();
    
    if (jobError || !jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Fetch user profile - use session-based lookup if ID fails
    let profileData = null;
    let profileError = null;
    
    // First try ID-based lookup
    const { data: profileByIdData, error: profileByIdError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_profile_id)
      .single();
    
    if (!profileByIdError && profileByIdData) {
      profileData = profileByIdData;
    } else {
      // Fallback to session-based lookup (same logic as profile/latest)
      const cookieStore = await cookies();
      const sessionId = cookieStore.get('user_session')?.value;
      const userEmail = cookieStore.get('user_email')?.value;
      
      console.log('🎯 STRATEGY: ID lookup failed, trying session lookup with session:', sessionId, 'email:', userEmail);
      
      if (sessionId) {
        const { data: profileBySessionData, error: profileBySessionError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        if (!profileBySessionError && profileBySessionData) {
          profileData = profileBySessionData;
          console.log('🎯 STRATEGY: Found profile by session_id');
        }
      }
      
      if (!profileData && userEmail) {
        const { data: profileByEmailData, error: profileByEmailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', userEmail)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!profileByEmailError && profileByEmailData) {
          profileData = profileByEmailData;
          console.log('🎯 STRATEGY: Found profile by email');
        }
      }
      
      profileError = profileByIdError;
    }
    
    console.log('🎯 STRATEGY: Profile query result - error:', profileError);
    console.log('🎯 STRATEGY: Profile query result - data:', profileData ? 'found' : 'null');
    
    if (!profileData) {
      return NextResponse.json(
        { error: 'User profile not found', details: profileError?.message },
        { status: 404 }
      );
    }
    
    // Convert user_profiles table data to UserProfile format
    const userProfile: UserProfile = {
      personal_details: {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        city: profileData.location || '',
        professional_title: profileData.current_job_title || ''
      },
      skills: {
        technical: profileData.skills || [],
        tools: profileData.tools || []
      },
      experience: [], // Will need to be populated from separate table if exists
      languages: profileData.languages_spoken ? Object.keys(profileData.languages_spoken) : [],
      education: []
    };
    const profileHash = generateProfileHash(userProfile);
    const cacheKey = `${job_id}_${profileHash}`;
    
    // Check cache first
    const cached = strategyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('🎯 STRATEGY: Cache hit');
      return NextResponse.json({
        success: true,
        strategy: cached.strategy,
        cached: true,
        cache_age: Math.round((Date.now() - cached.timestamp) / 1000)
      });
    }
    
    // Calculate match breakdown for context
    const matchResult = await fastMatchingService.calculateJobMatch(jobData, userProfile);
    
    // Create compact context for AI
    const compactJob = createCompactJobData(jobData);
    const compactProfile = createCompactProfileData(userProfile);
    const matchContext: MatchContext = {
      matched_skills: matchResult.breakdown.skills.matchedSkills.slice(0, 10),
      missing_skills: matchResult.breakdown.skills.criticalMissing.slice(0, 10),
      matched_tools: matchResult.breakdown.tools.matchedSkills.slice(0, 10),
      missing_tools: matchResult.breakdown.tools.criticalMissing.slice(0, 10),
      skill_score: matchResult.breakdown.skills.score,
      tool_score: matchResult.breakdown.tools.score,
      language_score: matchResult.breakdown.language.score,
      location_score: matchResult.breakdown.location.score,
      overall_score: matchResult.totalScore
    };
    
    console.log(`🎯 STRATEGY: Compact context - ${compactJob.must_haves.length} requirements, ${matchContext.matched_skills.length} matched skills`);
    
    // Generate strategy using AI
    const strategyPrompt = {
      job_core: compactJob,
      match: matchContext,
      profile_summary: compactProfile
    };
    
    const systemPrompt = `You are a job application strategist. Use only the provided data. Output valid JSON per the schema below. No extra text.

Schema:
{
  "fit_summary": ["bullet1", "bullet2", "bullet3", "bullet4"], // 4-6 bullets explaining why user fits
  "must_have_gaps": [{"skill": "string", "why_matters": "string", "suggested_fix": "string"}],
  "positioning": {
    "themes": ["theme1", "theme2", "theme3"], // 3 positioning themes
    "elevator_pitch": "30-50 words"
  },
  "ats_keywords": ["keyword1", "keyword2"], // 10-15 ATS optimization keywords  
  "talking_points": [{"point": "string", "achievement_ref": "string", "keywords": ["k1", "k2"]}]
}

Be concise and factual. Focus on strengths and realistic gap management.`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(strategyPrompt) }
        ],
        model: 'gpt-4o-mini', // Small model for structured analysis
        temperature: 0.2,
        max_tokens: 800 // Increased from 500 to handle complete responses
      });
      
      const rawContent = aiResponse.choices?.[0]?.message?.content || '{}';
      console.log('🎯 STRATEGY: Raw AI response length:', rawContent.length);
      
      // Check if response was truncated and try to fix
      let cleanedContent = rawContent.trim();
      if (!cleanedContent.endsWith('}')) {
        console.log('🎯 STRATEGY: Detected truncated JSON, attempting to fix');
        // Find the last complete object/array and add missing closing braces
        const openBraces = (cleanedContent.match(/\{/g) || []).length;
        const closeBraces = (cleanedContent.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        // Add missing closing braces
        cleanedContent += '}'.repeat(Math.max(0, missingBraces));
        console.log('🎯 STRATEGY: Added', missingBraces, 'closing braces');
      }
      
      let strategyData;
      try {
        strategyData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('🎯 STRATEGY: JSON parsing failed even after cleanup:', parseError);
        console.error('🎯 STRATEGY: Cleaned content:', cleanedContent.slice(0, 500));
        throw new Error('Failed to parse AI response as JSON');
      }
      
      const strategy: JobStrategy = {
        job_id,
        user_profile_id,
        created_at: new Date().toISOString(),
        profile_hash: profileHash,
        fit_summary: strategyData.fit_summary || [],
        must_have_gaps: strategyData.must_have_gaps || [],
        positioning: strategyData.positioning || { themes: [], elevator_pitch: '' },
        ats_keywords: strategyData.ats_keywords || [],
        talking_points: strategyData.talking_points || []
      };
      
      // Cache the strategy
      strategyCache.set(cacheKey, {
        strategy,
        timestamp: Date.now()
      });
      
      console.log(`🎯 STRATEGY: Generated and cached - ${strategy.fit_summary.length} fit points, ${strategy.must_have_gaps.length} gaps`);
      
      return NextResponse.json({
        success: true,
        strategy,
        cached: false,
        context: {
          job_title: compactJob.title,
          company: compactJob.company,
          overall_match: matchContext.overall_score,
          skill_breakdown: {
            matched: matchContext.matched_skills.length,
            missing: matchContext.missing_skills.length
          }
        }
      });
      
    } catch (aiError) {
      console.error('🎯 STRATEGY: AI generation failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Strategy generation failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('🎯 STRATEGY: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Strategy analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze jobs.' },
    { status: 405 }
  );
}