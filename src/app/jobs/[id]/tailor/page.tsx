'use client';

import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';

import type { JobStrategy, CoverLetter, ResumePatch } from '@/lib/types/jobStrategy';
import type { JobWithCompany } from '@/lib/supabase/types';
import type { StudentProfile, StudentJobStrategy } from '@/lib/types/studentProfile';
import { ResumeDataService } from '@/lib/services/resumeDataService';
import { useSupabaseResumeContext, SupabaseResumeProvider } from '@/lib/contexts/SupabaseResumeContext';
import { EditModeProvider } from '@/lib/contexts/EditModeContext';
import EligibilityChecker from '@/components/werkstudent/EligibilityChecker';
import { AlignmentCards } from '@/components/werkstudent/AlignmentCards';
import { ComprehensiveJobAnalysis } from '@/components/werkstudent/ComprehensiveJobAnalysis';
import BulletRewriter from '@/components/werkstudent/BulletRewriter';
import ComprehensiveStrategy from '@/components/enhanced-strategy/ComprehensiveStrategy';
import { EnhancedRichText } from '@/components/resume-editor/enhanced-rich-text';
import { TailorPerfectStudio } from '@/components/tailor-resume-editor/TailorPerfectStudio';
import { RequireAuth } from '@/components/auth/RequireAuth';

// Enhanced Tab configuration with visual elements
const TABS = [
  { 
    id: 'strategy', 
    label: 'AI Strategy', 
    icon: Brain, 
    gradient: 'from-purple-500 to-pink-500',
    description: 'Smart analysis & positioning'
  },
  { 
    id: 'resume', 
    label: 'Resume Studio', 
    icon: Diamond, 
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Live editing & optimization'
  }, 
  { 
    id: 'cover-letter', 
    label: 'Letter Craft', 
    icon: PenTool, 
    gradient: 'from-green-500 to-emerald-500',
    description: 'Interactive letter builder'
  }
] as const;

type TabId = typeof TABS[number]['id'];

function TailorApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  // Get resume data from Supabase context
  const { resumeData, isLoading: resumeLoading } = useSupabaseResumeContext();
  
  // Debug logs removed
  
  const [activeTab, setActiveTab] = useState<TabId>('strategy');
  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [strategy, setStrategy] = useState<JobStrategy | null>(null);
  const [studentStrategy, setStudentStrategy] = useState<StudentJobStrategy | null>(null);
  const [enhancedStrategy, setEnhancedStrategy] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [patches, setPatches] = useState<ResumePatch[]>([]);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState({
    job: true,
    strategy: false,
    patches: false,
    letter: false
  });
  
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
      } as JobWithCompany);
    }
  };
  
  const loadStrategy = async () => {
    if (!job || !resumeData) return;
    
    setLoading(prev => ({ ...prev, strategy: true }));
    
    try {
      
      
      // FIRST: Check if we already have cached strategy for this job
      const cacheResponse = await fetch(`/api/jobs/strategy-cache?job_id=${jobId}`)
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json()
        if (cacheData.cached) {
          
          
          // Use cached strategy
          if (cacheData.strategy) {
            setStudentStrategy(cacheData.strategy)
            setLoading(prev => ({ ...prev, strategy: false }));
            return; // Exit early - no GPT call needed!
          }
        }
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
        headers: { 'Content-Type': 'application/json' },
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
        
        // SAVE TO CACHE to avoid future GPT calls
        console.log('🎯 STEP 4: Saving strategy to cache to save future credits 💰');
        try {
          await fetch('/api/jobs/strategy-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: jobId,
              strategy_data: data.strategy
            })
          });
          console.log('🎯 Strategy cached successfully! Next time will load instantly.');
        } catch (cacheError) {
          console.warn('🎯 Failed to cache strategy (but analysis still worked):', cacheError);
        }
        
        // Also load the enhanced comprehensive strategy
        try {
          console.log('🎯 Loading enhanced comprehensive strategy...');
          const enhancedRequestBody = endpoint.includes('student') 
            ? {
                job_id: jobId,
                student_profile: profileForStrategy
              }
            : {
                job_id: jobId,
                user_profile_id: userProfileId
              };

          const enhancedResponse = await fetch('/api/jobs/strategy-enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enhancedRequestBody)
          });
          
          const enhancedData = await enhancedResponse.json();
          if (enhancedData.success) {
            setEnhancedStrategy(enhancedData.strategy);
            console.log('🎯 Enhanced strategy loaded successfully');
          }
        } catch (enhancedError) {
          console.error('Enhanced strategy failed:', enhancedError);
          // Don't fail the main strategy if enhanced fails
        }
      }
    } catch (error) {
      console.error('Strategy generation failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, strategy: false }));
    }
  };
  
  const generateCoverLetter = async (tone: string, length: string) => {
    setLoading(prev => ({ ...prev, letter: true }));
    
    try {
      // Get profile using the same method as the resume studio
      const profileResponse = await fetch('/api/profile/latest');
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
      
      // Determine if we should use student cover letter API using freshly fetched profile
      const isWerkstudent = job?.is_werkstudent || job?.title?.toLowerCase().includes('werkstudent');
      const fetchedProfile = profileData.profile;
      const isEnrolled = fetchedProfile?.enrollment_status === 'enrolled';
      let expectedGradIsFuture = false;
      if (fetchedProfile?.expected_graduation) {
        const dt = new Date(fetchedProfile.expected_graduation);
        if (!isNaN(dt.getTime())) expectedGradIsFuture = dt > new Date();
      }
      const isStudentProfile = !!(isEnrolled || expectedGradIsFuture);
      const endpoint = (isWerkstudent || isStudentProfile) ? '/api/jobs/cover-letter-student' : '/api/jobs/cover-letter';

      const userProfileId = (endpoint.includes('student')) ? 'latest' : fetchedProfile.id;
      
      console.log(`🎯 Using ${endpoint} for cover letter generation`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          user_profile_id: userProfileId,
          tone,
          length,
          strategy_context: studentStrategy || strategy
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCoverLetter(data.cover_letter);
        console.log('🎯 Cover letter generated');
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

  // PDF Export for Cover Letters
  const exportCoverLetterPDF = async (coverLetter: CoverLetter, job: JobWithCompany) => {
    try {
      const fullText = `${coverLetter.content.intro}\n\n${coverLetter.content.body_paragraphs.join('\n\n')}\n\n${coverLetter.content.closing}\n\n${coverLetter.content.sign_off}`;
      
      // Create HTML template for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; color: #333; }
            .header { margin-bottom: 40px; }
            .date { text-align: right; margin-bottom: 20px; }
            .recipient { margin-bottom: 30px; }
            .content { margin-bottom: 30px; white-space: pre-line; }
            .signature { margin-top: 40px; }
            h1 { font-size: 18px; margin: 0; }
            h2 { font-size: 16px; margin: 0; }
            p { margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${userProfile?.name || 'Your Name'}</h1>
            <p>${userProfile?.email || 'your.email@example.com'} | ${userProfile?.phone || '+49 XXX XXX XXXX'}</p>
            <p>${userProfile?.location || 'Your City, Germany'}</p>
          </div>
          
          <div class="date">
            ${new Date().toLocaleDateString('de-DE')}
          </div>
          
          <div class="recipient">
            <h2>${job.companies?.name || job.company_name || 'Hiring Manager'}</h2>
            <p>${job.location_city || 'City'}</p>
          </div>
          
          <div class="content">
            <p><strong>Subject: Application for ${job.title}</strong></p>
            <div>${fullText}</div>
          </div>
        </body>
        </html>
      `;
      
      // Send to PDF generation API
      const response = await fetch('/api/resume/pdf-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          filename: `Cover_Letter_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cover_Letter_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('PDF generation failed');
        alert('PDF generation failed. Please try again.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export failed. Please try again.');
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
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <Link 
                href="/jobs"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Tailor Studio</h1>
                <p className="text-sm text-gray-600">
                  {job?.title} • {job?.companies?.name}
                </p>
              </div>
            </div>
            
            {/* Step Navigation */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-blue-600">Upload</span>
              <div className="w-6 h-0.5 bg-blue-600 rounded"></div>
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                2
              </div>
              <span className="text-sm font-medium text-blue-600">Jobs</span>
              <div className="w-6 h-0.5 bg-blue-600 rounded"></div>
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                3
              </div>
              <span className="text-sm font-medium text-blue-600">Tailor</span>
              <div className="w-6 h-0.5 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-semibold">
                4
              </div>
              <span className="text-sm font-medium text-gray-400">Generate</span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="px-8 border-t border-gray-100">
          <div className="flex items-center">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors text-sm font-medium',
                    isActive 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'strategy' && (strategy || studentStrategy) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Full Width Tab Content */}
      <div className="w-full">
        <div className="px-8 py-8">
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
                  enhancedStrategy={enhancedStrategy}
                  userProfile={userProfile}
                  loading={loading.strategy}
                  onRetryStrategy={loadStrategy}
                />
              )}
              
              {activeTab === 'resume' && (
                <ResumeStudioTab
                  job={job}
                  strategy={strategy}
                  studentStrategy={studentStrategy}
                  userProfile={userProfile}
                  resumeData={resumeData}
                  patches={patches}
                  onPatchesChange={setPatches}
                  loading={loading.patches}
                />
              )}
              
              {activeTab === 'cover-letter' && (
                <CoverLetterStudioTab
                  job={job}
                  strategy={strategy}
                  coverLetter={coverLetter}
                  onGenerate={generateCoverLetter}
                  onCoverLetterChange={setCoverLetter}
                  loading={loading.letter}
                  userProfile={userProfile}
                  exportPDF={exportCoverLetterPDF}
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
  enhancedStrategy,
  userProfile,
  loading, 
  onRetryStrategy 
}: {
  job: JobWithCompany;
  strategy: JobStrategy | null;
  studentStrategy: StudentJobStrategy | null;
  enhancedStrategy: any;
  userProfile: any;
  loading: boolean;
  onRetryStrategy: () => void;
}) {
  // Show ComprehensiveStrategy if available
  if (enhancedStrategy && !loading) {
    return <ComprehensiveStrategy strategy={enhancedStrategy} jobData={job} onRefresh={onRetryStrategy} />
  }

  if (loading) {
    return (
      <motion.div 
        className="flex items-center justify-center py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center max-w-md">
          <motion.div 
            className="relative mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Brain Analyzing</h3>
          <p className="text-gray-600 leading-relaxed">
            Our AI is deep-diving into job requirements, analyzing your profile, 
            and crafting the perfect positioning strategy...
          </p>
        </div>
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
  
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Comprehensive Job Analysis - New Primary Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ComprehensiveJobAnalysis
          userProfile={userProfile}
          jobData={job}
          strategy={studentStrategy || strategy}
          onNavigateToSkills={() => setActiveTab('resume')}
        />
      </motion.div>

      {/* Werkstudent Eligibility Section - Now Compact */}
      {isWerkstudent && studentProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <EligibilityChecker
            studentProfile={studentProfile}
            userProfile={userProfile}
            jobRequirements={{
              hours_per_week: job.hours_per_week || '15-20',
              language_required: job.german_required || job.language_required,
              location: job.location_city,
              duration: job.duration_months?.toString(),
              start_date: job.start_date
            }}
            compact={false}
          />
        </motion.div>
      )}
      
      {/* Student Alignment Cards - Analysis Focus */}
      {studentStrategy && studentProfile && (
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

      {/* Positioning Section - Enhanced */}
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
      
      {/* Enhanced Fit Summary */}
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
      
      {/* Enhanced ATS Keywords */}
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

// Revolutionary Resume Studio Tab with integrated editor
function ResumeStudioTab({ 
  job, 
  strategy, 
  studentStrategy,
  userProfile,
  resumeData, // Now passed as prop from parent
  patches, 
  onPatchesChange, 
  loading 
}: any) {
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  // Removed local resumeData state - now using prop
  const [isLoadingResume, setIsLoadingResume] = useState(false); // Set to false since parent handles loading
  
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
    academic_projects: userProfile.academic_projects,
    relevant_coursework: userProfile.relevant_coursework
  } : null;
  
  const isStudent = !!studentProfile;
  
  // Generate AI suggestions when resume data is available
  React.useEffect(() => {
    if (resumeData && job) {
      console.log('📝 Resume data available for AI suggestions:', resumeData.personalInfo?.name);
      generateComprehensiveSuggestions(resumeData);
    }
  }, [resumeData, job]);
  
  // Generate comprehensive AI suggestions from actual resume data
  const generateComprehensiveSuggestions = async (resumeData: any) => {
    if (!job || !resumeData || suggestionsLoading) return;
    
    setSuggestionsLoading(true);
    const suggestions: any[] = [];
    
    try {
      const resumeService = ResumeDataService.getInstance();
      const userProfileId = resumeService.getUserProfileId() || 'demo';
      
      // Get ATS keywords from strategy
      const atsKeywords = (studentStrategy?.ats_keywords || strategy?.ats_keywords || []);
      const mustHaves = (studentStrategy?.must_have_gaps || strategy?.must_have_gaps || []).map((gap: any) => gap.skill);
      
      // Generate suggestions for experience bullets
      if (resumeData.experience && resumeData.experience.length > 0) {
        for (let expIndex = 0; expIndex < resumeData.experience.length; expIndex++) {
          const experience = resumeData.experience[expIndex];
          if (experience.bullets && experience.bullets.length > 0) {
            for (let bulletIndex = 0; bulletIndex < Math.min(experience.bullets.length, 3); bulletIndex++) {
              const bullet = experience.bullets[bulletIndex];
              if (bullet && bullet.trim()) {
                try {
                  const response = await fetch('/api/jobs/resume/patches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      job_id: job.id,
                      user_profile_id: userProfileId,
                      target: {
                        section: 'experience',
                        target_id: `exp_${expIndex}_bullet_${bulletIndex}`,
                        text: bullet
                      },
                      ats_keywords: atsKeywords,
                      must_haves: mustHaves
                    })
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                      suggestions.push({
                        id: `exp_${expIndex}_${bulletIndex}`,
                        type: 'bullet',
                        section: 'experience',
                        original: bullet,
                        suggestion: data.patch.proposed_text,
                        confidence: 85,
                        keywords: data.patch.used_keywords || [],
                        impact: 'high',
                        reason: data.patch.reasoning,
                        experienceIndex: expIndex,
                        bulletIndex: bulletIndex
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Failed to generate suggestion for experience ${expIndex} bullet ${bulletIndex}:`, error);
                }
              }
            }
          }
        }
      }
      
      // Generate suggestions for professional summary
      if (resumeData.professionalSummary && resumeData.professionalSummary.trim()) {
        try {
          const response = await fetch('/api/jobs/resume/patches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: job.id,
              user_profile_id: userProfileId,
              target: {
                section: 'summary',
                target_id: 'professional_summary',
                text: resumeData.professionalSummary
              },
              ats_keywords: atsKeywords,
              must_haves: mustHaves
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              suggestions.push({
                id: 'summary_main',
                type: 'summary',
                section: 'summary',
                original: resumeData.professionalSummary,
                suggestion: data.patch.proposed_text,
                confidence: 90,
                keywords: data.patch.used_keywords || [],
                impact: 'high',
                reason: data.patch.reasoning
              });
            }
          }
        } catch (error) {
          console.error('Failed to generate summary suggestion:', error);
        }
      }
      
      // Generate suggestions for skills (recommend missing must-have skills)
      if (strategy || studentStrategy) {
        const missingSkills = (studentStrategy?.must_have_gaps || strategy?.must_have_gaps || []);
        if (missingSkills.length > 0) {
          suggestions.push({
            id: 'skills_missing',
            type: 'skills',
            section: 'skills',
            original: 'Current skills',
            suggestion: `Add these critical skills: ${missingSkills.slice(0, 3).map((gap: any) => gap.skill).join(', ')}`,
            confidence: 95,
            keywords: missingSkills.map((gap: any) => gap.skill),
            impact: 'high',
            reason: 'These skills are required by the job and will significantly improve your match score'
          });
        }
      }
      
      setAiSuggestions(suggestions);
      console.log(`🤖 Generated ${suggestions.length} AI suggestions`);
      
    } catch (error) {
      console.error('Failed to generate comprehensive suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };
  
  // Handle suggestion acceptance
  const handleSuggestionAccept = (suggestionId: string) => {
    const suggestion = aiSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      console.log('✅ Accepted suggestion:', suggestion.original, '→', suggestion.suggestion);
      // The TailorPerfectStudio will handle applying the suggestion to the resume data
    }
  };
  
  // Handle suggestion rejection
  const handleSuggestionReject = (suggestionId: string) => {
    const suggestion = aiSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      console.log('❌ Rejected suggestion:', suggestion.original);
      // Remove from suggestions list
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }
  };
  
  // Don't render until resume is loaded
  if (isLoadingResume) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    );
  }
  
  if (!resumeData) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <p className="text-gray-600">No resume data found. Please upload your resume first.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Revolutionary AI-Powered Resume Editor with Inline Suggestions */}
      <div className="space-y-6">
        {/* AI Suggestions Control Bar */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Tailoring Engine</h3>
                <p className="text-sm text-gray-600">
                  {aiSuggestions.length > 0 
                    ? `${aiSuggestions.length} suggestions ready` 
                    : 'Generate AI-powered suggestions to tailor your resume'}
                </p>
              </div>
            </div>
            <button
              onClick={() => generateComprehensiveSuggestions(resumeData)}
              disabled={!resumeData || suggestionsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {suggestionsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {aiSuggestions.length > 0 ? 'Refresh Suggestions' : 'Generate Suggestions'}
                </>
              )}
            </button>
          </div>
          {aiSuggestions.length > 0 && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {aiSuggestions.filter(s => s.type === 'experience').length} Experience
              </span>
              <span className="text-blue-600 flex items-center gap-1">
                <Target className="w-4 h-4" />
                {aiSuggestions.filter(s => s.type === 'summary').length} Summary
              </span>
              <span className="text-purple-600 flex items-center gap-1">
                <Star className="w-4 h-4" />
                {aiSuggestions.filter(s => s.type === 'skills').length} Skills
              </span>
            </div>
          )}
        </div>

        <TailorPerfectStudio
          jobData={job}
          strategy={strategy || studentStrategy}
          resumeData={resumeData}
          patches={patches}
          onPatchesChange={onPatchesChange}
          aiSuggestions={aiSuggestions}
          onSuggestionAccept={handleSuggestionAccept}
          onSuggestionReject={handleSuggestionReject}
          onResumeDataLoaded={(data) => {
            // Resume data is managed by SupabaseResumeContext, no need to set it locally
            
            // Auto-generate suggestions when resume loads
            if (data && aiSuggestions.length === 0 && !suggestionsLoading) {
              setTimeout(() => generateComprehensiveSuggestions(data), 1000);
            }
          }}
          suggestionsLoading={suggestionsLoading}
        />
      </div>
    </div>
  );
}

// Revolutionary Cover Letter Studio with inline editing
function CoverLetterStudioTab({ 
  job, 
  strategy, 
  coverLetter, 
  onGenerate, 
  onCoverLetterChange,
  loading,
  userProfile,
  exportPDF
}: {
  job: JobWithCompany;
  strategy: JobStrategy | null;
  coverLetter: CoverLetter | null;
  onGenerate: (tone: string, length: string) => void;
  onCoverLetterChange: (letter: CoverLetter | null) => void;
  loading: boolean;
  userProfile: any;
  exportPDF: (letter: CoverLetter, job: JobWithCompany) => void;
}) {
  const [selectedTone, setSelectedTone] = useState<'confident' | 'warm' | 'direct'>('confident');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(coverLetter);
  
  // Update editable content when coverLetter changes
  useEffect(() => {
    if (coverLetter && !isEditing) {
      setEditableContent(coverLetter);
    }
  }, [coverLetter, isEditing]);
  
  const toneDescriptions = {
    confident: 'Authority and proven results',
    warm: 'Enthusiasm and personal connection',
    direct: 'Concise and professional'
  };
  
  const lengthDescriptions = {
    short: '150-200 words (concise)',
    medium: '220-300 words (balanced)', 
    long: '360-370 words (detailed)'
  };

  const handleContentChange = (field: string, value: string) => {
    if (!editableContent) return;
    
    setEditableContent(prev => ({
      ...prev!,
      content: {
        ...prev!.content,
        [field]: value
      }
    }));
  };

  const handleBodyParagraphChange = (index: number, value: string) => {
    if (!editableContent) return;
    
    const newParagraphs = [...editableContent.content.body_paragraphs];
    newParagraphs[index] = value;
    
    setEditableContent(prev => ({
      ...prev!,
      content: {
        ...prev!.content,
        body_paragraphs: newParagraphs
      }
    }));
  };

  const saveChanges = () => {
    if (editableContent) {
      onCoverLetterChange(editableContent);
    }
    setIsEditing(false);
  };

  const discardChanges = () => {
    setEditableContent(coverLetter);
    setIsEditing(false);
  };

  const copyToClipboard = () => {
    if (!editableContent) return;
    
    const fullText = `${editableContent.content.intro}\n\n${editableContent.content.body_paragraphs.join('\n\n')}\n\n${editableContent.content.closing}\n\n${editableContent.content.sign_off}`;
    navigator.clipboard.writeText(fullText);
  };
  
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div 
        className="relative bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Letter Craft Studio</h2>
              <p className="text-gray-600 text-lg">AI-powered writing meets interactive editing</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <motion.div 
          className="xl:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 backdrop-blur-xl rounded-3xl border border-white/50 p-6 shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-md">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Letter Options</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Writing Tone</label>
                  <div className="space-y-3">
                    {Object.entries(toneDescriptions).map(([tone, desc]) => (
                      <motion.label 
                        key={tone} 
                        className="flex items-center gap-3 cursor-pointer group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="radio"
                          name="tone"
                          value={tone}
                          checked={selectedTone === tone}
                          onChange={(e) => setSelectedTone(e.target.value as any)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                          selectedTone === tone 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white group-hover:border-blue-300 group-hover:bg-blue-50/50'
                        }`}>
                          <div className="font-bold text-gray-900 capitalize">{tone}</div>
                          <div className="text-sm text-gray-600">{desc}</div>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Length</label>
                  <div className="space-y-3">
                    {Object.entries(lengthDescriptions).map(([length, desc]) => (
                      <motion.label 
                        key={length} 
                        className="flex items-center gap-3 cursor-pointer group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <input
                          type="radio"
                          name="length"
                          value={length}
                          checked={selectedLength === length}
                          onChange={(e) => setSelectedLength(e.target.value as any)}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                          selectedLength === length 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 bg-white group-hover:border-emerald-300 group-hover:bg-emerald-50/50'
                        }`}>
                          <div className="font-bold text-gray-900 capitalize">{length}</div>
                          <div className="text-sm text-gray-600">{desc}</div>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={() => onGenerate(selectedTone, selectedLength)}
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-bold text-lg disabled:opacity-50 disabled:hover:scale-100"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Crafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Cover Letter
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Quick Actions */}
          {coverLetter && (
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Quick Actions
              </h4>
              <div className="space-y-2">
                <motion.button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </motion.button>
                
                <motion.button
                  onClick={() => exportPDF(coverLetter, job)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </motion.button>
                
                <motion.button
                  onClick={() => onCoverLetterChange(null)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Interactive Preview/Editor */}
        <motion.div 
          className="xl:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative bg-gradient-to-br from-white via-slate-50/50 to-gray-50/30 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-slate-600 to-gray-600 rounded-lg shadow-md">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isEditing ? 'Interactive Editor' : 'Live Preview'}
                  </h3>
                </div>
                
                {coverLetter && (
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <>
                        <motion.button
                          onClick={saveChanges}
                          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Save
                        </motion.button>
                        <motion.button
                          onClick={discardChanges}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </motion.button>
                      </>
                    )}
                    
                    <motion.button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                        isEditing 
                          ? 'bg-gray-600 text-white hover:bg-gray-700' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit3 className="w-4 h-4" />
                      {isEditing ? 'Preview Mode' : 'Edit Mode'}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-8 min-h-[600px]">
                {coverLetter && editableContent ? (
                  <div className="max-w-2xl mx-auto">
                    {/* Letter Header */}
                    <div className="mb-8 pb-4 border-b border-gray-200">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">
                        {userProfile?.name || 'Your Name'}
                      </h4>
                      <p className="text-gray-600">
                        {userProfile?.email || 'your.email@example.com'} | {userProfile?.phone || '+49 XXX XXX XXXX'}
                      </p>
                      <p className="text-gray-600">{userProfile?.location || 'Your City, Germany'}</p>
                      <div className="mt-4 text-right text-gray-600">
                        {new Date().toLocaleDateString('de-DE')}
                      </div>
                    </div>

                    {/* Recipient */}
                    <div className="mb-6">
                      <h4 className="font-bold text-gray-900">
                        {job.companies?.name || job.company_name || 'Hiring Manager'}
                      </h4>
                      <p className="text-gray-600">{job.location_city || 'City'}</p>
                    </div>

                    {/* Subject */}
                    <div className="mb-6">
                      <p className="font-bold text-gray-900">
                        Subject: Application for {job.title}
                      </p>
                    </div>

                    {/* Letter Content */}
                    <div className="space-y-6">
                      {/* Intro */}
                      <div>
                        {isEditing ? (
                          <EnhancedRichText
                            value={editableContent.content.intro}
                            onChange={(value) => handleContentChange('intro', value)}
                            className="p-4 bg-white/80 rounded-xl border-2 border-blue-200 focus-within:border-blue-500 transition-colors"
                            multiline={true}
                            placeholder="Introduction paragraph..."
                          />
                        ) : (
                          <motion.p 
                            className="text-gray-800 leading-relaxed font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            {editableContent.content.intro}
                          </motion.p>
                        )}
                      </div>

                      {/* Body Paragraphs */}
                      {editableContent.content.body_paragraphs.map((paragraph, index) => (
                        <div key={index}>
                          {isEditing ? (
                            <EnhancedRichText
                              value={paragraph}
                              onChange={(value) => handleBodyParagraphChange(index, value)}
                              className="p-4 bg-white/80 rounded-xl border-2 border-emerald-200 focus-within:border-emerald-500 transition-colors"
                              multiline={true}
                              placeholder={`Body paragraph ${index + 1}...`}
                            />
                          ) : (
                            <motion.p 
                              className="text-gray-800 leading-relaxed"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: (index + 1) * 0.1 }}
                            >
                              {paragraph}
                            </motion.p>
                          )}
                        </div>
                      ))}

                      {/* Closing */}
                      <div>
                        {isEditing ? (
                          <EnhancedRichText
                            value={editableContent.content.closing}
                            onChange={(value) => handleContentChange('closing', value)}
                            className="p-4 bg-white/80 rounded-xl border-2 border-purple-200 focus-within:border-purple-500 transition-colors"
                            multiline={true}
                            placeholder="Closing paragraph..."
                          />
                        ) : (
                          <motion.p 
                            className="text-gray-800 leading-relaxed font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            {editableContent.content.closing}
                          </motion.p>
                        )}
                      </div>

                      {/* Sign-off */}
                      <div className="pt-4">
                        {isEditing ? (
                          <EnhancedRichText
                            value={editableContent.content.sign_off}
                            onChange={(value) => handleContentChange('sign_off', value)}
                            className="p-3 bg-white/80 rounded-lg border-2 border-gray-200 focus-within:border-gray-500 transition-colors"
                            placeholder="Sign off..."
                          />
                        ) : (
                          <motion.p 
                            className="text-gray-800 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {editableContent.content.sign_off}
                          </motion.p>
                        )}
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
export default function TailorApplicationPageWrapper() {
  return (
    <RequireAuth>
      <SupabaseResumeProvider autoSaveInterval={2000}>
        <EditModeProvider>
          <TailorApplicationPage />
        </EditModeProvider>
      </SupabaseResumeProvider>
    </RequireAuth>
  );
}
