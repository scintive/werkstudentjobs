import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';
import { fetchCompanyLogo } from '@/lib/services/logoService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Import jobs from JobSpy scraper
 *
 * POST /api/jobs/import-jobspy
 *
 * Body:
 * {
 *   "jobs": [{ title, company, location, description, job_url, ... }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobs } = body;

    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { success: false, error: 'jobs array is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Processing ${jobs.length} jobs from JobSpy...`);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No jobs provided',
        processed: 0,
        failed: 0,
      });
    }

    // Process each job through the LLM pipeline
    const processedJobs: any[] = [];
    const failedJobs: Array<{
      job: any;
      error: string;
      errorDetails?: {
        descriptionLength?: number;
        skillsCount?: number;
        responsibilitiesCount?: number;
        requirementsCount?: number;
        benefitsCount?: number;
      }
    }> = [];

    // Use service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    let processedCount = 0;

    for (const job of jobs) {
      try {
        processedCount++;
        console.log(`📝 Processing ${processedCount}/${jobs.length}: ${job.title} at ${job.company}`);

        // Extract job data from JobSpy format
        const jobData = {
          title: job.title || '',
          companyName: job.company || '',
          location: job.location || '',
          description: job.description || '',
          url: job.job_url || '',
          postedAt: job.date_posted || null,
          companyWebsite: job.company_url || null, // JobSpy provides company website
        };

        // Skip if missing critical data
        if (!jobData.title || !jobData.companyName) {
          console.log(`⏭️  Skipping job with missing title or company`);
          continue;
        }

        // Parse job information using GPT
        const extractedJob = await llmService.parseJobInfoOnly(jobData);

        // VALIDATION: Ensure critical fields are populated (COMPLETE VIOLATION if empty)
        const validationErrors: string[] = [];

        // Check responsibilities/tasks
        if (!extractedJob.tasks_responsibilities || extractedJob.tasks_responsibilities.length === 0) {
          validationErrors.push('Missing tasks/responsibilities');
        }

        // Check skills
        if (!extractedJob.named_skills_tools || extractedJob.named_skills_tools.length === 0) {
          validationErrors.push('Missing skills/tools');
        }

        // Check benefits (can be flexible, some jobs may not list benefits)
        // But log if missing for transparency
        if (!extractedJob.benefits || extractedJob.benefits.length === 0) {
          console.warn(`⚠️  Job ${job.title} at ${jobData.companyName} has no benefits listed`);
        }

        // Check "who we are looking for"
        if (!extractedJob.who_we_are_looking_for || extractedJob.who_we_are_looking_for.length === 0) {
          validationErrors.push('Missing "who we are looking for" requirements');
        }

        // Check description is not empty
        if (!jobData.description || jobData.description.trim().length < 50) {
          validationErrors.push('Description too short or empty');
        }

        // If validation fails, reject this job and log detailed error
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors.join(', ');
          console.error('═'.repeat(80));
          console.error(`❌ DATA QUALITY VIOLATION - Job REJECTED`);
          console.error(`   Job: ${job.title} at ${jobData.companyName}`);
          console.error(`   Errors: ${errorMessage}`);
          console.error(`   Description length: ${jobData.description?.length || 0} chars`);
          console.error(`   Skills parsed: ${extractedJob.named_skills_tools?.length || 0}`);
          console.error(`   Responsibilities parsed: ${extractedJob.tasks_responsibilities?.length || 0}`);
          console.error(`   Requirements parsed: ${extractedJob.who_we_are_looking_for?.length || 0}`);
          console.error('═'.repeat(80));

          failedJobs.push({
            job,
            error: `Data quality validation failed: ${errorMessage}`,
            errorDetails: {
              descriptionLength: jobData.description?.length || 0,
              skillsCount: extractedJob.named_skills_tools?.length || 0,
              responsibilitiesCount: extractedJob.tasks_responsibilities?.length || 0,
              requirementsCount: extractedJob.who_we_are_looking_for?.length || 0,
              benefitsCount: extractedJob.benefits?.length || 0,
            }
          });
          continue; // Skip this job
        }

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
          console.log(`🏢 Company exists: ${jobData.companyName}`);

          // Update company website and logo if we have new data
          const updateData: any = {};

          // Update website URL if JobSpy provided one and we don't have it yet
          if (jobData.companyWebsite && !existingCompany.website_url) {
            updateData.website_url = jobData.companyWebsite;
            console.log(`✅ Adding website URL for ${jobData.companyName}: ${jobData.companyWebsite}`);
          }

          // Update logo if we have website data
          const websiteForLogo = jobData.companyWebsite || companyResearch.research?.website || existingCompany.website_url;
          if (websiteForLogo) {
            const logoUrl = await fetchCompanyLogo(jobData.companyName, websiteForLogo);
            if (logoUrl && (!existingCompany.logo_url || existingCompany.logo_url !== logoUrl)) {
              updateData.logo_url = logoUrl;
              console.log(`✅ Updated logo for ${jobData.companyName}`);
            }
          }

          // Apply updates if any
          if (Object.keys(updateData).length > 0) {
            await supabaseAdmin
              .from('companies')
              .update(updateData)
              .eq('id', companyId);
          }
        } else {
          // Create company with research data
          const r = companyResearch.research;
          const companyData: any = {
            name: jobData.companyName,
          };

          if (r?.description) companyData.description = r.description;
          if (r?.industry) companyData.industry = r.industry;
          if (r?.industry_sector) companyData.industry = r.industry_sector;

          // Prioritize JobSpy company URL over GPT-extracted URLs
          if (jobData.companyWebsite) {
            companyData.website_url = jobData.companyWebsite;
          } else if (r?.website) {
            companyData.website_url = r.website;
          } else if (r?.official_website) {
            companyData.website_url = r.official_website;
          }

          // Fetch company logo
          const logoUrl = await fetchCompanyLogo(jobData.companyName, r?.website || companyData.website_url);
          if (logoUrl) {
            companyData.logo_url = logoUrl;
            console.log(`✅ Fetched logo for ${jobData.companyName}`);
          } else if (r?.logo_url) {
            companyData.logo_url = r.logo_url;
          }

          if (r?.headquarters) companyData.headquarters_location = r.headquarters;
          if (r?.headquarters_location) companyData.headquarters_location = r.headquarters_location;
          if (r?.company_values) companyData.company_values = r.company_values;
          if (r?.remote_work_policy) companyData.remote_work_policy = r.remote_work_policy;
          if (r?.diversity_initiatives) companyData.diversity_initiatives = r.diversity_initiatives;
          if (r?.awards_recognition) companyData.awards_recognition = r.awards_recognition;

          // Parse founded year
          if (r?.founded) {
            const foundedMatch = String(r.founded).match(/\d{4}/);
            companyData.founded_year = foundedMatch ? parseInt(foundedMatch[0]) : null;
          }
          if (r?.founded_year && !companyData.founded_year) {
            const foundedMatch = String(r.founded_year).match(/\d{4}/);
            companyData.founded_year = foundedMatch ? parseInt(foundedMatch[0]) : null;
          }

          // Parse employee count and size category
          if (r?.employee_count) {
            const empStr = String(r.employee_count).replace(/,/g, '');
            const empMatch = empStr.match(/\d+/);
            const employeeCount = empMatch ? parseInt(empMatch[0]) : null;
            if (employeeCount) {
              companyData.employee_count = employeeCount;
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
          if (r?.key_products_services) companyData.key_products_services = r.key_products_services;
          if (r?.leadership_team) companyData.leadership_team = r.leadership_team;
          if (r?.culture_highlights) companyData.culture_highlights = r.culture_highlights;

          // Parse Glassdoor rating
          if (r?.glassdoor_rating) {
            const ratingStr = String(r.glassdoor_rating).replace(/\/.*/, '');
            const rating = parseFloat(ratingStr);
            companyData.glassdoor_rating = !isNaN(rating) ? rating : null;
          }

          if (r?.office_locations) companyData.office_locations = r.office_locations;
          if (r?.competitors) companyData.competitors = r.competitors;
          if (r?.recent_news) companyData.recent_news = r.recent_news;
          if (r?.funding) companyData.funding_status = r.funding;

          // Set research metadata
          companyData.research_source = companyResearch.searchUsed ? 'tavily_search' : 'gpt_knowledge';
          companyData.research_last_updated = new Date().toISOString();

          // Map confidence
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

          const { data: newCompany, error: companyError} = await supabaseAdmin
            .from('companies')
            .insert(companyData)
            .select('id')
            .single();

          if (companyError) {
            console.error(`❌ Failed to create company ${jobData.companyName}:`, companyError);
            throw new Error(`Failed to create company: ${companyError.message}`);
          }

          companyId = newCompany.id;
          console.log(`✅ Created company: ${jobData.companyName}`);
        }

        // Check if job already exists (by portal_link)
        if (jobData.url) {
          const { data: existingJob } = await supabaseAdmin
            .from('jobs')
            .select('id')
            .eq('portal_link', jobData.url)
            .single();

          if (existingJob) {
            console.log(`⏭️  Job already exists: ${job.title} at ${jobData.companyName}`);
            continue;
          }
        }

        // Insert job into database
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

            // Hiring manager
            hiring_manager: extractedJob.hiring_manager || null,

            // Links
            portal: job.site || 'jobspy',
            portal_link: extractedJob.portal_link || jobData.url || '',
            linkedin_url: job.site === 'linkedin' ? jobData.url : '',
            job_description_link: extractedJob.job_description_link,

            // Dates
            posted_at: extractedJob.date_posted || (jobData.postedAt ? new Date(jobData.postedAt).toISOString() : new Date().toISOString()),

            // Tasks & Responsibilities
            responsibilities: extractedJob.tasks_responsibilities || [],

            // Nice to Have
            nice_to_have: extractedJob.nice_to_have || [],

            // Benefits
            benefits: extractedJob.benefits || [],

            // Skills and Tools
            skills: extractedJob.named_skills_tools || [],

            // Who we are looking for
            who_we_are_looking_for: extractedJob.who_we_are_looking_for || [],

            // Application requirements
            application_requirements: extractedJob.application_requirements || [],

            // Status
            is_active: true,
          })
          .select()
          .single();

        if (jobError) {
          console.error(`❌ Failed to insert job ${job.title}:`, jobError);
          throw new Error(`Failed to insert job: ${jobError.message}`);
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
        company: j.company_id,
      })),
      failedJobs: failedJobs.map(f => ({
        title: f.job.title,
        company: f.job.company,
        error: f.error,
        errorDetails: f.errorDetails,
      })),
    });

  } catch (error) {
    console.error('❌ Error importing JobSpy jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
