/**
 * LinkedIn Job Scraper using Apify
 *
 * Fetches Werkstudent jobs from LinkedIn posted in the last 1-2 days across Germany,
 * then processes them through the existing GPT parsing pipeline.
 */

import { ApifyClient } from 'apify-client';

// Initialize Apify client
const client = new ApifyClient({
  token: 'APIFY_TOKEN_REMOVED',
});

// Use logical_scrapers actor - it works and returns Schema.org data
const ACTOR_ID = 'logical_scrapers/linkedin-jobs-scraper';

async function fetchWerkstudentJobs() {
  try {
    console.log('🚀 Starting LinkedIn Werkstudent job scraper...\n');

    // Get all Werkstudent jobs without date filter (we'll filter later)
    const input = {
      keywords: 'werkstudent',
      location: 'Germany',
      maxItems: 100,
      scrapeCompanyDetails: true,
      // No datePosted filter to get maximum results
    };

    console.log('📋 Actor Input:');
    console.log(JSON.stringify(input, null, 2));
    console.log('\n⏳ Running LinkedIn scraper actor...');

    // Run the actor and wait for it to finish
    const run = await client.actor(ACTOR_ID).call(input);

    console.log(`✅ Actor run completed: ${run.id}`);
    console.log(`📊 Status: ${run.status}`);
    console.log(`⏱️  Duration: ${Math.round((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000)}s\n`);

    // Fetch results from the dataset
    console.log('📥 Fetching results from dataset...');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`\n✅ Successfully fetched ${items.length} jobs from LinkedIn`);
    console.log('\n📋 Job listings:');
    console.log('═'.repeat(80));

    items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title || 'Unknown Title'}`);
      console.log(`   Company: ${item.companyName || 'Unknown Company'}`);
      console.log(`   Location: ${item.location || 'Unknown Location'}`);
      console.log(`   Posted: ${item.postedAt || 'Unknown Date'}`);
      console.log(`   URL: ${item.link || 'No URL'}`);
    });

    console.log('\n' + '═'.repeat(80));

    // Build dataset URL for the import-apify endpoint
    const datasetUrl = `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=APIFY_TOKEN_REMOVED`;

    console.log('\n🔄 Processing jobs through GPT parsing pipeline...');
    console.log(`📡 Dataset URL: ${datasetUrl}\n`);

    // Call the existing import-apify endpoint to process jobs
    const response = await fetch('http://localhost:3000/api/jobs/import-apify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetUrl: datasetUrl,
        limit: 20, // Process all 20 jobs
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Import failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();

    console.log('\n' + '═'.repeat(80));
    console.log('✅ PIPELINE COMPLETE');
    console.log('═'.repeat(80));
    console.log(`📊 Total fetched: ${result.totalFetched}`);
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
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the scraper
fetchWerkstudentJobs();
