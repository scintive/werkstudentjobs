import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';

export async function POST(request: NextRequest) {
  try {
    const { profileData, currentSkills } = await request.json();

    console.log('🧠🎯 === INTELLIGENT SKILL ORGANIZATION API ===');
    console.log('🧠🎯 Profile provided:', !!profileData);
    console.log('🧠🎯 Current skills provided:', !!currentSkills);

    if (!profileData) {
      return NextResponse.json({ 
        error: 'Profile data is required for intelligent skill organization' 
      }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('🧠🎯 No OpenAI key, using minimal fallback organization');
      return NextResponse.json({
        organized_categories: {
          "Core Skills": {
            skills: [],
            suggestions: ["Communication", "Problem Solving", "Time Management"],
            reasoning: "Essential professional skills"
          },
          "Technical Skills": {
            skills: [],
            suggestions: ["Microsoft Office", "Data Analysis", "Project Management"],
            reasoning: "Basic technical competencies"
          }
        },
        profile_assessment: {
          career_focus: "Professional Development",
          skill_level: "entry", 
          recommendations: "Build foundational skills"
        },
        category_mapping: {},
        source: 'fallback',
        success: true
      });
    }

    // Initialize LLM client
    (llmService as any).client = llmService.initializeClient();
    
    console.log('🧠🎯 Generating intelligent skill organization...');
    const organization = await llmService.organizeSkillsIntelligently(profileData, currentSkills);
    
    console.log('🧠🎯 === ORGANIZATION GENERATED ===');
    console.log('🧠🎯 Categories count:', Object.keys(organization.organized_categories || {}).length);
    console.log('🧠🎯 Career focus:', organization.profile_assessment?.career_focus);
    console.log('🧠🎯 Skill level:', organization.profile_assessment?.skill_level);

    return NextResponse.json({
      ...organization,
      source: 'gpt',
      success: true,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧠🎯 Skill organization error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to organize skills intelligently',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
