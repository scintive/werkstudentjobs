import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';

/**
 * POST /api/jobs/strategy-enhanced
 * Generate extremely detailed, actionable job application strategy
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id, user_profile_id } = await request.json();
    
    if (!job_id || !user_profile_id) {
      return NextResponse.json(
        { error: 'job_id and user_profile_id required' },
        { status: 400 }
      );
    }
    
    console.log(`🎯 ENHANCED STRATEGY: Generating comprehensive strategy for job ${job_id}`);
    
    // Fetch complete job data with company information
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          industry,
          size_category,
          headquarters,
          website_url,
          description,
          employee_count,
          linkedin_url,
          company_values,
          culture_highlights,
          glassdoor_rating,
          recent_news
        )
      `)
      .eq('id', job_id)
      .single();
    
    if (jobError || !jobData) {
      console.error('🎯 ENHANCED STRATEGY: Job fetch error:', jobError);
      return NextResponse.json(
        { error: 'Job not found', details: jobError?.message },
        { status: 404 }
      );
    }

    console.log(`🎯 ENHANCED STRATEGY: Job title: ${jobData.title}`);
    console.log(`🎯 ENHANCED STRATEGY: Company name: ${jobData.companies?.name || 'No company data'}`);
    console.log(`🎯 ENHANCED STRATEGY: Job description length: ${jobData.description?.length || 0}`);
    console.log(`🎯 ENHANCED STRATEGY: Skills required: ${JSON.stringify(jobData.skills_original?.slice(0, 3) || [])}`);

    // Get comprehensive user profile data
    let profileData = null;
    if (user_profile_id === 'latest') {
      const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/profile/latest`, {
        headers: {
          'Cookie': `user_session=${(await cookies()).get('user_session')?.value}; user_email=${(await cookies()).get('user_email')?.value}`
        }
      });
      
      if (profileResponse.ok) {
        const result = await profileResponse.json();
        profileData = result.profile || result.resumeData;
      }
    } else {
      const { data: dbProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user_profile_id)
        .single();
      profileData = dbProfile;
    }

    if (!profileData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create comprehensive context for detailed strategy generation
    const strategyContext = {
      job: {
        title: jobData.title,
        company: {
          name: jobData.companies?.name || 'Company',
          industry: jobData.companies?.industry || 'Technology',
          description: jobData.companies?.description || 'Growing technology company',
          size: jobData.companies?.size_category || 'Unknown',
          headquarters: jobData.companies?.headquarters,
          website: jobData.companies?.website_url,
          values: jobData.companies?.company_values || [],
          culture: jobData.companies?.culture_highlights || [],
          recent_news: jobData.companies?.recent_news || [],
          glassdoor_rating: jobData.companies?.glassdoor_rating
        },
        requirements: {
          must_have: [
            ...(jobData.skills_original || []),
            ...(jobData.tools_original || []),
            ...(jobData.responsibilities_original || [])
          ],
          nice_to_have: jobData.nice_to_have_original || [],
          experience_level: jobData.experience_level,
          education_required: jobData.education_required
        },
        details: {
          work_mode: jobData.work_mode,
          location: jobData.city || jobData.location_raw,
          salary_range: jobData.salary_min && jobData.salary_max ? 
            `€${jobData.salary_min}k - €${jobData.salary_max}k` : jobData.salary_info,
          contract_type: jobData.contract_type,
          employment_type: jobData.employment_type,
          language_required: jobData.language_required || jobData.german_required,
          is_remote: jobData.is_remote,
          is_werkstudent: jobData.is_werkstudent
        },
        description_full: jobData.description,
        posting_date: jobData.created_at
      },
      candidate: {
        name: profileData.name || profileData.personal_info?.name,
        background: {
          education: profileData.education || [],
          experience: profileData.experience || [],
          projects: profileData.projects || profileData.academic_projects || [],
          skills: profileData.skills || {},
          certifications: profileData.certifications || []
        },
        current_situation: {
          job_title: profileData.current_job_title || profileData.professional_title,
          availability: profileData.weekly_availability,
          start_date: profileData.earliest_start_date,
          location: profileData.location || profileData.personal_info?.location,
          visa_status: profileData.visa_status,
          german_level: profileData.language_proficiencies?.find(l => l.language === 'German')?.proficiency
        }
      }
    };

    const systemPrompt = `You are a senior career strategist and hiring expert specializing in the German job market. 
Your task is to create an EXTREMELY detailed, actionable application strategy that gives the candidate a significant competitive advantage.

CRITICAL INSTRUCTIONS:
- Provide specific, concrete actions - not generic advice
- Include exact steps, timelines, and resources
- Address the specific company and role
- Give detailed preparation guidance
- Include specific examples and scripts
- Focus on HIGH-IMPACT, actionable strategies

Generate a comprehensive strategy covering:

1. **APPLICATION OPTIMIZATION**: Exact changes to make to resume/cover letter
2. **COMPANY INTELLIGENCE**: Specific company insights and how to use them
3. **INTERVIEW PREPARATION**: Detailed question preparation with example answers
4. **NETWORKING STRATEGY**: Specific people to connect with and how
5. **SKILL GAPS**: Exact steps to address any missing requirements
6. **TIMELINE**: Day-by-day application strategy
7. **DIFFERENTIATION**: Unique positioning against other candidates

OUTPUT as JSON with this structure:
{
  "application_strategy": {
    "resume_optimization": [
      {
        "section": "string",
        "specific_change": "string", 
        "reason": "string",
        "example": "string"
      }
    ],
    "cover_letter_strategy": {
      "opening_line": "string",
      "key_points": ["string"],
      "closing_strategy": "string"
    }
  },
  "company_intelligence": {
    "company_insights": ["specific insight about company"],
    "recent_news": ["recent developments to mention"],
    "company_values_alignment": ["how to align with company values"],
    "insider_tips": ["specific tips for this company"]
  },
  "interview_preparation": {
    "likely_questions": [
      {
        "question": "string",
        "why_they_ask": "string", 
        "ideal_response_framework": "string",
        "example_answer": "string"
      }
    ],
    "questions_to_ask": [
      {
        "question": "string",
        "why_effective": "string",
        "follow_up": "string"
      }
    ],
    "technical_prep": ["specific technical preparation needed"]
  },
  "networking_strategy": {
    "linkedin_connections": [
      {
        "role": "string",
        "how_to_find": "string",
        "message_template": "string",
        "follow_up_strategy": "string"
      }
    ],
    "informational_interviews": ["specific people/roles to target"],
    "events_to_attend": ["specific networking events"]
  },
  "skill_development": {
    "critical_gaps": [
      {
        "skill": "string",
        "importance": "high|medium|low",
        "quick_learning_path": "string",
        "resources": ["specific resources"],
        "timeline": "string"
      }
    ],
    "certifications_to_get": ["specific certifications"],
    "portfolio_improvements": ["specific project ideas"]
  },
  "application_timeline": {
    "day_1": "specific actions",
    "day_2": "specific actions", 
    "day_3": "specific actions",
    "week_2": "specific actions",
    "follow_up_schedule": ["timing and actions"]
  },
  "differentiation_strategy": {
    "unique_value_props": ["specific unique strengths"],
    "competitive_advantages": ["how you beat other candidates"],
    "memorable_positioning": "string",
    "proof_points": ["specific evidence of capabilities"]
  },
  "success_metrics": {
    "application_success_indicators": ["how to know if application is strong"],
    "interview_success_signs": ["positive interview signals"],
    "negotiation_leverage": ["factors that strengthen position"]
  }
}`;

    console.log(`🎯 ENHANCED STRATEGY: Sending context to GPT:`);
    console.log(`🎯 ENHANCED STRATEGY: - Job: ${strategyContext.job.title} at ${strategyContext.job.company.name}`);
    console.log(`🎯 ENHANCED STRATEGY: - Candidate: ${strategyContext.candidate.name}`);

    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(strategyContext) }
        ],
        model: 'gpt-4o',
        temperature: 0.4,
        max_tokens: 4000
      });

      const rawContent = aiResponse.choices?.[0]?.message?.content || '{}';
      console.log('🎯 ENHANCED STRATEGY: Raw AI response length:', rawContent.length);

      let strategyData;
      try {
        strategyData = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('🎯 ENHANCED STRATEGY: JSON parsing failed:', parseError);
        throw new Error('Failed to parse strategy response as JSON');
      }

      const enhancedStrategy = {
        job_id,
        user_profile_id,
        created_at: new Date().toISOString(),
        strategy_type: 'comprehensive',
        ...strategyData,
        metadata: {
          job_title: jobData.title,
          company_name: jobData.companies?.name || 'Company',
          candidate_name: profileData.name || profileData.personal_info?.name,
          strategy_focus: 'maximum_impact',
          estimated_success_rate: 'high'
        }
      };

      console.log(`🎯 ENHANCED STRATEGY: Generated comprehensive strategy with ${Object.keys(strategyData).length} sections`);

      return NextResponse.json({
        success: true,
        strategy: enhancedStrategy,
        message: 'Comprehensive application strategy generated',
        sections_count: Object.keys(strategyData).length
      });

    } catch (aiError) {
      console.error('🎯 ENHANCED STRATEGY: AI generation failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Enhanced strategy generation failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('🎯 ENHANCED STRATEGY: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Enhanced strategy analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate enhanced job strategy.' },
    { status: 405 }
  );
}