import { test, expect } from '@playwright/test'

test('resume preview API responds', async ({ request }) => {
  const body = {
    resumeData: {
      personalInfo: { name: 'Test User', email: 'test@example.com', phone: '', location: '' },
      professionalTitle: 'Engineer',
      professionalSummary: '',
      enableProfessionalSummary: false,
      skills: { technical: ['JavaScript'], languages: ['English (C1)'] },
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      customSections: []
    },
    template: 'swiss'
  }
  const res = await request.post('/api/resume/preview', { data: body })
  expect(res.ok()).toBeTruthy()
  const json = await res.json()
  expect(json.success).toBeTruthy()
  expect((json.html || '').length).toBeGreaterThan(500)
})
