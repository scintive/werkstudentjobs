/**
 * Relevant Experience Sidebar Component
 *
 * Compact sidebar showing relevant past experiences
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import type { ExperienceRelevance } from '@/lib/services/intelligentJobAnalysisService';

interface RelevantExperienceSidebarProps {
  experiences: ExperienceRelevance[];
}

function getScoreBadgeStyle(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
}

export function RelevantExperienceSidebar({ experiences }: RelevantExperienceSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="card"
      style={{ padding: '1.25rem' }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div className="text-base font-bold text-gray-900" style={{ letterSpacing: '-0.01em' }}>
          Relevant Experience
        </div>
      </div>

      {experiences.length > 0 ? (
        <ul className="space-y-4">
          {experiences.map((exp, idx) => (
            <li key={idx} className="text-sm">
              <div className="font-bold text-gray-900 mb-1" style={{ letterSpacing: '-0.005em' }}>
                {exp.position}
              </div>
              <div className="text-xs text-gray-600 mb-2.5 font-medium">
                @ {exp.company}
              </div>
              <div className="text-xs text-gray-700 mb-2.5 leading-relaxed font-medium">
                {exp.why_relevant}
              </div>
              <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border-2 shadow-sm ${getScoreBadgeStyle(exp.relevance_score)}`} style={{ letterSpacing: '0.01em' }}>
                {exp.relevance_score}% RELEVANT
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-gray-600 text-center py-6 font-medium leading-relaxed">
          Focus on building skills through courses and projects above.
        </div>
      )}
    </motion.div>
  );
}
