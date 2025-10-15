import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * POST /api/profile/resolve
 * Get or create user profile ID from session
 */
export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 PROFILE: Resolving profile for session ${session_id}`);
    
    // Use existing RPC to get or create user profile
    const { data, error } = await (supabase as any)
      .rpc('get_or_create_user_profile_from_resume', {
        p_session_id: session_id
      });
    
    if (error) {
      console.error('Profile resolution failed:', error);
      return NextResponse.json(
        { 
          error: 'Profile resolution failed',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    if (!data || !data.user_profile_id) {
      return NextResponse.json(
        { error: 'No profile found for session' },
        { status: 404 }
      );
    }
    
    console.log(`🔍 PROFILE: Resolved to ${data.user_profile_id}`);
    
    return NextResponse.json({
      success: true,
      user_profile_id: data.user_profile_id,
      session_id: session_id,
      profile_exists: !!data.user_profile_id
    });
    
  } catch (error) {
    console.error('Profile resolve request failed:', error);
    return NextResponse.json(
      { 
        error: 'Profile resolution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to resolve profiles.' },
    { status: 405 }
  );
}
