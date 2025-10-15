'use client'

import { supabase } from '@/lib/supabase/client'
import type { ResumeData } from '@/lib/types'
import { ResumeDataService } from '@/lib/services/resumeDataService'

export interface JobMatchResult {
  job_id: string
  company_id: string
  title: string
  overall_score: number
  skills_score: number
  tools_score: number
  language_score: number
  location_score: number
  skills_matched: string[]
  skills_missing: string[]
  tools_matched: string[]
  tools_missing: string[]
  match_explanation: string
  // Additional job details we'll fetch
  company_name?: string
  location?: string
  work_mode?: string
  contract_type?: string
  salary_info?: string
  posted_at?: string
  application_link?: string
}

export interface MatchCalculationOptions {
  limit?: number
  useCache?: boolean
  filters?: {
    minScore?: number
    workMode?: string[]
    contractType?: string[]
    location?: string[]
    mustHaveSkills?: string[]
  }
}

export class JobMatchingService {
  private static instance: JobMatchingService | null = null
  private cachedResults: Map<string, { data: JobMatchResult[], timestamp: number }> = new Map()
  private cacheExpiry = 3600000 // 1 hour in milliseconds
  private resumeService: ResumeDataService

  private constructor() {
    this.resumeService = ResumeDataService.getInstance()
  }

  static getInstance(): JobMatchingService {
    if (!this.instance) {
      this.instance = new JobMatchingService()
    }
    return this.instance
  }

  // Main matching function - calculates matches for current user
  async matchUserToJobs(options: MatchCalculationOptions = {}): Promise<JobMatchResult[]> {
    const { limit = 100, useCache = true, filters } = options
    
    // Get user profile ID from resume service
    let userProfileId = this.resumeService.getUserProfileId()
    
    if (!userProfileId) {
      // Try to get or create profile from session
      const sessionId = localStorage.getItem('resume_session_id')
      if (!sessionId) {
        console.error('No session ID found')
        return []
      }
      
      // Call Supabase function to get or create profile
      // Type assertion needed because Supabase type generation doesn't recognize this RPC function
      const { data: profileResult, error } = await (supabase as any)
        .rpc('get_or_create_user_profile_from_resume', { p_session_id: sessionId })
      
      if (error || !profileResult) {
        console.error('Failed to get user profile:', error)
        return []
      }
      
      userProfileId = profileResult
    }

    // Type guard to ensure userProfileId is not null after checks
    if (!userProfileId) {
      console.error('User profile ID is still null after retrieval attempt')
      return []
    }

    // Check cache if enabled
    if (useCache) {
      const cached = this.getCachedResults(userProfileId)
      if (cached) {
        return this.applyFilters(cached, filters)
      }
    }

    // Calculate matches using Supabase function
    const { data: matches, error } = await (supabase as any)
      .rpc('calculate_job_matches', {
        p_user_profile_id: userProfileId,
        p_limit: limit
      })
    
    if (error) {
      console.error('Failed to calculate matches:', error)
      return []
    }
    
    // Enhance with additional job details
    const enhancedMatches = await this.enhanceMatchResults(matches || [])
    
    // Cache results
    this.cacheResults(userProfileId, enhancedMatches)
    
    // Apply filters and return
    return this.applyFilters(enhancedMatches, filters)
  }
  
  // Save match results to database for persistence
  async saveMatchResults(userProfileId?: string): Promise<void> {
    if (!userProfileId) {
      const id = this.resumeService.getUserProfileId()
      if (!id) {
        throw new Error('No user profile ID available')
      }
      userProfileId = id
    }

    const { error } = await (supabase as any)
      .rpc('save_match_results', { p_user_profile_id: userProfileId })
    
    if (error) {
      throw new Error(`Failed to save match results: ${error.message}`)
    }
  }
  
  // Get saved match results from database
  async getSavedMatchResults(userProfileId?: string): Promise<JobMatchResult[]> {
    if (!userProfileId) {
      const id = this.resumeService.getUserProfileId()
      if (!id) {
        return []
      }
      userProfileId = id
    }

    const { data, error } = await supabase
      .from('job_match_results')
      .select(`
        *,
        jobs!inner (
          title,
          company_id,
          work_mode,
          contract_type,
          city,
          country,
          salary_min,
          salary_max,
          salary_currency,
          application_link,
          posted_at,
          companies!inner (
            name,
            logo_url,
            industry
          )
        )
      `)
      .eq('user_profile_id', userProfileId)
      .order('overall_score', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Failed to get saved results:', error)
      return []
    }

    // Type assertion needed for Supabase nested query result
    const typedData = data as any[] || []

    // Transform to our format
    return typedData.map(result => ({
      job_id: result.job_id,
      company_id: result.jobs.company_id,
      title: result.jobs.title,
      overall_score: result.overall_score,
      skills_score: result.skills_score,
      tools_score: result.tools_score,
      language_score: result.language_score,
      location_score: result.location_score,
      skills_matched: [],
      skills_missing: [],
      tools_matched: [],
      tools_missing: [],
      match_explanation: result.match_explanation,
      company_name: result.jobs.companies?.name,
      location: result.jobs.city ? `${result.jobs.city}, ${result.jobs.country}` : '',
      work_mode: result.jobs.work_mode,
      contract_type: result.jobs.contract_type,
      salary_info: this.formatSalary(result.jobs),
      posted_at: result.jobs.posted_at,
      application_link: result.jobs.application_link
    }))
  }
  
  // Enhance match results with additional job details
  private async enhanceMatchResults(matches: any[]): Promise<JobMatchResult[]> {
    if (!matches || matches.length === 0) return []
    
    const jobIds = matches.map(m => m.job_id)
    
    // Fetch job details with company info
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        company_id,
        work_mode,
        contract_type,
        city,
        country,
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        application_link,
        posted_at,
        linkedin_url,
        companies!inner (
          id,
          name,
          logo_url,
          industry,
          size_category
        )
      `)
      .in('id', jobIds)
    
    if (error) {
      console.error('Failed to fetch job details:', error)
      return matches // Return without enhancement
    }

    // Type assertion needed for Supabase nested query result
    const typedJobs = jobs as any[] || []

    // Create a map for quick lookup
    const jobMap = new Map(typedJobs.map(job => [job.id, job]))
    
    // Enhance matches
    return matches.map(match => {
      const job = jobMap.get(match.job_id)
      
      return {
        ...match,
        company_name: job?.companies?.name,
        location: job?.city ? `${job.city}, ${job.country}` : '',
        work_mode: job?.work_mode,
        contract_type: job?.contract_type,
        salary_info: this.formatSalary(job),
        posted_at: job?.posted_at,
        application_link: job?.application_link || job?.linkedin_url
      }
    })
  }
  
  // Format salary information
  private formatSalary(job: any): string {
    if (!job) return ''
    
    if (job.salary_min && job.salary_max) {
      const currency = job.salary_currency || 'EUR'
      const period = job.salary_period || 'yearly'
      const min = job.salary_min.toLocaleString()
      const max = job.salary_max.toLocaleString()
      return `${currency} ${min}-${max} ${period}`
    }
    
    return ''
  }
  
  // Apply filters to match results
  private applyFilters(matches: JobMatchResult[], filters?: any): JobMatchResult[] {
    if (!filters) return matches
    
    let filtered = [...matches]
    
    if (filters.minScore) {
      filtered = filtered.filter(m => m.overall_score >= filters.minScore)
    }
    
    if (filters.workMode && filters.workMode.length > 0) {
      filtered = filtered.filter(m => filters.workMode.includes(m.work_mode))
    }
    
    if (filters.contractType && filters.contractType.length > 0) {
      filtered = filtered.filter(m => filters.contractType.includes(m.contract_type))
    }
    
    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(m => 
        filters.location.some((loc: string) => 
          m.location?.toLowerCase().includes(loc.toLowerCase())
        )
      )
    }
    
    if (filters.mustHaveSkills && filters.mustHaveSkills.length > 0) {
      filtered = filtered.filter(m => 
        filters.mustHaveSkills.every((skill: string) => 
          m.skills_matched.some(s => s.toLowerCase() === skill.toLowerCase())
        )
      )
    }
    
    return filtered
  }
  
  // Cache management
  private getCachedResults(userProfileId: string): JobMatchResult[] | null {
    const cached = this.cachedResults.get(userProfileId)
    
    if (!cached) return null
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cachedResults.delete(userProfileId)
      return null
    }
    
    return cached.data
  }
  
  private cacheResults(userProfileId: string, results: JobMatchResult[]): void {
    this.cachedResults.set(userProfileId, {
      data: results,
      timestamp: Date.now()
    })
  }
  
  // Clear cache for a specific user or all users
  clearCache(userProfileId?: string): void {
    if (userProfileId) {
      this.cachedResults.delete(userProfileId)
    } else {
      this.cachedResults.clear()
    }
  }
  
  // Subscribe to real-time match updates
  subscribeToMatchUpdates(
    userProfileId: string,
    callback: (matches: JobMatchResult[]) => void
  ): () => void {
    const subscription = supabase
      .channel(`match-updates-${userProfileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_match_results',
          filter: `user_profile_id=eq.${userProfileId}`
        },
        async () => {
          // Fetch updated results
          const results = await this.getSavedMatchResults(userProfileId)
          callback(results)
        }
      )
      .subscribe()
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription)
    }
  }
}