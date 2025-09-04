'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Copy, Check, X, RefreshCw, ChevronRight, 
  TrendingUp, Award, Target, Lightbulb, BookOpen, 
  Code, Users, Clock, BarChart3, Zap, Globe2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { StudentBulletSuggestion, StudentProfile } from '@/lib/types/studentProfile';

interface BulletRewriterProps {
  studentProfile?: Partial<StudentProfile>;
  targetRole?: string;
  industry?: string;
  language?: 'EN' | 'DE';
  onApplyBullets?: (bullets: string[]) => void;
  className?: string;
}

const EXAMPLE_BULLETS = [
  'Completed database course project',
  'Participated in software development team',
  'Used Python for data analysis',
  'Worked on web application',
  'Attended machine learning lectures'
];

const BULLET_TYPE_ICONS = {
  coursework: <BookOpen className="w-4 h-4" />,
  project: <Code className="w-4 h-4" />,
  student_job: <Users className="w-4 h-4" />,
  activity: <Award className="w-4 h-4" />
};

const BULLET_TYPE_COLORS = {
  coursework: 'bg-purple-50 text-purple-700 border-purple-200',
  project: 'bg-blue-50 text-blue-700 border-blue-200',
  student_job: 'bg-green-50 text-green-700 border-green-200',
  activity: 'bg-orange-50 text-orange-700 border-orange-200'
};

export default function BulletRewriter({ 
  studentProfile, 
  targetRole, 
  industry, 
  language = 'EN',
  onApplyBullets,
  className 
}: BulletRewriterProps) {
  const [inputBullets, setInputBullets] = useState('');
  const [suggestions, setSuggestions] = useState<StudentBulletSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(true);

  const rewriteBullets = useCallback(async () => {
    const bullets = inputBullets
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);
    
    if (bullets.length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/resume/rewrite-student-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullets,
          context: {
            student_profile: studentProfile,
            target_role: targetRole,
            industry: industry,
            language: language
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setSelectedSuggestions(new Set(Array.from({ length: data.suggestions?.length || 0 }, (_, i) => i)));
      } else {
        console.error('Bullet rewriting failed:', await response.text());
      }
    } catch (error) {
      console.error('Bullet rewriting error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inputBullets, studentProfile, targetRole, industry, language]);

  const copyToClipboard = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const toggleSelection = useCallback((index: number) => {
    const newSelection = new Set(selectedSuggestions);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedSuggestions(newSelection);
  }, [selectedSuggestions]);

  const applySelectedBullets = useCallback(() => {
    const selectedBullets = suggestions
      .filter((_, index) => selectedSuggestions.has(index))
      .map(s => s.proposed);
    
    if (onApplyBullets && selectedBullets.length > 0) {
      onApplyBullets(selectedBullets);
    }
  }, [suggestions, selectedSuggestions, onApplyBullets]);

  const useExampleBullets = useCallback(() => {
    setInputBullets(EXAMPLE_BULLETS.join('\n'));
    setShowExamples(false);
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-100 mb-4"
        >
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">AI Bullet Rewriter</span>
        </motion.div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Transform Your Student Experience
        </h2>
        <p className="text-gray-600 text-sm">
          Turn basic activities into achievement-focused resume bullets with quantifiable metrics
        </p>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="bullets" className="text-base font-medium">
              Original Resume Bullets
            </Label>
            {showExamples && (
              <Button
                variant="ghost"
                size="sm"
                onClick={useExampleBullets}
                className="text-blue-600 hover:text-blue-700"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Try Examples
              </Button>
            )}
          </div>
          
          <Textarea
            id="bullets"
            placeholder={`Enter your resume bullets, one per line:

• Completed coursework in database systems
• Worked on team project for mobile app
• Used Python for data visualization assignment
• Participated in hackathon event`}
            value={inputBullets}
            onChange={(e) => setInputBullets(e.target.value)}
            rows={6}
            className="resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {inputBullets.split('\n').filter(b => b.trim()).length} bullets • Max 20 bullets per request
            </div>
            <Button
              onClick={rewriteBullets}
              disabled={!inputBullets.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Enhance Bullets
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enhanced Bullets</h3>
                  <p className="text-sm text-gray-600">
                    {suggestions.length} professional suggestions with metrics
                  </p>
                </div>
              </div>
              
              {onApplyBullets && selectedSuggestions.size > 0 && (
                <Button
                  onClick={applySelectedBullets}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Selected ({selectedSuggestions.size})
                </Button>
              )}
            </div>

            {/* Suggestions List */}
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border rounded-xl transition-all",
                    selectedSuggestions.has(index)
                      ? "border-green-300 bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="p-5">
                    {/* Header with type and selection */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "gap-1 text-xs font-medium border",
                          BULLET_TYPE_COLORS[suggestion.type as keyof typeof BULLET_TYPE_COLORS] || 
                          "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                          {BULLET_TYPE_ICONS[suggestion.type as keyof typeof BULLET_TYPE_ICONS]}
                          {suggestion.type}
                        </Badge>
                        
                        {suggestion.metric_added && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            {suggestion.metric_added}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {onApplyBullets && (
                          <button
                            onClick={() => toggleSelection(index)}
                            className={cn(
                              "w-5 h-5 border-2 rounded transition-colors",
                              selectedSuggestions.has(index)
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300 hover:border-green-400"
                            )}
                          >
                            {selectedSuggestions.has(index) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(suggestion.proposed, index)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Before/After Comparison */}
                    <div className="space-y-3">
                      {/* Original */}
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <X className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Before</span>
                        </div>
                        <p className="text-sm text-red-800">{suggestion.original}</p>
                      </div>

                      {/* Enhanced */}
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">After</span>
                        </div>
                        <p className="text-sm text-green-800 font-medium">{suggestion.proposed}</p>
                      </div>
                    </div>

                    {/* Keywords and Reasoning */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {suggestion.keywords_used && suggestion.keywords_used.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs font-medium text-gray-600 mb-2 block">Keywords Added:</span>
                          <div className="flex flex-wrap gap-1">
                            {suggestion.keywords_used.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {suggestion.reasoning && (
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600">{suggestion.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips Section */}
      {suggestions.length === 0 && !isLoading && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Tips for Better Results</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Include specific activities: courses, projects, jobs, competitions</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Mention technologies, tools, or methodologies you used</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Add context: team size, duration, scope, grades if excellent</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Focus on results and learning outcomes, not just activities</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}