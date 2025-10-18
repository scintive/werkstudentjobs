import { test, expect, Page } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || ''
const PASSWORD = process.env.TEST_PASSWORD || ''

async function login(page: Page) {
  await page.goto('/login')
  if (await page.locator('text=Welcome Back').count() === 0) return
  await page.getByLabel('Email Address').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/jobs', { timeout: 10000 })
}

test.describe('Tailor editor basics', () => {
  test.skip(!EMAIL || !PASSWORD, 'No TEST_EMAIL/TEST_PASSWORD provided')

  test('Editor shows experience bullets and skills', async ({ page }) => {
    await login(page)
    await page.goto('/jobs')
    // Click first job card if present
    const firstJob = page.locator('[data-testid="job-card"]').first()
    if (await firstJob.count()) await firstJob.click()
    // Fallback: open a known path if your app uses programmatic routing
    await page.waitForURL(/\/jobs\/.+\/tailor/)
    // Experience bullets
    await expect(page.getByText('Responsibilities & Achievements')).toBeVisible()
    // Skills & Languages
    await expect(page.getByText('Skills & Languages')).toBeVisible()
  })
})
