import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';

export async function POST(request: NextRequest) {
  try {
    const { profileData, currentSkills } = await request.json();

    console.log('💡 === SKILL SUGGESTIONS API ===');
    console.log('💡 Profile provided:', !!profileData);
    console.log('💡 Current skills provided:', !!currentSkills);
    console.log('💡 Skills count:', Array.isArray(currentSkills) ? currentSkills.length : 
                   typeof currentSkills === 'object' ? Object.values(currentSkills).flat().length : 0);

    if (!profileData) {
      return NextResponse.json({ 
        error: 'Profile data is required for intelligent skill suggestions' 
      }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('💡 No OpenAI key, returning generic suggestions');
      return NextResponse.json({
        skill_suggestions: {
          technical: [
            { skill: "Data Analysis", reason: "Highly valued across industries" },
            { skill: "Project Management", reason: "Essential for leadership roles" },
            { skill: "Digital Marketing", reason: "Critical in modern business" }
          ],
          soft_skills: [
            { skill: "Communication", reason: "Core skill for professional success" },
            { skill: "Problem Solving", reason: "Valued in all industries" },
            { skill: "Time Management", reason: "Essential for productivity" }
          ],
          industry_specific: [
            { skill: "Industry Knowledge", reason: "Stay current with trends" }
          ],
          tools_platforms: [
            { skill: "Microsoft Office", reason: "Standard workplace requirement" },
            { skill: "Google Workspace", reason: "Common collaboration tool" }
          ]
        },
        priority_recommendations: [
          { skill: "Communication", category: "soft_skills", impact: "High impact for any career" },
          { skill: "Data Analysis", category: "technical", impact: "Increasingly important skill" }
        ],
        learning_path: {
          immediate: ["Communication", "Time Management"],
          short_term: ["Data Analysis", "Project Management"],
          long_term: ["Leadership", "Strategic Planning"]
        },
        profile_analysis: "Generic suggestions provided - OpenAI API key required for personalized analysis",
        success: true
      });
    }

    // Initialize LLM client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (llmService as any).client = llmService.initializeClient();

    console.log('💡 Generating GPT-powered skill suggestions...');
    const suggestionsRaw = await llmService.generateSkillSuggestions(profileData, currentSkills);
    const suggestions = suggestionsRaw as Record<string, unknown>;

    console.log('💡 === SUGGESTIONS GENERATED ===');
    const skillSuggestions = suggestions.skill_suggestions as Record<string, unknown> | undefined;
    const technical = skillSuggestions?.technical as unknown[] | undefined;
    const softSkills = skillSuggestions?.soft_skills as unknown[] | undefined;
    const industrySpecific = skillSuggestions?.industry_specific as unknown[] | undefined;
    const toolsPlatforms = skillSuggestions?.tools_platforms as unknown[] | undefined;
    const priorityRecommendations = suggestions.priority_recommendations as unknown[] | undefined;
    console.log('💡 Technical:', technical?.length || 0);
    console.log('💡 Soft Skills:', softSkills?.length || 0);
    console.log('💡 Industry Specific:', industrySpecific?.length || 0);
    console.log('💡 Tools/Platforms:', toolsPlatforms?.length || 0);
    console.log('💡 Priority Recommendations:', priorityRecommendations?.length || 0);

    return NextResponse.json({
      ...suggestions,
      success: true,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('💡 Skill suggestions error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate skill suggestions',
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
