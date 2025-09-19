import { test, expect } from '@playwright/test'

// Minimal API test to ensure skills with objects don't disappear in preview
test('preview renders technical skills when provided as objects and showSkillLevelsInResume=false', async ({ request }) => {
  const resumeData = {
    personalInfo: { name: 'Test User', email: 'test@example.com', phone: '123', location: 'Berlin' },
    professionalTitle: 'Data Analyst',
    professionalSummary: 'Summary',
    enableProfessionalSummary: true,
    skills: {
      technical: [
        { skill: 'Excel', proficiency: 'Advanced' },
        { skill: 'Tableau', proficiency: 'Intermediate' }
      ],
      soft_skills: ['Communication'],
      tools: ['Git']
    },
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: []
  }

  const resp = await request.post('/api/resume/preview', {
    data: {
      resumeData,
      template: 'swiss',
      userProfile: {},
      showSkillLevelsInResume: false
    }
  })

  expect(resp.ok()).toBeTruthy()
  const body = await resp.json()
  expect(typeof body.html).toBe('string')
  expect(body.html).toContain('Excel')
  expect(body.html).toContain('Tableau')
})

test('preview renders languages name and level from skills.languages strings', async ({ request }) => {
  const resumeData = {
    personalInfo: { name: 'Test User', email: 'test@example.com', phone: '123', location: 'Berlin' },
    professionalTitle: 'Data Analyst',
    professionalSummary: 'Summary',
    enableProfessionalSummary: true,
    skills: {
      technical: [],
      soft_skills: [],
      tools: [],
      languages: ['English (Full professional)', 'German (Professional working)']
    },
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: []
  }

  const resp = await request.post('/api/resume/preview', {
    data: {
      resumeData,
      template: 'swiss',
      userProfile: {},
      showSkillLevelsInResume: false
    }
  })

  expect(resp.ok()).toBeTruthy()
  const body = await resp.json()
  expect(typeof body.html).toBe('string')
  expect(body.html).toContain('English')
  expect(body.html).toContain('German')
})


