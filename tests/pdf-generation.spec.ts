import { test, expect } from '@playwright/test'

test.describe('PDF Generation', () => {
  const mockResumeData = {
    personalInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+49 123 456789',
      location: 'Berlin, Germany',
    },
    professionalTitle: 'Senior Software Engineer',
    professionalSummary: 'Experienced developer with 5+ years in web development',
    enableProfessionalSummary: true,
    skills: {
      technical: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      soft_skills: ['Communication', 'Teamwork', 'Problem Solving'],
      tools: ['Git', 'Docker', 'AWS', 'Jira'],
      languages: ['English (Native)', 'German (Professional)'],
    },
    experience: [
      {
        company: 'Tech Corp',
        title: 'Software Engineer',
        start_date: '2020-01',
        end_date: '2024-01',
        description: 'Built scalable web applications',
        bullets: ['Developed features', 'Fixed bugs', 'Improved performance'],
      },
    ],
    education: [
      {
        institution: 'University of Berlin',
        degree: 'B.Sc. Computer Science',
        start_date: '2015',
        end_date: '2019',
      },
    ],
    projects: [],
    certifications: [],
    languages: [],
  }

  test('should generate PDF with Swiss template', async ({ request }) => {
    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: mockResumeData,
        template: 'swiss',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')

    const buffer = await response.body()
    expect(buffer.length).toBeGreaterThan(1000) // PDF should have content
  })

  test('should generate PDF with Professional template', async ({ request }) => {
    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: mockResumeData,
        template: 'professional',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')
  })

  test('should generate PDF with Classic template', async ({ request }) => {
    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: mockResumeData,
        template: 'classic',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')
  })

  test('should generate PDF with Impact template', async ({ request }) => {
    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: mockResumeData,
        template: 'impact',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')
  })

  test('should handle resume with photo', async ({ request }) => {
    const resumeWithPhoto = {
      ...mockResumeData,
      personalInfo: {
        ...mockResumeData.personalInfo,
        photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    }

    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: resumeWithPhoto,
        template: 'swiss',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')
  })

  test('should handle resume with dynamic skill categories', async ({ request }) => {
    const resumeWithDynamicSkills = {
      ...mockResumeData,
      skills: {
        technical: ['React', 'Node.js'],
        'programming_languages___technical': ['JavaScript', 'TypeScript', 'Python'],
        'frameworks___technical': ['React', 'Express', 'Django'],
        soft_skills: ['Communication'],
        tools: ['Git', 'Docker'],
      },
    }

    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: resumeWithDynamicSkills,
        template: 'swiss',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')
  })

  test('should handle minimal resume data', async ({ request }) => {
    const minimalResume = {
      personalInfo: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      professionalTitle: 'Developer',
      skills: {},
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
    }

    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: minimalResume,
        template: 'swiss',
      },
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['content-type']).toContain('application/pdf')
  })

  test('should return error for invalid template', async ({ request }) => {
    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: mockResumeData,
        template: 'invalid-template',
      },
    })

    expect(response.status()).toBeGreaterThanOrEqual(400)
  })

  test('should return error for missing resume data', async ({ request }) => {
    const response = await request.post('/api/resume/pdf-download', {
      data: {
        template: 'swiss',
      },
    })

    expect(response.status()).toBeGreaterThanOrEqual(400)
  })

  test('should handle special characters in resume data', async ({ request }) => {
    const resumeSpecialChars = {
      ...mockResumeData,
      personalInfo: {
        ...mockResumeData.personalInfo,
        name: 'Müller, Hans-Peter',
      },
      professionalSummary: 'Expert in AI & Machine Learning • 10+ years experience',
    }

    const response = await request.post('/api/resume/pdf-download', {
      data: {
        resumeData: resumeSpecialChars,
        template: 'swiss',
      },
    })

    expect(response.ok()).toBeTruthy()
  })
})
