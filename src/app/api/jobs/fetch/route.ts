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
 * Revolutionary universal tool extraction using semantic patterns
 * Works across ALL industries: tech, medicine, warehouse, finance, etc.
 *
 * Philosophy: Tools are typically NOUNS (things you use), while skills are ACTIONS/QUALITIES
 * Tools include: software, equipment, systems, machinery, instruments, platforms
 */
function extractToolsFromSkills(skillsAndTools: string[]): string[] {
  if (!Array.isArray(skillsAndTools)) return [];

  const tools: string[] = [];

  // Universal semantic patterns that indicate a tool (not skill)
  const toolIndicators = [
    // Generic tool indicators (work for ANY industry)
    /\b(system|software|platform|tool|application|suite|solution)[s]?\b/i,

    // Brand/Product patterns (proper nouns, typically capitalized)
    /^[A-Z][a-zA-Z0-9]*(\s+[A-Z][a-zA-Z0-9]*)*$/,  // "Excel", "Microsoft Teams", "SAP"

    // Acronyms (2-6 uppercase letters, possibly with numbers)
    /^[A-Z]{2,6}(\d+)?$/,  // "CRM", "ERP", "SQL", "AWS", "MS365"

    // Version numbers (indicates specific software/tool)
    /\b(v\d+|\d+\.\d+|version\s+\d+|20\d{2})\b/i,  // "Python 3.x", "Excel 2019"

    // Microsoft/Google products
    /^(microsoft|ms|google|adobe|apple|ibm|oracle)\s+/i,

    // Equipment/Machinery indicators
    /\b(machine|equipment|device|instrument|apparatus|machinery)\b/i,

    // Medical equipment patterns
    /\b(scanner|monitor|ventilator|analyzer|pump|meter|scope)\b/i,

    // Warehouse/logistics patterns
    /\b(forklift|pallet\s+jack|scanner|conveyor|loader|truck|vehicle)\b/i,

    // Point-of-sale and retail
    /\b(pos|register|scanner|terminal)\b/i,

    // Programming frameworks/libraries (end with common suffixes)
    /\.(js|py|rb|php|net|io)$/i,
    /(React|Angular|Vue|Django|Flask|Rails|Laravel|Spring)/i,

    // Database systems
    /\b(database|db|sql|nosql|mongo|postgres|mysql|oracle)\b/i,
  ];

  // Skill indicators (things that are NOT tools)
  const skillIndicators = [
    // Action verbs
    /^(managing|leading|analyzing|designing|developing|creating|building|implementing|coordinating|communicating|organizing|planning|solving)\b/i,

    // Abstract qualities/abilities
    /\b(ability|skill|knowledge|experience|proficiency|expertise|capability|competency)\b/i,

    // Soft skills patterns
    /\b(communication|teamwork|leadership|management|organization|problem[\s-]solving|time[\s-]management|attention\s+to\s+detail)\b/i,

    // Language proficiency (these are skills, not tools)
    /^(german|english|french|spanish|italian|chinese|japanese|hindi|arabic|portuguese|russian)(\s+(fluent|native|basic|intermediate|advanced|c1|b2|a1|a2))?$/i,
  ];

  for (const item of skillsAndTools) {
    if (!item || typeof item !== 'string') continue;

    const trimmed = item.trim();

    // Skip if it's clearly a skill, not a tool
    const isSkill = skillIndicators.some(pattern => pattern.test(trimmed));
    if (isSkill) continue;

    // Check if it matches tool patterns
    const isTool = toolIndicators.some(pattern => pattern.test(trimmed));

    // Additional heuristics:
    // 1. If it's capitalized and not all caps (likely a brand/product name)
    const isProperNoun = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed) && trimmed.length > 3;

    // 2. If it contains special tech characters
    const hasTechChars = /[.#@/\\-]/.test(trimmed);

    if (isTool || isProperNoun || hasTechChars) {
      tools.push(trimmed);
    }
  }

  return [...new Set(tools)]; // Remove duplicates
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '500'),
      1000 // Increased maximum limit to show ALL jobs
    );
    const offset = parseInt(searchParams.get('offset') || '0');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const searchQuery = searchParams.get('search')?.trim() || '';

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

    // Build query for jobs from Supabase with company information
    let query = supabase
      .from('jobs')
      .select(`
        *,
        companies (*)
      `, { count: 'exact' })
      .eq('is_active', true);

    // Add server-side search if query provided
    if (searchQuery) {
      // Use Postgres text search for better performance
      // Search across title, description, skills, tools, city, country
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: jobsData, error: jobsError, count } = await query;

    if (jobsError) {
      throw new Error(`Failed to fetch jobs from database: ${jobsError.message}`);
    }

    // If no jobs found, try to fetch some new ones
    if (!jobsData || jobsData.length === 0) {
      console.log('No jobs in database, fetching fresh data...');
      await fetchAndStoreNewJobs(limit);

      // Try again after fetching
      const { data: retryData, error: retryError, count: retryCount } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (*)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (retryError) {
        throw new Error(`Failed to fetch jobs after refresh: ${retryError.message}`);
      }

      return NextResponse.json({
        success: true,
        jobs: retryData || [],
        total: retryCount || retryData?.length || 0,
        source: 'fresh_fetch'
      });
    }

    // DEBUG: Log what we're sending to client
    console.log('🔍 FETCH API: Sending jobs to client');
    console.log('🔍 FETCH API: Search query:', searchQuery || 'none');
    console.log('🔍 FETCH API: Jobs returned:', jobsData.length);
    console.log('🔍 FETCH API: Total count:', count);
    if (jobsData.length > 0) {
      const firstJobObj = jobsData[0] as Record<string, unknown>;
      console.log('🔍 FETCH API: First job skills:', (firstJobObj.skills as unknown[])?.slice(0, 3));
      console.log('🔍 FETCH API: First job skills count:', (firstJobObj.skills as unknown[])?.length || 0);
      console.log('🔍 FETCH API: First job title:', firstJobObj.title as string);
    }

    return NextResponse.json({
      success: true,
      jobs: jobsData as JobWithCompany[],
      total: count || jobsData.length,
      offset,
      limit,
      hasMore: (count || 0) > offset + jobsData.length,
      source: 'database',
      searchQuery: searchQuery || undefined,
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
async function processAndStoreJob(rawJob: unknown): Promise<void> {
  try {
    // Type assertion for rawJob to enable property access
    const rawJobObj = rawJob as Record<string, unknown>;

    // 1. Parse job information only (cost-efficient, focuses on skills extraction)
    let extractedJob;

    try {
      console.log(`📋 Starting cost-efficient job parsing for: ${rawJobObj.title as string} at ${rawJobObj.companyName as string}`);
      
      // Use new cost-efficient method that focuses on extracting meaningful skills
      extractedJob = await llmService.parseJobInfoOnly(rawJob);
      console.log(`✅ Job parsing successful - extracted ${extractedJob.named_skills_tools?.length || 0} skills`);
    } catch (error) {
      console.warn(`⚠️ Cost-efficient parsing failed for job: ${rawJobObj.title}, using basic extraction:`, error);
      
      // Fallback to basic extraction if parsing fails
      extractedJob = await llmService.extractJobInfo(rawJob);
    }
    
    // 2. Separate company research (only if needed and cost-effective)
    let companyResearch = null;
    
    try {
      const companyName = (extractedJob.company_name || rawJobObj.companyName) as string;
      console.log(`🏢 INITIAL DEBUG: Company name from extracted:`, extractedJob.company_name);
      console.log(`🏢 INITIAL DEBUG: Company name from raw:`, rawJobObj.companyName);
      console.log(`🏢 INITIAL DEBUG: Final company name:`, companyName);

      if (companyName && companyName !== 'Unknown Company') {
        console.log(`🏢 Starting separate company research for: ${companyName}`);

        const smartResearch = await llmService.smartCompanyResearch(companyName, rawJobObj as unknown);
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
      (extractedJob.company_name || rawJobObj.companyName || 'Unknown Company') as string,
      companyResearch
    );
    
    // 4. Geocode job location if available
    const jobGeoData: { latitude: number | null, longitude: number | null } = { latitude: null, longitude: null };
    const jobLocation = (extractedJob.location_city || rawJobObj.location) as string;

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
      job_description_link: extractedJob.job_description_link || rawJobObj.link || null,
      portal_link: extractedJob.portal_link || rawJobObj.link || null,
      application_link: rawJobObj.applicationUrl || rawJobObj.applyUrl || rawJobObj.link || null, // Add application link
      source: rawJobObj.portal || 'LinkedIn', // Fix source information
      
      // Basic fallbacks
      date_posted: extractedJob.date_posted || rawJobObj.postedAt || null,
      company_name: extractedJob.company_name || rawJobObj.companyName || null,
      german_required: extractedJob.german_required || 'unknown',
      werkstudent: extractedJob.werkstudent !== null ? extractedJob.werkstudent :
                  ((rawJobObj.title as string)?.toLowerCase().includes('werkstudent') ||
                   (rawJobObj.title as string)?.toLowerCase().includes('working student') || false),
      work_mode: extractedJob.work_mode ||
                ((rawJobObj.location as string)?.toLowerCase().includes('remote') ? 'Remote' :
                 (rawJobObj.location as string)?.toLowerCase().includes('hybrid') ? 'Hybrid' : 'Unknown'),
      location_city: extractedJob.location_city || (rawJobObj.location as string)?.split(',')[0]?.trim() || null,
      location_country: extractedJob.location_country || ((rawJobObj.location as string)?.includes('Germany') ? 'Germany' : null),
      
      // Add geocoded coordinates
      latitude: jobGeoData.latitude,
      longitude: jobGeoData.longitude,
      
      // Company research results (from separate call)
      hiring_manager: (companyResearch as Record<string, unknown> | null)?.hiring_manager || null,
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
    if (((companyResearch as Record<string, unknown> | null)?.additional_insights as unknown[])?.length > 0) {
      console.log(`💡 Additional insights (${((companyResearch as Record<string, unknown> | null)?.additional_insights as unknown[])?.length}):`, (companyResearch as Record<string, unknown> | null)?.additional_insights);
    }
    if ((companyResearch as Record<string, unknown> | null)?.research_confidence) {
      console.log(`🔬 Research confidence: ${(companyResearch as Record<string, unknown> | null)?.research_confidence}`);
    }

    // 5. Prepare job data for Supabase with enhanced research fields
    const jobData = {
      external_id: rawJobObj.id || rawJobObj.url || rawJobObj.link || null,
      company_id: companyId,
      title: rawJobObj.title || 'Untitled Position',
      description: rawJobObj.description || rawJobObj.text || null,
      portal: extractedJob.source || rawJobObj.portal || 'LinkedIn', // Use fixed source
      portal_link: extractedJob.portal_link,
      job_description_link: extractedJob.job_description_link,
      application_link: extractedJob.application_link, // Use enhanced application link
      
      // Job Classification (using GPT-extracted data)
      werkstudent: extractedJob.werkstudent,
      is_werkstudent: extractedJob.werkstudent, // Both fields for compatibility
      work_mode: extractedJob.work_mode,
      contract_type: rawJobObj.employmentType || 'Unknown',
      employment_type: rawJobObj.employmentType, // Pipeline field
      seniority_level: rawJobObj.seniorityLevel, // Pipeline field
      
      // Location Data (using GPT-extracted data)
      location_raw: rawJobObj.location || null,
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
      salary_min: rawJobObj.salaryFrom ? parseInt(rawJobObj.salaryFrom as string) : null,
      salary_max: rawJobObj.salaryTo ? parseInt(rawJobObj.salaryTo as string) : null,
      salary_info: rawJobObj.salary || null, // Pipeline field
      
      // LinkedIn and Job Details (Pipeline fields)
      linkedin_url: rawJobObj.link,
      job_function: rawJobObj.jobFunction,
      industries: rawJobObj.industries ? [rawJobObj.industries] : null,
      applicants_count: parseInt(rawJobObj.applicantsCount as string) || null,
      
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
      who_we_are_looking_for: Array.isArray((extractedJob as Record<string, unknown>).who_we_are_looking_for) ? (extractedJob as Record<string, unknown>).who_we_are_looking_for : null,
      application_requirements: Array.isArray((extractedJob as Record<string, unknown>).application_requirements) ? (extractedJob as Record<string, unknown>).application_requirements : null,
      
      // Store research data in description for now (until schema is updated)
      // hiring_manager: extractedJob.hiring_manager, // TODO: Add to schema
      // job_market_analysis: extractedJob.job_market_analysis || null, // TODO: Add to schema
      // additional_insights: extractedJob.additional_insights || null, // TODO: Add to schema
      
      // Log research data for now
      // research_confidence: extractedJob.research_confidence || null, // TODO: Add to schema
      
      // Metadata
      posted_at: extractedJob.date_posted ? new Date(extractedJob.date_posted as string).toISOString() : null,
      source_quality_score: calculateQualityScore(rawJob, extractedJob),
      is_active: true
    };

    // 6. Store in Supabase (upsert to avoid duplicates)
    const { error } = await supabase
      .from('jobs')
      .upsert(jobData as any, {
        onConflict: 'external_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error storing job "${rawJobObj.title}":`, error.message);
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
async function ensureCompanyExists(companyName: string, companyResearch?: unknown): Promise<string> {
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
    const companyResearchObj = companyResearch as Record<string, unknown>;
    const shouldUpdate = companyResearch && (
      !(existingCompany as Record<string, unknown>).updated_at ||
      new Date().getTime() - new Date((existingCompany as Record<string, unknown>).updated_at as string).getTime() > 7 * 24 * 60 * 60 * 1000 || // 7 days
      (companyResearchObj.founded || companyResearchObj.employee_count || companyResearchObj.description) // OR has comprehensive data
    );

    if (shouldUpdate) {
      console.log(`🏢 Updating company research for: ${companyName}`);
      await updateCompanyWithResearch((existingCompany as Record<string, unknown>).id as string, companyResearch);
    }

    return (existingCompany as Record<string, unknown>).id as string;
  }

  // Create new company with research data
  console.log(`🏢 Creating new company with research: ${companyName}`);
  const companyData: Record<string, unknown> = {
    name: companyName.trim(),
    industry: 'Technology', // Default, will be updated by research
    size_category: 'medium' // Default, will be updated by research
  };

  // Add comprehensive research data if available (map ALL fields to database schema)
  if (companyResearch) {
    const companyResearchObj = companyResearch as Record<string, unknown>;
    console.log(`🔍 Mapping comprehensive research data for ${companyName}:`, Object.keys(companyResearchObj));

    // Basic company information (use actual web search field names)
    companyData.website_url = companyResearchObj.website || companyResearchObj.official_website || null;
    companyData.industry_sector = companyResearchObj.industry || null;
    companyData.industry = companyResearchObj.industry || companyData.industry; // Fallback field
    companyData.headquarters_location = companyResearchObj.headquarters || null;
    companyData.description = companyResearchObj.description || companyResearchObj.employee_reviews_summary || null;
    
    // Foundational information
    companyData.founded_year = companyResearchObj.founded ? parseInt(companyResearchObj.founded as string) : null;
    companyData.careers_page_url = (companyResearchObj.job_specific as Record<string, unknown>)?.direct_application_link || null;
    companyData.business_model = companyResearchObj.business_model || null;
    companyData.employee_count = companyResearchObj.employee_count ? parseInt(companyResearchObj.employee_count as string) : null;
    
    // Arrays of detailed information (using actual web search field names)
    companyData.office_locations = Array.isArray(companyResearchObj.office_locations) ? companyResearchObj.office_locations : null;
    companyData.key_products_services = Array.isArray(companyResearchObj.products_services) ? companyResearchObj.products_services : null;
    companyData.notable_investors = Array.isArray(companyResearchObj.notable_investors) ? companyResearchObj.notable_investors : null;
    companyData.leadership_team = Array.isArray(companyResearchObj.leadership_team) ? companyResearchObj.leadership_team : null;
    companyData.company_values = companyResearchObj.company_culture ? [companyResearchObj.company_culture] : null;
    companyData.culture_highlights = companyResearchObj.company_culture ? [companyResearchObj.company_culture] : null;
    companyData.competitors = Array.isArray(companyResearchObj.competitors) ? companyResearchObj.competitors : null;
    companyData.diversity_initiatives = Array.isArray(companyResearchObj.diversity_initiatives) ? companyResearchObj.diversity_initiatives : null;
    companyData.awards_recognition = Array.isArray(companyResearchObj.awards_recognition) ? companyResearchObj.awards_recognition : null;
    companyData.recent_news = Array.isArray(companyResearchObj.recent_news) ? companyResearchObj.recent_news : null;
    
    // Text fields with detailed information (using actual web search field names)
    companyData.funding_status = companyResearchObj.funding || null;
    companyData.employee_reviews_summary = companyResearchObj.employee_reviews_summary || null;
    companyData.remote_work_policy = companyResearchObj.remote_work_policy || null;
    
    // Glassdoor rating (parse if string)
    if (companyResearchObj.glassdoor_rating) {
      const rating = parseFloat(companyResearchObj.glassdoor_rating as string);
      companyData.glassdoor_rating = !isNaN(rating) ? rating : null;
    }
    
    // Additional insights  
    companyData.recent_news = Array.isArray(companyResearchObj.additional_insights) ? 
      companyResearchObj.additional_insights : companyData.recent_news;
    
    // Note: Domain field removed as it doesn't exist in schema
    
    // Determine size category from employee count
    if (companyResearchObj.employee_count) {
      const count = parseInt(companyResearchObj.employee_count as string);
      if (count < 50) companyData.company_size_category = 'startup';
      else if (count < 200) companyData.company_size_category = 'small';
      else if (count < 1000) companyData.company_size_category = 'medium';
      else if (count < 10000) companyData.company_size_category = 'large';
      else companyData.company_size_category = 'enterprise';
    }
    
    // Research metadata  
    companyData.research_confidence = companyResearchObj.research_confidence || 'medium';
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
    .insert(companyData as any)
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
        return (existingCompany as Record<string, unknown>).id as string;
      }

      throw new Error(`Failed to find existing company "${companyName}": ${selectError?.message || 'Unknown error'}`);
    }

    throw new Error(`Failed to create company "${companyName}": ${error?.message || 'Unknown error'}`);
  }

  if (!newCompany) {
    throw new Error(`Failed to create company "${companyName}": No data returned`);
  }

  return (newCompany as Record<string, unknown>).id as string;
}

/**
 * Update existing company with comprehensive new research data
 */
async function updateCompanyWithResearch(companyId: string, companyResearch: unknown): Promise<void> {
  const companyResearchObj = companyResearch as Record<string, unknown>;
  console.log(`🔍 Updating company with comprehensive research data:`, Object.keys(companyResearchObj));

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  // Comprehensive data mapping (using actual web search field names)
  if (companyResearchObj.website || companyResearchObj.official_website) {
    updateData.website_url = companyResearchObj.website || companyResearchObj.official_website;
  }
  if (companyResearchObj.industry) {
    updateData.industry_sector = companyResearchObj.industry;
    updateData.industry = companyResearchObj.industry; // Fallback field
  }
  if (companyResearchObj.headquarters) updateData.headquarters_location = companyResearchObj.headquarters;
  if (companyResearchObj.description || companyResearchObj.employee_reviews_summary) {
    updateData.description = companyResearchObj.description || companyResearchObj.employee_reviews_summary;
  }
  
  // Foundational information
  if (companyResearchObj.founded) updateData.founded_year = parseInt(companyResearchObj.founded as string);
  if ((companyResearchObj.job_specific as Record<string, unknown>)?.direct_application_link) {
    updateData.careers_page_url = (companyResearchObj.job_specific as Record<string, unknown>).direct_application_link;
  }
  if (companyResearchObj.business_model) updateData.business_model = companyResearchObj.business_model;
  if (companyResearchObj.employee_count) updateData.employee_count = parseInt(companyResearchObj.employee_count as string);
  
  // Arrays of detailed information
  if (Array.isArray(companyResearchObj.office_locations)) updateData.office_locations = companyResearchObj.office_locations;
  if (Array.isArray(companyResearchObj.products_services)) updateData.key_products_services = companyResearchObj.products_services;
  if (Array.isArray(companyResearchObj.notable_investors)) updateData.notable_investors = companyResearchObj.notable_investors;
  if (Array.isArray(companyResearchObj.leadership_team)) updateData.leadership_team = companyResearchObj.leadership_team;
  if (Array.isArray(companyResearchObj.company_values)) updateData.company_values = companyResearchObj.company_values;
  if (Array.isArray(companyResearchObj.culture_highlights)) updateData.culture_highlights = companyResearchObj.culture_highlights;
  if (Array.isArray(companyResearchObj.competitors)) updateData.competitors = companyResearchObj.competitors;
  if (Array.isArray(companyResearchObj.diversity_initiatives)) updateData.diversity_initiatives = companyResearchObj.diversity_initiatives;
  if (Array.isArray(companyResearchObj.awards_recognition)) updateData.awards_recognition = companyResearchObj.awards_recognition;
  if (Array.isArray(companyResearchObj.recent_news)) updateData.recent_news = companyResearchObj.recent_news;
  
  // Text fields with detailed information
  if (companyResearchObj.funding_status) updateData.funding_status = companyResearchObj.funding_status;
  if (companyResearchObj.employee_reviews_summary) updateData.employee_reviews_summary = companyResearchObj.employee_reviews_summary;
  if (companyResearchObj.remote_work_policy) updateData.remote_work_policy = companyResearchObj.remote_work_policy;
  
  // Glassdoor rating (parse if string)
  if (companyResearchObj.glassdoor_rating) {
    const rating = parseFloat(companyResearchObj.glassdoor_rating as string);
    if (!isNaN(rating)) updateData.glassdoor_rating = rating;
  }
  
  // Update domain from website URL
  const websiteUrl = companyResearchObj.website || companyResearchObj.official_website;
  if (websiteUrl) {
    try {
      const websiteUrlStr = websiteUrl as string;
      const url = new URL(websiteUrlStr.startsWith('http') ? websiteUrlStr : `https://${websiteUrlStr}`);
      updateData.domain = url.hostname.replace('www.', '');
    } catch (e) {
      console.log(`⚠️ Invalid website URL: ${websiteUrl}`);
    }
  }
  
  // Determine size category from employee count
  if (companyResearchObj.employee_count) {
    const count = parseInt(companyResearchObj.employee_count as string);
    if (count < 50) updateData.company_size_category = 'startup';
    else if (count < 200) updateData.company_size_category = 'small';
    else if (count < 1000) updateData.company_size_category = 'medium';
    else if (count < 10000) updateData.company_size_category = 'large';
    else updateData.company_size_category = 'enterprise';
  }
  
  // Research metadata
  updateData.research_confidence = companyResearchObj.research_confidence || 'medium';
  updateData.research_last_updated = new Date().toISOString();
  updateData.research_source = 'gpt_web_search';

  const { error } = await supabase
    .from('companies')
    .update(updateData as never)
    .eq('id', companyId)
    .maybeSingle();

  if (error) {
    console.warn(`Failed to update company research: ${error.message}`);
  } else {
    console.log(`✅ Updated company with comprehensive research data (${Object.keys(updateData).length} fields)`);
  }
}

/**
 * Calculate quality score based on data completeness (same logic as before)
 */
function calculateQualityScore(rawJob: unknown, extracted: unknown): number {
  const rawJobObj = rawJob as Record<string, unknown>;
  const extractedObj = extracted as Record<string, unknown>;
  let score = 0.0;

  // Basic information (40%)
  if (rawJobObj.title) score += 0.1;
  if (rawJobObj.description) score += 0.15;
  if (extractedObj.company_name) score += 0.1;
  if (rawJobObj.location) score += 0.05;

  // Application details (30%)
  if (extractedObj.job_description_link) score += 0.1;
  if (extractedObj.portal_link) score += 0.1;
  if (extractedObj.date_posted) score += 0.1;

  // Job specifics (30%)
  if (extractedObj.werkstudent !== null) score += 0.05;
  if (extractedObj.work_mode !== 'Unknown') score += 0.1;
  if ((extractedObj.named_skills_tools as unknown[])?.length > 0) score += 0.1;
  if (extractedObj.german_required !== 'unknown') score += 0.05;

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