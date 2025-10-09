import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';

/**
 * POST /api/jobs/strategy
 * Generate job application strategy
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id, user_profile_id } = await request.json();
    
    if (!job_id) {
      return NextResponse.json(
        { error: 'job_id is required' },
        { status: 400 }
      );
    }
    
    console.log(`🎯 STRATEGY: Analyzing job ${job_id}`);
    
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
    
    // Get latest profile data (use current request origin to avoid port/env mismatch)
    let profileData = null;
    try {
      const origin = new URL(request.url).origin;
      const response = await fetch(new URL('/api/profile/latest', origin), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.resumeData) {
          profileData = result.resumeData;
        }
      }
    } catch (error) {
      console.log('🎯 STRATEGY: Could not fetch latest profile, using fallback');
    }
    
    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    // Create strategy prompt
    const strategyPrompt = {
      job: {
        title: jobData.title,
        company: jobData.company_name || 'Company',
        must_haves: [
          ...(jobData.skills || []),
          ...(jobData.tools || []),
          ...(jobData.responsibilities || [])
        ].slice(0, 8),
        nice_to_haves: (jobData.nice_to_have || []).slice(0, 6),
        work_mode: jobData.work_mode,
        location: jobData.location_city
      },
      profile: {
        name: profileData.personalInfo?.name || 'Professional',
        summary: profileData.professionalSummary || '',
        skills: Object.values(profileData.skills || {}).flat(),
        experience: profileData.experience || [],
        education: profileData.education || [],
        projects: profileData.projects || []
      }
    };
    
    const systemPrompt = `You are a career strategist. Analyze this job-profile match and create an actionable strategy.

LANGUAGE:
- Respond in clear, professional English only.
- Do not include German text, even if the job is in Germany.

OUTPUT SCHEMA:
{
  "fit_score": 0-100,
  "key_strengths": ["4-6 top strengths that match job"],
  "must_have_gaps": [
    {
      "skill": "missing requirement",
      "importance": "low|medium|high",
      "suggested_approach": "how to address in application"
    }
  ],
  "positioning_themes": ["3-4 main themes to emphasize"],
  "ats_keywords": ["15-20 keywords from job posting"],
  "talking_points": [
    {
      "point": "key discussion point",
      "evidence": "specific experience/project",
      "keywords": ["related keywords"]
    }
  ],
  "red_flags": [
    {
      "concern": "potential issue",
      "mitigation": "how to address it"
    }
  ],
  "interview_prep": [
    {
      "question": "likely interview question",
      "preparation_tip": "how to prepare"
    }
  ]
}`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(strategyPrompt) }
        ],
        model: 'gpt-4o-mini', // Using GPT-4o-mini for better analysis
        temperature: 0.3,
        max_tokens: 1000
      });
      
      const strategy = JSON.parse(aiResponse.choices?.[0]?.message?.content || '{}');
      
      console.log(`🎯 STRATEGY: Generated with ${strategy.fit_score}% fit score`);
      
      return NextResponse.json({
        success: true,
        strategy: {
          job_id,
          user_profile_id: user_profile_id || 'latest',
          created_at: new Date().toISOString(),
          ...strategy
        },
        context: {
          job_title: jobData.title,
          company: jobData.company_name,
          profile_name: profileData.personalInfo?.name
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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze profile for jobs.' },
    { status: 405 }
  );
}
