'use client';

import React, { useState, useEffect } from 'react';
import { 
  Code, Palette, TrendingUp, Users, Globe, 
  Brain, CheckCircle, AlertCircle, Clock, Star
} from 'lucide-react';

interface SkillsAnalysisPanelProps {
  jobSkills: string[];
  userSkills?: string[];
  jobTitle: string;
}

interface SkillCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  skills: {
    name: string;
    match: 'perfect' | 'partial' | 'missing';
    importance: 'critical' | 'high' | 'medium' | 'nice';
  }[];
}

const SKILL_CATEGORIES_CONFIG = {
  technical: {
    name: 'Technical',
    icon: Code,
    color: 'blue',
    keywords: ['javascript', 'react', 'python', 'sql', 'git', 'api', 'database', 'programming', 'development', 'coding', 'software', 'web', 'frontend', 'backend', 'fullstack']
  },
  design: {
    name: 'Design',
    icon: Palette,
    color: 'purple',
    keywords: ['ui', 'ux', 'design', 'figma', 'photoshop', 'illustrator', 'creative', 'visual', 'graphic', 'prototyping', 'wireframes']
  },
  business: {
    name: 'Business',
    icon: TrendingUp,
    color: 'green',
    keywords: ['business', 'strategy', 'marketing', 'sales', 'analytics', 'management', 'planning', 'analysis', 'research', 'market', 'growth', 'revenue']
  },
  communication: {
    name: 'Communication',
    icon: Users,
    color: 'orange',
    keywords: ['communication', 'leadership', 'team', 'management', 'presentation', 'collaboration', 'public speaking', 'writing', 'interpersonal']
  },
  languages: {
    name: 'Languages',
    icon: Globe,
    color: 'cyan',
    keywords: ['german', 'english', 'spanish', 'french', 'chinese', 'language', 'bilingual', 'multilingual', 'international', 'cultural']
  },
  specialized: {
    name: 'Domain',
    icon: Brain,
    color: 'indigo',
    keywords: ['ai', 'machine learning', 'data science', 'blockchain', 'cybersecurity', 'finance', 'healthcare', 'legal', 'scientific', 'research']
  }
};

function categorizeSkills(skills: string[]): SkillCategory[] {
  const categories: { [key: string]: SkillCategory } = {};

  // Initialize categories
  Object.entries(SKILL_CATEGORIES_CONFIG).forEach(([id, config]) => {
    categories[id] = {
      id,
      name: config.name,
      icon: config.icon,
      color: config.color,
      skills: []
    };
  });

  // Categorize skills
  skills.forEach(skill => {
    let bestMatch = 'specialized';
    let maxScore = 0;

    Object.entries(SKILL_CATEGORIES_CONFIG).forEach(([categoryId, config]) => {
      const score = config.keywords.reduce((acc, keyword) => {
        if (skill.toLowerCase().includes(keyword)) {
          return acc + (keyword.length / skill.length);
        }
        return acc;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = categoryId;
      }
    });

    categories[bestMatch].skills.push({
      name: skill,
      match: 'perfect',
      importance: getSkillImportance(skill)
    });
  });

  return Object.values(categories).filter(cat => cat.skills.length > 0);
}

function getSkillImportance(skill: string): 'critical' | 'high' | 'medium' | 'nice' {
  const criticalKeywords = ['javascript', 'react', 'python', 'sql', 'communication', 'leadership'];
  const highKeywords = ['git', 'api', 'database', 'ui', 'ux', 'marketing', 'analysis'];
  
  if (criticalKeywords.some(keyword => skill.toLowerCase().includes(keyword))) {
    return 'critical';
  }
  if (highKeywords.some(keyword => skill.toLowerCase().includes(keyword))) {
    return 'high';
  }
  return 'medium';
}

function SkillBadge({ skill, categoryColor }: { 
  skill: { name: string; importance: 'critical' | 'high' | 'medium' | 'nice' };
  categoryColor: string;
}) {
  // Enhanced color scheme - more vibrant and consistent
  const getSkillColors = (importance: string, baseColor: string) => {
    const colorMap: { [key: string]: { [key: string]: string } } = {
      blue: {
        critical: 'bg-blue-600 text-white border-blue-700',
        high: 'bg-blue-500 text-white border-blue-600',
        medium: 'bg-blue-100 text-blue-700 border-blue-200',
        nice: 'bg-blue-50 text-blue-600 border-blue-100'
      },
      purple: {
        critical: 'bg-purple-600 text-white border-purple-700',
        high: 'bg-purple-500 text-white border-purple-600',
        medium: 'bg-purple-100 text-purple-700 border-purple-200',
        nice: 'bg-purple-50 text-purple-600 border-purple-100'
      },
      green: {
        critical: 'bg-emerald-600 text-white border-emerald-700',
        high: 'bg-emerald-500 text-white border-emerald-600',
        medium: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        nice: 'bg-emerald-50 text-emerald-600 border-emerald-100'
      },
      orange: {
        critical: 'bg-orange-600 text-white border-orange-700',
        high: 'bg-orange-500 text-white border-orange-600',
        medium: 'bg-orange-100 text-orange-700 border-orange-200',
        nice: 'bg-orange-50 text-orange-600 border-orange-100'
      },
      cyan: {
        critical: 'bg-cyan-600 text-white border-cyan-700',
        high: 'bg-cyan-500 text-white border-cyan-600',
        medium: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        nice: 'bg-cyan-50 text-cyan-600 border-cyan-100'
      },
      indigo: {
        critical: 'bg-indigo-600 text-white border-indigo-700',
        high: 'bg-indigo-500 text-white border-indigo-600',
        medium: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        nice: 'bg-indigo-50 text-indigo-600 border-indigo-100'
      }
    };
    
    return colorMap[baseColor]?.[importance] || colorMap.blue[importance];
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSkillColors(skill.importance, categoryColor)} transition-all hover:shadow-sm`}>
      {skill.name}
    </span>
  );
}

export function SkillsAnalysisPanel({ jobSkills, userSkills = [], jobTitle }: SkillsAnalysisPanelProps) {
  const [categories, setCategories] = useState<SkillCategory[]>([]);

  useEffect(() => {
    if (jobSkills && jobSkills.length > 0) {
      const categorized = categorizeSkills(jobSkills);
      setCategories(categorized);
    }
  }, [jobSkills]);

  if (categories.length === 0) {
    return null;
  }

  const totalSkills = categories.reduce((sum, cat) => sum + cat.skills.length, 0);
  const criticalSkills = categories.reduce((sum, cat) => 
    sum + cat.skills.filter(s => s.importance === 'critical').length, 0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Compact Header */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Required Skills</h2>
        <p className="text-xs text-gray-600 mt-1">
          {totalSkills} skills across {categories.length} categories
          {criticalSkills > 0 && <span className="text-red-600 ml-2">• {criticalSkills} critical</span>}
        </p>
      </div>

      {/* Ultra Compact Category Layout */}
      <div className="p-4 space-y-3">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center gap-1.5 mb-2">
              <category.icon className={`w-3.5 h-3.5 text-${category.color}-600`} />
              <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
              <span className="text-xs text-gray-500">({category.skills.length})</span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {category.skills.map((skill, index) => (
                <SkillBadge key={index} skill={skill} categoryColor={category.color} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}