import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/auth/ensure-session
 * Ensures the browser has a valid session cookie for a user with resume data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔒 ENSURE SESSION: Checking and fixing session state...');
    
    const cookieStore = await cookies();
    const currentSession = cookieStore.get('user_session')?.value;
    const currentEmail = cookieStore.get('user_email')?.value;
    
    console.log('🔒 Current session:', currentSession);
    console.log('🔒 Current email:', currentEmail);
    
    // Check if current session has resume data
    if (currentSession) {
      const { data: resumeData, error: resumeError } = await supabase
        .from('resume_data')
        .select('id, personal_info')
        .eq('session_id', currentSession)
        .limit(1);
      
      if (!resumeError && resumeData && resumeData.length > 0) {
        console.log('🔒 Current session has valid resume data:', resumeData[0]?.personal_info?.name);
        return NextResponse.json({
          success: true,
          message: 'Session is valid',
          session: currentSession,
          hasResumeData: true
        });
      }
    }
    
    // Find a session that has resume data
    console.log('🔒 Current session invalid/missing, finding valid session...');
    
    // Get all recent resume_data entries (don't filter by name as it might be structured differently)
    const { data: availableSessions, error: sessionError } = await supabase
      .from('resume_data')
      .select('session_id, personal_info, id')
      .not('personal_info', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    console.log('🔒 Found sessions:', availableSessions?.length || 0);
    console.log('🔒 Session data sample:', availableSessions?.[0]);
    
    if (sessionError || !availableSessions || availableSessions.length === 0) {
      console.log('🔒 No valid sessions found, error:', sessionError);
      return NextResponse.json({
        success: false,
        message: 'No valid sessions with resume data found',
        error: sessionError?.message
      }, { status: 404 });
    }
    
    // Use the most recent valid session
    const validSession = availableSessions[0];
    console.log('🔒 Found valid session:', validSession.session_id, 'for user:', validSession.personal_info?.name);
    
    // Find the corresponding user profile for email
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('session_id', validSession.session_id)
      .limit(1);
    
    const userEmail = userProfile?.[0]?.email || validSession.personal_info?.email;
    
    // Set the correct cookies
    const response = NextResponse.json({
      success: true,
      message: 'Session updated to valid session',
      session: validSession.session_id,
      email: userEmail,
      hasResumeData: true
    });
    
    // Set cookies with proper settings
    response.cookies.set('user_session', validSession.session_id, {
      httpOnly: true,
      secure: false, // localhost development
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    if (userEmail) {
      response.cookies.set('user_email', userEmail, {
        httpOnly: true,
        secure: false, // localhost development
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }
    
    console.log('🔒 Session cookies updated successfully');
    
    return response;
    
  } catch (error) {
    console.error('🔒 Error ensuring session:', error);
    return NextResponse.json(
      { error: 'Failed to ensure session' },
      { status: 500 }
    );
  }
}