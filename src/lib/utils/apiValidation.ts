/**
 * API Input Validation and Sanitization
 * Prevents SQL injection, XSS, and other injection attacks
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Common validation schemas
 */
export const schemas = {
  // UUID validation for IDs
  uuid: z.string().uuid('Invalid ID format'),

  // Email validation
  email: z.string().email('Invalid email format'),

  // URL validation
  url: z.string().url('Invalid URL format'),

  // Phone validation
  phone: z.string().regex(/^[+\-\d\s()]+$/, 'Invalid phone number'),

  // Alphanumeric with spaces (for names, titles, etc)
  safeText: z.string().regex(/^[a-zA-Z0-9\s\-_.,!?'"]+$/, 'Contains invalid characters'),

  // Safe HTML (stripped of dangerous tags)
  safeHtml: z.string().transform((val) => {
    // Remove script, style, iframe, form tags
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  }),

  // Pagination
  pagination: z.object({
    page: z.number().min(1).max(1000).default(1),
    limit: z.number().min(1).max(100).default(20),
  }),

  // Date range
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }),
};

/**
 * Validate request body against a schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return { data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map((e: z.ZodIssue) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Sanitize user input to prevent SQL injection
 * Use this for any user input that goes into database queries
 */
export function sanitizeSqlInput(input: string | null | undefined): string {
  if (!input) return '';

  return String(input)
    // Remove SQL comments
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    // Escape special SQL characters
    .replace(/'/g, "''")
    // Remove common SQL injection patterns
    .replace(/(\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT)\b)/gi, '')
    .trim();
}

/**
 * Validate and sanitize file upload
 */
export interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 10,
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  } = options;

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return { valid: false, error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}` };
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const extensionCount = (fileName.match(/\./g) || []).length;
  if (extensionCount > 1) {
    // Allow only specific cases like .tar.gz
    const allowedDoubleExtensions = ['.tar.gz', '.tar.bz2'];
    const hasAllowedDoubleExtension = allowedDoubleExtensions.some(ext => fileName.endsWith(ext));
    if (!hasAllowedDoubleExtension) {
      return { valid: false, error: 'Files with multiple extensions are not allowed' };
    }
  }

  return { valid: true };
}

/**
 * Rate limiting helper
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Validate authentication token
 */
export async function validateAuth(
  request: NextRequest
): Promise<{ userId: string | null; error: NextResponse | null }> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      ),
    };
  }

  // Token validation would go here
  // For now, we'll use a simple check
  const token = authHeader.replace('Bearer ', '');

  if (!token || token.length < 10) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      ),
    };
  }

  // In production, verify JWT token here
  // const decoded = verifyJWT(token);
  // return { userId: decoded.sub, error: null };

  return { userId: null, error: null };
}

/**
 * Create a secure response with proper headers
 */
export function secureResponse(
  data: unknown,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(data, { status });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add custom headers
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}