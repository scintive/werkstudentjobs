import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers based on OWASP recommendations
const securityHeaders = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  // Strict Transport Security (for HTTPS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  // Content Security Policy - prevents XSS, data injection attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// Rate limiting configuration
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
  return `${ip}:${req.nextUrl.pathname}`
}

function checkRateLimit(req: NextRequest, limit: number = 100, windowMs: number = 60000): boolean {
  const key = getRateLimitKey(req)
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next()

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Different limits for different endpoints
    let limit = 100
    let window = 60000 // 1 minute

    // More restrictive for auth endpoints
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      limit = 10
      window = 300000 // 5 minutes
    }

    // More restrictive for AI endpoints (expensive operations)
    if (
      request.nextUrl.pathname.includes('/extract') ||
      request.nextUrl.pathname.includes('/analyze') ||
      request.nextUrl.pathname.includes('/strategy') ||
      request.nextUrl.pathname.includes('/tailor')
    ) {
      limit = 20
      window = 300000 // 5 minutes
    }

    if (!checkRateLimit(request, limit, window)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }
  }

  // CSRF Protection for state-changing operations
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // In production, verify origin matches
    if (process.env.NODE_ENV === 'production' && origin && host) {
      const allowedOrigins = [
        `https://${host}`,
        `http://${host}`, // Remove in production if HTTPS only
        process.env.NEXT_PUBLIC_BASE_URL
      ].filter(Boolean)

      if (!allowedOrigins.some(allowed => origin === allowed)) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF validation failed' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }

  return response
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}