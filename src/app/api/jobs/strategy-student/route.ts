import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
 * POST /api/jobs/strategy-student
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
    
    // Fetch job data (without companies join for now)
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();
    
    if (jobError || !jobData) {
      console.error('🎓 STUDENT STRATEGY: Job fetch error:', jobError);
      return NextResponse.json(
        { error: 'Job not found', details: jobError?.message },
        { status: 404 }
      );
    }
    
    // Fetch or use provided student profile
    let profileData: any = student_profile;
    
    if (!profileData && user_profile_id) {
      if (user_profile_id === 'latest') {
        // Use the existing /api/profile/latest endpoint to get the most complete profile data
        try {
          const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/profile/latest`, {
            headers: {
              'Cookie': `user_session=${(await cookies()).get('user_session')?.value}; user_email=${(await cookies()).get('user_email')?.value}`
            }
          });
          
          if (!profileResponse.ok) {
            throw new Error(`Profile fetch failed: ${profileResponse.status}`);
          }
          
          const profileApiData = await profileResponse.json();
          
          if (profileApiData.success && profileApiData.profile) {
            // Check if we got resume_data structure or user_profiles structure
            const rawProfile = profileApiData.profile;
            
            if (rawProfile.personal_info) {
              // This is resume_data structure - convert to user_profiles format
              console.log('🎓 STUDENT STRATEGY: Converting resume_data to user_profiles format');
              profileData = {
                // Basic info from personal_info
                name: rawProfile.personal_info?.name,
                email: rawProfile.personal_info?.email,
                phone: rawProfile.personal_info?.phone,
                location: rawProfile.personal_info?.location,
                
                // Professional info
                current_job_title: rawProfile.professional_title,
                profile_summary: rawProfile.professional_summary,
                
                // Skills
                skills: rawProfile.skills?.technical || rawProfile.skills || [],
                tools: rawProfile.skills?.tools || [],
                preferred_languages: rawProfile.skills?.languages || [],
                
                // Education from resume_data format
                education: rawProfile.education || [],
                // Extract degree program from first education entry
                degree_program: rawProfile.education?.[0]?.field_of_study || 
                               rawProfile.education?.[0]?.degree,
                current_year: rawProfile.education?.[0]?.current_year,
                expected_graduation: rawProfile.education?.[0]?.graduation_date,
                
                // Projects
                academic_projects: rawProfile.projects || [],
                projects: rawProfile.projects || [],
                
                // Additional fields
                certifications: rawProfile.certifications || [],
                custom_sections: rawProfile.custom_sections || []
              };
            } else {
              // This is already user_profiles structure
              console.log('🎓 STUDENT STRATEGY: Using user_profiles structure');
              profileData = rawProfile;
            }
            
            console.log('🎓 STUDENT STRATEGY: Profile loaded from /api/profile/latest');
          } else {
            throw new Error('Invalid profile API response');
          }
        } catch (fetchError) {
          console.error('🎓 STUDENT STRATEGY: Failed to fetch from /api/profile/latest:', fetchError);
          
          // Fallback to direct Supabase query
          const cookieStore = await cookies();
          const sessionId = cookieStore.get('user_session')?.value;
          const userEmail = cookieStore.get('user_email')?.value;

          if (!sessionId && !userEmail) {
            return NextResponse.json(
              { error: 'Not authenticated' },
              { status: 401 }
            );
          }

          let query = supabase.from('user_profiles').select('*');
          if (sessionId) {
            query = query.eq('session_id', sessionId);
          } else if (userEmail) {
            query = query.eq('email', userEmail);
          }

          const { data: profiles, error: profErr } = await query.order('updated_at', { ascending: false }).limit(1);
          if (profErr || !profiles || profiles.length === 0) {
            return NextResponse.json(
              { error: 'User profile not found' },
              { status: 404 }
            );
          }
          profileData = profiles[0];
        }
      } else {
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
    }
    
    const profileHash = generateProfileHash(profileData);
    const cacheKey = `student_v3_${job_id}_${profileHash}`; // v3 to force cache refresh with real data
    
    // DISABLE CACHE FOR REAL RESUME DATA - Force regeneration to ensure real analysis
    console.log('🎓 STUDENT STRATEGY: Cache disabled - generating fresh analysis with real data');
    
    // Clear any existing cache for this job to force real data analysis
    studentStrategyCache.delete(cacheKey);
    
    // Create compact context for student-focused AI analysis
    const compactContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || jobData.companies?.name || 'Unknown',
        description: jobData.description,
        // ACTUAL JOB RESPONSIBILITIES - These are the real tasks!
        responsibilities: (jobData.responsibilities_original || []),
        required_skills: (jobData.skills_original || []),
        tools_technologies: (jobData.tools_original || []),
        nice_to_have: (jobData.nice_to_have_original || []),
        who_we_are_looking_for: (jobData.who_we_are_looking_for_original || []),
        benefits: (jobData.benefits_original || []),
        work_mode: jobData.work_mode,
        location: jobData.location_city || jobData.city,
        language: jobData.language_required || jobData.german_required,
        hours_per_week: jobData.hours_per_week || '15-20',
        contract_type: jobData.contract_type || jobData.employment_type,
        is_werkstudent: jobData.is_werkstudent || jobData.werkstudent || 
                        jobData.title?.toLowerCase().includes('werkstudent') || 
                        jobData.title?.toLowerCase().includes('working student') ||
                        jobData.title?.toLowerCase().includes('praktikum')
      },
      student: {
        // Extract degree from education if available, otherwise use profile data
        degree: profileData.degree_program || 
                (profileData.education?.[0]?.field_of_study) || 
                (profileData.education?.[0]?.degree + ' in ' + profileData.education?.[0]?.field_of_study) ||
                'Not specified',
        year: profileData.current_year || null,
        graduation: profileData.expected_graduation || null,
        coursework: (profileData.relevant_coursework || []).slice(0, 5).map((c: any) => ({
          name: c.course_name,
          topics: c.relevant_topics?.slice(0, 3),
          project: c.projects?.[0]
        })),
        projects: (profileData.academic_projects || profileData.projects || []).slice(0, 3).map((p: any) => ({
          title: p.title || p.name,
          tech: p.technologies?.slice(0, 4),
          metrics: p.metrics?.slice(0, 2) || p.description
        })),
        skills: profileData.skills || [],
        tools: profileData.tools || [],
        languages: profileData.language_proficiencies || profileData.preferred_languages || [],
        availability: profileData.weekly_availability || null,
        start_date: profileData.earliest_start_date || null,
        duration: profileData.preferred_duration || null
      }
    };
    
    // German keywords for Werkstudent positions
    const germanKeywords = [
      'Werkstudent', 'Werkstudent/in', 'Working Student',
      'Immatrikulation', 'Einschreibung', 'Teilzeit',
      '15-20 Stunden/Woche', 'Pflichtpraktikum', 'Praxissemester',
      'Bachelor', 'Master', 'Studium'
    ];
    
    // Debug logging to verify correct profile data
    console.log('🎓 STUDENT STRATEGY: Profile data check:');
    console.log('  - Name:', profileData.name);
    console.log('  - Education:', profileData.education?.[0]);
    console.log('  - Degree program:', profileData.degree_program);
    console.log('  - Current year:', profileData.current_year);
    console.log('  - Expected graduation:', profileData.expected_graduation);
    console.log('  - Professional title:', profileData.professional_title || profileData.current_job_title);
    console.log('  - Skills count:', Array.isArray(profileData.skills) ? profileData.skills.length : 'N/A');
    console.log('  - Projects count:', Array.isArray(profileData.projects) ? profileData.projects.length : 'N/A');
    console.log('  - Compact context student:', compactContext.student);
    
    const systemPrompt = `You are a German job market expert specializing in Werkstudent/intern positions. 

🎯 CRITICAL MISSION: Create a HYPER-TAILORED analysis that maps this SPECIFIC student's profile to these EXACT job responsibilities. This is NOT a generic template.

📋 JOB TASK ANALYSIS REQUIREMENTS:
- Analyze EACH ACTUAL job responsibility from the job posting (NOT generic skills)
- For EACH responsibility, determine how the student's background addresses it
- Provide SPECIFIC evidence from their resume/projects/coursework
- Calculate realistic compatibility scores (0-100) based on actual evidence
- Give targeted learning recommendations for gaps

🎓 STUDENT PROFILE MAPPING:
- Use ONLY the student's actual education, projects, and experience
- Reference SPECIFIC coursework, project names, technologies used
- Connect academic work to professional requirements
- Highlight relevant internships, part-time work, or volunteer experience
- Show progression and growth in their academic journey

💡 TASK-BY-TASK ANALYSIS:
For each job responsibility, provide:
1. How well their current background fits (with evidence)
2. What specific experience/coursework applies
3. What they need to learn or develop
4. Concrete steps to bridge any gaps

OUTPUT FORMAT: Return your analysis as a valid JSON object following the schema below.

OUTPUT SCHEMA:
{
  "user_profile_summary": {
    "name": "student name",
    "current_position": "current academic focus/role",
    "key_strengths": ["3-4 main strengths"],
    "experience_level": "junior|intermediate|advanced"
  },
  "job_task_analysis": [
    {
      "task": "EXACT job responsibility from job posting",
      "compatibility_score": 0-100,
      "user_evidence": "SPECIFIC projects/coursework/experience that shows they can do this",
      "academic_connection": "how their degree/courses relate to this responsibility", 
      "skill_gap": "what specific skills/knowledge they need to develop",
      "learning_path": "concrete steps to prepare for this responsibility",
      "interview_talking_point": "how they should present their relevant experience"
    }
  ],
  "skills_analysis": {
    "matched_skills": [
      {
        "category": "skill category name",
        "skills": ["user skills that match job"],
        "relevance": "high|medium|low",
        "evidence": "where these skills are demonstrated"
      }
    ],
    "skill_gaps": [
      {
        "missing_skill": "required skill not in profile",
        "priority": "high|medium|low",
        "learning_path": "specific resource/approach",
        "time_to_learn": "estimated duration"
      }
    ],
    "skills_to_remove": ["skills not relevant for this specific job"],
    "skills_to_add": ["skills to emphasize/add for this job"]
  },
  "content_suggestions": {
    "experience_rewrites": [
      {
        "original_description": "current experience description",
        "suggested_rewrite": "job-tailored version with impact metrics",
        "keywords_added": ["ATS keywords incorporated"],
        "impact_increase": "percentage improvement in relevance"
      }
    ],
    "project_rewrites": [
      {
        "original_description": "current project description",  
        "suggested_rewrite": "job-focused version highlighting relevant aspects",
        "relevance_boost": "how this rewrite improves job match"
      }
    ]
  },
  "win_strategy": {
    "main_positioning": "single sentence positioning statement",
    "key_differentiators": ["3 things that set student apart"],
    "interview_talking_points": ["3-4 specific points to discuss"],
    "application_strategy": "overall approach to win this specific job"
  },
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
  "ats_keywords": ["15-20 keywords including German terms"],
  "german_keywords": ["Werkstudent-specific German terms"]
}`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `🎯 ANALYZE THIS SPECIFIC STUDENT AND JOB MATCH:

CRITICAL: Use the EXACT job responsibilities listed below, NOT generic skills. Each task in job_task_analysis MUST correspond to a real responsibility from the job posting.

JOB RESPONSIBILITIES TO ANALYZE:
${compactContext.job.responsibilities.map((resp, i) => `${i+1}. ${resp}`).join('\n')}

REQUIRED SKILLS FROM JOB:
${compactContext.job.required_skills.join(', ')}

WHO THEY'RE LOOKING FOR:
${Array.isArray(compactContext.job.who_we_are_looking_for) ? compactContext.job.who_we_are_looking_for.join('\n') : 'Not specified'}

STUDENT PROFILE DATA:
${JSON.stringify(compactContext.student)}

Return your analysis in valid JSON format matching the schema provided. Make sure EACH job responsibility above gets analyzed in the job_task_analysis array.` }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 4500
      });
      
      const rawContent = aiResponse.choices?.[0]?.message?.content || '{}';
      console.log('🎓 STUDENT STRATEGY: Raw AI response length:', rawContent.length);
      
      // Check if response was truncated and try to fix
      let cleanedContent = rawContent.trim();
      if (!cleanedContent.endsWith('}')) {
        console.log('🎓 STUDENT STRATEGY: Detected truncated JSON, attempting to fix');
        
        // Handle unterminated strings by finding the last complete field
        const lastQuoteIndex = cleanedContent.lastIndexOf('"');
        if (lastQuoteIndex > 0) {
          // Check if we're in the middle of a string value
          const beforeQuote = cleanedContent.substring(0, lastQuoteIndex);
          const afterQuote = cleanedContent.substring(lastQuoteIndex + 1);
          
          // If there's content after the last quote that looks like an incomplete string
          if (afterQuote && !afterQuote.includes('"') && !afterQuote.trim().endsWith('}')) {
            // Truncate at the last complete field
            cleanedContent = beforeQuote + '"';
          }
        }
        
        // Count and add missing closing braces
        const openBraces = (cleanedContent.match(/\{/g) || []).length;
        const closeBraces = (cleanedContent.match(/\}/g) || []).length;
        const openBrackets = (cleanedContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanedContent.match(/\]/g) || []).length;
        
        const missingBrackets = openBrackets - closeBrackets;
        const missingBraces = openBraces - closeBraces;
        
        // Add missing closing brackets and braces
        cleanedContent += ']'.repeat(Math.max(0, missingBrackets));
        cleanedContent += '}'.repeat(Math.max(0, missingBraces));
        console.log('🎓 STUDENT STRATEGY: Added', missingBrackets, 'closing brackets and', missingBraces, 'closing braces');
      }
      
      let strategyData;
      try {
        strategyData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('🎓 STUDENT STRATEGY: JSON parsing failed even after cleanup:', parseError);
        console.error('🎓 STUDENT STRATEGY: Cleaned content:', cleanedContent.slice(0, 500));
        throw new Error('Failed to parse AI response as JSON');
      }
      
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
        // New comprehensive analysis fields
        user_profile_summary: strategyData.user_profile_summary || {},
        job_task_analysis: strategyData.job_task_analysis || [],
        skills_analysis: strategyData.skills_analysis || { matched_skills: [], skill_gaps: [], skills_to_remove: [], skills_to_add: [] },
        content_suggestions: strategyData.content_suggestions || { experience_rewrites: [], project_rewrites: [] },
        win_strategy: strategyData.win_strategy || {},
        // Legacy fields
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
