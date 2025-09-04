'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Code, TrendingUp, Plus, Check, X, 
  ChevronRight, Sparkles, Target, Zap, Award,
  Copy, ExternalLink, GraduationCap
} from 'lucide-react';

interface CourseworkAlignment {
  course: string;
  requirement: string;
  evidence: string;
  relevance_score: number;
}

interface ProjectAlignment {
  project: string;
  requirement: string;
  evidence: string;
  metric?: string;
  impact_score: number;
}

interface AlignmentCardsProps {
  coursework: CourseworkAlignment[];
  projects: ProjectAlignment[];
  onAddToResume?: (type: 'course' | 'project', item: any) => void;
  onAddToCoverLetter?: (type: 'course' | 'project', item: any) => void;
}

export function AlignmentCards({ 
  coursework, 
  projects, 
  onAddToResume,
  onAddToCoverLetter 
}: AlignmentCardsProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const copyEvidence = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Perfect Match' };
    if (score >= 60) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Strong Match' };
    if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Good Match' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Relevant' };
  };

  return (
    <div className="space-y-8">
      {/* Coursework Alignment Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Coursework Alignment
              </h3>
              <p className="text-sm text-gray-600">
                Your academic modules that match job requirements
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {coursework.length} relevant courses
          </span>
        </div>

        <div className="grid gap-3">
          <AnimatePresence>
            {coursework.map((item, index) => {
              const itemId = `course-${index}`;
              const isSelected = selectedItems.has(itemId);
              const scoreBadge = getScoreBadge(item.relevance_score);

              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl border ${
                    isSelected ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200'
                  } overflow-hidden hover:shadow-md transition-all`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-4 h-4 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">
                            {item.course}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scoreBadge.bg} ${scoreBadge.text}`}>
                            {scoreBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Target className="w-3 h-3" />
                          <span>Addresses: {item.requirement}</span>
                        </div>
                      </div>
                      
                      {/* Score Indicator */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-12 h-12">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(item.relevance_score / 100) * 126} 126`}
                              className={`${
                                item.relevance_score >= 80 ? 'text-green-500' :
                                item.relevance_score >= 60 ? 'text-blue-500' :
                                item.relevance_score >= 40 ? 'text-yellow-500' :
                                'text-gray-400'
                              }`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {item.relevance_score}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Match</span>
                      </div>
                    </div>

                    {/* Evidence */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">Evidence: </span>
                            {item.evidence}
                          </p>
                        </div>
                        <button
                          onClick={() => copyEvidence(item.evidence, itemId)}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy evidence"
                        >
                          {copiedItem === itemId ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Compatibility Score Display Only */}
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Relevance Match</div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${scoreBadge.bg} ${scoreBadge.text}`}>
                          {item.relevance_score}% Match
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Project Alignment Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Project Alignment
              </h3>
              <p className="text-sm text-gray-600">
                Your projects that demonstrate required skills
              </p>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {projects.length} matching projects
          </span>
        </div>

        <div className="grid gap-3">
          <AnimatePresence>
            {projects.map((item, index) => {
              const itemId = `project-${index}`;
              const isSelected = selectedItems.has(itemId);
              const scoreBadge = getScoreBadge(item.impact_score);

              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-xl border ${
                    isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
                  } overflow-hidden hover:shadow-md transition-all`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">
                            {item.project}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scoreBadge.bg} ${scoreBadge.text}`}>
                            {scoreBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Target className="w-3 h-3" />
                          <span>Addresses: {item.requirement}</span>
                        </div>
                      </div>
                      
                      {/* Impact Score */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-12 h-12">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(item.impact_score / 100) * 126} 126`}
                              className={`${
                                item.impact_score >= 80 ? 'text-green-500' :
                                item.impact_score >= 60 ? 'text-blue-500' :
                                item.impact_score >= 40 ? 'text-yellow-500' :
                                'text-gray-400'
                              }`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {item.impact_score}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Impact</span>
                      </div>
                    </div>

                    {/* Evidence & Metric */}
                    <div className="space-y-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium text-gray-900">Achievement: </span>
                              {item.evidence}
                            </p>
                          </div>
                          <button
                            onClick={() => copyEvidence(item.evidence, itemId)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy achievement"
                          >
                            {copiedItem === itemId ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {item.metric && (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            Metric: {item.metric}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Impact Score Display Only */}
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Impact Level</div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${scoreBadge.bg} ${scoreBadge.text}`}>
                          {item.impact_score}% Impact
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}