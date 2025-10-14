/**
 * Compact Job Analysis Component
 *
 * Clean, dashboard-consistent job analysis view
 * Follows SoC principles with extracted sub-components
 */

'use client';

import React from 'react';
import { Target } from 'lucide-react';
import type { IntelligentJobAnalysis } from '@/lib/services/intelligentJobAnalysisService';
import { ResponsibilityCard } from './ResponsibilityCard';
import { RelevantExperienceSidebar } from './RelevantExperienceSidebar';

interface CompactJobAnalysisProps {
  analysis: IntelligentJobAnalysis;
  userProfile: any;
  jobData: any;
}

function getScoreColors(score: number): { start: string; end: string } {
  if (score >= 80) return { start: '#10b981', end: '#059669' }; // green
  if (score >= 60) return { start: '#3b82f6', end: '#2563eb' }; // blue
  if (score >= 40) return { start: '#f59e0b', end: '#d97706' }; // amber
  return { start: '#ef4444', end: '#dc2626' }; // red
}

export function CompactJobAnalysis({ analysis, userProfile, jobData }: CompactJobAnalysisProps) {
  const scoreColors = getScoreColors(analysis.overall_match_score);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>Job Analysis</div>
            <div className="text-sm text-gray-600 font-medium">AI-powered compatibility insights</div>
          </div>
        </div>
        <div
          className="px-5 py-2.5 rounded-xl font-black"
          style={{
            backgroundColor: scoreColors.start,
            color: '#ffffff',
            fontSize: '1.25rem',
            letterSpacing: '-0.01em'
          }}
        >
          {analysis.overall_match_score}% match
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Responsibility cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.responsibility_breakdown.map((resp, i) => (
            <ResponsibilityCard key={i} responsibility={resp} index={i} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <RelevantExperienceSidebar experiences={analysis.relevant_experiences} />
        </div>
      </div>
    </div>
  );
}
