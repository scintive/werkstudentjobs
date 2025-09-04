/**
 * Student/Werkstudent Profile Types
 * Comprehensive types for early-career candidates
 */

export interface StudentProfile {
  // Academic Information
  degree_program: string;
  university: string;
  current_year: number;
  expected_graduation: string; // YYYY-MM
  
  // Coursework & Modules
  relevant_coursework: CourseworkModule[];
  thesis?: {
    title: string;
    description: string;
    technologies: string[];
    grade?: string;
    completion_date?: string;
  };
  
  // Projects & Competitions
  academic_projects: AcademicProject[];
  hackathons?: HackathonEntry[];
  
  // Availability & Logistics
  weekly_availability: {
    hours_min: number; // e.g., 15
    hours_max: number; // e.g., 20
    flexible: boolean;
  };
  earliest_start_date: string; // YYYY-MM-DD
  preferred_duration: {
    months_min: number;
    months_max: number;
    open_ended: boolean;
  };
  
  // Legal & Administrative
  enrollment_status: 'enrolled' | 'graduating_soon' | 'gap_year';
  immatrikulation_proof: boolean;
  visa_status?: 'eu_citizen' | 'student_visa' | 'work_permit' | 'needs_sponsorship';
  
  // Language Proficiency (CEFR)
  language_proficiencies: LanguageProficiency[];
  
  // Student Jobs & Experience
  student_jobs?: StudentJob[];
  clubs_activities?: ClubActivity[];
  
  // Location Preferences
  preferred_locations: string[];
  remote_preference: 'onsite_only' | 'hybrid_preferred' | 'remote_preferred' | 'flexible';
}

export interface CourseworkModule {
  course_name: string;
  course_code?: string;
  semester: string; // e.g., "WS 2024"
  grade?: string;
  ects_credits?: number;
  relevant_topics: string[];
  projects?: {
    name: string;
    description: string;
    metric?: string; // e.g., "95% accuracy", "10ms latency"
  }[];
}

export interface AcademicProject {
  title: string;
  course?: string;
  duration: string; // e.g., "3 months"
  description: string;
  technologies: string[];
  team_size?: number;
  role?: string;
  github_url?: string;
  metrics: ProjectMetric[];
  grade?: string;
}

export interface ProjectMetric {
  type: 'accuracy' | 'performance' | 'scale' | 'grade' | 'users' | 'efficiency' | 'other';
  value: string; // e.g., "95%", "10ms", "1000 users", "1.3 (sehr gut)"
  context?: string; // e.g., "on test dataset", "per request"
}

export interface HackathonEntry {
  event_name: string;
  date: string;
  project_title: string;
  achievement?: string; // e.g., "1st place", "Best UI Award"
  technologies: string[];
  team_size?: number;
}

export interface LanguageProficiency {
  language: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native';
  certification?: string; // e.g., "TestDaF", "IELTS"
}

export interface StudentJob {
  title: string;
  company: string;
  duration: string;
  hours_per_week: number;
  responsibilities: string[];
  achievements?: string[];
}

export interface ClubActivity {
  name: string;
  role?: string;
  duration: string;
  achievements?: string[];
}

// Werkstudent Eligibility Check
export interface WerkstudentEligibility {
  is_eligible: boolean;
  status: 'eligible' | 'needs_info' | 'not_eligible';
  checklist: {
    enrolled: boolean;
    availability_match: boolean;
    location_match: boolean;
    language_match: boolean;
    visa_ok: boolean;
    duration_match: boolean;
  };
  missing_requirements: string[];
  suggestions: string[];
}

// Enhanced Job Strategy for Students
export interface StudentJobStrategy {
  // Standard strategy fields
  job_id: string;
  user_profile_id: string;
  created_at: string;
  profile_hash: string;
  
  // New comprehensive analysis fields
  user_profile_summary?: {
    name: string;
    current_position: string;
    key_strengths: string[];
    experience_level: 'junior' | 'intermediate' | 'advanced';
  };
  
  job_task_analysis?: {
    task: string;
    compatibility_score: number;
    user_evidence: string;
    skill_gap?: string;
    certification_recommendation?: string;
    rewrite_suggestion?: string;
  }[];
  
  skills_analysis?: {
    matched_skills: {
      category: string;
      skills: string[];
      relevance: 'high' | 'medium' | 'low';
      evidence: string;
    }[];
    skill_gaps: {
      missing_skill: string;
      priority: 'high' | 'medium' | 'low';
      learning_path: string;
      time_to_learn: string;
    }[];
    skills_to_remove: string[];
    skills_to_add: string[];
  };
  
  content_suggestions?: {
    experience_rewrites: {
      original_description: string;
      suggested_rewrite: string;
      keywords_added: string[];
      impact_increase: string;
    }[];
    project_rewrites: {
      original_description: string;
      suggested_rewrite: string;
      relevance_boost: string;
    }[];
  };
  
  win_strategy?: {
    main_positioning: string;
    key_differentiators: string[];
    interview_talking_points: string[];
    application_strategy: string;
  };
  
  // Student-specific additions
  eligibility_checklist: {
    enrollment: boolean;
    availability: boolean;
    start_date: boolean;
    duration: boolean;
    language: boolean;
    location: boolean;
  };
  
  coursework_alignment: {
    course: string;
    requirement: string;
    evidence: string;
    relevance_score: number;
  }[];
  
  project_alignment: {
    project: string;
    requirement: string;
    evidence: string;
    metric?: string;
    impact_score: number;
  }[];
  
  red_flags: {
    issue: string;
    severity: 'low' | 'medium' | 'high';
    reframe_phrase: string;
  }[];
  
  interview_questions: {
    question: string;
    focus_area: string;
    preparation_tip: string;
  }[];
  
  // Standard strategy fields
  fit_summary: string[];
  must_have_gaps: {
    skill: string;
    why_matters: string;
    suggested_fix: string;
    learning_resource?: string;
  }[];
  positioning: {
    themes: string[];
    elevator_pitch: string;
  };
  ats_keywords: string[];
  talking_points: {
    point: string;
    achievement_ref: string;
    keywords: string[];
  }[];
  
  // German-specific keywords for Werkstudent
  german_keywords?: string[];
}

// Student-focused bullet rewrite
export interface StudentBulletSuggestion {
  original: string;
  type: 'coursework' | 'project' | 'student_job' | 'activity';
  proposed: string;
  metric_added?: string;
  keywords_used: string[];
  reasoning: string;
}

// Professional summary variants for students
export interface StudentSummaryVariants {
  variant_1: string; // 120-160 chars
  variant_2: string; // 120-160 chars
  keywords_included: string[];
  availability_mentioned: boolean;
  graduation_mentioned: boolean;
}