import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
    const {
      job_id,
      user_profile_id,
      student_profile,
      tone = 'motivated',
      length = '250words', // Fixed at 250 words
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
    
    console.log(`🎓 STUDENT COVER LETTER: Generating ${tone} ${length} letter for job ${job_id}`);
    if (custom_instructions) {
      console.log(`🎓 STUDENT COVER LETTER: Custom instructions provided: ${custom_instructions.substring(0, 100)}...`);
    }

    // Check cache (skip if custom instructions provided)
    const cacheKey = `student_${job_id}_${user_profile_id || 'profile'}_${tone}_${length}_${language}`;
    const cached = studentLetterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL && !custom_instructions) {
      console.log('🎓 STUDENT COVER LETTER: Cache hit');
      return NextResponse.json({
        success: true,
        cover_letter: cached.letter,
        cached: true
      });
    }

    // Create server-side Supabase client
    const supabase = createServerSupabase(request);

    // Fetch job data
    const { data: jobData, error: jobError } = await supabase
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
    
    if (jobError || !jobData) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Use provided student profile or fetch from database
    let profileData: Partial<StudentProfile> = student_profile || {};
    
    if (!student_profile && user_profile_id) {
      if (user_profile_id === 'latest') {
        // Use the profile API to get the latest profile
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Get auth header from request
        const authHeader = request.headers.get('authorization');

        console.log('🎓 STUDENT COVER LETTER: Fetching profile from /api/profile/latest');

        const profileResponse = await fetch(`${baseUrl}/api/profile/latest`, {
          headers: authHeader ? {
            'Authorization': authHeader
          } : {},
          credentials: 'include'
        });

        if (!profileResponse.ok) {
          console.error('🎓 STUDENT COVER LETTER: Profile API failed:', profileResponse.status);
          return NextResponse.json(
            { error: 'User profile not found', details: 'Profile API request failed' },
            { status: 404 }
          );
        }

        const profileResponse_data = await profileResponse.json();

        if (!profileResponse_data.success || !profileResponse_data.profile) {
          console.error('🎓 STUDENT COVER LETTER: No profile in response');
          return NextResponse.json(
            { error: 'User profile not found', details: 'No profile data in response' },
            { status: 404 }
          );
        }

        console.log('🎓 STUDENT COVER LETTER: Found profile via API');
        const dbProfile = profileResponse_data.profile;

        // Extract user's actual name from profile
        const userName = dbProfile.personalInfo?.name ||
                        dbProfile.personal_info?.name ||
                        dbProfile.name ||
                        'Varun Mishra';

        console.log('🎓 STUDENT COVER LETTER: Extracted user name:', userName);

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
        };
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
          degree_program: dbProfile.degree_program || 'Computer Science',
          university: dbProfile.university || '',
          current_year: dbProfile.current_year || 3,
          expected_graduation: dbProfile.expected_graduation || '2025-06',
          weekly_availability: dbProfile.weekly_availability || { hours_min: 15, hours_max: 20, flexible: true },
          earliest_start_date: dbProfile.earliest_start_date || 'immediately',
          preferred_duration: dbProfile.preferred_duration || { months_min: 6, months_max: 12, open_ended: false },
          enrollment_status: 'enrolled',
          language_proficiencies: dbProfile.language_proficiencies || [],
          academic_projects: dbProfile.academic_projects || [],
          relevant_coursework: dbProfile.relevant_coursework || []
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
      long: '350',
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
        is_werkstudent: jobData.title?.toLowerCase().includes('werkstudent') ||
                        jobData.title?.toLowerCase().includes('working student'),
        requirements: {
          skills: jobData.skills_original || [],
          tools: jobData.tools_original || [],
          responsibilities: jobData.responsibilities_original || []
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
        name: profileData.name || 'Varun Mishra', // Use actual user name
        degree: profileData.degree_program,
        university: profileData.university,
        year: profileData.current_year,
        graduation: profileData.expected_graduation,
        availability: `${profileData.weekly_availability?.hours_min || 15}-${profileData.weekly_availability?.hours_max || 20}h/week`,
        start_date: profileData.earliest_start_date || 'immediately',
        duration: profileData.preferred_duration ?
          `${profileData.preferred_duration.months_min}-${profileData.preferred_duration.months_max} months` :
          '6-12 months',
        projects: (profileData.academic_projects || []).slice(0, 3).map(p => ({
          title: p.title,
          description: p.description,
          technologies: p.technologies || [],
          metrics: p.metrics || [],
          outcomes: p.outcomes || ''
        })),
        coursework: (profileData.relevant_coursework || []).slice(0, 4).map(c => ({
          course_name: c.course_name,
          key_topics: c.key_topics || [],
          relevance: c.relevance_to_job || ''
        })),
        languages: profileData.language_proficiencies || [],
        skills: profileData.technical_skills || [],
        tools: profileData.tools_familiar_with || []
      },
      strategy: strategy_context || {
        positioning: {
          themes: ['academic excellence', 'practical projects', 'eager to learn'],
          elevator_pitch: 'Motivated student with strong academic foundation and hands-on project experience'
        },
        ats_keywords: [],
        must_have_gaps: [],
        competitive_advantages: []
      },
      language: targetLanguage,
      tone,
      word_count: wordCounts[length]
    };
    
    // Tone-specific prompts for students
    const tonePrompts = {
      motivated: 'Show genuine enthusiasm for learning and contributing. Emphasize growth mindset.',
      professional: 'Maintain formal tone while highlighting academic achievements and project work.',
      enthusiastic: 'Express excitement about the role and company. Show passion for the field.'
    };
    
    const systemPrompt = `You are an elite Werkstudent cover letter writer with access to DEEP MATCHING DATA between the candidate and this specific job. ${tonePrompts[tone]}

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

🚨 CRITICAL WORD COUNT REQUIREMENT:
- TARGET: ${wordCounts[length]} WORDS for letter content (intro + body_paragraphs + closing combined)
- Count ONLY the actual letter paragraphs, NOT the sign_off
- ${length === 'long' ? 'FOR LONG (350 words): You MUST write AT LEAST 340 words with rich detail and specific examples.' : ''}
- ${length === 'medium' || length === '250words' ? 'FOR MEDIUM (250-270 words): You MUST write AT LEAST 245 words.' : ''}
- ${length === 'short' ? 'FOR SHORT (180-200 words): You MUST write AT LEAST 180 words.' : ''}
- ${targetLanguage === 'DE' ? 'Write in German (native speaker quality, formal business German)' : 'Write in English (native speaker quality)'}

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
- Opening: "Sehr geehrte Damen und Herren" or "Sehr geehrte/r [Name]"
${include_university && include_semester ? `- Natural integration: "Als ${letterContext.student.degree}-Student im ${letterContext.student.year}. Semester..."` : include_university ? `- Natural integration: "Als ${letterContext.student.degree}-Student..."` : '- Professional introduction without student details'}
${include_hours ? `- Availability phrase: "Ich stehe Ihnen ab ${letterContext.student.start_date} mit ${letterContext.student.availability} zur Verfügung"` : `- Availability phrase: "Ich stehe Ihnen ab ${letterContext.student.start_date} zur Verfügung"`}
- Closing: "Mit freundlichen Grüßen"
- Use strong German business verbs: entwickeln, optimieren, implementieren, analysieren
` : `
ENGLISH LANGUAGE REQUIREMENTS:
- Opening: "Dear Hiring Team" or "Dear [Name]"
${include_university && include_semester ? `- Natural integration: "As a ${letterContext.student.year}-year ${letterContext.student.degree} student..."` : include_university ? `- Natural integration: "As a ${letterContext.student.degree} student..."` : '- Professional introduction without student details'}
${include_hours ? `- Availability phrase: "I'm available starting ${letterContext.student.start_date} for ${letterContext.student.duration} at ${letterContext.student.availability}"` : `- Availability phrase: "I'm available starting ${letterContext.student.start_date} for ${letterContext.student.duration}"`}
- Closing: "Best regards" or "Kind regards"
- Use action verbs: developed, implemented, optimized, analyzed
`}

${custom_instructions ? `\n🎯 CUSTOM INSTRUCTIONS FROM USER:\n${custom_instructions}\n` : ''}

⚠️ FINAL REMINDERS:
1. WORD COUNT: Must be ${wordCounts[length]} words (intro + body_paragraphs + closing)
2. USE THE STRATEGY DATA ABOVE: Reference specific matched skills, tools, and task evidence
3. BE SPECIFIC: Use the evidence provided for each task, don't make up generic claims
4. SHOW UNDERSTANDING: Demonstrate you know what the role involves by referencing actual tasks
5. USER'S NAME: ${letterContext.student.name}

🎯 MANDATORY: Your letter MUST reference at least 3 items from the strategy data above (matched skills/tools/tasks).

Output JSON only:
{
  "subject": "Application for [position] - creative variation in English (avoid 'RE:' prefix)",
  "salutation": "personalized greeting in English (vary: Dear Hiring Team / Dear Hiring Manager / Dear [Company] Team / etc.)",
  "intro": "engaging opener + enrollment status + value preview",
  "body_paragraphs": [
    "project showcase with metrics and direct job relevance",
    "skills/coursework fit + availability + eagerness to contribute"
  ],
  "closing": "enthusiasm for opportunity + call to action",
  "sign_off": "Best regards",
  "projects_highlighted": ["specific project names"],
  "coursework_referenced": ["relevant courses"],
  "used_keywords": ["naturally integrated keywords"]
}`;
    
    try {
      // Adjust max_tokens based on length to ensure enough capacity
      const maxTokensMap = {
        short: 800,   // 180-200 words + JSON overhead
        medium: 1100,  // 250-270 words + JSON overhead
        long: 1600,   // 350 words + JSON overhead
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
        max_tokens: maxTokensMap[length] || 1100
      });
      
      const letterData = JSON.parse(aiResponse.choices?.[0]?.message?.content || '{}');
      
      const coverLetter: StudentCoverLetter = {
        id: `student_letter_${Date.now()}`,
        job_id,
        user_profile_id: user_profile_id || 'student_profile',
        tone,
        length,
        language: targetLanguage,
        content: {
          subject: letterData.subject || `Application for ${job.title}`,
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
      
      return NextResponse.json({
        success: true,
        cover_letter: coverLetter,
        cached: false,
        metadata: {
          word_count: wordCount,
          language: targetLanguage,
          werkstudent_optimized: true,
          projects_included: coverLetter.student_specifics.projects_highlighted.length,
          courses_mentioned: coverLetter.student_specifics.coursework_referenced.length
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
