'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, CheckCircle, AlertTriangle, TrendingUp,
  BookOpen, Lightbulb, Zap, Star, ChevronRight,
  Briefcase, Award, Clock
} from 'lucide-react';
import type { IntelligentJobAnalysis } from '@/lib/services/intelligentJobAnalysisService';

interface ComprehensiveJobAnalysisProps {
  analysis: IntelligentJobAnalysis;
  userProfile: unknown;
  jobData: unknown;
  onNavigateToSkills?: () => void;
}

export function ComprehensiveJobAnalysis({
  analysis,
  userProfile,
  jobData,
  onNavigateToSkills
}: ComprehensiveJobAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'responsibilities' | 'experience' | 'skills' | 'strategy'>('responsibilities');

  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      progress: 'bg-green-500'
    };
    if (score >= 60) return {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      progress: 'bg-blue-500'
    };
    if (score >= 40) return {
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      progress: 'bg-yellow-500'
    };
    return {
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      progress: 'bg-red-500'
    };
  };

  const overallColors = getScoreColor(analysis.overall_match_score);

  return (
    <div className="space-y-4">
      {/* Overall Match Header */}
      <div className={`${overallColors.bg} rounded-lg p-6 border ${overallColors.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold ${overallColors.text}">
              {analysis.overall_match_score}% Match
            </h2>
            <p className="text-sm ${overallColors.text} mt-1 opacity-90">
              Overall compatibility with {jobData.title}
            </p>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(analysis.overall_match_score / 100) * 251} 251`}
                className={overallColors.progress}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold ${overallColors.text}">
              {analysis.overall_match_score}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {[
          { id: 'responsibilities', label: 'Responsibilities', icon: Target },
          { id: 'experience', label: 'Relevant Experience', icon: Briefcase },
          { id: 'skills', label: 'Skills Gap', icon: Award },
          { id: 'strategy', label: 'Win Strategy', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as unknown)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* RESPONSIBILITIES TAB */}
        {activeTab === 'responsibilities' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              How well you match each job responsibility based on your actual experience:
            </p>

            {analysis.responsibility_breakdown.map((resp, index) => {
              const colors = getScoreColor(resp.compatibility_score);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white border ${colors.border} rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Responsibility & Score */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{resp.responsibility}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                          {resp.compatibility_score}%
                        </span>
                      </div>

                      {/* Evidence - Only show if exists */}
                      {resp.user_evidence && resp.user_evidence.length > 0 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-green-700">Your Evidence:</div>
                            <ul className="text-xs text-green-600 mt-1 space-y-1">
                              {resp.user_evidence.map((evidence, i) => (
                                <li key={i}>• {evidence}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Gap Analysis - Only show if score < 80 */}
                      {resp.gap_analysis && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-amber-700">Gap:</div>
                            <div className="text-xs text-amber-600">{resp.gap_analysis}</div>
                            {resp.learning_recommendation && (
                              <div className="text-xs text-gray-600 mt-1">
                                💡 {resp.learning_recommendation}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mini progress circle */}
                    <div className="w-16 h-16 relative flex-shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${(resp.compatibility_score / 100) * 176} 176`}
                          className={colors.progress}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {resp.compatibility_score}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* RELEVANT EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Your most relevant experiences for THIS specific job (60%+ relevance):
            </p>

            {analysis.relevant_experiences.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No highly relevant experience found. Focus on building relevant projects and skills.</p>
              </div>
            ) : (
              analysis.relevant_experiences.map((exp, index) => {
                const colors = getScoreColor(exp.relevance_score);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white border ${colors.border} rounded-lg p-4`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                            {exp.relevance_score}% relevant
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{exp.company}</p>

                        <div className={`${colors.bg} rounded-md p-3`}>
                          <div className="text-xs font-medium ${colors.text} mb-1">Why This Matters:</div>
                          <p className="text-xs ${colors.text}">{exp.why_relevant}</p>
                        </div>

                        {exp.key_skills_demonstrated.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Skills Demonstrated:</div>
                            <div className="flex flex-wrap gap-1">
                              {exp.key_skills_demonstrated.map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {exp.highlighted_achievements.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Highlight These:</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {exp.highlighted_achievements.map((achievement, i) => (
                                <li key={i}>✓ {achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold ${colors.text}">{exp.relevance_score}%</div>
                        <div className="text-xs text-gray-500">match</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* SKILLS GAP TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Optimize Your Skills</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Add missing skills and emphasize matched ones for this specific job
                  </p>
                </div>
                <button
                  onClick={onNavigateToSkills}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span>Tailor Skills</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {analysis.skills_analysis.map((category, index) => {
              const colors = getScoreColor(category.overall_category_fit);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{category.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {category.overall_category_fit}% fit
                    </span>
                  </div>

                  {category.matched_skills.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-green-700 mb-2">✓ You Have ({category.matched_skills.length}):</div>
                      <div className="space-y-1">
                        {category.matched_skills.map((match, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs border border-green-200 flex-shrink-0">
                              {match.skill}
                            </span>
                            <span className="text-xs text-gray-500">{match.proficiency_evidence}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {category.missing_critical_skills.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-amber-700 mb-2">⚠ Missing Skills ({category.missing_critical_skills.length}):</div>
                      <div className="space-y-2">
                        {category.missing_critical_skills.map((gap, i) => {
                          const importanceColor =
                            gap.importance === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            gap.importance === 'important' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-700 border-gray-200';

                          return (
                            <div key={i} className={`${importanceColor} border rounded-md p-2`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-xs">{gap.skill}</span>
                                <span className="text-xs opacity-75">({gap.importance})</span>
                                <Clock className="w-3 h-3 ml-auto" />
                                <span className="text-xs">{gap.time_estimate}</span>
                              </div>
                              <p className="text-xs opacity-90">{gap.learning_path}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* STRATEGY TAB */}
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            {/* Main Positioning */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-2">Your Unique Angle</h4>
                  <p className="text-sm text-purple-800 font-medium">
                    {analysis.positioning_strategy.your_unique_angle}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Differentiators & Red Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Differentiators */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Your Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {analysis.positioning_strategy.key_differentiators.map((diff, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Red Flags */}
              {analysis.positioning_strategy.red_flags_to_address.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-medium text-gray-900">Address These</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.positioning_strategy.red_flags_to_address.map((flag, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-amber-600">⚠</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Interview Talking Points */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Interview Talking Points</h4>
              </div>
              <ul className="space-y-2">
                {analysis.positioning_strategy.interview_talking_points.map((point, i) => (
                  <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="font-bold">{i + 1}.</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Plan */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Action Plan (Prioritized)</h4>
              </div>
              <div className="space-y-2">
                {analysis.action_plan
                  .sort((a, b) => {
                    const priority = { high: 0, medium: 1, low: 2 };
                    return priority[a.priority] - priority[b.priority];
                  })
                  .map((item, i) => {
                    const priorityColor =
                      item.priority === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-gray-100 text-gray-700 border-gray-300';

                    return (
                      <div key={i} className="border border-gray-200 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColor}`}>
                            {item.priority} priority
                          </span>
                          <span className="text-xs text-gray-500">{item.time_investment}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.action}</p>
                        <p className="text-xs text-gray-600 mt-1">{item.expected_impact}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
