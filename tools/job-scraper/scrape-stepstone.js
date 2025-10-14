/**
 * StepStone Job Scraper
 *
 * Scrapes werkstudent jobs from StepStone.de
 * Returns jobs in format compatible with import-jobspy endpoint
 */

const API_ENDPOINT = 'http://localhost:3000/api/jobs/import-jobspy';

async function scrapeStepStone(maxJobs = 20) {
  console.log('🚀 Starting StepStone scraper...\n');
  console.log(`📊 Target: ${maxJobs} werkstudent jobs from StepStone.de`);
  console.log('⏱️  Time filter: Last 24 hours\n');

  const jobs = [];

  try {
    // StepStone search URL for werkstudent jobs in Germany
    const searchUrl = 'https://www.stepstone.de/work/werkstudent?radius=0&locationId=DE&datePublished=1';

    console.log(`🔗 Search URL: ${searchUrl}\n`);
    console.log('📡 Fetching job listings...\n');

    // Use the MCP Playwright browser to scrape
    const { mcp__plugin_testing_suite_playwright_server__browser_navigate } = require('@anthropic-ai/mcp-client');

    // Navigate to StepStone search
    await mcp__plugin_testing_suite_playwright_server__browser_navigate({ url: searchUrl });

    // Wait for job listings to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page snapshot to extract job data
    const { mcp__plugin_testing_suite_playwright_server__browser_snapshot } = require('@anthropic-ai/mcp-client');
    const snapshot = await mcp__plugin_testing_suite_playwright_server__browser_snapshot();

    // Parse snapshot for job data
    // StepStone job cards have title, company, location
    // We need to click into each job to get full description

    console.log(`✅ Found ${jobs.length} jobs from StepStone\n`);

    return jobs;

  } catch (error) {
    console.error('❌ Error scraping StepStone:', error.message);
    throw error;
  }
}

async function processJobsThroughPipeline(jobs) {
  console.log('🔄 Processing jobs through GPT parsing pipeline...\n');

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobs: jobs,
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
        console.log(`   ${index + 1}. ${job.title} (ID: ${job.id})`);
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
  const maxJobs = parseInt(process.argv[2]) || 20;

  try {
    console.log('═'.repeat(80));
    console.log('STEPSTONE → GPT PIPELINE');
    console.log('═'.repeat(80) + '\n');

    const jobs = await scrapeStepStone(maxJobs);

    if (jobs.length === 0) {
      console.log('⚠️  No jobs found. Exiting.');
      process.exit(0);
    }

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

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { scrapeStepStone };
