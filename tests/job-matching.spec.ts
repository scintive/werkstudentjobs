import { test, expect } from '@playwright/test'

test.describe('Job Matching and Filtering', () => {
  test('should calculate match scores for jobs', async ({ request }) => {
    const userProfile = {
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      tools: ['Git', 'Docker', 'AWS'],
      languages: ['English', 'German'],
      personal_details: {
        city: 'Berlin',
      },
    }

    const jobs = [
      {
        id: 'job-1',
        title: 'Frontend Developer',
        skills_canonical_flat: ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS'],
        tools_canonical_flat: ['Git', 'Figma'],
        german_required: 'Not required',
        location_city: 'Berlin',
      },
      {
        id: 'job-2',
        title: 'Backend Developer',
        skills_canonical_flat: ['Node.js', 'Python', 'SQL'],
        tools_canonical_flat: ['Docker', 'AWS', 'Jenkins'],
        german_required: 'Required',
        location_city: 'Munich',
      },
    ]

    const response = await request.post('/api/jobs/match-scores', {
      data: {
        userProfile,
        jobs,
      },
    })

    if (!response.ok()) {
      console.error('Match scores API error:', await response.text())
    }

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveLength(2)
    expect(data[0]).toHaveProperty('match_score')
    expect(data[0]).toHaveProperty('matchCalculation')
    expect(data[0].match_score).toBeGreaterThanOrEqual(0)
    expect(data[0].match_score).toBeLessThanOrEqual(100)
  })

  test('should handle empty job list', async ({ request }) => {
    const userProfile = {
      skills: ['JavaScript', 'React'],
      tools: ['Git'],
      languages: ['English'],
    }

    const response = await request.post('/api/jobs/match-scores', {
      data: {
        userProfile,
        jobs: [],
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveLength(0)
  })

  test('should prioritize skills in matching', async ({ request }) => {
    const userProfile = {
      skills: ['React', 'JavaScript', 'TypeScript'],
      tools: [],
      languages: ['English'],
    }

    const skillHeavyJob = {
      id: 'skill-job',
      skills_canonical_flat: ['React', 'JavaScript', 'TypeScript'],
      tools_canonical_flat: [],
    }

    const toolHeavyJob = {
      id: 'tool-job',
      skills_canonical_flat: [],
      tools_canonical_flat: ['Figma', 'Photoshop', 'Illustrator'],
    }

    const response = await request.post('/api/jobs/match-scores', {
      data: {
        userProfile,
        jobs: [skillHeavyJob, toolHeavyJob],
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // Skill-heavy job should score higher (skills have 50% weight vs tools 20%)
    const skillJobScore = data.find((j: any) => j.id === 'skill-job')?.match_score
    const toolJobScore = data.find((j: any) => j.id === 'tool-job')?.match_score

    expect(skillJobScore).toBeGreaterThan(toolJobScore)
  })

  test('should include matched and missing skills in calculation', async ({ request }) => {
    const userProfile = {
      skills: ['JavaScript', 'React'],
      tools: ['Git'],
      languages: ['English'],
    }

    const job = {
      id: 'test-job',
      skills_canonical_flat: ['JavaScript', 'React', 'TypeScript', 'Vue'],
      tools_canonical_flat: ['Git', 'Docker'],
    }

    const response = await request.post('/api/jobs/match-scores', {
      data: {
        userProfile,
        jobs: [job],
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    const calc = data[0].matchCalculation
    expect(calc.skillsOverlap).toBeDefined()
    expect(calc.skillsOverlap.matched).toBeInstanceOf(Array)
    expect(calc.skillsOverlap.missing).toBeInstanceOf(Array)

    // Should match JavaScript and React
    expect(calc.skillsOverlap.matched.length).toBeGreaterThan(0)

    // Should have TypeScript and Vue as missing
    expect(calc.skillsOverlap.missing.length).toBeGreaterThan(0)
  })

  test('should handle remote jobs correctly', async ({ request }) => {
    const userProfile = {
      skills: ['JavaScript'],
      tools: ['Git'],
      languages: ['English'],
      personal_details: {
        city: 'Hamburg',
      },
    }

    const remoteJob = {
      id: 'remote-job',
      skills_canonical_flat: ['JavaScript'],
      tools_canonical_flat: ['Git'],
      is_remote: true,
      location_city: 'Berlin',
    }

    const onsiteJob = {
      id: 'onsite-job',
      skills_canonical_flat: ['JavaScript'],
      tools_canonical_flat: ['Git'],
      is_remote: false,
      location_city: 'Berlin',
    }

    const response = await request.post('/api/jobs/match-scores', {
      data: {
        userProfile,
        jobs: [remoteJob, onsiteJob],
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    const remoteScore = data.find((j: any) => j.id === 'remote-job')
    const onsiteScore = data.find((j: any) => j.id === 'onsite-job')

    expect(remoteScore.matchCalculation.locationFit).toBeDefined()
    expect(onsiteScore.matchCalculation.locationFit).toBeDefined()

    // Remote job should have better location fit for distant city
    expect(remoteScore.matchCalculation.locationFit.score).toBeGreaterThanOrEqual(
      onsiteScore.matchCalculation.locationFit.score
    )
  })

  test('should handle language requirements', async ({ request }) => {
    const userProfile = {
      skills: ['JavaScript'],
      tools: ['Git'],
      languages: ['English', 'German'],
    }

    const germanRequiredJob = {
      id: 'german-job',
      skills_canonical_flat: ['JavaScript'],
      tools_canonical_flat: ['Git'],
      german_required: 'Required',
    }

    const englishOnlyJob = {
      id: 'english-job',
      skills_canonical_flat: ['JavaScript'],
      tools_canonical_flat: ['Git'],
      german_required: 'Not required',
    }

    const response = await request.post('/api/jobs/match-scores', {
      data: {
        userProfile,
        jobs: [germanRequiredJob, englishOnlyJob],
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data[0].matchCalculation.languageFit).toBeDefined()
    expect(data[1].matchCalculation.languageFit).toBeDefined()
  })
})

test.describe('Job Filtering', () => {
  test.skip('should filter jobs by location', async ({ page }) => {
    // This would require setting up test data in the database
    // Placeholder for future implementation
  })

  test.skip('should filter jobs by remote option', async ({ page }) => {
    // This would require setting up test data in the database
    // Placeholder for future implementation
  })

  test.skip('should sort jobs by match score', async ({ page }) => {
    // This would require setting up test data in the database
    // Placeholder for future implementation
  })
})
