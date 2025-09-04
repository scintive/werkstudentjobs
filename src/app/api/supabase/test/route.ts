import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🗄️ Testing Supabase connectivity...');
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        message: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables',
        configured: false
      }, { status: 400 });
    }
    
    console.log('🗄️ Supabase configuration found, testing connection...');
    
    // Test basic connection by trying to query auth.users (should always exist)
    const { data: authTest, error: authError } = await supabase.auth.getSession();
    
    if (authError && !authError.message.includes('session')) {
      console.error('🗄️ Supabase connection failed:', authError);
      return NextResponse.json({
        success: false,
        error: 'Connection failed',
        details: authError.message,
        configured: true,
        connected: false
      }, { status: 500 });
    }
    
    console.log('🗄️ Basic connection successful, testing table access...');
    
    // Test table access by trying to query an existing table or create a test one
    // First, let's try to list existing tables
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    let tableAccess = false;
    let existingTables: string[] = [];
    
    if (!tablesError && tablesData) {
      tableAccess = true;
      existingTables = tablesData.map(t => t.table_name);
      console.log('🗄️ Found existing tables:', existingTables);
    }
    
    // Test if we can create a simple test table
    let canCreateTables = false;
    let createError = null;
    
    try {
      // Try to create a simple test table
      const { error: createTableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS supabase_test_table (
            id SERIAL PRIMARY KEY,
            test_column TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (!createTableError) {
        canCreateTables = true;
        console.log('🗄️ Table creation test successful');
        
        // Clean up test table
        await supabase.rpc('exec_sql', {
          sql: 'DROP TABLE IF EXISTS supabase_test_table;'
        });
      } else {
        createError = createTableError.message;
        console.warn('🗄️ Table creation test failed:', createError);
      }
    } catch (error) {
      createError = error instanceof Error ? error.message : 'Unknown create error';
      console.warn('🗄️ Table creation test error:', createError);
    }
    
    // Test if our expected tables exist
    const expectedTables = ['companies', 'jobs', 'user_profiles', 'job_match_results'];
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      tableAccess,
      canCreateTables,
      existingTables,
      expectedTables,
      missingTables,
      createError,
      message: 'Supabase connectivity test completed',
      recommendations: missingTables.length > 0 ? [
        'Run the schema.sql file to create missing tables',
        'Ensure database user has CREATE permissions',
        'Check if RLS (Row Level Security) policies are needed'
      ] : ['All expected tables exist, ready for migration']
    });
    
  } catch (error) {
    console.error('🗄️ Supabase test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      configured: isSupabaseConfigured(),
      connected: false
    }, { status: 500 });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}