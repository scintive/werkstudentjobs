/**
 * LocationIQ Geocoding Service
 * Handles geocoding addresses/cities to lat/lon coordinates with caching
 */

interface LocationIQResponse {
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
}

interface GeocodedLocation {
  latitude: number;
  longitude: number;
  display_name: string;
  city?: string;
  country?: string;
  country_code?: string;
}

export class LocationService {
  private readonly API_KEY = 'pk.c872c9a813b67a201b9974da5c89cc44';
  private readonly BASE_URL = 'https://us1.locationiq.com/v1/search';
  private cache = new Map<string, GeocodedLocation>();

  /**
   * Geocode a location string to coordinates
   */
  async geocodeLocation(locationString: string): Promise<GeocodedLocation | null> {
    if (!locationString?.trim()) return null;

    // Enhance search term for better results
    let enhancedLocationString = locationString.trim();
    
    // Add country context for German cities if not specified
    if (!enhancedLocationString.toLowerCase().includes('germany') && 
        !enhancedLocationString.toLowerCase().includes('deutschland') &&
        !enhancedLocationString.includes(',')) {
      // Common German cities - add Germany context
      const germanCities = ['berlin', 'munich', 'münchen', 'hamburg', 'cologne', 'köln', 'frankfurt', 'stuttgart', 'düsseldorf', 'dortmund', 'essen'];
      if (germanCities.some(city => enhancedLocationString.toLowerCase().includes(city))) {
        enhancedLocationString = `${enhancedLocationString}, Germany`;
      }
    }

    const cacheKey = enhancedLocationString.toLowerCase().trim();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`🗺️ LocationService: Cache hit for "${locationString}"`);
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = new URL(this.BASE_URL);
      url.searchParams.set('key', this.API_KEY);
      url.searchParams.set('q', enhancedLocationString);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('accept-language', 'en'); // Prefer English results

      console.log(`🗺️ LocationService: Geocoding "${locationString}" (enhanced: "${enhancedLocationString}")`);
      console.log(`🗺️ LocationService: URL: ${url.toString()}`);
      
      const response = await fetch(url.toString());
      
      console.log(`🗺️ LocationService: Response status: ${response.status} ${response.statusText}`);
      
      let data: LocationIQResponse[] = [];
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`LocationIQ API error: ${response.status} ${response.statusText} for "${enhancedLocationString}"`);
        console.warn(`LocationIQ Error details:`, errorText);
        
        // Try fallback with original term if enhanced term failed
        if (enhancedLocationString !== locationString.trim()) {
          console.log(`🗺️ Trying fallback geocoding with original term: "${locationString.trim()}"`);
          try {
            const fallbackUrl = new URL(this.BASE_URL);
            fallbackUrl.searchParams.set('key', this.API_KEY);
            fallbackUrl.searchParams.set('q', locationString.trim());
            fallbackUrl.searchParams.set('format', 'json');
            fallbackUrl.searchParams.set('limit', '1');
            fallbackUrl.searchParams.set('accept-language', 'en');
            
            const fallbackResponse = await fetch(fallbackUrl.toString());
            if (fallbackResponse.ok) {
              const fallbackData: LocationIQResponse[] = await fallbackResponse.json();
              if (fallbackData && fallbackData.length > 0) {
                console.log(`🗺️ Fallback geocoding successful for "${locationString}"`);
                data = fallbackData;
              }
            }
          } catch (fallbackError) {
            console.warn(`Fallback geocoding also failed:`, fallbackError);
          }
        }
        
        if (data.length === 0) {
          return null;
        }
      } else {
        data = await response.json();
      }
      console.log(`🗺️ LocationService: Response data:`, data);
      
      if (!data || data.length === 0) {
        console.warn(`No results found for location: "${locationString}"`);
        return null;
      }

      const result = data[0];
      const geocoded: GeocodedLocation = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name,
        city: result.address?.city || result.address?.town || result.address?.village || null,
        country: result.address?.country || null,
        country_code: result.address?.country_code || null
      };

      // Cache the result
      this.cache.set(cacheKey, geocoded);
      
      console.log(`🗺️ LocationService: Geocoded "${locationString}" to [${geocoded.latitude}, ${geocoded.longitude}]`);
      return geocoded;

    } catch (error) {
      console.error('LocationService geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points in kilometers
   * Using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get location compatibility score based on distance
   */
  getLocationScore(distanceKm: number): number {
    if (distanceKm <= 5) return 1.0;      // Same city/very close
    if (distanceKm <= 20) return 0.9;     // Nearby/commutable
    if (distanceKm <= 50) return 0.7;     // Regional
    if (distanceKm <= 100) return 0.5;    // Same state/area
    if (distanceKm <= 200) return 0.3;    // Nearby states
    return 0.1; // Far away but still some compatibility
  }

  /**
   * Batch geocode multiple locations
   */
  async geocodeBatch(locations: string[]): Promise<Map<string, GeocodedLocation | null>> {
    const results = new Map<string, GeocodedLocation | null>();
    
    // Process with small delays to respect rate limits
    for (const location of locations) {
      const result = await this.geocodeLocation(location);
      results.set(location, result);
      
      // Add delay to respect rate limits (LocationIQ free tier: 2 requests per second)
      await new Promise(resolve => setTimeout(resolve, 600)); // 600ms = ~1.6 requests per second
    }
    
    return results;
  }

  /**
   * Check if a location is in the same country
   */
  isSameCountry(location1: GeocodedLocation, location2: GeocodedLocation): boolean {
    return location1.country_code === location2.country_code;
  }
}

export const locationService = new LocationService();