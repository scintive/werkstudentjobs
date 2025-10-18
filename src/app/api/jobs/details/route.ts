import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/jobs/details
 * Get detailed job information by job_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'job_id parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 JOB DETAILS: Fetching job ${jobId}`);
    
    // Fetch job with company information
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          name,
          logo_url,
          industry,
          size_category,
          headquarters,
          website_url
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error('🔍 JOB DETAILS: Error fetching job:', jobError);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Type assertion for jobData to fix Vercel build issues
    // Using Record<string, unknown> because Supabase's type inference doesn't handle nested select fields properly
    const jobDataTyped = jobData as Record<string, unknown>;
    const companiesObj = jobDataTyped.companies as Record<string, unknown> | undefined;
    console.log(`🔍 JOB DETAILS: Found job "${jobDataTyped.title as string}" at ${(companiesObj?.name as string) || (jobDataTyped.company_name as string)}`);
    
    return NextResponse.json(jobData);
    
  } catch (error) {
    console.error('🔍 JOB DETAILS: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}