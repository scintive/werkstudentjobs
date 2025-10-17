import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/serverClient';

/**
 * Authentication middleware for API routes
 * Ensures user is authenticated before processing requests
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = createServerSupabase(request);

    // Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access this resource.' },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="api"',
          },
        }
      );
    }

    // Check if user session is valid
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Pass the authenticated user ID to the handler
    return handler(request, authData.user.id);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Optional authentication - continues even if user is not authenticated
 * But provides userId if authenticated
 */
export async function optionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string | null) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = createServerSupabase(request);
    const { data: authData } = await supabase.auth.getUser();
    return handler(request, authData?.user?.id || null);
  } catch (error) {
    // Continue without authentication
    return handler(request, null);
  }
}

/**
 * Admin-only authentication
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = createServerSupabase(request);

    // Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you would implement this based on your user roles)
    // For example, checking a user_roles table or user metadata
    const isAdmin = authData.user.email?.endsWith('@admin.com'); // Example check

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    return handler(request, authData.user.id);
  } catch (error) {
    console.error('Admin authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Validate CSRF token for state-changing operations
 */
export function validateCSRF(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) {
    // Could be a legitimate API call, check for API key instead
    return true;
  }

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_BASE_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);

  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }

  if (referer) {
    const refererUrl = new URL(referer);
    const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
    if (!allowedOrigins.includes(refererOrigin)) {
      return false;
    }
  }

  return true;
}