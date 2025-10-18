/**
 * Hook for geo-enhanced job matching with distance-based scoring
 */

import { useState, useEffect, useMemo } from 'react';
import { geoEnhancedMatchingService } from '../services/geoEnhancedMatchingService';
import type { JobWithCompany } from '../supabase/types';

interface UseGeoEnhancedJobsOptions {
  jobs: JobWithCompany[];
  userLocation?: string | null;
  maxDistanceKm?: number;
  enableGeoMatching?: boolean;
}

export interface GeoEnhancedJob extends JobWithCompany {
  distanceKm?: number;
  locationScore?: number;
  locationExplanation?: string;
  enhancedMatchScore?: number | null;
}

export function useGeoEnhancedJobs({
  jobs,
  userLocation,
  maxDistanceKm = 100,
  enableGeoMatching = true
}: UseGeoEnhancedJobsOptions) {
  const [enhancedJobs, setEnhancedJobs] = useState<GeoEnhancedJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationMatchesCache, setLocationMatchesCache] = useState(new Map());

  // Process jobs with geo-enhanced scoring
  useEffect(() => {
    console.log('🗺️ useGeoEnhancedJobs: enableGeoMatching:', enableGeoMatching, 'userLocation:', userLocation, 'jobs.length:', jobs.length);
    
    if (!enableGeoMatching || !userLocation || jobs.length === 0) {
      console.log('🗺️ useGeoEnhancedJobs: Skipping geo-enhancement - enableGeoMatching:', enableGeoMatching, 'userLocation:', userLocation, 'jobsLength:', jobs.length);
      setEnhancedJobs(jobs);
      return;
    }

    setIsProcessing(true);

    const processJobs = async () => {
      try {
        console.log(`🗺️ Processing ${jobs.length} jobs for geo-enhanced matching`);
        
        const locationMatches = await geoEnhancedMatchingService.batchCalculateLocationMatches(
          userLocation,
          jobs
        );

        const jobsWithGeoData: GeoEnhancedJob[] = jobs.map(job => {
          const locationMatch = locationMatches.get(job.id);

          if (!locationMatch) {
            return {
              ...job,
              locationScore: 0.5,
              locationExplanation: 'No location data',
              enhancedMatchScore: job.match_score
            };
          }

          // Use original match score - fastMatchingService already handles location properly
          const enhancedMatchScore = job.match_score;

          return {
            ...job,
            distanceKm: locationMatch.distanceKm,
            locationScore: locationMatch.score,
            locationExplanation: locationMatch.explanation,
            enhancedMatchScore
          };
        });

        // Sort by enhanced score if available, otherwise by original score
        const sortedJobs = jobsWithGeoData.sort((a, b) => {
          const scoreA = a.enhancedMatchScore || a.match_score || 0;
          const scoreB = b.enhancedMatchScore || b.match_score || 0;
          return scoreB - scoreA;
        });

        setEnhancedJobs(sortedJobs);
        setLocationMatchesCache(locationMatches);

        console.log(`🗺️ Processed ${sortedJobs.length} jobs with geo-enhanced scoring`);

      } catch (error) {
        console.error('Geo-enhanced job processing error:', error);
        setEnhancedJobs(jobs); // Fallback to original jobs
      } finally {
        setIsProcessing(false);
      }
    };

    // Debounce processing
    const timeoutId = setTimeout(processJobs, 300);
    return () => clearTimeout(timeoutId);
  }, [jobs, userLocation, enableGeoMatching, maxDistanceKm]);

  // Memoized filtering and sorting functions
  const normalizeMode = (mode?: string | null) => (mode || '').toString().toLowerCase();
  const jobsByDistance = useMemo(() => {
    if (!enableGeoMatching) return enhancedJobs;

    return enhancedJobs
      .filter(job => 
        !job.distanceKm || // Include remote/unknown
        job.distanceKm <= maxDistanceKm ||
        normalizeMode(job.work_mode) === 'remote'
      )
      .sort((a, b) => {
        // Remote jobs first
        const aRemote = normalizeMode(a.work_mode) === 'remote';
        const bRemote = normalizeMode(b.work_mode) === 'remote';
        if (aRemote && !bRemote) return -1;
        if (bRemote && !aRemote) return 1;
        
        // Then by distance
        const aDist = a.distanceKm || Infinity;
        const bDist = b.distanceKm || Infinity;
        return aDist - bDist;
      });
  }, [enhancedJobs, enableGeoMatching, maxDistanceKm]);

  const stats = useMemo(() => {
    const totalJobs = enhancedJobs.length;
    const jobsWithDistance = enhancedJobs.filter(job => job.distanceKm !== undefined).length;
    const remoteJobs = enhancedJobs.filter(job => normalizeMode(job.work_mode) === 'remote').length;
    const nearbyJobs = enhancedJobs.filter(job => job.distanceKm && job.distanceKm <= 20).length;

    return {
      totalJobs,
      jobsWithDistance,
      remoteJobs,
      nearbyJobs,
      averageDistance: jobsWithDistance > 0 
        ? Math.round(
            enhancedJobs
              .filter(job => job.distanceKm !== undefined)
              .reduce((sum, job) => sum + (job.distanceKm || 0), 0) / jobsWithDistance
          )
        : null
    };
  }, [enhancedJobs]);

  return {
    enhancedJobs,
    jobsByDistance,
    isProcessing,
    stats,
    locationMatchesCache
  };
}
