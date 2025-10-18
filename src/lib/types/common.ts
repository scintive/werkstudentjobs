/**
 * Common type utilities to replace 'any' types throughout the codebase
 */

import type { Json, Database } from '../supabase/types';

// Generic object types
export type UnknownRecord = Record<string, unknown>;
export type StringRecord = Record<string, string>;
export type AnyRecord = Record<string, Json>;

// API Response types
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string | null;
  success?: boolean;
}

export interface APIError {
  message: string;
  code?: string;
  status?: number;
}

// Resume Data types (from JSON fields)
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photoUrl?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  gpa?: string;
  bullets?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  technologies?: string[];
  link?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  expiryDate?: string;
  credentialId?: string;
  link?: string;
}

export interface SkillsData {
  technical?: string[];
  tools?: string[];
  soft_skills?: string[];
  languages?: Array<{
    language: string;
    level: string;
  }>;
  [key: string]: string[] | Array<{ language: string; level: string }> | undefined;
}

export interface ResumeDataStructure {
  personalInfo: PersonalInfo;
  professionalTitle: string;
  professionalSummary: string;
  enableProfessionalSummary?: boolean;
  skills: SkillsData;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  customSections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

// LLM/GPT types
export interface GPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GPTResponse<T = unknown> {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  parsed?: T;
}

export interface GPTStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
  }>;
}

// Job Analysis types
export interface JobAnalysisResult {
  jobId: string;
  analysis: {
    responsibilities?: string[];
    requirements?: string[];
    niceToHave?: string[];
    benefits?: string[];
    skills?: string[];
    tools?: string[];
    keywords?: string[];
  };
  matchScore?: number;
  suggestions?: string[];
}

export interface TailoringSuggestion {
  id: string;
  section: string;
  type: 'text' | 'bullet' | 'skill_addition' | 'skill_removal' | 'reorder';
  originalContent: string;
  suggestedContent: string;
  rationale: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  targetId?: string;
  targetPath?: string;
}

// Strategy types
export interface StrategyTask {
  id: string;
  title: string;
  description: string;
  alignment: string;
  progress: number;
  type: 'skill' | 'project' | 'experience' | 'certification';
}

export interface EvidenceBlock {
  type: 'experience' | 'project' | 'certification';
  title: string;
  items: string[];
}

// Matching types
export interface MatchCalculationOverlap {
  score: number;
  matched: string[];
  missing: string[];
  intersection: string[];
  union: string[];
}

export interface MatchCalculationFit {
  score: number;
  explanation: string;
}

export interface LanguageFit extends MatchCalculationFit {
  required: string;
  userHas: string[];
}

export interface LocationFit extends MatchCalculationFit {
  jobLocation: string;
  userLocation: string;
  remoteAllowed: boolean;
}

// Form/Input types
export type FormValue = string | number | boolean | null | undefined;
export type FormValues = Record<string, FormValue>;
export type FormErrors = Record<string, string | undefined>;

// Event handler types
export type ChangeHandler = (value: FormValue) => void;
export type SubmitHandler = (event: React.FormEvent) => void | Promise<void>;
export type ClickHandler = (event: React.MouseEvent) => void | Promise<void>;

// Component prop types
export interface WithClassName {
  className?: string;
}

export interface WithChildren {
  children?: React.ReactNode;
}

export interface WithId {
  id: string;
}

// Supabase query result types
export type SupabaseResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type SupabaseArrayResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
};

// PDF/Template types
export interface TemplateData {
  personalInfo: PersonalInfo;
  professionalTitle?: string;
  professionalSummary?: string;
  skills: SkillsData;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  customSections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybePromise<T> = T | Promise<T>;

// Company research types
export interface CompanyResearch {
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  culture?: string[];
  values?: string[];
  products?: string[];
  recentNews?: string[];
}

// Cache types
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  expiresAt: number | string;
  createdAt: number | string;
}

// Skill categorization types
export interface SkillCategory {
  name: string;
  key: string;
  skills: string[];
  isCustom?: boolean;
}

// Export common Database table types
export type JobRow = Database['public']['Tables']['jobs']['Row'];
export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type ResumeDataRow = Database['public']['Tables']['resume_data']['Row'];
export type ResumeVariantRow = Database['public']['Tables']['resume_variants']['Row'];
export type ResumeSuggestionRow = Database['public']['Tables']['resume_suggestions']['Row'];
export type JobMatchResultRow = Database['public']['Tables']['job_match_results']['Row'];

// Job with company joined
export interface JobWithCompany extends JobRow {
  companies?: CompanyRow | null;
  company?: CompanyRow | null;
}

// Analysis cache
export interface AnalysisCacheData {
  analysis: JobAnalysisResult;
  suggestions?: TailoringSuggestion[];
  strategy?: {
    tasks: StrategyTask[];
    evidence: EvidenceBlock[];
  };
}
