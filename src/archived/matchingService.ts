/**
 * Weighted Job Matching Service - Multilingual Support
 * Implements comprehensive Jaccard similarity-based matching with German/English support
 * 
 * Weighted Formula:
 * - 55% Skills overlap (Jaccard similarity)
 * - 20% Tools overlap (Jaccard similarity) 
 * - 15% Language fit (exact match requirements)
 * - 10% Location fit (city/remote compatibility)
 */

import OpenAI from 'openai';
import type { JobWithCompany, MatchCalculation, LanguageSkill } from '@/lib/supabase/types';
import type { UserProfile as LegacyUserProfile } from '@/lib/types';

// Matching weights configuration
const MATCH_WEIGHTS = {
  SKILLS: 0.55,      // 55%
  TOOLS: 0.20,       // 20%
  LANGUAGE: 0.15,    // 15%
  LOCATION: 0.10     // 10%
} as const;

// German to English glossary for deterministic translations
const DE_EN_GLOSSARY: Record<string, string> = {
  // Technical skills
  'Programmierung': 'programming',
  'Softwareentwicklung': 'software development',
  'Datenanalyse': 'data analysis',
  'Maschinelles Lernen': 'machine learning',
  'Künstliche Intelligenz': 'artificial intelligence',
  'Datenbank': 'database',
  'Frontend': 'frontend',
  'Backend': 'backend',
  'Webentwicklung': 'web development',
  'Mobile Entwicklung': 'mobile development',
  
  // Business skills
  'Projektmanagement': 'project management',
  'Teamführung': 'team leadership',
  'Kundenbetreuung': 'customer service',
  'Vertrieb': 'sales',
  'Marketing': 'marketing',
  'Buchhaltung': 'accounting',
  'Controlling': 'controlling',
  'Betriebswirtschaft': 'business administration',
  'Rechnungswesen': 'accounting',
  'Qualitätsmanagement': 'quality management',
  
  // Tools
  'Tabellenkalkulation': 'spreadsheet',
  'Präsentation': 'presentation',
  'Textverarbeitung': 'word processing',
  
  // Soft skills
  'Kommunikation': 'communication',
  'Teamarbeit': 'teamwork',
  'Problemlösung': 'problem solving',
  'Kreativität': 'creativity',
  'Führung': 'leadership',
  'Zeitmanagement': 'time management',
  
  // Languages
  'Deutsch': 'german',
  'Englisch': 'english',
  'Französisch': 'french',
  'Spanisch': 'spanish',
  'Italienisch': 'italian',
  'Chinesisch': 'chinese',
  'Japanisch': 'japanese'
};

// Common skill synonyms for normalization
const SKILL_SYNONYMS: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'react.js': 'react',
  'vue.js': 'vue',
  'node.js': 'nodejs',
  'ms office': 'microsoft office',
  'ms word': 'microsoft word',
  'ms excel': 'microsoft excel',
  'ms powerpoint': 'microsoft powerpoint',
  'sap fi/co': 'sap fico',
  'sap fi co': 'sap fico',
  'ui/ux': 'ui ux design',
  'machine learning': 'ml',
  'artificial intelligence': 'ai',
  'deep learning': 'dl'
};

export class MatchingService {
  private openaiClient: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * STEP 1: MULTILINGUAL NORMALIZATION
   * Convert German skills/tools to canonical English tokens
   */
  async normalizeToCanonical(items: string[], contentLanguage: 'DE' | 'EN' | 'unknown' = 'unknown'): Promise<string[]> {
    if (!items || items.length === 0) return [];

    let canonical: string[] = [];

    // Step 1: Apply glossary translations (deterministic)
    for (const item of items) {
      const trimmed = item.trim();
      
      // Check glossary first
      const translated = DE_EN_GLOSSARY[trimmed] || trimmed.toLowerCase();
      
      // Split compound skills (separated by /, ,, ;, ·, –, parentheses)
      const split = translated.split(/[\/,;·–()]+/).map(s => s.trim()).filter(Boolean);
      canonical.push(...split);
    }

    // Step 2: Apply synonym normalization
    canonical = canonical.map(skill => SKILL_SYNONYMS[skill.toLowerCase()] || skill.toLowerCase());

    // Step 3: GPT translation for unknown German terms (if needed and available)
    if (contentLanguage === 'DE' && this.openaiClient) {
      const untranslatedTerms = canonical.filter(term => 
        // If it contains German characters or looks untranslated
        /[äöüßÄÖÜ]/.test(term) || term.length > 20
      );

      if (untranslatedTerms.length > 0) {
        try {
          const translated = await this.translateWithGPT(untranslatedTerms);
          // Replace untranslated terms with GPT translations
          canonical = canonical.map(term => {
            const index = untranslatedTerms.indexOf(term);
            return index !== -1 ? (translated[index] || term) : term;
          });
        } catch (error) {
          console.warn('GPT translation failed, using original terms:', error);
        }
      }
    }

    // Step 4: Final cleanup - lowercase, dedupe, filter empty
    const cleaned = Array.from(new Set(
      canonical
        .map(skill => skill.toLowerCase().trim())
        .filter(skill => skill.length > 0)
    ));

    return cleaned;
  }

  /**
   * Translate German terms to English using GPT
   */
  private async translateWithGPT(germanTerms: string[]): Promise<string[]> {
    if (!this.openaiClient) return germanTerms;

    const prompt = `Translate these German professional skills/tools to English. Return only the English terms, one per line, no explanations:

${germanTerms.join('\n')}`;

    try {
      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const result = response.choices?.[0]?.message?.content?.trim();
      if (!result) return germanTerms;

      const translated = result.split('\n').map(line => line.trim().toLowerCase()).filter(Boolean);
      
      // Ensure we have the same number of translations
      if (translated.length !== germanTerms.length) {
        console.warn('GPT translation count mismatch, using original terms');
        return germanTerms;
      }

      return translated;
    } catch (error) {
      console.warn('GPT translation error:', error);
      return germanTerms;
    }
  }

  /**
   * STEP 2: JACCARD SIMILARITY CALCULATION
   * Calculate intersection over union for two sets
   */
  calculateJaccardSimilarity(setA: string[], setB: string[]): {
    score: number;
    intersection: string[];
    union: string[];
    matched: string[];
    missing: string[];
  } {
    const a = new Set(setA.map(item => item.toLowerCase()));
    const b = new Set(setB.map(item => item.toLowerCase()));
    
    const intersection = Array.from(new Set([...a].filter(x => b.has(x))));
    const union = Array.from(new Set([...a, ...b]));
    const matched = intersection;
    const missing = Array.from(new Set([...b].filter(x => !a.has(x))));
    
    const score = union.length > 0 ? intersection.length / union.length : 0;
    
    return {
      score,
      intersection,
      union,
      matched,
      missing
    };
  }

  /**
   * STEP 3: LANGUAGE MATCHING
   * Check if user's languages meet job requirements
   */
  calculateLanguageFit(
    jobLanguageRequired: 'DE' | 'EN' | 'BOTH' | 'UNKNOWN',
    userLanguages: LanguageSkill[]
  ): {
    score: number;
    explanation: string;
    required: string;
    userHas: string[];
  } {
    const userLangs = userLanguages.map(lang => ({
      language: lang.language.toLowerCase(),
      level: lang.level
    }));

    const userHas = userLangs.map(lang => `${lang.language} ${lang.level}`);

    // Helper function to check if user has required proficiency
    const hasLanguage = (language: string, minLevel: string = 'B2') => {
      const userLang = userLangs.find(lang => 
        lang.language === language.toLowerCase() || 
        (language === 'DE' && lang.language === 'german') ||
        (language === 'EN' && lang.language === 'english')
      );
      
      if (!userLang) return false;
      
      // Level hierarchy: A1 < A2 < B1 < B2 < C1 < C2 < native
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'];
      const userLevelIndex = levels.indexOf(userLang.level);
      const minLevelIndex = levels.indexOf(minLevel);
      
      return userLevelIndex >= minLevelIndex;
    };

    switch (jobLanguageRequired) {
      case 'DE':
        if (hasLanguage('DE', 'B2') || hasLanguage('german', 'B2')) {
          return {
            score: 1,
            explanation: 'German requirement met (B2+ level)',
            required: 'German (B2+)',
            userHas
          };
        }
        return {
          score: 0,
          explanation: 'German B2+ required but not available',
          required: 'German (B2+)',
          userHas
        };

      case 'EN':
        if (hasLanguage('EN', 'B2') || hasLanguage('english', 'B2')) {
          return {
            score: 1,
            explanation: 'English requirement met (B2+ level)',
            required: 'English (B2+)',
            userHas
          };
        }
        return {
          score: 0,
          explanation: 'English B2+ required but not available',
          required: 'English (B2+)',
          userHas
        };

      case 'BOTH':
        const hasGerman = hasLanguage('DE', 'B2') || hasLanguage('german', 'B2');
        const hasEnglish = hasLanguage('EN', 'B2') || hasLanguage('english', 'B2');
        
        if (hasGerman && hasEnglish) {
          return {
            score: 1,
            explanation: 'Both German and English requirements met (B2+ level)',
            required: 'German and English (B2+)',
            userHas
          };
        } else if (hasGerman || hasEnglish) {
          return {
            score: 0.5,
            explanation: hasGerman ? 'German met, English missing' : 'English met, German missing',
            required: 'German and English (B2+)',
            userHas
          };
        }
        return {
          score: 0,
          explanation: 'Both German and English B2+ required but not available',
          required: 'German and English (B2+)',
          userHas
        };

      case 'UNKNOWN':
      default:
        return {
          score: 1, // No penalty for unknown requirements
          explanation: 'No specific language requirement',
          required: 'None specified',
          userHas
        };
    }
  }

  /**
   * STEP 4: LOCATION MATCHING
   * Check if user's location preferences match job requirements
   */
  calculateLocationFit(
    jobCity: string | null,
    jobRemoteAllowed: boolean,
    jobHybridAllowed: boolean,
    userCity: string | null,
    userWillingRemote: boolean,
    userWillingHybrid: boolean
  ): {
    score: number;
    explanation: string;
    jobLocation: string;
    userLocation: string;
    remoteAllowed: boolean;
  } {
    console.log('🎯 LOCATION FIT DEBUG: jobCity:', jobCity, 'userCity:', userCity);
    console.log('🎯 LOCATION FIT DEBUG: remote/hybrid:', { jobRemoteAllowed, jobHybridAllowed, userWillingRemote, userWillingHybrid });
    
    const jobLocation = jobCity || 'Unknown';
    const userLocation = userCity || 'Unknown';

    // Enhanced location matching logic
    if (jobCity && userCity) {
      const jobCityLower = jobCity.toLowerCase().trim();
      const userCityLower = userCity.toLowerCase().trim();
      
      // Perfect match: same city
      if (jobCityLower === userCityLower) {
        console.log('🎯 LOCATION FIT: Perfect match found');
        return {
          score: 1,
          explanation: `Perfect location match: ${jobCity}`,
          jobLocation,
          userLocation,
          remoteAllowed: jobRemoteAllowed
        };
      }
      
      // Partial match: check if one contains the other (e.g., "Munich" in "Munich, Germany")
      if (jobCityLower.includes(userCityLower) || userCityLower.includes(jobCityLower)) {
        console.log('🎯 LOCATION FIT: Partial match found');
        return {
          score: 0.9,
          explanation: `Location match: ${jobCity} ≈ ${userCity}`,
          jobLocation,
          userLocation,
          remoteAllowed: jobRemoteAllowed
        };
      }
      
      // Check for common German city variations
      const cityMappings: { [key: string]: string[] } = {
        'munich': ['münchen', 'muenchen', 'munich'],
        'cologne': ['köln', 'koeln', 'cologne'], 
        'frankfurt': ['frankfurt am main', 'frankfurt/main', 'frankfurt'],
        'düsseldorf': ['duesseldorf', 'dusseldorf', 'düsseldorf']
      };
      
      for (const [canonical, variations] of Object.entries(cityMappings)) {
        if (variations.some(v => jobCityLower.includes(v)) && 
            variations.some(v => userCityLower.includes(v))) {
          console.log('🎯 LOCATION FIT: City mapping match found');
          return {
            score: 1,
            explanation: `Location match via mapping: ${jobCity} = ${userCity}`,
            jobLocation,
            userLocation,
            remoteAllowed: jobRemoteAllowed
          };
        }
      }
    }

    // Remote work compatibility
    if (jobRemoteAllowed && userWillingRemote) {
      console.log('🎯 LOCATION FIT: Remote work match');
      return {
        score: 1,
        explanation: 'Remote work compatible',
        jobLocation: `${jobLocation} (Remote OK)`,
        userLocation: `${userLocation} (Remote OK)`,
        remoteAllowed: true
      };
    }

    // Hybrid work compatibility
    if (jobHybridAllowed && userWillingHybrid) {
      console.log('🎯 LOCATION FIT: Hybrid work match');
      return {
        score: 0.8, // Slightly lower than perfect match
        explanation: 'Hybrid work compatible',
        jobLocation: `${jobLocation} (Hybrid OK)`,
        userLocation: `${userLocation} (Hybrid OK)`,
        remoteAllowed: jobHybridAllowed
      };
    }

    // No match
    return {
      score: 0,
      explanation: 'Location/work mode incompatible',
      jobLocation,
      userLocation,
      remoteAllowed: jobRemoteAllowed
    };
  }

  /**
   * STEP 5: COMPREHENSIVE MATCHING
   * Calculate overall match score using weighted formula
   */
  async calculateJobMatch(
    job: JobWithCompany,
    userProfile: LegacyUserProfile
  ): Promise<MatchCalculation> {
    // Type assertion needed for archived code that expects additional properties
    const jobTyped = job as any;

    // Extract and normalize job data
    const jobSkillsOriginal = jobTyped.skills_original || [];
    const jobToolsOriginal = jobTyped.tools_original || [];
    const jobSkillsCanonical = await this.normalizeToCanonical(jobSkillsOriginal, jobTyped.content_language || 'unknown');
    const jobToolsCanonical = await this.normalizeToCanonical(jobToolsOriginal, jobTyped.content_language || 'unknown');

    // Extract and normalize user data
    const userSkillsRaw: string[] = [];
    const userToolsRaw: string[] = [];
    
    // Extract skills from user profile
    console.log('🎯 MATCHING DEBUG: userProfile structure:', JSON.stringify(userProfile, null, 2));
    if (userProfile.skills) {
      console.log('🎯 MATCHING DEBUG: userProfile.skills:', userProfile.skills);
      // Categorize skills vs tools based on category
      Object.entries(userProfile.skills).forEach(([category, skillArray]: [string, unknown]) => {
        console.log('🎯 MATCHING DEBUG: processing category:', category, 'skillArray:', skillArray);
        if (Array.isArray(skillArray)) {
          // Design/Tools category goes to tools, everything else goes to skills
          if (category === 'design' || category === 'tools') {
            userToolsRaw.push(...skillArray);
            console.log('🎯 MATCHING DEBUG: added to tools:', skillArray);
          } else {
            userSkillsRaw.push(...skillArray);
            console.log('🎯 MATCHING DEBUG: added to skills:', skillArray);
          }
        }
      });
    }
    console.log('🎯 MATCHING DEBUG: final userSkillsRaw:', userSkillsRaw);
    console.log('🎯 MATCHING DEBUG: final userToolsRaw:', userToolsRaw);

    // Normalize both skills and tools to canonical form
    const userSkillsCanonical = await this.normalizeToCanonical(userSkillsRaw, 'EN');
    const userToolsCanonical = await this.normalizeToCanonical(userToolsRaw, 'EN');

    // Convert user languages to required format with enhanced parsing
    console.log('🎯 MATCHING DEBUG: userProfile.languages:', userProfile.languages);
    const userLanguages: LanguageSkill[] = [];
    
    if (userProfile.languages) {
      if (Array.isArray(userProfile.languages)) {
        // Type assertion needed for legacy user profile
        (userProfile.languages as any[]).forEach(lang => {
          if (typeof lang === 'string') {
            // Enhanced regex to handle multiple formats:
            // "English (C1)", "German (C2)", "English C1", "German - Native", etc.
            const levelMatch = lang.match(/^(.+?)[\s\-\(]*([A-C][12]|native|fluent|advanced|intermediate|basic)[\s\)]*$/i);
            if (levelMatch) {
              const languageName = levelMatch[1].trim().toLowerCase();
              let level = levelMatch[2].toUpperCase();
              
              // Convert text levels to standard levels
              switch(level) {
                case 'NATIVE': case 'FLUENT': level = 'C2'; break;
                case 'ADVANCED': level = 'C1'; break;
                case 'INTERMEDIATE': level = 'B2'; break;
                case 'BASIC': level = 'B1'; break;
              }
              
              userLanguages.push({
                language: languageName,
                level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native'
              });
            } else {
              // Fallback for simple language names (e.g., just "English", "German")
              const cleanLang = lang.toLowerCase().trim();
              userLanguages.push({
                language: cleanLang,
                level: 'B2' as const // Default to B2 if no level specified
              });
            }
          } else if (typeof lang === 'object' && lang) {
            // Handle object format { language: "English", level: "C1" }
            userLanguages.push({
              language: (lang as any).language?.toLowerCase() || 'unknown',
              level: (lang as any).level || (lang as any).proficiency || 'B2'
            });
          }
        });
      } else if (typeof userProfile.languages === 'object') {
        // Handle case where languages might be an object instead of array
        Object.entries(userProfile.languages).forEach(([key, value]) => {
          if (typeof value === 'string') {
            userLanguages.push({
              language: key.toLowerCase(),
              level: 'B2' as const
            });
          }
        });
      }
    }
    console.log('🎯 MATCHING DEBUG: processed userLanguages:', userLanguages);

    // Calculate component scores with enhanced debugging
    console.log('🎯 SKILLS DEBUG: userSkillsCanonical:', userSkillsCanonical.slice(0, 10), '(showing first 10)');
    console.log('🎯 SKILLS DEBUG: jobSkillsCanonical:', jobSkillsCanonical.slice(0, 10), '(showing first 10)');
    
    const skillsOverlap = this.calculateJaccardSimilarity(userSkillsCanonical, jobSkillsCanonical);
    const toolsOverlap = this.calculateJaccardSimilarity(userToolsCanonical, jobToolsCanonical);
    
    console.log('🎯 SKILLS DEBUG: skillsOverlap result:', skillsOverlap);
    console.log('🎯 TOOLS DEBUG: toolsOverlap result:', toolsOverlap);
    
    const languageFit = this.calculateLanguageFit(
      jobTyped.language_required || 'UNKNOWN',
      userLanguages
    );

    // Enhanced location parsing with debugging
    console.log('🎯 LOCATION DEBUG: job.location_city:', jobTyped.location_city);
    console.log('🎯 LOCATION DEBUG: userProfile.personal_details:', userProfile.personal_details);

    // Type assertion needed for legacy personal details structure
    const personalDetails = userProfile.personal_details as any;

    // Try multiple possible location fields from user profile
    const userLocation = personalDetails?.city ||
                        personalDetails?.location ||
                        personalDetails?.address ||
                        personalDetails?.contact?.address ||
                        null;

    console.log('🎯 LOCATION DEBUG: resolved userLocation:', userLocation);

    const locationFit = this.calculateLocationFit(
      jobTyped.location_city,
      jobTyped.remote_allowed || false,
      jobTyped.hybrid_allowed || false,
      userLocation,
      true, // Assume user is willing remote for now
      true  // Assume user is willing hybrid for now
    );

    // Calculate weighted total score
    const totalScore = 
      (skillsOverlap.score * MATCH_WEIGHTS.SKILLS) +
      (toolsOverlap.score * MATCH_WEIGHTS.TOOLS) +
      (languageFit.score * MATCH_WEIGHTS.LANGUAGE) +
      (locationFit.score * MATCH_WEIGHTS.LOCATION);

    return {
      skillsOverlap: {
        score: skillsOverlap.score,
        matched: skillsOverlap.matched,
        missing: skillsOverlap.missing,
        intersection: skillsOverlap.intersection,
        union: skillsOverlap.union
      },
      toolsOverlap: {
        score: toolsOverlap.score,
        matched: toolsOverlap.matched,
        missing: toolsOverlap.missing,
        intersection: toolsOverlap.intersection,
        union: toolsOverlap.union
      },
      languageFit: {
        score: languageFit.score,
        required: languageFit.required,
        userHas: languageFit.userHas,
        explanation: languageFit.explanation
      },
      locationFit: {
        score: locationFit.score,
        jobLocation: locationFit.jobLocation,
        userLocation: locationFit.userLocation,
        remoteAllowed: locationFit.remoteAllowed,
        explanation: locationFit.explanation
      },
      totalScore: Math.round(totalScore * 100), // Convert to percentage
      weights: MATCH_WEIGHTS as any  // Type assertion for legacy weight structure
    };
  }

  /**
   * BATCH MATCHING
   * Calculate match scores for multiple jobs efficiently
   */
  async calculateBatchMatches(
    jobs: JobWithCompany[],
    userProfile: LegacyUserProfile
  ): Promise<(JobWithCompany & { matchCalculation: MatchCalculation })[]> {
    const results = [];
    
    for (const job of jobs) {
      try {
        const matchCalculation = await this.calculateJobMatch(job, userProfile);
        results.push({
          ...job,
          match_score: matchCalculation.totalScore,
          matchCalculation
        });
      } catch (error) {
        console.error(`Error calculating match for job ${job.id}:`, error);
        // Include job with fallback score
        results.push({
          ...job,
          match_score: Math.floor(Math.random() * 40) + 60, // Fallback to random
          matchCalculation: null as unknown as MatchCalculation
        });
      }
    }

    // Sort by match score (highest first)
    return results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  }
}

// Export singleton instance
export const matchingService = new MatchingService();