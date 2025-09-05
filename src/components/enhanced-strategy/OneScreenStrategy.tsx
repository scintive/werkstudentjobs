"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Star, Lightbulb, ChevronRight } from 'lucide-react';

type OneScreenStrategyProps = {
  userProfile: any;
  jobData: any;
  strategy?: any;
  onTailorSkills?: () => void;
};

function flattenUserSkills(skillsObj: any): string[] {
  if (!skillsObj || typeof skillsObj !== 'object') return [];
  const out: string[] = [];
  Object.values(skillsObj).forEach((arr: any) => {
    if (Array.isArray(arr)) {
      for (const s of arr) {
        if (!s) continue;
        if (typeof s === 'string') out.push(s);
        else if (typeof s === 'object') out.push(String((s as any).skill || (s as any).name || ''));
      }
    }
  });
  return out.filter(Boolean);
}

export default function OneScreenStrategy({ userProfile, jobData, strategy, onTailorSkills }: OneScreenStrategyProps) {
  const jobSkills: string[] = Array.from(new Set([
    ...(jobData?.skills_original || []),
    ...(jobData?.tools_original || [])
  ].filter(Boolean)));

  const userSkills = flattenUserSkills(userProfile?.skills);
  const userSkillsNorm = userSkills.map(s => s.toLowerCase().trim());

  const matched: string[] = [];
  const missing: string[] = [];
  for (const js of jobSkills) {
    const key = js.toLowerCase().trim();
    const exists = userSkillsNorm.some(us => us === key || us.includes(key) || key.includes(us));
    (exists ? matched : missing).push(js);
  }

  const pitch = strategy?.positioning?.elevator_pitch || strategy?.win_strategy?.main_positioning || '';
  const themes: string[] = strategy?.positioning?.themes || strategy?.win_strategy?.key_differentiators || [];
  const atsKeywords: string[] = strategy?.ats_keywords || strategy?.win_strategy?.ats_keywords || [];

  const score = Math.round(Number(jobData?.match_score || 0));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm text-gray-500">AI Strategy Snapshot</div>
            <div className="font-semibold text-gray-900">{jobData?.title}</div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
          {score}% match
        </div>
      </div>

      {/* 3-column compact grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Skills summary */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <div className="font-medium text-gray-900">Skills Snapshot</div>
          </div>
          <div className="text-xs text-gray-500 mb-2">Top matches and gaps</div>
          <div className="mb-2">
            <div className="text-xs font-medium text-green-700 mb-1">✓ You have</div>
            <div className="flex flex-wrap gap-1">
              {matched.slice(0, 6).map((s) => (
                <span key={s} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">{s}</span>
              ))}
              {matched.length === 0 && <span className="text-gray-500 text-xs">No direct skill matches</span>}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-amber-700 mb-1">⚠ Consider adding</div>
            <div className="flex flex-wrap gap-1">
              {missing.slice(0, 6).map((s) => (
                <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs border border-amber-200">{s}</span>
              ))}
              {missing.length === 0 && <span className="text-gray-500 text-xs">No major gaps</span>}
            </div>
          </div>
          {onTailorSkills && (
            <button onClick={onTailorSkills} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
              Tailor skills <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Positioning */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-600" />
            <div className="font-medium text-gray-900">Positioning</div>
          </div>
          {themes?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {themes.slice(0, 3).map((t: string) => (
                <span key={t} className="px-2 py-0.5 bg-yellow-50 text-yellow-800 rounded-full text-xs border border-yellow-200">{t}</span>
              ))}
            </div>
          )}
          {pitch && (
            <div className="text-sm text-gray-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 line-clamp-4">
              {pitch}
            </div>
          )}
        </div>

        {/* ATS keywords */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-purple-600" />
            <div className="font-medium text-gray-900">ATS Keywords</div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(atsKeywords || []).slice(0, 10).map((k: string) => (
              <button key={k} onClick={() => navigator.clipboard.writeText(k)} className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded-full text-xs border border-purple-200 hover:bg-purple-100">
                {k}
              </button>
            ))}
            {(!atsKeywords || atsKeywords.length === 0) && <span className="text-xs text-gray-500">No keywords</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

