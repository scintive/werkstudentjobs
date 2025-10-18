export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          domain: string | null
          logo_url: string | null
          industry: string | null
          size_category: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          headquarters: string | null
          website_url: string | null
          created_at: string
          updated_at: string
          external_id: string | null
          linkedin_url: string | null
          description: string | null
          slogan: string | null
          employee_count: number | null
          location: string | null
          founded_year: number | null
          careers_page_url: string | null
          headquarters_location: string | null
          office_locations: string[] | null
          industry_sector: string | null
          business_model: string | null
          key_products_services: string[] | null
          company_size_category: string | null
          funding_status: string | null
          notable_investors: string[] | null
          leadership_team: string[] | null
          company_values: string[] | null
          culture_highlights: string[] | null
          glassdoor_rating: number | null
        }
        Insert: {
          id?: string
          name: string
          domain?: string | null
          logo_url?: string | null
          industry?: string | null
          size_category?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          headquarters?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string | null
          logo_url?: string | null
          industry?: string | null
          size_category?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          headquarters?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          external_id: string | null
          company_id: string | null
          title: string
          description: string | null
          description_html: string | null
          description_text: string | null
          portal: string | null
          portal_link: string | null
          job_description_link: string | null
          application_link: string | null
          application_url: string | null
          werkstudent: boolean | null
          work_mode: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown' | null
          contract_type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Werkstudent' | 'Unknown' | null
          location_raw: string | null
          location_city: string | null
          location_country: string | null
          location_full: string | null
          city: string | null
          country: string | null
          is_remote: boolean | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          salary_period: 'hourly' | 'monthly' | 'yearly' | null
          content_language: 'DE' | 'EN' | 'unknown' | null
          skills: string[] | null
          tools: string[] | null
          language_required: 'DE' | 'EN' | 'BOTH' | 'UNKNOWN' | null
          description_embedding: number[] | null
          posted_at: string | null
          expires_at: string | null
          source_quality_score: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
          last_matched_at: string | null
          // GPT Pipeline Fields - maintaining existing flow
          is_werkstudent: boolean | null
          german_required: 'yes' | 'no' | 'both' | 'unknown' | null
          employment_type: string | null
          seniority_level: string | null
          salary_info: string | null
          linkedin_url: string | null
          job_function: string | null
          industries: string[] | null
          applicants_count: number | null
          user_saved: boolean | null
          user_applied: boolean | null
          user_notes: string | null
          match_score: number | null
          responsibilities: string[] | null
          nice_to_have: string[] | null
          benefits: string[] | null
          application_requirements: string[] | null
          who_we_are_looking_for: string[] | null
          tasks_responsibilities: string[] | null
          hiring_manager: string | null
          additional_insights: string[] | null
          research_confidence: string | null
          remote_allowed: boolean | null
          hybrid_allowed: boolean | null
          onsite_required: boolean | null
        }
        Insert: {
          id?: string
          company_id: string
          external_id?: string | null
          title: string
          description_html?: string | null
          description_text?: string | null
          location_city?: string | null
          location_country?: string | null
          location_full?: string | null
          work_mode?: 'remote' | 'hybrid' | 'onsite' | 'unknown'
          employment_type?: string | null
          seniority_level?: string | null
          salary_info?: string | null
          posted_at?: string | null
          application_url?: string | null
          linkedin_url?: string | null
          job_function?: string | null
          industries?: string[] | null
          applicants_count?: number | null
          is_werkstudent?: boolean
          german_required?: 'yes' | 'no' | 'both' | 'unknown'
          created_at?: string
          updated_at?: string
          user_saved?: boolean
          user_applied?: boolean
          user_notes?: string | null
          match_score?: number | null
          // Simplified English-only fields
          content_language?: 'DE' | 'EN' | 'unknown' | null
          skills?: string[] | null
          tools?: string[] | null
          responsibilities?: string[] | null
          nice_to_have?: string[] | null
          benefits?: string[] | null
          application_requirements?: string[] | null
          who_we_are_looking_for?: string[] | null
          language_required?: 'DE' | 'EN' | 'BOTH' | 'UNKNOWN' | null
          remote_allowed?: boolean | null
          hybrid_allowed?: boolean | null
          onsite_required?: boolean | null
        }
        Update: {
          id?: string
          company_id?: string
          external_id?: string | null
          title?: string
          description_html?: string | null
          description_text?: string | null
          location_city?: string | null
          location_country?: string | null
          location_full?: string | null
          work_mode?: 'remote' | 'hybrid' | 'onsite' | 'unknown'
          employment_type?: string | null
          seniority_level?: string | null
          salary_info?: string | null
          posted_at?: string | null
          application_url?: string | null
          linkedin_url?: string | null
          job_function?: string | null
          industries?: string[] | null
          applicants_count?: number | null
          is_werkstudent?: boolean
          german_required?: 'yes' | 'no' | 'both' | 'unknown'
          created_at?: string
          updated_at?: string
          user_saved?: boolean
          user_applied?: boolean
          user_notes?: string | null
          match_score?: number | null
          // Simplified English-only fields
          content_language?: 'DE' | 'EN' | 'unknown' | null
          skills?: string[] | null
          tools?: string[] | null
          responsibilities?: string[] | null
          nice_to_have?: string[] | null
          benefits?: string[] | null
          application_requirements?: string[] | null
          who_we_are_looking_for?: string[] | null
          language_required?: 'DE' | 'EN' | 'BOTH' | 'UNKNOWN' | null
          remote_allowed?: boolean | null
          hybrid_allowed?: boolean | null
          onsite_required?: boolean | null
        }
      }
      job_requirements: {
        Row: {
          id: string
          job_id: string
          requirement_type: 'must_have' | 'nice_to_have' | 'benefit'
          requirement_text: string
          requirement_english: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          requirement_type: 'must_have' | 'nice_to_have' | 'benefit'
          requirement_text: string
          requirement_english?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          requirement_type?: 'must_have' | 'nice_to_have' | 'benefit'
          requirement_text?: string
          requirement_english?: string | null
          created_at?: string
        }
      }
      job_skills: {
        Row: {
          id: string
          job_id: string
          skill_name: string
          skill_category: string | null
          importance_level: number | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          skill_name: string
          skill_category?: string | null
          importance_level?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          skill_name?: string
          skill_category?: string | null
          importance_level?: number | null
          created_at?: string
        }
      }
      user_job_interactions: {
        Row: {
          id: string
          user_profile_id: string
          job_id: string
          interaction_type: 'viewed' | 'saved' | 'apply' | 'applied' | 'rejected' | 'shared'
          interaction_data: Json | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_profile_id: string
          job_id: string
          interaction_type: 'viewed' | 'saved' | 'apply' | 'applied' | 'rejected' | 'shared'
          interaction_data?: Json | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_profile_id?: string
          job_id?: string
          interaction_type?: 'viewed' | 'saved' | 'apply' | 'applied' | 'rejected' | 'shared'
          interaction_data?: Json | null
          source?: string | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          profile_data: Json
          skills_canonical: string[] | null
          tools_canonical: string[] | null
          languages: Json | null
          city: string | null
          willing_remote: boolean | null
          willing_hybrid: boolean | null
          education_level: string | null
          years_experience: number | null
          photo_url: string | null
          onboarding_completed: boolean | null
          hours_available: number | null
          current_semester: number | null
          start_preference: string | null
          onboarding_completed_at: string | null
          university_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          profile_data: Json
          skills_canonical?: string[] | null
          tools_canonical?: string[] | null
          languages?: Json | null
          city?: string | null
          willing_remote?: boolean | null
          willing_hybrid?: boolean | null
          education_level?: string | null
          years_experience?: number | null
          photo_url?: string | null
          onboarding_completed?: boolean | null
          hours_available?: number | null
          current_semester?: number | null
          start_preference?: string | null
          onboarding_completed_at?: string | null
          university_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          profile_data?: Json
          skills_canonical?: string[] | null
          tools_canonical?: string[] | null
          languages?: Json | null
          city?: string | null
          willing_remote?: boolean | null
          willing_hybrid?: boolean | null
          education_level?: string | null
          years_experience?: number | null
          photo_url?: string | null
          onboarding_completed?: boolean | null
          hours_available?: number | null
          current_semester?: number | null
          start_preference?: string | null
          onboarding_completed_at?: string | null
          university_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resume_data: {
        Row: {
          id: string
          session_id: string | null
          user_id: string | null
          personal_info: Json
          professional_title: string
          professional_summary: string
          enable_professional_summary: boolean
          skills: Json
          experience: Json
          education: Json
          projects: Json | null
          certifications: Json | null
          custom_sections: Json | null
          last_template_used: string
          is_active: boolean
          profile_completeness: number
          created_at: string
          updated_at: string
          last_accessed_at: string
          photo_url: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          personal_info: Json
          professional_title?: string
          professional_summary?: string
          enable_professional_summary?: boolean
          skills: Json
          experience: Json
          education: Json
          projects?: Json | null
          certifications?: Json | null
          custom_sections?: Json | null
          last_template_used?: string
          is_active?: boolean
          profile_completeness?: number
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
          photo_url?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          personal_info?: Json
          professional_title?: string
          professional_summary?: string
          enable_professional_summary?: boolean
          skills?: Json
          experience?: Json
          education?: Json
          projects?: Json | null
          certifications?: Json | null
          custom_sections?: Json | null
          last_template_used?: string
          is_active?: boolean
          profile_completeness?: number
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
          photo_url?: string | null
        }
      }
      job_analysis_cache: {
        Row: {
          id: string
          job_id: string
          user_session_id: string | null
          user_email: string | null
          user_id: string | null
          analysis_type: string
          strategy_data: Json
          profile_hash: string | null
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_session_id?: string | null
          user_email?: string | null
          user_id?: string | null
          analysis_type?: string
          strategy_data: Json
          profile_hash?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_session_id?: string | null
          user_email?: string | null
          user_id?: string | null
          analysis_type?: string
          strategy_data?: Json
          profile_hash?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
      }
      job_match_results: {
        Row: {
          id: string
          user_profile_id: string
          job_id: string
          match_score: number
          skills_overlap_score: number
          tools_overlap_score: number
          language_fit_score: number
          location_fit_score: number
          skills_matched: string[] | null
          skills_missing: string[] | null
          tools_matched: string[] | null
          tools_missing: string[] | null
          language_explanation: string | null
          location_explanation: string | null
          overall_explanation: string | null
          calculation_weights: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_profile_id: string
          job_id: string
          match_score: number
          skills_overlap_score: number
          tools_overlap_score: number
          language_fit_score: number
          location_fit_score: number
          skills_matched?: string[] | null
          skills_missing?: string[] | null
          tools_matched?: string[] | null
          tools_missing?: string[] | null
          language_explanation?: string | null
          location_explanation?: string | null
          overall_explanation?: string | null
          calculation_weights?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_profile_id?: string
          job_id?: string
          match_score?: number
          skills_overlap_score?: number
          tools_overlap_score?: number
          language_fit_score?: number
          location_fit_score?: number
          skills_matched?: string[] | null
          skills_missing?: string[] | null
          tools_matched?: string[] | null
          tools_missing?: string[] | null
          language_explanation?: string | null
          location_explanation?: string | null
          overall_explanation?: string | null
          calculation_weights?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_cache: {
        Row: {
          key: string
          model: string
          messages_hash: string
          response_json: Json
          expires_at: string
          created_at: string
        }
        Insert: {
          key: string
          model: string
          messages_hash: string
          response_json: Json
          expires_at: string
          created_at?: string
        }
        Update: {
          key?: string
          model?: string
          messages_hash?: string
          response_json?: Json
          expires_at?: string
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          name: string | null
          type: 'bug' | 'feature' | 'improvement' | 'other'
          message: string
          rating: number | null
          page_url: string | null
          user_agent: string | null
          status: 'new' | 'in_progress' | 'resolved' | 'closed'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email?: string | null
          name?: string | null
          type?: 'bug' | 'feature' | 'improvement' | 'other'
          message: string
          rating?: number | null
          page_url?: string | null
          user_agent?: string | null
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string | null
          name?: string | null
          type?: 'bug' | 'feature' | 'improvement' | 'other'
          message?: string
          rating?: number | null
          page_url?: string | null
          user_agent?: string | null
          status?: 'new' | 'in_progress' | 'resolved' | 'closed'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resume_variants: {
        Row: {
          id: string
          base_resume_id: string
          job_id: string
          user_id: string | null
          session_id: string | null
          variant_name: string | null
          tailored_data: Json
          applied_suggestions: string[]
          ats_keywords: string[]
          match_score: number | null
          is_active: boolean
          template: string | null
          job_analysis: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          base_resume_id: string
          job_id: string
          user_id?: string | null
          session_id?: string | null
          variant_name?: string | null
          tailored_data: Json
          applied_suggestions?: string[]
          ats_keywords?: string[]
          match_score?: number | null
          is_active?: boolean
          template?: string | null
          job_analysis?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          base_resume_id?: string
          job_id?: string
          user_id?: string | null
          session_id?: string | null
          variant_name?: string | null
          tailored_data?: Json
          applied_suggestions?: string[]
          ats_keywords?: string[]
          match_score?: number | null
          is_active?: boolean
          template?: string | null
          job_analysis?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      resume_suggestions: {
        Row: {
          id: string
          variant_id: string
          job_id: string
          section: 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'languages' | 'custom' | 'title'
          suggestion_type: 'text' | 'bullet' | 'skill_addition' | 'skill_removal' | 'reorder' | 'language_addition' | 'skill_edit' | 'alias'
          target_id: string | null
          original_content: string
          suggested_content: string
          rationale: string
          ats_relevance: string | null
          keywords: string[] | null
          confidence: number
          impact: 'high' | 'medium' | 'low'
          accepted: boolean | null
          applied_at: string | null
          created_at: string
          diff_html: string | null
          before: string | null
          after: string | null
          resume_evidence: string | null
          job_requirement: string | null
          ats_keywords: string[] | null
          target_path: string | null
        }
        Insert: {
          id?: string
          variant_id: string
          job_id: string
          section: 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'languages' | 'custom' | 'title'
          suggestion_type: 'text' | 'bullet' | 'skill_addition' | 'skill_removal' | 'reorder' | 'language_addition' | 'skill_edit' | 'alias'
          target_id?: string | null
          original_content: string
          suggested_content: string
          rationale: string
          ats_relevance?: string | null
          keywords?: string[] | null
          confidence: number
          impact: 'high' | 'medium' | 'low'
          accepted?: boolean | null
          applied_at?: string | null
          created_at?: string
          diff_html?: string | null
          before?: string | null
          after?: string | null
          resume_evidence?: string | null
          job_requirement?: string | null
          ats_keywords?: string[] | null
          target_path?: string | null
        }
        Update: {
          id?: string
          variant_id?: string
          job_id?: string
          section?: 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'languages' | 'custom' | 'title'
          suggestion_type?: 'text' | 'bullet' | 'skill_addition' | 'skill_removal' | 'reorder' | 'language_addition' | 'skill_edit' | 'alias'
          target_id?: string | null
          original_content?: string
          suggested_content?: string
          rationale?: string
          ats_relevance?: string | null
          keywords?: string[] | null
          confidence?: number
          impact?: 'high' | 'medium' | 'low'
          accepted?: boolean | null
          applied_at?: string | null
          created_at?: string
          diff_html?: string | null
          before?: string | null
          after?: string | null
          resume_evidence?: string | null
          job_requirement?: string | null
          ats_keywords?: string[] | null
          target_path?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_share_token: {
        Args: {
          p_token: string
          p_user_id: string
          p_share_type: string
          p_resume_id?: string | null
          p_variant_id?: string | null
          p_template?: string | null
          p_expires_at?: string | null
        }
        Returns: {
          id: string
          token: string
          user_id: string
          share_type: string
          resume_id: string | null
          variant_id: string | null
          template: string | null
          expires_at: string | null
          view_count: number
          created_at: string
          updated_at: string
        }[]
      }
      increment_share_view_count: {
        Args: {
          p_token: string
        }
        Returns: void
      }
      get_shared_document: {
        Args: {
          p_token: string
        }
        Returns: {
          share_type: string
          template: string
          resume_data: Json
          variant_data: Json
          is_expired: boolean
        }[]
      }
      upsert_resume_variant: {
        Args: {
          p_base_resume_id: string
          p_job_id: string
          p_user_id: string
          p_tailored_data: Json
          p_applied_suggestions: string[]
          p_ats_keywords: string[]
          p_is_active: boolean
        }
        Returns: {
          id: string
          base_resume_id: string
          job_id: string
          user_id: string
          tailored_data: Json
          applied_suggestions: string[]
          ats_keywords: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Company = Database['public']['Tables']['companies']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobRequirement = Database['public']['Tables']['job_requirements']['Row']
export type JobSkill = Database['public']['Tables']['job_skills']['Row']
export type UserJobInteraction = Database['public']['Tables']['user_job_interactions']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type JobMatchResult = Database['public']['Tables']['job_match_results']['Row']
export type ResumeData = Database['public']['Tables']['resume_data']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type ResumeVariant = Database['public']['Tables']['resume_variants']['Row']
export type ResumeSuggestion = Database['public']['Tables']['resume_suggestions']['Row']
export type AICacheEntry = Database['public']['Tables']['ai_cache']['Row']

// Extended job type with company info and match result
export interface JobWithCompany extends Omit<Job, 'skills'> {
  company: Company
  requirements?: JobRequirement[]
  skills?: JobSkill[]
  matchResult?: JobMatchResult
  skills_canonical_flat?: string[]
  tools_canonical_flat?: string[]
}

// Type helper for Job queries with nested company data (common pattern in API routes)
// This matches the structure returned by: .select('*, companies (name, description, industry, logo_url)')
export interface JobWithCompanyNested extends Job {
  company_name?: string | null; // Legacy field, use companies.name when available
  companies: {
    name: string
    description: string | null
    industry: string | null
    logo_url: string | null
  } | null
}

// Extended user profile with match capabilities
export interface UserProfileWithMatching extends UserProfile {
  matchResults?: JobMatchResult[]
}

// Match calculation interfaces
export interface MatchCalculation {
  skillsOverlap: {
    score: number
    matched: string[]
    missing: string[]
    intersection: string[]
    union: string[]
  }
  toolsOverlap: {
    score: number
    matched: string[]
    missing: string[]
    intersection: string[]
    union: string[]
  }
  languageFit: {
    score: number
    required: string
    userHas: string[]
    explanation: string
  }
  locationFit: {
    score: number
    jobLocation: string
    userLocation: string
    remoteAllowed: boolean
    explanation: string
  }
  totalScore: number
  weights: {
    skills: number
    tools: number
    language: number
    location: number
  }
}

// Language proficiency interface
export interface LanguageSkill {
  language: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native'
}
