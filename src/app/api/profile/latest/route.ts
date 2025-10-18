import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';

/**
 * GET /api/profile/latest
 * Get the most recent user profile for tailor functionality
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    console.log('🔍 LATEST PROFILE: Fetching profile for authenticated user');
    console.log('🔍 LATEST PROFILE: Has Authorization header:', !!authHeader, 'length:', authHeader.length)
    const supabase = createServerSupabase(request)

    // SECURITY FIX: Only use Supabase auth, ignore legacy cookies
    let authUserId: string | null = null
    let authEmail: string | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: authRes } = await (supabase as any).auth.getUser()
      if (authRes?.user) {
        authUserId = authRes.user.id || null
        authEmail = (authRes.user.email as string) || null
      }
    } catch (e) {
      console.log('🔍 LATEST PROFILE: auth.getUser() not available or failed')
    }

    // If we have no auth, bail out
    if (!authUserId && !authEmail) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 })
    }

    console.log('🔍 LATEST PROFILE: Using authenticated user:', authUserId, 'email:', authEmail);

    // Get resume data ONLY by authenticated user_id - no fallback to sessions or cookies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: resumeDataList, error: resumeError } = await (supabase as any)
      .from('resume_data')
      .select('*')
      .eq('user_id', authUserId)
      .order('updated_at', { ascending: false })
      .limit(1)

    console.log('🔍 LATEST PROFILE: Resume query result - error:', resumeError)
    console.log('🔍 LATEST PROFILE: Resume query result - data count:', resumeDataList?.length || 0)
      
    let resumeData;
    
    if (!resumeError && resumeDataList && resumeDataList.length > 0) {
      // Use complete resume data
      const resumeRecord = resumeDataList[0] as Record<string, unknown>;
      console.log('🔍 LATEST PROFILE: Found complete resume data');

      // Get photo and student info from user_profiles if available
      let photoUrl = resumeRecord.photo_url || null;
      let hoursAvailable = null;
      let currentSemester = null;
      let universityName = null;
      let startPreference = null;
      console.log('📸 PHOTO DEBUG: resume_data.photo_url =', photoUrl);

      if (authUserId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile, error: profileError } = await (supabase as any)
          .from('user_profiles')
          .select('photo_url, hours_available, current_semester, university_name, start_preference')
          .eq('user_id', authUserId)
          .single();

        console.log('👨‍🎓 PROFILE QUERY: error =', profileError, 'has data =', !!profile);

        if (profile && !profileError) {
          const profileData = profile as Record<string, unknown>;
          if (profileData.photo_url) {
            photoUrl = profileData.photo_url;
            console.log('📸 PHOTO DEBUG: Got photo from user_profiles =', photoUrl);
          }
          hoursAvailable = profileData.hours_available;
          currentSemester = profileData.current_semester;
          universityName = profileData.university_name;
          startPreference = profileData.start_preference;
          console.log('👨‍🎓 STUDENT INFO: hours_available =', hoursAvailable, 'semester =', currentSemester);
        } else {
          console.log('👨‍🎓 STUDENT INFO: No user_profiles data found or error occurred');
        }
      }

      console.log('📸 PHOTO DEBUG: Final photoUrl in resumeData =', photoUrl);

      resumeData = {
        personalInfo: resumeRecord.personal_info,
        photoUrl: photoUrl,
        professionalTitle: resumeRecord.professional_title || '',
        professionalSummary: resumeRecord.professional_summary || '',
        enableProfessionalSummary: resumeRecord.enable_professional_summary || false,
        skills: resumeRecord.skills || {},
        experience: resumeRecord.experience || [],
        education: resumeRecord.education || [],
        projects: resumeRecord.projects || [],
        certifications: resumeRecord.certifications || [],
        customSections: resumeRecord.custom_sections || [],
        languages: resumeRecord.languages || [], // Include languages from separate column
        // Student info from user_profiles
        hours_available: hoursAvailable,
        current_semester: currentSemester,
        university_name: universityName,
        start_preference: startPreference
      };
      
      return NextResponse.json({
        success: true,
        profile: resumeRecord,
        resumeData: resumeData
      });
    }
    
    // No resume found for this session/user
    console.log('🔍 LATEST PROFILE: No resume data found for session/user');
    return NextResponse.json({ error: 'No resume data found' }, { status: 404 });
    
  } catch (error) {
    console.error('🔍 LATEST PROFILE: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
