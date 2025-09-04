/**
 * Geo-Enhanced Matching Service
 * Upgrades the existing matching service with accurate location-based scoring
 */

import { locationService } from './locationService';
import type { JobWithCompany } from '../supabase/types';
import type { UserProfile } from '../types';

interface GeoEnhancedMatchResult {
  jobId: string;
  totalScore: number;
  skillsScore: number;
  toolsScore: number;
  languageScore: number;
  locationScore: number;
  distanceKm?: number;
  locationExplanation: string;
}

export class GeoEnhancedMatchingService {
  /**
   * Enhanced location matching with real distance calculations
   */
  async calculateLocationMatch(
    userLocation: string | null,
    jobLocation: string | null,
    isRemote: boolean = false,
    isHybrid: boolean = false
  ): Promise<{
    score: number;
    distanceKm?: number;
    explanation: string;
  }> {
    // Handle remote jobs
    if (isRemote) {
      return {
        score: 0.95, // Small boost for remote jobs
        explanation: 'Remote position - location independent'
      };
    }

    // If no location data available, fall back to basic matching
    if (!userLocation || !jobLocation) {
      return {
        score: 0.5,
        explanation: 'Limited location data available'
      };
    }

    try {
      // Geocode both locations
      const [userGeo, jobGeo] = await Promise.all([
        locationService.geocodeLocation(userLocation),
        locationService.geocodeLocation(jobLocation)
      ]);

      if (!userGeo || !jobGeo) {
        return {
          score: 0.5,
          explanation: 'Could not geocode location data'
        };
      }

      // Calculate distance
      const distanceKm = locationService.calculateDistance(
        userGeo.latitude, userGeo.longitude,
        jobGeo.latitude, jobGeo.longitude
      );

      // Get compatibility score based on distance
      let score = locationService.getLocationScore(distanceKm);

      // Bonus for hybrid jobs (more flexibility)
      if (isHybrid && distanceKm <= 100) {
        score = Math.min(1.0, score + 0.1);
      }

      // Same country bonus
      if (locationService.isSameCountry(userGeo, jobGeo)) {
        score = Math.min(1.0, score + 0.05);
      }

      const explanation = this.getLocationExplanation(distanceKm, isHybrid);

      return {
        score,
        distanceKm,
        explanation
      };

    } catch (error) {
      console.error('Geo-enhanced location matching error:', error);
      return {
        score: 0.5,
        explanation: 'Error calculating location compatibility'
      };
    }
  }

  private getLocationExplanation(distanceKm: number, isHybrid: boolean): string {
    const hybridNote = isHybrid ? ' (hybrid eligible)' : '';
    
    if (distanceKm <= 5) return `Excellent match - ${distanceKm}km away${hybridNote}`;
    if (distanceKm <= 20) return `Great match - ${distanceKm}km commutable${hybridNote}`;
    if (distanceKm <= 50) return `Good match - ${distanceKm}km in region${hybridNote}`;
    if (distanceKm <= 100) return `Fair match - ${distanceKm}km same area${hybridNote}`;
    if (distanceKm <= 200) return `Moderate match - ${distanceKm}km nearby${hybridNote}`;
    return `Distant match - ${distanceKm}km away${hybridNote}`;
  }

  /**
   * Batch process jobs for location compatibility
   */
  async batchCalculateLocationMatches(
    userLocation: string | null,
    jobs: JobWithCompany[]
  ): Promise<Map<string, { score: number; distanceKm?: number; explanation: string }>> {
    const results = new Map();

    // Geocode user location once
    const userGeo = userLocation ? await locationService.geocodeLocation(userLocation) : null;

    console.log(`🗺️ Processing ${jobs.length} jobs for geo matching, user location: ${userLocation}`);

    // Calculate matches for each job
    for (const job of jobs) {
      const isRemote = job.work_mode === 'remote' || job.is_remote;
      const isHybrid = job.work_mode === 'hybrid';

      if (isRemote) {
        results.set(job.id, {
          score: 0.95,
          explanation: 'Remote position - location independent'
        });
        continue;
      }

      if (!userGeo) {
        results.set(job.id, {
          score: 0.5,
          explanation: 'No user location provided'
        });
        continue;
      }

      // Check if job has coordinates in database
      if (job.latitude && job.longitude) {
        console.log(`🗺️ Using stored coordinates for job ${job.id}: [${job.latitude}, ${job.longitude}]`);
        
        // Use stored coordinates
        const distanceKm = locationService.calculateDistance(
          userGeo.latitude, userGeo.longitude,
          parseFloat(job.latitude.toString()), parseFloat(job.longitude.toString())
        );

        let score = locationService.getLocationScore(distanceKm);
        
        // Apply bonuses
        if (isHybrid && distanceKm <= 100) {
          score = Math.min(1.0, score + 0.1);
        }

        results.set(job.id, {
          score,
          distanceKm,
          explanation: this.getLocationExplanation(distanceKm, isHybrid)
        });
        continue;
      }

      // Fall back to geocoding location strings
      const jobLocation = job.location_city || job.city;
      if (!jobLocation) {
        results.set(job.id, {
          score: 0.5,
          explanation: 'No job location data available'
        });
        continue;
      }

      try {
        console.log(`🗺️ Geocoding job location for ${job.id}: "${jobLocation}"`);
        const jobGeo = await locationService.geocodeLocation(jobLocation);
        
        if (!jobGeo) {
          results.set(job.id, {
            score: 0.4,
            explanation: `Could not geocode "${jobLocation}"`
          });
          continue;
        }

        // Calculate distance and score
        const distanceKm = locationService.calculateDistance(
          userGeo.latitude, userGeo.longitude,
          jobGeo.latitude, jobGeo.longitude
        );

        let score = locationService.getLocationScore(distanceKm);
        
        // Apply bonuses
        if (isHybrid && distanceKm <= 100) {
          score = Math.min(1.0, score + 0.1);
        }
        if (locationService.isSameCountry(userGeo, jobGeo)) {
          score = Math.min(1.0, score + 0.05);
        }

        results.set(job.id, {
          score,
          distanceKm,
          explanation: this.getLocationExplanation(distanceKm, isHybrid)
        });

      } catch (error) {
        console.error(`🗺️ Error geocoding job ${job.id} location "${jobLocation}":`, error);
        results.set(job.id, {
          score: 0.4,
          explanation: `Geocoding error for "${jobLocation}"`
        });
      }
    }

    console.log(`🗺️ Processed ${results.size} jobs with geo matching`);
    return results;
  }

  /**
   * Get jobs sorted by distance from user
   */
  async getJobsByDistance(
    userLocation: string | null,
    jobs: JobWithCompany[],
    maxDistanceKm: number = 100
  ): Promise<Array<JobWithCompany & { distanceKm?: number }>> {
    if (!userLocation) return jobs;

    const locationMatches = await this.batchCalculateLocationMatches(userLocation, jobs);
    
    const jobsWithDistance = jobs.map(job => ({
      ...job,
      distanceKm: locationMatches.get(job.id)?.distanceKm
    }));

    // Filter by max distance and sort
    return jobsWithDistance
      .filter(job => 
        !job.distanceKm || // Include remote/unknown
        job.distanceKm <= maxDistanceKm ||
        job.work_mode === 'remote'
      )
      .sort((a, b) => {
        // Remote jobs first
        if (a.work_mode === 'remote' && b.work_mode !== 'remote') return -1;
        if (b.work_mode === 'remote' && a.work_mode !== 'remote') return 1;
        
        // Then by distance
        const aDist = a.distanceKm || Infinity;
        const bDist = b.distanceKm || Infinity;
        return aDist - bDist;
      });
  }
}

export const geoEnhancedMatchingService = new GeoEnhancedMatchingService();