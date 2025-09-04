/**
 * Job Strategy Analysis Types
 * Compact, structured data for AI-powered job application tailoring
 */

export interface JobStrategy {
  job_id: string;
  user_profile_id: string;
  created_at: string;
  profile_hash: string; // For cache invalidation
  
  // Core strategy components
  fit_summary: string[]; // 4-6 bullets explaining why user fits
  must_have_gaps: SkillGap[]; // Critical missing skills with fixes
  positioning: {
    themes: string[]; // 3 positioning themes
    elevator_pitch: string; // 30-50 words
  };
  ats_keywords: string[]; // 10-15 ATS optimization keywords
  talking_points: TalkingPoint[]; // 4 bullets mapped to achievements
}

export interface SkillGap {
  skill: string;
  why_matters: string; // Why this skill is critical for the role
  suggested_fix: string; // How to address or frame this gap
}

export interface TalkingPoint {
  point: string; // What to emphasize in interviews/cover letter
  achievement_ref: string; // Reference to specific resume achievement
  keywords: string[]; // Related ATS keywords
}

export interface ResumePatch {
  id: string;
  section: 'summary' | 'experience' | 'skills' | 'projects' | 'custom';
  target_id: string; // ID of the specific item being patched
  old_text: string;
  proposed_text: string;
  reasoning: string; // Why this change improves ATS/fit
  used_keywords: string[];
  accepted: boolean | null; // null = pending, true = accepted, false = rejected
  created_at: string;
}

export interface ResumeVariant {
  id: string;
  base_resume_id: string;
  job_id: string;
  user_profile_id: string;
  patches: ResumePatch[];
  ats_keywords: string[]; // Combined from accepted patches
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoverLetter {
  id: string;
  job_id: string;
  user_profile_id: string;
  tone: 'confident' | 'warm' | 'direct';
  length: 'short' | 'medium' | 'long'; // 150-200, 220-300, 320-400 words
  language: 'EN' | 'DE' | 'AUTO';
  content: {
    intro: string;
    body_paragraphs: string[];
    closing: string;
    sign_off: string;
  };
  used_keywords: string[];
  created_at: string;
}

// Compact job data for AI context (token-efficient)
export interface CompactJobData {
  title: string;
  company: string;
  must_haves: string[]; // Top 8 from tasks_responsibilities + skills
  nice_to_haves: string[]; // Top 6 from nice_to_have
  work_mode: string;
  language_required: string;
  location: string;
}

// Compact profile data for AI context
export interface CompactProfileData {
  professional_title: string;
  top_achievements: Array<{
    text: string;
    impact: string; // Metric or outcome
    company?: string;
    role?: string;
  }>;
  top_skills: string[]; // Top 8 most relevant
  languages: string[];
  location?: string;
}

// Match breakdown for context
export interface MatchContext {
  matched_skills: string[]; // Top 10 matched skills
  missing_skills: string[]; // Top 10 critical missing skills
  matched_tools: string[]; // Top 10 matched tools
  missing_tools: string[]; // Top 10 missing tools
  skill_score: number; // 0-1
  tool_score: number; // 0-1
  language_score: number; // 0-1
  location_score: number; // 0-1
  overall_score: number; // 0-100
}