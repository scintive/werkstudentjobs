import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';
import { locationService } from '@/lib/services/locationService';
import { getConfig } from '@/lib/config/app';
import type { Database } from '@/lib/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type JobWithCompany = Job & { companies: Company };

/**
 * Extract tools from combined skills/tools array
 * Common tools: IDEs, software, frameworks, platforms
 */
function extractToolsFromSkills(skillsAndTools: string[]): string[] {
  if (!Array.isArray(skillsAndTools)) return [];
  
  const toolKeywords = [
    // IDEs & Editors
    'vscode', 'visual studio', 'intellij', 'eclipse', 'atom', 'sublime', 'vim', 'emacs',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
    // Cloud Platforms  
    'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'vercel',
    // DevOps Tools
    'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'terraform', 'ansible',
    // Design Tools
    'figma', 'sketch', 'photoshop', 'illustrator', 'adobe', 'canva', 'invision',
    // Project Management
    'jira', 'confluence', 'trello', 'asana', 'monday', 'notion', 'slack', 'teams',
    // Analytics
    'google analytics', 'tableau', 'power bi', 'excel', 'looker', 'mixpanel',
    // CRM & Business
    'salesforce', 'hubspot', 'mailchimp', 'shopify', 'wordpress', 'sap'
  ];
  
  const tools: string[] = [];
  const toolsLower = toolKeywords.map(t => t.toLowerCase());
  
  for (const item of skillsAndTools) {
    if (!item || typeof item !== 'string') continue;
    
    const itemLower = item.toLowerCase().trim();
    
    // Check if item matches any tool keyword
    if (toolsLower.some(tool => itemLower.includes(tool) || tool.includes(itemLower))) {
      tools.push(item);
    }
  }
  
  return [...new Set(tools)]; // Remove duplicates
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20'),
      50 // Maximum limit for performance
    );
    const offset = parseInt(searchParams.get('offset') || '0');
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' }, 
        { status: 500 }
      );
    }

    // If force refresh or no jobs in database, fetch new jobs from source
    if (forceRefresh) {
      await fetchAndStoreNewJobs(limit);
    }

    // Get jobs from Supabase with company information
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) {
      throw new Error(`Failed to fetch jobs from database: ${jobsError.message}`);
    }

    // If no jobs found, try to fetch some new ones
    if (!jobsData || jobsData.length === 0) {
      console.log('No jobs in database, fetching fresh data...');
      await fetchAndStoreNewJobs(limit);
      
      // Try again after fetching
      const { data: retryData, error: retryError } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (retryError) {
        throw new Error(`Failed to fetch jobs after refresh: ${retryError.message}`);
      }

      return NextResponse.json({
        success: true,
        jobs: retryData || [],
        total: retryData?.length || 0,
        source: 'fresh_fetch'
      });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      jobs: jobsData as JobWithCompany[],
      total: count || jobsData.length,
      source: 'database',
      note: forceRefresh ? 'Enhanced extraction with optimized Google Search + GPT system' : undefined
    });

  } catch (error) {
    console.error('Job fetching error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * Fetch new jobs from external source and store in Supabase
 */
async function fetchAndStoreNewJobs(requestedLimit?: number): Promise<void> {
  try {
    const datasetUrl = getConfig('JOB_FETCHING.DATASET_URL');
    const limit = requestedLimit || getConfig('JOB_FETCHING.DEFAULT_LIMIT');
    
    // Fetch jobs from Apify dataset
    const response = await fetch(`${datasetUrl}&offset=0&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status}`);
    }
    
    const rawJobs = await response.json();
    
    // Process and store each job
    for (const rawJob of rawJobs) {
      await processAndStoreJob(rawJob);
    }
    
    console.log(`✅ Successfully processed ${rawJobs.length} jobs with enhanced GPT extraction`);
    console.log(`🚀 Using optimized Google Search + GPT parsing system`);
  } catch (error) {
    console.error('Error fetching and storing new jobs:', error);
    throw error;
  }
}

/**
 * Process a raw job and store it in Supabase with all pipeline fields maintained
 * Uses separated job parsing and company research to reduce token costs
 */
async function processAndStoreJob(rawJob: any): Promise<void> {
  try {
    // 1. Parse job information only (cost-efficient, focuses on skills extraction)
    let extractedJob;
    
    try {
      console.log(`📋 Starting cost-efficient job parsing for: ${rawJob.title} at ${rawJob.companyName}`);
      
      // Use new cost-efficient method that focuses on extracting meaningful skills
      extractedJob = await llmService.parseJobInfoOnly(rawJob);
      console.log(`✅ Job parsing successful - extracted ${extractedJob.named_skills_tools?.length || 0} skills`);
    } catch (error) {
      console.warn(`⚠️ Cost-efficient parsing failed for job: ${rawJob.title}, using basic extraction:`, error);
      
      // Fallback to basic extraction if parsing fails
      extractedJob = await llmService.extractJobInfo(rawJob);
    }
    
    // 2. Separate company research (only if needed and cost-effective)
    let companyResearch = null;
    
    try {
      const companyName = extractedJob.company_name || rawJob.companyName;
      console.log(`🏢 INITIAL DEBUG: Company name from extracted:`, extractedJob.company_name);
      console.log(`🏢 INITIAL DEBUG: Company name from raw:`, rawJob.companyName);
      console.log(`🏢 INITIAL DEBUG: Final company name:`, companyName);
      
      if (companyName && companyName !== 'Unknown Company') {
        console.log(`🏢 Starting separate company research for: ${companyName}`);
        
        const smartResearch = await llmService.smartCompanyResearch(companyName, rawJob);
        companyResearch = smartResearch.research;
        
        console.log(`🏢 Company research completed - confidence: ${smartResearch.confidence}, search used: ${smartResearch.searchUsed}, cost: ${smartResearch.cost}`);
        console.log(`🏢 DEBUG: Research data keys:`, companyResearch ? Object.keys(companyResearch) : 'NULL');
        console.log(`🏢 DEBUG: Research data sample:`, companyResearch ? JSON.stringify(companyResearch).substring(0, 200) + '...' : 'NULL');
      } else {
        console.log(`🏢 Skipping company research - no valid company name (got: ${companyName})`);
      }
    } catch (error) {
      console.warn(`⚠️ Company research failed for: ${extractedJob.company_name}, continuing without research:`, error);
    }
    
    // 3. Ensure company exists with research data
    const companyId = await ensureCompanyExists(
      extractedJob.company_name || rawJob.companyName || 'Unknown Company',
      companyResearch
    );
    
    // 4. Geocode job location if available
    let jobGeoData = { latitude: null, longitude: null };
    const jobLocation = extractedJob.location_city || rawJob.location;
    
    if (jobLocation && jobLocation.trim() && !jobLocation.toLowerCase().includes('remote')) {
      console.log(`🗺️ Geocoding job location: "${jobLocation}"`);
      try {
        const geocoded = await locationService.geocodeLocation(jobLocation);
        if (geocoded) {
          jobGeoData.latitude = geocoded.latitude;
          jobGeoData.longitude = geocoded.longitude;
          console.log(`🗺️ Successfully geocoded "${jobLocation}" to [${geocoded.latitude}, ${geocoded.longitude}]`);
        } else {
          console.warn(`🗺️ Failed to geocode job location: "${jobLocation}"`);
        }
      } catch (error) {
        console.warn(`🗺️ Geocoding error for "${jobLocation}":`, error);
      }
    } else {
      console.log(`🗺️ Skipping geocoding for job location: "${jobLocation}"`);
    }

    // 5. Enhance with basic fallbacks and fix source/application links
    extractedJob = {
      ...extractedJob,
      // Fix application links - prefer direct application URL, fallback to job page
      job_description_link: extractedJob.job_description_link || rawJob.link || null,
      portal_link: extractedJob.portal_link || rawJob.link || null,
      application_link: rawJob.applicationUrl || rawJob.applyUrl || rawJob.link || null, // Add application link
      source: rawJob.portal || 'LinkedIn', // Fix source information
      
      // Basic fallbacks
      date_posted: extractedJob.date_posted || rawJob.postedAt || null,
      company_name: extractedJob.company_name || rawJob.companyName || null,
      german_required: extractedJob.german_required || 'unknown',
      werkstudent: extractedJob.werkstudent !== null ? extractedJob.werkstudent : 
                  (rawJob.title?.toLowerCase().includes('werkstudent') || 
                   rawJob.title?.toLowerCase().includes('working student') || false),
      work_mode: extractedJob.work_mode || 
                (rawJob.location?.toLowerCase().includes('remote') ? 'Remote' :
                 rawJob.location?.toLowerCase().includes('hybrid') ? 'Hybrid' : 'Unknown'),
      location_city: extractedJob.location_city || rawJob.location?.split(',')[0]?.trim() || null,
      location_country: extractedJob.location_country || (rawJob.location?.includes('Germany') ? 'Germany' : null),
      
      // Add geocoded coordinates
      latitude: jobGeoData.latitude,
      longitude: jobGeoData.longitude,
      
      // Company research results (from separate call)
      hiring_manager: companyResearch?.hiring_manager || null,
      tasks_responsibilities: Array.isArray(extractedJob.tasks_responsibilities) ? extractedJob.tasks_responsibilities : [],
      nice_to_have: Array.isArray(extractedJob.nice_to_have) ? extractedJob.nice_to_have : [],
      benefits: Array.isArray(extractedJob.benefits) ? extractedJob.benefits : [],
      named_skills_tools: extractedJob.named_skills_tools || [],
      important_statements: Array.isArray(extractedJob.important_statements) ? extractedJob.important_statements : []
    };
    
    // Log research data for debugging
    if (extractedJob.hiring_manager) {
      console.log(`👤 Hiring Manager found: ${extractedJob.hiring_manager}`);
    }
    if (companyResearch?.additional_insights?.length > 0) {
      console.log(`💡 Additional insights (${companyResearch.additional_insights.length}):`, companyResearch.additional_insights);
    }
    if (companyResearch?.research_confidence) {
      console.log(`🔬 Research confidence: ${companyResearch.research_confidence}`);
    }

    // 5. Prepare job data for Supabase with enhanced research fields
    const jobData = {
      external_id: rawJob.id || rawJob.url || rawJob.link || null,
      company_id: companyId,
      title: rawJob.title || 'Untitled Position',
      description: rawJob.description || rawJob.text || null,
      portal: extractedJob.source || rawJob.portal || 'LinkedIn', // Use fixed source
      portal_link: extractedJob.portal_link,
      job_description_link: extractedJob.job_description_link,
      application_link: extractedJob.application_link, // Use enhanced application link
      
      // Job Classification (using GPT-extracted data)
      werkstudent: extractedJob.werkstudent,
      is_werkstudent: extractedJob.werkstudent, // Both fields for compatibility
      work_mode: extractedJob.work_mode,
      contract_type: rawJob.employmentType || 'Unknown',
      employment_type: rawJob.employmentType, // Pipeline field
      seniority_level: rawJob.seniorityLevel, // Pipeline field
      
      // Location Data (using GPT-extracted data)
      location_raw: rawJob.location || null,
      city: extractedJob.location_city,
      country: extractedJob.location_country,
      is_remote: extractedJob.work_mode === 'Remote',
      remote_allowed: extractedJob.work_mode === 'Remote', // Pipeline field
      hybrid_allowed: extractedJob.work_mode === 'Hybrid', // Pipeline field  
      onsite_required: extractedJob.work_mode === 'Onsite', // Pipeline field
      
      // Geocoded coordinates
      latitude: extractedJob.latitude,
      longitude: extractedJob.longitude,
      
      // Salary Information
      salary_min: rawJob.salaryFrom ? parseInt(rawJob.salaryFrom) : null,
      salary_max: rawJob.salaryTo ? parseInt(rawJob.salaryTo) : null,
      salary_info: rawJob.salary || null, // Pipeline field
      
      // LinkedIn and Job Details (Pipeline fields)
      linkedin_url: rawJob.link,
      job_function: rawJob.jobFunction,
      industries: rawJob.industries ? [rawJob.industries] : null,
      applicants_count: parseInt(rawJob.applicantsCount) || null,
      
      // User Interaction Fields (Pipeline fields)
      user_saved: false,
      user_applied: false,
      user_notes: null,
      match_score: null, // Will be calculated by matching service
      
      // Language and Matching Fields (using GPT-extracted data)
      content_language: extractedJob.german_required === 'DE' ? 'DE' as const : 
                       extractedJob.german_required === 'EN' ? 'EN' as const : 'unknown' as const,
      german_required: extractedJob.german_required,
      language_required: extractedJob.german_required === 'both' ? 'BOTH' as const :
                        extractedJob.german_required === 'DE' ? 'DE' as const :
                        extractedJob.german_required === 'EN' ? 'EN' as const : 'UNKNOWN' as const,
      
      // Simplified English-only fields
      skills: Array.isArray(extractedJob.named_skills_tools) ? extractedJob.named_skills_tools : [],
      tools: Array.isArray(extractedJob.named_skills_tools) ? extractToolsFromSkills(extractedJob.named_skills_tools) : [],
      responsibilities: Array.isArray(extractedJob.tasks_responsibilities) ? extractedJob.tasks_responsibilities : null,
      nice_to_have: Array.isArray(extractedJob.nice_to_have) ? extractedJob.nice_to_have : null,
      benefits: Array.isArray(extractedJob.benefits) ? extractedJob.benefits : null,
      who_we_are_looking_for: Array.isArray(extractedJob.who_we_are_looking_for) ? extractedJob.who_we_are_looking_for : null,
      application_requirements: Array.isArray(extractedJob.application_requirements) ? extractedJob.application_requirements : null,
      
      // Store research data in description for now (until schema is updated)
      // hiring_manager: extractedJob.hiring_manager, // TODO: Add to schema
      // job_market_analysis: extractedJob.job_market_analysis || null, // TODO: Add to schema
      // additional_insights: extractedJob.additional_insights || null, // TODO: Add to schema
      
      // Log research data for now
      // research_confidence: extractedJob.research_confidence || null, // TODO: Add to schema
      
      // Metadata
      posted_at: extractedJob.date_posted ? new Date(extractedJob.date_posted).toISOString() : null,
      source_quality_score: calculateQualityScore(rawJob, extractedJob),
      is_active: true
    };

    // 6. Store in Supabase (upsert to avoid duplicates)
    const { error } = await supabase
      .from('jobs')
      .upsert(jobData, { 
        onConflict: 'external_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`Error storing job "${rawJob.title}":`, error.message);
      throw error;
    }

  } catch (error) {
    console.error('Error processing job:', error);
    throw error;
  }
}

/**
 * Ensure company exists with enhanced research data, return company ID
 */
async function ensureCompanyExists(companyName: string, companyResearch?: any): Promise<string> {
  if (!companyName || companyName.trim() === '') {
    companyName = 'Unknown Company';
  }

  // Try to find existing company
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id, updated_at')
    .eq('name', companyName.trim())
    .single();

  if (existingCompany) {
    // Check if we should update with new research data (update if we have comprehensive research OR more than 7 days old)
    const shouldUpdate = companyResearch && (
      !existingCompany.updated_at ||
      new Date().getTime() - new Date(existingCompany.updated_at).getTime() > 7 * 24 * 60 * 60 * 1000 || // 7 days
      (companyResearch.founded || companyResearch.employee_count || companyResearch.description) // OR has comprehensive data
    );

    if (shouldUpdate) {
      console.log(`🏢 Updating company research for: ${companyName}`);
      await updateCompanyWithResearch(existingCompany.id, companyResearch);
    }

    return existingCompany.id;
  }

  // Create new company with research data
  console.log(`🏢 Creating new company with research: ${companyName}`);
  const companyData: any = { 
    name: companyName.trim(),
    industry: 'Technology', // Default, will be updated by research
    size_category: 'medium' // Default, will be updated by research
  };

  // Add comprehensive research data if available (map ALL fields to database schema)
  if (companyResearch) {
    console.log(`🔍 Mapping comprehensive research data for ${companyName}:`, Object.keys(companyResearch));
    
    // Basic company information (use actual web search field names)
    companyData.website_url = companyResearch.website || companyResearch.official_website || null;
    companyData.industry_sector = companyResearch.industry || null;
    companyData.industry = companyResearch.industry || companyData.industry; // Fallback field
    companyData.headquarters_location = companyResearch.headquarters || null;
    companyData.description = companyResearch.description || companyResearch.employee_reviews_summary || null;
    
    // Foundational information  
    companyData.founded_year = companyResearch.founded ? parseInt(companyResearch.founded) : null;
    companyData.careers_page_url = companyResearch.job_specific?.direct_application_link || null;
    companyData.business_model = companyResearch.business_model || null;
    companyData.employee_count = companyResearch.employee_count ? parseInt(companyResearch.employee_count) : null;
    
    // Arrays of detailed information (using actual web search field names)
    companyData.office_locations = Array.isArray(companyResearch.office_locations) ? companyResearch.office_locations : null;
    companyData.key_products_services = Array.isArray(companyResearch.products_services) ? companyResearch.products_services : null;
    companyData.notable_investors = Array.isArray(companyResearch.notable_investors) ? companyResearch.notable_investors : null;
    companyData.leadership_team = Array.isArray(companyResearch.leadership_team) ? companyResearch.leadership_team : null;
    companyData.company_values = companyResearch.company_culture ? [companyResearch.company_culture] : null;
    companyData.culture_highlights = companyResearch.company_culture ? [companyResearch.company_culture] : null;
    companyData.competitors = Array.isArray(companyResearch.competitors) ? companyResearch.competitors : null;
    companyData.diversity_initiatives = Array.isArray(companyResearch.diversity_initiatives) ? companyResearch.diversity_initiatives : null;
    companyData.awards_recognition = Array.isArray(companyResearch.awards_recognition) ? companyResearch.awards_recognition : null;
    companyData.recent_news = Array.isArray(companyResearch.recent_news) ? companyResearch.recent_news : null;
    
    // Text fields with detailed information (using actual web search field names)
    companyData.funding_status = companyResearch.funding || null;
    companyData.employee_reviews_summary = companyResearch.employee_reviews_summary || null;
    companyData.remote_work_policy = companyResearch.remote_work_policy || null;
    
    // Glassdoor rating (parse if string)
    if (companyResearch.glassdoor_rating) {
      const rating = parseFloat(companyResearch.glassdoor_rating);
      companyData.glassdoor_rating = !isNaN(rating) ? rating : null;
    }
    
    // Additional insights  
    companyData.recent_news = Array.isArray(companyResearch.additional_insights) ? 
      companyResearch.additional_insights : companyData.recent_news;
    
    // Note: Domain field removed as it doesn't exist in schema
    
    // Determine size category from employee count
    if (companyResearch.employee_count) {
      const count = parseInt(companyResearch.employee_count);
      if (count < 50) companyData.company_size_category = 'startup';
      else if (count < 200) companyData.company_size_category = 'small';
      else if (count < 1000) companyData.company_size_category = 'medium';
      else if (count < 10000) companyData.company_size_category = 'large';
      else companyData.company_size_category = 'enterprise';
    }
    
    // Research metadata  
    companyData.research_confidence = companyResearch.research_confidence || 'medium';
    companyData.research_last_updated = new Date().toISOString();
    companyData.research_source = 'gpt_web_search';
    
    console.log(`🔍 Comprehensive research mapped - confidence: ${companyData.research_confidence}`);
    console.log(`🔍 Storing ${Object.keys(companyData).length} company data fields`);
  }

  console.log(`🔍 DEBUG: About to insert company data with keys:`, Object.keys(companyData));
  console.log(`🔍 DEBUG: Sample data:`, JSON.stringify({
    name: companyData.name,
    founded_year: companyData.founded_year,
    employee_count: companyData.employee_count,
    website_url: companyData.website_url,
    industry_sector: companyData.industry_sector
  }, null, 2));

  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert(companyData)
    .select('id')
    .single();

  if (error) {
    console.error(`🔍 ERROR: Failed to insert company data:`, error);
    console.error(`🔍 ERROR: Company data that failed:`, JSON.stringify(companyData, null, 2));
    // If it's a duplicate key error, try to find the existing company
    if (error.code === '23505' && error.message.includes('idx_companies_name_unique')) {
      console.log(`🏢 Company "${companyName}" already exists, fetching existing record`);
      const { data: existingCompany, error: selectError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName.trim())
        .single();
      
      if (existingCompany) {
        return existingCompany.id;
      }
      
      throw new Error(`Failed to find existing company "${companyName}": ${selectError?.message || 'Unknown error'}`);
    }
    
    throw new Error(`Failed to create company "${companyName}": ${error?.message || 'Unknown error'}`);
  }

  if (!newCompany) {
    throw new Error(`Failed to create company "${companyName}": No data returned`);
  }

  return newCompany.id;
}

/**
 * Update existing company with comprehensive new research data
 */
async function updateCompanyWithResearch(companyId: string, companyResearch: any): Promise<void> {
  console.log(`🔍 Updating company with comprehensive research data:`, Object.keys(companyResearch));
  
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Comprehensive data mapping (using actual web search field names)
  if (companyResearch.website || companyResearch.official_website) {
    updateData.website_url = companyResearch.website || companyResearch.official_website;
  }
  if (companyResearch.industry) {
    updateData.industry_sector = companyResearch.industry;
    updateData.industry = companyResearch.industry; // Fallback field
  }
  if (companyResearch.headquarters) updateData.headquarters_location = companyResearch.headquarters;
  if (companyResearch.description || companyResearch.employee_reviews_summary) {
    updateData.description = companyResearch.description || companyResearch.employee_reviews_summary;
  }
  
  // Foundational information
  if (companyResearch.founded) updateData.founded_year = parseInt(companyResearch.founded);
  if (companyResearch.job_specific?.direct_application_link) {
    updateData.careers_page_url = companyResearch.job_specific.direct_application_link;
  }
  if (companyResearch.business_model) updateData.business_model = companyResearch.business_model;
  if (companyResearch.employee_count) updateData.employee_count = parseInt(companyResearch.employee_count);
  
  // Arrays of detailed information
  if (Array.isArray(companyResearch.office_locations)) updateData.office_locations = companyResearch.office_locations;
  if (Array.isArray(companyResearch.products_services)) updateData.key_products_services = companyResearch.products_services;
  if (Array.isArray(companyResearch.notable_investors)) updateData.notable_investors = companyResearch.notable_investors;
  if (Array.isArray(companyResearch.leadership_team)) updateData.leadership_team = companyResearch.leadership_team;
  if (Array.isArray(companyResearch.company_values)) updateData.company_values = companyResearch.company_values;
  if (Array.isArray(companyResearch.culture_highlights)) updateData.culture_highlights = companyResearch.culture_highlights;
  if (Array.isArray(companyResearch.competitors)) updateData.competitors = companyResearch.competitors;
  if (Array.isArray(companyResearch.diversity_initiatives)) updateData.diversity_initiatives = companyResearch.diversity_initiatives;
  if (Array.isArray(companyResearch.awards_recognition)) updateData.awards_recognition = companyResearch.awards_recognition;
  if (Array.isArray(companyResearch.recent_news)) updateData.recent_news = companyResearch.recent_news;
  
  // Text fields with detailed information
  if (companyResearch.funding_status) updateData.funding_status = companyResearch.funding_status;
  if (companyResearch.employee_reviews_summary) updateData.employee_reviews_summary = companyResearch.employee_reviews_summary;
  if (companyResearch.remote_work_policy) updateData.remote_work_policy = companyResearch.remote_work_policy;
  
  // Glassdoor rating (parse if string)
  if (companyResearch.glassdoor_rating) {
    const rating = parseFloat(companyResearch.glassdoor_rating);
    if (!isNaN(rating)) updateData.glassdoor_rating = rating;
  }
  
  // Update domain from website URL
  const websiteUrl = companyResearch.website || companyResearch.official_website;
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      updateData.domain = url.hostname.replace('www.', '');
    } catch (e) {
      console.log(`⚠️ Invalid website URL: ${websiteUrl}`);
    }
  }
  
  // Determine size category from employee count
  if (companyResearch.employee_count) {
    const count = parseInt(companyResearch.employee_count);
    if (count < 50) updateData.company_size_category = 'startup';
    else if (count < 200) updateData.company_size_category = 'small';
    else if (count < 1000) updateData.company_size_category = 'medium';
    else if (count < 10000) updateData.company_size_category = 'large';
    else updateData.company_size_category = 'enterprise';
  }
  
  // Research metadata
  updateData.research_confidence = companyResearch.research_confidence || 'medium';
  updateData.research_last_updated = new Date().toISOString();
  updateData.research_source = 'gpt_web_search';

  const { error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', companyId);

  if (error) {
    console.warn(`Failed to update company research: ${error.message}`);
  } else {
    console.log(`✅ Updated company with comprehensive research data (${Object.keys(updateData).length} fields)`);
  }
}

/**
 * Calculate quality score based on data completeness (same logic as before)
 */
function calculateQualityScore(rawJob: any, extracted: any): number {
  let score = 0.0;

  // Basic information (40%)
  if (rawJob.title) score += 0.1;
  if (rawJob.description) score += 0.15;
  if (extracted.company_name) score += 0.1;
  if (rawJob.location) score += 0.05;

  // Application details (30%)
  if (extracted.job_description_link) score += 0.1;
  if (extracted.portal_link) score += 0.1;
  if (extracted.date_posted) score += 0.1;

  // Job specifics (30%)
  if (extracted.werkstudent !== null) score += 0.05;
  if (extracted.work_mode !== 'Unknown') score += 0.1;
  if (extracted.named_skills_tools.length > 0) score += 0.1;
  if (extracted.german_required !== 'unknown') score += 0.05;

  return Math.min(score, 1.0);
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}