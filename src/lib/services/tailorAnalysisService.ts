/**
 * Simplified Tailor Analysis Service
 * Single responsibility: Manage analysis API calls and variant operations
 */

import { supabase } from '@/lib/supabase/client'

export interface AnalysisRequest {
  jobId: string
  baseResumeId: string
  baseResumeData: any
  jobData: any
}

export interface AnalysisResult {
  strategy: any
  tailoredResume: any
  suggestions: any[]
  variantId: string
}

export interface TailorVariant {
  id: string
  tailored_data: any
  created_at: string
}

class TailorAnalysisService {
  private activeRequests = new Map<string, Promise<AnalysisResult>>()

  /**
   * Get or create analysis for a job/resume pair
   * Prevents duplicate calls for the same job/resume
   */
  async getAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    const requestKey = `${request.jobId}-${request.baseResumeId}`
    
    console.log('🚀 getAnalysis called for:', requestKey)
    
    // If there's already a request in flight, return it
    if (this.activeRequests.has(requestKey)) {
      console.log('🔄 Reusing existing analysis request for:', requestKey)
      return this.activeRequests.get(requestKey)!
    }

    // Check if variant already exists BEFORE setting active request
    const existingVariant = await this.getExistingVariant(request.baseResumeId, request.jobId)
    if (existingVariant) {
      console.log('✅ Found existing variant, loading suggestions')
      const suggestions = await this.getVariantSuggestions(existingVariant.id)
      console.log(`📋 Loaded ${suggestions.length} suggestions from existing variant`)
      return {
        strategy: {},
        tailoredResume: existingVariant.tailored_data,
        suggestions,
        variantId: existingVariant.id
      }
    }

    console.log('🔍 No existing variant found, creating new analysis for:', requestKey)

    // Create new analysis request
    const analysisPromise = this.performAnalysis(request)
    this.activeRequests.set(requestKey, analysisPromise)

    try {
      const result = await analysisPromise
      console.log('✅ Analysis completed for:', requestKey)
      return result
    } catch (error) {
      console.error('❌ Analysis failed for:', requestKey, error)
      throw error
    } finally {
      this.activeRequests.delete(requestKey)
    }
  }

  /**
   * Check if a variant exists for this job/resume pair
   */
  private async getExistingVariant(baseResumeId: string, jobId: string): Promise<TailorVariant | null> {
    try {
      console.log('🔍 Checking for existing variant:', { baseResumeId, jobId })
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('resume_variants')
        .select('id, tailored_data, created_at')
        .eq('base_resume_id', baseResumeId)
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking for existing variant:', error)
        return null
      }

      if (data) {
        console.log('✅ Found existing variant:', data.id)
      } else {
        console.log('🆕 No existing variant found, will create new one')
      }

      return data
    } catch (error) {
      console.error('❌ Error in getExistingVariant:', error)
      return null
    }
  }

  /**
   * Get suggestions for a variant
   */
  private async getVariantSuggestions(variantId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('resume_suggestions')
        .select('*')
        .eq('variant_id', variantId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading variant suggestions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error loading suggestions:', error)
      return []
    }
  }

  /**
   * Perform new analysis via API
   */
  private async performAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    console.log('🚀 Starting new analysis')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message
    })
    
    if (!session || sessionError) {
      throw new Error(`Not authenticated: ${sessionError?.message || 'No session'}`)
    }

    console.log('📡 Making API call to analyze-with-tailoring with auth token')
    const response = await fetch('/api/jobs/analyze-with-tailoring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        job_id: request.jobId,
        base_resume_id: request.baseResumeId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Analysis failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    
    return {
      strategy: result.strategy || {},
      tailoredResume: result.tailored_resume || {},
      suggestions: result.atomic_suggestions || [],
      variantId: result.variant_id
    }
  }

  /**
   * Apply a suggestion (accept/decline)
   */
  async applySuggestion(suggestionId: string, action: 'accept' | 'decline'): Promise<void> {
    console.log(`🚨🚨 TAILOR ANALYSIS SERVICE ${action.toUpperCase()} CALLED:`, {
      suggestionId,
      action,
      timestamp: new Date().toISOString()
    })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log(`🔄 Updating suggestion ${suggestionId} to status ${action}`)
      const { error } = await supabase
        .from('resume_suggestions')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'declined',
          applied_at: new Date().toISOString()
        })
        .eq('id', suggestionId)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Failed to ${action} suggestion: ${error.message}`)
      }

      console.log(`✅ TAILOR ANALYSIS SERVICE: Suggestion ${action}ed successfully:`, suggestionId)
    } catch (error) {
      console.error(`❌ TAILOR ANALYSIS SERVICE: Error ${action}ing suggestion:`, error)
      throw error
    }
  }

  /**
   * Update variant data (when suggestions are applied)
   */
  async updateVariant(variantId: string, updatedData: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('resume_variants')
        .update({ 
          tailored_data: updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Failed to update variant: ${error.message}`)
      }

      console.log('✅ Variant updated:', variantId)
    } catch (error) {
      console.error('Error updating variant:', error)
      throw error
    }
  }

  /**
   * Clear any pending requests (for cleanup)
   */
  clearPendingRequests(): void {
    this.activeRequests.clear()
  }
}

export const tailorAnalysisService = new TailorAnalysisService()