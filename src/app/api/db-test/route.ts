import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Check if key tables exist by trying to query them
    const tableChecks = [];
    
    // Check user_profiles table
    try {
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      tableChecks.push({ table: 'user_profiles', exists: !userError, error: userError?.message });
    } catch (e) {
      tableChecks.push({ table: 'user_profiles', exists: false, error: 'Not found' });
    }
    
    // Check resume_data table
    try {
      const { data: resumeData, error: resumeError } = await supabase
        .from('resume_data')
        .select('id')
        .limit(1);
      tableChecks.push({ table: 'resume_data', exists: !resumeError, error: resumeError?.message });
    } catch (e) {
      tableChecks.push({ table: 'resume_data', exists: false, error: 'Not found' });
    }
    
    // Check jobs table
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .limit(1);
      tableChecks.push({ table: 'jobs', exists: !jobsError, error: jobsError?.message });
    } catch (e) {
      tableChecks.push({ table: 'jobs', exists: false, error: 'Not found' });
    }
    
    return NextResponse.json({ tableChecks });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ error: 'Database test failed' }, { status: 500 });
  }
}