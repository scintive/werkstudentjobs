#!/usr/bin/env node
/**
 * Remove duplicate jobs from database
 * Keeps the newest version of each duplicate job
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicates() {
  console.log('=' .repeat(60));
  console.log('🗑️  DUPLICATE REMOVAL TOOL');
  console.log('=' .repeat(60));
  
  try {
    // Fetch all jobs
    console.log('\n📊 Fetching all jobs...');
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, portal_link, title, company_id, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Found ${jobs.length} total jobs`);
    
    // Find duplicates by portal_link
    const linkMap = new Map();
    const duplicates = [];
    
    jobs.forEach(job => {
      if (!job.portal_link) return; // Skip jobs without portal_link
      
      if (linkMap.has(job.portal_link)) {
        // Duplicate found - keep the newer one
        const existing = linkMap.get(job.portal_link);
        const existingDate = new Date(existing.created_at);
        const currentDate = new Date(job.created_at);
        
        if (currentDate > existingDate) {
          // Current is newer, mark existing as duplicate
          duplicates.push(existing.id);
          linkMap.set(job.portal_link, job);
        } else {
          // Existing is newer, mark current as duplicate
          duplicates.push(job.id);
        }
      } else {
        linkMap.set(job.portal_link, job);
      }
    });
    
    console.log(`\n🔍 Analysis:`);
    console.log(`   Total jobs: ${jobs.length}`);
    console.log(`   Unique portal_links: ${linkMap.size}`);
    console.log(`   Duplicate jobs to remove: ${duplicates.length}`);
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicates found! Database is clean.');
      return;
    }
    
    // Show some examples
    console.log(`\n📋 Sample duplicates (first 5):`);
    const sampleIds = duplicates.slice(0, 5);
    const { data: samples } = await supabase
      .from('jobs')
      .select('id, title, portal_link, created_at')
      .in('id', sampleIds);
    
    if (samples) {
      samples.forEach(job => {
        console.log(`   - ${job.title.substring(0, 50)}... (${new Date(job.created_at).toLocaleDateString()})`);
      });
    }
    
    // Delete duplicates in batches
    console.log(`\n🗑️  Removing ${duplicates.length} duplicate jobs...`);
    
    const BATCH_SIZE = 100;
    let deleted = 0;
    
    for (let i = 0; i < duplicates.length; i += BATCH_SIZE) {
      const batch = duplicates.slice(i, i + BATCH_SIZE);
      
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error(`❌ Error deleting batch: ${deleteError.message}`);
      } else {
        deleted += batch.length;
        console.log(`   ✅ Deleted ${deleted}/${duplicates.length} duplicates`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Removed ${deleted} duplicate jobs`);
    console.log(`📈 Database now has ${jobs.length - deleted} unique jobs`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeDuplicates();

