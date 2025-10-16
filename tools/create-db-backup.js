#!/usr/bin/env node
// Database backup script
// Usage: node tools/create-db-backup.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BACKUP_DIR = `backups/database-backup-${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}-${new Date().toTimeString().split(' ')[0].replace(/:/g, '')}`;

// Tables to backup (in order to handle foreign keys)
const TABLES = [
  'user_profiles',
  'user_sessions',
  'resume_data',
  'resume_variants',
  'resume_suggestions',
  'companies',
  'jobs',
  'job_match_results',
  'ai_cache',
  'link_verifications',
  'cover_letters'
];

async function backupTable(tableName) {
  console.log(`Backing up table: ${tableName}`);

  try {
    // Fetch all data from table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`Error backing up ${tableName}:`, error.message);
      return;
    }

    // Save to JSON file
    const filePath = path.join(BACKUP_DIR, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✓ Backed up ${tableName}: ${data?.length || 0} rows`);
  } catch (err) {
    console.error(`Failed to backup ${tableName}:`, err.message);
  }
}

async function getTableSchema(tableName) {
  console.log(`Getting schema for: ${tableName}`);

  try {
    const { data, error } = await supabase.rpc('get_table_schema', {
      table_name: tableName
    });

    if (error) {
      // Fallback: just note that schema export failed
      console.warn(`Schema export skipped for ${tableName}`);
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`Schema export skipped for ${tableName}`);
    return null;
  }
}

async function main() {
  console.log('=== Starting Database Backup ===');
  console.log(`Backup directory: ${BACKUP_DIR}`);

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Backup each table
  for (const table of TABLES) {
    await backupTable(table);
  }

  // Create metadata file
  const metadata = {
    timestamp: new Date().toISOString(),
    tables: TABLES,
    supabaseUrl: supabaseUrl,
    backupCompleted: true
  };

  fs.writeFileSync(
    path.join(BACKUP_DIR, '_metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log('\n✓ Database backup completed!');
  console.log(`Backup location: ${BACKUP_DIR}`);
}

main().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
