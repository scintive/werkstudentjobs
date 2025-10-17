'use client'

import * as React from 'react'
import { JobBrowser } from '@/components/jobs/JobBrowser'
import { SupabaseResumeProvider } from '@/lib/contexts/SupabaseResumeContext'
import { useSupabaseResumeContext } from '@/lib/contexts/SupabaseResumeContext'
import { EditModeProvider } from '@/lib/contexts/EditModeContext'
import { RequireAuth } from '@/components/auth/RequireAuth'
import type { UserProfile } from '@/lib/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// This page now uses the full-featured JobBrowser component
// instead of the basic job list
function JobsContent() {
  const { resumeData } = useSupabaseResumeContext()

  const handleJobSelect = (job: any) => {
    // Navigate to tailor page when job is selected
    window.location.href = `/jobs/${job.id}/tailor`
  }

  // Derive a userProfile-like object from resumeData for matching/skills UI
  const userProfile = React.useMemo<UserProfile | null>(() => {
    if (!resumeData) return null as any

    // Flatten skills: convert objects with name/proficiency to strings
    const normalizeSkillArray = (arr: any[] | undefined) => {
      if (!arr) return [] as string[]
      return arr.map((s: any) => {
        if (!s) return ''
        if (typeof s === 'string') return s
        if (typeof s === 'object') {
          // Common shapes: { name }, { skill, proficiency }
          if ('skill' in s && s.skill) return String(s.skill)
          if ('name' in s && s.name) return String((s as any).name)
        }
        return String(s)
      }).filter(Boolean) as string[]
    }

    const allSkillsObj: Record<string, string[]> = {}
    const skills = resumeData.skills || {}
    Object.entries(skills).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        allSkillsObj[key] = normalizeSkillArray(value)
      }
    })

    // Legacy categories expected by some callers, but include ALL categories too
    const legacySkills = {
      technology: [
        ...(allSkillsObj.technical || []),
        ...(allSkillsObj.core || []),
        ...(allSkillsObj.specialized || []),
        ...(allSkillsObj.tools || []),
        ...(allSkillsObj.data || []),
        ...(allSkillsObj.business || []),
        ...(allSkillsObj.interpersonal || []),
        ...(allSkillsObj.creative || []),
        ...(allSkillsObj.design || [])
      ],
      soft_skills: [
        ...(allSkillsObj.interpersonal || []),
        ...(allSkillsObj.business || []),
        ...(allSkillsObj.core_soft || [])
      ],
      design: [
        ...(allSkillsObj.creative || []),
        ...(allSkillsObj.design || []),
        ...(allSkillsObj.tools || [])
      ],
      // Also pass-through all categories so server-side Object.values(...) sees them
      ...allSkillsObj
    }

    // Normalize languages from either top-level or skills.languages
    const profileLanguages = (() => {
      const langs: string[] = []
      const topLevel = (resumeData as any).languages as Array<{ language: string; proficiency?: string }> | undefined
      if (Array.isArray(topLevel) && topLevel.length) {
        topLevel.forEach(l => {
          if (!l) return
          const name = typeof l === 'string' ? l : l.language
          const prof = typeof l === 'string' ? '' : (l.proficiency || '')
          langs.push(prof ? `${name} (${prof})` : name)
        })
      } else if (Array.isArray(skills.languages)) {
        langs.push(...normalizeSkillArray(skills.languages))
      }
      return langs
    })()

    const profile: UserProfile = {
      personal_details: {
        name: resumeData.personalInfo?.name || '',
        contact: {
          phone: resumeData.personalInfo?.phone || '',
          email: resumeData.personalInfo?.email || '',
          address: resumeData.personalInfo?.location || '',
          linkedin: resumeData.personalInfo?.linkedin || undefined
        }
      },
      professional_title: resumeData.professionalTitle || '',
      professional_summary: resumeData.professionalSummary || '',
      education: (resumeData.education || []).map(e => ({
        degree: e.degree,
        field_of_study: e.field_of_study,
        institution: e.institution,
        duration: e.year || '',
        location: ''
      })),
      certifications: (resumeData.certifications || []).map(c => ({
        title: c.name,
        institution: c.issuer,
        date: c.date
      })),
      experience: (resumeData.experience || []).map(x => ({
        company: x.company,
        position: x.position,
        duration: x.duration,
        responsibilities: x.achievements || []
      })),
      skills: {
        ...legacySkills
      },
      languages: profileLanguages.map(l => ({ language: l, proficiency: '' })),
      projects: (resumeData.projects || []).map(p => ({
        title: p.name,
        description: p.description || ''
      }))
    }

    return profile
  }, [resumeData])

  return (
    <JobBrowser 
      userProfile={userProfile || undefined}
      onJobSelect={handleJobSelect}
      className="min-h-screen"
    />
  )
}

export default function JobsPage() {
  return (
    <RequireAuth>
      <SupabaseResumeProvider autoSaveInterval={2000}>
        <EditModeProvider>
          <JobsContent />
        </EditModeProvider>
      </SupabaseResumeProvider>
    </RequireAuth>
  )
}
