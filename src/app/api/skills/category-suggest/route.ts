import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';

export async function POST(request: NextRequest) {
  try {
    const { categoryName, profileData, currentCategorySkills = [] } = await request.json();

    console.log('🎯📂 === CATEGORY SKILL SUGGESTIONS API ===');
    console.log('🎯📂 Category:', categoryName);
    console.log('🎯📂 Current skills in category:', currentCategorySkills);
    console.log('🎯📂 Profile provided:', !!profileData);

    if (!categoryName) {
      return NextResponse.json({ 
        error: 'Category name is required' 
      }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('🎯📂 No OpenAI key, using fallback suggestions for category:', categoryName);
      // Use the fallback function from LLM service
      const fallbackSkills = llmService['getFallbackCategorySkills'](categoryName);
      return NextResponse.json({
        suggestions: fallbackSkills,
        category: categoryName,
        source: 'fallback',
        success: true
      });
    }

    // Initialize LLM client
    (llmService as any).client = llmService.initializeClient();
    
    console.log('🎯📂 Generating GPT category-specific suggestions...');
    const suggestions = await llmService.generateCategorySkillSuggestions(
      categoryName, 
      profileData, 
      currentCategorySkills
    );
    
    console.log('🎯📂 === CATEGORY SUGGESTIONS GENERATED ===');
    console.log('🎯📂 Suggestions count:', suggestions.length);
    console.log('🎯📂 Suggestions:', suggestions);

    return NextResponse.json({
      suggestions,
      category: categoryName,
      source: 'gpt',
      success: true,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('🎯📂 Category skill suggestions error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate category skill suggestions',
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
