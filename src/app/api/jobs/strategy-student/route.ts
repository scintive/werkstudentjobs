import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
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
 * SECURITY FIX: Auth-only, no cookie-based sessions
 */
export async function POST(request: NextRequest) {
  try {
    const authSupabase = createServerSupabase(request);

    // SECURITY FIX: Verify authentication
    let authUserId: string | null = null;
    let authToken: string | null = null;
    try {
      const { data: authRes } = await authSupabase.auth.getUser();
      if (authRes?.user) {
        authUserId = authRes.user.id;
        // Get session token for internal API calls
        const { data: sessionData } = await authSupabase.auth.getSession();
        authToken = sessionData?.session?.access_token || null;
      }
    } catch (e) {
      console.log('🎓 STUDENT STRATEGY: auth.getUser() failed:', e);
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log(`🎓 STUDENT STRATEGY: Authenticated user: ${authUserId}`);

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
              'Authorization': authToken ? `Bearer ${authToken}` : ''
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

          // Fallback to direct Supabase query using auth user_id
          const { data: profiles, error: profErr } = await supabase
            .from('resume_data')
            .select('*')
            .eq('user_id', authUserId)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (profErr || !profiles || profiles.length === 0) {
            return NextResponse.json(
              { error: 'Resume data not found for authenticated user' },
              { status: 404 }
            );
          }

          // Convert resume_data to profile format
          const resumeRecord = profiles[0];
          profileData = {
            name: resumeRecord.personal_info?.name,
            email: resumeRecord.personal_info?.email,
            phone: resumeRecord.personal_info?.phone,
            location: resumeRecord.personal_info?.location,
            current_job_title: resumeRecord.professional_title,
            profile_summary: resumeRecord.professional_summary,
            skills: resumeRecord.skills?.technical || resumeRecord.skills || [],
            tools: resumeRecord.skills?.tools || [],
            preferred_languages: resumeRecord.skills?.languages || [],
            education: resumeRecord.education || [],
            degree_program: resumeRecord.education?.[0]?.field_of_study || resumeRecord.education?.[0]?.degree,
            current_year: resumeRecord.education?.[0]?.current_year,
            expected_graduation: resumeRecord.education?.[0]?.graduation_date,
            academic_projects: resumeRecord.projects || [],
            projects: resumeRecord.projects || [],
            certifications: resumeRecord.certifications || [],
            custom_sections: resumeRecord.custom_sections || []
          };
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
    const cacheKey = `student_v9_${job_id}_${profileHash}`; // v9 with GPT-5-mini + URL verification + NO Udemy/Coursera

    // Check Supabase cache first (7-day TTL) using auth user_id
    console.log('🎓 STUDENT STRATEGY: Checking Supabase cache...');

    const { data: cachedStrategy, error: cacheError} = await supabase
      .from('job_analysis_cache')
      .select('*')
      .eq('job_id', job_id)
      .eq('analysis_type', 'student_strategy')
      .eq('profile_hash', profileHash)
      .eq('user_id', authUserId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!cacheError && cachedStrategy?.strategy_data) {
      console.log('🎓 STUDENT STRATEGY: Found cached strategy in Supabase');
      return NextResponse.json({
        success: true,
        strategy: cachedStrategy.strategy_data,
        cached: true,
        cached_at: cachedStrategy.created_at,
        context: {
          job_title: jobData.title,
          company: jobData.company_name,
          is_werkstudent: jobData.is_werkstudent || jobData.title?.toLowerCase().includes('werkstudent'),
          coursework_matches: cachedStrategy.strategy_data.coursework_alignment?.length || 0,
          project_matches: cachedStrategy.strategy_data.project_alignment?.length || 0,
          eligibility_score: Object.values(cachedStrategy.strategy_data.eligibility_checklist || {}).filter((v: any) => v).length
        }
      });
    }

    console.log('🎓 STUDENT STRATEGY: No cache found - generating fresh analysis');
    
    // Create compact context for student-focused AI analysis
    const compactContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || jobData.companies?.name || 'Unknown',
        description: jobData.description,
        // ACTUAL JOB RESPONSIBILITIES - These are the real tasks!
        responsibilities: (jobData.responsibilities || []),
        required_skills: (jobData.skills || []),
        tools_technologies: (jobData.tools || []),
        nice_to_have: (jobData.nice_to_have || []),
        who_we_are_looking_for: (jobData.who_we_are_looking_for || []),
        benefits: (jobData.benefits || []),
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
        certifications: profileData.certifications || [],
        experience: profileData.experience || [],
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
    
    const systemPrompt = `You are a German job market expert specializing in Werkstudent/intern positions with deep expertise in modern skills including content creation, AI tools, marketing, and technical development.

🎯 CRITICAL MISSION: Create a HYPER-TAILORED analysis that maps this SPECIFIC student's profile to these EXACT job responsibilities. This is NOT a generic template.

📋 JOB TASK ANALYSIS REQUIREMENTS:
- Analyze EACH ACTUAL job responsibility from the job posting (NOT generic skills)
- For EACH responsibility, determine how the student's background addresses it
- Provide SPECIFIC evidence from their resume/projects/coursework
- Calculate realistic compatibility scores (0-100) based on actual evidence
- Give HIGHLY SPECIFIC learning recommendations for gaps:
  * For content creation roles: include video editing (Premiere, DaVinci, CapCut), TikTok/Reels creation, YouTube strategy
  * For marketing roles: social media platforms (Meta Blueprint, TikTok Creator Portal), analytics, growth hacking
  * For AI/tech roles: ChatGPT for graphics (DALL-E, GPT-4 Vision), Google Gemini, Midjourney, prompt engineering
  * For design roles: Canva, Figma, Adobe Creative Suite, AI design tools
  * Match resources to the EXACT task, not generic categories

🎓 STUDENT PROFILE MAPPING:
- Use ONLY the student's actual education, projects, certifications, and experience
- CRITICAL: Check certifications FIRST - they often directly match job requirements (e.g., "AI Business Development" certificate for AI BD role)
- Reference SPECIFIC coursework, project names, technologies used, and certification titles
- Connect academic work and certifications to professional requirements
- Highlight ALL relevant experience including internships, part-time work, sales/outreach roles
- Show progression and growth in their academic and professional journey

💡 TASK-BY-TASK ANALYSIS (RICH OUTPUT):
For each job responsibility, provide:
1) task_explainer: a crisp 1–2 sentence explanation of what the task actually entails in this role/company (no fluff, no generic definitions)
2) compatibility_score: INTEGER from 0-100 (NOT decimal), score generously based on transferable skills:
   - Certifications (weight: 40% if directly relevant)
   - Experience (weight: 35% for relevant roles/tasks, COUNT WERKSTUDENT/INTERN EXPERIENCE)
   - Projects/Skills (weight: 25% for demonstrated abilities, COUNT ACADEMIC PROJECTS)

   SCORING EXAMPLES (use as reference):
   - 80-100: Direct experience with this exact task (e.g., "Built automation system" for "Automation" task)
   - 60-79: Related experience that transfers well (e.g., "UI/UX design" for "Content design" task)
   - 40-59: Some relevant skills but not direct experience (e.g., "Project management" for "Program planning")
   - 20-39: Foundational skills present, significant gap (e.g., "Communication skills" for "Marketing strategy")
   - 0-19: No relevant experience or skills

3) user_alignment: a specific, organic sentence tying user's best relevant certification/experience/project to this task (reference the exact item name). If nothing truly relevant exists, say so clearly (e.g., "No direct WordPress experience")

STRICT RELEVANCE RULES:
- Do NOT include unrelated evidence (e.g., prompt‑engineering project is NOT relevant to WordPress site building)
- Only map projects/experience/coursework that truly align with the task (tech, domain, output)
- If no genuine evidence exists, set user_alignment to a truthful statement and focus learning_paths on how to close that gap quickly

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
      "task_explainer": "1–2 sentences explaining the real‑world shape of this task",
      "compatibility_score": 0-100,
      "user_alignment": "organic, specific sentence tying best related project/experience; or state 'no direct experience'",
      "user_evidence": "SPECIFIC project/coursework/experience names that support the alignment (or empty)"
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
      // PARALLEL EXECUTION: GPT-4o-mini for analysis + GPT-5-mini for learning paths
      const [aiResponse, learningPathsPromise] = await Promise.all([
        // GPT-4o-mini: Fast, cheap task analysis (NO learning paths)
        llmService.createJsonCompletion({
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
          max_tokens: 6000  // REDUCED: No learning paths = less tokens needed
        }),

        // GPT-5-mini: Accurate, comprehensive learning resource links (replacing Claude)
        llmService.generateLearningPaths(
          compactContext.job.responsibilities.map(resp => ({ task: resp }))
        )
      ]);
      
      const rawContent = aiResponse.choices?.[0]?.message?.content || '{}';
      console.log('🎓 STUDENT STRATEGY: Raw AI response length:', rawContent.length);
      
      // Clean and validate JSON response
      let cleanedContent = rawContent.trim();
      
      // If response seems truncated, try to salvage what we can
      if (!cleanedContent.endsWith('}')) {
        console.log('🎓 STUDENT STRATEGY: Detected truncated JSON, attempting recovery');
        
        // Find the last complete task object
        const lastCompleteTask = cleanedContent.lastIndexOf('},{');
        if (lastCompleteTask > 0) {
          // Truncate to last complete task and close the array
          cleanedContent = cleanedContent.substring(0, lastCompleteTask + 1);
        }
        
        // Close any unterminated strings
        const quoteCount = (cleanedContent.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          cleanedContent += '"';
        }
        
        // Ensure arrays are closed
        if (cleanedContent.includes('"job_task_analysis":[') && !cleanedContent.includes('"job_task_analysis":[]')) {
          if (!cleanedContent.endsWith(']')) {
            cleanedContent += ']';
          }
        }
        
        // Count and balance brackets/braces
        const openBraces = (cleanedContent.match(/\{/g) || []).length;
        const closeBraces = (cleanedContent.match(/\}/g) || []).length;
        const openBrackets = (cleanedContent.match(/\[/g) || []).length;
        const closeBrackets = (cleanedContent.match(/\]/g) || []).length;
        
        cleanedContent += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
        cleanedContent += '}'.repeat(Math.max(0, openBraces - closeBraces));
        
        console.log('🎓 STUDENT STRATEGY: Recovery complete, final length:', cleanedContent.length);
      }
      
      let strategyData;
      try {
        strategyData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('🎓 STUDENT STRATEGY: JSON parsing failed, attempting manual extraction');

        // Try to extract at least the job_task_analysis section
        try {
          const taskAnalysisMatch = cleanedContent.match(/"job_task_analysis":\s*\[([^\]]+)\]/s);
          if (taskAnalysisMatch) {
            // Build minimal valid JSON with just the tasks
            const minimalJson = `{
              "user_profile_summary": {"name": "Student", "current_position": "Student", "key_strengths": [], "experience_level": "junior"},
              "job_task_analysis": [${taskAnalysisMatch[1]}],
              "skills_analysis": {"matched_skills": [], "skill_gaps": [], "skills_to_remove": [], "skills_to_add": []},
              "content_suggestions": {"experience_rewrites": [], "project_rewrites": []},
              "win_strategy": {"main_positioning": "", "key_differentiators": [], "interview_talking_points": [], "application_strategy": ""},
              "eligibility_checklist": {},
              "coursework_alignment": [],
              "project_alignment": [],
              "ats_keywords": [],
              "german_keywords": []
            }`;
            strategyData = JSON.parse(minimalJson);
            console.log('🎓 STUDENT STRATEGY: Recovered partial data successfully');
          } else {
            // If we can't extract anything, return minimal structure
            strategyData = {
              user_profile_summary: { name: "Student", current_position: "Student", key_strengths: [], experience_level: "junior" },
              job_task_analysis: [],
              skills_analysis: { matched_skills: [], skill_gaps: [], skills_to_remove: [], skills_to_add: [] },
              content_suggestions: { experience_rewrites: [], project_rewrites: [] },
              win_strategy: { main_positioning: "", key_differentiators: [], interview_talking_points: [], application_strategy: "" },
              eligibility_checklist: {},
              coursework_alignment: [],
              project_alignment: [],
              ats_keywords: [],
              german_keywords: []
            };
            console.log('🎓 STUDENT STRATEGY: Using fallback minimal structure');
          }
        } catch (recoveryError) {
          console.error('🎓 STUDENT STRATEGY: Recovery failed, using minimal structure:', recoveryError);
          strategyData = {
            user_profile_summary: { name: "Student", current_position: "Student", key_strengths: [], experience_level: "junior" },
            job_task_analysis: [],
            skills_analysis: { matched_skills: [], skill_gaps: [], skills_to_remove: [], skills_to_add: [] },
            content_suggestions: { experience_rewrites: [], project_rewrites: [] },
            win_strategy: { main_positioning: "", key_differentiators: [], interview_talking_points: [], application_strategy: "" },
            eligibility_checklist: {},
            coursework_alignment: [],
            project_alignment: [],
            ats_keywords: [],
            german_keywords: []
          };
        }
      }

      // Merge GPT-5 learning paths into GPT-4o-mini task analysis
      console.log('🎓 STUDENT STRATEGY: Merging GPT-5 learning paths with GPT-4o-mini analysis');
      if (learningPathsPromise && strategyData.job_task_analysis) {
        strategyData.job_task_analysis = strategyData.job_task_analysis.map((task: any) => {
          // Try to find matching learning paths from GPT-5
          // GPT-5 uses task text as key, need to match flexibly
          const matchingKey = Object.keys(learningPathsPromise).find(key =>
            key.toLowerCase().includes(task.task.toLowerCase().substring(0, 20)) ||
            task.task.toLowerCase().includes(key.toLowerCase().substring(0, 20))
          );

          if (matchingKey && learningPathsPromise[matchingKey]) {
            return {
              ...task,
              learning_paths: learningPathsPromise[matchingKey]
            };
          }

          // Fallback: empty learning paths if GPT-5 didn't generate for this task
          return {
            ...task,
            learning_paths: {
              quick_wins: [],
              certifications: [],
              deepening: []
            }
          };
        });
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
      
      // Save to Supabase for persistent caching (7 days) using auth user_id
      try {
        await supabase
          .from('job_analysis_cache')
          .insert({
            job_id,
            user_id: authUserId,
            analysis_type: 'student_strategy',
            strategy_data: strategy,
            profile_hash: profileHash,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });
        console.log('🎓 STUDENT STRATEGY: Saved to Supabase cache');
      } catch (saveError) {
        console.error('🎓 STUDENT STRATEGY: Failed to save to Supabase:', saveError);
        // Continue even if save fails
      }

      // Also cache in memory for fast access during session
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
