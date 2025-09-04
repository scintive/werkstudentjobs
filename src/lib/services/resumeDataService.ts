'use client'

import { supabase } from '@/lib/supabase/client'
import type { ResumeData as ResumeDataType } from '@/lib/types'
import type { ResumeData as SupabaseResumeData } from '@/lib/supabase/types'
import { v4 as uuidv4 } from 'uuid'

// Session ID management for anonymous users
let sessionId: string | null = null

export function getOrCreateSessionId(): string {
  if (typeof window !== 'undefined') {
    if (!sessionId) {
      // Try to get session from cookies first (for logged-in users)
      const cookieSession = getCookieSession()
      if (cookieSession) {
        sessionId = cookieSession
        localStorage.setItem('resume_session_id', sessionId)
      } else {
        // Fallback to localStorage or create new
        sessionId = localStorage.getItem('resume_session_id') || uuidv4()
        localStorage.setItem('resume_session_id', sessionId)
      }
    }
  } else {
    // Server-side fallback
    sessionId = uuidv4()
  }
  return sessionId
}

// Helper to get session from cookies (client-side only)
function getCookieSession(): string | null {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'user_session') {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Force refresh session from cookies (call after login)
export function refreshSessionFromCookies(): void {
  sessionId = null // Clear cached session
  getOrCreateSessionId() // Will re-read from cookies
}

// Convert between our ResumeData type and Supabase storage format
function convertToSupabaseFormat(resumeData: ResumeDataType): Omit<SupabaseResumeData['Insert'], 'id' | 'created_at' | 'updated_at' | 'last_accessed_at'> {
  return {
    session_id: getOrCreateSessionId(),
    // user_id will be added at call-site if authenticated
    personal_info: resumeData.personalInfo,
    professional_title: resumeData.professionalTitle || '',
    professional_summary: resumeData.professionalSummary || '',
    enable_professional_summary: resumeData.enableProfessionalSummary || false,
    skills: resumeData.skills,
    experience: resumeData.experience,
    education: resumeData.education,
    projects: resumeData.projects || null,
    certifications: resumeData.certifications || null,
    custom_sections: resumeData.customSections || null,
    last_template_used: 'swiss', // Default template
    is_active: true,
    profile_completeness: calculateCompleteness(resumeData)
  }
}

function convertFromSupabaseFormat(supabaseData: SupabaseResumeData): ResumeDataType {
  return {
    personalInfo: supabaseData.personal_info as ResumeDataType['personalInfo'],
    professionalTitle: supabaseData.professional_title,
    professionalSummary: supabaseData.professional_summary,
    enableProfessionalSummary: supabaseData.enable_professional_summary,
    skills: supabaseData.skills as ResumeDataType['skills'],
    experience: supabaseData.experience as ResumeDataType['experience'],
    education: supabaseData.education as ResumeDataType['education'],
    projects: supabaseData.projects as ResumeDataType['projects'],
    certifications: supabaseData.certifications as ResumeDataType['certifications'],
    customSections: supabaseData.custom_sections as ResumeDataType['customSections']
  }
}

function calculateCompleteness(resumeData: ResumeDataType): number {
  let score = 0
  const maxScore = 8

  // Personal info completeness (2 points)
  if (resumeData.personalInfo.name) score += 0.5
  if (resumeData.personalInfo.email) score += 0.5
  if (resumeData.personalInfo.phone) score += 0.5
  if (resumeData.personalInfo.location) score += 0.5

  // Professional details (2 points)
  if (resumeData.professionalTitle) score += 1
  if (resumeData.professionalSummary && resumeData.enableProfessionalSummary) score += 1

  // Skills (1 point)
  const skillCount = Object.values(resumeData.skills).flat().length
  if (skillCount > 0) score += 1

  // Experience (1.5 points)
  if (resumeData.experience.length > 0) score += 1.5

  // Education (1 point)
  if (resumeData.education.length > 0) score += 1

  // Projects/Certifications (0.5 points)
  if (resumeData.projects && resumeData.projects.length > 0) score += 0.25
  if (resumeData.certifications && resumeData.certifications.length > 0) score += 0.25

  return Math.min(score / maxScore, 1)
}

// Helper to canonicalize skills/tools arrays
function canonicalizeSkillsArray(skills: string[]): string[] {
  if (!skills || !Array.isArray(skills)) return []
  
  // Convert to lowercase, trim, remove duplicates
  const canonicalized = [...new Set(
    skills
      .map(skill => skill.toLowerCase().trim())
      .filter(skill => skill.length > 0)
  )]
  
  return canonicalized
}

// Extract all skills and tools from resume data
function extractSkillsAndTools(resumeData: ResumeDataType): {
  skills: string[]
  tools: string[]
} {
  const skills: string[] = []
  const tools: string[] = []
  
  // Extract from skills object
  if (resumeData.skills) {
    // Technical skills and soft skills go to skills
    if (resumeData.skills.technical) {
      skills.push(...resumeData.skills.technical)
    }
    if (resumeData.skills.soft_skills) {
      skills.push(...resumeData.skills.soft_skills)
    }
    
    // Tools go to tools
    if (resumeData.skills.tools) {
      tools.push(...resumeData.skills.tools)
    }
  }
  
  return {
    skills: canonicalizeSkillsArray(skills),
    tools: canonicalizeSkillsArray(tools)
  }
}

export class ResumeDataService {
  private static instance: ResumeDataService | null = null
  private currentResumeId: string | null = null
  private currentUserProfileId: string | null = null
  private realtimeSubscription: any = null

  static getInstance(): ResumeDataService {
    if (!this.instance) {
      this.instance = new ResumeDataService()
    }
    return this.instance
  }

  // Get or create resume data for current session
  async getOrCreateResumeData(): Promise<{ id: string; data: ResumeDataType }> {
    const sessionId = getOrCreateSessionId()

    // Bind session for RLS (if enabled)
    try { await supabase.rpc('set_session_context', { session_id: sessionId }) } catch {}

    // Determine if user is authenticated
    let authUserId: string | null = null
    try {
      const { data } = await supabase.auth.getUser()
      authUserId = data.user?.id || null
    } catch {}

    // Try to find existing resume data for this user (preferred) or session
    const { data: existing, error: fetchError } = authUserId
      ? await supabase
          .from('resume_data')
          .select('*')
          .eq('user_id', authUserId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : await supabase
          .from('resume_data')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

    if (existing && !fetchError) {
      this.currentResumeId = existing.id
      await this.updateLastAccessed(existing.id)
      return {
        id: existing.id,
        data: convertFromSupabaseFormat(existing)
      }
    }

    // Create new resume data
    const initialData: ResumeDataType = {
      personalInfo: {
        name: "",
        email: "",
        phone: "",
        location: "",
        linkedin: ""
      },
      professionalTitle: "",
      professionalSummary: "",
      enableProfessionalSummary: false,
      skills: {
        technical: [],
        tools: [],
        soft_skills: [],
        languages: []
      },
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      customSections: []
    }

    const baseInsert = convertToSupabaseFormat(initialData)
    const { data: newRecord, error: createError } = await supabase
      .from('resume_data')
      .insert({ ...baseInsert, user_id: authUserId })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create resume data: ${createError.message}`)
    }

    this.currentResumeId = newRecord.id
    return {
      id: newRecord.id,
      data: initialData
    }
  }

  // Save resume data and sync with user profile
  async saveResumeData(resumeData: ResumeDataType, template?: string): Promise<void> {
    if (!this.currentResumeId) {
      await this.getOrCreateResumeData()
    }

    const sessionId = getOrCreateSessionId()
    try { await supabase.rpc('set_session_context', { session_id: sessionId }) } catch { /* ignore if not present */ }

    // Attach user_id if authenticated
    let authUserId: string | null = null
    try { const { data } = await supabase.auth.getUser(); authUserId = data.user?.id || null } catch {}

    const updateData = {
      ...convertToSupabaseFormat(resumeData),
      user_id: authUserId,
      last_template_used: template || 'swiss',
      last_accessed_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('resume_data')
      .update(updateData)
      .eq('id', this.currentResumeId)

    if (error) {
      throw new Error(`Failed to save resume data: ${error.message}`)
    }
    
    // Sync with user profile for matching
    await this.syncUserProfile(resumeData)
  }
  
  // Sync resume data with user profile for job matching
  async syncUserProfile(resumeData: ResumeDataType): Promise<void> {
    const sessionId = getOrCreateSessionId()
    const { skills, tools } = extractSkillsAndTools(resumeData)
    
    // Extract languages from skills
    const languages: string[] = []
    if (resumeData.skills?.languages) {
      resumeData.skills.languages.forEach(lang => {
        // Extract language codes (e.g., "English (C2)" -> "EN")
        if (lang.toLowerCase().includes('english')) languages.push('EN')
        if (lang.toLowerCase().includes('german') || lang.toLowerCase().includes('deutsch')) languages.push('DE')
      })
    }
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('session_id', sessionId)
      .single()
    
    const profileData = {
      session_id: sessionId,
      name: resumeData.personalInfo?.name || '',
      email: resumeData.personalInfo?.email || '',
      phone: resumeData.personalInfo?.phone || '',
      location: resumeData.personalInfo?.location || '',
      skills: skills,
      skills_canonical: skills, // Already canonicalized
      tools: tools,
      tools_canonical: tools, // Already canonicalized
      preferred_languages: languages.length > 0 ? languages : ['EN'],
      profile_completeness: calculateCompleteness(resumeData),
      profile_source: 'resume_sync',
      updated_at: new Date().toISOString()
    }
    
    if (existingProfile) {
      // Update existing profile
      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', existingProfile.id)
      
      if (!error) {
        this.currentUserProfileId = existingProfile.id
      }
    } else {
      // Create new profile
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select('id')
        .single()
      
      if (!error && newProfile) {
        this.currentUserProfileId = newProfile.id
      }
    }
  }
  
  // Get current user profile ID
  getUserProfileId(): string | null {
    return this.currentUserProfileId
  }

  // Update specific field
  async updateField(path: string, value: any): Promise<void> {
    if (!this.currentResumeId) {
      throw new Error('No active resume data')
    }

    const sessionId = getOrCreateSessionId()
    try { await supabase.rpc('set_session_context', { session_id: sessionId }) } catch { /* ignore if not present */ }

    // For complex nested updates, we'll fetch current data, update, and save back
    const { data: current, error: fetchError } = await supabase
      .from('resume_data')
      .select('*')
      .eq('id', this.currentResumeId)
      .single()

    if (fetchError || !current) {
      throw new Error('Failed to fetch current resume data')
    }

    const resumeData = convertFromSupabaseFormat(current)
    
    // Update the nested field
    const keys = path.split('.')
    let target = resumeData as any
    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]]
    }
    target[keys[keys.length - 1]] = value

    // Save back
    await this.saveResumeData(resumeData)
  }

  // Subscribe to real-time changes
  subscribeToChanges(callback: (data: ResumeDataType) => void): () => void {
    if (!this.currentResumeId) {
      throw new Error('No active resume data to subscribe to')
    }

    this.realtimeSubscription = supabase
      .channel(`resume-data-${this.currentResumeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resume_data',
          filter: `id=eq.${this.currentResumeId}`
        },
        (payload) => {
          const updatedData = convertFromSupabaseFormat(payload.new as SupabaseResumeData)
          callback(updatedData)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      if (this.realtimeSubscription) {
        supabase.removeChannel(this.realtimeSubscription)
        this.realtimeSubscription = null
      }
    }
  }

  // Clean up resources
  destroy(): void {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription)
      this.realtimeSubscription = null
    }
    this.currentResumeId = null
  }

  private async updateLastAccessed(id: string): Promise<void> {
    await supabase
      .from('resume_data')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', id)
  }
}

// Create the session context RPC function helper
export async function createSessionContextFunction() {
  const { error } = await supabase.rpc('create_session_context_function')
  if (error) {
    console.error('Failed to create session context function:', error)
  }
}
