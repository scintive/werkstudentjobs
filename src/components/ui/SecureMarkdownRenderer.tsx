'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';

interface SecureMarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact' | 'elegant';
  allowHtml?: boolean; // Default false for security
}

export function SecureMarkdownRenderer({
  content,
  className,
  variant = 'default',
  allowHtml = false
}: SecureMarkdownRendererProps) {
  // Sanitize content before rendering to prevent XSS
  const sanitizedContent = React.useMemo(() => {
    if (!content) return '';

    // Configure DOMPurify for strict sanitization
    const cleanHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'a', 'span'
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
      // Force all links to open in new tab with secure attributes
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: false,
      IN_PLACE: false,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    return cleanHtml;
  }, [content]);

  const baseStyles = {
    default: "prose prose-sm max-w-none",
    compact: "prose prose-xs max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0.5 prose-li:text-xs prose-p:text-xs",
    elegant: "prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900"
  };

  const customStyles = `
    prose-headings:font-semibold prose-headings:text-gray-900
    prose-p:text-gray-700 prose-p:leading-relaxed
    prose-strong:text-gray-900 prose-strong:font-semibold
    prose-em:text-gray-600 prose-em:italic
    prose-ul:list-none prose-ul:pl-0
    prose-li:relative prose-li:pl-6 prose-li:mb-2
    prose-li:before:content-['•'] prose-li:before:absolute prose-li:before:left-0
    prose-li:before:text-blue-500 prose-li:before:font-bold prose-li:before:text-lg
    prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
    prose-code:text-sm prose-code:font-medium prose-code:text-gray-800
    prose-a:text-blue-600 prose-a:underline prose-a:underline-offset-2
  `;

  return (
    <div className={cn(baseStyles[variant], customStyles, className)}>
      <ReactMarkdown
        skipHtml={!allowHtml}
        components={{
          // Custom heading styling with security
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              {children}
            </h4>
          ),
          // Custom paragraph styling
          p: ({ children }) => (
            <p className={cn("text-gray-700 leading-relaxed mb-1 last:mb-0", variant === 'compact' ? 'text-xs' : '')}>
              {children}
            </p>
          ),
          // Custom list styling
          ul: ({ children }) => (
            <ul className="space-y-0.5 mb-2">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className={cn("flex items-start gap-1.5 text-gray-700", variant === 'compact' ? 'text-xs' : '')}>
              <span className="text-blue-500 font-bold text-xs mt-0.5 flex-shrink-0">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          // Custom emphasis styling
          strong: ({ children }) => (
            <span className="font-semibold text-gray-900">{children}</span>
          ),
          em: ({ children }) => (
            <span className="italic text-gray-600">{children}</span>
          ),
          // Custom code styling
          code: ({ children }) => (
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-medium text-gray-800">
              {children}
            </code>
          ),
          // Secure link handling
          a: ({ href, children, ...props }) => {
            // Validate URL to prevent javascript: protocol XSS
            const isValidUrl = href && !href.toLowerCase().startsWith('javascript:');
            const sanitizedHref = isValidUrl ? href : '#';

            return (
              <a
                href={sanitizedHref}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
                {...props}
              >
                {children}
              </a>
            );
          }
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}