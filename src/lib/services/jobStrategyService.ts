/**
 * Job Strategy Service
 * Handles business logic for generating job application strategies
 * Extracted from API routes for better SoC and testability
 */

import { supabase } from '@/lib/supabase/client';
import { llmService } from '@/lib/services/llmService';
import { fastMatchingService } from '@/lib/services/fastMatchingService';
import type {
  JobStrategy,
  CompactJobData,
  CompactProfileData,
  MatchContext
} from '@/lib/types/jobStrategy';
import type { UserProfile } from '@/lib/types';

// In-memory strategy cache (keyed by job_id + profile_hash)
const strategyCache = new Map<string, { strategy: JobStrategy; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export class JobStrategyService {
  /**
   * Generate profile hash for cache invalidation
   */
  generateProfileHash(profile: UserProfile): string {
    const key = JSON.stringify({
      skills: profile.skills,
      experience: profile.experience,
      languages: profile.languages,
      personal: profile.personal_details
    });
    return Buffer.from(key).toString('base64').slice(0, 12);
  }

  /**
   * Create compact job data for AI context (token-efficient)
   */
  createCompactJobData(job: any): CompactJobData {
    const allRequirements = [
      ...(job.skills_original || []),
      ...(job.tools_original || []),
      ...(job.responsibilities_original || [])
    ];

    return {
      title: job.title,
      company: job.companies?.name || job.company_name || 'Unknown',
      must_haves: allRequirements.slice(0, 8),
      nice_to_haves: (job.nice_to_have_original || []).slice(0, 6),
      work_mode: job.work_mode || 'Unknown',
      language_required: job.language_required || job.german_required || 'Unknown',
      location: job.location_city || 'Unknown'
    };
  }

  /**
   * Create compact profile data for AI context
   */
  createCompactProfileData(profile: UserProfile): CompactProfileData {
    const allSkills: string[] = [];
    if (profile.skills && typeof profile.skills === 'object') {
      Object.values(profile.skills).forEach(skillArray => {
        if (Array.isArray(skillArray)) {
          allSkills.push(...skillArray);
        }
      });
    }

    const achievements = (profile.experience || [])
      .filter(exp => exp && typeof exp === 'object')
      .slice(0, 5)
      .map(exp => ({
        text: exp.description || exp.summary || '',
        impact: exp.achievements || exp.impact || '',
        company: exp.company || '',
        role: exp.position || exp.title || ''
      }));

    return {
      professional_title: profile.personal_details?.professional_title || 'Professional',
      top_achievements: achievements,
      top_skills: allSkills.slice(0, 8),
      languages: profile.languages || [],
      location: profile.personal_details?.city || profile.personal_details?.location
    };
  }

  /**
   * Create match context from job and profile
   */
  async createMatchContext(job: any, profile: UserProfile): Promise<MatchContext> {
    const matchResults = await fastMatchingService.calculateBatchMatches([job], profile);
    const matchedJob = matchResults[0];

    if (!matchedJob || !matchedJob.matchCalculation) {
      throw new Error('Failed to calculate job match');
    }

    const calc = matchedJob.matchCalculation;

    return {
      total_match: Math.round(calc.totalScore || 0),
      skills_overlap: {
        matched: calc.skillsOverlap?.matched || [],
        missing: calc.skillsOverlap?.missing || []
      },
      tools_overlap: {
        matched: calc.toolsOverlap?.matched || [],
        missing: calc.toolsOverlap?.missing || []
      },
      gaps: [
        ...(calc.skillsOverlap?.missing || []),
        ...(calc.toolsOverlap?.missing || [])
      ],
      language_fit: calc.languageFit?.score || 0,
      location_fit: calc.locationFit?.score || 0
    };
  }

  /**
   * Fetch job data from database
   */
  async fetchJob(jobId: string) {
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          id,
          name,
          description,
          website,
          industry
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    return job;
  }

  /**
   * Fetch user profile from database
   */
  async fetchUserProfile(userProfileId: string): Promise<UserProfile> {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userProfileId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    return profile as UserProfile;
  }

  /**
   * Generate job application strategy
   */
  async generateStrategy(jobId: string, userProfileId: string): Promise<JobStrategy> {
    // Fetch job and profile
    const job = await this.fetchJob(jobId);
    const profile = await this.fetchUserProfile(userProfileId);

    // Check cache
    const profileHash = this.generateProfileHash(profile);
    const cacheKey = `${jobId}-${profileHash}`;
    const cached = strategyCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached strategy for', cacheKey);
      return cached.strategy;
    }

    // Create compact data for AI
    const compactJob = this.createCompactJobData(job);
    const compactProfile = this.createCompactProfileData(profile);
    const matchContext = await this.createMatchContext(job, profile);

    // Generate strategy using LLM
    console.log('🤖 Generating NEW strategy with LLM...');
    const strategy = await llmService.generateJobStrategy(
      compactJob,
      compactProfile,
      matchContext
    );

    // Cache the strategy
    strategyCache.set(cacheKey, {
      strategy,
      timestamp: Date.now()
    });

    // Clean old cache entries
    this.cleanCache();

    return strategy;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of strategyCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        strategyCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached strategies
   */
  clearCache() {
    strategyCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: strategyCache.size,
      entries: Array.from(strategyCache.keys())
    };
  }
}

// Export singleton instance
export const jobStrategyService = new JobStrategyService();
