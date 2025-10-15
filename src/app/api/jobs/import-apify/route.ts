import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';
import { fetchCompanyLogo } from '@/lib/services/logoService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Import jobs from Apify dataset URL
 *
 * POST /api/jobs/import-apify
 *
 * Body:
 * {
 *   "datasetUrl": "https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/runs/last/dataset/items?token=..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetUrl, limit = 5 } = body; // Default to 5 jobs for safety

    if (!datasetUrl) {
      return NextResponse.json(
        { success: false, error: 'datasetUrl is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Fetching jobs from Apify dataset...`);
    console.log(`📊 Limit set to: ${limit} jobs`);

    // Fetch all jobs from the dataset
    const response = await fetch(datasetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }

    const allJobs = await response.json();
    console.log(`📥 Fetched ${allJobs.length} jobs from Apify`);

    // Limit to specified number of jobs
    const jobs = allJobs.slice(0, limit);
    console.log(`🎯 Processing ${jobs.length} jobs (limited from ${allJobs.length} total)`);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No jobs found in dataset',
        processed: 0,
        failed: 0,
      });
    }

    // Process each job through the LLM pipeline
    const processedJobs: any[] = [];
    const failedJobs: Array<{ job: any; error: string }> = [];

    // Use service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    let processedCount = 0;

    for (const job of jobs) {
      try {
        processedCount++;
        console.log(`📝 Processing ${processedCount}/${jobs.length}: ${job.title} at ${job.companyName}`);

        // Extract job data
        const jobData = {
          title: job.title || job.position || '',
          companyName: job.companyName || job.company || '',
          location: job.location || '',
          description: job.descriptionText || job.description || job.jobDescription || '',
          url: job.link || job.url || job.jobUrl || '',
          postedAt: job.postedAt || job.postedDate || job.posted || null,
        };

        // Skip if missing critical data
        if (!jobData.title || !jobData.companyName) {
          console.log(`⏭️  Skipping job with missing title or company`);
          continue;
        }

        // Parse job information using GPT
        const extractedJob = await llmService.parseJobInfoOnly(jobData);

        // Research company information
        const companyResearch = await llmService.smartCompanyResearch(
          jobData.companyName,
          jobData
        );

        console.log(`✅ Processed ${job.title}, confidence: ${companyResearch.confidence}%`);

        // Check if company exists, if not create it
        let companyId: string | null = null;
        const { data: existingCompany } = await supabaseAdmin
          .from('companies')
          .select('id, logo_url, website_url')
          .eq('name', jobData.companyName)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
          console.log(`🏢 Company exists: ${jobData.companyName}, current logo: ${existingCompany.logo_url ? 'YES' : 'NO'}, website: ${existingCompany.website_url || 'NO'}`);

          // Always try to fetch/update logo if we have website data
          const websiteForLogo = companyResearch.research?.website || existingCompany.website_url;
          console.log(`🔍 Website for logo: ${websiteForLogo || 'NONE'}`);

          if (websiteForLogo) {
            // Fetch new logo (will use Logo.dev, Clearbit, or Google)
            const logoUrl = await fetchCompanyLogo(jobData.companyName, websiteForLogo);
            if (logoUrl) {
              // Update if we got a logo and it's different from existing
              if (!existingCompany.logo_url || existingCompany.logo_url !== logoUrl) {
                await supabaseAdmin
                  .from('companies')
                  .update({ logo_url: logoUrl })
                  .eq('id', companyId);
                console.log(`✅ Updated logo for existing company ${jobData.companyName}: ${logoUrl}`);
              } else {
                console.log(`⏭️  Logo unchanged for ${jobData.companyName}`);
              }
            } else {
              console.log(`❌ No logo found for ${jobData.companyName}`);
            }
          }
        } else {
          // Create company with ALL research data from smartCompanyResearch pipeline
          const r = companyResearch.research; // Shorthand for research data
          const companyData: any = {
            name: jobData.companyName,
          };

          console.log(`\n🔍 DEBUG - Company: ${jobData.companyName}`);
          console.log(`🔍 DEBUG - Research exists:`, r ? 'YES' : 'NO');
          if (r) {
            console.log(`🔍 DEBUG - Research keys:`, Object.keys(r));
            console.log(`🔍 DEBUG - Full research object:`, JSON.stringify(r, null, 2));
          }

          // Map fields using EXACT field names from both research sources
          // (parseScrapedContentWithGPT returns 'website', generateCompanyResearchFromKnowledge returns 'official_website')
          if (r?.description) companyData.description = r.description;
          if (r?.industry) companyData.industry = r.industry;
          if (r?.industry_sector) companyData.industry = r.industry_sector; // Alternative field name
          if (r?.website) companyData.website_url = r.website;
          if (r?.official_website) companyData.website_url = r.official_website; // From internal knowledge

          // Fetch company logo using dedicated logo service (Clearbit/Google)
          // This is more reliable than extracting from scraped content
          const logoUrl = await fetchCompanyLogo(jobData.companyName, r?.website || companyData.website_url);
          if (logoUrl) {
            companyData.logo_url = logoUrl;
            console.log(`✅ Fetched logo for ${jobData.companyName}: ${logoUrl}`);
          } else if (r?.logo_url) {
            // Fallback to GPT-extracted logo if logo service failed
            companyData.logo_url = r.logo_url;
          }

          if (r?.headquarters) companyData.headquarters_location = r.headquarters;
          if (r?.headquarters_location) companyData.headquarters_location = r.headquarters_location; // From internal knowledge
          if (r?.company_values) companyData.company_values = r.company_values;
          if (r?.remote_work_policy) companyData.remote_work_policy = r.remote_work_policy;
          if (r?.diversity_initiatives) companyData.diversity_initiatives = r.diversity_initiatives;
          if (r?.awards_recognition) companyData.awards_recognition = r.awards_recognition;

          // Parse founded year (could be string like "2000" or "Founded in 2000")
          if (r?.founded) {
            const foundedMatch = String(r.founded).match(/\d{4}/);
            companyData.founded_year = foundedMatch ? parseInt(foundedMatch[0]) : null;
          }
          if (r?.founded_year && !companyData.founded_year) {
            // From internal knowledge (already a number)
            const foundedMatch = String(r.founded_year).match(/\d{4}/);
            companyData.founded_year = foundedMatch ? parseInt(foundedMatch[0]) : null;
          }

          // Parse employee count and map to size category
          let employeeCount: number | null = null;
          if (r?.employee_count) {
            const empStr = String(r.employee_count).replace(/,/g, '');
            const empMatch = empStr.match(/\d+/);
            employeeCount = empMatch ? parseInt(empMatch[0]) : null;
            if (employeeCount) {
              companyData.employee_count = employeeCount;
              // Map to company_size_category based on employee count
              if (employeeCount < 50) {
                companyData.company_size_category = 'startup';
              } else if (employeeCount < 250) {
                companyData.company_size_category = 'small';
              } else if (employeeCount < 1000) {
                companyData.company_size_category = 'medium';
              } else if (employeeCount < 5000) {
                companyData.company_size_category = 'large';
              } else {
                companyData.company_size_category = 'enterprise';
              }
            }
          }

          if (r?.business_model) companyData.business_model = r.business_model;
          if (r?.products_services) companyData.key_products_services = r.products_services;
          if (r?.key_products_services) companyData.key_products_services = r.key_products_services; // From internal knowledge
          if (r?.leadership_team) companyData.leadership_team = r.leadership_team;
          if (r?.culture_highlights) companyData.culture_highlights = r.culture_highlights;

          // Parse Glassdoor rating (could be string like "4.2/5" or "4.2")
          if (r?.glassdoor_rating) {
            const ratingStr = String(r.glassdoor_rating).replace(/\/.*/, '');
            const rating = parseFloat(ratingStr);
            companyData.glassdoor_rating = !isNaN(rating) ? rating : null;
          }

          if (r?.office_locations) companyData.office_locations = r.office_locations;
          if (r?.competitors) companyData.competitors = r.competitors;
          if (r?.recent_news) companyData.recent_news = r.recent_news;
          // Map funding to funding_status (text field in DB)
          if (r?.funding) companyData.funding_status = r.funding;

          // Set research metadata
          companyData.research_source = companyResearch.searchUsed ? 'tavily_search' : 'gpt_knowledge';
          companyData.research_last_updated = new Date().toISOString();

          // Map numeric confidence to text enum (high/medium/low)
          // IMPORTANT: Only set if we have a valid confidence value
          const confidence = companyResearch.confidence;
          if (typeof confidence === 'number') {
            if (confidence >= 0.7) {
              companyData.research_confidence = 'high';
            } else if (confidence >= 0.5) {
              companyData.research_confidence = 'medium';
            } else {
              companyData.research_confidence = 'low';
            }
          }

          console.log(`🔍 DEBUG - Company data to insert:`, {
            name: companyData.name,
            industry: companyData.industry || 'NULL',
            website_url: companyData.website_url || 'NULL',
            employee_count: companyData.employee_count || 'NULL',
            company_size_category: companyData.company_size_category || 'NULL',
            research_confidence: companyData.research_confidence || 'NULL',
            research_source: companyData.research_source
          });

          const { data: newCompany, error: companyError} = await supabaseAdmin
            .from('companies')
            .insert(companyData)
            .select('id')
            .single();

          if (companyError) {
            console.error(`❌ Failed to create company ${jobData.companyName}:`, JSON.stringify(companyError, null, 2));
            throw new Error(`Failed to create company: ${companyError.message || JSON.stringify(companyError)}`);
          }

          companyId = newCompany.id;
          console.log(`✅ Created company: ${jobData.companyName}`);
        }

        // Check if job already exists (by URL or title+company)
        if (jobData.url) {
          const { data: existingJob } = await supabaseAdmin
            .from('jobs')
            .select('id')
            .eq('url', jobData.url)
            .single();

          if (existingJob) {
            console.log(`⏭️  Job already exists: ${job.title} at ${jobData.companyName}`);
            continue;
          }
        }

        // Insert job into database with ALL fields from ExtractedJob
        const { data: newJob, error: jobError } = await supabaseAdmin
          .from('jobs')
          .insert({
            company_id: companyId,
            title: jobData.title,
            description: jobData.description,

            // Location fields
            location_raw: jobData.location,
            city: extractedJob.location_city || '',
            country: extractedJob.location_country || '',

            // Work mode and type
            work_mode: extractedJob.work_mode || 'Unknown',
            werkstudent: extractedJob.werkstudent,
            employment_type: 'Werkstudent',

            // Language requirement
            german_required: extractedJob.german_required || 'unknown',

            // Hiring manager (for cover letters)
            hiring_manager: extractedJob.hiring_manager || null,

            // Links
            portal: 'linkedin',
            portal_link: extractedJob.portal_link || jobData.url || '',
            linkedin_url: jobData.url || '',
            job_description_link: extractedJob.job_description_link,

            // Dates
            posted_at: extractedJob.date_posted || (jobData.postedAt ? new Date(jobData.postedAt).toISOString() : new Date().toISOString()),

            // Tasks & Responsibilities (English only)
            responsibilities: extractedJob.tasks_responsibilities || [],

            // Nice to Have (English only - truly optional items)
            nice_to_have: extractedJob.nice_to_have || [],

            // Benefits (English only)
            benefits: extractedJob.benefits || [],

            // Skills and Tools (English only)
            skills: extractedJob.named_skills_tools || [],

            // Who we are looking for (qualifications, requirements)
            who_we_are_looking_for: (extractedJob as any).who_we_are_looking_for || [],

            // Application requirements (what to send)
            application_requirements: (extractedJob as any).application_requirements || [],

            // Status
            is_active: true,
          })
          .select()
          .single();

        if (jobError) {
          console.error(`❌ Failed to insert job ${job.title}:`, JSON.stringify(jobError, null, 2));
          throw new Error(`Failed to insert job: ${jobError.message || JSON.stringify(jobError)}`);
        }

        processedJobs.push(newJob);
        console.log(`✅ Inserted job ${processedCount}/${jobs.length}: ${job.title}`);

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
      message: `Processed ${processedJobs.length} jobs from ${jobs.length} total`,
      totalFetched: jobs.length,
      processed: processedJobs.length,
      failed: failedJobs.length,
      jobs: processedJobs.map(j => ({
        id: j.id,
        title: j.title,
        portal: j.portal,
      })),
      failedJobs: failedJobs.map(f => ({
        title: f.job.title,
        company: f.job.companyName,
        error: f.error,
      })),
    });

  } catch (error) {
    console.error('❌ Error importing jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
