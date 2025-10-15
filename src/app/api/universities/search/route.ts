import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API endpoint to search universities from database
 * GET /api/universities/search?q=<query>&limit=<limit>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query.length < 2) {
      return NextResponse.json({ universities: [] });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Search universities by name (case-insensitive)
    const { data, error } = await supabase
      .from('universities')
      .select('name, city, state, university_type')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
      .order('name')
      .limit(Math.min(limit, 50)); // Cap at 50 results

    if (error) {
      console.error('Error searching universities:', error);
      return NextResponse.json(
        { error: 'Failed to search universities' },
        { status: 500 }
      );
    }

    // Return university names with location for display
    const universities = (data || []).map(uni => ({
      name: uni.name,
      display: `${uni.name} - ${uni.city}, ${uni.state}`,
      city: uni.city,
      state: uni.state,
      type: uni.university_type
    }));

    return NextResponse.json({ universities });
  } catch (error) {
    console.error('University search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
