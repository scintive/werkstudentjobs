import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // Silence workspace root inference warning during tests
    root: __dirname,
  },
  eslint: {
    // Don't fail build on ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
}

export default nextConfig
