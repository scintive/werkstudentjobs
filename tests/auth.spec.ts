import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || ''
const PASSWORD = process.env.TEST_PASSWORD || ''

// Helper: login if credentials are provided
async function login(page) {
  await page.goto('/login')
  if (await page.locator('text=Welcome Back').count() === 0) return // already authed -> redirected
  await page.getByLabel('Email Address').fill(EMAIL)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
}

test.describe('Auth flow', () => {
  test('redirects from login when already authed', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'No TEST_EMAIL/TEST_PASSWORD provided')
    await login(page)
    await page.waitForURL('**/jobs', { timeout: 10000 })
    await page.goto('/login')
    await page.waitForURL('**/jobs')
  })

  test('upload gated for anonymous users', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/logout')
    await page.waitForLoadState('load')
    await page.goto('/')
    // Check for auth CTA rather than a fragile text
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible()
  })
})
