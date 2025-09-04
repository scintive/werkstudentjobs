'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'default' | 'compact' | 'elegant';
}

export function MarkdownRenderer({ content, className, variant = 'default' }: MarkdownRendererProps) {
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
  `;

  return (
    <div className={cn(baseStyles[variant], customStyles, className)}>
      <ReactMarkdown
        components={{
          // Custom heading styling
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
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}