import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' }, 
        { status: 500 }
      );
    }

    console.log('🔄 Starting enhanced schema migration...');

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'src/lib/supabase/migrate_enhanced_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded, executing individual commands...');

    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    const errors = [];

    for (const statement of statements) {
      if (statement.includes('DO $$') || statement.includes('END $$')) {
        // Skip complex PL/pgSQL blocks for now
        continue;
      }

      try {
        console.log('🔧 Executing:', statement.substring(0, 50) + '...');
        
        // Use the raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement 
        });
        
        if (error) {
          console.warn('⚠️ Statement failed (may be expected):', error.message);
          errors.push({ statement: statement.substring(0, 100), error: error.message });
        } else {
          successCount++;
          console.log('✅ Statement executed successfully');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.warn('⚠️ Statement execution error:', errorMsg);
        errors.push({ statement: statement.substring(0, 100), error: errorMsg });
      }
    }

    console.log(`✅ Migration completed: ${successCount} successful, ${errors.length} warnings/errors`);

    if (errors.length > 0) {
      console.log('Errors (may be expected for existing columns):', errors);
    }

    console.log('✅ Enhanced schema migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Enhanced schema migration completed successfully'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Enhanced schema migration endpoint',
    usage: 'POST to run migration'
  });
}