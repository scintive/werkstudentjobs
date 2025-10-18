/**
 * Intelligent Job Analysis Service
 *
 * Uses GPT-4o-mini to provide deep, relevant job-user compatibility analysis
 * Focuses on REAL matching based on responsibilities, experience, and skills
 * NO fallbacks, NO fake scores - only accurate GPT-based analysis
 */

import { llmService } from './llmService';
import { buildJobAnalysisPrompt, SYSTEM_PROMPT } from '../config/intelligentAnalysisPrompts';

export interface ResponsibilityMatch {
  responsibility: string;
  compatibility_score: number; // 0-100, based on actual experience
  user_evidence: string[]; // Specific experiences/projects that match
  gap_analysis: string | null; // What's missing if score < 80
  learning_recommendation: string | null; // How to close the gap
  recommended_courses?: Array<{ // Specific courses/certifications to learn
    name: string;
    provider: string; // e.g., "Coursera", "freeCodeCamp", "Google"
    url?: string;
  }>;
}

export interface ExperienceRelevance {
  position: string;
  company: string;
  relevance_score: number; // 0-100, how relevant to THIS job
  key_skills_demonstrated: string[];
  why_relevant: string; // Clear explanation
  highlighted_achievements: string[];
}

export interface SkillCategoryAnalysis {
  category: string;
  matched_skills: Array<{
    skill: string;
    proficiency_evidence: string; // Where they demonstrated this
  }>;
  missing_critical_skills: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    learning_path: string;
    time_estimate: string;
  }>;
  overall_category_fit: number; // 0-100
}

export interface IntelligentJobAnalysis {
  // Overall compatibility
  overall_match_score: number; // 0-100, weighted average

  // Responsibility-level analysis
  responsibility_breakdown: ResponsibilityMatch[];

  // Experience relevance (only show relevant experiences)
  relevant_experiences: ExperienceRelevance[];

  // Skills analysis by category
  skills_analysis: SkillCategoryAnalysis[];

  // Strategic positioning
  positioning_strategy: {
    your_unique_angle: string; // How to position yourself
    key_differentiators: string[]; // What makes you stand out
    red_flags_to_address: string[]; // Gaps to acknowledge/address
    interview_talking_points: string[]; // Specific examples to highlight
  };

  // Action items (prioritized)
  action_plan: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expected_impact: string;
    time_investment: string;
  }>;
}

class IntelligentJobAnalysisService {
  /**
   * Generate intelligent job analysis using GPT-4o-mini
   * This is the ONLY source of analysis - no fallbacks
   */
  async analyzeJobCompatibility(params: {
    job: unknown;
    userProfile: unknown;
    userExperience: unknown[];
    userProjects?: unknown[];
    userSkills: Record<string, string[]>;
  }): Promise<IntelligentJobAnalysis> {

    const { job, userProfile, userExperience, userProjects = [], userSkills } = params;

    console.log('🎯 INTELLIGENT JOB ANALYSIS: Starting GPT-4o-mini analysis for', job.title);

    // Build prompt using extracted config
    const prompt = buildJobAnalysisPrompt({
      job,
      userProfile,
      userExperience,
      userProjects,
      userSkills
    });

    let response: unknown = null;

    try {
      response = await llmService.createJsonCompletion({
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 4096 // Increased from 3000 to allow for complete response
      });

      console.log('🔍 GPT Response Preview:', JSON.stringify(response).substring(0, 500));

      // Extract JSON content from OpenAI response
      const content = response.choices?.[0]?.message?.content || '{}';
      console.log('🔍 GPT Content Length:', content.length);

      // Validate and return structured analysis
      return this.validateAndStructureAnalysis(content);

    } catch (error) {
      console.error('❌ GPT analysis failed:', error);
      if (response) {
        console.error('Response was:', JSON.stringify(response).substring(0, 1000));
      }
      throw new Error('Job analysis failed. Please try again.');
    }
  }

  /**
   * Validate GPT response and structure it properly
   * Also validates course URLs against verified database
   */
  private validateAndStructureAnalysis(rawResponse: unknown): IntelligentJobAnalysis {
    // Parse if string
    const data = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

    // Validate required fields
    if (typeof data.overall_match_score !== 'number') {
      throw new Error('Invalid analysis: missing overall_match_score');
    }

    if (!Array.isArray(data.responsibility_breakdown)) {
      throw new Error('Invalid analysis: missing responsibility_breakdown');
    }

    // Ensure all scores are 0-100
    const clampScore = (score: number) => Math.max(0, Math.min(100, score));

    return {
      overall_match_score: clampScore(data.overall_match_score),
      responsibility_breakdown: (data.responsibility_breakdown || []).map((r: Record<string, any>) => ({
        responsibility: r.responsibility || '',
        compatibility_score: clampScore(r.compatibility_score || 0),
        user_evidence: Array.isArray(r.user_evidence) ? r.user_evidence : [],
        gap_analysis: r.gap_analysis || null,
        learning_recommendation: r.learning_recommendation || null,
        recommended_courses: Array.isArray(r.recommended_courses)
          ? r.recommended_courses
              .filter((course: Record<string, any>) => {
                // Only include courses with valid URLs
                const url = course.url?.toLowerCase() || '';
                if (!url || url === 'null' || !url.startsWith('http')) {
                  console.log(`🚫 Skipping course with invalid URL: ${course.name}`);
                  return false;
                }
                // Filter out Udemy and Coursera
                if (url.includes('udemy.com') || url.includes('coursera.org')) {
                  console.log(`🚫 Filtered out banned platform: ${course.name} - ${url}`);
                  return false;
                }
                return true;
              })
              .map((course: Record<string, any>) => ({
                name: course.name || '',
                provider: course.provider || '',
                url: course.url
              }))
          : []
      })),
      relevant_experiences: (data.relevant_experiences || [])
        .filter((exp: Record<string, any>) => exp.relevance_score >= 40) // Show experiences with moderate or higher relevance
        .map((exp: Record<string, any>) => ({
          position: exp.position || '',
          company: exp.company || '',
          relevance_score: clampScore(exp.relevance_score || 0),
          key_skills_demonstrated: Array.isArray(exp.key_skills_demonstrated) ? exp.key_skills_demonstrated : [],
          why_relevant: exp.why_relevant || '',
          highlighted_achievements: Array.isArray(exp.highlighted_achievements) ? exp.highlighted_achievements : []
        })),
      skills_analysis: (data.skills_analysis || []).map((cat: Record<string, any>) => ({
        category: cat.category || '',
        matched_skills: Array.isArray(cat.matched_skills) ? cat.matched_skills : [],
        missing_critical_skills: Array.isArray(cat.missing_critical_skills) ? cat.missing_critical_skills : [],
        overall_category_fit: clampScore(cat.overall_category_fit || 0)
      })),
      positioning_strategy: {
        your_unique_angle: data.positioning_strategy?.your_unique_angle || '',
        key_differentiators: Array.isArray(data.positioning_strategy?.key_differentiators)
          ? data.positioning_strategy.key_differentiators : [],
        red_flags_to_address: Array.isArray(data.positioning_strategy?.red_flags_to_address)
          ? data.positioning_strategy.red_flags_to_address : [],
        interview_talking_points: Array.isArray(data.positioning_strategy?.interview_talking_points)
          ? data.positioning_strategy.interview_talking_points : []
      },
      action_plan: (data.action_plan || []).map((item: unknown) => ({
        priority: item.priority || 'medium',
        action: item.action || '',
        expected_impact: item.expected_impact || '',
        time_investment: item.time_investment || ''
      }))
    };
  }
}

export const intelligentJobAnalysisService = new IntelligentJobAnalysisService();
