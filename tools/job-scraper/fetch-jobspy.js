/**
 * JobSpy Integration - Fetch jobs and process through GPT pipeline
 *
 * This script:
 * 1. Runs the Python JobSpy scraper to fetch jobs
 * 2. Reads the CSV output
 * 3. Converts to format compatible with import-apify endpoint
 * 4. Processes through existing GPT parsing pipeline
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

const execAsync = promisify(exec);

// Configuration
const JOBSPY_SCRIPT = '/Users/varunmishra/Documents/Projects/JobScan/test_jobspy.py';
const JOBSPY_DIR = '/Users/varunmishra/Documents/Projects/JobScan';
const API_ENDPOINT = 'http://localhost:3000/api/jobs/import-jobspy';

async function runJobSpy(resultsWanted = 1) {
  console.log('🚀 Starting JobSpy scraper...\n');
  console.log(`📊 Requesting ${resultsWanted} job(s) from: LinkedIn, Indeed, Glassdoor, Google`);
  console.log('⏱️  Time filter: Last 72 hours\n');

  try {
    // Create a temporary Python script with modified results_wanted
    // NOTE: Only using Indeed because it provides full job descriptions
    // Glassdoor jobs come without descriptions, making them useless for our GPT pipeline
    const tempScript = `#!/usr/bin/env python3
from jobspy import scrape_jobs
import pandas as pd
from datetime import datetime

print("Scraping ${resultsWanted} werkstudent job(s) from Indeed...")
print("Note: Only using Indeed - it provides full descriptions (Glassdoor doesn't)")

jobs = scrape_jobs(
    site_name=["indeed"],  # Only Indeed - has full descriptions
    search_term="werkstudent",
    location="Germany",
    results_wanted=${resultsWanted},
    hours_old=24,  # Last 24 hours
    country_indeed="germany"
)

print(f"\\nFound {len(jobs)} jobs from Indeed")

if len(jobs) > 0:
    # Save to CSV
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"werkstudent_jobs_{timestamp}.csv"
    jobs.to_csv(output_file, index=False)
    print(f"✓ Saved to: {output_file}")
    print(f"✓ Jobs with descriptions: {jobs['description'].notna().sum()}")
else:
    print("❌ No jobs found")
`;

    const tempScriptPath = path.join(JOBSPY_DIR, 'temp_scrape.py');
    await fs.writeFile(tempScriptPath, tempScript);

    // Run the Python script with python3.11 (JobSpy requires Python 3.10+)
    const { stdout, stderr } = await execAsync(`cd ${JOBSPY_DIR} && python3.11 temp_scrape.py`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    console.log(stdout);
    if (stderr) console.error('⚠️  Warnings:', stderr);

    // Clean up temp script
    await fs.unlink(tempScriptPath);

    // Find the most recent CSV file
    const files = await fs.readdir(JOBSPY_DIR);
    const csvFiles = files.filter(f => f.startsWith('werkstudent_jobs_') && f.endsWith('.csv'));

    if (csvFiles.length === 0) {
      throw new Error('No CSV output file found');
    }

    // Sort by filename (which includes timestamp) and get the latest
    csvFiles.sort().reverse();
    const latestCsv = csvFiles[0];
    const csvPath = path.join(JOBSPY_DIR, latestCsv);

    console.log(`\n📥 Reading jobs from: ${latestCsv}`);

    // Read and parse CSV
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const jobs = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`✅ Successfully parsed ${jobs.length} job(s) from CSV\n`);

    return jobs;

  } catch (error) {
    console.error('❌ Error running JobSpy:', error.message);
    throw error;
  }
}

function convertJobSpyToApiFormat(jobspyJob) {
  // Convert JobSpy format to a format compatible with our GPT parser
  return {
    title: jobspyJob.title || '',
    company: jobspyJob.company || '',
    location: jobspyJob.location || '',
    description: jobspyJob.description || '',
    date_posted: jobspyJob.date_posted || '',
    job_url: jobspyJob.job_url || jobspyJob.job_url_direct || '',
    job_type: jobspyJob.job_type || '',
    salary_min: jobspyJob.min_amount || null,
    salary_max: jobspyJob.max_amount || null,
    salary_interval: jobspyJob.interval || null,
    site: jobspyJob.site || '',
    emails: jobspyJob.emails || null,
    company_url: jobspyJob.company_url || jobspyJob.company_url_direct || null,
    company_logo: jobspyJob.company_logo || null,
    company_description: jobspyJob.company_description || null,
  };
}

async function processJobsThroughPipeline(jobs) {
  console.log('🔄 Processing jobs through GPT parsing pipeline...\n');

  try {
    // Convert jobs to API format
    const formattedJobs = jobs.map(convertJobSpyToApiFormat);

    // Call the import-jobspy endpoint
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs: formattedJobs,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Import failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();

    console.log('═'.repeat(80));
    console.log('✅ PIPELINE COMPLETE');
    console.log('═'.repeat(80));
    console.log(`📊 Total fetched: ${result.totalFetched || jobs.length}`);
    console.log(`✅ Successfully processed: ${result.processed}`);
    console.log(`❌ Failed: ${result.failed}`);

    if (result.jobs && result.jobs.length > 0) {
      console.log('\n📝 Processed Jobs:');
      result.jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company} (ID: ${job.id})`);
      });
    }

    if (result.failedJobs && result.failedJobs.length > 0) {
      console.log('\n❌ Failed Jobs:');
      result.failedJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
        console.log(`      Error: ${job.error}`);
      });
    }

    console.log('\n' + '═'.repeat(80));
    console.log('🎉 Done! Jobs are now in your database.');
    console.log('═'.repeat(80) + '\n');

    return result;

  } catch (error) {
    console.error('❌ Pipeline error:', error.message);
    throw error;
  }
}

async function main() {
  const resultsWanted = parseInt(process.argv[2]) || 1;

  try {
    console.log('═'.repeat(80));
    console.log('JOBSPY → GPT PIPELINE');
    console.log('═'.repeat(80) + '\n');

    // Step 1: Run JobSpy scraper
    const jobs = await runJobSpy(resultsWanted);

    if (jobs.length === 0) {
      console.log('⚠️  No jobs found. Exiting.');
      process.exit(0);
    }

    // Step 2: Process through GPT pipeline
    await processJobsThroughPipeline(jobs);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the scraper
main();
