export const runtime = 'nodejs';
export const maxDuration = 180; // 3 minutes for cover letter generation

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
import { llmService } from '@/lib/services/llmService';
import type { StudentProfile } from '@/lib/types/studentProfile';

interface StudentCoverLetter {
  id: string;
  job_id: string;
  user_profile_id: string;
  tone: 'motivated' | 'professional' | 'enthusiastic';
  length: 'short' | 'balanced';
  language: 'DE' | 'EN';
  content: {
    subject: string;
    salutation: string;
    intro: string;
    body_paragraphs: string[];
    closing: string;
    sign_off: string;
  };
  student_specifics: {
    enrollment_mentioned: boolean;
    availability_mentioned: boolean;
    projects_highlighted: string[];
    coursework_referenced: string[];
  };
  used_keywords: string[];
  german_keywords?: string[];
  created_at: string;
}

// Cache for student cover letters
const studentLetterCache = new Map<string, { letter: StudentCoverLetter; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * POST /api/jobs/cover-letter-student
 * Generate Werkstudent-optimized cover letter (180-240 words)
 */
export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabase(request);

    // SECURITY FIX: Verify authentication
    let authUserId: string | null = null;
    try {
      const { data: authRes } = await supabase.auth.getUser();
      if (authRes?.user) {
        authUserId = authRes.user.id;
      }
    } catch (e) {
      console.log('🎓 COVER LETTER: auth.getUser() failed:', e);
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    console.log(`🎓 COVER LETTER: Authenticated user: ${authUserId}`);

    const {
      job_id,
      variant_id, // NEW: Accept variant_id for direct lookup
      user_profile_id,
      student_profile,
      tone = 'motivated',
      length = '250words', // Fixed at 250 words
      load_only = false, // If true, only load existing letter, don't generate
      force_regenerate = false, // If true, regenerate even if existing letter found
      language = 'AUTO',
      strategy_context = null,
      custom_instructions = '', // User's custom instructions
      include_university = true, // NEW: Toggle for university/degree
      include_semester = true, // NEW: Toggle for semester info
      include_hours = true // NEW: Toggle for weekly hours
    } = await request.json();

    if (!job_id || (!user_profile_id && !student_profile)) {
      return NextResponse.json(
        { error: 'job_id and either user_profile_id or student_profile required' },
        { status: 400 }
      );
    }

    console.log(`🎓 STUDENT COVER LETTER: ${load_only ? 'Loading' : 'Generating'} ${tone} ${length} letter for job ${job_id}${variant_id ? ` (variant: ${variant_id})` : ''}`);
    if (custom_instructions) {
      console.log(`🎓 STUDENT COVER LETTER: Custom instructions provided: ${custom_instructions.substring(0, 100)}...`);
    }

    // Check cache (skip if custom instructions provided)
    const cacheKey = `student_${job_id}_${user_profile_id || 'profile'}_${tone}_${length}_${language}`;
    const cached = studentLetterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL && !custom_instructions && !load_only) {
      console.log('🎓 STUDENT COVER LETTER: Cache hit');
      return NextResponse.json({
        success: true,
        cover_letter: cached.letter,
        cached: true
      });
    }

    // Check for existing cover letter in variant - use variant_id if provided, otherwise query by job_id + user
    let existingVariant = null;

    if (variant_id) {
      // Direct lookup by variant_id (fastest)
      const { data: variant } = await supabase
        .from('resume_variants')
        .select('id, cover_letter_content, cover_letter_generated_at, cover_letter_generation_count, user_id')
        .eq('id', variant_id)
        .eq('user_id', authUserId as any)
        .single();

      existingVariant = variant;
      console.log(`📋 COVER LETTER: Queried by variant_id (${variant_id}):`, existingVariant ? 'Found' : 'Not found');
    } else {
      // Fallback: Query by job_id + user_id
      const { data: variants } = await supabase
        .from('resume_variants')
        .select('id, cover_letter_content, cover_letter_generated_at, cover_letter_generation_count, user_id')
        .eq('job_id', job_id)
        .eq('user_id', authUserId as any)
        .order('updated_at', { ascending: false })
        .limit(1);

      existingVariant = variants?.[0];
      console.log(`📋 COVER LETTER: Queried by job_id (${job_id}):`, existingVariant ? 'Found' : 'Not found');
    }

    // If variant exists with cover letter, return it (unless regenerating)
    if ((existingVariant as any)?.cover_letter_content && !custom_instructions && !force_regenerate) {
      console.log('📋 COVER LETTER: Found existing cover letter in variant');
      const savedData = JSON.parse((existingVariant as any).cover_letter_content);

      // Handle versioned format vs legacy format
      let versions = [];
      let currentVersion = 1;

      if (savedData.versions && Array.isArray(savedData.versions)) {
        // New versioned format
        versions = savedData.versions;
        currentVersion = savedData.current_version || versions.length;
      } else {
        // Legacy format - convert to versioned
        versions = [{
          version: 1,
          generated_at: (existingVariant as any).cover_letter_generated_at || new Date().toISOString(),
          cover_letter: savedData
        }];
        currentVersion = 1;
      }

      // Get the current version for display
      const currentLetter = versions.find((v: any) => v.version === currentVersion) || versions[versions.length - 1];
      const savedLetter = currentLetter.cover_letter;

      // Calculate word count for existing letter
      const fullText = savedLetter.content
        ? `${savedLetter.content.intro} ${savedLetter.content.body_paragraphs.join(' ')} ${savedLetter.content.closing}`
        : '';
      const wordCount = fullText.split(' ').filter(w => w.length > 0).length;

      return NextResponse.json({
        success: true,
        cover_letter: savedLetter, // Return the current version
        cached: true,
        from_variant: true,
        versions: versions, // Return all versions for version selector
        current_version: currentVersion,
        metadata: {
          word_count: wordCount,
          generation_count: (existingVariant as any).cover_letter_generation_count || 0,
          generation_limit: 2,
          generated_at: (currentLetter as any).generated_at,
          total_versions: versions.length
        }
      });
    }

    // If load_only flag is set and no existing letter found, return empty
    if (load_only) {
      console.log('📋 COVER LETTER: load_only=true, no existing letter found');
      return NextResponse.json({
        success: true,
        cover_letter: null,
        versions: [],
        current_version: 0,
        metadata: {
          generation_count: 0,
          generation_limit: 2
        }
      });
    }

    // Enforce 2-generation limit
    if (existingVariant && (existingVariant as any).cover_letter_generation_count >= 2) {
      console.log('⚠️ COVER LETTER: Generation limit reached (2/2)');
      return NextResponse.json({
        error: 'Cover letter generation limit reached',
        message: 'You can only generate 2 cover letters per job. Please use the existing one or edit it manually.',
        generation_count: (existingVariant as any).cover_letter_generation_count
      }, { status: 429 });
    }

    // Fetch job data
    const { data: jobDataRaw, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          description,
          website_url,
          industry
        )
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !jobDataRaw) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Add type assertion for all jobData accesses
    const jobData = jobDataRaw as any;
    
    // Use provided student profile or fetch from database
    let profileData: Partial<StudentProfile> = student_profile || {};
    
    if (!student_profile && user_profile_id) {
      if (user_profile_id === 'latest') {
        // CRITICAL FIX: Instead of calling /api/profile/latest via fetch (which loses auth context),
        // directly query the database using the same Supabase client
        console.log('🎓 COVER LETTER: Fetching profile directly from database (authenticated user:', authUserId, ')');

        // Get resume data for authenticated user
        const { data: resumeDataList, error: resumeError } = await supabase
          .from('resume_data')
          .select('*')
          .eq('user_id', authUserId as any)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (resumeError || !resumeDataList || resumeDataList.length === 0) {
          console.error('🎓 COVER LETTER: Failed to fetch resume data:', resumeError);
          return NextResponse.json(
            { error: 'User profile not found', details: 'No resume data found for user' },
            { status: 404 }
          );
        }

        const resumeRecord = resumeDataList[0] as any;
        console.log('🎓 COVER LETTER: Found resume data for user');

        // Get photo and student info from user_profiles
        let photoUrl = resumeRecord.photo_url || null;
        const { data: userProfileData } = await supabase
          .from('user_profiles')
          .select('photo_url, hours_available, current_semester, university_name, start_preference')
          .eq('user_id', authUserId as any)
          .single();

        if (userProfileData && (userProfileData as any).photo_url) {
          photoUrl = (userProfileData as any).photo_url;
        }

        const dbProfile = {
          personalInfo: resumeRecord.personal_info || {},
          professionalTitle: resumeRecord.professional_title || '',
          professionalSummary: resumeRecord.professional_summary || '',
          skills: resumeRecord.skills || {},
          experience: resumeRecord.experience || [],
          education: resumeRecord.education || [],
          projects: resumeRecord.projects || [],
          certifications: resumeRecord.certifications || [],
          customSections: resumeRecord.custom_sections || [],
          photoUrl: photoUrl,
          hours_available: (userProfileData as any)?.hours_available,
          current_semester: (userProfileData as any)?.current_semester,
          university_name: (userProfileData as any)?.university_name,
          start_preference: (userProfileData as any)?.start_preference
        };

        console.log('🎓 COVER LETTER: Profile loaded successfully');

        // Extract user's actual name from profile
        const userName = dbProfile.personalInfo?.name ||
                        dbProfile.personal_info?.name ||
                        dbProfile.name ||
                        '';

        console.log('🎓 COVER LETTER: Extracted user name:', userName);

        // Extract CURRENT (latest) education from education array
        const currentEducation = dbProfile.education && dbProfile.education.length > 0
          ? dbProfile.education.sort((a: any, b: any) => {
              const yearA = parseInt(a.year) || 0;
              const yearB = parseInt(b.year) || 0;
              return yearB - yearA; // Sort descending (most recent first)
            })[0]
          : null;

        // Calculate current year of study based on expected graduation
        const expectedGradYear = currentEducation?.year ? parseInt(currentEducation.year) : new Date().getFullYear();
        const currentYear = new Date().getFullYear();
        const yearsUntilGrad = expectedGradYear - currentYear;
        const estimatedTotalYears = currentEducation?.degree?.includes('Bachelor') ? 3 :
                                     currentEducation?.degree?.includes('Master') ? 2 : 3;
        const currentYearOfStudy = Math.max(1, estimatedTotalYears - yearsUntilGrad);

        profileData = {
          name: userName, // Add actual user name
          degree_program: currentEducation?.field_of_study || dbProfile.degree_program || 'Computer Science',
          university: currentEducation?.institution || dbProfile.university || '',
          current_year: currentYearOfStudy,
          expected_graduation: currentEducation?.year || dbProfile.expected_graduation || '2025-06',
          weekly_availability: dbProfile.weekly_availability || { hours_min: 15, hours_max: 20, flexible: true },
          earliest_start_date: dbProfile.earliest_start_date || 'immediately',
          preferred_duration: dbProfile.preferred_duration || { months_min: 6, months_max: 12, open_ended: false },
          enrollment_status: 'enrolled',
          language_proficiencies: dbProfile.language_proficiencies || [],
          academic_projects: dbProfile.projects || dbProfile.academic_projects || [],
          relevant_coursework: dbProfile.relevant_coursework || []
        } as any;
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
        
        // Convert database profile to student profile format
        profileData = {
          degree_program: (dbProfile as any).degree_program || 'Computer Science',
          university: (dbProfile as any).university || '',
          current_year: (dbProfile as any).current_year || 3,
          expected_graduation: (dbProfile as any).expected_graduation || '2025-06',
          weekly_availability: (dbProfile as any).weekly_availability || { hours_min: 15, hours_max: 20, flexible: true },
          earliest_start_date: (dbProfile as any).earliest_start_date || 'immediately',
          preferred_duration: (dbProfile as any).preferred_duration || { months_min: 6, months_max: 12, open_ended: false },
          enrollment_status: 'enrolled',
          language_proficiencies: (dbProfile as any).language_proficiencies || [],
          academic_projects: (dbProfile as any).academic_projects || [],
          relevant_coursework: (dbProfile as any).relevant_coursework || []
        };
      }
    }
    
    // Determine language based on job requirements
    let targetLanguage = language;
    if (language === 'AUTO') {
      const jobLang = jobData.language_required || jobData.german_required || 'EN';
      const isGermanCompany = jobData.location_country?.toLowerCase().includes('germany') || 
                             jobData.location_city?.toLowerCase().includes('berlin') ||
                             jobData.location_city?.toLowerCase().includes('munich') ||
                             jobData.location_city?.toLowerCase().includes('hamburg');
      targetLanguage = (jobLang.includes('DE') || isGermanCompany) ? 'DE' : 'EN';
    }
    
    // German keywords for Werkstudent positions
    const germanKeywords = targetLanguage === 'DE' ? [
      'Werkstudent', 'immatrikuliert', 'Studium', 
      `${profileData.weekly_availability?.hours_min || 15}-${profileData.weekly_availability?.hours_max || 20} Stunden/Woche`,
      'Praxiserfahrung', 'Semester', 'Universität'
    ] : [];
    
    // Word count ranges for letter content
    const wordCounts = {
      short: '180-200',
      medium: '250-270',
      balanced: '250-270',
      long: '340-360', // Changed from '350' to be a range
      '250words': '250-270'
    };
    
    // Extract RICH data from strategy_context
    const matchedSkills = strategy_context?.matchCalculation?.skillsOverlap?.matched || [];
    const matchedTools = strategy_context?.matchCalculation?.toolsOverlap?.matched || [];
    const topTasks = (strategy_context?.tasks || [])
      .sort((a: any, b: any) => (b.alignment_score || 0) - (a.alignment_score || 0))
      .slice(0, 5); // Top 5 tasks with highest alignment
    const competitiveAdvantages = strategy_context?.competitive_advantages || [];
    const positioning = strategy_context?.positioning || {};
    const evidenceMap = strategy_context?.evidence_map || {};

    console.log('🎓 STRATEGY DATA AVAILABLE:');
    console.log('  - Matched Skills:', matchedSkills.length, matchedSkills.slice(0, 5));
    console.log('  - Matched Tools:', matchedTools.length, matchedTools.slice(0, 5));
    console.log('  - Top Tasks:', topTasks.length, topTasks.map((t: any) => `${t.task?.substring(0, 50)}... (${Math.round(t.alignment_score * 100)}%)`));
    console.log('  - Competitive Advantages:', competitiveAdvantages.length);
    console.log('  - Positioning:', positioning.elevator_pitch?.substring(0, 100));

    // Create COMPREHENSIVE context for student cover letter with ALL data
    const letterContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || 'Your company',
        company_description: jobData.companies?.description || '',
        company_industry: jobData.companies?.industry || '',
        hiring_manager: jobData.hiring_manager || null, // CRITICAL: Add hiring manager for personalized salutation
        is_werkstudent: jobData.title?.toLowerCase().includes('werkstudent') ||
                        jobData.title?.toLowerCase().includes('working student'),
        requirements: {
          skills: jobData.skills || [],
          tools: jobData.tools || [],
          responsibilities: jobData.responsibilities || []
        },
        location: jobData.location_city,
        work_mode: jobData.work_mode,
        description_excerpt: jobData.description?.slice(0, 500) || ''
      },
      // RICH STRATEGY DATA - This is the goldmine!
      strategy: {
        matched_skills: matchedSkills,
        matched_tools: matchedTools,
        top_aligned_tasks: topTasks.map((task: any) => ({
          task: task.task_description || task.task,
          alignment_score: task.alignment_score,
          why_qualified: task.evidence_from_profile || task.why_qualified || '',
          specific_experience: task.specific_experience || ''
        })),
        competitive_advantages: competitiveAdvantages,
        positioning_themes: positioning.themes || [],
        elevator_pitch: positioning.elevator_pitch || '',
        evidence_map: evidenceMap
      },
      student: {
        name: (profileData as any).name || '', // Use actual user name
        degree: profileData.degree_program,
        university: profileData.university,
        year: profileData.current_year,
        graduation: profileData.expected_graduation,
        availability: `${profileData.weekly_availability?.hours_min || 15}-${profileData.weekly_availability?.hours_max || 20}h/week`,
        start_date: profileData.earliest_start_date || 'immediately',
        duration: profileData.preferred_duration ?
          `${profileData.preferred_duration.months_min}-${profileData.preferred_duration.months_max} months` :
          '6-12 months',
        projects: (profileData.academic_projects || []).slice(0, 3).map((p: any) => ({
          title: p.title,
          description: p.description,
          technologies: p.technologies || [],
          metrics: p.metrics || [],
          outcomes: p.outcomes || ''
        })),
        coursework: (profileData.relevant_coursework || []).slice(0, 4).map((c: any) => ({
          course_name: c.course_name,
          key_topics: c.key_topics || [],
          relevance: c.relevance_to_job || ''
        })),
        languages: profileData.language_proficiencies || [],
        skills: (profileData as any).technical_skills || [],
        tools: (profileData as any).tools_familiar_with || []
      },
      language: targetLanguage,
      tone,
      word_count: wordCounts[length as keyof typeof wordCounts]
    };
    
    // Tone-specific prompts for students
    const tonePrompts = {
      motivated: 'Show genuine enthusiasm for learning and contributing. Emphasize growth mindset.',
      professional: 'Maintain formal tone while highlighting academic achievements and project work.',
      enthusiastic: 'Express excitement about the role and company. Show passion for the field.'
    };
    
    const systemPrompt = `You are an elite Werkstudent cover letter writer with access to DEEP MATCHING DATA between the candidate and this specific job. ${tonePrompts[tone as keyof typeof tonePrompts]}

🎯 CRITICAL ADVANTAGE: You have PRECISE DATA showing exactly why this candidate is qualified:
- ${matchedSkills.length} MATCHED SKILLS with the job requirements
- ${matchedTools.length} MATCHED TOOLS they already know
- ${topTasks.length} SPECIFIC TASKS from the job with evidence of qualification
- ${competitiveAdvantages.length} unique competitive advantages

PHILOSOPHY:
Write a cover letter that PROVES the candidate can do THIS SPECIFIC JOB using CONCRETE EVIDENCE. Every claim must be backed by:
1. A matched skill/tool they have
2. A specific task they can handle
3. Real project/experience that demonstrates it

🚨 CRITICAL WORD COUNT REQUIREMENT - THIS IS MANDATORY:
- TARGET: ${wordCounts[length as keyof typeof wordCounts]} WORDS for letter content (intro + body_paragraphs + closing combined)
- Count ONLY the actual letter paragraphs, NOT the sign_off
- ${length === 'long' ? '⚠️ FOR LONG (350 words): You MUST write EXACTLY 340-360 words. This is NON-NEGOTIABLE. Write detailed, rich paragraphs with specific examples and metrics. Do NOT write short paragraphs.' : ''}
- ${length === 'medium' || length === '250words' ? 'FOR MEDIUM (250-270 words): You MUST write AT LEAST 245 words with strong detail.' : ''}
- ${length === 'short' ? 'FOR SHORT (180-200 words): You MUST write AT LEAST 180 words.' : ''}
- ${targetLanguage === 'DE' ? 'Write in German (native speaker quality, formal business German)' : 'Write in English (native speaker quality)'}
- ${length === 'long' ? '⚠️ LONG LETTER STRUCTURE: Write intro (2-3 sentences), body paragraph 1 (5-6 sentences), body paragraph 2 (4-5 sentences), body paragraph 3 (3-4 sentences), closing (2-3 sentences). Each sentence should be detailed and specific.' : ''}

MUST INCLUDE (Werkstudent-specific):
${include_university ? `- Enrollment status: "${letterContext.student.degree} im ${letterContext.student.year}. Semester"` : ''}
${include_semester ? `- Current semester: ${letterContext.student.year}. Semester` : ''}
${include_hours ? `- Weekly availability: ${letterContext.student.availability}` : ''}
- Start date: ${letterContext.student.start_date}
- Desired duration: ${letterContext.student.duration}

🎯 USE THIS GOLDMINE OF DATA (from AI job analysis):

MATCHED SKILLS (${matchedSkills.length}):
${matchedSkills.slice(0, 8).join(', ')}
→ These are EXACT matches - weave them into your letter naturally

MATCHED TOOLS (${matchedTools.length}):
${matchedTools.slice(0, 6).join(', ')}
→ Mention specific tools you know they need

TOP 5 JOB TASKS with EVIDENCE:
${topTasks.map((t: any, i: number) => `${i + 1}. ${t.task} (${Math.round(t.alignment_score * 100)}% match)
   Evidence: ${t.why_qualified || 'Strong background'}
   Experience: ${t.specific_experience || 'Related project work'}`).join('\n')}

COMPETITIVE ADVANTAGES:
${competitiveAdvantages.slice(0, 3).map((adv: any) => `- ${adv.advantage || adv}: ${adv.evidence || ''}`).join('\n')}

POSITIONING:
${positioning.elevator_pitch || 'Motivated student with strong technical foundation'}

NARRATIVE STRUCTURE (Evidence-Based):

INTRO (2-3 sentences):
- Open with ONE of the top competitive advantages
${include_university ? `- Mention enrollment status: "${letterContext.student.degree} student"` : '- Establish your professional identity'}
- Reference 2-3 matched skills that caught your attention in the job posting

BODY PARAGRAPH 1 - TASK-SPECIFIC EVIDENCE (4-5 sentences):
- Pick the TOP 2-3 aligned tasks (highest scores from list above)
- For EACH task, provide the specific experience/evidence listed
- Connect matched skills/tools to these tasks
- Use concrete metrics from projects if available
- Show you understand what the role actually involves

BODY PARAGRAPH 2 - COMPETITIVE ADVANTAGES (3-4 sentences):
- Lead with 1-2 competitive advantages from the list above
- Back each advantage with specific matched tools or projects
${include_hours ? `- Naturally weave in availability: "${letterContext.student.availability}"` : ''}
- State start date: "${letterContext.student.start_date}"
- Mention duration preference: "${letterContext.student.duration}"

CLOSING (2 sentences):
- Reference the company/role specifically (not generic)
- Clear call to action + reaffirm excitement about the specific tasks you'd handle

TONE FOR STUDENTS:
- Confident but not arrogant (you're capable AND eager to learn)
- Specific about skills (avoid "I'm a fast learner" - SHOW it)
- Natural mention of student status (it's an advantage, not a limitation)
- Professional yet personable (German formal business tone)
- Action-oriented (what you WILL contribute, not what you hope to)

🚨 CRITICAL WRITING STYLE - ACHIEVEMENT-FOCUSED:
- LIMIT company name mentions: Use company name ONLY once in intro and once in closing (max 2 times total)
- AVOID repetitive phrases like "at [Company]" or "[Company]'s team" - these sound robotic
- FOCUS ON "I" STATEMENTS: What I achieved, what I built, what I learned, how I grew
- EMPHASIZE USER'S CONTRIBUTIONS: Lead with your impact, skills, and experiences
- EXAMPLE OF BAD: "I'm excited to join [Company] and contribute to [Company]'s mission"
- EXAMPLE OF GOOD: "I've developed strong analytical skills through data-driven projects and am ready to apply these in a dynamic business intelligence environment"
- Make it about YOUR journey, YOUR growth, YOUR value - not just why the company is great
- The reader should learn about YOU, not be reminded of their own company name

${targetLanguage === 'DE' ? `
GERMAN LANGUAGE REQUIREMENTS:
- Use "Sie" form (formal)
${letterContext.job.hiring_manager ? `- **CRITICAL**: Hiring Manager is "${letterContext.job.hiring_manager}" - Address them directly!
  * If name contains "Frau": "Sehr geehrte Frau [Last Name]," (e.g., "Sehr geehrte Frau Lippert,")
  * If name contains "Herr": "Sehr geehrter Herr [Last Name]," (e.g., "Sehr geehrter Herr Schmidt,")
  * If full name only (e.g., "Ann-Kathrin Lippert"): Determine gender from first name and use "Sehr geehrte Frau Lippert," or "Sehr geehrter Herr [Last Name],"
  * NEVER use "Sehr geehrte Damen und Herren" when hiring manager name is available!` : `- Opening: "Sehr geehrte Damen und Herren," (use only if no hiring manager name available)`}
${include_university && include_semester ? `- Natural integration: "Als ${letterContext.student.degree}-Student im ${letterContext.student.year}. Semester..."` : include_university ? `- Natural integration: "Als ${letterContext.student.degree}-Student..."` : '- Professional introduction without student details'}
${include_hours ? `- Availability phrase: "Ich stehe Ihnen ab ${letterContext.student.start_date} mit ${letterContext.student.availability} zur Verfügung"` : `- Availability phrase: "Ich stehe Ihnen ab ${letterContext.student.start_date} zur Verfügung"`}
- Closing: "Mit freundlichen Grüßen"
- Use strong German business verbs: entwickeln, optimieren, implementieren, analysieren
` : `
ENGLISH LANGUAGE REQUIREMENTS:
${letterContext.job.hiring_manager ? `- **CRITICAL**: Hiring Manager is "${letterContext.job.hiring_manager}" - Address them by name!
  * Use: "Dear Ms. [Last Name]," or "Dear Mr. [Last Name]," (e.g., "Dear Ms. Lippert,")
  * If unsure of title, use full name: "Dear ${letterContext.job.hiring_manager},"
  * NEVER use generic "Dear Hiring Team" when hiring manager name is available!` : `- Opening: "Dear Hiring Team," or "Dear Hiring Manager," (use only if no hiring manager name available)`}
${include_university && include_semester ? `- Natural integration: "As a ${letterContext.student.year}-year ${letterContext.student.degree} student..."` : include_university ? `- Natural integration: "As a ${letterContext.student.degree} student..."` : '- Professional introduction without student details'}
${include_hours ? `- Availability phrase: "I'm available starting ${letterContext.student.start_date} for ${letterContext.student.duration} at ${letterContext.student.availability}"` : `- Availability phrase: "I'm available starting ${letterContext.student.start_date} for ${letterContext.student.duration}"`}
- Closing: "Best regards" or "Kind regards"
- Use action verbs: developed, implemented, optimized, analyzed
`}

${custom_instructions ? `\n🎯 CUSTOM INSTRUCTIONS FROM USER:\n${custom_instructions}\n` : ''}

⚠️ FINAL REMINDERS:
1. WORD COUNT: Must be ${wordCounts[length as keyof typeof wordCounts]} words (intro + body_paragraphs + closing)
2. USE THE STRATEGY DATA ABOVE: Reference specific matched skills, tools, and task evidence
3. BE SPECIFIC: Use the evidence provided for each task, don't make up generic claims
4. SHOW UNDERSTANDING: Demonstrate you know what the role involves by referencing actual tasks
5. USER'S NAME: ${letterContext.student.name}

🎯 MANDATORY: Your letter MUST reference at least 3 items from the strategy data above (matched skills/tools/tasks).

⚠️ CRITICAL: Output ONLY valid JSON with this EXACT structure:
{
  "subject": "Application for [position] - creative variation in ${targetLanguage === 'DE' ? 'German' : 'English'} (avoid 'RE:' prefix)",
  "salutation": "${letterContext.job.hiring_manager ? `"${targetLanguage === 'DE' ? 'Sehr geehrte Frau/Herr [Last Name from: ' + letterContext.job.hiring_manager + ']' : 'Dear Ms./Mr. [Last Name from: ' + letterContext.job.hiring_manager + ']'}" - MUST use hiring manager name!` : `"personalized greeting in ${targetLanguage === 'DE' ? 'German' : 'English'} (${targetLanguage === 'DE' ? 'Sehr geehrte Damen und Herren' : 'Dear Hiring Team'})"`}",
  "intro": "engaging opener + ${include_university ? 'enrollment status + ' : ''}value preview (FULL PARAGRAPH, NOT JUST LABELS)",
  "body_paragraphs": [
    "FULL PARAGRAPH 1: project showcase with metrics and direct job relevance (5-6 sentences for long, 3-4 for medium)",
    "FULL PARAGRAPH 2: skills/coursework fit + availability + eagerness to contribute (4-5 sentences for long, 3-4 for medium)"${length === 'long' ? ',\n    "FULL PARAGRAPH 3: competitive advantages and how you stand out (3-4 sentences)"' : ''}
  ],
  "closing": "enthusiasm for opportunity + call to action (FULL PARAGRAPH, NOT JUST LABELS)",
  "sign_off": "${targetLanguage === 'DE' ? 'Mit freundlichen Grüßen' : 'Best regards'}",
  "projects_highlighted": ["specific project names"],
  "coursework_referenced": ["relevant courses"],
  "used_keywords": ["naturally integrated keywords"]
}

⚠️ IMPORTANT: Each field must contain COMPLETE TEXT, not field labels. Write full paragraphs, not placeholder text!`;
    
    try {
      // Adjust max_tokens based on length to ensure enough capacity
      const maxTokensMap = {
        short: 800,   // 180-200 words + JSON overhead
        medium: 1100,  // 250-270 words + JSON overhead
        long: 2400,   // 350 words * ~1.5 tokens/word + generous JSON overhead
        balanced: 1100,
        '250words': 1100
      };

      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(letterContext) }
        ],
        model: 'gpt-4o', // Use GPT-4o for high-quality cover letter generation
        temperature: 0.8, // Slightly higher for more natural writing
        max_tokens: maxTokensMap[length as keyof typeof maxTokensMap] || 1100
      });

      const rawContent = aiResponse.choices?.[0]?.message?.content || '{}';
      console.log('🎓 RAW GPT RESPONSE (first 200 chars):', rawContent.substring(0, 200));

      let letterData;
      try {
        letterData = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('❌ COVER LETTER: Failed to parse GPT response as JSON:', parseError);
        console.error('❌ Raw response:', rawContent);
        throw new Error('GPT returned invalid JSON. Please try again.');
      }

      // FIX: GPT sometimes returns malformed JSON with field names INSIDE body_paragraphs array
      // Example: body_paragraphs: [..., "closing\": \"I am enthusiastic...\"", "sign_off\": \"Best regards\""]
      console.log('🔍 CLEANUP: Processing body_paragraphs array:', letterData.body_paragraphs?.length || 0, 'items');

      if (Array.isArray(letterData.body_paragraphs)) {
        const cleanedParagraphs = [];

        for (const item of letterData.body_paragraphs) {
          if (typeof item === 'string') {
            const itemStr = item.trim();

            // PATTERN 1: Field with malformed quotes: 'closing": "text' or 'sign_off": "text'
            const malformedFieldMatch = itemStr.match(/^(\w+)["'\s]*["\s]*:\s*["']?(.+?)["']?\s*$/);
            if (malformedFieldMatch) {
              const fieldName = malformedFieldMatch[1].toLowerCase();
              const fieldValue = malformedFieldMatch[2]
                .replace(/^["'\s]+/, '')  // Remove leading quotes/spaces
                .replace(/["'\s]+$/, '')  // Remove trailing quotes/spaces
                .trim();

              console.log(`🔧 CLEANUP: Found malformed field: ${fieldName} = ${fieldValue.substring(0, 50)}...`);

              if (fieldName === 'closing' && fieldValue.length > 10) {
                letterData.closing = fieldValue;
                console.log('✅ CLEANUP: Extracted closing');
                continue;
              } else if (fieldName === 'sign_off' && fieldValue.length > 5) {
                letterData.sign_off = fieldValue;
                console.log('✅ CLEANUP: Extracted sign_off');
                continue;
              }
            }

            // PATTERN 2: Field labels without values (skip these)
            if (itemStr.match(/^(closing|sign_off|projects_highlighted|coursework_referenced|used_keywords)["'\s]*[:=]\s*["'[\s]*$/i)) {
              console.log(`🚫 CLEANUP: Skipping label-only field: ${itemStr.substring(0, 30)}`);
              continue;
            }

            // PATTERN 3: Array artifacts (skip these)
            if (itemStr === '[' || itemStr === ']' || itemStr === '["' || itemStr === '"]' || itemStr === '') {
              console.log(`🚫 CLEANUP: Skipping array artifact: "${itemStr}"`);
              continue;
            }

            // PATTERN 4: JSON fragments with field names (skip these)
            if (itemStr.match(/["'\s]*\w+["'\s]*:\s*["'[\s]*$/) || itemStr.includes('":') || itemStr.includes('"]')) {
              console.log(`🚫 CLEANUP: Skipping JSON fragment: ${itemStr.substring(0, 30)}`);
              continue;
            }

            // PATTERN 5: Filter out "used keywords" paragraphs (metadata that shouldn't be in content)
            if (itemStr.match(/^(used[\s_-]*keywords|keywords[\s_-]*used|naturally[\s_-]*integrated[\s_-]*keywords)/i) ||
                itemStr.match(/^\[.*keyword.*\]$/i) ||
                itemStr.match(/^["']?(used_keywords|keywords_used)["']?[\s:]*\[/i)) {
              console.log(`🚫 CLEANUP: Skipping keywords metadata: ${itemStr.substring(0, 50)}`);
              continue;
            }

            // If it's a real paragraph (substantive content), keep it
            if (itemStr.length > 50) {
              cleanedParagraphs.push(itemStr);
              console.log(`✅ CLEANUP: Kept paragraph: ${itemStr.substring(0, 50)}...`);
            } else {
              console.log(`🚫 CLEANUP: Skipping short item: ${itemStr.substring(0, 50)}`);
            }
          }
        }

        letterData.body_paragraphs = cleanedParagraphs;
        console.log(`📝 CLEANUP: Final paragraph count: ${cleanedParagraphs.length}`);
      }

      // Fallback: If closing/sign_off still missing after cleanup, use defaults
      if (!letterData.closing || letterData.closing.trim() === '') {
        const defaultClosing = targetLanguage === 'DE'
          ? 'Ich freue mich darauf, von Ihnen zu hören und stehe für ein persönliches Gespräch gerne zur Verfügung.'
          : 'I look forward to hearing from you and would be happy to discuss this opportunity in more detail.';
        letterData.closing = defaultClosing;
        console.log('⚠️ CLEANUP: Using default closing');
      }

      if (!letterData.sign_off || letterData.sign_off.trim() === '') {
        const defaultSignOff = targetLanguage === 'DE' ? 'Mit freundlichen Grüßen' : 'Best regards';
        letterData.sign_off = defaultSignOff;
        console.log('⚠️ CLEANUP: Using default sign_off');
      }

      console.log('✅ CLEANUP: Final data - closing:', letterData.closing?.substring(0, 50), '... sign_off:', letterData.sign_off);

      // Validate required fields
      const requiredFields = ['subject', 'salutation', 'intro', 'body_paragraphs', 'closing', 'sign_off'];
      const missingFields = requiredFields.filter(field => !letterData[field]);

      if (missingFields.length > 0) {
        console.error('❌ COVER LETTER: Missing required fields:', missingFields);
        console.error('❌ Received data:', JSON.stringify(letterData, null, 2));
        console.error('❌ Available fields:', Object.keys(letterData));
        throw new Error(`GPT response missing required fields: ${missingFields.join(', ')}. Available fields: ${Object.keys(letterData).join(', ')}`);
      }

      // Validate body_paragraphs is an array
      if (!Array.isArray(letterData.body_paragraphs) || letterData.body_paragraphs.length === 0) {
        console.error('❌ COVER LETTER: body_paragraphs is not a valid array:', letterData.body_paragraphs);
        throw new Error('GPT response has invalid body_paragraphs structure');
      }

      console.log('✅ COVER LETTER: JSON structure validated');
      
      const coverLetter: StudentCoverLetter = {
        id: `student_letter_${Date.now()}`,
        job_id,
        user_profile_id: user_profile_id || 'student_profile',
        tone,
        length,
        language: targetLanguage,
        content: {
          subject: letterData.subject || `Application for ${jobData.title}`,
          salutation: letterData.salutation || 'Dear Hiring Team',
          intro: letterData.intro || '',
          body_paragraphs: letterData.body_paragraphs || [],
          closing: letterData.closing || '',
          sign_off: letterData.sign_off || 'Best regards'
        },
        student_specifics: {
          enrollment_mentioned: true,
          availability_mentioned: true,
          projects_highlighted: letterData.projects_highlighted || [],
          coursework_referenced: letterData.coursework_referenced || []
        },
        used_keywords: letterData.used_keywords || [],
        german_keywords: targetLanguage === 'DE' ? germanKeywords : undefined,
        created_at: new Date().toISOString()
      };
      
      // Cache the letter
      studentLetterCache.set(cacheKey, {
        letter: coverLetter,
        timestamp: Date.now()
      });
      
      // Calculate actual word count
      const fullText = `${coverLetter.content.intro} ${coverLetter.content.body_paragraphs.join(' ')} ${coverLetter.content.closing}`;
      const wordCount = fullText.split(' ').filter(w => w.length > 0).length;

      console.log(`🎓 STUDENT COVER LETTER: Generated ${tone} ${length} letter (${targetLanguage}) - ${wordCount} words`);

      // Save cover letter to variant with versioning
      if ((existingVariant as any)?.id) {
        const newGenerationCount = ((existingVariant as any).cover_letter_generation_count || 0) + 1;

        // Load existing versions or create new array
        let versions = [];
        if ((existingVariant as any).cover_letter_content) {
          const savedData = JSON.parse((existingVariant as any).cover_letter_content);
          if (savedData.versions && Array.isArray(savedData.versions)) {
            versions = savedData.versions;
          } else {
            // Convert legacy format to versioned
            versions = [{
              version: 1,
              generated_at: (existingVariant as any).cover_letter_generated_at || new Date().toISOString(),
              tone: savedData.tone,
              length: savedData.length,
              cover_letter: savedData
            }];
          }
        }

        // Append new version
        const newVersion = {
          version: newGenerationCount,
          generated_at: new Date().toISOString(),
          tone,
          length,
          cover_letter: coverLetter
        };
        versions.push(newVersion);

        // Save versioned data
        const versionedData = {
          versions: versions,
          current_version: newGenerationCount
        };

        await supabase
          .from('resume_variants')
          .update({
            cover_letter_content: JSON.stringify(versionedData),
            cover_letter_generated_at: new Date().toISOString(),
            cover_letter_generation_count: newGenerationCount
          } as any)
          .eq('id', (existingVariant as any).id);

        console.log(`💾 COVER LETTER: Saved version ${newGenerationCount}/2 (total ${versions.length} versions)`);

        return NextResponse.json({
          success: true,
          cover_letter: coverLetter,
          cached: false,
          versions: versions,
          current_version: newGenerationCount,
          metadata: {
            word_count: wordCount,
            language: targetLanguage,
            werkstudent_optimized: true,
            projects_included: coverLetter.student_specifics.projects_highlighted.length,
            courses_mentioned: coverLetter.student_specifics.coursework_referenced.length,
            generation_count: newGenerationCount,
            generation_limit: 2,
            total_versions: versions.length
          }
        });
      }

      // If no variant exists yet (shouldn't happen, but handle it)
      return NextResponse.json({
        success: true,
        cover_letter: coverLetter,
        cached: false,
        versions: [{
          version: 1,
          generated_at: new Date().toISOString(),
          tone,
          length,
          cover_letter: coverLetter
        }],
        current_version: 1,
        metadata: {
          word_count: wordCount,
          language: targetLanguage,
          werkstudent_optimized: true,
          projects_included: coverLetter.student_specifics.projects_highlighted.length,
          courses_mentioned: coverLetter.student_specifics.coursework_referenced.length,
          generation_count: 1,
          generation_limit: 2,
          total_versions: 1
        }
      });
      
    } catch (aiError) {
      console.error('🎓 STUDENT COVER LETTER: AI generation failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Student cover letter generation failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('🎓 STUDENT COVER LETTER: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Student cover letter generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to generate student cover letters.' },
    { status: 405 }
  );
}
