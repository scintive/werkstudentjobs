'use client'

import { supabase } from '@/lib/supabase/client'
import type { ResumeData as ResumeDataType } from '@/lib/types'
import type { ResumeData as SupabaseResumeData, Database } from '@/lib/supabase/types'
// Authentication is required for all operations - no session-based access

// Convert between our ResumeData type and Supabase storage format
type ResumeDataInsert = Database['public']['Tables']['resume_data']['Insert']
function convertToSupabaseFormat(resumeData: ResumeDataType): Omit<ResumeDataInsert, 'id' | 'created_at' | 'updated_at' | 'last_accessed_at' | 'session_id'> {
  // Languages are now stored in a separate column, NOT in skills
  const languages = ((resumeData as unknown).languages || []).map((l: Record<string, any>) => {
    // Ensure consistent format
    if (typeof l === 'string') {
      return { name: l, proficiency: 'Not specified' }
    }
    return {
      name: l.name || l.language || '',
      language: l.language || l.name || '',
      proficiency: l.proficiency || l.level || 'Not specified',
      level: l.level || l.proficiency || 'Not specified'
    }
  })

  // Clean skills object - remove any language entries
  const skillsToSave = { ...(resumeData.skills || {}) }
  delete skillsToSave.languages // Ensure no languages in skills

  return {
    // user_id will be added at call-site - authentication required
    personal_info: resumeData.personalInfo,
    professional_title: resumeData.professionalTitle || '',
    professional_summary: resumeData.professionalSummary || '',
    enable_professional_summary: resumeData.enableProfessionalSummary || false,
    skills: skillsToSave,
    experience: resumeData.experience,
    education: resumeData.education,
    projects: resumeData.projects || null,
    certifications: resumeData.certifications || null,
    custom_sections: resumeData.customSections || null,
    // languages: languages, // Store languages in separate column - Commented out due to type mismatch
    last_template_used: 'swiss', // Default template
    is_active: true,
    profile_completeness: calculateCompleteness(resumeData)
  }
}

function convertFromSupabaseFormat(supabaseData: SupabaseResumeData): ResumeDataType {
  // Languages now come from the separate languages column
  const rawLangs: unknown[] = (supabaseData as unknown).languages || []
  const skillsObj: unknown = (supabaseData.skills as unknown) || {}
  // Remove any legacy language entries from skills
  delete skillsObj.languages
  const parsedLanguages = rawLangs.map((entry: Record<string, any>) => {
    if (typeof entry === 'string') {
      // Handle legacy string format
      const name = entry.replace(/\s*\([^)]*\)\s*$/, '').trim()
      const levelMatch = entry.match(/\(([^)]+)\)/)
      const level = levelMatch ? levelMatch[1] : 'Not specified'
      return { name, language: name, level, proficiency: level }
    }
    // Return with both name/language and level/proficiency for compatibility
    return {
      name: (entry?.name ?? entry?.language ?? '').toString(),
      language: (entry?.language ?? entry?.name ?? '').toString(),
      level: (entry?.level ?? entry?.proficiency ?? 'Not specified').toString(),
      proficiency: (entry?.proficiency ?? entry?.level ?? 'Not specified').toString()
    }
  })

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
    customSections: supabaseData.custom_sections as ResumeDataType['customSections'],
    languages: parsedLanguages
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
  private realtimeSubscription: unknown = null

  static getInstance(): ResumeDataService {
    if (!this.instance) {
      this.instance = new ResumeDataService()
    }
    return this.instance
  }

  // Get or create resume data for current session
  async getOrCreateResumeData(): Promise<{ id: string; data: ResumeDataType }> {
    // Require authentication for resume creation
    const { data: authData } = await supabase.auth.getUser()
    const authUserId = authData.user?.id
    
    if (!authUserId) {
      throw new Error('Authentication required. Please sign in to create or access resumes.')
    }

    // Try to find existing resume data for this authenticated user
    const { data: existing, error: fetchError } = await supabase
      .from('resume_data')
      .select('*')
      .eq('user_id', authUserId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing && !fetchError) {
      this.currentResumeId = (existing as unknown).id
      await this.updateLastAccessed((existing as unknown).id)
      return {
        id: (existing as unknown).id,
        data: convertFromSupabaseFormat(existing as unknown)
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
      languages: [],  // Initialize empty languages array at top level
      skills: {
        technical: [],
        tools: [],
        soft_skills: []  // Removed languages from skills
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
      .insert({
        ...baseInsert,
        user_id: authUserId,  // Always set user_id for authenticated users
        session_id: null      // No longer using session fallback
      } as never)
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create resume data: ${createError.message}`)
    }

    this.currentResumeId = (newRecord as unknown).id
    return {
      id: (newRecord as unknown).id,
      data: initialData
    }
  }

  // Save resume data and sync with user profile
  async saveResumeData(resumeData: ResumeDataType, template?: string): Promise<void> {
    if (!this.currentResumeId) {
      await this.getOrCreateResumeData()
    }

    // Require authentication for saving
    const { data: authData } = await supabase.auth.getUser()
    const authUserId = authData.user?.id
    
    if (!authUserId) {
      throw new Error('Authentication required. Please sign in to save resume data.')
    }

    const updateData = {
      ...convertToSupabaseFormat(resumeData),
      user_id: authUserId,
      session_id: null, // No longer using session-based access
      last_template_used: template || 'swiss',
      last_accessed_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('resume_data')
      .update(updateData as never)
      .eq('id', this.currentResumeId || '')

    if (error) {
      throw new Error(`Failed to save resume data: ${error.message}`)
    }
    
    // Sync with user profile for matching
    await this.syncUserProfile(resumeData)
  }
  
  // Sync resume data with user profile for job matching
  async syncUserProfile(resumeData: ResumeDataType): Promise<void> {
    // Authentication required - get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Authentication required for profile sync')
    }
    
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
      .eq('user_id', user.id)
      .single()
    
    const profileData = {
      user_id: user.id,
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
        .update(profileData as never)
        .eq('id', (existingProfile as unknown).id)

      if (!error) {
        this.currentUserProfileId = (existingProfile as unknown).id
      }
    } else {
      // Create new profile
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert(profileData as never)
        .select('id')
        .single()

      if (!error && newProfile) {
        this.currentUserProfileId = (newProfile as unknown).id
      }
    }
  }
  
  // Get current user profile ID
  getUserProfileId(): string | null {
    return this.currentUserProfileId
  }

  // Update specific field
  async updateField(path: string, value: unknown): Promise<void> {
    if (!this.currentResumeId) {
      throw new Error('No active resume data')
    }

    // Authentication required - no session context needed

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
    let target = resumeData as unknown
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
      .update({ last_accessed_at: new Date().toISOString() } as never)
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
