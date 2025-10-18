import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';
import { 
  enhancedAutoCategorizeSkills,
  EnhancedSkillCategories
} from '@/lib/enhancedSkillsSystem';

export async function POST(request: NextRequest) {
  try {
    const { userProfile, currentSkills } = await request.json();

    console.log('🎯 === SKILLS ENHANCE API ===');
    console.log('🎯 Profile provided:', !!userProfile);
    console.log('🎯 Current skills:', JSON.stringify(currentSkills, null, 2));

    if (!process.env.OPENAI_API_KEY) {
      console.log('🎯 No OpenAI key, using fallback skill suggestions');
      // Fallback suggestions when no API key
      const categorized = enhancedAutoCategorizeSkills(currentSkills || []);
      
      return NextResponse.json({
        organized_skills: categorized,
        suggestions: {
          communication: ['Public Speaking', 'Technical Writing', 'Cross-functional Collaboration'],
          problem_solving: ['Critical Thinking', 'Analytical Reasoning', 'Creative Problem Solving'],
          adaptability: ['Learning Agility', 'Change Management', 'Resilience'],
          project_management: ['Time Management', 'Resource Planning', 'Stakeholder Management']
        },
        soft_skills_suggestions: [
          'Communication', 'Problem Solving', 'Team Collaboration', 
          'Adaptability', 'Time Management', 'Leadership', 'Critical Thinking'
        ],
        reasoning: 'Fallback suggestions provided due to missing API key'
      });
    }

    // Initialize LLM client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (llmService as any).client = llmService.initializeClient();
    
    // Generate intelligent skill suggestions based on profile analysis
    console.log('🎯 Calling GPT for intelligent skill suggestions...');
    const intelligentSuggestionsRaw = await llmService.generateSkillSuggestions(userProfile, currentSkills);
    const intelligentSuggestions = intelligentSuggestionsRaw as Record<string, unknown>;

    // Also organize current skills for backward compatibility
    const skillsArray = Array.isArray(currentSkills) ? currentSkills :
                      typeof currentSkills === 'object' ?
                      Object.values(currentSkills).flat() : [];

    const organizedSkills = enhancedAutoCategorizeSkills(skillsArray);

    console.log('🎯 GPT Suggestions Generated Successfully');
    const skillSuggestions = intelligentSuggestions.skill_suggestions as Record<string, unknown> | undefined;
    const technical = skillSuggestions?.technical as unknown[] | undefined;
    const softSkills = skillSuggestions?.soft_skills as unknown[] | undefined;
    const priorityRecommendations = intelligentSuggestions.priority_recommendations as unknown[] | undefined;
    console.log('🎯 Technical Suggestions:', technical?.length || 0);
    console.log('🎯 Soft Skills Suggestions:', softSkills?.length || 0);
    console.log('🎯 Priority Recommendations:', priorityRecommendations?.length || 0);

    // Format response to include both organized skills and intelligent suggestions
    const enhancedResponse = {
      // Backward compatibility - organized current skills
      organized_skills: organizedSkills,
      
      // New GPT-powered intelligent suggestions
      intelligent_suggestions: intelligentSuggestions,
      
      // Legacy format support for existing frontend
      suggestions: {
        technical: skillSuggestions?.technical ? (skillSuggestions.technical as unknown[]).map((s: unknown) => (s as Record<string, unknown>).skill) : [],
        soft_skills: skillSuggestions?.soft_skills ? (skillSuggestions.soft_skills as unknown[]).map((s: unknown) => (s as Record<string, unknown>).skill) : [],
        industry_specific: skillSuggestions?.industry_specific ? (skillSuggestions.industry_specific as unknown[]).map((s: unknown) => (s as Record<string, unknown>).skill) : [],
        tools_platforms: skillSuggestions?.tools_platforms ? (skillSuggestions.tools_platforms as unknown[]).map((s: unknown) => (s as Record<string, unknown>).skill) : []
      },
      
      // Enhanced suggestions with reasoning
      detailed_suggestions: intelligentSuggestions.skill_suggestions,
      priority_recommendations: intelligentSuggestions.priority_recommendations,
      learning_path: intelligentSuggestions.learning_path,
      profile_analysis: intelligentSuggestions.profile_analysis,
      
      reasoning: 'GPT-powered profile analysis completed successfully'
    };

    console.log('🎯 Enhanced Response Generated');
    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('Skill enhancement error:', error);
    
    // Return fallback suggestions on error
    const fallbackSuggestions = {
      organized_skills: enhancedAutoCategorizeSkills([]),
      suggestions: {
        communication: ['Public Speaking', 'Technical Writing', 'Presentation Skills'],
        problem_solving: ['Critical Thinking', 'Analytical Reasoning', 'Creative Problem Solving'],
        collaboration: ['Team Collaboration', 'Cross-functional Work', 'Mentoring'],
        adaptability: ['Learning Agility', 'Change Management', 'Resilience']
      },
      soft_skills_suggestions: [
        'Communication', 'Problem Solving', 'Team Collaboration', 
        'Leadership', 'Adaptability', 'Time Management', 'Critical Thinking'
      ],
      reasoning: 'Fallback suggestions due to API error'
    };

    return NextResponse.json(fallbackSuggestions);
  }
}
