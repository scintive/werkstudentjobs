'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Target, FileText, Mail, ArrowLeft, Sparkles, TrendingUp,
  CheckCircle, AlertCircle, Copy, Download, Save, RotateCcw, X,
  Wand2, Zap, Crown, Diamond, Eye, Edit3, Users, Globe2,
  Award, Star, MessageCircle, Brain, Lightbulb, ChevronDown,
  ChevronUp, PenTool, Layers, Palette, Layout, Search, Filter,
  Settings, Loader2
} from 'lucide-react';

import type { JobStrategy, CoverLetter, ResumePatch } from '@/lib/types/jobStrategy';
import type { JobWithCompanyNested } from '@/lib/supabase/types';
import type { StudentProfile, StudentJobStrategy } from '@/lib/types/studentProfile';
import { ResumeDataService } from '@/lib/services/resumeDataService';
import { resumeVariantService } from '@/lib/services/resumeVariantService';
import { useSupabaseResumeContext, SupabaseResumeProvider, useSupabaseResumeActions } from '@/lib/contexts/SupabaseResumeContext';
import { EditModeProvider } from '@/lib/contexts/EditModeContext';
import { getConfig, APP_CONFIG } from '@/lib/config/app';
import { supabase } from '@/lib/supabase/client';
import EligibilityChecker from '@/components/werkstudent/EligibilityChecker';
import { AlignmentCards } from '@/components/werkstudent/AlignmentCards';
import { CompactJobAnalysis } from '@/components/job-analysis';
import BulletRewriter from '@/components/werkstudent/BulletRewriter';
import ComprehensiveStrategy from '@/components/enhanced-strategy/ComprehensiveStrategy';
import { EnhancedRichText } from '@/components/resume-editor/enhanced-rich-text';
import { PerfectStudio } from '@/components/resume-editor/PerfectStudio';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { AIAnalysisLoader } from '@/components/loading/AIAnalysisLoader';
import { ShareButtons } from '@/components/share/ShareButtons';

const canonicalizePlanKey = (value?: string | null) => {
  if (!value) return '';
  return value.toString().toLowerCase().trim()
    .replace(/\s*(&|and)\s*/g, '___')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

const humanizePlanKey = (key: string) => {
  if (!key) return 'New Category';
  return key
    .replace(/___/g, ' & ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolvePlanDisplayName = (category: any, canonical: string) => {
  const raw = typeof category?.display_name === 'string' ? category.display_name.trim() : '';
  if (!raw) return humanizePlanKey(canonical);
  if (raw.includes('_') || raw === raw.toLowerCase()) {
    return humanizePlanKey(canonical);
  }
  return raw;
};

const findSkillsForCanonical = (skillsByCategory: Record<string, any>, canonical: string, displayName: string) => {
  if (!skillsByCategory) return null;

  if (Array.isArray(skillsByCategory[canonical])) {
    return skillsByCategory[canonical];
  }

  const matchedKey = Object.keys(skillsByCategory).find((key) => {
    const normalized = canonicalizePlanKey(key);
    return normalized === canonical || normalized === canonicalizePlanKey(displayName);
  });

  if (matchedKey && Array.isArray(skillsByCategory[matchedKey])) {
    return skillsByCategory[matchedKey];
  }

  return null;
};

const planToOrganizedSkills = (plan: any, skillsByCategory: Record<string, any> = {}) => {
  if (!plan || !Array.isArray(plan.categories)) return null;

  const organized_categories: Record<string, any> = {};

  plan.categories
    .slice()
    .sort((a: any, b: any) => {
      const aPriority = typeof a?.priority === 'number' ? a.priority : 999;
      const bPriority = typeof b?.priority === 'number' ? b.priority : 999;
      return aPriority - bPriority;
    })
    .forEach((category: any) => {
      const canonical = canonicalizePlanKey(category?.canonical_key || category?.display_name);
      if (!canonical) return;

      const displayName = resolvePlanDisplayName(category, canonical);

      const existingSkills = findSkillsForCanonical(skillsByCategory, canonical, displayName);

      const resolvedSkills = Array.isArray(existingSkills)
        ? existingSkills.map((entry: any) => {
            if (!entry) return entry;
            if (typeof entry === 'string') return entry;
            if (typeof entry === 'object') return { ...entry };
            return entry;
          })
        : Array.isArray(category?.skills)
          ? category.skills
              .filter((item: any) => String(item?.status || '').toLowerCase() !== 'remove')
              .map((item: any) => {
                if (item?.proficiency) {
                  return { skill: item.name || item.skill, proficiency: item.proficiency };
                }
                return item?.name || item?.skill || item;
              })
          : [];

      const pendingAdditions = Array.isArray(category?.skills)
        ? category.skills
            .filter((item: any) => ['add', 'promote'].includes(String(item?.status || '').toLowerCase()))
            .map((item: any) => item?.name)
            .filter(Boolean)
        : [];

      organized_categories[displayName] = {
        skills: resolvedSkills,
        suggestions: pendingAdditions,
        reasoning: category?.job_alignment || category?.rationale || '',
        allowProficiency: resolvedSkills.some((entry: any) => typeof entry === 'object' && entry?.proficiency),
        meta: {
          canonicalKey: canonical,
          planSkills: Array.isArray(category?.skills) ? category.skills : [],
          displayName
        }
      };
    });

  return {
    organized_categories,
    strategy: plan.strategy,
    guiding_principles: plan.guiding_principles || []
  };
};

// Enhanced Tab configuration with visual elements
const TABS = [
  {
    id: 'strategy',
    label: 'AI Strategy',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-500',
    description: 'Smart analysis & positioning',
    requiresCompletion: false
  },
  {
    id: 'resume',
    label: 'Resume Studio',
    icon: Diamond,
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Live editing & optimization',
    requiresCompletion: true
  },
  {
    id: 'cover-letter',
    label: 'Letter Craft',
    icon: PenTool,
    gradient: 'from-green-500 to-emerald-500',
    description: 'Interactive letter builder',
    requiresCompletion: true
  },
  {
    id: 'download',
    label: 'Application Kit',
    icon: Download,
    gradient: 'from-orange-500 to-red-500',
    description: 'Download complete package',
    requiresCompletion: false
  }
] as const;

type TabId = typeof TABS[number]['id'];

function TailorApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // Single source of truth for current variant ID
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);

  useEffect(() => {
    // Parse URL parameters on client-side only
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const variantId = urlParams.get('variant_id');
      if (variantId) {
        setCurrentVariantId(variantId);
        // If we have a variant_id in URL, we're in editor mode
        setIsEditorMode(true);
      }

      // Read tab from URL
      const tabParam = urlParams.get('tab') as TabId;
      if (tabParam && ['strategy', 'resume', 'cover-letter', 'download'].includes(tabParam)) {
        setActiveTab(tabParam);
      }

      // Handle browser back/forward buttons
      const handlePopState = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as TabId;
        if (tab && ['strategy', 'resume', 'cover-letter', 'download'].includes(tab)) {
          setActiveTab(tab);
        } else {
          setActiveTab('strategy');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // Get resume data from Supabase context
  const { resumeData, isLoading: resumeLoading, resumeId } = useSupabaseResumeContext();
  const supabaseActions = useSupabaseResumeActions();

  // Debug logs removed

  const [activeTab, setActiveTab] = useState<TabId>('strategy');

  // Function to change tabs and update URL
  const handleTabChange = (newTab: TabId) => {
    setActiveTab(newTab);

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url.toString());
  };
  const [job, setJob] = useState<JobWithCompanyNested | null>(null);
  const [strategy, setStrategy] = useState<JobStrategy | null>(null);
  const [studentStrategy, setStudentStrategy] = useState<StudentJobStrategy | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null); // Store intelligent job analysis from GPT
  // Removed enhancedStrategy - not needed
  const [userProfile, setUserProfile] = useState<any>(null);
  const [patches, setPatches] = useState<any[]>([]);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [coverLetterMetadata, setCoverLetterMetadata] = useState<any>(null); // Store generation metadata
  const [coverLetterVersions, setCoverLetterVersions] = useState<any[]>([]); // Store all versions
  const [currentCoverLetterVersion, setCurrentCoverLetterVersion] = useState<number>(1); // Current version being viewed
  const [previewMode, setPreviewMode] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null); // Store variant ID from pre-analysis
  const [preAnalysisComplete, setPreAnalysisComplete] = useState(false); // Track if pre-analysis is done
  const [loading, setLoading] = useState({
    job: true,
    strategy: false,
    patches: false,
    letter: false,
    preAnalysis: false // Track pre-analysis loading
  });

  // Student info toggles
  const [includeUniversity, setIncludeUniversity] = useState(true);
  const [includeSemester, setIncludeSemester] = useState(true);
  const [includeHours, setIncludeHours] = useState(true);

  // Completion status tracking
  const [completionStatus, setCompletionStatus] = useState({
    resume: false,
    coverLetter: false
  });

  // Update completion status when variant or cover letter changes
  useEffect(() => {
    setCompletionStatus({
      resume: !!variantId, // Resume is complete if variant exists
      coverLetter: !!coverLetter // Cover letter is complete if it exists
    });
  }, [variantId, coverLetter]);

  // Load job data on mount
  useEffect(() => {
    loadJobData();
  }, [jobId]);
  
  // Set userProfile from resumeData when it loads
  useEffect(() => {
    if (resumeData && resumeData.personalInfo) {
      
      const profileForComponents = {
        id: 'latest',
        enrollment_status: 'enrolled',
        expected_graduation: '2026-01-01',
        personalInfo: resumeData.personalInfo,
        professionalTitle: resumeData.professionalTitle,
        professionalSummary: resumeData.professionalSummary,
        skills: resumeData.skills,
        experience: resumeData.experience,
        education: resumeData.education,
        projects: resumeData.projects,
        certifications: resumeData.certifications,
        customSections: resumeData.customSections
      };
      setUserProfile(profileForComponents);
    }
  }, [resumeData]);

  // Auto-load strategy when job loads
  useEffect(() => {
    if (job && !strategy) {
      loadStrategy();
    }
  }, [job]);

  // Run upfront analysis when job and resume are ready (runs analyze-with-tailoring early)
  useEffect(() => {
    if (job && resumeData && resumeId && !preAnalysisComplete && !loading.preAnalysis) {
      runUpfrontAnalysis();
    }
  }, [job, resumeData, resumeId]);

  // Load existing cover letter when variant is ready or when switching to cover-letter tab
  useEffect(() => {
    if (variantId && !coverLetter && !loading.letter && activeTab === 'cover-letter') {
      loadExistingCoverLetter();
    }
  }, [variantId, activeTab]);
  
  const loadJobData = async () => {
    try {
      setLoading(prev => ({ ...prev, job: true }));
      
      // Fetch real job data from the existing API
      const response = await fetch(`/api/jobs/details?job_id=${jobId}`);
      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);
      } else {
        // Fallback: Try to find job in the jobs list
        const listResponse = await fetch('/api/jobs/fetch?limit=100');
        if (listResponse.ok) {
          const { jobs } = await listResponse.json();
          const foundJob = jobs.find((j: any) => j.id === jobId);
          if (foundJob) {
            setJob(foundJob);
          } else {
            throw new Error('Job not found');
          }
        } else {
          throw new Error('Failed to fetch job data');
        }
      }
      
      setLoading(prev => ({ ...prev, job: false }));
    } catch (error) {
      console.error('Failed to load job:', error);
      setLoading(prev => ({ ...prev, job: false }));
      // Set a minimal job object to prevent crashes
      setJob({
        id: jobId,
        title: 'Job Position',
        companies: { name: 'Company' },
        location_city: 'Location',
        work_mode: 'Unknown',
        match_score: 0,
        skills_original: [],
      } as any);
    }
  };

  // Handler to save match score to database
  const handleMatchScoreCalculated = async (score: number) => {
    if (!variantId || !score) return;

    try {
      await resumeVariantService.updateMatchScore(variantId, score);
    } catch (error) {
      console.error('Failed to save match score:', error);
    }
  };

  const loadStrategy = async () => {
    if (!job || !resumeData) return;

    setLoading(prev => ({ ...prev, strategy: true }));

    try {
      // Get session token for authentication
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        console.warn('🔒 Strategy load blocked: user not signed in');
        setLoading(prev => ({ ...prev, strategy: false }));
        return;
      }

      // Convert resume data to profile format for strategy generation
      const profileForStrategy = {
        id: 'latest', // Use latest for student endpoints
        enrollment_status: 'enrolled', // Assume enrolled for students
        expected_graduation: '2026-01-01', // From resume data if available
        personalInfo: resumeData.personalInfo,
        professionalTitle: resumeData.professionalTitle,
        professionalSummary: resumeData.professionalSummary,
        skills: resumeData.skills,
        experience: resumeData.experience,
        education: resumeData.education,
        projects: resumeData.projects,
        certifications: resumeData.certifications,
        customSections: resumeData.customSections
      };

      // Determine if we should use student strategy API
      const isWerkstudent = job?.is_werkstudent || job?.title?.toLowerCase().includes('werkstudent');
      const hasEducation = resumeData.education && resumeData.education.length > 0;
      const hasCurrentEducation = hasEducation && resumeData.education.some((edu: any) =>
        edu.year?.includes('Expected') || edu.year?.includes('2025') || edu.year?.includes('2026')
      );
      const endpoint = (isWerkstudent || hasCurrentEducation) ? '/api/jobs/strategy-student' : '/api/jobs/strategy';

      // Keep state in sync
      setUserProfile(profileForStrategy);

      // For student endpoints we pass 'latest' and let the API resolve by session; otherwise pass the id
      const userProfileId = (endpoint.includes('student')) ? 'latest' : profileForStrategy.id;

      console.log(`🎯 STEP 3: Calling ${endpoint} for NEW strategy generation (💰 using credits)`);

      // Prepare request body based on endpoint type
      const requestBody = endpoint.includes('student')
        ? {
            job_id: jobId,
            student_profile: profileForStrategy // Pass the profile data directly
          }
        : {
            job_id: jobId,
            user_profile_id: userProfileId
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (endpoint.includes('student')) {
          setStudentStrategy(data.strategy);
        } else {
          setStrategy(data.strategy);
        }
        console.log('🎯 Strategy generated successfully');
      }
    } catch (error) {
      console.error('Strategy generation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, strategy: false }));
    }
  };

  // Run analyze-with-tailoring upfront so Resume Studio tab doesn't need to wait
  const runUpfrontAnalysis = async () => {
    if (!job || !resumeData || !resumeId) return;

    setLoading(prev => ({ ...prev, preAnalysis: true }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ Auth session missing; skipping upfront analysis');
        setPreAnalysisComplete(true);
        setLoading(prev => ({ ...prev, preAnalysis: false }));
        return;
      }

      // FIRST: Check if variant already exists in database (instant)
      console.log('🔍 UPFRONT ANALYSIS: Checking for existing variant...');
      const { data: existingVariants } = await supabase
        .from('resume_variants')
        .select('id, updated_at, job_analysis')
        .eq('job_id', job.id)
        .eq('base_resume_id', resumeId)
        .order('updated_at', { ascending: false })
        .limit(1);

      // Type assertion to help TypeScript understand the query result
      const typedVariants = existingVariants as Array<{ id: string; updated_at: string; job_analysis: any }> | null;

      let existingVariantId: string | null = null;
      if (typedVariants && typedVariants.length > 0) {
        existingVariantId = typedVariants[0].id;
        console.log('✅ UPFRONT ANALYSIS: Found existing variant, loading from database:', existingVariantId);
        setVariantId(existingVariantId);
        setCurrentVariantId(existingVariantId);

        // Load existing job analysis if available
        if (typedVariants[0].job_analysis) {
          setJobAnalysis(typedVariants[0].job_analysis);
          console.log('✅ Loaded job analysis from existing variant');
        }

        // Mark as complete immediately - no need to re-run GPT
        setPreAnalysisComplete(true);
        setLoading(prev => ({ ...prev, preAnalysis: false }));
        return; // Exit early - variant already exists!
      }

      // Only run GPT analysis if NO variant exists
      console.log('🚀 UPFRONT ANALYSIS: No existing variant, running fresh GPT analysis...');

      const analyzeResp = await fetch('/api/jobs/analyze-with-tailoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          job_id: job.id,
          base_resume_id: resumeId,
          force_refresh: false
        })
      });

      if (analyzeResp.ok) {
        const analyzeData = await analyzeResp.json();
        if (analyzeData.variant_id) {
          setVariantId(analyzeData.variant_id);
          setCurrentVariantId(analyzeData.variant_id); // Sync with parent state
          console.log('✅ UPFRONT ANALYSIS: Complete! New variant created:', analyzeData.variant_id);
        }
        // Store job analysis from GPT
        if (analyzeData.job_analysis) {
          setJobAnalysis(analyzeData.job_analysis);
          console.log('✅ Job analysis received:', analyzeData.job_analysis.overall_match_score);
        }
      }

      setPreAnalysisComplete(true);
    } catch (error) {
      console.error('❌ UPFRONT ANALYSIS: Failed', error);
      setPreAnalysisComplete(true); // Mark as complete even on error to prevent retry loops
    } finally {
      setLoading(prev => ({ ...prev, preAnalysis: false }));
    }
  };

  const loadExistingCoverLetter = async () => {
    if (!variantId) return;

    setLoading(prev => ({ ...prev, letter: true }));

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        console.warn('🔒 Cover letter load blocked: user not signed in');
        setLoading(prev => ({ ...prev, letter: false }));
        return;
      }

      // Use unified cover letter endpoint
      const endpoint = '/api/jobs/cover-letter';

      console.log(`📋 Loading existing cover letter for variant ${variantId}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: jobId,
          variant_id: variantId, // Pass variant_id for direct lookup
          user_profile_id: 'latest',
          tone: 'confident', // Default values just to satisfy API
          length: 'medium',
          strategy_context: studentStrategy || strategy,
          include_university: includeUniversity,
          include_semester: includeSemester,
          include_hours: includeHours,
          load_only: true // Only load existing, don't generate
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.cover_letter) {
        setCoverLetter(data.cover_letter);
        setCoverLetterMetadata(data.metadata || null);
        setCoverLetterVersions(data.versions || []);
        setCurrentCoverLetterVersion(data.current_version || 1);
      }
    } catch (error) {
      console.error('Failed to load cover letter:', error);
    } finally {
      setLoading(prev => ({ ...prev, letter: false }));
    }
  };

  const generateCoverLetter = async (tone: string, length: string, customInstructions?: string) => {
    setLoading(prev => ({ ...prev, letter: true }));

    try {
      // Get profile using authenticated request; block until JWT exists
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) {
        console.warn('🔒 Cover letter generation blocked: user not signed in');
        setLoading(prev => ({ ...prev, letter: false }));
        return;
      }
      const profileResponse = await fetch('/api/profile/latest', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!profileResponse.ok) {
        console.error('Failed to load profile for cover letter');
        setLoading(prev => ({ ...prev, letter: false }));
        return;
      }

      const profileData = await profileResponse.json();
      if (!profileData.success || !profileData.profile) {
        console.error('No profile found for cover letter generation');
        setLoading(prev => ({ ...prev, letter: false }));
        return;
      }

      // Use unified cover letter endpoint
      const endpoint = '/api/jobs/cover-letter';
      const userProfileId = 'latest';

      console.log(`🎯 Generating cover letter for job ${jobId}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: jobId,
          user_profile_id: userProfileId,
          tone,
          length, // Use selected length
          strategy_context: studentStrategy || strategy,
          custom_instructions: customInstructions || '',
          include_university: includeUniversity,
          include_semester: includeSemester,
          include_hours: includeHours,
          force_regenerate: true // Always regenerate when explicitly calling generate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('🎯 Cover letter API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });
        alert(`Failed to generate cover letter: ${data.error || 'Unknown error'}\n${data.details || ''}`);
        return;
      }

      if (data.success) {
        setCoverLetter(data.cover_letter);
        setCoverLetterMetadata(data.metadata || null);
        setCoverLetterVersions(data.versions || []);
        setCurrentCoverLetterVersion(data.current_version || 1);
      } else {
        console.error('Cover letter generation failed:', data);
        alert(`Cover letter generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Cover letter generation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, letter: false }));
    }
  };
  
  // Helper function to convert user profile to student profile format
  const getStudentProfile = (): Partial<StudentProfile> | null => {
    if (!userProfile) return null;
    
    // Check if this looks like a student profile
    const hasStudentIndicators = (
      userProfile.degree_program ||
      userProfile.university ||
      userProfile.current_year ||
      userProfile.expected_graduation ||
      userProfile.enrollment_status ||
      userProfile.weekly_availability
    );
    
    if (!hasStudentIndicators) return null;
    
    return {
      degree_program: userProfile.degree_program,
      university: userProfile.university,
      current_year: userProfile.current_year,
      expected_graduation: userProfile.expected_graduation,
      weekly_availability: userProfile.weekly_availability,
      earliest_start_date: userProfile.earliest_start_date,
      preferred_duration: userProfile.preferred_duration,
      enrollment_status: userProfile.enrollment_status,
      language_proficiencies: userProfile.language_proficiencies,
      academic_projects: userProfile.academic_projects,
      relevant_coursework: userProfile.relevant_coursework,
      preferred_locations: userProfile.preferred_locations,
      remote_preference: userProfile.remote_preference,
      visa_status: userProfile.visa_status
    };
  };

  // PDF Export for Cover Letters with Premium Templates
  const exportCoverLetterPDF = async (
    coverLetter: CoverLetter,
    job: JobWithCompanyNested,
    template: 'professional' | 'modern' | 'elegant' | 'minimal' = 'professional'
  ) => {
    try {
      const response = await fetch('/api/cover-letter/pdf-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter,
          userProfile,
          job,
          template
        }),
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Cover_Letter_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`; // fallback
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Cover letter PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };
  
  // Check for resume data loading or availability first
  if (resumeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Resume Data</h2>
          <p className="text-gray-600">Getting your profile ready...</p>
        </motion.div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Resume Found</h2>
          <p className="text-gray-600 mb-4">Please upload your resume first to use the AI Tailor Studio.</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Upload Resume
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading.job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-6 py-8 grid gap-6 grid-cols-1 xl:grid-cols-[420px_1fr]">
          <div className="space-y-4">
            <div className="skeleton h-8 w-48 rounded-md" />
            <div className="skeleton h-28 w-full rounded-lg" />
            <div className="skeleton h-28 w-full rounded-lg" />
            <div className="skeleton h-28 w-full rounded-lg" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-[720px] w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The requested job could not be loaded. It may have been removed or is temporarily unavailable.</p>
          <Link href="/jobs">
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Return to Jobs
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Navigation Header */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        {/* Title Section */}
        <div className="px-10 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/jobs" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight truncate mb-2">
                {job?.title}
              </h1>
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                {job?.companies?.name && (
                  <span className="font-medium text-gray-700">{job.companies.name}</span>
                )}
                {job?.city && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{job.city}</span>
                  </>
                )}
                {job?.work_mode && job.work_mode !== 'Unknown' && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="capitalize">{job.work_mode}</span>
                  </>
                )}
                {job?.posted_at && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">
                      {(() => {
                        const posted = new Date(job.posted_at);
                        const now = new Date();
                        const diffMs = now.getTime() - posted.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                        if (diffDays === 0) return 'Today';
                        if (diffDays === 1) return '1 day ago';
                        if (diffDays < 7) return `${diffDays} days ago`;
                        if (diffDays < 14) return '1 week ago';
                        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
                        if (diffDays < 60) return '1 month ago';
                        return `${Math.floor(diffDays / 30)} months ago`;
                      })()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="px-10 bg-gray-50/50">
          <div className="flex items-center gap-1 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isCompleted = tab.id === 'resume' ? completionStatus.resume :
                                  tab.id === 'cover-letter' ? completionStatus.coverLetter :
                                  false;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-6 py-3 transition-all duration-200 text-sm font-medium border-b-2',
                    isActive
                      ? 'text-gray-900 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'strategy' && (strategy || studentStrategy) && !isActive && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  )}
                  {isCompleted && (
                    <CheckCircle className={cn(
                      "w-4 h-4",
                      isActive ? "text-green-600" : "text-green-500"
                    )} />
                  )}
                  {tab.requiresCompletion && !isCompleted && (
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2",
                      isActive ? "border-gray-400" : "border-gray-300"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="w-full">
        <div className={cn(
          activeTab === 'resume' ? "" : "px-8 py-8"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'strategy' && (
                <StrategyTab
                  job={job}
                  strategy={strategy}
                  studentStrategy={studentStrategy}
                  userProfile={userProfile}
                  jobAnalysis={jobAnalysis}
                  loading={loading.strategy}
                  loadingAnalysis={loading.preAnalysis}
                  onRetryStrategy={loadStrategy}
                  handleMatchScoreCalculated={handleMatchScoreCalculated}
                />
              )}
              
              {activeTab === 'resume' && (
                <ResumeStudioTab
                  job={job}
                  strategy={strategy}
                  studentStrategy={studentStrategy}
                  userProfile={userProfile}
                  resumeData={resumeData}
                  resumeId={resumeId}
                  patches={patches}
                  onPatchesChange={setPatches}
                  loading={loading.patches}
                  isEditorMode={isEditorMode}
                  currentVariantId={currentVariantId}
                  onVariantIdChange={setCurrentVariantId}
                  preAnalysisComplete={preAnalysisComplete}
                  cachedVariantId={variantId}
                  jobAnalysis={jobAnalysis}
                  setJobAnalysis={setJobAnalysis}
                />
              )}
              
              {activeTab === 'cover-letter' && (
                <CoverLetterStudioTab
                  job={job}
                  strategy={strategy}
                  coverLetter={coverLetter}
                  coverLetterMetadata={coverLetterMetadata}
                  coverLetterVersions={coverLetterVersions}
                  currentVersion={currentCoverLetterVersion}
                  onVersionChange={setCurrentCoverLetterVersion}
                  onGenerate={generateCoverLetter}
                  onCoverLetterChange={setCoverLetter}
                  loading={loading.letter}
                  userProfile={userProfile}
                  exportPDF={exportCoverLetterPDF}
                  includeUniversity={includeUniversity}
                  setIncludeUniversity={setIncludeUniversity}
                  includeSemester={includeSemester}
                  setIncludeSemester={setIncludeSemester}
                  includeHours={includeHours}
                  setIncludeHours={setIncludeHours}
                  variantId={variantId}
                />
              )}

              {activeTab === 'download' && (
                <DownloadKitTab
                  job={job}
                  userProfile={userProfile}
                  variantId={variantId}
                  coverLetter={coverLetter}
                  completionStatus={completionStatus}
                  jobAnalysis={jobAnalysis}
                  strategy={strategy}
                  studentStrategy={studentStrategy}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Enhanced Strategy Tab with stunning visuals
function StrategyTab({
  job,
  strategy,
  studentStrategy,
  userProfile,
  jobAnalysis,
  loading,
  loadingAnalysis,
  onRetryStrategy,
  handleMatchScoreCalculated
}: {
  job: JobWithCompanyNested;
  strategy: JobStrategy | null;
  studentStrategy: StudentJobStrategy | null;
  userProfile: any;
  jobAnalysis: any;
  loading: boolean;
  loadingAnalysis: boolean;
  onRetryStrategy: () => void;
  handleMatchScoreCalculated: (score: number) => void;
}) {
  // Show loading state during analysis
  if (loading || loadingAnalysis) {
    return <AIAnalysisLoader type="strategy" />;
  }

  // Render job analysis when ready
  if (jobAnalysis) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <CompactJobAnalysis
          analysis={jobAnalysis}
          userProfile={userProfile}
          jobData={job}
        />
      </motion.div>
    );
  }
  
  if (!strategy && !studentStrategy) {
    return (
      <motion.div 
        className="text-center py-20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Strategy Analysis Failed</h3>
          <p className="text-gray-600 mb-6">
            Our AI couldn't analyze this job. This might be due to missing profile data or API issues.
          </p>
          <motion.button
            onClick={onRetryStrategy}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-5 h-5" />
            Retry Analysis
          </motion.button>
        </div>
      </motion.div>
    );
  }
  
  // Convert user profile to student profile format if applicable
  const studentProfile: Partial<StudentProfile> | null = userProfile && (
    userProfile.degree_program ||
    userProfile.university ||
    userProfile.enrollment_status
  ) ? {
    degree_program: userProfile.degree_program,
    university: userProfile.university,
    current_year: userProfile.current_year,
    expected_graduation: userProfile.expected_graduation,
    weekly_availability: userProfile.weekly_availability,
    earliest_start_date: userProfile.earliest_start_date,
    preferred_duration: userProfile.preferred_duration,
    enrollment_status: userProfile.enrollment_status,
    language_proficiencies: userProfile.language_proficiencies,
    academic_projects: userProfile.academic_projects,
    relevant_coursework: userProfile.relevant_coursework,
    preferred_locations: userProfile.preferred_locations,
    remote_preference: userProfile.remote_preference,
    visa_status: userProfile.visa_status
  } : null;
  
  const isWerkstudent = job.is_werkstudent || job.title?.toLowerCase().includes('werkstudent');
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Compact, scroll-free Strategy Snapshot */}
      {/* StrategyOnePager removed - replaced by ComprehensiveJobAnalysis above */}

      {/* Toggle for additional details */}
      <div className="flex items-center justify-center">
        <button onClick={() => setShowDetails(v => !v)} className="btn btn-secondary">
          {showDetails ? (
            <>
              <ChevronUp className="w-5 h-5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5" />
              Show more details
            </>
          )}
        </button>
      </div>

      {/* Werkstudent Eligibility Section - Collapsible */}
      {showDetails && isWerkstudent && studentProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <EligibilityChecker
            studentProfile={studentProfile}
            userProfile={userProfile}
            jobRequirements={{
              hours_per_week: (job as any).hours_per_week || '15-20',
              language_required: (job.german_required || job.language_required) ?? undefined,
              location: job.location_city ?? undefined,
              duration: (job as any).duration_months?.toString(),
              start_date: (job as any).start_date
            }}
            compact={false}
          />
        </motion.div>
      )}
      
      {/* Student Alignment Cards - Collapsible */}
      {showDetails && studentStrategy && studentProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AlignmentCards
            coursework={studentStrategy.coursework_alignment || []}
            projects={studentStrategy.project_alignment || []}
          />
        </motion.div>
      )}

      {/* Positioning Section - Collapsible */}
      {showDetails && (
      <motion.div 
        className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Your Strategic Positioning</h3>
              <p className="text-gray-600">AI-crafted narrative to maximize your appeal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Key Themes
              </h4>
              <div className="flex flex-wrap gap-3">
                {(studentStrategy?.positioning.themes || strategy?.positioning.themes || []).map((theme, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 font-medium rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {theme}
                  </motion.span>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                Elevator Pitch
              </h4>
              <motion.div 
                className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-gray-800 font-medium leading-relaxed">
                  {studentStrategy?.positioning.elevator_pitch || strategy?.positioning.elevator_pitch}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      )}
      
      {/* Enhanced Fit Summary - Collapsible */}
      {showDetails && (
      <motion.div 
        className="relative bg-gradient-to-br from-white via-green-50/50 to-emerald-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {studentStrategy ? 'Perfect Werkstudent Match' : 'Why You\'re The Right Fit'}
              </h3>
              <p className="text-gray-600">Compelling reasons that set you apart</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(studentStrategy?.fit_summary || strategy?.fit_summary || []).map((point, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mt-2 flex-shrink-0 shadow-sm" />
                <p className="text-gray-700 font-medium leading-relaxed">{point}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
      )}
      
      {/* Enhanced ATS Keywords - Collapsible */}
      {showDetails && (
      <motion.div 
        className="relative bg-gradient-to-br from-white via-purple-50/50 to-pink-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ATS Magic Keywords {studentStrategy && '(Werkstudent-Optimized)'}
              </h3>
              <p className="text-gray-600">Click any keyword to copy instantly</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {(studentStrategy?.ats_keywords || strategy?.ats_keywords || []).map((keyword, index) => (
                <motion.button
                  key={index}
                  onClick={() => navigator.clipboard.writeText(keyword)}
                  className="group px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-800 font-medium rounded-full border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {keyword}
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* German Keywords Section */}
            {studentStrategy?.german_keywords && studentStrategy.german_keywords.length > 0 && (
              <div className="pt-4 border-t border-purple-100">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-blue-500" />
                  German Werkstudent Keywords
                </h4>
                <div className="flex flex-wrap gap-3">
                  {studentStrategy.german_keywords.map((keyword, index) => (
                    <motion.button
                      key={index}
                      onClick={() => navigator.clipboard.writeText(keyword)}
                      className="group px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-800 font-medium rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="flex items-center gap-2">
                        {keyword}
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <motion.p 
            className="text-sm text-gray-500 mt-6 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Pro tip: Include these keywords naturally in your resume and cover letter for maximum ATS impact
          </motion.p>
        </div>
      </motion.div>
      )}
      
      {/* Enhanced Skill Gaps */}
      {(studentStrategy?.must_have_gaps || strategy?.must_have_gaps || []).length > 0 && (
        <motion.div 
          className="relative bg-gradient-to-br from-white via-orange-50/50 to-red-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Skills to Address</h3>
                <p className="text-gray-600">Quick fixes to strengthen your profile</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(studentStrategy?.must_have_gaps || strategy?.must_have_gaps || []).map((gap, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-orange-900 text-lg">{gap.skill}</h4>
                    <span className="text-xs text-orange-600 bg-orange-200 px-3 py-1 rounded-full font-medium">Critical</span>
                  </div>
                  <p className="text-orange-700 mb-4 leading-relaxed">{gap.why_matters}</p>
                  <div className="bg-white/80 border border-orange-200 rounded-xl p-4">
                    <p className="text-gray-800">
                      <span className="font-bold text-green-700">Quick Fix:</span> {gap.suggested_fix}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Interview Questions for Students */}
      {studentStrategy?.interview_questions && studentStrategy.interview_questions.length > 0 && (
        <motion.div 
          className="relative bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Expected Interview Questions</h3>
                <p className="text-gray-600">Be prepared for what they'll ask</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {studentStrategy.interview_questions.map((question, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <p className="text-blue-900 mb-3 font-bold text-lg">{question.question}</p>
                  <div className="space-y-2">
                    <p className="text-blue-700">
                      <span className="font-semibold">Focus Area:</span> {question.focus_area}
                    </p>
                    <p className="text-blue-700">
                      <span className="font-semibold">Preparation Tip:</span> {question.preparation_tip}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced Talking Points */}
      <motion.div 
        className="relative bg-gradient-to-br from-white via-gray-50/50 to-slate-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-br from-gray-400/20 to-slate-400/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-gray-600 to-slate-600 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Interview Talking Points</h3>
              <p className="text-gray-600">Conversation starters that showcase your strengths</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {(studentStrategy?.talking_points || strategy?.talking_points || []).map((point, index) => (
              <motion.div 
                key={index} 
                className="bg-white/80 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <p className="text-gray-900 mb-3 font-medium text-lg leading-relaxed">{point.point}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4 text-blue-500" />
                    Links to: {point.achievement_ref}
                  </span>
                  <div className="flex gap-1">
                    {point.keywords.map((kw, i) => (
                      <span key={i} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-xs font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Resume Studio Tab with unified editor approach
function ResumeStudioTab({
  job,
  strategy,
  studentStrategy,
  userProfile,
  resumeData,
  resumeId,
  patches,
  onPatchesChange,
  loading,
  isEditorMode,
  currentVariantId,
  onVariantIdChange,
  preAnalysisComplete = false, // NEW: Flag from parent if upfront analysis already ran
  cachedVariantId = null, // NEW: Variant ID from upfront analysis
  jobAnalysis,
  setJobAnalysis
}: any) {
  const [localVariantId, setLocalVariantId] = useState<string | null>(cachedVariantId);
  const [tailoredResumeData, setTailoredResumeData] = useState<any>(null);
  const [preparing, setPreparing] = useState<boolean>(!preAnalysisComplete); // Start as not preparing if already done

  // Sync cached variant ID from parent when it changes
  useEffect(() => {
    if (cachedVariantId && cachedVariantId !== localVariantId) {
      console.log('🔄 RESUME STUDIO: Syncing cached variant ID:', cachedVariantId);
      setLocalVariantId(cachedVariantId);
    }
  }, [cachedVariantId]);

  // Trigger pre-analysis ONLY if parent hasn't already done it
  useEffect(() => {
    // Skip if we already have data loaded
    if (localVariantId && tailoredResumeData) {
      console.log('✅ RESUME STUDIO: Already loaded, skipping');
      return;
    }

    const prepare = async () => {
      if (!resumeId || !job?.id) return;

      // If upfront analysis already completed, just load the variant data (INSTANT)
      if (preAnalysisComplete && cachedVariantId) {
        console.log('⚡ RESUME STUDIO: Loading cached variant instantly:', cachedVariantId);
        setPreparing(true);

        // Fetch student info from API BEFORE loading cached variant
        let studentInfoFromApi = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const profileResp = await fetch('/api/profile/latest', {
              credentials: 'include',
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (profileResp.ok) {
              const profileData = await profileResp.json();
              studentInfoFromApi = {
                hours_available: profileData.resumeData?.hours_available,
                current_semester: profileData.resumeData?.current_semester,
                university_name: profileData.resumeData?.university_name,
                start_preference: profileData.resumeData?.start_preference
              };
              console.log('👨‍🎓 TAILOR (cached): Fetched student info from API:', studentInfoFromApi);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch profile data for cached variant:', e);
        }

        try {
          // Load variant data from database
          const { data: variantRow } = await supabase
            .from('resume_variants')
            .select('tailored_data')
            .eq('id', cachedVariantId)
            .single();

          // Type assertion to help TypeScript
          const typedVariantRow = variantRow as { tailored_data: any } | null;

          if (typedVariantRow?.tailored_data) {
            const tailoredData = typedVariantRow.tailored_data;
            // Merge student info into cached variant data
            if (studentInfoFromApi) {
              Object.assign(tailoredData, studentInfoFromApi);
              console.log('👨‍🎓 TAILOR (cached): Added student info to cached variant');
            }
            setTailoredResumeData(tailoredData);
            setLocalVariantId(cachedVariantId);
            onVariantIdChange?.(cachedVariantId);
            console.log('✅ RESUME STUDIO: Loaded cached variant instantly!');
          } else {
            // Fallback to base resume if variant not found
            console.warn('⚠️ Cached variant not found, using base resume');
            const fallbackData = { ...resumeData };
            if (studentInfoFromApi) {
              Object.assign(fallbackData, studentInfoFromApi);
            }
            setTailoredResumeData(fallbackData);
            setLocalVariantId(cachedVariantId); // Still set the ID
          }
        } catch (error) {
          console.error('❌ Failed to load cached variant:', error);
          const fallbackData = { ...resumeData };
          if (studentInfoFromApi) {
            Object.assign(fallbackData, studentInfoFromApi);
          }
          setTailoredResumeData(fallbackData);
          setLocalVariantId(cachedVariantId); // Still set the ID
        }

        setPreparing(false);
        return;
      }

      // No cached variant, run full analysis
      console.log('🔄 RESUME STUDIO: No cache, running full analysis...');
      await runPreAnalysis();
    };
    prepare();
  }, [job?.id, resumeId, preAnalysisComplete, cachedVariantId]);
  
  // Pre-analysis pipeline: (1) analyze-with-tailoring → saves variant + suggestions
  // (2) load fresh tailored data and suggestions, (3) enhance skills via GPT for organized view
  const runPreAnalysis = async (variantId?: string) => {
    try {
      setPreparing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('Auth session missing; cannot run analyze-with-tailoring');
        setTailoredResumeData(resumeData);
        setPreparing(false);
        return;
      }

      // Fetch photoUrl and student info from API since the outer provider uses skipProfileApiFetch
      let photoUrlFromApi = null;
      let studentInfoFromApi = null;
      try {
        const profileResp = await fetch('/api/profile/latest', {
          credentials: 'include',
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (profileResp.ok) {
          const profileData = await profileResp.json();
          photoUrlFromApi = profileData.resumeData?.photoUrl || null;
          studentInfoFromApi = {
            hours_available: profileData.resumeData?.hours_available,
            current_semester: profileData.resumeData?.current_semester,
            university_name: profileData.resumeData?.university_name,
            start_preference: profileData.resumeData?.start_preference
          };
          console.log('📸 TAILOR: Fetched photoUrl from API:', photoUrlFromApi);
          console.log('👨‍🎓 TAILOR: Fetched student info from API:', studentInfoFromApi);
        }
      } catch (e) {
        console.warn('Failed to fetch profile data for tailor editor:', e);
      }

      // Always analyze before loading editor to ensure fresh suggestions
      const analyzeResp = await fetch('/api/jobs/analyze-with-tailoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          job_id: job.id,
          base_resume_id: resumeId,
          ...(variantId ? { variant_id: variantId } : {}),
          force_refresh: false
        }),
        credentials: 'include'
      });

      let latestPlan: any | null = null;
      let latestTailored: any = resumeData;

      if (analyzeResp.ok) {
        const payload = await analyzeResp.json();
        const planFromPayload = payload.skills_category_plan || payload.tailored_resume?.skillsCategoryPlan || null;
        latestPlan = planFromPayload;

        // Extract job analysis from payload
        if (payload.job_analysis) {
          setJobAnalysis(payload.job_analysis);
          console.log('✅ Job analysis loaded from editor:', payload.job_analysis.overall_match_score);
        }

        const tailoredResume = payload.tailored_resume || payload.analysisData?.tailored_resume || resumeData;
        if (planFromPayload) {
          tailoredResume.skillsCategoryPlan = planFromPayload;
        }

        // Add photoUrl and student info from API to tailored resume
        if (photoUrlFromApi && !tailoredResume.photoUrl) {
          tailoredResume.photoUrl = photoUrlFromApi;
          console.log('📸 TAILOR: Added photoUrl to tailored resume:', photoUrlFromApi);
        }
        if (studentInfoFromApi) {
          Object.assign(tailoredResume, studentInfoFromApi);
          console.log('👨‍🎓 TAILOR: Added student info to tailored resume:', studentInfoFromApi);
        }

        latestTailored = tailoredResume;
        setTailoredResumeData(tailoredResume);

        if (payload.variant_id) {
          setLocalVariantId(payload.variant_id);
          onVariantIdChange?.(payload.variant_id);
        }
      } else {
        // Fallback to existing variant data if API returns 304/409
        if (variantId) {
          const { data: variantRow } = await supabase
            .from('resume_variants')
            .select('*')
            .eq('id', variantId)
            .maybeSingle();
          // Type assertion to help TypeScript
          const typedVariantRow2 = variantRow as { tailored_data: any } | null;
          latestTailored = typedVariantRow2?.tailored_data || resumeData;
          latestPlan = latestTailored?.skillsCategoryPlan || null;

          // Add photoUrl and student info from API to fallback variant
          if (photoUrlFromApi && !latestTailored.photoUrl) {
            latestTailored.photoUrl = photoUrlFromApi;
            console.log('📸 TAILOR FALLBACK: Added photoUrl to variant:', photoUrlFromApi);
          }
          if (studentInfoFromApi) {
            Object.assign(latestTailored, studentInfoFromApi);
            console.log('👨‍🎓 TAILOR FALLBACK: Added student info to variant:', studentInfoFromApi);
          }

          setTailoredResumeData(latestTailored);
        } else {
          latestTailored = resumeData;
          // Add photoUrl and student info even when using base resumeData
          if (photoUrlFromApi && !latestTailored.photoUrl) {
            latestTailored = { ...latestTailored, photoUrl: photoUrlFromApi };
            console.log('📸 TAILOR NO VARIANT: Added photoUrl to base resume:', photoUrlFromApi);
          }
          if (studentInfoFromApi) {
            latestTailored = { ...latestTailored, ...studentInfoFromApi };
            console.log('👨‍🎓 TAILOR NO VARIANT: Added student info to base resume:', studentInfoFromApi);
          }
          setTailoredResumeData(latestTailored);
        }
      }

      if (latestPlan) {
        // Skills are now handled directly in EnhancedSkillsManager component
        console.log('✅ Skills plan loaded successfully');
      } else {
        // Fallback: use enhancer on tailored data if plan missing
        try {
          const enhanceResp = await fetch('/api/skills/enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userProfile: {
                ...userProfile,
                skills: latestTailored?.skills || {}
              },
              currentSkills: latestTailored?.skills || {}
            })
          });
          if (enhanceResp.ok) {
            const enhanced = await enhanceResp.json();
            if (enhanced.organized_skills && typeof enhanced.organized_skills === 'object') {
              const organized_categories: Record<string, any> = {};
              Object.entries(enhanced.organized_skills).forEach(([cat, list]) => {
                const skills = Array.isArray(list) ? list : [];
                organized_categories[cat] = {
                  skills,
                  suggestions: Array.isArray(enhanced.suggestions?.[cat]) ? enhanced.suggestions[cat] : [],
                  reasoning: enhanced.reasoning || ''
                };
              });
              // Skills are now handled directly in EnhancedSkillsManager component
              console.log('✅ Skills enhanced successfully');
            } else {
              console.log('⚠️ No enhanced skills returned');
            }
          } else {
            console.log('⚠️ Skills enhancement not available');
          }
        } catch (e) {
          console.error('Skills enhance failed:', e);
          console.log('⚠️ Skills enhancement failed');
        }
      }
    } catch (error) {
      console.error('Pre-analysis failed:', error);
      setTailoredResumeData(resumeData);
    } finally {
      setPreparing(false);
    }
  };
  

  // Gate editor until pre-analysis is done and we have data
  if (preparing || !tailoredResumeData) {
    return <AIAnalysisLoader type="resume" />;
  }

  // Simply render the unified editor

  return (
    <div>
      {localVariantId ? (
        // Unified editor with tailor mode
        <SupabaseResumeProvider 
          initialData={tailoredResumeData}
          mode="tailor"
          variantId={localVariantId}
        >
          <PerfectStudio
            mode="tailor"
            jobData={job}
            jobId={job?.id}
            baseResumeId={resumeId}
            variantId={localVariantId}
            userProfile={userProfile}
            strategy={studentStrategy || strategy}
          />
        </SupabaseResumeProvider>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600">Loading tailored resume editor...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Cover Letter Template Selector Component
function CoverLetterTemplateSelector({
  selectedTemplate,
  onChange
}: {
  selectedTemplate: string;
  onChange: (template: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const templates = [
    { id: 'professional', name: 'Professional', description: 'Corporate Excellence', color: 'bg-blue-600' },
    { id: 'modern', name: 'Modern', description: 'Clean & Contemporary', color: 'bg-purple-600' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated Style', color: 'bg-amber-600' },
    { id: 'minimal', name: 'Minimal', description: 'Simple & Clear', color: 'bg-gray-700' }
  ];

  const activeTemplate = templates.find(t => t.id === selectedTemplate) || templates[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group h-9 pl-3 pr-4 flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
      >
        <FileText className="w-4 h-4 text-gray-600" />
        <div className="text-left">
          <div className="text-xs text-gray-500 font-medium">Template</div>
          <div className="text-sm font-semibold text-gray-900 -mt-0.5">{activeTemplate.name}</div>
        </div>
        <svg
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              style={{ minWidth: '200px' }}
            >
              <div className="p-3">
                <div className="px-1 pb-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Choose Template</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Select your cover letter design</p>
                </div>

                <div className="mt-3 space-y-1">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onChange(template.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-left',
                        selectedTemplate === template.id
                          ? 'bg-gray-100 ring-2 ring-gray-900 ring-inset'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className={cn('w-3 h-3 rounded-full', template.color)} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500">{template.description}</div>
                      </div>
                      {selectedTemplate === template.id && (
                        <CheckCircle className="w-4 h-4 text-gray-900" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Revolutionary Cover Letter Studio with inline editing
function CoverLetterStudioTab({
  job,
  strategy,
  coverLetter,
  coverLetterMetadata,
  coverLetterVersions,
  currentVersion,
  onVersionChange,
  onGenerate,
  onCoverLetterChange,
  loading,
  userProfile,
  exportPDF,
  includeUniversity,
  setIncludeUniversity,
  includeSemester,
  setIncludeSemester,
  includeHours,
  setIncludeHours,
  variantId
}: {
  job: JobWithCompanyNested;
  strategy: JobStrategy | null;
  coverLetter: CoverLetter | null;
  coverLetterMetadata: any;
  coverLetterVersions: any[];
  currentVersion: number;
  onVersionChange: (version: number) => void;
  onGenerate: (tone: string, length: string, customInstructions?: string) => void;
  onCoverLetterChange: (letter: CoverLetter | null) => void;
  loading: boolean;
  userProfile: any;
  exportPDF: (letter: CoverLetter, job: JobWithCompanyNested, template?: 'professional' | 'modern' | 'elegant' | 'minimal') => void;
  includeUniversity: boolean;
  setIncludeUniversity: (value: boolean) => void;
  includeSemester: boolean;
  setIncludeSemester: (value: boolean) => void;
  includeHours: boolean;
  setIncludeHours: (value: boolean) => void;
  variantId: string | null;
}) {
  const [selectedTone, setSelectedTone] = useState<'confident' | 'warm' | 'direct'>('confident');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [editableContent, setEditableContent] = useState(coverLetter);
  const [customInstructions, setCustomInstructions] = useState('');
  const [regenerationCount, setRegenerationCount] = useState(coverLetterMetadata?.generation_count || 0);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const MAX_REGENERATIONS = 2;
  const selectedTemplate = 'professional'; // Always use professional template

  // Show AI insights automatically when cover letter exists
  const showAIInsights = !!coverLetter;

  // Update editable content when coverLetter changes
  useEffect(() => {
    if (coverLetter) {
      setEditableContent(coverLetter);
    }
  }, [coverLetter]);

  // Sync regeneration count when metadata changes (from variant loading or generation)
  useEffect(() => {
    if (coverLetterMetadata?.generation_count !== undefined) {
      setRegenerationCount(coverLetterMetadata.generation_count);
      console.log('🎯 Updated regeneration count from metadata:', coverLetterMetadata.generation_count);
    }
  }, [coverLetterMetadata]);

  // Handle version switching
  const handleVersionSwitch = (version: number) => {
    const selectedVersion = coverLetterVersions.find(v => v.version === version);
    if (selectedVersion) {
      onVersionChange(version);
      setEditableContent(selectedVersion.cover_letter);
      onCoverLetterChange(selectedVersion.cover_letter);
      console.log('🔄 Switched to version', version);
    }
  };

  // Debounced auto-save for cover letter edits
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const debouncedAutoSave = (updatedLetter: CoverLetter) => {
    setSaveStatus('unsaved');

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        // Save to database via API
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) {
          console.warn('🔒 Auto-save blocked: user not signed in');
          setSaveStatus('saved');
          return;
        }

        // Find the current version in the versions array
        const currentVersionObj = coverLetterVersions.find(v => v.version === currentVersion);
        if (!currentVersionObj) {
          console.warn('⚠️ Current version not found in versions array');
          setSaveStatus('saved');
          return;
        }

        // Update the current version with edited content
        const updatedVersions = coverLetterVersions.map(v =>
          v.version === currentVersion
            ? { ...v, cover_letter: updatedLetter }
            : v
        );

        // Save to Supabase
        const { data: variants } = await supabase
          .from('resume_variants')
          .select('id')
          .eq('job_id', job.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        // Type assertion to help TypeScript
        const typedVariants = variants as Array<{ id: string }> | null;

        if (typedVariants && typedVariants[0]) {
          const versionedData = {
            versions: updatedVersions,
            current_version: currentVersion
          };

          await (supabase.from('resume_variants') as any)
            .update({
              cover_letter_content: JSON.stringify(versionedData)
            })
            .eq('id', typedVariants[0].id);

          console.log('💾 Auto-saved cover letter edits');
          setSaveStatus('saved');
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error);
        setSaveStatus('saved'); // Reset status even on error
      }
    }, 2000); // 2 second debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const toneDescriptions = {
    confident: 'Authority and proven results',
    warm: 'Enthusiasm and personal connection',
    direct: 'Concise and professional'
  };
  
  const lengthDescriptions = {
    short: '180-200 words (concise)',
    medium: '250-270 words (balanced)',
    long: '350 words (detailed)'
  };

  // Removed auto-generation - user must click Generate button
  // useEffect(() => {
  //   if (!coverLetter && !loading) {
  //     console.log('🎯 Auto-generating cover letter on first load');
  //     onGenerate(selectedTone, selectedLength, '');
  //   }
  // }, []);

  const handleRegenerate = () => {
    if (regenerationCount >= MAX_REGENERATIONS) {
      alert(`Maximum ${MAX_REGENERATIONS} regenerations allowed`);
      return;
    }

    onGenerate(selectedTone, selectedLength, customInstructions);
    // Don't increment here - metadata from API will update it via useEffect
    setCustomInstructions(''); // Clear after use
  };

  const handleContentChange = (field: string, value: string) => {
    if (!editableContent) return;

    const updatedContent = {
      ...editableContent,
      content: {
        ...editableContent.content,
        [field]: value
      }
    };

    setEditableContent(updatedContent);
    // Trigger debounced auto-save
    debouncedAutoSave(updatedContent);
    // Also update parent state immediately for UI
    onCoverLetterChange(updatedContent);
  };

  const handleBodyParagraphChange = (index: number, value: string) => {
    if (!editableContent) return;

    const newParagraphs = [...editableContent.content.body_paragraphs];
    newParagraphs[index] = value;

    const updatedContent = {
      ...editableContent,
      content: {
        ...editableContent.content,
        body_paragraphs: newParagraphs
      }
    };

    setEditableContent(updatedContent);
    // Trigger debounced auto-save
    debouncedAutoSave(updatedContent);
    // Also update parent state immediately for UI
    onCoverLetterChange(updatedContent);
  };

  const copyToClipboard = () => {
    if (!editableContent) return;

    const fullText = `${editableContent.content.subject}\n\n${editableContent.content.salutation},\n\n${editableContent.content.intro}\n\n${editableContent.content.body_paragraphs.join('\n\n')}\n\n${editableContent.content.closing}\n\n${editableContent.content.sign_off}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!editableContent) return;
    setIsExporting(true);
    try {
      await exportPDF(editableContent, job, selectedTemplate);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* AI Insights Panel - Top Banner */}
      {showAIInsights && strategy && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">AI Analysis</h3>
            </div>

            {/* Matched Data - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Skills ({strategy.matchCalculation?.skillsOverlap?.matched?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(strategy.matchCalculation?.skillsOverlap?.matched || []).slice(0, 6).map((skill: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  Tools ({strategy.matchCalculation?.toolsOverlap?.matched?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(strategy.matchCalculation?.toolsOverlap?.matched || []).slice(0, 6).map((tool: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Top Task
                </h4>
                {(strategy.tasks || [])
                  .sort((a: any, b: any) => (b.alignment_score || 0) - (a.alignment_score || 0))
                  .slice(0, 1)
                  .map((task: any, i: number) => (
                    <div key={i}>
                      <div className="text-xs font-medium text-blue-600 mb-1">
                        {Math.round((task.alignment_score || 0) * 100)}% match
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{task.task_description || task.task}</p>
                    </div>
                  ))}
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-xs font-medium text-green-900 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Why It Works
                </h4>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{strategy.matchCalculation?.skillsOverlap?.matched?.length || 0}</strong> exact matches</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>{strategy.competitive_advantages?.length || 0}</strong> advantages</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Controls Panel */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Letter Options</h3>
            </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Writing Tone</label>
                  <div className="space-y-2">
                    {Object.entries(toneDescriptions).map(([tone, desc]) => (
                      <label
                        key={tone}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="tone"
                          value={tone}
                          checked={selectedTone === tone}
                          onChange={(e) => setSelectedTone(e.target.value as any)}
                          className="w-3.5 h-3.5 text-blue-600"
                        />
                        <div className={`flex-1 p-2 rounded-lg border transition-all duration-200 ${
                          selectedTone === tone
                            ? 'border-blue-500 bg-blue-50/50'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}>
                          <div className="text-sm font-medium text-gray-900 capitalize">{tone}</div>
                          <div className="text-xs text-gray-500">{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Length</label>
                  <div className="space-y-2">
                    {Object.entries(lengthDescriptions).map(([length, desc]) => (
                      <label
                        key={length}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="length"
                          value={length}
                          checked={selectedLength === length}
                          onChange={(e) => setSelectedLength(e.target.value as any)}
                          className="w-3.5 h-3.5 text-emerald-600"
                        />
                        <div className={`flex-1 p-2 rounded-lg border transition-all duration-200 ${
                          selectedLength === length
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}>
                          <div className="text-sm font-medium text-gray-900 capitalize">{length}</div>
                          <div className="text-xs text-gray-500">{desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Student Info Toggles */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">Student Details</span>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={includeUniversity}
                        onChange={(e) => setIncludeUniversity(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 mb-0.5">University & Degree</div>
                        {userProfile?.education?.[0] && (
                          <div className="text-xs text-gray-500 leading-relaxed">
                            {userProfile.education[0].degree} in {userProfile.education[0].field_of_study}
                            {userProfile.education[0].institution && (
                              <> • {userProfile.education[0].institution}</>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={includeSemester}
                        onChange={(e) => setIncludeSemester(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 mb-0.5">Semester Info</div>
                        {userProfile?.education?.[0]?.year && (
                          <div className="text-xs text-gray-500">
                            Expected Graduation: {userProfile.education[0].year}
                          </div>
                        )}
                      </div>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={includeHours}
                        onChange={(e) => setIncludeHours(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 mb-0.5">Weekly Hours</div>
                        {(userProfile?.weekly_availability || userProfile?.hours_available) ? (
                          <div className="text-xs text-gray-500">
                            {userProfile.weekly_availability ? (
                              <>
                                {userProfile.weekly_availability.hours_min}-{userProfile.weekly_availability.hours_max} hours/week
                                {userProfile.weekly_availability.flexible && <> • Flexible</>}
                              </>
                            ) : (
                              <>{userProfile.hours_available} hours/week</>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">Set hours in Settings</div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Version Selector */}
                {coverLetterVersions.length > 1 && (
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Version History
                      </label>
                      <span className="text-xs text-gray-500">
                        {coverLetterVersions.length} versions
                      </span>
                    </div>
                    <select
                      value={currentVersion}
                      onChange={(e) => handleVersionSwitch(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {coverLetterVersions
                        .slice()
                        .sort((a, b) => b.version - a.version)
                        .map((v) => (
                          <option key={v.version} value={v.version}>
                            Version {v.version} - {v.tone || 'confident'} / {v.length || 'medium'} ({new Date(v.generated_at).toLocaleDateString()})
                          </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1.5 text-xs">
                      {saveStatus === 'saved' && (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Saved
                        </span>
                      )}
                      {saveStatus === 'saving' && (
                        <span className="text-blue-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving...
                        </span>
                      )}
                      {saveStatus === 'unsaved' && (
                        <span className="text-gray-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Unsaved changes
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Instructions Field */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <label className="text-xs font-medium text-gray-600">
                    Custom Instructions
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="E.g., 'Emphasize Python skills'"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    disabled={regenerationCount >= MAX_REGENERATIONS || loading}
                  />
                  <p className="text-xs text-gray-500">
                    {MAX_REGENERATIONS - regenerationCount} regenerations left
                  </p>
                </div>
              </div>

              <button
                onClick={handleRegenerate}
                disabled={loading || regenerationCount >= MAX_REGENERATIONS}
                className={cn(
                  "w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                  regenerationCount >= MAX_REGENERATIONS
                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                )}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : regenerationCount >= MAX_REGENERATIONS ? (
                  <span>Max regenerations reached</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {coverLetter ? 'Regenerate' : 'Generate Letter'}
                  </>
                )}
              </button>
          </div>

        </motion.div>

        {/* Interactive Preview/Editor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative bg-gradient-to-br from-white via-slate-50/50 to-gray-50/30 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
            
            <div className="relative">
              {/* Elegant Header Bar */}
              <div className="bg-white border-b border-gray-200">
                <div className="px-6 h-16 flex items-center justify-between">
                  {/* Left: Auto-save indicator */}
                  <div className="flex items-center gap-2.5 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium">Auto-saved</span>
                  </div>

                  {/* Right: Actions */}
                  {coverLetter && (
                    <div className="flex items-center gap-3">
                      {/* Copy Text Button */}
                      <button
                        onClick={copyToClipboard}
                        className="h-9 px-3 flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150 border border-transparent hover:border-gray-200"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm font-medium">Copy Text</span>
                          </>
                        )}
                      </button>

                      <div className="h-6 w-px bg-gray-300" />

                      {/* Share Buttons */}
                      <ShareButtons
                        shareType="cover_letter"
                        variantId={variantId || undefined}
                        template={selectedTemplate}
                      />

                      <div className="h-6 w-px bg-gray-300" />

                      {/* Export PDF Button */}
                      <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className={cn(
                          'h-9 px-4 flex items-center gap-2 rounded-lg font-medium transition-all duration-200',
                          isExporting
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 hover:bg-gray-800 text-white shadow-sm hover:shadow-md'
                        )}
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Exporting...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="text-sm">Export PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 min-h-[600px] max-h-[800px] overflow-y-auto">
                {coverLetter && editableContent && editableContent.content ? (
                  <div className="w-full">
                    {/* Letter Header */}
                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">
                        {userProfile?.personal_details?.name || userProfile?.personalInfo?.name || userProfile?.name || 'Your Name'}
                      </h4>
                      <p className="text-gray-600">
                        {userProfile?.personal_details?.email || userProfile?.personalInfo?.email || userProfile?.email || 'your.email@example.com'}
                        {(userProfile?.personal_details?.phone || userProfile?.personalInfo?.phone || userProfile?.phone) &&
                          ` | ${userProfile?.personal_details?.phone || userProfile?.personalInfo?.phone || userProfile?.phone}`
                        }
                      </p>
                      <p className="text-gray-600">{userProfile?.personal_details?.location || userProfile?.personalInfo?.location || userProfile?.location || 'Germany'}</p>
                      <div className="mt-4 text-right text-gray-600">
                        {new Date().toLocaleDateString('de-DE')}
                      </div>
                    </div>

                    {/* Recipient */}
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900">
                        {job.companies?.name || job.company_name || 'Hiring Manager'}
                      </h4>
                      {job.location_city && (
                        <p className="text-gray-600">{job.location_city}</p>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="mb-4">
                      <EnhancedRichText
                        value={editableContent.content.subject || `Application for ${job.title}`}
                        onChange={(value) => handleContentChange('subject', value)}
                        className="text-gray-900 border-0 hover:bg-gray-50/50 rounded-lg p-2 -m-2"
                        placeholder="Subject line..."
                      />
                    </div>

                    {/* Letter Content - Seamless Notion-style Editing */}
                    <div className="space-y-1">
                      {/* Salutation */}
                      <EnhancedRichText
                        value={editableContent.content.salutation || 'Dear Hiring Team'}
                        onChange={(value) => handleContentChange('salutation', value)}
                        className="text-gray-800 border-0 hover:bg-gray-50/50 rounded-lg p-2 -m-2"
                        placeholder="Salutation..."
                      />

                      {/* Intro */}
                      <EnhancedRichText
                        value={editableContent.content.intro}
                        onChange={(value) => handleContentChange('intro', value)}
                        className="text-gray-800 leading-relaxed font-medium border-0 hover:bg-gray-50/50 rounded-lg p-2 -m-2"
                        multiline={true}
                        placeholder="Click to write introduction..."
                      />

                      {/* Body Paragraphs */}
                      {editableContent.content.body_paragraphs.map((paragraph, index) => (
                        <EnhancedRichText
                          key={index}
                          value={paragraph}
                          onChange={(value) => handleBodyParagraphChange(index, value)}
                          className="text-gray-800 leading-relaxed border-0 hover:bg-gray-50/50 rounded-lg p-2 -m-2"
                          multiline={true}
                          placeholder={`Click to write paragraph ${index + 1}...`}
                        />
                      ))}

                      {/* Closing */}
                      <EnhancedRichText
                        value={editableContent.content.closing}
                        onChange={(value) => handleContentChange('closing', value)}
                        className="text-gray-800 leading-relaxed font-medium border-0 hover:bg-gray-50/50 rounded-lg p-2 -m-2"
                        multiline={true}
                        placeholder="Click to write closing..."
                      />

                      {/* Sign-off */}
                      <div className="pt-4">
                        <EnhancedRichText
                          value={editableContent.content.sign_off}
                          onChange={(value) => handleContentChange('sign_off', value)}
                          className="text-gray-800 border-0 hover:bg-gray-50/50 rounded-lg p-2 -m-2"
                          placeholder="Click to add sign-off..."
                        />
                        {/* User name after sign-off */}
                        <div className="mt-1 text-gray-800">
                          {userProfile?.personalInfo?.name || userProfile?.personal_details?.name || userProfile?.name || 'Your Name'}
                        </div>
                      </div>
                    </div>

                    {/* Keywords Used */}
                    {editableContent.used_keywords.length > 0 && (
                      <motion.div 
                        className="mt-8 pt-6 border-t border-gray-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          Keywords Included
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {editableContent.used_keywords.map((keyword, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.7 + index * 0.05 }}
                              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-lg font-medium border border-green-200"
                            >
                              {keyword}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    className="text-center py-20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-12 h-12 text-gray-500" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      Ready to Craft Your Letter?
                    </h4>
                    <p className="text-gray-600 text-lg">
                      Choose your tone and length, then generate your personalized cover letter
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Wrapper component with RequireAuth, SupabaseResumeProvider and EditModeProvider
// Download Kit Tab Component
function DownloadKitTab({
  job,
  userProfile,
  variantId,
  coverLetter,
  completionStatus,
  jobAnalysis,
  strategy,
  studentStrategy
}: {
  job: JobWithCompanyNested | null;
  userProfile: any;
  variantId: string | null;
  coverLetter: CoverLetter | null;
  completionStatus: { resume: boolean; coverLetter: boolean };
  jobAnalysis: any;
  strategy: JobStrategy | null;
  studentStrategy: StudentJobStrategy | null;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  // Helper to generate file name
  const generateFileName = (type: 'resume' | 'coverletter' | 'analysis') => {
    if (!userProfile || !job) return `document_${type}.pdf`;

    const userName = (userProfile.personalInfo?.name || userProfile.name || 'User')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    const companyName = (job.companies?.name || job.company_name || 'Company')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    let jobTitle = (job.title || 'Position')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');

    // Shorten job title if too long
    if (jobTitle.length > 30) {
      jobTitle = jobTitle.substring(0, 27) + '...';
    }

    switch (type) {
      case 'resume':
        return `${userName}_${companyName}_Resume.pdf`;
      case 'coverletter':
        return `${userName}_${companyName}_CoverLetter.pdf`;
      case 'analysis':
        return `${userName}_${jobTitle}_${companyName}.pdf`;
      default:
        return `${userName}_${companyName}_Document.pdf`;
    }
  };

  const downloadResumePDF = async () => {
    if (!variantId) {
      alert('Resume variant not found. Please save your resume first by making changes in the Resume Studio tab.');
      return null;
    }

    try {
      // Get auth token
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        alert('Authentication required. Please refresh the page and try again.');
        return null;
      }

      const response = await fetch(`/api/resume/pdf-download?variant_id=${variantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('Resume not found. Please save your changes in the Resume Studio tab first.');
          return null;
        }
        throw new Error('Failed to download resume');
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = generateFileName('resume'); // fallback
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      return { blob, filename };
    } catch (error) {
      console.error('Error downloading resume:', error);
      // Don't throw if we already returned null from 404 handling
      if (error instanceof Error && error.message !== 'Failed to download resume') {
        return null;
      }
      throw error;
    }
  };

  const downloadCoverLetterPDF = async () => {
    if (!coverLetter) {
      alert('Cover letter not found. Please create your cover letter first.');
      return null;
    }

    try {
      const response = await fetch('/api/cover-letter/pdf-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter,
          job,
          userProfile
        })
      });

      if (!response.ok) throw new Error('Failed to download cover letter');

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = generateFileName('coverletter'); // fallback
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      return { blob, filename };
    } catch (error) {
      console.error('Error downloading cover letter:', error);
      throw error;
    }
  };

  const downloadAnalysisPDF = async () => {
    // TODO: Implement job analysis PDF generation
    // For now, return a simple PDF with analysis text
    return null;
  };

  const downloadApplicationKit = async () => {
    if (!completionStatus.resume || !completionStatus.coverLetter) {
      alert('Please complete both your resume and cover letter before downloading the application kit.');
      return;
    }

    try {
      setDownloading(true);
      setDownloadProgress('Preparing resume...');

      const resumeData = await downloadResumePDF();
      if (!resumeData) return;

      setDownloadProgress('Preparing cover letter...');
      const coverLetterData = await downloadCoverLetterPDF();
      if (!coverLetterData) return;

      setDownloadProgress('Creating application kit...');

      // Use JSZip to create a zip file
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      zip.file(resumeData.filename, resumeData.blob);
      zip.file(coverLetterData.filename, coverLetterData.blob);

      setDownloadProgress('Finalizing download...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateFileName('analysis').replace('.pdf', '_ApplicationKit.zip');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress('Complete!');
      setTimeout(() => setDownloadProgress(''), 2000);
    } catch (error) {
      console.error('Error creating application kit:', error);
      alert('Failed to create application kit. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadIndividualFile = async (type: 'resume' | 'coverletter') => {
    try {
      setDownloading(true);
      setDownloadProgress(`Downloading ${type}...`);

      let fileData;
      if (type === 'resume') {
        fileData = await downloadResumePDF();
      } else {
        fileData = await downloadCoverLetterPDF();
      }

      if (!fileData) return;

      const url = URL.createObjectURL(fileData.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress('Complete!');
      setTimeout(() => setDownloadProgress(''), 2000);
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
      alert(`Failed to download ${type}. Please try again.`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Kit</h2>
        <p className="text-gray-600">
          Download your complete application package or individual documents
        </p>
      </div>

      {/* Completion Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Diamond className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Tailored Resume</span>
            </div>
            {completionStatus.resume ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Not Started</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <PenTool className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Cover Letter</span>
            </div>
            {completionStatus.coverLetter ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Not Started</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Complete Kit */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200 p-8 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-orange-500 text-white p-3 rounded-lg">
            <Download className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Complete Application Kit
            </h3>
            <p className="text-gray-600 mb-4">
              Download all your application documents in a single ZIP file, ready to submit.
            </p>
            {!completionStatus.resume || !completionStatus.coverLetter ? (
              <div className="bg-white border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Action Required:</strong> Please complete both your resume and cover letter before downloading the application kit.
                </p>
              </div>
            ) : null}
            <button
              onClick={downloadApplicationKit}
              disabled={downloading || !completionStatus.resume || !completionStatus.coverLetter}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2',
                downloading || !completionStatus.resume || !completionStatus.coverLetter
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl'
              )}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {downloadProgress || 'Preparing...'}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Application Kit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Individual Downloads */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Diamond className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Resume</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your tailored resume optimized for this position
            </p>
            <button
              onClick={() => downloadIndividualFile('resume')}
              disabled={downloading || !completionStatus.resume}
              className={cn(
                'w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                downloading || !completionStatus.resume
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              )}
            >
              <Download className="w-4 h-4" />
              Download Resume
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <PenTool className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Cover Letter</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your personalized cover letter for this application
            </p>
            <button
              onClick={() => downloadIndividualFile('coverletter')}
              disabled={downloading || !completionStatus.coverLetter}
              className={cn(
                'w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                downloading || !completionStatus.coverLetter
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              )}
            >
              <Download className="w-4 h-4" />
              Download Cover Letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TailorApplicationPageWrapper() {
  return (
    <RequireAuth>
      {/* Avoid hitting /api/profile/latest repeatedly on Tailor page */}
      <SupabaseResumeProvider autoSaveInterval={2000} skipProfileApiFetch>
        <EditModeProvider>
          <TailorApplicationPage />
        </EditModeProvider>
      </SupabaseResumeProvider>
    </RequireAuth>
  );
}

function SaveVariantButton({ variantId }: { variantId: string }) {
  const { resumeData: editorData } = useSupabaseResumeContext();
  const prevRef = React.useRef<string>('');
  // Lightweight autosave loop for variant only
  React.useEffect(() => {
    const tick = async () => {
      try {
        const json = JSON.stringify(editorData);
        if (json !== prevRef.current) {
          const { resumeVariantService } = await import('@/lib/services/resumeVariantService');
          await resumeVariantService.updateVariant(variantId, editorData);
          prevRef.current = json;
        }
      } catch (e) {
        // Log once per failure path only
        console.warn('Variant autosave failed (non-blocking).');
      }
    };
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [variantId, editorData]);

  return (
    <div className="flex items-center justify-end pb-2">
      <button
        onClick={async () => {
          try {
            const { resumeVariantService } = await import('@/lib/services/resumeVariantService');
            await resumeVariantService.updateVariant(variantId, editorData);
          } catch (e) {
            console.error('Failed to save tailored variant:', e);
            alert('Failed to save tailored variant');
          }
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        title="Save changes to tailored variant (does not modify your baseline resume)"
      >
        Save Tailored Variant
      </button>
    </div>
  );
}
