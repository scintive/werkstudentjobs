import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';
import { fastMatchingService } from '@/lib/services/fastMatchingService';
import type { StudentJobStrategy, StudentProfile } from '@/lib/types/studentProfile';
import type { UserProfile } from '@/lib/types';

// Cache for student strategies
const studentStrategyCache = new Map<string, { strategy: StudentJobStrategy; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Generate profile hash for cache
 */
function generateProfileHash(profile: any): string {
  const key = JSON.stringify({
    skills: profile.skills,
    coursework: profile.relevant_coursework,
    projects: profile.academic_projects,
    availability: profile.weekly_availability
  });
  return Buffer.from(key).toString('base64').slice(0, 12);
}

/**
 * POST /api/jobs/analyze-student
 * Generate Werkstudent-focused Job Strategy
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id, user_profile_id, student_profile } = await request.json();
    
    if (!job_id || (!user_profile_id && !student_profile)) {
      return NextResponse.json(
        { error: 'job_id and either user_profile_id or student_profile required' },
        { status: 400 }
      );
    }
    
    console.log(`🎓 STUDENT STRATEGY: Analyzing job ${job_id}`);
    
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
    
    // Fetch or use provided student profile
    let profileData: any = student_profile;
    
    if (!profileData && user_profile_id) {
      const { data: dbProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user_profile_id)
        .single();
      
      if (profileError || !dbProfile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
      profileData = dbProfile;
    }
    
    const profileHash = generateProfileHash(profileData);
    const cacheKey = `student_${job_id}_${profileHash}`;
    
    // Check cache
    const cached = studentStrategyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('🎓 STUDENT STRATEGY: Cache hit');
      return NextResponse.json({
        success: true,
        strategy: cached.strategy,
        cached: true,
        cache_age: Math.round((Date.now() - cached.timestamp) / 1000)
      });
    }
    
    // Create compact context for student-focused AI analysis
    const compactContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || 'Unknown',
        must_haves: [
          ...(jobData.skills_original || []),
          ...(jobData.tools_original || []),
          ...(jobData.responsibilities_original || [])
        ].slice(0, 8),
        nice_to_haves: (jobData.nice_to_have_original || []).slice(0, 6),
        work_mode: jobData.work_mode,
        location: jobData.location_city,
        language: jobData.language_required || jobData.german_required,
        hours_per_week: jobData.hours_per_week || '15-20',
        is_werkstudent: jobData.title?.toLowerCase().includes('werkstudent') || 
                        jobData.title?.toLowerCase().includes('working student') ||
                        jobData.title?.toLowerCase().includes('praktikum')
      },
      student: {
        degree: profileData.degree_program || 'Computer Science',
        year: profileData.current_year || 3,
        graduation: profileData.expected_graduation || '2025-06',
        coursework: (profileData.relevant_coursework || []).slice(0, 5).map((c: any) => ({
          name: c.course_name,
          topics: c.relevant_topics?.slice(0, 3),
          project: c.projects?.[0]
        })),
        projects: (profileData.academic_projects || []).slice(0, 3).map((p: any) => ({
          title: p.title,
          tech: p.technologies?.slice(0, 4),
          metrics: p.metrics?.slice(0, 2)
        })),
        skills: profileData.skills || [],
        tools: profileData.tools || [],
        languages: profileData.language_proficiencies || [],
        availability: profileData.weekly_availability || { hours_min: 15, hours_max: 20 },
        start_date: profileData.earliest_start_date || 'ASAP',
        duration: profileData.preferred_duration || { months_min: 6, months_max: 12 }
      }
    };
    
    // German keywords for Werkstudent positions
    const germanKeywords = [
      'Werkstudent', 'Werkstudent/in', 'Working Student',
      'Immatrikulation', 'Einschreibung', 'Teilzeit',
      '15-20 Stunden/Woche', 'Pflichtpraktikum', 'Praxissemester',
      'Bachelor', 'Master', 'Studium'
    ];
    
    const systemPrompt = `You are a German job market expert specializing in Werkstudent/intern positions. 
Analyze this student's profile against the job requirements. Focus on translating academic work into professional value.

CRITICAL RULES:
- Map coursework and projects DIRECTLY to job requirements
- Generate metrics from projects (accuracy %, speed, scale, grade)
- Include German keywords for ATS optimization
- Address common student barriers (no experience, availability)
- Output valid JSON only, no extra text
- Use German terms if job is in Germany

OUTPUT SCHEMA:
{
  "eligibility_checklist": {
    "enrollment": boolean,
    "availability": boolean,
    "start_date": boolean,
    "duration": boolean,
    "language": boolean,
    "location": boolean
  },
  "coursework_alignment": [
    {
      "course": "course name",
      "requirement": "job requirement it addresses",
      "evidence": "specific project/topic that proves capability",
      "relevance_score": 0-100
    }
  ],
  "project_alignment": [
    {
      "project": "project name",
      "requirement": "job requirement it addresses",
      "evidence": "specific achievement/implementation",
      "metric": "quantified result (e.g., 95% accuracy)",
      "impact_score": 0-100
    }
  ],
  "red_flags": [
    {
      "issue": "potential concern",
      "severity": "low|medium|high",
      "reframe_phrase": "positive reframing for cover letter"
    }
  ],
  "interview_questions": [
    {
      "question": "likely interview question",
      "focus_area": "skill/requirement being tested",
      "preparation_tip": "how to prepare"
    }
  ],
  "fit_summary": ["4-6 bullet points on why student fits"],
  "must_have_gaps": [
    {
      "skill": "missing requirement",
      "why_matters": "importance for role",
      "suggested_fix": "quick learning approach",
      "learning_resource": "specific course/tutorial URL"
    }
  ],
  "positioning": {
    "themes": ["3 positioning themes"],
    "elevator_pitch": "40-60 word pitch emphasizing academic strengths"
  },
  "ats_keywords": ["15-20 keywords including German terms"],
  "talking_points": [
    {
      "point": "discussion point",
      "achievement_ref": "coursework/project reference",
      "keywords": ["related keywords"]
    }
  ],
  "german_keywords": ["Werkstudent-specific German terms"]
}`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(compactContext) }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1200
      });
      
      const strategyData = JSON.parse(aiResponse.choices?.[0]?.message?.content || '{}');
      
      // Add German keywords to ATS keywords if job is in Germany
      if (jobData.location_country?.toLowerCase().includes('germany') || 
          jobData.language_required?.includes('DE')) {
        strategyData.ats_keywords = [
          ...(strategyData.ats_keywords || []),
          ...germanKeywords.slice(0, 5)
        ];
        strategyData.german_keywords = germanKeywords;
      }
      
      const strategy: StudentJobStrategy = {
        job_id,
        user_profile_id: user_profile_id || 'student_' + Date.now(),
        created_at: new Date().toISOString(),
        profile_hash: profileHash,
        eligibility_checklist: strategyData.eligibility_checklist || {},
        coursework_alignment: strategyData.coursework_alignment || [],
        project_alignment: strategyData.project_alignment || [],
        red_flags: strategyData.red_flags || [],
        interview_questions: strategyData.interview_questions || [],
        fit_summary: strategyData.fit_summary || [],
        must_have_gaps: strategyData.must_have_gaps || [],
        positioning: strategyData.positioning || { themes: [], elevator_pitch: '' },
        ats_keywords: strategyData.ats_keywords || [],
        talking_points: strategyData.talking_points || [],
        german_keywords: strategyData.german_keywords || germanKeywords
      };
      
      // Cache the strategy
      studentStrategyCache.set(cacheKey, {
        strategy,
        timestamp: Date.now()
      });
      
      console.log(`🎓 STUDENT STRATEGY: Generated - ${strategy.coursework_alignment.length} courses, ${strategy.project_alignment.length} projects aligned`);
      
      return NextResponse.json({
        success: true,
        strategy,
        cached: false,
        context: {
          job_title: jobData.title,
          company: jobData.company_name,
          is_werkstudent: compactContext.job.is_werkstudent,
          coursework_matches: strategy.coursework_alignment.length,
          project_matches: strategy.project_alignment.length,
          eligibility_score: Object.values(strategy.eligibility_checklist).filter(v => v).length
        }
      });
      
    } catch (aiError) {
      console.error('🎓 STUDENT STRATEGY: AI generation failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Student strategy generation failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('🎓 STUDENT STRATEGY: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Student strategy analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze student profile for jobs.' },
    { status: 405 }
  );
}