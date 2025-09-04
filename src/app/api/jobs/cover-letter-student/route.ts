import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/client';
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
      length = 'short', // Students should keep it concise
      language = 'AUTO',
      strategy_context = null
    } = await request.json();
    
    if (!job_id || (!user_profile_id && !student_profile)) {
      return NextResponse.json(
        { error: 'job_id and either user_profile_id or student_profile required' },
        { status: 400 }
      );
    }
    
    console.log(`🎓 STUDENT COVER LETTER: Generating ${tone} ${length} letter for job ${job_id}`);
    
    // Check cache
    const cacheKey = `student_${job_id}_${user_profile_id || 'profile'}_${tone}_${length}_${language}`;
    const cached = studentLetterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('🎓 STUDENT COVER LETTER: Cache hit');
      return NextResponse.json({
        success: true,
        cover_letter: cached.letter,
        cached: true
      });
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
        const dbProfile = profiles[0];

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
    
    // Word count targets for students
    const wordCounts = {
      short: '180-200',
      medium: '220-240',
      balanced: '220-240',
      long: '360-370'
    };
    
    // Create compact context for student cover letter
    const letterContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || 'Your company',
        is_werkstudent: jobData.title?.toLowerCase().includes('werkstudent') || 
                        jobData.title?.toLowerCase().includes('working student'),
        must_haves: [
          ...(jobData.skills_original || []),
          ...(jobData.responsibilities_original || [])
        ].slice(0, 4), // Only top 4 for brevity
        location: jobData.location_city,
        work_mode: jobData.work_mode
      },
      student: {
        name: profileData.degree_program ? 'Student' : 'Applicant',
        degree: profileData.degree_program,
        university: profileData.university,
        year: profileData.current_year,
        graduation: profileData.expected_graduation,
        availability: `${profileData.weekly_availability?.hours_min || 15}-${profileData.weekly_availability?.hours_max || 20}h/week`,
        start_date: profileData.earliest_start_date || 'immediately',
        duration: profileData.preferred_duration ? 
          `${profileData.preferred_duration.months_min}-${profileData.preferred_duration.months_max} months` : 
          '6-12 months',
        top_projects: (profileData.academic_projects || []).slice(0, 2).map(p => ({
          name: p.title,
          relevance: p.technologies?.slice(0, 3),
          metric: p.metrics?.[0]
        })),
        relevant_courses: (profileData.relevant_coursework || []).slice(0, 3).map(c => c.course_name),
        languages: profileData.language_proficiencies || []
      },
      positioning: strategy_context?.positioning || {
        themes: ['academic excellence', 'practical projects', 'eager to learn'],
        elevator_pitch: 'Motivated student with strong academic foundation and hands-on project experience'
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
    
    const systemPrompt = `You are a German university career counselor writing cover letters for Werkstudent positions.
${tonePrompts[tone]}

CRITICAL REQUIREMENTS:
- ${wordCounts[length]} words maximum (STRICT LIMIT for students)
- ${targetLanguage === 'DE' ? 'Write in German' : 'Write in English'}
- MUST mention: enrollment status, weekly availability (${letterContext.student.availability}), start date, duration
- Highlight 2 specific projects with metrics
- Reference 1-2 relevant courses
- No repetition of resume content
- Use active voice and confident tone
- Include ${targetLanguage === 'DE' ? 'German Werkstudent keywords' : 'relevant keywords'}

${targetLanguage === 'DE' ? `
German Structure:
- Start: "Sehr geehrte Damen und Herren" or specific name
- Mention: "als immatrikulierter Student der [degree] im [X]. Semester"
- Availability: "mit einer Verfügbarkeit von ${letterContext.student.availability}"
- End: "Mit freundlichen Grüßen"
` : `
English Structure:  
- Start: "Dear Hiring Team" or specific name
- Mention: "As a [year] year [degree] student"
- Availability: "available ${letterContext.student.availability}"
- End: "Best regards" or "Kind regards"
`}

Output JSON only:
{
  "intro": "1-2 sentences: Role interest + enrollment status",
  "body_paragraphs": [
    "Paragraph 1: 2-3 sentences about relevant project with specific metric",
    "Paragraph 2: 2-3 sentences about coursework alignment and availability"
  ],
  "closing": "1 sentence: Enthusiasm + next steps",
  "sign_off": "${targetLanguage === 'DE' ? 'Mit freundlichen Grüßen' : 'Best regards'}",
  "projects_highlighted": ["project1", "project2"],
  "coursework_referenced": ["course1"],
  "used_keywords": ["keyword1", "keyword2", "keyword3"]
}`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(letterContext) }
        ],
        model: 'gpt-4o-mini', // Cost-effective for student letters
        temperature: 0.7,
        max_tokens: 500
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
          intro: letterData.intro || '',
          body_paragraphs: letterData.body_paragraphs || [],
          closing: letterData.closing || '',
          sign_off: letterData.sign_off || (targetLanguage === 'DE' ? 'Mit freundlichen Grüßen' : 'Best regards')
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
