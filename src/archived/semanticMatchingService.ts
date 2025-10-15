/**
 * Semantic Job Matching Service with Vector Similarity
 * Uses OpenAI embeddings for semantic skill matching + weighted scoring
 */

import OpenAI from 'openai';
import type { JobWithCompany, MatchCalculation, LanguageSkill } from '@/lib/supabase/types';
import type { UserProfile as LegacyUserProfile } from '@/lib/types';

// Matching weights configuration - rebalanced for better UX
const MATCH_WEIGHTS = {
  SKILLS: 0.60,      // 60% - increased from 55%
  TOOLS: 0.15,       // 15% - decreased from 20%
  LANGUAGE: 0.15,    // 15% - same
  LOCATION: 0.10     // 10% - same
} as const;

// Skill similarity cache to avoid repeated API calls
const SIMILARITY_CACHE = new Map<string, number>();

export class SemanticMatchingService {
  private openaiClient: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Calculate semantic similarity between two skills using OpenAI embeddings
   */
  private async calculateSemanticSimilarity(skill1: string, skill2: string): Promise<number> {
    if (!this.openaiClient) return skill1.toLowerCase() === skill2.toLowerCase() ? 1 : 0;

    const cacheKey = `${skill1.toLowerCase()}|${skill2.toLowerCase()}`;
    const reverseCacheKey = `${skill2.toLowerCase()}|${skill1.toLowerCase()}`;
    
    if (SIMILARITY_CACHE.has(cacheKey)) {
      return SIMILARITY_CACHE.get(cacheKey)!;
    }
    if (SIMILARITY_CACHE.has(reverseCacheKey)) {
      return SIMILARITY_CACHE.get(reverseCacheKey)!;
    }

    try {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: [skill1, skill2]
      });

      const [embedding1, embedding2] = response.data.map(item => item.embedding);
      const similarity = this.cosineSimilarity(embedding1, embedding2);
      
      SIMILARITY_CACHE.set(cacheKey, similarity);
      return similarity;
    } catch (error) {
      console.warn('Semantic similarity calculation failed, using string match:', error);
      // Fallback to enhanced string matching
      return this.enhancedStringMatch(skill1, skill2);
    }
  }

  /**
   * Enhanced string matching with fuzzy logic
   */
  private enhancedStringMatch(skill1: string, skill2: string): number {
    const s1 = skill1.toLowerCase().trim();
    const s2 = skill2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return 1.0;

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;

    // Check for common abbreviations and synonyms
    const synonymMap: Record<string, string[]> = {
      'javascript': ['js', 'ecmascript', 'node.js', 'nodejs'],
      'typescript': ['ts'],
      'python': ['py'],
      'react': ['reactjs', 'react.js'],
      'vue': ['vuejs', 'vue.js'],
      'machine learning': ['ml', 'artificial intelligence', 'ai'],
      'database': ['db', 'sql', 'mysql', 'postgresql', 'mongodb'],
      'user interface': ['ui', 'frontend'],
      'user experience': ['ux'],
      'project management': ['pm', 'scrum', 'agile'],
    };

    for (const [canonical, synonyms] of Object.entries(synonymMap)) {
      if ((canonical === s1 || synonyms.includes(s1)) && 
          (canonical === s2 || synonyms.includes(s2))) {
        return 0.95;
      }
    }

    // Calculate Levenshtein distance for partial matches
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = 1 - (distance / maxLength);

    // Only consider it a match if similarity is above 70%
    return similarity > 0.7 ? similarity * 0.6 : 0;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  /**
   * Advanced skill matching with semantic similarity and weighted coverage
   */
  async calculateAdvancedSkillMatch(
    userSkills: string[],
    jobSkills: string[]
  ): Promise<{
    score: number;
    matched: Array<{userSkill: string, jobSkill: string, similarity: number}>;
    missing: string[];
    coverage: number; // What % of job requirements are covered
  }> {
    if (!userSkills.length || !jobSkills.length) {
      return { score: 0, matched: [], missing: jobSkills, coverage: 0 };
    }

    console.log('🎯 SEMANTIC MATCHING: userSkills:', userSkills);
    console.log('🎯 SEMANTIC MATCHING: jobSkills:', jobSkills);

    const matched: Array<{userSkill: string, jobSkill: string, similarity: number}> = [];
    const jobSkillMatched = new Set<string>();

    // For each user skill, find the best matching job skill
    for (const userSkill of userSkills) {
      let bestMatch = { jobSkill: '', similarity: 0 };
      
      for (const jobSkill of jobSkills) {
        if (jobSkillMatched.has(jobSkill)) continue; // Avoid double-matching
        
        const similarity = await this.calculateSemanticSimilarity(userSkill, jobSkill);
        
        if (similarity > bestMatch.similarity && similarity > 0.5) { // Threshold: 50% similarity
          bestMatch = { jobSkill, similarity };
        }
      }

      if (bestMatch.similarity > 0.5) {
        matched.push({
          userSkill,
          jobSkill: bestMatch.jobSkill,
          similarity: bestMatch.similarity
        });
        jobSkillMatched.add(bestMatch.jobSkill);
      }
    }

    // Calculate missing skills (job requirements not matched)
    const missing = jobSkills.filter(jobSkill => !jobSkillMatched.has(jobSkill));

    // Calculate coverage (what % of job requirements are covered)
    const coverage = jobSkills.length > 0 ? (matched.length / jobSkills.length) : 0;

    // Calculate weighted score
    // Base score from coverage, bonus from high similarity matches
    const baseScore = coverage;
    const similarityBonus = matched.reduce((sum, match) => sum + match.similarity, 0) / Math.max(matched.length, 1);
    const score = (baseScore * 0.7) + (similarityBonus * 0.3);

    console.log('🎯 SEMANTIC RESULT:', { 
      score: Math.round(score * 100), 
      coverage: Math.round(coverage * 100),
      matchedCount: matched.length,
      totalJobSkills: jobSkills.length
    });

    return { score: Math.min(score, 1), matched, missing, coverage };
  }

  /**
   * Enhanced location matching with fuzzy city matching
   */
  calculateLocationFit(
    jobCity: string | null,
    jobRemoteAllowed: boolean,
    userLocation: string | null
  ): {
    score: number;
    explanation: string;
  } {
    // Remote jobs always match
    if (jobRemoteAllowed) {
      return { score: 1, explanation: 'Remote position - location independent' };
    }

    if (!jobCity || !userLocation) {
      return { score: 0.7, explanation: 'Limited location data available' };
    }

    const jobCityLower = jobCity.toLowerCase().trim();
    const userLocationLower = userLocation.toLowerCase().trim();

    // Exact match
    if (jobCityLower === userLocationLower) {
      return { score: 1, explanation: `Perfect match: ${jobCity}` };
    }

    // Partial match
    if (jobCityLower.includes(userLocationLower) || userLocationLower.includes(jobCityLower)) {
      return { score: 0.9, explanation: `Close match: ${jobCity} ≈ ${userLocation}` };
    }

    // German city variations
    const cityMappings: { [key: string]: string[] } = {
      'munich': ['münchen', 'muenchen'],
      'cologne': ['köln', 'koeln'],
      'düsseldorf': ['duesseldorf', 'dusseldorf']
    };

    for (const [canonical, variations] of Object.entries(cityMappings)) {
      if (variations.some(v => jobCityLower.includes(v)) && 
          variations.some(v => userLocationLower.includes(v))) {
        return { score: 1, explanation: `Perfect match: ${jobCity} = ${userLocation}` };
      }
    }

    // Different cities - low score but not zero (maybe willing to relocate)
    return { score: 0.3, explanation: `Different locations: ${jobCity} vs ${userLocation}` };
  }

  /**
   * Enhanced language matching
   */
  calculateLanguageFit(
    jobLanguageRequired: string | null,
    userLanguages: string[]
  ): {
    score: number;
    explanation: string;
  } {
    if (!jobLanguageRequired || jobLanguageRequired === 'unknown') {
      return { score: 1, explanation: 'No specific language requirement' };
    }

    // Handle different language formats - ensure they're all strings
    const userLangsLower = userLanguages
      .filter(lang => typeof lang === 'string')
      .map(lang => lang.toLowerCase());
    const requiredLower = jobLanguageRequired.toLowerCase();

    // Check for language matches
    const hasGerman = userLangsLower.some(lang => lang.includes('german') || lang.includes('deutsch'));
    const hasEnglish = userLangsLower.some(lang => lang.includes('english') || lang.includes('englisch'));

    if (requiredLower.includes('de') || requiredLower.includes('german')) {
      return hasGerman ? 
        { score: 1, explanation: 'German requirement met' } :
        { score: 0.2, explanation: 'German required but not available' };
    }

    if (requiredLower.includes('en') || requiredLower.includes('english')) {
      return hasEnglish ?
        { score: 1, explanation: 'English requirement met' } :
        { score: 0.3, explanation: 'English required but not available' };
    }

    if (requiredLower.includes('both')) {
      if (hasGerman && hasEnglish) return { score: 1, explanation: 'Both languages available' };
      if (hasGerman || hasEnglish) return { score: 0.6, explanation: 'One language missing' };
      return { score: 0.1, explanation: 'Both languages required but not available' };
    }

    return { score: 0.8, explanation: 'Language requirements unclear' };
  }

  /**
   * Main matching function with semantic similarity
   */
  async calculateJobMatch(
    job: JobWithCompany,
    userProfile: LegacyUserProfile
  ): Promise<MatchCalculation & { semanticMatch: boolean }> {
    console.log('🎯 STARTING SEMANTIC MATCH for job:', job.title);

    // Type assertions needed for archived code that expects additional properties
    const jobTyped = job as any;
    const personalDetails = userProfile.personal_details as any;

    // Extract user skills from profile
    const userSkills: string[] = [];
    if (userProfile.skills) {
      Object.entries(userProfile.skills).forEach(([category, skillArray]) => {
        if (Array.isArray(skillArray)) {
          userSkills.push(...skillArray);
        }
      });
    }

    // Extract job skills
    const jobSkills = jobTyped.skills_original || [];

    // Extract user location
    const userLocation = personalDetails?.city ||
                        personalDetails?.location ||
                        personalDetails?.address ||
                        personalDetails?.contact?.address ||
                        null;

    // Extract user languages
    const userLanguages: string[] = [];
    if (userProfile.languages && Array.isArray(userProfile.languages)) {
      // Map Language objects to strings (archived code compatibility)
      const langStrings = (userProfile.languages as any[]).map(lang => {
        if (typeof lang === 'string') return lang;
        return lang.language || lang.name || String(lang);
      });
      userLanguages.push(...langStrings);
    }

    console.log('🎯 MATCH INPUT:', {
      userSkillsCount: userSkills.length,
      jobSkillsCount: jobSkills.length,
      userLocation,
      userLanguagesCount: userLanguages.length
    });

    // Calculate advanced skill match using semantic similarity
    const skillsMatch = await this.calculateAdvancedSkillMatch(userSkills, jobSkills);
    
    // Simplified tools matching (combine with skills for now)
    const toolsMatch = { score: skillsMatch.coverage, matched: [], missing: [] };
    
    // Calculate language fit
    const languageFit = this.calculateLanguageFit(
      jobTyped.german_required || jobTyped.language_required,
      userLanguages
    );

    // Calculate location fit
    const locationFit = this.calculateLocationFit(
      jobTyped.location_city || jobTyped.city,
      jobTyped.is_remote || jobTyped.remote_allowed || jobTyped.work_mode === 'remote',
      userLocation
    );

    // Calculate weighted total score with improved formula
    const totalScore = 
      (skillsMatch.score * MATCH_WEIGHTS.SKILLS) +
      (toolsMatch.score * MATCH_WEIGHTS.TOOLS) +
      (languageFit.score * MATCH_WEIGHTS.LANGUAGE) +
      (locationFit.score * MATCH_WEIGHTS.LOCATION);

    const finalScore = Math.round(Math.min(totalScore * 100, 100));

    console.log('🎯 SEMANTIC MATCH RESULT:', {
      jobTitle: job.title,
      finalScore: finalScore + '%',
      breakdown: {
        skills: Math.round(skillsMatch.score * 100) + '%',
        language: Math.round(languageFit.score * 100) + '%',
        location: Math.round(locationFit.score * 100) + '%'
      }
    });

    return {
      skillsOverlap: {
        score: skillsMatch.score,
        matched: skillsMatch.matched.map(m => m.userSkill),
        missing: skillsMatch.missing,
        intersection: skillsMatch.matched.map(m => m.userSkill),
        union: [...userSkills, ...jobSkills]
      },
      toolsOverlap: {
        score: toolsMatch.score,
        matched: toolsMatch.matched,
        missing: toolsMatch.missing,
        intersection: [],
        union: []
      },
      languageFit: {
        score: languageFit.score,
        explanation: languageFit.explanation,
        required: jobTyped.german_required || 'Not specified',
        userHas: userLanguages
      },
      locationFit: {
        score: locationFit.score,
        explanation: locationFit.explanation,
        jobLocation: jobTyped.location_city || 'Unknown',
        userLocation: userLocation || 'Unknown',
        remoteAllowed: jobTyped.is_remote || jobTyped.remote_allowed || false
      },
      totalScore: finalScore,
      weights: MATCH_WEIGHTS as any,  // Type assertion for legacy weight structure
      semanticMatch: true
    };
  }

  /**
   * Batch processing with semantic matching
   */
  async calculateBatchMatches(
    jobs: JobWithCompany[],
    userProfile: LegacyUserProfile
  ): Promise<(JobWithCompany & { matchCalculation: MatchCalculation & { semanticMatch: boolean } })[]> {
    const results = [];
    
    console.log('🎯 STARTING SEMANTIC BATCH MATCHING for', jobs.length, 'jobs');

    for (const job of jobs) {
      try {
        const matchCalculation = await this.calculateJobMatch(job, userProfile);
        results.push({
          ...job,
          match_score: matchCalculation.totalScore,
          matchCalculation
        });
      } catch (error) {
        console.error(`Semantic matching error for job ${job.id}:`, error);
        results.push({
          ...job,
          match_score: 50, // Neutral fallback score
          matchCalculation: null as any
        });
      }
    }

    return results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }
}

export const semanticMatchingService = new SemanticMatchingService();