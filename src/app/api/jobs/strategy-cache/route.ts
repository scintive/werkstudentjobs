import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

/**
 * GET /api/jobs/strategy-cache?job_id=xxx
 * Check if we have cached strategy for this job and user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')
    
    if (!jobId) {
      return NextResponse.json({ error: 'job_id required' }, { status: 400 })
    }

    // Get user session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    const userEmail = cookieStore.get('user_email')?.value
    
    if (!sessionId && !userEmail) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('🎯 CACHE: Checking for existing strategy for job:', jobId, 'session:', sessionId)

    // Check for existing strategy in resume_data table using custom_sections as cache
    // We'll use a special custom section with id 'strategy_cache' to store strategies
    let cacheQuery = supabase
      .from('resume_data')
      .select('custom_sections')
      .eq('session_id', sessionId || userEmail)
      .order('updated_at', { ascending: false })
      .limit(1)

    const { data: cachedStrategies, error: cacheError } = await cacheQuery

    if (cacheError) {
      console.error('🎯 CACHE: Error checking cache:', cacheError)
      return NextResponse.json({ cached: false })
    }

    if (cachedStrategies && cachedStrategies.length > 0) {
      const resumeData = cachedStrategies[0]
      const customSections = resumeData.custom_sections || []
      
      // Look for strategy cache in custom sections
      const strategyCacheSection = customSections.find((section: any) => 
        section.id === 'strategy_cache' && section.job_id === jobId
      )
      
      if (strategyCacheSection && strategyCacheSection.strategy_data) {
        console.log('🎯 CACHE: Found cached strategy!')
        
        // Check if cache is still valid (7 days)
        const cacheDate = new Date(strategyCacheSection.cached_at)
        const expiryDate = new Date(cacheDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
        
        if (new Date() < expiryDate) {
          return NextResponse.json({
            cached: true,
            strategy: strategyCacheSection.strategy_data,
            created_at: strategyCacheSection.cached_at,
            hit_count: (strategyCacheSection.hit_count || 0) + 1
          })
        } else {
          console.log('🎯 CACHE: Strategy cache expired, will regenerate')
        }
      }
    }

    return NextResponse.json({ cached: false })

  } catch (error) {
    console.error('🎯 CACHE: Error:', error)
    return NextResponse.json(
      { error: 'Failed to check cache' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jobs/strategy-cache
 * Save strategy result to cache
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id, strategy_data } = await request.json()
    
    if (!job_id || !strategy_data) {
      return NextResponse.json({ error: 'job_id and strategy_data required' }, { status: 400 })
    }

    // Get user session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    const userEmail = cookieStore.get('user_email')?.value
    
    if (!sessionId && !userEmail) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('🎯 CACHE: Saving strategy to resume custom_sections for caching')

    // Get current resume data
    const { data: resumeDataList, error: fetchError } = await supabase
      .from('resume_data')
      .select('*')
      .eq('session_id', sessionId || userEmail)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (fetchError || !resumeDataList || resumeDataList.length === 0) {
      console.error('🎯 CACHE: No resume data found for user')
      return NextResponse.json({ error: 'No resume data found' }, { status: 404 })
    }

    const resumeData = resumeDataList[0]
    let customSections = resumeData.custom_sections || []

    // Remove any existing strategy cache for this job
    customSections = customSections.filter((section: any) => 
      !(section.id === 'strategy_cache' && section.job_id === job_id)
    )

    // Add new strategy cache
    customSections.push({
      id: 'strategy_cache',
      type: 'cache',
      job_id: job_id,
      strategy_data: strategy_data,
      cached_at: new Date().toISOString(),
      hit_count: 1
    })

    // Update resume data with new cache
    const { error: updateError } = await supabase
      .from('resume_data')
      .update({
        custom_sections: customSections,
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeData.id)

    if (updateError) {
      console.error('🎯 CACHE: Error saving cache:', updateError)
      return NextResponse.json({ error: 'Failed to save cache' }, { status: 500 })
    }

    console.log('🎯 CACHE: Strategy saved to custom_sections successfully!')
    return NextResponse.json({ success: true, cache_location: 'custom_sections' })

  } catch (error) {
    console.error('🎯 CACHE: Error saving:', error)
    return NextResponse.json(
      { error: 'Failed to save to cache' },
      { status: 500 }
    )
  }
}