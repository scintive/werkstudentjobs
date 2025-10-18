import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { locationService } from '@/lib/services/locationService';

export async function POST() {
  try {
    console.log('🗺️ Starting bulk geocoding of existing jobs...');

    // Get all jobs without coordinates
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, city, country, location_raw, latitude, longitude')
      .or('latitude.is.null,longitude.is.null')
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Failed to fetch jobs: ${fetchError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs need geocoding - all jobs already have coordinates',
        processed: 0,
        updated: 0
      });
    }

    console.log(`🗺️ Found ${jobs.length} jobs that need geocoding`);

    let processed = 0;
    let updated = 0;
    let errors = 0;
    const results = [];

    for (const job of jobs) {
      processed++;

      // Type assertion for job object
      const jobData = job as Record<string, unknown>;

      // Determine the best location string to geocode
      let locationToGeocode = null;

      if (jobData.city && jobData.country) {
        locationToGeocode = `${jobData.city}, ${jobData.country}`;
      } else if (jobData.city) {
        locationToGeocode = jobData.city as string;
      } else if (jobData.location_raw) {
        // Skip if location indicates remote work
        const locationRaw = jobData.location_raw as string;
        if (locationRaw.toLowerCase().includes('remote')) {
          console.log(`🗺️ Skipping remote job ${jobData.id}: ${locationRaw}`);
          results.push({
            id: jobData.id,
            location: locationRaw,
            status: 'skipped_remote',
            coordinates: null
          });
          continue;
        }
        locationToGeocode = locationRaw;
      }

      if (!locationToGeocode || !locationToGeocode.trim()) {
        console.log(`🗺️ Skipping job ${jobData.id}: No valid location data`);
        results.push({
          id: jobData.id,
          location: 'No location data',
          status: 'skipped_no_location',
          coordinates: null
        });
        continue;
      }

      console.log(`🗺️ [${processed}/${jobs.length}] Geocoding job ${jobData.id}: "${locationToGeocode}"`);

      try {
        const geocoded = await locationService.geocodeLocation(locationToGeocode);

        if (geocoded) {
          // Update job with coordinates
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: updateError } = await (supabase as any)
            .from('jobs')
            .update({
              latitude: geocoded.latitude,
              longitude: geocoded.longitude
            })
            .eq('id', jobData.id as string);

          if (updateError) {
            console.error(`🗺️ Failed to update job ${jobData.id}:`, updateError.message);
            errors++;
            results.push({
              id: jobData.id,
              location: locationToGeocode,
              status: 'update_error',
              coordinates: null,
              error: updateError.message
            });
          } else {
            updated++;
            console.log(`🗺️ ✅ Updated job ${jobData.id} with coordinates [${geocoded.latitude}, ${geocoded.longitude}]`);
            results.push({
              id: jobData.id,
              location: locationToGeocode,
              status: 'success',
              coordinates: [geocoded.latitude, geocoded.longitude]
            });
          }
        } else {
          console.warn(`🗺️ Failed to geocode job ${jobData.id}: "${locationToGeocode}"`);
          errors++;
          results.push({
            id: jobData.id,
            location: locationToGeocode,
            status: 'geocoding_failed',
            coordinates: null
          });
        }
      } catch (error) {
        console.error(`🗺️ Error geocoding job ${jobData.id}:`, error);
        errors++;
        results.push({
          id: jobData.id,
          location: locationToGeocode,
          status: 'error',
          coordinates: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Rate limiting: 600ms delay to respect LocationIQ limits (1.6 req/sec vs 2 req/sec limit)
      if (processed < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    const summary = {
      success: true,
      message: 'Bulk geocoding completed',
      stats: {
        total_jobs: jobs.length,
        processed,
        updated,
        errors,
        success_rate: `${((updated / processed) * 100).toFixed(1)}%`
      },
      results
    };

    console.log(`🗺️ Bulk geocoding completed:`);
    console.log(`   📊 Processed: ${processed} jobs`);
    console.log(`   ✅ Updated: ${updated} jobs`);
    console.log(`   ❌ Errors: ${errors} jobs`);
    console.log(`   📈 Success rate: ${((updated / processed) * 100).toFixed(1)}%`);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Bulk geocoding error:', error);
    return NextResponse.json(
      { 
        error: 'Bulk geocoding failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    const { data: stats, error } = await supabase
      .from('jobs')
      .select('id, latitude, longitude, city, country, location_raw')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch job stats: ${error.message}`);
    }

    const total = stats?.length || 0;
    const withCoordinates = stats?.filter(job => {
      const jobData = job as Record<string, unknown>;
      return jobData.latitude && jobData.longitude;
    }).length || 0;
    const withoutCoordinates = total - withCoordinates;

    return NextResponse.json({
      success: true,
      stats: {
        total_jobs: total,
        jobs_with_coordinates: withCoordinates,
        jobs_without_coordinates: withoutCoordinates,
        geocoding_completion: `${((withCoordinates / total) * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}