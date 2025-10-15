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
}

export default nextConfig
