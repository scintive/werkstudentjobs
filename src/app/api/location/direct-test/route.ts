import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_KEY = 'pk.c872c9a813b67a201b9974da5c89cc44';
    const location = 'Berlin, Germany';
    
    const url = `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(location)}&format=json&limit=1`;
    
    console.log('🧪 Direct LocationIQ test URL:', url);
    
    const response = await fetch(url);
    
    console.log('🧪 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🧪 LocationIQ Error:', errorText);
      return NextResponse.json({
        error: `API Error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('🧪 Response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      success: true,
      rawResponse: data,
      firstResult: data[0] || null
    });
    
  } catch (error) {
    console.error('🧪 Direct test error:', error);
    return NextResponse.json(
      { error: 'Direct test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}