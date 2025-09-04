import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';
import type { StudentBulletSuggestion } from '@/lib/types/studentProfile';

interface BulletRewriteRequest {
  bullets: string[];
  context: {
    student_profile?: {
      degree_program?: string;
      university?: string;
      current_year?: number;
      relevant_coursework?: Array<{
        course_name: string;
        relevant_topics: string[];
        grade?: string;
      }>;
      academic_projects?: Array<{
        title: string;
        technologies: string[];
        metrics?: Array<{ type: string; value: string; context?: string }>;
      }>;
      student_jobs?: Array<{
        title: string;
        company: string;
        responsibilities: string[];
      }>;
    };
    target_role?: string;
    industry?: string;
    language?: 'EN' | 'DE';
  };
}

// Cache for bullet rewrites
const bulletCache = new Map<string, { suggestions: StudentBulletSuggestion[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Generate cache key for bullet rewrite requests
 */
function generateCacheKey(bullets: string[], context: any): string {
  const key = JSON.stringify({
    bullets: bullets.sort(),
    context: {
      degree: context.student_profile?.degree_program,
      role: context.target_role,
      industry: context.industry,
      language: context.language
    }
  });
  return Buffer.from(key).toString('base64').slice(0, 16);
}

/**
 * POST /api/resume/rewrite-student-bullets
 * Rewrite resume bullets to highlight student achievements with metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulletRewriteRequest = await request.json();
    const { bullets, context } = body;
    
    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return NextResponse.json(
        { error: 'bullets array is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    if (bullets.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 bullets allowed per request' },
        { status: 400 }
      );
    }
    
    console.log(`📝 STUDENT BULLETS: Rewriting ${bullets.length} bullets for ${context.target_role || 'unknown role'}`);
    
    // Check cache
    const cacheKey = generateCacheKey(bullets, context);
    const cached = bulletCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('📝 STUDENT BULLETS: Cache hit');
      return NextResponse.json({
        success: true,
        suggestions: cached.suggestions,
        cached: true
      });
    }
    
    // Create student-focused context
    const studentContext = {
      profile: {
        degree: context.student_profile?.degree_program || 'Computer Science',
        year: context.student_profile?.current_year || 3,
        university: context.student_profile?.university || 'University',
        top_courses: (context.student_profile?.relevant_coursework || [])
          .slice(0, 3)
          .map(c => ({
            name: c.course_name,
            topics: c.relevant_topics?.slice(0, 3),
            grade: c.grade
          })),
        top_projects: (context.student_profile?.academic_projects || [])
          .slice(0, 2)
          .map(p => ({
            title: p.title,
            tech: p.technologies?.slice(0, 3),
            metrics: p.metrics?.slice(0, 2)
          })),
        work_experience: (context.student_profile?.student_jobs || [])
          .slice(0, 2)
          .map(j => ({
            role: j.title,
            company: j.company,
            key_tasks: j.responsibilities?.slice(0, 2)
          }))
      },
      target: {
        role: context.target_role || 'Software Developer',
        industry: context.industry || 'Technology'
      },
      language: context.language || 'EN'
    };
    
    const systemPrompt = `You are a German career counselor specializing in student resume optimization for Werkstudent positions.

Your task: Transform basic resume bullets into achievement-focused statements that highlight student potential.

KEY PRINCIPLES for Student Resumes:
1. **Academic Achievement Focus**: Emphasize grades, project outcomes, coursework relevance
2. **Quantifiable Impact**: Add metrics even for academic work (95% accuracy, 10-person team, 3-week project)
3. **Professional Language**: Use active verbs, industry terminology, confident tone
4. **Student-Specific Value**: Highlight learning agility, fresh perspective, modern skills
5. **German Market Alignment**: Include relevant German keywords for ATS systems

${context.language === 'DE' ? `
GERMAN LANGUAGE REQUIREMENTS:
- Write all bullets in professional German
- Use German technical terms and industry vocabulary  
- Include Werkstudent-relevant keywords: "Teilzeit", "Studienbegleitend", "Praktische Erfahrung"
- Maintain formal business German style
` : `
ENGLISH LANGUAGE REQUIREMENTS:  
- Use clear, professional English
- Include German market keywords where relevant
- Maintain international business English standards
`}

BULLET TRANSFORMATION FRAMEWORK:
1. **Identify Core Activity**: What did the student do?
2. **Find Hidden Metrics**: Project duration, team size, grade, efficiency gain, accuracy
3. **Add Professional Context**: Connect to real business value
4. **Industry Keywords**: Include relevant technical/business terms
5. **Result Emphasis**: Lead with outcome where possible

STUDENT ACHIEVEMENT METRICS to Look For:
- Academic: Grades (1.3, "sehr gut"), project scores, presentation ratings
- Scale: Team sizes, project scope, data volumes, user counts  
- Time: Project duration, deadline management, speed improvements
- Quality: Accuracy rates, error reduction, testing coverage
- Impact: Problem solved, process improved, efficiency gained

OUTPUT FORMAT (JSON only):
{
  "suggestions": [
    {
      "original": "Original bullet text",
      "type": "coursework|project|student_job|activity", 
      "proposed": "Transformed professional bullet with metrics",
      "metric_added": "Specific metric that was added",
      "keywords_used": ["keyword1", "keyword2", "keyword3"],
      "reasoning": "Brief explanation of transformation approach"
    }
  ]
}`;

    try {
      const aiResponse = await llmService.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: JSON.stringify({
              bullets_to_rewrite: bullets,
              student_context: studentContext
            })
          }
        ],
        model: 'gpt-4o-mini', // Cost-effective for bullet rewriting
        temperature: 0.7, // Some creativity for varied phrasing
        max_tokens: 1000
      });
      
      const response = JSON.parse(aiResponse.choices?.[0]?.message?.content || '{}');
      const suggestions: StudentBulletSuggestion[] = response.suggestions || [];
      
      // Validate and enhance suggestions
      const validatedSuggestions = suggestions.map((suggestion, index) => ({
        original: suggestion.original || bullets[index] || '',
        type: suggestion.type || 'activity',
        proposed: suggestion.proposed || bullets[index] || '',
        metric_added: suggestion.metric_added,
        keywords_used: Array.isArray(suggestion.keywords_used) ? suggestion.keywords_used : [],
        reasoning: suggestion.reasoning || 'Enhanced with professional language and metrics'
      })).filter(s => s.proposed && s.proposed !== s.original);
      
      // Cache the results
      bulletCache.set(cacheKey, {
        suggestions: validatedSuggestions,
        timestamp: Date.now()
      });
      
      console.log(`📝 STUDENT BULLETS: Generated ${validatedSuggestions.length} enhanced bullets`);
      
      return NextResponse.json({
        success: true,
        suggestions: validatedSuggestions,
        cached: false,
        metadata: {
          total_bullets: bullets.length,
          enhanced_bullets: validatedSuggestions.length,
          language: context.language,
          target_role: context.target_role,
          student_focused: true
        }
      });
      
    } catch (aiError) {
      console.error('📝 STUDENT BULLETS: AI generation failed:', aiError);
      return NextResponse.json(
        { 
          error: 'Student bullet rewriting failed',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('📝 STUDENT BULLETS: Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Student bullet rewriting failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to rewrite student bullets.' },
    { status: 405 }
  );
}