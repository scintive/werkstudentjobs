import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Minus, Sparkles, Target, TrendingUp, CheckCircle,
  XCircle, ArrowRight, Zap, Brain, Shield, Users, Code,
  Briefcase, PenTool, Globe, ChevronDown, ChevronUp, Info,
  AlertTriangle, Check, X, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillSuggestion {
  id: string;
  type: 'skill_add' | 'skill_remove' | 'category_add' | 'category_modify';
  category?: string;
  categoryDisplayName?: string;
  skill?: string;
  suggested?: string;
  original?: string;
  rationale: string;
  confidence: number;
  impact?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'accepted' | 'declined';
}

interface SkillsSuggestionsPanelProps {
  suggestions: SkillSuggestion[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onAcceptAll?: () => void;
  loading?: boolean;
}

const categoryIcons: Record<string, any> = {
  'data_management___analysis': Brain,
  'client_service_support': Users,
  'analytical_tools': Code,
  'presentation': PenTool,
  'research': Target,
  'technical': Code,
  'communication': Users,
  'leadership': Shield,
  'business': Briefcase,
  'languages': Globe
};

const getImpactColor = (impact?: string, confidence?: number) => {
  if (confidence && confidence >= 90) return 'from-green-500 to-emerald-500';
  if (confidence && confidence >= 70) return 'from-blue-500 to-indigo-500';
  if (confidence && confidence >= 50) return 'from-yellow-500 to-orange-500';
  return 'from-gray-400 to-gray-500';
};

const getActionIcon = (type: string) => {
  switch(type) {
    case 'skill_add': return Plus;
    case 'skill_remove': return Minus;
    case 'category_add': return ArrowUpRight;
    case 'category_modify': return ArrowRight;
    default: return Sparkles;
  }
};

export const SkillsSuggestionsPanel: React.FC<SkillsSuggestionsPanelProps> = ({
  suggestions = [],
  onAccept,
  onDecline,
  onAcceptAll,
  loading
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.categoryDisplayName || suggestion.category || 'Other Skills';
    if (!acc[category]) {
      acc[category] = {
        additions: [],
        removals: [],
        modifications: []
      };
    }

    if (suggestion.type === 'skill_add' || suggestion.type === 'category_add') {
      acc[category].additions.push(suggestion);
    } else if (suggestion.type === 'skill_remove') {
      acc[category].removals.push(suggestion);
    } else {
      acc[category].modifications.push(suggestion);
    }

    return acc;
  }, {} as Record<string, { additions: SkillSuggestion[], removals: SkillSuggestion[], modifications: SkillSuggestion[] }>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const pendingSuggestions = suggestions.filter(s => s.status !== 'accepted' && s.status !== 'declined');
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-xl border border-amber-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold">AI Skills Optimization</h3>
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingSuggestions.length} pending
            </span>
          </div>
          {onAcceptAll && pendingSuggestions.length > 0 && (
            <button
              onClick={onAcceptAll}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Accept All
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 bg-white/50">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Optimization Progress</span>
            <span className="text-gray-700 font-medium">
              {acceptedCount}/{suggestions.length} applied
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${(acceptedCount / suggestions.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="p-4 space-y-3">
        {Object.entries(groupedSuggestions).map(([category, items]) => {
          const isExpanded = expandedCategories.has(category);
          const totalItems = items.additions.length + items.removals.length + items.modifications.length;
          const Icon = categoryIcons[category.toLowerCase().replace(/\s+/g, '_')] || Sparkles;

          return (
            <motion.div
              key={category}
              className="bg-white rounded-lg border border-amber-100 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                    <Icon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-800">{category}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {items.additions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Plus className="w-3 h-3 text-green-500" />
                          {items.additions.length} to add
                        </span>
                      )}
                      {items.removals.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Minus className="w-3 h-3 text-red-500" />
                          {items.removals.length} to remove
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-gray-400 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              {/* Category Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-amber-100"
                  >
                    <div className="p-4 space-y-2">
                      {/* Removals - Show these first per user feedback */}
                      {items.removals.map((suggestion) => (
                        <SkillSuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={() => onAccept(suggestion.id)}
                          onDecline={() => onDecline(suggestion.id)}
                          isHovered={hoveredId === suggestion.id}
                          onHover={() => setHoveredId(suggestion.id)}
                          onLeave={() => setHoveredId(null)}
                        />
                      ))}

                      {/* Additions - Show these after removals */}
                      {items.additions.map((suggestion) => (
                        <SkillSuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={() => onAccept(suggestion.id)}
                          onDecline={() => onDecline(suggestion.id)}
                          isHovered={hoveredId === suggestion.id}
                          onHover={() => setHoveredId(suggestion.id)}
                          onLeave={() => setHoveredId(null)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer with AI Context */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-100 to-orange-100 border-t border-amber-200">
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <Brain className="w-4 h-4" />
          <span>AI analyzed job requirements and optimized your skills for maximum ATS compatibility</span>
        </div>
      </div>
    </div>
  );
};

// Individual Skill Suggestion Card
const SkillSuggestionCard: React.FC<{
  suggestion: SkillSuggestion;
  onAccept: () => void;
  onDecline: () => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}> = ({ suggestion, onAccept, onDecline, isHovered, onHover, onLeave }) => {
  const ActionIcon = getActionIcon(suggestion.type);
  const isAddition = suggestion.type === 'skill_add' || suggestion.type === 'category_add';
  const isRemoval = suggestion.type === 'skill_remove';
  const isAccepted = suggestion.status === 'accepted';
  const isDeclined = suggestion.status === 'declined';

  if (isDeclined) return null;

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "relative rounded-lg border transition-all duration-200",
        isAccepted ? "bg-green-50 border-green-200" : "bg-white border-gray-200",
        isHovered && !isAccepted && "shadow-md border-amber-300 bg-amber-50/50"
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn(
                "p-1 rounded-full",
                isAddition && "bg-green-100",
                isRemoval && "bg-red-100"
              )}>
                <ActionIcon className={cn(
                  "w-3 h-3",
                  isAddition && "text-green-600",
                  isRemoval && "text-red-600"
                )} />
              </div>
              <span className={cn(
                "font-medium text-sm",
                isAccepted && "text-green-700",
                !isAccepted && (isAddition ? "text-gray-800" : "text-red-700")
              )}>
                {isAddition ? `Add: ${suggestion.suggested || suggestion.skill}` :
                 isRemoval ? `Remove: ${suggestion.original}` :
                 suggestion.suggested}
              </span>
              {suggestion.confidence >= 85 && (
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {suggestion.confidence}% match
                </span>
              )}
            </div>

            {suggestion.rationale && (
              <p className="text-xs text-gray-600 ml-7">{suggestion.rationale}</p>
            )}
          </div>

          {!isAccepted && (
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDecline}
                className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          )}

          {isAccepted && (
            <div className="p-1.5 bg-green-500 text-white rounded-lg">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Confidence/Impact Indicator */}
      {suggestion.confidence && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-lg overflow-hidden">
          <div
            className={cn("h-full bg-gradient-to-r", getImpactColor(suggestion.impact, suggestion.confidence))}
            style={{ width: `${suggestion.confidence}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default SkillsSuggestionsPanel;