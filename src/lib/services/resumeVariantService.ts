import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

export interface ResumeVariant {
  id: string;
  base_resume_id: string;
  job_id: string;
  user_id?: string;
  session_id?: string;
  variant_name?: string;
  tailored_data: unknown; // Full resume JSON
  applied_suggestions: string[];
  ats_keywords: string[];
  match_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeSuggestion {
  id: string;
  variant_id: string;
  job_id: string;
  section: 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'languages' | 'custom' | 'title';
  suggestion_type: 'text' | 'bullet' | 'skill_addition' | 'skill_removal' | 'reorder' | 'language_addition' | 'skill_edit' | 'alias';
  target_id?: string;
  original_content: string;
  suggested_content: string;
  rationale: string;
  ats_relevance?: string;
  keywords?: string[];
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  accepted?: boolean;
  applied_at?: string;
  created_at: string;
  diff_html?: string;
  before?: string;
  after?: string;
  resume_evidence?: string;
  job_requirement?: string;
  ats_keywords?: string[];
  target_path?: string;
}

class ResumeVariantService {
  private static instance: ResumeVariantService;

  private constructor() {}

  static getInstance(): ResumeVariantService {
    if (!ResumeVariantService.instance) {
      ResumeVariantService.instance = new ResumeVariantService();
    }
    return ResumeVariantService.instance;
  }

  /**
   * Get or create a resume variant for a specific job
   */
  async getOrCreateVariant(
    baseResumeId: string,
    jobId: string,
    userId?: string,
    sessionId?: string
  ): Promise<ResumeVariant | null> {
    try {
      // First, try to get existing variant
      const query = supabase
        .from('resume_variants')
        .select('*')
        .eq('base_resume_id', baseResumeId)
        .eq('job_id', jobId)
        .single();

      const { data: existingVariant, error: fetchError } = await query;

      if (existingVariant && !fetchError) {
        console.log('📄 Found existing resume variant:', (existingVariant as unknown).id);
        return existingVariant as ResumeVariant;
      }

      // Get base resume data
      const { data: baseResume, error: baseError } = await supabase
        .from('resume_data')
        .select('*')
        .eq('id', baseResumeId)
        .single();

      if (baseError || !baseResume) {
        console.error('Failed to fetch base resume:', baseError);
        return null;
      }

      // Resolve user id for RLS-safe insert
      let effectiveUserId = userId || (baseResume as unknown)?.user_id || null;
      try {
        if (!effectiveUserId) {
          const { data: authData } = await supabase.auth.getUser();
          effectiveUserId = authData?.user?.id || effectiveUserId;
        }
      } catch {}

      // Create new variant with base resume data as starting point
      const newVariant = {
        base_resume_id: baseResumeId,
        job_id: jobId,
        user_id: effectiveUserId,
        session_id: sessionId || null,
        tailored_data: {
          personalInfo: (baseResume as unknown).personal_info,
          professionalTitle: (baseResume as unknown).professional_title,
          professionalSummary: (baseResume as unknown).professional_summary,
          enableProfessionalSummary: (baseResume as unknown).enable_professional_summary,
          skills: (baseResume as unknown).skills || {},
          experience: (baseResume as unknown).experience || [],
          education: (baseResume as unknown).education || [],
          projects: (baseResume as unknown).projects || [],
          certifications: (baseResume as unknown).certifications || [],
          customSections: (baseResume as unknown).custom_sections || [],
          languages: (baseResume as unknown).languages || []
        },
        applied_suggestions: [],
        ats_keywords: [],
        is_active: true
      };

      const { data: createdVariant, error: createError } = await supabase
        .from('resume_variants')
        .insert(newVariant as never)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create resume variant:', createError);
        return null;
      }

      console.log('✅ Created new resume variant:', (createdVariant as unknown).id);
      return createdVariant as ResumeVariant;
    } catch (error) {
      console.error('Error in getOrCreateVariant:', error);
      return null;
    }
  }

  /**
   * Update a resume variant with tailored data
   */
  async updateVariant(
    variantId: string,
    tailoredData: unknown,
    appliedSuggestions?: string[],
    template?: string
  ): Promise<boolean> {
    try {
      // Ensure we scope the update by the current user to satisfy RLS policies
      let authUserId: string | null = null
      try {
        const { data: authData } = await supabase.auth.getUser()
        authUserId = authData?.user?.id || null
      } catch {}

      const updateData: unknown = {
        tailored_data: tailoredData,
        updated_at: new Date().toISOString()
      };

      if (appliedSuggestions) {
        updateData.applied_suggestions = appliedSuggestions;
      }

      if (template) {
        updateData.template = template;
      }

      const { error } = await supabase
        .from('resume_variants')
        .update(updateData as never)
        .eq('id', variantId)
        .maybeSingle();

      if (error) {
        console.error('Failed to update resume variant:', error);
        return false;
      }

      console.log('✅ Updated resume variant:', variantId);
      return true;
    } catch (error) {
      console.error('Error updating variant:', error);
      return false;
    }
  }

  /**
   * Update match score for a resume variant
   */
  async updateMatchScore(
    variantId: string,
    matchScore: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resume_variants')
        .update({
          match_score: matchScore,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', variantId)
        .maybeSingle();

      if (error) {
        console.error('Failed to update match score:', error);
        return false;
      }

      console.log(`✅ Updated match score for variant ${variantId}: ${matchScore}%`);
      return true;
    } catch (error) {
      console.error('Error updating match score:', error);
      return false;
    }
  }

  /**
   * Save suggestions for a resume variant
   */
  async saveSuggestions(
    variantId: string,
    jobId: string,
    suggestions: Omit<ResumeSuggestion, 'id' | 'variant_id' | 'job_id' | 'created_at'>[]
  ): Promise<ResumeSuggestion[]> {
    try {
      const suggestionsToInsert = suggestions.map(s => ({
        ...s,
        variant_id: variantId,
        job_id: jobId
      }));

      const { data, error } = await supabase
        .from('resume_suggestions')
        .insert(suggestionsToInsert as never)
        .select();

      if (error) {
        console.error('Failed to save suggestions:', error);
        return [];
      }

      console.log(`✅ Saved ${data.length} suggestions for variant:`, variantId);
      return data as ResumeSuggestion[];
    } catch (error) {
      console.error('Error saving suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions for a resume variant
   */
  async getSuggestions(variantId: string): Promise<ResumeSuggestion[]> {
    try {
      console.log('📥 Fetching suggestions for variant:', variantId);
      
      const { data, error } = await supabase
        .from('resume_suggestions')
        .select('*')
        .eq('variant_id', variantId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch suggestions:', error);
        return [];
      }

      console.log(`📋 Found ${data?.length || 0} suggestions for variant ${variantId}`);
      if (data && data.length > 0) {
        console.log('📋 Suggestion sections:', data.map(s => (s as unknown).section));
      }

      return data as ResumeSuggestion[];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Update suggestion acceptance status
   */
  async updateSuggestionStatus(
    suggestionId: string,
    accepted: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resume_suggestions')
        .update({
          accepted,
          applied_at: accepted ? new Date().toISOString() : null
        } as never)
        .eq('id', suggestionId);

      if (error) {
        console.error('Failed to update suggestion status:', error);
        return false;
      }

      console.log(`✅ Updated suggestion ${suggestionId}: accepted=${accepted}`);
      return true;
    } catch (error) {
      console.error('Error updating suggestion:', error);
      return false;
    }
  }

  /**
   * Get all variants for a user/session
   */
  async getUserVariants(userId?: string, sessionId?: string): Promise<ResumeVariant[]> {
    try {
      let query = supabase
        .from('resume_variants')
        .select(`
          *,
          jobs (
            title,
            company_name,
            companies (
              name,
              logo_url
            )
          )
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch user variants:', error);
        return [];
      }

      return data as ResumeVariant[];
    } catch (error) {
      console.error('Error fetching user variants:', error);
      return [];
    }
  }

  /**
   * Delete a resume variant
   */
  async deleteVariant(variantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resume_variants')
        .delete()
        .eq('id', variantId);

      if (error) {
        console.error('Failed to delete variant:', error);
        return false;
      }

      console.log('✅ Deleted variant:', variantId);
      return true;
    } catch (error) {
      console.error('Error deleting variant:', error);
      return false;
    }
  }

  /**
   * Apply accepted suggestions to variant
   */
  async applyAcceptedSuggestions(variantId: string): Promise<boolean> {
    try {
      // Get the variant and its accepted suggestions
      const { data: variant, error: variantError } = await supabase
        .from('resume_variants')
        .select('*')
        .eq('id', variantId)
        .single();

      if (variantError || !variant) {
        console.error('Failed to fetch variant:', variantError);
        return false;
      }

      const { data: suggestions, error: suggestionsError } = await supabase
        .from('resume_suggestions')
        .select('*')
        .eq('variant_id', variantId)
        .eq('accepted', true)
        .is('applied_at', null);

      if (suggestionsError) {
        console.error('Failed to fetch accepted suggestions:', suggestionsError);
        return false;
      }

      if (!suggestions || suggestions.length === 0) {
        console.log('No new accepted suggestions to apply');
        return true;
      }

      // Apply each suggestion to the tailored data
      let tailoredData = (variant as unknown).tailored_data;
      const appliedSuggestionIds: string[] = (variant as unknown).applied_suggestions || [];

      for (const suggestion of suggestions) {
        // Apply the suggestion based on its type and section
        tailoredData = this.applySuggestionToData(tailoredData, suggestion as unknown);
        appliedSuggestionIds.push((suggestion as unknown).id);

        // Mark suggestion as applied
        await supabase
          .from('resume_suggestions')
          .update({ applied_at: new Date().toISOString() } as never)
          .eq('id', (suggestion as unknown).id);
      }

      // Update the variant with new tailored data
      const { error: updateError } = await supabase
        .from('resume_variants')
        .update({
          tailored_data: tailoredData,
          applied_suggestions: appliedSuggestionIds,
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', variantId);

      if (updateError) {
        console.error('Failed to update variant with applied suggestions:', updateError);
        return false;
      }

      console.log(`✅ Applied ${suggestions.length} suggestions to variant:`, variantId);
      return true;
    } catch (error) {
      console.error('Error applying suggestions:', error);
      return false;
    }
  }

  /**
   * Helper to apply a suggestion to resume data
   */
  private applySuggestionToData(data: unknown, suggestion: ResumeSuggestion): any {
    const updatedData = { ...data };

    switch (suggestion.section) {
      case 'summary':
        updatedData.professionalSummary = suggestion.suggested_content;
        break;

      case 'experience':
        if (suggestion.target_id) {
          const [, expIndex, , bulletIndex] = suggestion.target_id.split('_');
          const expIdx = parseInt(expIndex);
          const bulIdx = parseInt(bulletIndex);
          
          if (updatedData.experience?.[expIdx]?.achievements?.[bulIdx] !== undefined) {
            updatedData.experience[expIdx].achievements[bulIdx] = suggestion.suggested_content;
          }
        }
        break;

      case 'skills':
        if (suggestion.suggestion_type === 'skill_addition') {
          // Parse the suggested content to extract skills
          const skillsToAdd = suggestion.suggested_content
            .replace('Add:', '')
            .split(',')
            .map(s => s.trim());
          
          if (!updatedData.skills) {
            updatedData.skills = {};
          }
          
          // Add to appropriate category or create new one
          const category = suggestion.target_id || 'Additional Skills';
          if (!updatedData.skills[category]) {
            updatedData.skills[category] = [];
          }
          updatedData.skills[category].push(...skillsToAdd);
        }
        break;

      case 'languages':
        if (suggestion.suggestion_type === 'language_addition') {
          if (!updatedData.languages) {
            updatedData.languages = [];
          }
          // Parse language from suggested content
          updatedData.languages.push(suggestion.suggested_content);
        }
        break;

      // Add more section handlers as needed
    }

    return updatedData;
  }
}

export const resumeVariantService = ResumeVariantService.getInstance();