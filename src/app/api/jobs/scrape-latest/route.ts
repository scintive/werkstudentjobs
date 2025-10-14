import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources, type ScrapedJob } from '@/lib/services/apifyJobScraper';
import { llmService } from '@/lib/services/llmService';
import { supabase } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Scrape latest jobs from Apify and process them into the database
 *
 * POST /api/jobs/scrape-latest
 *
 * Body:
 * {
 *   "keywords": ["Werkstudent", "Internship"],  // Optional, defaults to ["Werkstudent", "Internship", "Praktikum"]
 *   "limitPerSource": 5                          // Optional, defaults to 5
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const keywords = body.keywords || ['Werkstudent', 'Internship', 'Praktikum'];
    const limitPerSource = body.limitPerSource || 5;

    console.log(`🚀 Starting job scraping with keywords: ${keywords.join(', ')}`);
    console.log(`📊 Limit per source: ${limitPerSource}`);

    // Step 1: Scrape jobs from all sources using Apify
    const scrapedJobs = await scrapeAllSources(keywords, limitPerSource);

    console.log(`📥 Scraped ${scrapedJobs.length} jobs from Apify`);

    if (scrapedJobs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No jobs found from any source',
        processed: 0,
        failed: 0,
      });
    }

    // Step 2: Process each job through the LLM pipeline
    const processedJobs: any[] = [];
    const failedJobs: Array<{ job: ScrapedJob; error: string }> = [];

    // Use service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    for (const job of scrapedJobs) {
      try {
        console.log(`📝 Processing: ${job.title} at ${job.company}`);

        // Parse job information using GPT
        const jobData = {
          title: job.title,
          companyName: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
        };

        const extractedJob = await llmService.parseJobInfoOnly(jobData);

        // Research company information
        const companyResearch = await llmService.smartCompanyResearch(
          job.company,
          jobData
        );

        console.log(`✅ Processed ${job.title}, confidence: ${companyResearch.confidence}%, search used: ${companyResearch.searchUsed}`);

        // Step 3: Check if company exists, if not create it
        let companyId: string | null = null;
        const { data: existingCompany } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('name', job.company)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create company
          const { data: newCompany, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
              name: job.company,
              description: companyResearch.research?.overview || '',
              industry: companyResearch.research?.industry || '',
              size: companyResearch.research?.size || '',
              website: companyResearch.research?.website || '',
              logo_url: companyResearch.research?.logo_url || null,
            })
            .select('id')
            .single();

          if (companyError) {
            console.error(`❌ Failed to create company ${job.company}:`, companyError);
            throw companyError;
          }

          companyId = newCompany.id;
          console.log(`✅ Created company: ${job.company}`);
        }

        // Step 4: Check if job already exists (by URL or title+company)
        const { data: existingJob } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .or(`url.eq.${job.url},and(title.eq.${job.title},company_id.eq.${companyId})`)
          .single();

        if (existingJob) {
          console.log(`⏭️  Job already exists: ${job.title} at ${job.company}`);
          continue;
        }

        // Step 5: Insert job into database
        const { data: newJob, error: jobError } = await supabaseAdmin
          .from('jobs')
          .insert({
            company_id: companyId,
            title: job.title,
            company_name: job.company,
            description: job.description,
            description_original: job.description,
            location: extractedJob.location || job.location,
            location_city: extractedJob.city || '',
            work_mode: job.workMode || extractedJob.work_mode || 'Unknown',
            url: job.url,
            salary_range: job.salary || extractedJob.salary_range || '',
            employment_type: extractedJob.employment_type || 'Werkstudent',
            posted_at: job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString(),

            // Normalized arrays
            requirements_original: extractedJob.requirements || [],
            responsibilities_original: extractedJob.responsibilities || [],
            qualifications_original: extractedJob.qualifications || [],
            skills_original: extractedJob.skills || [],

            // Source tracking
            source: job.source,
            is_active: true,
          })
          .select()
          .single();

        if (jobError) {
          console.error(`❌ Failed to insert job ${job.title}:`, jobError);
          throw jobError;
        }

        processedJobs.push(newJob);
        console.log(`✅ Inserted job: ${job.title} at ${job.company}`);

      } catch (error) {
        console.error(`❌ Failed to process job ${job.title}:`, error);
        failedJobs.push({
          job,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scraped and processed ${processedJobs.length} jobs`,
      totalScraped: scrapedJobs.length,
      processed: processedJobs.length,
      failed: failedJobs.length,
      jobs: processedJobs.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company_name,
        source: j.source,
      })),
      failedJobs: failedJobs.map(f => ({
        title: f.job.title,
        company: f.job.company,
        error: f.error,
      })),
    });

  } catch (error) {
    console.error('❌ Error in job scraping:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Get scraping status and recent scrapes
 * GET /api/jobs/scrape-latest
 */
export async function GET() {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get recently added jobs from scraped sources
    const { data: recentJobs, error } = await supabaseAdmin
      .from('jobs')
      .select('id, title, company_name, source, created_at')
      .in('source', ['linkedin', 'indeed', 'stepstone', 'xing', 'bundesagentur'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Count jobs by source
    const jobsBySource: Record<string, number> = {};
    recentJobs?.forEach(job => {
      jobsBySource[job.source] = (jobsBySource[job.source] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      recentJobs: recentJobs || [],
      jobsBySource,
      totalRecentJobs: recentJobs?.length || 0,
    });

  } catch (error) {
    console.error('❌ Error fetching scraping status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
