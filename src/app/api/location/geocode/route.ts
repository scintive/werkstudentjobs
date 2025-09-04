import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/lib/services/locationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location } = body;

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location string is required' },
        { status: 400 }
      );
    }

    console.log(`🗺️ Geocoding API: Processing "${location}"`);

    const result = await locationService.geocodeLocation(location);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode location' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        latitude: result.latitude,
        longitude: result.longitude,
        display_name: result.display_name,
        city: result.city,
        country: result.country,
        country_code: result.country_code
      }
    });

  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json(
      { error: 'Location query parameter is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`🗺️ Geocoding API: Processing GET "${location}"`);

    const result = await locationService.geocodeLocation(location);

    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode location' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        latitude: result.latitude,
        longitude: result.longitude,
        display_name: result.display_name,
        city: result.city,
        country: result.country,
        country_code: result.country_code
      }
    });

  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}