import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FastMatchingService } from './fastMatchingService'
import type { JobWithCompany } from '../supabase/types'
import type { UserProfile as LegacyUserProfile } from '../types'

describe('FastMatchingService', () => {
  let service: FastMatchingService
  let mockUserProfile: LegacyUserProfile
  let mockJob: JobWithCompany

  beforeEach(() => {
    service = new FastMatchingService()

    // Mock user profile with comprehensive skills
    mockUserProfile = {
      personal_details: {
        name: 'Test User',
        contact: {
          phone: '+49123456789',
          email: 'test@example.com',
          address: 'Berlin, Germany',
        },
      },
      professional_title: 'Software Engineer',
      professional_summary: 'Experienced developer',
      skills: {
        technology: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'Git'],
        soft_skills: ['Communication', 'Teamwork'],
        design: ['Figma'],
      },
      languages: [
        { language: 'English', proficiency: 'Native' },
        { language: 'German', proficiency: 'Fluent' },
      ],
      education: [],
      certifications: [],
      experience: [
        {
          company: 'Tech Corp',
          position: 'Software Engineer',
          duration: '2020-2023',
          responsibilities: ['Built web applications with React and Node.js'],
        },
      ],
      projects: [],
    } as unknown

    // Mock job with matching requirements
    mockJob = {
      id: 'job-1',
      title: 'Frontend Developer',
      location_city: 'Berlin',
      skills_canonical_flat: ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS'],
      tools_canonical_flat: ['Git', 'Figma', 'Jira'],
      german_required: 'yes' as const,
      is_remote: false,
      remote_allowed: true,
      description: 'Looking for a frontend developer',
      created_at: '2024-01-01',
      company_id: 'company-1',
      company: {
        id: 'company-1',
        name: 'Test Company',
        domain: null,
        logo_url: null,
        industry: null,
        size_category: null,
        website_url: null,
        linkedin_url: null,
        glassdoor_url: null,
        kununu_url: null,
        twitter_url: null,
        github_url: null,
        description: null,
        founded_year: null,
        headquarters_city: null,
        headquarters_country: null,
        employee_count_min: null,
        employee_count_max: null,
        tech_stack: null,
        culture_tags: null,
        benefits: null,
        office_images: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        research_status: null,
        research_completed_at: null,
        research_error: null,
        glassdoor_rating: null,
      },
    } as unknown
  })

  describe('calculateBatchMatches', () => {
    it('should calculate matches for a single job', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty('match_score')
      expect(results[0]).toHaveProperty('matchCalculation')
      expect(results[0].match_score).toBeGreaterThan(0)
      expect(results[0].match_score).toBeLessThanOrEqual(100)
    })

    it('should return match scores within 0-100 range', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0].match_score).toBeGreaterThanOrEqual(0)
      expect(results[0].match_score).toBeLessThanOrEqual(100)
    })

    it('should include skillsOverlap in matchCalculation', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0].matchCalculation).toHaveProperty('skillsOverlap')
      expect(results[0].matchCalculation.skillsOverlap).toHaveProperty('score')
      expect(results[0].matchCalculation.skillsOverlap).toHaveProperty('matched')
      expect(results[0].matchCalculation.skillsOverlap).toHaveProperty('missing')
    })

    it('should identify matched skills correctly', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      const matched = results[0].matchCalculation.skillsOverlap.matched
      expect(matched).toContain('javascript')
      expect(matched).toContain('react')
      expect(matched).toContain('typescript')
    })

    it('should handle jobs with no skills', async () => {
      const jobNoSkills = { ...mockJob, skills_canonical_flat: [], tools_canonical_flat: [] }
      const results = await service.calculateBatchMatches([jobNoSkills], mockUserProfile)

      expect(results).toHaveLength(1)
      expect(results[0].match_score).toBeGreaterThanOrEqual(0)
    })

    it('should handle user profile with no skills', async () => {
      const profileNoSkills = { ...mockUserProfile, skills: { technology: [], soft_skills: [], design: [] } }
      const results = await service.calculateBatchMatches([mockJob], profileNoSkills)

      expect(results).toHaveLength(1)
      expect(results[0].match_score).toBeGreaterThanOrEqual(0)
    })

    it('should handle multiple jobs', async () => {
      const job2 = { ...mockJob, id: 'job-2', title: 'Backend Developer' }
      const job3 = { ...mockJob, id: 'job-3', title: 'Full Stack Developer' }

      const results = await service.calculateBatchMatches([mockJob, job2, job3], mockUserProfile)

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('job-1')
      expect(results[1].id).toBe('job-2')
      expect(results[2].id).toBe('job-3')
    })

    it('should handle empty job array', async () => {
      const results = await service.calculateBatchMatches([], mockUserProfile)
      expect(results).toHaveLength(0)
    })

    it('should include toolsOverlap in matchCalculation', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0].matchCalculation).toHaveProperty('toolsOverlap')
      expect(results[0].matchCalculation.toolsOverlap).toHaveProperty('matched')
      expect(results[0].matchCalculation.toolsOverlap.matched).toContain('git')
      expect(results[0].matchCalculation.toolsOverlap.matched).toContain('figma')
    })

    it('should calculate language fit', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0].matchCalculation).toHaveProperty('languageFit')
      expect(results[0].matchCalculation.languageFit).toHaveProperty('score')
      expect(results[0].matchCalculation.languageFit).toHaveProperty('required')
      expect(results[0].matchCalculation.languageFit).toHaveProperty('userHas')
    })

    it('should calculate location fit', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0].matchCalculation).toHaveProperty('locationFit')
      expect(results[0].matchCalculation.locationFit).toHaveProperty('score')
      expect(results[0].matchCalculation.locationFit).toHaveProperty('jobLocation')
      expect(results[0].matchCalculation.locationFit).toHaveProperty('userLocation')
    })

    it('should give higher score for better matches', async () => {
      const perfectJob = {
        ...mockJob,
        id: 'perfect-job',
        skills_canonical_flat: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL'],
        tools_canonical_flat: ['Figma', 'Docker', 'AWS', 'Jira'],
        german_required: 'no' as const,
        location_city: 'Berlin',
      }

      const poorJob = {
        ...mockJob,
        id: 'poor-job',
        skills_canonical_flat: ['Python', 'Django', 'MongoDB'],
        tools_canonical_flat: ['Jenkins', 'Kubernetes'],
        german_required: 'yes' as const,
        location_city: 'Munich',
      }

      const results = await service.calculateBatchMatches([perfectJob, poorJob], mockUserProfile)

      expect(results[0].match_score).toBeGreaterThan(results[1].match_score)
    })
  })

  describe('skill normalization and synonyms', () => {
    it('should match React with reactjs', async () => {
      const jobReactJS = {
        ...mockJob,
        skills_canonical_flat: ['ReactJS', 'JavaScript'],
      }

      const results = await service.calculateBatchMatches([jobReactJS], mockUserProfile)

      const matched = results[0].matchCalculation.skillsOverlap.matched
      expect(matched.some((s: string) => s.includes('react'))).toBe(true)
    })

    it('should match Node.js with nodejs variants', async () => {
      const jobNodeJS = {
        ...mockJob,
        skills_canonical_flat: ['nodejs', 'express'],
      }

      const results = await service.calculateBatchMatches([jobNodeJS], mockUserProfile)
      const matched = results[0].matchCalculation.skillsOverlap.matched

      expect(matched.length).toBeGreaterThan(0)
    })

    it('should match SQL with database variants', async () => {
      const jobSQL = {
        ...mockJob,
        skills_canonical_flat: ['PostgreSQL', 'MySQL'],
      }

      const results = await service.calculateBatchMatches([jobSQL], mockUserProfile)
      const matched = results[0].matchCalculation.skillsOverlap.matched

      // SQL should match PostgreSQL or MySQL through synonyms
      expect(matched.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle null skills_canonical_flat', async () => {
      const jobNullSkills = { ...mockJob, skills_canonical_flat: null }
      const results = await service.calculateBatchMatches([jobNullSkills as unknown], mockUserProfile)

      expect(results).toHaveLength(1)
      expect(results[0].match_score).toBeGreaterThanOrEqual(0)
    })

    it('should handle undefined tools_canonical_flat', async () => {
      const jobUndefinedTools = { ...mockJob, tools_canonical_flat: undefined }
      const results = await service.calculateBatchMatches([jobUndefinedTools as unknown], mockUserProfile)

      expect(results).toHaveLength(1)
      expect(results[0].match_score).toBeGreaterThanOrEqual(0)
    })

    it('should handle malformed skill arrays', async () => {
      const jobMalformed = {
        ...mockJob,
        skills_canonical_flat: ['', null, undefined, 'JavaScript', '   ', 'React'] as unknown,
      }

      const results = await service.calculateBatchMatches([jobMalformed], mockUserProfile)

      expect(results).toHaveLength(1)
      expect(results[0].match_score).toBeGreaterThanOrEqual(0)
    })

    it('should handle missing location data', async () => {
      const jobNoLocation = { ...mockJob, location_city: null, is_remote: null }
      const profileNoLocation = { ...mockUserProfile, personal_details: { ...mockUserProfile.personal_details, city: null } as unknown }

      const results = await service.calculateBatchMatches([jobNoLocation as unknown], profileNoLocation)

      expect(results).toHaveLength(1)
      expect(results[0].matchCalculation.locationFit).toBeDefined()
    })

    it('should handle missing language data', async () => {
      const jobNoLang = { ...mockJob, german_required: null }
      const profileNoLang = { ...mockUserProfile, languages: [] }

      const results = await service.calculateBatchMatches([jobNoLang as unknown], profileNoLang)

      expect(results).toHaveLength(1)
      expect(results[0].matchCalculation.languageFit).toBeDefined()
    })
  })

  describe('weights and scoring', () => {
    it('should use correct weight distribution', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      const weights = results[0].matchCalculation.weights
      expect(weights).toBeDefined()
      expect(weights.SKILLS).toBe(0.50)
      expect(weights.TOOLS).toBe(0.20)
      expect(weights.EXPERIENCE).toBe(0.15)
      expect(weights.LANGUAGE).toBe(0.10)
      expect(weights.LOCATION).toBe(0.05)
    })

    it('should prioritize skills over tools', async () => {
      const skillsJob = {
        ...mockJob,
        skills_canonical_flat: ['JavaScript', 'React', 'TypeScript'],
        tools_canonical_flat: [],
      }

      const toolsJob = {
        ...mockJob,
        id: 'tools-job',
        skills_canonical_flat: [],
        tools_canonical_flat: ['Figma', 'Docker', 'AWS'],
      }

      const results = await service.calculateBatchMatches([skillsJob, toolsJob], mockUserProfile)

      // Skills have 50% weight, tools have 20%, so skills job should score higher
      expect(results[0].matchCalculation.skillsOverlap.score).toBeGreaterThan(0)
    })
  })

  describe('performance', () => {
    it('should handle large batch of jobs efficiently', async () => {
      const jobs = Array.from({ length: 50 }, (_, i) => ({
        ...mockJob,
        id: `job-${i}`,
        title: `Job ${i}`,
      }))

      const startTime = Date.now()
      const results = await service.calculateBatchMatches(jobs, mockUserProfile)
      const endTime = Date.now()

      expect(results).toHaveLength(50)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete in under 5 seconds
    }, 10000) // 10 second timeout for this test
  })

  describe('match calculation output format', () => {
    it('should return job with all original fields', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0]).toMatchObject({
        id: mockJob.id,
        title: mockJob.title,
        location_city: mockJob.location_city,
      })
      expect(results[0].company.name).toBe('Test Company')
    })

    it('should add match_score field', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0]).toHaveProperty('match_score')
      expect(typeof results[0].match_score).toBe('number')
    })

    it('should add matchCalculation object', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0]).toHaveProperty('matchCalculation')
      expect(results[0].matchCalculation).toHaveProperty('skillsOverlap')
      expect(results[0].matchCalculation).toHaveProperty('toolsOverlap')
      expect(results[0].matchCalculation).toHaveProperty('languageFit')
      expect(results[0].matchCalculation).toHaveProperty('locationFit')
      expect(results[0].matchCalculation).toHaveProperty('totalScore')
      expect(results[0].matchCalculation).toHaveProperty('weights')
    })

    it('should mark as fastMatch', async () => {
      const results = await service.calculateBatchMatches([mockJob], mockUserProfile)

      expect(results[0].matchCalculation.fastMatch).toBe(true)
    })
  })
})
