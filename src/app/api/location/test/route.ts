import { NextResponse } from 'next/server';
import { locationService } from '@/lib/services/locationService';

export async function GET() {
  try {
    // Test with just 2 cities to avoid rate limits
    const testLocations = [
      'Berlin, Germany',
      'Munich, Germany'
    ];

    console.log('🧪 Testing LocationIQ service...');

    const results = await locationService.geocodeBatch(testLocations);

    const testResults = Array.from(results.entries()).map(([location, result]) => ({
      location,
      success: !!result,
      coordinates: result ? [result.latitude, result.longitude] : null,
      display_name: result?.display_name,
      city: result?.city,
      country: result?.country
    }));

    // Test distance calculation between Berlin and Munich
    const berlinResult = results.get('Berlin, Germany');
    const munichResult = results.get('Munich, Germany');
    
    let distanceTest = null;
    if (berlinResult && munichResult) {
      const distance = locationService.calculateDistance(
        berlinResult.latitude, berlinResult.longitude,
        munichResult.latitude, munichResult.longitude
      );
      distanceTest = {
        from: 'Berlin',
        to: 'Munich',
        distanceKm: distance,
        locationScore: locationService.getLocationScore(distance)
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      testResults,
      distanceTest,
      apiStatus: 'LocationIQ API working correctly'
    });

  } catch (error) {
    console.error('LocationIQ test error:', error);
    return NextResponse.json(
      { 
        error: 'LocationIQ test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}