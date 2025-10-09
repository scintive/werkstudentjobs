/**
 * Apify Job Scraping Service
 *
 * Fetches latest Werkstudent and Internship jobs from multiple sources:
 * - LinkedIn
 * - Indeed Germany
 * - StepStone
 * - XING
 * - Bundesagentur für Arbeit
 */

const APIFY_API_KEY = process.env.APIFY_API_KEY;
const APIFY_API_BASE = 'https://api.apify.com/v2';

// Actor IDs for different job boards
const ACTORS = {
  linkedin: 'curious_coder/linkedin-jobs-search-scraper',
  indeed: 'curious_coder/indeed-scraper',
  stepstone: 'easyapi/stepstone-jobs-scraper',
  xing: 'easyapi/xing-jobs-scraper',
  bundesagentur: 'lexis-solutions/bundesagentur-fur-arbeit-arbeitsagentur-scraper'
};

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedDate?: string;
  salary?: string;
  workMode?: string;
  source: 'linkedin' | 'indeed' | 'stepstone' | 'xing' | 'bundesagentur';
}

interface ActorRunResult {
  datasetId: string;
  status: string;
}

/**
 * Start an Apify actor and wait for it to finish
 */
async function runActor(
  actorId: string,
  input: Record<string, any>
): Promise<ActorRunResult> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY is not set in environment variables');
  }

  // Start the actor
  const startResponse = await fetch(
    `${APIFY_API_BASE}/acts/${actorId}/runs?token=${APIFY_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  );

  if (!startResponse.ok) {
    throw new Error(`Failed to start actor ${actorId}: ${await startResponse.text()}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;

  console.log(`🚀 Started ${actorId}, run ID: ${runId}`);

  // Poll for completion (max 5 minutes)
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await fetch(
      `${APIFY_API_BASE}/acts/${actorId}/runs/${runId}?token=${APIFY_API_KEY}`
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to check run status: ${await statusResponse.text()}`);
    }

    const statusData = await statusResponse.json();
    const status = statusData.data.status;

    console.log(`📊 ${actorId} status: ${status}`);

    if (status === 'SUCCEEDED') {
      return {
        datasetId: statusData.data.defaultDatasetId,
        status: 'SUCCEEDED',
      };
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status}: ${actorId}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Actor run timed out after ${maxWaitTime / 1000} seconds`);
}

/**
 * Fetch data from Apify dataset
 */
async function fetchDataset(datasetId: string, limit: number = 100): Promise<any[]> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY is not set');
  }

  const response = await fetch(
    `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${APIFY_API_KEY}&limit=${limit}&clean=true`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Scrape LinkedIn jobs
 */
export async function scrapeLinkedInJobs(
  keywords: string[],
  location: string = 'Germany',
  limit: number = 5
): Promise<ScrapedJob[]> {
  console.log(`🔍 Scraping LinkedIn for: ${keywords.join(', ')} in ${location}`);

  const input = {
    keyword: keywords.join(' OR '),
    location,
    maxResults: limit,
  };

  const result = await runActor(ACTORS.linkedin, input);
  const data = await fetchDataset(result.datasetId, limit);

  return data.map((job: any) => ({
    title: job.title || job.position || '',
    company: job.company || job.companyName || '',
    location: job.location || '',
    description: job.description || job.jobDescription || '',
    url: job.link || job.url || '',
    postedDate: job.postedDate || job.posted || '',
    salary: job.salary || '',
    workMode: job.workMode || job.workArrangement || '',
    source: 'linkedin' as const,
  }));
}

/**
 * Scrape Indeed Germany jobs
 */
export async function scrapeIndeedJobs(
  keywords: string[],
  limit: number = 5
): Promise<ScrapedJob[]> {
  console.log(`🔍 Scraping Indeed.de for: ${keywords.join(', ')}`);

  // Build Indeed search URL for Germany
  const searchQuery = keywords.join('+');
  const searchUrl = `https://de.indeed.com/jobs?q=${searchQuery}&l=Deutschland`;

  const input = {
    searchUrl,
    maxItems: limit,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ['RESIDENTIAL'],
      apifyProxyCountry: 'DE',
    },
  };

  const result = await runActor(ACTORS.indeed, input);
  const data = await fetchDataset(result.datasetId, limit);

  return data.map((job: any) => ({
    title: job.title || job.jobTitle || '',
    company: job.company || job.companyName || '',
    location: job.location || '',
    description: job.description || job.jobDescription || '',
    url: job.url || job.link || '',
    postedDate: job.posted || job.postedDate || '',
    salary: job.salary || '',
    workMode: '',
    source: 'indeed' as const,
  }));
}

/**
 * Scrape StepStone Germany jobs
 */
export async function scrapeStepStoneJobs(
  keywords: string[],
  limit: number = 5
): Promise<ScrapedJob[]> {
  console.log(`🔍 Scraping StepStone.de for: ${keywords.join(', ')}`);

  // Build StepStone search URL
  const searchQuery = keywords.join('+');
  const searchUrl = `https://www.stepstone.de/5/ergebnisseite.html?what=${searchQuery}`;

  const input = {
    startUrls: [{ url: searchUrl }],
    maxItems: limit,
  };

  const result = await runActor(ACTORS.stepstone, input);
  const data = await fetchDataset(result.datasetId, limit);

  return data.map((job: any) => ({
    title: job.title || job.jobTitle || '',
    company: job.company || job.companyName || '',
    location: job.location || '',
    description: job.description || job.jobDescription || '',
    url: job.url || job.link || '',
    postedDate: job.postedAt || job.postedDate || '',
    salary: job.salary || '',
    workMode: job.remoteWork ? 'remote' : '',
    source: 'stepstone' as const,
  }));
}

/**
 * Scrape all sources and return combined results
 */
export async function scrapeAllSources(
  keywords: string[] = ['Werkstudent', 'Internship', 'Praktikum'],
  limitPerSource: number = 5
): Promise<ScrapedJob[]> {
  console.log(`🚀 Starting job scraping from all sources...`);

  const results: ScrapedJob[] = [];

  try {
    // Scrape LinkedIn
    const linkedinJobs = await scrapeLinkedInJobs(keywords, 'Germany', limitPerSource);
    results.push(...linkedinJobs);
    console.log(`✅ LinkedIn: ${linkedinJobs.length} jobs`);
  } catch (error) {
    console.error('❌ LinkedIn scraping failed:', error);
  }

  try {
    // Scrape Indeed
    const indeedJobs = await scrapeIndeedJobs(keywords, limitPerSource);
    results.push(...indeedJobs);
    console.log(`✅ Indeed: ${indeedJobs.length} jobs`);
  } catch (error) {
    console.error('❌ Indeed scraping failed:', error);
  }

  try {
    // Scrape StepStone
    const stepstoneJobs = await scrapeStepStoneJobs(keywords, limitPerSource);
    results.push(...stepstoneJobs);
    console.log(`✅ StepStone: ${stepstoneJobs.length} jobs`);
  } catch (error) {
    console.error('❌ StepStone scraping failed:', error);
  }

  console.log(`🎉 Total jobs scraped: ${results.length}`);
  return results;
}

export type { ScrapedJob };
