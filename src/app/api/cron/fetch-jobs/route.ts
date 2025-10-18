import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

const execAsync = promisify(exec);

// Type definition for JobSpy CSV data
interface JobSpyCsvRow {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  date_posted?: string;
  job_url?: string;
  job_url_direct?: string;
  job_type?: string;
  min_amount?: string;
  max_amount?: string;
  interval?: string;
  site?: string;
  company_url?: string;
  company_url_direct?: string;
  company_logo?: string;
}

/**
 * Vercel Cron Job: Fetch jobs every 4 hours
 *
 * This endpoint is called by Vercel Cron on a schedule defined in vercel.json
 * Pipeline:
 * 1. Runs JobSpy Python scraper to fetch jobs from Indeed
 * 2. Parses CSV output
 * 3. Delegates to /api/jobs/import-jobspy which:
 *    - Processes each job through GPT pipeline
 *    - Creates/updates companies
 *    - Inserts new jobs into database
 *
 * Security: Protected by Vercel Cron Secret (CRON_SECRET env var)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow manual testing with special query parameter
    const url = new URL(request.url);
    const manualRun = url.searchParams.get('manual') === 'true';

    // Check Vercel Cron secret or custom API key (skip if manual run without secret set)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !manualRun) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log(`🕐 CRON JOB STARTED (${manualRun ? 'MANUAL' : 'SCHEDULED'}):`, new Date().toISOString());
    console.log('🎯 Running JobSpy scraper...');

    // Configuration for JobSpy
    const resultsWanted = 100; // Fetch 100 jobs daily
    const jobspyDir = process.env.JOBSPY_DIR || '/tmp/jobspy';

    // Ensure JobSpy directory exists
    try {
      await fs.mkdir(jobspyDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Create temporary Python script for JobSpy
    const tempScript = `#!/usr/bin/env python3
from jobspy import scrape_jobs
import pandas as pd
from datetime import datetime

print("Scraping ${resultsWanted} werkstudent job(s) from Indeed...")

jobs = scrape_jobs(
    site_name=["indeed"],
    search_term="werkstudent",
    location="Germany",
    results_wanted=${resultsWanted},
    hours_old=24,
    country_indeed="germany"
)

print(f"Found {len(jobs)} jobs from Indeed")

if len(jobs) > 0:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = "werkstudent_jobs_" + timestamp + ".csv"
    jobs.to_csv(output_file, index=False)
    print(f"Saved to: {output_file}")
else:
    print("No jobs found")
`;

    const tempScriptPath = path.join(jobspyDir, 'temp_scrape.py');
    await fs.writeFile(tempScriptPath, tempScript);

    console.log('📊 Fetching jobs from Indeed (last 24 hours)...');

    // Run the Python script
    const { stdout, stderr } = await execAsync(
      `cd ${jobspyDir} && python3 temp_scrape.py`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    console.log(stdout);
    if (stderr) console.warn('⚠️  Warnings:', stderr);

    // Clean up temp script
    await fs.unlink(tempScriptPath);

    // Find the most recent CSV file
    const files = await fs.readdir(jobspyDir);
    const csvFiles = files.filter(f => f.startsWith('werkstudent_jobs_') && f.endsWith('.csv'));

    if (csvFiles.length === 0) {
      throw new Error('No CSV output file found from JobSpy');
    }

    // Get the latest CSV
    csvFiles.sort().reverse();
    const latestCsv = csvFiles[0];
    const csvPath = path.join(jobspyDir, latestCsv);

    console.log(`📥 Reading jobs from: ${latestCsv}`);

    // Read and parse CSV
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const jobspyJobs = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`✅ Parsed ${jobspyJobs.length} job(s) from CSV`);

    // Type assert parsed CSV rows
    const typedJobs = jobspyJobs as JobSpyCsvRow[];

    // Convert JobSpy format to our API format
    const formattedJobs = typedJobs.map((job) => ({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      description: job.description || '',
      date_posted: job.date_posted || '',
      job_url: job.job_url || job.job_url_direct || '',
      job_type: job.job_type || '',
      salary_min: job.min_amount || null,
      salary_max: job.max_amount || null,
      salary_interval: job.interval || null,
      site: job.site || '',
      company_url: job.company_url || job.company_url_direct || null,
      company_logo: job.company_logo || null,
    }));

    console.log('🔄 Processing jobs through GPT pipeline...');

    // Call the import-jobspy endpoint
    const baseUrl = process.env.NEXTJS_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const importResponse = await fetch(`${baseUrl}/api/jobs/import-jobspy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs: formattedJobs,
      }),
    });

    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      throw new Error(`Import endpoint failed: ${errorText}`);
    }

    const result = await importResponse.json();

    console.log('✅ CRON JOB COMPLETED');
    console.log(`📊 Stats: ${result.processed} processed, ${result.failed} failed`);

    // Clean up old CSV files (keep only last 5)
    if (csvFiles.length > 5) {
      const filesToDelete = csvFiles.slice(5);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(jobspyDir, file));
      }
      console.log(`🧹 Cleaned up ${filesToDelete.length} old CSV files`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      timestamp: new Date().toISOString(),
      source: 'jobspy',
      ...result,
    });

  } catch (error) {
    console.error('❌ CRON JOB FAILED:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
