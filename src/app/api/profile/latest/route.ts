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
    
    // Strict mode: require a session or user email
    if (!sessionId && !userEmail) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }
    
    console.log('🔍 LATEST PROFILE: Using session:', sessionId, 'email:', userEmail);
    
    // First try to find a matching user profile to get the correct session_id
    let correctSessionId = sessionId;
    if (userEmail) {
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select('session_id')
      .eq('email', userEmail)
      .order('updated_at', { ascending: false })
      .limit(1);
      
      if (!userError && userProfiles && userProfiles.length > 0) {
        correctSessionId = userProfiles[0].session_id;
        console.log('🔍 LATEST PROFILE: Found user profile session:', correctSessionId);
      }
    }
    
    // Get resume data for the specific user session (resume_data table uses session_id, not user_email)
    let resumeQuery = supabase
      .from('resume_data')
      .select('*')
      .eq('session_id', correctSessionId || '')
      .order('updated_at', { ascending: false })
      .limit(1)
    
    const { data: resumeDataList, error: resumeError } = await resumeQuery;
    
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
    
    // No resume found for this session
    return NextResponse.json(
      { error: 'No resume data for session' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('🔍 LATEST PROFILE: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
