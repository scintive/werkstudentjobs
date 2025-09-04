import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
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
      length = 'medium',
      language = 'AUTO',
      strategy_context = null // Optional: pass strategy data to avoid re-fetch
    } = await request.json();
    
    if (!job_id || !user_profile_id) {
      return NextResponse.json(
        { error: 'job_id and user_profile_id are required' },
        { status: 400 }
      );
    }
    
    console.log(`🎯 COVER LETTER: Generating ${tone} ${length} letter for job ${job_id}`);
    
    // Check cache
    const cacheKey = `${job_id}_${user_profile_id}_${tone}_${length}_${language}`;
    const cached = letterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('🎯 COVER LETTER: Cache hit');
      return NextResponse.json({
        success: true,
        cover_letter: cached.letter,
        cached: true,
        cache_age: Math.round((Date.now() - cached.timestamp) / 1000)
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
    
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_profile_id)
      .single();
    
    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Convert user_profiles table data to UserProfile format
    const userProfile = {
      personal_details: {
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        professional_title: profileData.current_job_title || ''
      },
      skills: {
        technical: profileData.skills || [],
        tools: profileData.tools || []
      },
      experience: [], // Simplified for cover letter context
      languages: profileData.languages_spoken ? Object.keys(profileData.languages_spoken) : []
    };
    
    // Determine language
    let targetLanguage = language;
    if (language === 'AUTO') {
      const jobLang = jobData.language_required || jobData.german_required || 'EN';
      targetLanguage = jobLang.includes('DE') ? 'DE' : 'EN';
    }
    
    // Word count targets by length
    const wordCounts = {
      short: '150-200',
      medium: '220-300', 
      long: '360-370'
    };
    
    // Create compact context
    const letterContext = {
      job: {
        title: jobData.title,
        company: jobData.company_name || 'Unknown',
        company_description: jobData.companies?.description || '',
        must_haves: [
          ...(jobData.skills_original || []),
          ...(jobData.tools_original || []),
          ...(jobData.responsibilities_original || [])
        ].slice(0, 6),
        work_mode: jobData.work_mode,
        location: jobData.location_city
      },
      profile: {
        name: userProfile.personal_details?.name || 'Applicant',
        title: userProfile.personal_details?.professional_title || 'Professional',
        top_achievements: (userProfile.experience || [])
          .slice(0, 3)
          .map(exp => ({
            role: exp.position || exp.title,
            company: exp.company,
            achievement: exp.achievements || exp.description || ''
          })),
        top_skills: Object.values(userProfile.skills || {})
          .flat()
          .slice(0, 6)
      },
      positioning: strategy_context?.positioning || {
        themes: ['relevant experience', 'strong technical fit', 'proven results'],
        elevator_pitch: 'Experienced professional with proven track record in relevant technologies'
      },
      language: targetLanguage,
      tone,
      word_count: wordCounts[length]
    };
    
    // Tone-specific system prompts
    const tonePrompts = {
      confident: 'Write with authority and proven results. Focus on achievements and capabilities.',
      warm: 'Write with genuine enthusiasm and personal connection. Show authentic interest.',
      direct: 'Write concisely and professionally. Get straight to the point with clear value.'
    };
    
    const systemPrompt = `You are a professional cover letter writer. ${tonePrompts[tone]}

Guidelines:
- ${wordCounts[length]} words in ${targetLanguage === 'DE' ? 'German' : 'English'}
- Don't repeat resume bullets verbatim
- Focus on 2-3 specific role outcomes tied to job must-haves
- Include at least 2 company-specific facts (products, recent news, values) drawn from provided context
- Include 2 quantified achievements from the candidate history (metrics, scale, impact)
- Vary sentence length and structure; avoid generic filler
- Include 2-3 keywords naturally
- Be specific and authentic

Output JSON only:
{
  "intro": "1-2 sentences tailored to role/company",
  "body_paragraphs": ["paragraph1", "paragraph2", "paragraph3?"],
  "closing": "1 sentence call-to-action", 
  "sign_off": "professional sign-off",
  "used_keywords": ["keyword1", "keyword2"]
}`;
    
    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(letterContext) }
        ],
        model: 'gpt-4o', // Higher quality model for prose
        temperature: 0.6, // More creative for natural writing
        max_tokens: 600
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
