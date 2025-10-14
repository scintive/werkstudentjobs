/**
 * Backfill coordinates for jobs that don't have them yet
 * Run with: node backfill-job-coordinates.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// LocationIQ configuration
const LOCATIONIQ_API_KEY = 'pk.c872c9a813b67a201b9974da5c89cc44';
const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1/search';

// Rate limiting: LocationIQ free tier allows 2 requests per second
const DELAY_MS = 600; // 600ms between requests = ~1.6 requests/second

/**
 * Geocode a location string to coordinates
 */
async function geocodeLocation(locationString) {
  if (!locationString?.trim()) return null;

  // Enhance search term for better results
  let enhancedLocation = locationString.trim();

  // Add country context for German cities
  if (!enhancedLocation.toLowerCase().includes('germany') &&
      !enhancedLocation.toLowerCase().includes('deutschland') &&
      !enhancedLocation.includes(',')) {
    const germanCities = ['berlin', 'munich', 'münchen', 'hamburg', 'cologne', 'köln', 'frankfurt', 'stuttgart', 'düsseldorf', 'dortmund', 'essen'];
    if (germanCities.some(city => enhancedLocation.toLowerCase().includes(city))) {
      enhancedLocation = `${enhancedLocation}, Germany`;
    }
  }

  try {
    const url = new URL(LOCATIONIQ_BASE_URL);
    url.searchParams.set('key', LOCATIONIQ_API_KEY);
    url.searchParams.set('q', enhancedLocation);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('accept-language', 'en');

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.warn(`⚠️ Geocoding failed for "${locationString}": ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn(`⚠️ No results for "${locationString}"`);
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name
    };

  } catch (error) {
    console.error(`❌ Error geocoding "${locationString}":`, error.message);
    return null;
  }
}

/**
 * Delay execution
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main backfill function
 */
async function backfillCoordinates() {
  console.log('🗺️ Starting coordinate backfill for jobs...\n');

  // Get jobs without coordinates
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, city, location_raw, work_mode')
    .is('latitude', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching jobs:', error);
    process.exit(1);
  }

  if (!jobs || jobs.length === 0) {
    console.log('✅ All jobs already have coordinates!');
    return;
  }

  console.log(`📍 Found ${jobs.length} jobs without coordinates\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const progress = `[${i + 1}/${jobs.length}]`;

    // Skip remote jobs
    if (job.work_mode?.toLowerCase() === 'remote') {
      console.log(`${progress} ⏭️  Skipping remote job: ${job.title}`);
      skipCount++;
      continue;
    }

    // Determine location to geocode
    const location = job.city || job.location_raw;

    if (!location || location.toLowerCase().includes('remote')) {
      console.log(`${progress} ⏭️  No valid location for: ${job.title}`);
      skipCount++;
      continue;
    }

    console.log(`${progress} 🔍 Geocoding "${location}" for: ${job.title}`);

    // Geocode the location
    const geocoded = await geocodeLocation(location);

    if (geocoded) {
      // Update job with coordinates
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          latitude: geocoded.latitude,
          longitude: geocoded.longitude
        })
        .eq('id', job.id);

      if (updateError) {
        console.error(`${progress} ❌ Failed to update job ${job.id}:`, updateError.message);
        failCount++;
      } else {
        console.log(`${progress} ✅ Updated: [${geocoded.latitude}, ${geocoded.longitude}]`);
        successCount++;
      }
    } else {
      console.log(`${progress} ❌ Failed to geocode "${location}"`);
      failCount++;
    }

    // Rate limiting delay
    if (i < jobs.length - 1) {
      await delay(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully geocoded: ${successCount} jobs`);
  console.log(`❌ Failed to geocode: ${failCount} jobs`);
  console.log(`⏭️  Skipped (remote/no location): ${skipCount} jobs`);
  console.log(`📍 Total processed: ${jobs.length} jobs`);
  console.log('='.repeat(60));
}

// Run the backfill
backfillCoordinates()
  .then(() => {
    console.log('\n✅ Backfill complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });
