'use client';

import React from 'react';
import { Tooltip } from './tooltip';

interface MatchScoreProps {
  score: number; // 0-100
  breakdown?: {
    skills?: number;
    tools?: number;
    experience?: number;
    language?: number;
    location?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function MatchScore({
  score,
  breakdown,
  size = 'md',
  showLabel = true,
  className = ''
}: MatchScoreProps) {

  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      ring: 'ring-green-500/20'
    };
    if (score >= 60) return {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      ring: 'ring-blue-500/20'
    };
    if (score >= 40) return {
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      ring: 'ring-yellow-500/20'
    };
    return {
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      ring: 'ring-red-500/20'
    };
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const colors = getScoreColor(score);

  // Build tooltip content
  const tooltipContent = (
    <div className="text-left w-64">
      <div className="font-semibold mb-2 text-center">{score}% Overall Match</div>
      {breakdown ? (
        <div className="space-y-1 text-xs">
          {breakdown.skills !== undefined && (
            <div className="flex justify-between">
              <span>Skills:</span>
              <span className="font-medium">{Math.round(breakdown.skills)}%</span>
            </div>
          )}
          {breakdown.tools !== undefined && (
            <div className="flex justify-between">
              <span>Tools:</span>
              <span className="font-medium">{Math.round(breakdown.tools)}%</span>
            </div>
          )}
          {breakdown.experience !== undefined && (
            <div className="flex justify-between">
              <span>Experience:</span>
              <span className="font-medium">{Math.round(breakdown.experience)}%</span>
            </div>
          )}
          {breakdown.language !== undefined && (
            <div className="flex justify-between">
              <span>Language:</span>
              <span className="font-medium">{Math.round(breakdown.language)}%</span>
            </div>
          )}
          {breakdown.location !== undefined && (
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">{Math.round(breakdown.location)}%</span>
            </div>
          )}
          <div className="border-t border-white/20 mt-2 pt-2 text-center opacity-80">
            Based on fastMatchingService analysis
          </div>
        </div>
      ) : (
        <div className="text-xs opacity-90 text-center">
          Weighted score based on skills, experience, and requirements match
        </div>
      )}
    </div>
  );

  const badge = (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}
        transition-all duration-200 hover:${colors.ring} hover:ring-4
        cursor-help
      `}
    >
      {score}%
      {showLabel && size !== 'sm' && <span className="opacity-75">match</span>}
    </span>
  );

  return (
    <Tooltip content={tooltipContent} delay={150}>
      {badge}
    </Tooltip>
  );
}
