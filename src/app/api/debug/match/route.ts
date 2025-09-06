import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/serverClient'
import { fastMatchingService } from '@/lib/services/fastMatchingService'

// GET /api/debug/match?id=<jobId>
// Returns normalized arrays and overlaps for a single job vs latest resume
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')
    if (!jobId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = createServerSupabase(request)

    // Get latest resume (prefer auth user, else latest row)
    let userId: string | null = null
    try {
      const { data } = await (supabase as any).auth.getUser()
      userId = data?.user?.id || null
    } catch {}

    let resume: any | null = null
    if (userId) {
      const { data } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
      resume = data?.[0] || null
    }
    if (!resume) {
      const { data } = await supabase
        .from('resume_data')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
      resume = data?.[0] || null
    }
    if (!resume) return NextResponse.json({ error: 'No resume' }, { status: 404 })

    // Build userProfile-like object used by fastMatchingService
    const resumeSkills = resume.skills || {}
    const normalize = (arr: any[]) =>
      (arr || []).map((s: any) => (typeof s === 'string' ? s : (s?.skill || s?.name || `${s}`)))

    const skillsObj: Record<string, string[]> = {}
    Object.entries(resumeSkills || {}).forEach(([k, v]: any) => {
      if (Array.isArray(v)) skillsObj[k] = normalize(v)
    })
    // Provide legacy buckets too
    const userProfile: any = {
      skills: {
        technology: [
          ...(skillsObj.technical || []),
          ...(skillsObj.core || []),
          ...(skillsObj.specialized || []),
          ...(skillsObj.tools || []),
          ...(skillsObj.data || []),
          ...(skillsObj.business || []),
          ...(skillsObj.interpersonal || []),
          ...(skillsObj.creative || []),
          ...(skillsObj.design || [])
        ],
        soft_skills: [
          ...(skillsObj.interpersonal || []),
          ...(skillsObj.business || []),
          ...(skillsObj.core_soft || [])
        ],
        design: [
          ...(skillsObj.creative || []),
          ...(skillsObj.design || []),
          ...(skillsObj.tools || [])
        ],
        ...skillsObj
      },
      personal_details: { city: resume.personal_info?.location || null }
    }

    // Load job
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    // Calculate using the same service
    const match = await fastMatchingService.calculateJobMatch(job as any, userProfile as any)

    return NextResponse.json({
      jobId,
      totalScore: match.totalScore,
      skillsOverlap: {
        matched: match.breakdown.skills.matchedSkills,
        coverage: match.breakdown.skills.coverage,
      },
      toolsOverlap: {
        matched: match.breakdown.tools.matchedSkills,
        coverage: match.breakdown.tools.coverage,
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'debug failed', details: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

