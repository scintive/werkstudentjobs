import { NextRequest, NextResponse } from 'next/server';
import { jobStrategyService } from '@/lib/services/jobStrategyService';
import { createServerSupabase } from '@/lib/supabase/serverClient';

/**
 * POST /api/jobs/analyze
 * Generate Job Strategy with caching
 * Refactored to use jobStrategyService for better SoC
 * SECURITY FIX: Auth-only, no cookie-based sessions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase(request);

    // SECURITY FIX: Verify authentication
    let authUserId: string | null = null;
    try {
      const { data: authRes } = await supabase.auth.getUser();
      if (authRes?.user) {
        authUserId = authRes.user.id;
      }
    } catch (e) {
      console.log('🎯 STRATEGY: auth.getUser() failed:', e);
    }

    if (!authUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { job_id, user_profile_id } = await request.json();

    // Input validation
    if (!job_id || !user_profile_id) {
      return NextResponse.json(
        { error: 'job_id and user_profile_id are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 STRATEGY: Analyzing job ${job_id} for profile ${user_profile_id} (auth user: ${authUserId})`);

    // Delegate to service layer
    const strategy = await jobStrategyService.generateStrategy(job_id, user_profile_id);

    return NextResponse.json({
      success: true,
      strategy,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🎯 STRATEGY: Request failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('not found') ? 404 : 500;

    return NextResponse.json(
      {
        error: 'Strategy analysis failed',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze jobs.' },
    { status: 405 }
  );
}