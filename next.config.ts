import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // Silence workspace root inference warning during tests
    root: __dirname,
  },
  eslint: {
    // Enable ESLint checks during builds for production quality
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable TypeScript type checking during builds
    ignoreBuildErrors: false,
  },
  // Externalize packages for Vercel serverless
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'puppeteer'],
}

export default nextConfig
