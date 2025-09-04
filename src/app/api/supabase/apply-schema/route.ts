import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' }, 
        { status: 500 }
      );
    }

    console.log('🔄 Starting schema application...');

    // First create the companies table with basic fields
    const createCompaniesTable = `
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id TEXT UNIQUE,
        name TEXT NOT NULL,
        logo_url TEXT,
        website TEXT,
        linkedin_url TEXT,
        description TEXT,
        slogan TEXT,
        employee_count INTEGER,
        industry TEXT,
        location TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('📄 Creating companies table...');
    const { error: companiesError } = await supabase.rpc('exec_sql', { 
      sql: createCompaniesTable 
    });

    if (companiesError) {
      console.error('❌ Companies table creation failed:', companiesError);
    } else {
      console.log('✅ Companies table created successfully');
    }

    // Create the jobs table with basic fields
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
        external_id TEXT UNIQUE,
        
        title TEXT NOT NULL,
        description TEXT,
        location_city TEXT,
        location_country TEXT,
        work_mode TEXT CHECK (work_mode IN ('Remote', 'Hybrid', 'Onsite', 'Unknown')) DEFAULT 'Unknown',
        employment_type TEXT,
        seniority_level TEXT,
        salary_info TEXT,
        posted_at TIMESTAMP WITH TIME ZONE,
        linkedin_url TEXT,
        job_function TEXT,
        industries TEXT[],
        applicants_count INTEGER DEFAULT 0,
        is_werkstudent BOOLEAN DEFAULT FALSE,
        german_required TEXT CHECK (german_required IN ('DE', 'EN', 'both', 'unknown')) DEFAULT 'unknown',
        
        content_language TEXT CHECK (content_language IN ('DE', 'EN', 'unknown')) DEFAULT 'unknown',
        skills_original TEXT[],
        tools_original TEXT[],
        responsibilities_original TEXT[],
        nice_to_have_original TEXT[],
        benefits_original TEXT[],
        skills_canonical TEXT[],
        tools_canonical TEXT[],
        responsibilities_canonical TEXT[],
        nice_to_have_canonical TEXT[],
        benefits_canonical TEXT[],
        skills_canonical_flat TEXT[],
        tools_canonical_flat TEXT[],
        language_required TEXT CHECK (language_required IN ('DE', 'EN', 'BOTH', 'UNKNOWN')) DEFAULT 'UNKNOWN',
        remote_allowed BOOLEAN DEFAULT FALSE,
        hybrid_allowed BOOLEAN DEFAULT FALSE,
        onsite_required BOOLEAN DEFAULT FALSE,
        
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('📄 Creating jobs table...');
    const { error: jobsError } = await supabase.rpc('exec_sql', { 
      sql: createJobsTable 
    });

    if (jobsError) {
      console.error('❌ Jobs table creation failed:', jobsError);
    } else {
      console.log('✅ Jobs table created successfully');
    }

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS companies_external_id_idx ON companies(external_id);
      CREATE INDEX IF NOT EXISTS companies_industry_idx ON companies(industry);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_unique ON companies(name);
      
      CREATE INDEX IF NOT EXISTS jobs_external_id_idx ON jobs(external_id);
      CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs(company_id);
      CREATE INDEX IF NOT EXISTS jobs_location_city_idx ON jobs(location_city);
      CREATE INDEX IF NOT EXISTS jobs_work_mode_idx ON jobs(work_mode);
      CREATE INDEX IF NOT EXISTS jobs_is_werkstudent_idx ON jobs(is_werkstudent);
      CREATE INDEX IF NOT EXISTS jobs_posted_at_idx ON jobs(posted_at DESC);
      CREATE INDEX IF NOT EXISTS jobs_is_active_idx ON jobs(is_active);
    `;

    console.log('📄 Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: createIndexes 
    });

    if (indexError) {
      console.error('❌ Index creation failed:', indexError);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Create update trigger function
    const createTriggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    console.log('📄 Creating trigger function...');
    const { error: triggerFunctionError } = await supabase.rpc('exec_sql', { 
      sql: createTriggerFunction 
    });

    if (triggerFunctionError) {
      console.error('❌ Trigger function creation failed:', triggerFunctionError);
    } else {
      console.log('✅ Trigger function created successfully');
    }

    // Create triggers
    const createTriggers = `
      DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
      CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
      CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('📄 Creating triggers...');
    const { error: triggersError } = await supabase.rpc('exec_sql', { 
      sql: createTriggers 
    });

    if (triggersError) {
      console.error('❌ Triggers creation failed:', triggersError);
    } else {
      console.log('✅ Triggers created successfully');
    }

    console.log('✅ Basic schema application completed');

    return NextResponse.json({
      success: true,
      message: 'Basic schema applied successfully',
      tables_created: ['companies', 'jobs'],
      errors: {
        companies: companiesError?.message || null,
        jobs: jobsError?.message || null,
        indexes: indexError?.message || null,
        triggers: triggersError?.message || null
      }
    });

  } catch (error) {
    console.error('Schema application error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to apply schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Schema application endpoint',
    usage: 'POST to apply basic database schema'
  });
}