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
    (llmService as any).client = llmService.initializeClient();
    
    console.log('💡 Generating GPT-powered skill suggestions...');
    const suggestions = await llmService.generateSkillSuggestions(profileData, currentSkills);
    
    console.log('💡 === SUGGESTIONS GENERATED ===');
    console.log('💡 Technical:', suggestions.skill_suggestions?.technical?.length || 0);
    console.log('💡 Soft Skills:', suggestions.skill_suggestions?.soft_skills?.length || 0);
    console.log('💡 Industry Specific:', suggestions.skill_suggestions?.industry_specific?.length || 0);
    console.log('💡 Tools/Platforms:', suggestions.skill_suggestions?.tools_platforms?.length || 0);
    console.log('💡 Priority Recommendations:', suggestions.priority_recommendations?.length || 0);

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
