import { defineConfig } from '@playwright/test'

// Minimal config for sandboxed environments: no webServer, no browsers.
export default defineConfig({
  testDir: './',
  reporter: 'line',
  projects: [
    { name: 'node-only', use: {} },
  ],
})

