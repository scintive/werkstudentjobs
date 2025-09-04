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
    llmService.client = llmService.initializeClient();
    
    // Generate intelligent skill suggestions based on profile analysis
    console.log('🎯 Calling GPT for intelligent skill suggestions...');
    const intelligentSuggestions = await llmService.generateSkillSuggestions(userProfile, currentSkills);

    // Also organize current skills for backward compatibility
    const skillsArray = Array.isArray(currentSkills) ? currentSkills : 
                      typeof currentSkills === 'object' ? 
                      Object.values(currentSkills).flat() : [];
    
    const organizedSkills = enhancedAutoCategorizeSkills(skillsArray);
    
    console.log('🎯 GPT Suggestions Generated Successfully');
    console.log('🎯 Technical Suggestions:', intelligentSuggestions.skill_suggestions?.technical?.length || 0);
    console.log('🎯 Soft Skills Suggestions:', intelligentSuggestions.skill_suggestions?.soft_skills?.length || 0);
    console.log('🎯 Priority Recommendations:', intelligentSuggestions.priority_recommendations?.length || 0);

    // Format response to include both organized skills and intelligent suggestions
    const enhancedResponse = {
      // Backward compatibility - organized current skills
      organized_skills: organizedSkills,
      
      // New GPT-powered intelligent suggestions
      intelligent_suggestions: intelligentSuggestions,
      
      // Legacy format support for existing frontend
      suggestions: {
        technical: intelligentSuggestions.skill_suggestions?.technical?.map(s => s.skill) || [],
        soft_skills: intelligentSuggestions.skill_suggestions?.soft_skills?.map(s => s.skill) || [],
        industry_specific: intelligentSuggestions.skill_suggestions?.industry_specific?.map(s => s.skill) || [],
        tools_platforms: intelligentSuggestions.skill_suggestions?.tools_platforms?.map(s => s.skill) || []
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