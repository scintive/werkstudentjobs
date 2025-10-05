import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
import { llmService } from '@/lib/services/llmService';
import type { CoverLetter } from '@/lib/types/jobStrategy';

// Cache for cover letters (keyed by job_id + profile_id + tone + length)
const letterCache = new Map<string, { letter: CoverLetter; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * POST /api/jobs/cover-letter
 * Generate tailored cover letter with tone/length options
 */
export async function POST(request: NextRequest) {
  try {
    const {
      job_id,
      user_profile_id,
      tone = 'confident',
      length = '250words', // Fixed at 250 words
      language = 'AUTO',
      strategy_context = null, // Optional: pass strategy data to avoid re-fetch
      custom_instructions = '' // NEW: User's custom instructions
    } = await request.json();

    if (!job_id || !user_profile_id) {
      return NextResponse.json(
        { error: 'job_id and user_profile_id are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 COVER LETTER: Generating ${tone} ${length} letter for job ${job_id}, user_profile_id: ${user_profile_id}`);
    if (custom_instructions) {
      console.log(`🎯 COVER LETTER: Custom instructions provided: ${custom_instructions.substring(0, 100)}...`);
    }

    // Check cache (skip cache if custom instructions provided)
    const cacheKey = `${job_id}_${user_profile_id}_${tone}_${length}_${language}`;
    const cached = letterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL && !custom_instructions) {
      console.log('🎯 COVER LETTER: Cache hit');
      return NextResponse.json({
        success: true,
        cover_letter: cached.letter,
        cached: true,
        cache_age: Math.round((Date.now() - cached.timestamp) / 1000)
      });
    }

    // Create server-side Supabase client
    const supabase = createServerSupabase(request);

    // Fetch job data
    const { data: jobData, error: jobError} = await supabase
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
      console.error('🎯 COVER LETTER: Job fetch failed:', { job_id, error: jobError?.message });
      return NextResponse.json(
        { error: 'Job not found', details: jobError?.message },
        { status: 404 }
      );
    }

    console.log('🎯 COVER LETTER: Job found:', jobData.title);
    
    // Fetch user profile (handle 'latest' special case)
    let profileData = null;
    let profileError = null;

    if (user_profile_id === 'latest') {
      // Use the profile API to get the latest profile
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const authHeader = request.headers.get('authorization');

      console.log('🎯 COVER LETTER: Fetching profile from /api/profile/latest');

      try {
        const profileResponse = await fetch(`${baseUrl}/api/profile/latest`, {
          headers: authHeader ? {
            'Authorization': authHeader
          } : {},
          credentials: 'include'
        });

        if (profileResponse.ok) {
          const profileDataResponse = await profileResponse.json();
          if (profileDataResponse.success && profileDataResponse.profile) {
            profileData = profileDataResponse.profile;
            console.log('🎯 COVER LETTER: Found profile via API');
          } else {
            console.error('🎯 COVER LETTER: No profile in response');
          }
        } else {
          console.error('🎯 COVER LETTER: Profile API failed:', profileResponse.status);
        }
      } catch (fetchError) {
        console.error('🎯 COVER LETTER: Profile fetch error:', fetchError);
      }
    } else {
      const result = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user_profile_id)
        .single();

      profileData = result.data;
      profileError = result.error;
    }

    if (!profileData) {
      console.error('🎯 COVER LETTER: Profile fetch failed:', { user_profile_id, error: profileError?.message });
      return NextResponse.json(
        { error: 'User profile not found', details: profileError?.message },
        { status: 404 }
      );
    }

    console.log('🎯 COVER LETTER: Profile found:', profileData.name || profileData.email);
    
    // Convert data to UserProfile format (handle both user_profiles and resume_data)
    const userProfile = {
      personal_details: {
        name: profileData.name || profileData.personal_details?.name || '',
        email: profileData.email || profileData.personal_details?.email || '',
        phone: profileData.phone || profileData.personal_details?.phone || '',
        location: profileData.location || profileData.personal_details?.location || '',
        professional_title: profileData.current_job_title || profileData.personal_details?.professional_title || profileData.professional_summary || ''
      },
      skills: profileData.skills || {
        technical: [],
        tools: []
      },
      experience: profileData.experience || [],
      education: profileData.education || [],
      projects: profileData.projects || [],
      languages: profileData.languages_spoken ? Object.keys(profileData.languages_spoken) : (profileData.languages || [])
    };
    
    // Determine language
    let targetLanguage = language;
    if (language === 'AUTO') {
      const jobLang = jobData.language_required || jobData.german_required || 'EN';
      targetLanguage = jobLang.includes('DE') ? 'DE' : 'EN';
    }
    
    // Word count ranges for letter content (excluding header/greetings)
    const wordCounts = {
      short: '180-200',
      medium: '250-270',
      balanced: '250-270',
      long: '350',
      '250words': '250-270'
    };
    
    // Create COMPREHENSIVE context with ALL available data
    const letterContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || 'Unknown',
        company_description: jobData.companies?.description || '',
        company_industry: jobData.companies?.industry || '',
        company_website: jobData.companies?.website_url || '',
        requirements: {
          skills: jobData.skills_original || [],
          tools: jobData.tools_original || [],
          responsibilities: jobData.responsibilities_original || []
        },
        work_mode: jobData.work_mode,
        location: jobData.location_city,
        is_werkstudent: jobData.is_werkstudent || false,
        description_excerpt: jobData.description?.slice(0, 500) || ''
      },
      profile: {
        name: userProfile.personal_details?.name || 'Applicant',
        title: userProfile.personal_details?.professional_title || 'Professional',
        email: userProfile.personal_details?.email || '',
        phone: userProfile.personal_details?.phone || '',
        location: userProfile.personal_details?.location || '',
        summary: userProfile.personal_details?.summary || userProfile.summary || '',
        achievements: (userProfile.experience || [])
          .slice(0, 4)
          .map(exp => ({
            role: exp.position || exp.title,
            company: exp.company,
            duration: exp.duration || '',
            achievements: exp.achievements || exp.description || '',
            technologies: exp.technologies || []
          })),
        skills: {
          all: Object.values(userProfile.skills || {}).flat().slice(0, 12),
          by_category: userProfile.skills || {}
        },
        projects: userProfile.projects?.slice(0, 3) || [],
        education: userProfile.education || []
      },
      strategy: strategy_context || {
        positioning: {
          themes: ['relevant experience', 'strong technical fit', 'proven results'],
          elevator_pitch: 'Experienced professional with proven track record in relevant technologies'
        },
        ats_keywords: [],
        must_have_gaps: [],
        competitive_advantages: []
      },
      language: targetLanguage,
      tone,
      word_count: wordCounts[length]
    };
    
    // Tone-specific guidance
    const toneGuidance = {
      confident: 'Show quiet confidence through specific achievements. Let your work speak for itself.',
      warm: 'Write like you\'re genuinely excited to share your story with someone you admire. Be authentic and enthusiastic.',
      direct: 'Be honest and straightforward. No fluff, just genuine interest and clear value.'
    };

    // Structure varies by length
    const structureGuidance = length === 'short'
      ? '2 body paragraphs (intro + 2 body + closing)'
      : length === 'long'
      ? '3-4 body paragraphs with deeper examples and stories'
      : '2-3 body paragraphs with solid examples';

    const systemPrompt = `You're writing a cover letter that feels like it's genuinely coming from the heart of someone who's truly excited about this opportunity. ${toneGuidance[tone]}

CORE PHILOSOPHY:
This isn't a corporate template. This is a real person sharing why they care about this role and company. Write like you're telling your mentor why this opportunity feels perfect for you - honest, specific, and genuinely enthusiastic.

🚨🚨🚨 CRITICAL WORD COUNT REQUIREMENT - ABSOLUTE MANDATE 🚨🚨🚨:
- TARGET: ${wordCounts[length]} WORDS for letter content (intro + body_paragraphs + closing combined)
- This is NOT a suggestion - it's a REQUIREMENT that will be VERIFIED
- Count ONLY the actual letter paragraphs, NOT the sign_off
- ${length === 'long' ? 'FOR LONG (350 words): You MUST write AT LEAST 340 words. Write detailed, rich paragraphs with examples, stories, and context. If you only write 200 words, you have FAILED.' : ''}
- ${length === 'medium' ? 'FOR MEDIUM (250-270 words): You MUST write AT LEAST 245 words.' : ''}
- ${length === 'short' ? 'FOR SHORT (180-200 words): You MUST write AT LEAST 180 words.' : ''}
- If you finish and your word count is too low, ADD MORE CONTENT until you reach the target
- ${targetLanguage === 'DE' ? 'Write in German with native fluency and natural expression' : 'Write in English with native fluency and natural expression'}

AUTHENTICITY OVER FORMALITY:
- Write in first person with genuine emotion ("I was genuinely excited when...", "What really draws me to...")
- Share specific moments of discovery ("When I learned about your work in...", "I've been following your...")
- Use real, conversational language - not corporate jargon
- Show you've done your homework about the company - mention specific products, values, recent news
- Connect your personal journey to their mission in a way that feels real, not manufactured

STRUCTURE (${structureGuidance}):

INTRO (Opening hook):
- Start with a genuine moment of connection or discovery
- "When I came across this role..." or "I've been following [Company]'s work in [specific area]..."
- Express real enthusiasm - what specifically excites you about THIS company?
- Briefly preview why you're a strong fit

BODY PARAGRAPHS:
Each paragraph should tell a mini-story:
- Lead with a specific experience or achievement
- Include real numbers and outcomes when possible
- Connect it directly to what the role needs
- Show how you think and solve problems, not just what you did
- Mention specific technologies, tools, or methods that match their needs

For SHORT (180-200 words): 2 focused body paragraphs
- Para 1: Your most relevant achievement/experience
- Para 2: Why you're excited about their specific work

For MEDIUM (250-270 words): 2-3 body paragraphs
- Para 1: Primary relevant experience with metrics
- Para 2: Additional skills/projects that show fit
- Para 3 (optional): Your understanding of their challenges and how you can help

For LONG (350 words): 3-4 SUBSTANTIAL body paragraphs - THIS MUST BE DETAILED
- Para 1 (80-100 words): Most relevant achievement with detailed context and story
- Para 2 (80-90 words): Supporting experiences and technical skills with examples
- Para 3 (70-80 words): Personal projects, learning journey, or specific skills that show passion
- Para 4 (optional, 50-70 words): Your vision for contributing to their mission and growth
- IMPORTANT: Each paragraph should be meaty and detailed to reach 350 total words

CLOSING:
- Express genuine excitement about the possibility of contributing
- Mention specific aspects of the role or company culture that appeal to you
- Show eagerness to discuss further
- End with warmth and confidence

VOICE & STYLE:
- Write like you're writing to a respected colleague, not a stranger
- Vary sentence length naturally - mix short punchy statements with flowing thoughts
- Use active voice ("I built..." not "I was responsible for...")
- Eliminate filler words and obvious statements
- Every sentence should add specific value or insight
- Show personality while staying professional
- Use "I'm" instead of "I am", "I've" instead of "I have" for natural flow

GENUINE INTEREST MARKERS:
- Reference specific company projects, products, or values
- Show you understand their challenges or market position
- Express authentic curiosity about their work
- Connect your personal interests or passions to their mission
- Demonstrate you're not mass-applying - this letter is FOR THEM

AVOID:
- Generic openings ("I am writing to apply...")
- Clichés ("team player", "excellent communication skills", "fast-paced environment")
- Vague statements without backup
- Passive voice and corporate speak
- Repeating your resume
- Fake enthusiasm or exaggeration

${custom_instructions ? `\n🎯 CUSTOM INSTRUCTIONS FROM USER:\n${custom_instructions}\n` : ''}

⚠️ FINAL REMINDER:
Before submitting, COUNT THE WORDS in your output (intro + all body_paragraphs + closing).
It MUST be ${wordCounts[length]} words. If it's short, ADD MORE DETAIL to your paragraphs.
If it's "long" (350 words) and you only have 200 words, you need to add 2-3 MORE FULL PARAGRAPHS with rich detail.

Output JSON only:
{
  "intro": "genuine opening that hooks with specific company knowledge and authentic enthusiasm",
  "body_paragraphs": ["array of 2-4 paragraphs depending on length, each telling a specific story with real examples and outcomes"],
  "closing": "warm closing expressing genuine excitement and confidence about contributing",
  "sign_off": "${targetLanguage === 'DE' ? 'Mit freundlichen Grüßen' : 'Best regards'}",
  "used_keywords": ["naturally woven keywords that appeared organically in your storytelling"]
}`;
    
    try {
      // Adjust max_tokens based on length to ensure enough capacity
      const maxTokensMap = {
        short: 800,   // 180-200 words + JSON overhead
        medium: 1100,  // 250-270 words + JSON overhead
        long: 1600,   // 350 words + JSON overhead (words * ~1.3 tokens/word + 300 overhead)
        balanced: 1100
      };

      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(letterContext) }
        ],
        model: 'gpt-4o', // Higher quality model for prose
        temperature: 0.7, // More creative for authentic, heartfelt writing
        max_tokens: maxTokensMap[length] || 1100
      });
      
      const letterData = JSON.parse(aiResponse.choices?.[0]?.message?.content || '{}');
      
      const coverLetter: CoverLetter = {
        id: `letter_${Date.now()}`,
        job_id,
        user_profile_id,
        tone,
        length,
        language: targetLanguage,
        content: {
          intro: letterData.intro || '',
          body_paragraphs: letterData.body_paragraphs || [],
          closing: letterData.closing || '',
          sign_off: letterData.sign_off || 'Best regards'
        },
        used_keywords: letterData.used_keywords || [],
        created_at: new Date().toISOString()
      };
      
      // Cache the letter
      letterCache.set(cacheKey, {
        letter: coverLetter,
        timestamp: Date.now()
      });
      
      console.log(`🎯 COVER LETTER: Generated ${tone} ${length} letter (${targetLanguage}) with ${coverLetter.used_keywords.length} keywords`);
      
      return NextResponse.json({
        success: true,
        cover_letter: coverLetter,
        cached: false,
        preview: {
          word_count: (coverLetter.content.intro + ' ' + 
                      coverLetter.content.body_paragraphs.join(' ') + ' ' +
                      coverLetter.content.closing).split(' ').length,
          language: targetLanguage,
          tone_applied: tone
        }
      });
      
    } catch (aiError) {
      console.error('🎯 COVER LETTER: AI generation failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Cover letter generation failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('🎯 COVER LETTER: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Cover letter generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/cover-letter
 * Retrieve cached cover letters
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
  
  // Find cached letters for this job/profile
  const userLetters = Array.from(letterCache.entries())
    .filter(([key]) => key.startsWith(`${job_id}_${user_profile_id}`))
    .map(([key, value]) => ({
      cache_key: key,
      age_seconds: Math.round((Date.now() - value.timestamp) / 1000),
      tone: value.letter.tone,
      length: value.letter.length,
      language: value.letter.language,
      preview: value.letter.content.intro.slice(0, 100) + '...'
    }));
  
  return NextResponse.json({
    success: true,
    cached_letters: userLetters,
    available_tones: ['confident', 'warm', 'direct'],
    available_lengths: ['short', 'medium', 'long'],
    cache_stats: {
      total_letters: letterCache.size,
      user_specific: userLetters.length
    }
  });
}
