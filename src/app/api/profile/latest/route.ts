import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';
import { cookies } from 'next/headers';

/**
 * GET /api/profile/latest
 * Get the most recent user profile for tailor functionality
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 LATEST PROFILE: Fetching profile for authenticated user');
    const supabase = createServerSupabase(request)
    
    // Get session from cookies (optional for demo mode)
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('user_session')?.value
    const userEmail = cookieStore.get('user_email')?.value
    
    // Also try Supabase auth (Authorization header)
    let authUserId: string | null = null
    let authEmail: string | null = null
    try {
      const { data: authRes } = await (supabase as any).auth.getUser()
      if (authRes?.user) {
        authUserId = authRes.user.id || null
        authEmail = (authRes.user.email as string) || null
      }
    } catch (e) {
      console.log('🔍 LATEST PROFILE: auth.getUser() not available or failed')
    }
    
    // If we have neither cookies nor auth, bail out
    if (!sessionId && !userEmail && !authUserId && !authEmail) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }
    
    console.log('🔍 LATEST PROFILE: Using session:', sessionId, 'email:', userEmail);
    
    // First try to find a matching user profile to get the correct session_id
    let correctSessionId = sessionId;
    if (userEmail) {
      const { data: userProfilesByEmail, error: userError } = await supabase
        .from('user_profiles')
        .select('session_id')
        .eq('email', userEmail)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (!userError && userProfilesByEmail && userProfilesByEmail.length > 0) {
        correctSessionId = userProfilesByEmail[0].session_id;
        console.log('🔍 LATEST PROFILE: Found session via email:', correctSessionId);
      }
    }
    
    if (!correctSessionId && authUserId) {
      // Try by user_id
      const { data: userProfilesById } = await supabase
        .from('user_profiles')
        .select('session_id')
        .eq('user_id', authUserId)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (userProfilesById && userProfilesById.length > 0) {
        correctSessionId = userProfilesById[0].session_id;
        console.log('🔍 LATEST PROFILE: Found session via user_id:', correctSessionId);
      }
    }
    
    // As a final fallback, if we have auth user, try to read resume_data directly by user_id
    let resumeRecordByUser: any | null = null
    if (authUserId && !correctSessionId) {
      const { data: resumeByUser, error: resumeByUserErr } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', authUserId)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (!resumeByUserErr && resumeByUser && resumeByUser.length > 0) {
        resumeRecordByUser = resumeByUser[0]
        console.log('🔍 LATEST PROFILE: Found resume by user_id');
      }
    }
    
    // Get resume data for the specific user session (resume_data table uses session_id, not user_email)
    let resumeDataList: any[] | null = null
    let resumeError: any = null
    if (resumeRecordByUser) {
      resumeDataList = [resumeRecordByUser]
    } else if (correctSessionId) {
      const { data, error } = await supabase
        .from('resume_data')
        .select('*')
        .eq('session_id', correctSessionId)
        .order('updated_at', { ascending: false })
        .limit(1)
      resumeDataList = data
      resumeError = error
    }
    
    console.log('🔍 LATEST PROFILE: Resume query result - error:', resumeError)
    console.log('🔍 LATEST PROFILE: Resume query result - data count:', resumeDataList?.length || 0)
      
    let resumeData;
    
    if (!resumeError && resumeDataList && resumeDataList.length > 0) {
      // Use complete resume data
      const resumeRecord = resumeDataList[0];
      console.log('🔍 LATEST PROFILE: Found complete resume data');
      
      resumeData = {
        personalInfo: resumeRecord.personal_info,
        professionalTitle: resumeRecord.professional_title || '',
        professionalSummary: resumeRecord.professional_summary || '',
        enableProfessionalSummary: resumeRecord.enable_professional_summary || false,
        skills: resumeRecord.skills || {},
        experience: resumeRecord.experience || [],
        education: resumeRecord.education || [],
        projects: resumeRecord.projects || [],
        certifications: resumeRecord.certifications || [],
        customSections: resumeRecord.custom_sections || []
      };
      
      return NextResponse.json({
        success: true,
        profile: resumeRecord,
        resumeData: resumeData
      });
    }
    
    // No resume found for this session/user
    return NextResponse.json({ error: 'No resume data found' }, { status: 404 });
    
  } catch (error) {
    console.error('🔍 LATEST PROFILE: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
