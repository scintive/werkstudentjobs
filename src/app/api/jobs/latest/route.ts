import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch latest 10 active jobs with company information
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        city,
        country,
        employment_type,
        work_mode,
        created_at,
        company_id,
        german_required,
        is_werkstudent,
        skills,
        companies (
          name,
          logo_url
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform data to include company info
    const transformedJobs = jobs?.map(job => {
      const companies = job.companies as unknown as Record<string, unknown> | null | undefined;
      return {
        id: job.id,
        title: job.title,
        city: job.city,
        country: job.country,
        employment_type: job.employment_type,
        work_mode: job.work_mode,
        created_at: job.created_at,
        company_name: companies?.name || 'Company',
        company_logo: companies?.logo_url || null,
        german_required: job.german_required,
        is_werkstudent: job.is_werkstudent,
        skills: job.skills || []
      };
    }) || []

    return NextResponse.json({
      success: true,
      jobs: transformedJobs
    })
  } catch (error) {
    console.error('Unexpected error fetching latest jobs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch latest jobs'
    }, { status: 500 })
  }
}