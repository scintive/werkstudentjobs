/**
 * HTML Sanitization utilities for preventing XSS attacks
 * Based on OWASP recommendations
 */

/**
 * Escape HTML special characters to prevent XSS
 * Use this for any user-generated content that will be rendered as HTML
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';

  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * Use this for any user-provided URLs
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';

  const trimmedUrl = String(url).trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:text/html',
    'vbscript:',
    'file:',
    'about:',
    'chrome:',
    'ms-',
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '#';
    }
  }

  // Allow only safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:', 'tel:', '//', '/'];
  const hasValidProtocol = safeProtocols.some(protocol =>
    trimmedUrl.startsWith(protocol) || !trimmedUrl.includes(':')
  );

  if (!hasValidProtocol) {
    return '#';
  }

  return String(url);
}

/**
 * Remove all HTML tags from a string
 * Use this when you need plain text only
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';

  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize HTML content by removing dangerous elements and attributes
 * This is a lightweight alternative when DOMPurify is not available
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  let sanitized = String(html);

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*javascript:[^"']*/gi, '$1="#"');
  sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*data:text\/html[^"']*/gi, '$1="#"');

  // Remove form tags
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');

  // Remove input, button, select, textarea tags
  sanitized = sanitized.replace(/<(input|button|select|textarea)\b[^>]*>/gi, '');

  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  const trimmed = String(email).trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize phone numbers (basic)
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';

  // Keep only digits, spaces, +, -, (, )
  return String(phone).replace(/[^0-9\s+\-()]/g, '');
}