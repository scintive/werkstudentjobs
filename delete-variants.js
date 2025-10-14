const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ieliwaibbkexqbudfher.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbGl3YWliYmtleHFidWRmaGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjE1MjUsImV4cCI6MjA1ODY5NzUyNX0.z2iw9VJiY1sFz_Mra38V7nqjTYMfAcBgJh0ckHZvdQI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllVariants() {
  console.log('🗑️  Deleting all resume variants...');
  
  const { data, error } = await supabase
    .from('resume_variants')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ All variants deleted');
  }

  // Also delete job analysis cache
  console.log('\n🗑️  Deleting job analysis cache...');
  const { error: cacheError } = await supabase
    .from('job_analysis_cache')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (cacheError) {
    console.error('❌ Cache error:', cacheError);
  } else {
    console.log('✅ Cache cleared');
  }
}

deleteAllVariants();
