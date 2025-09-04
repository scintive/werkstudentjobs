'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Sparkles, FileText, Target, Download } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import "@/styles/enhanced-ui.css"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StepIndicator } from "@/components/ui/step-indicator"
import { ResumeUpload } from "@/components/onboarding/resume-upload"
import { PerfectStudio } from "@/components/resume-editor/PerfectStudio"
import { JobBrowser } from "@/components/jobs/JobBrowser"
import { useResumeActions } from "@/lib/contexts/ResumeContext"
import { SupabaseResumeProvider, useSupabaseResumeContext, SaveStatusIndicator } from "@/lib/contexts/SupabaseResumeContext"
import { EditModeProvider } from "@/lib/contexts/EditModeContext"
import { cn } from "@/lib/utils"
import type { AppStep, UserProfile, ResumeData, JobData, AnalysisResult } from "@/lib/types"
import type { JobWithCompany } from "@/lib/supabase/types"

// Application steps
const steps: AppStep[] = [
  {
    id: 'upload',
    title: 'Upload',
    description: 'Upload your resume',
    completed: false,
    current: true
  },
  {
    id: 'editor',
    title: 'Editor',  
    description: 'Visual resume editor',
    completed: false,
    current: false
  },
  {
    id: 'jobs',
    title: 'Jobs',
    description: 'Select target job',
    completed: false,
    current: false
  },
  {
    id: 'strategy',
    title: 'Strategy',
    description: 'AI job strategy',
    completed: false,
    current: false
  },
  {
    id: 'finalize',
    title: 'Generate',
    description: 'Download documents',
    completed: false,
    current: false
  }
]

// Main app component that uses ResumeContext
function MainApp() {
  const [currentStep, setCurrentStep] = React.useState<string>('upload')
  const [appSteps, setAppSteps] = React.useState<AppStep[]>(steps)
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null)
  const [selectedTheme, setSelectedTheme] = React.useState<string>('swiss')
  const [organizedSkills, setOrganizedSkills] = React.useState<any>(null)
  const [selectedJob, setSelectedJob] = React.useState<JobWithCompany | null>(null)
  const [isCheckingProfile, setIsCheckingProfile] = React.useState(true)
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false)
  const [checkedAuth, setCheckedAuth] = React.useState<boolean>(false)
  
  // Use ResumeContext hooks
  const { setResumeData } = useResumeActions()
  
  // Check for existing user profile on mount
  React.useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        // Check if user has any session/email cookie
        const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('user_session='))
        const emailCookie = document.cookie.split('; ').find(row => row.startsWith('user_email='))
        
        // Check API for actual profile data (not just cookies)
        const { data: session } = await supabase.auth.getSession()
        setIsAuthed(!!session.session?.user)
        setCheckedAuth(true)
        const token = session.session?.access_token
        const response = await fetch('/api/profile/latest', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.resumeData) {
            // Check if resume data has actual content
            const hasContent = result.resumeData.personalInfo?.name && 
                             result.resumeData.personalInfo?.email &&
                             (result.resumeData.experience?.length > 0 || 
                              result.resumeData.education?.length > 0 ||
                              Object.keys(result.resumeData.skills || {}).length > 0)
            
            if (hasContent) {
              // User has a complete profile - redirect to jobs page
              console.log('Complete profile found, redirecting to jobs')
              window.location.href = '/jobs'
              return
            } else {
              console.log('Profile exists but incomplete, staying on upload page')
            }
          }
        }
      } catch (error) {
        console.log('No existing profile found, showing onboarding')
      } finally {
        setIsCheckingProfile(false)
      }
    }
    
    checkExistingProfile()
  }, [])

  const updateStepStatus = React.useCallback((stepId: string, completed: boolean, current: boolean = false) => {
    setAppSteps(prev => prev.map(step => ({
      ...step,
      completed: step.id === stepId ? completed : (step.completed || false),
      current: step.id === stepId ? current : false
    })))
  }, [])

  const moveToNextStep = React.useCallback((nextStepId: string) => {
    setCurrentStep(nextStepId)
    setAppSteps(prev => prev.map(step => ({
      ...step,
      current: step.id === nextStepId
    })))
  }, [])

  const handleProfileExtracted = React.useCallback((profile: UserProfile, organizedSkills?: any) => {
    setUserProfile(profile)
    setOrganizedSkills(organizedSkills)
    
    // Only update ResumeContext if we're currently on the upload step
    // This prevents overwriting edits when user re-uploads the same file
    if (currentStep === 'upload') {
      // Convert profile to resume data format and update context
      const newResumeData: ResumeData = {
        personalInfo: {
          name: profile.personal_details.name,
          email: profile.personal_details.contact.email,
          phone: profile.personal_details.contact.phone,
          location: profile.personal_details.contact.address,
          linkedin: profile.personal_details.contact.linkedin
        },
        professionalTitle: profile.professional_title || "Professional",
        professionalSummary: profile.professional_summary || "Detail-oriented professional with extensive experience and proven ability to drive results.",
        skills: {
          technical: profile.skills.technology,
          soft_skills: profile.skills.soft_skills,
          tools: profile.skills.design, // Reusing design as tools for demo
          languages: profile.languages.map(lang => `${lang.language} (${lang.proficiency})`)
        },
        experience: profile.experience.map(exp => ({
          company: exp.company,
          position: exp.position,
          duration: exp.duration,
          achievements: exp.responsibilities
        })),
        education: profile.education.map(edu => ({
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          institution: edu.institution,
          year: edu.year || edu.duration,
          duration: edu.duration,
          location: edu.location
        })),
        projects: profile.projects.map(proj => ({
          name: proj.title,
          description: proj.description,
          technologies: [],
          date: "2023" // Default date
        })),
        languages: profile.languages.map((lang: any) => {
          if (typeof lang === 'string') {
            // Parse string format like "English (Fluent (Native-level))"
            const match = lang.match(/^([^(]+)\s*\(([^)]+)\)$/);
            if (match) {
              return {
                language: match[1].trim(),
                proficiency: match[2].trim()
              };
            }
            // Fallback if no parentheses found
            return {
              language: lang.trim(),
              proficiency: 'Not specified'
            };
          } else {
            // Already structured object
            return {
              language: lang.language || lang,
              proficiency: lang.proficiency || 'Not specified'
            };
          }
        }),
        certifications: profile.certifications.map(cert => ({
          name: cert.title,
          issuer: cert.institution,
          date: cert.date
        })),
        customSections: (profile.custom_sections || []).map((section: any, index: number) => {
          console.log('🔍 CONVERTING CUSTOM SECTION:', section);
          
          // Helper function to intelligently parse custom section items based on title
          const parseCustomSectionItem = (item: string, sectionTitle: string) => {
            // For Volunteer Experience: Try to extract Organization, Role, Duration, Impact
            if (sectionTitle.includes('Volunteer') || sectionTitle.includes('Leadership')) {
              // Handle format: "Role, Organization (Duration) — Description"
              const match = item.match(/^(.*?),\s*(.*?)\s*\(([^)]+)\)\s*[—-]\s*(.*)$/);
              if (match) {
                return {
                  field1: match[1].trim(), // Role/Position
                  field2: match[2].trim(), // Organization  
                  field3: match[3].trim(), // Duration
                  field4: match[4].trim()  // Impact/Description
                };
              }
            }
            
            // For Awards: Try to extract Award, Organization, Date, Description
            if (sectionTitle.includes('Award')) {
              const match = item.match(/^(.*?),\s*(.*?)\s*\(([^)]+)\)\s*-\s*(.*)$/);
              if (match) {
                return {
                  field1: match[1].trim(), // Award Title
                  field2: match[2].trim(), // Organization
                  field3: match[3].trim(), // Date
                  field4: match[4].trim()  // Description
                };
              }
            }
            
            // Default: Put entire item in field1
            return {
              field1: item,
              field2: '',
              field3: '',
              field4: ''
            };
          };
          
          return {
            id: `custom-${index}`,
            title: section.title,
            type: 'custom',
            items: section.items.map((item: string) => parseCustomSectionItem(item, section.title))
          }
        })
      }
      
      // Update resume data through context
      setResumeData(newResumeData)
    }
    
    updateStepStatus('upload', true)
    
    // Automatically move to editor after successful extraction (only if currently on upload)
    if (currentStep === 'upload') {
      setTimeout(() => {
        moveToNextStep('editor')
        updateStepStatus('editor', false, true)
      }, 500) // Small delay for better UX transition
    }
  }, [setResumeData, updateStepStatus, moveToNextStep, currentStep])

  const handleUploadNext = React.useCallback(() => {
    moveToNextStep('editor')
    updateStepStatus('editor', false, true)
  }, [moveToNextStep, updateStepStatus])

  // Show loading while checking for existing profile
  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return checkedAuth && !isAuthed ? (
          <div className="bg-white/70 backdrop-blur rounded-2xl border border-gray-200 p-8 text-center card-hover">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to start</h2>
            <p className="text-gray-600 mb-6">Create an account or log in to upload your resume and save progress securely.</p>
            <div className="flex items-center justify-center gap-3">
              <a href="/login" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Login</a>
              <a href="/register" className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200">Register</a>
            </div>
          </div>
        ) : (
          <ResumeUpload
            onProfileExtracted={handleProfileExtracted}
            onNext={handleUploadNext}
            className="w-full"
          />
        )
      
      case 'editor':
        return (
          <div className="space-y-6">
            <PerfectStudio userProfile={userProfile} organizedSkills={organizedSkills} />
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => {
                  updateStepStatus('editor', true)
                  moveToNextStep('jobs')
                  updateStepStatus('jobs', false, true)
                }}
                className="gap-2"
              >
                Continue to Job Selection
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      
      case 'jobs':
        return (
          <JobBrowser 
            userProfile={userProfile}
            onJobSelect={(job) => {
              setSelectedJob(job)
              // Automatically move to strategy step after job selection
              setTimeout(() => {
                updateStepStatus('jobs', true)
                moveToNextStep('strategy')
                updateStepStatus('strategy', false, true)
              }, 500)
            }}
            className="w-full"
          />
        )
      
      case 'strategy':
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" />
                AI Job Strategy Analysis
              </CardTitle>
              <CardDescription>
                Get personalized insights and recommendations for your job application
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="space-y-6">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Strategy Analysis Coming Soon</h3>
                  <p className="text-muted-foreground">
                    AI-powered job strategy with fit analysis, tips, and tailored suggestions
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    updateStepStatus('strategy', true)
                    moveToNextStep('finalize')
                    updateStepStatus('finalize', false, true)
                  }}
                  size="lg"
                >
                  Continue to Generation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'finalize':
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Download className="w-6 h-6" />
                Generate Documents
              </CardTitle>
              <CardDescription>
                Download your tailored resume and cover letter
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Documents Ready!</h3>
                  <p className="text-muted-foreground">
                    Your optimized resume and cover letter are ready for download
                  </p>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" variant="outline">
                    Download Resume
                  </Button>
                  <Button size="lg">
                    Download Cover Letter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/8 to-blue-300/6 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-slate-200/8 to-gray-100/6 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-300/4 to-slate-200/4 rounded-full blur-3xl"></div>
      </div>

      {/* Premium Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className={cn(
          currentStep === 'jobs' ? "w-full px-6 py-4" : "container mx-auto px-6 py-4"
        )}>
          <div className="flex items-center justify-between">
            {/* Brand */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ResumeCraft AI
                </h1>
                <p className="text-xs font-medium text-gray-500 tracking-wide">
                  ✨ Powered by Advanced AI • Premium Results
                </p>
              </div>
            </motion.div>
            
            {/* Modern Progress Indicator */}
            <div className="hidden lg:block flex-1 max-w-3xl mx-12">
              <div className="relative">
                <div className="flex items-center justify-between relative z-10">
                  {appSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      className="flex flex-col items-center relative"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      {/* Step Circle */}
                      <div className={`
                        relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform
                        ${step.completed 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg scale-105' 
                          : step.current 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg scale-110 animate-pulse' 
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                        }
                      `}>
                        {step.completed ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-white font-bold text-lg"
                          >
                            ✓
                          </motion.div>
                        ) : (
                          <span className={`font-bold text-sm ${
                            step.current ? 'text-white' : 'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        )}
                        
                        {/* Pulsing Ring for Current Step */}
                        {step.current && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 animate-ping opacity-25"></div>
                        )}
                      </div>
                      
                      {/* Step Labels */}
                      <div className="mt-3 text-center">
                        <div className={`font-semibold text-sm ${
                          step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 max-w-20 leading-tight">
                          {step.description}
                        </div>
                      </div>

                      {/* Connecting Line */}
                      {index < appSteps.length - 1 && (
                        <div className="absolute top-6 left-12 w-full h-0.5 -z-10">
                          <div className={`h-full transition-all duration-500 ${
                            step.completed ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-200'
                          }`}></div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button and Status */}
            <div className="flex items-center space-x-4">
              {/* Save Status Indicator */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <SaveStatusIndicator />
              </motion.div>
              
              {/* Help Button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button 
                  variant="outline" 
                  className="hidden md:flex items-center space-x-2 bg-white/50 hover:bg-white/80 backdrop-blur border-gray-200 hover:border-gray-300 transition-all duration-300"
                >
                  <FileText className="w-4 h-4" />
                  <span>Help</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "relative",
        currentStep === 'jobs' ? "w-full" : "container mx-auto px-6 py-12"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
            className="w-full"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Premium Mobile Progress Indicator */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
        <motion.div 
          className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            {appSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${step.completed 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md' 
                    : step.current 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-md animate-pulse' 
                    : 'bg-gray-100 border border-gray-200'
                  }
                `}>
                  {step.completed ? (
                    <span className="text-white font-bold text-xs">✓</span>
                  ) : (
                    <span className={`font-bold text-xs ${
                      step.current ? 'text-white' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>

                {/* Mobile connecting line */}
                {index < appSteps.length - 1 && (
                  <div className="absolute top-4 left-8 w-6 h-px">
                    <div className={`h-full transition-all duration-500 ${
                      step.completed ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-200'
                    }`}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Export default function that provides SupabaseResumeContext
export default function HomePage() {
  return (
    <SupabaseResumeProvider autoSaveInterval={2000}>
      <EditModeProvider>
        <MainApp />
      </EditModeProvider>
    </SupabaseResumeProvider>
  )
}
