const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ieliwaibbkexqbudfher.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbGl3YWliYmtleHFidWRmaGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU2MzMwMiwiZXhwIjoyMDcxMTM5MzAyfQ.qBaCopOCwotNc9k_9_zT0-_0dx3jtniR5fW0I_LW11o'
);

async function clearAll() {
  console.log('🗑️  Deleting ALL variants and cache...\n');
  
  // Delete variants
  const { data: variants, error: varErr } = await supabase
    .from('resume_variants')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000');

  console.log('Variants delete result:', varErr ? `Error: ${varErr.message}` : `Success`);

  // Delete cache
  const { data: cache, error: cacheErr } = await supabase
    .from('job_analysis_cache')
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000');

  console.log('Cache delete result:', cacheErr ? `Error: ${cacheErr.message}` : `Success`);

  console.log('\n✅ Done!');
}

clearAll();
