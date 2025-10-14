/**
 * Responsibility Card Component
 *
 * Displays a single job responsibility with compatibility score,
 * evidence, gaps, and learning resources
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, ExternalLink } from 'lucide-react';
import type { ResponsibilityMatch } from '@/lib/services/intelligentJobAnalysisService';

interface ResponsibilityCardProps {
  responsibility: ResponsibilityMatch;
  index: number;
}

function getScoreColors(score: number): { start: string; end: string } {
  if (score >= 80) return { start: '#10b981', end: '#059669' }; // green
  if (score >= 60) return { start: '#3b82f6', end: '#2563eb' }; // blue
  if (score >= 40) return { start: '#f59e0b', end: '#d97706' }; // amber
  return { start: '#ef4444', end: '#dc2626' }; // red
}

export function ResponsibilityCard({ responsibility: resp, index }: ResponsibilityCardProps) {
  const scoreColors = getScoreColors(resp.compatibility_score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="card"
      style={{ padding: '1.25rem' }}
    >
      {/* Title and score */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-base font-semibold text-gray-900 leading-tight flex-1" style={{ letterSpacing: '-0.01em' }}>
          {resp.responsibility}
        </div>
        <div
          className="text-xl font-black flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${scoreColors.start}, ${scoreColors.end})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em'
          }}
        >
          {resp.compatibility_score}%
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="mb-4"
        style={{
          height: '8px',
          background: '#f3f4f6',
          borderRadius: '999px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div
          style={{
            width: `${resp.compatibility_score}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${scoreColors.start}, ${scoreColors.end})`,
            borderRadius: '999px',
            transition: 'width 0.6s ease-in-out',
            boxShadow: `0 0 8px ${scoreColors.start}40`
          }}
        />
      </div>

      {/* Gap analysis */}
      {resp.gap_analysis && (
        <div className="text-sm text-gray-700 mb-4 leading-relaxed font-medium">
          {resp.gap_analysis}
        </div>
      )}

      {/* Learning resources */}
      {resp.learning_recommendation && resp.recommended_courses && resp.recommended_courses.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-emerald-700" style={{ letterSpacing: '0.02em' }}>
            <BookOpen className="w-4 h-4" />
            QUICK LEARNING PATH
          </div>
          <div className="flex flex-wrap gap-2">
            {resp.recommended_courses.map((course, idx) => (
              <a
                key={idx}
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
                style={{ textDecoration: 'none', maxWidth: '100%' }}
              >
                <span className="truncate">{course.name}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            ))}
          </div>
          <div className="text-xs text-gray-700 mt-2.5 leading-relaxed font-medium">
            💡 {resp.learning_recommendation}
          </div>
        </div>
      )}

      {/* Evidence */}
      {resp.user_evidence && resp.user_evidence.length > 0 && (
        <div className="flex gap-2.5 p-3.5 rounded-lg bg-blue-50 border-2 border-blue-200 shadow-sm">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-blue-900 mb-2" style={{ letterSpacing: '0.01em' }}>What you bring:</div>
            {resp.user_evidence.map((evidence, idx) => (
              <div key={idx} className="mb-1.5 text-blue-800 leading-relaxed font-medium">
                • {evidence}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
