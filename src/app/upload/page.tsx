'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ResumeUpload } from '@/components/onboarding/resume-upload'
import type { UserProfile } from '@/lib/types'

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)

      // Check if resume already uploaded
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (resumeData) {
        // Already has resume, go to dashboard
        router.push('/dashboard')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleProfileExtracted = async (profile: UserProfile, organizedSkills?: unknown) => {
    console.log('✅ Profile extracted:', profile)
    console.log('✅ Organized skills:', organizedSkills)

    // Convert profile to ResumeData format
    const resumeData = {
      personalInfo: {
        name: profile.personal_details?.name || 'Unknown',
        email: profile.personal_details?.contact?.email || '',
        phone: profile.personal_details?.contact?.phone || '',
        location: profile.personal_details?.contact?.address || '',
        linkedin: profile.personal_details?.contact?.linkedin || ''
      },
      professionalTitle: profile.professional_title || "Professional",
      professionalSummary: profile.professional_summary || "",
      enableProfessionalSummary: !!profile.professional_summary,
      skills: {
        technical: profile.skills?.technology || [],
        soft_skills: profile.skills?.soft_skills || [],
        tools: profile.skills?.design || []
      },
      experience: (profile.experience || []).map(exp => ({
        company: exp.company,
        position: exp.position,
        duration: exp.duration,
        achievements: exp.responsibilities
      })),
      education: (profile.education || []).map(edu => {
        const eduObj = edu as unknown as Record<string, unknown>;
        return {
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          institution: edu.institution,
          year: (eduObj.year ? String(eduObj.year) : edu.duration) || ''
        };
      }),
      projects: (profile.projects || []).map(proj => ({
        name: proj.title,
        description: proj.description,
        technologies: [],
        date: "2023"
      })),
      languages: (profile.languages || []).map((lang: any) => {
        if (typeof lang === 'string') {
          const match = lang.match(/^(.+?)\s*\((.+?)\)$/)
          if (match) {
            return {
              name: match[1].trim(),
              language: match[1].trim(),
              level: match[2].trim(),
              proficiency: match[2].trim()
            }
          }
          return {
            name: lang,
            language: lang,
            level: 'Not specified',
            proficiency: 'Not specified'
          }
        }
        const langObj = lang as Record<string, unknown>;
        return {
          name: (langObj.language as string) || (langObj.name as string) || '',
          language: (langObj.language as string) || (langObj.name as string) || '',
          level: (langObj.proficiency as string) || (langObj.level as string) || 'Not specified',
          proficiency: (langObj.proficiency as string) || (langObj.level as string) || 'Not specified'
        }
      }),
      certifications: (profile.certifications || []).map(cert => {
        const certObj = cert as unknown as Record<string, unknown>;
        return {
          name: cert.title,
          issuer: cert.institution || '',
          date: cert.date || '',
          description: (certObj.description as string) || ''
        };
      }),
      customSections: (((profile as unknown as Record<string, unknown>).custom_sections as unknown[]) || []) as Array<{ id: string; title: string; type: "text" | "achievements" | "list"; items: Array<{ title?: string; subtitle?: string; date?: string; description?: string; details?: string[] }> }>
    }

    // Save using ResumeDataService
    try {
      const { ResumeDataService } = await import('@/lib/services/resumeDataService')
      const resumeService = ResumeDataService.getInstance()
      await resumeService.getOrCreateResumeData() // Initialize
      await resumeService.saveResumeData(resumeData, 'swiss')
      console.log('✅ Resume data saved to database')
    } catch (error) {
      console.error('❌ Failed to save resume data:', error)
      alert('Failed to save resume data. Please try again.')
    }
  }

  const handleNext = () => {
    router.push('/onboarding')
  }

  if (loading || !userId) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <ResumeUpload
        onProfileExtracted={handleProfileExtracted}
        onNext={handleNext}
        className="container mx-auto px-4"
      />
    </div>
  )
}
