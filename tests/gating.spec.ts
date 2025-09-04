import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || ''
const PASSWORD = process.env.TEST_PASSWORD || ''

async function login(page) {
  await page.goto('/login')
  if (await page.locator('text=Welcome Back').count() === 0) return
  await page.getByLabel('Email Address').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/jobs', { timeout: 10000 })
}

test('Tailor requires login', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/jobs/123/tailor')
  await expect(page).toHaveURL(/\/login/)
})

test('Upload visible after login', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'No TEST_EMAIL/TEST_PASSWORD provided')
  await login(page)
  await page.goto('/')
  await expect(page.getByText('Upload your resume')).toBeVisible()
})
