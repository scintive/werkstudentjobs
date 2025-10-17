// Type definitions for the visual web application

export interface PersonalDetails {
  name: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    linkedin?: string;
  };
}

export interface Education {
  degree: string;
  field_of_study: string;
  institution: string;
  duration: string;
  location: string;
}

export interface Certification {
  title: string;
  institution: string;
  date: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  responsibilities: string[];
}

export interface Skills {
  technology: string[];
  soft_skills: string[];
  design: string[];
  [key: string]: string[]; // Allow dynamic skill categories
}

export interface Language {
  language: string;
  proficiency: string;
}

export interface Project {
  title: string;
  description: string;
}

export interface UserProfile {
  personal_details: PersonalDetails;
  professional_title?: string;  // AI-generated professional title
  professional_summary?: string; // AI-generated professional summary
  education: Education[];
  certifications: Certification[];
  experience: Experience[];
  skills: Skills;
  languages: Language[];
  projects: Project[];
  _review?: {
    critique: string[];
    improvement_plan: string[];
  };
  _base_resume?: ResumeData;
}

export interface ExtractedJob {
  job_description_link: string | null;
  portal_link: string | null;
  date_posted: string | null;
  company_name: string | null;
  german_required: "DE" | "EN" | "both" | "unknown";
  werkstudent: boolean | null;
  work_mode: "Remote" | "Onsite" | "Hybrid" | "Unknown";
  location_city: string | null;
  location_country: string | null;
  hiring_manager: string | null;
  tasks_responsibilities: {
    original: string[] | null;
    english: string[] | null;
  };
  nice_to_have: {
    original: string[] | null;
    english: string[] | null;
  };
  benefits: {
    original: string[] | null;
    english: string[] | null;
  };
  named_skills_tools: string[];
  important_statements: string[];
}

export interface JobData {
  raw: Record<string, unknown>;
  extracted: ExtractedJob;
}

export interface AnalysisResult {
  fit_summary: string[];
  cover_letter_markdown: string;
  resume_markdown: string;
  tailored_resume_data: ResumeData | null;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
    customHeader?: string;
  };
  photoUrl?: string;
  professionalTitle: string;
  professionalSummary: string;
  enableProfessionalSummary: boolean;
  skills: {
    // New universal categories
    core?: string[];                    // Core Skills / Professional Skills
    technical?: string[];               // Technical & Digital Skills
    creative?: string[];                // Creative & Design Skills
    business?: string[];                // Business & Strategy Skills
    interpersonal?: string[];          // Interpersonal & Communication Skills
    languages?: string[];               // Languages
    specialized?: string[];             // Other / Specialized Skills
    
    // Legacy categories for backward compatibility
    tools?: string[];                   // Will be merged into technical
    soft_skills?: string[];            // Will be merged into interpersonal
  };
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    field_of_study: string;
    institution: string;
    year: string;
  }>;
  languages?: Array<{
    name: string;
    level: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    date?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  customSections?: Array<{
    id: string;
    title: string;
    type: 'list' | 'text' | 'achievements';
    items: Array<{
      title?: string;
      subtitle?: string;
      date?: string;
      description?: string;
      details?: string[];
    }>;
  }>;
  skillsCategoryPlan?: {
    categories: Array<{ key: string; name: string; skills: string[] }>;
  };
}

export interface TemplateConfig {
  name: string;
  description: string;
  font_family: string;
  color_scheme: string;
  layout: string;
  professional_level: string;
}

export interface AppStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

// UI Component Props
export interface StepIndicatorProps {
  steps: AppStep[];
  currentStep: string;
}

export interface FileUploadProps {
  onFileUpload: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  isUploading?: boolean;
}

export interface ResumeEditorProps {
  resumeData: ResumeData;
  template: string;
  onDataChange: (data: ResumeData) => void;
  onTemplateChange: (template: string) => void;
}

export interface JobCardProps {
  job: JobData;
  isSelected: boolean;
  onSelect: (job: JobData) => void;
}

export interface JobAnalysisProps {
  job: JobData;
  profile: UserProfile;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
}
