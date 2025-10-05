import { NextRequest, NextResponse } from 'next/server';
import { jobStrategyService } from '@/lib/services/jobStrategyService';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/client';

/**
 * POST /api/jobs/analyze
 * Generate Job Strategy with caching
 * Refactored to use jobStrategyService for better SoC
 */
export async function POST(request: NextRequest) {
  try {
    const { job_id, user_profile_id } = await request.json();

    // Input validation
    if (!job_id || !user_profile_id) {
      return NextResponse.json(
        { error: 'job_id and user_profile_id are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 STRATEGY: Analyzing job ${job_id} for profile ${user_profile_id}`);

    // Set session context for RLS
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get('user_session')?.value;
      if (sessionId) {
        await supabase.rpc('set_session_context', { session_id: sessionId });
        console.log(`🎯 STRATEGY: Set session context: ${sessionId}`);
      }
    } catch (error) {
      console.log('🎯 STRATEGY: Session context not available, continuing...');
    }

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