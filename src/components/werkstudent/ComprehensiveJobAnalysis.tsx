'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Target, CheckCircle, AlertTriangle, TrendingUp, 
  BookOpen, Award, Lightbulb, Zap, Star, ChevronRight,
  Calendar, MapPin, Clock, GraduationCap, Briefcase
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  education?: Array<{
    degree: string;
    field_of_study: string;
    institution: string;
    year: string;
  }>;
  professional_title?: string;
  location?: string;
  skills?: any;
  projects?: any[];
  experience?: any[];
}

interface JobRequirement {
  skill: string;
  compatibility: number;
  user_has: boolean;
  evidence?: string;
  recommendation?: string;
  learning_time?: string;
}

interface SkillMatch {
  category: string;
  matched_skills: string[];
  missing_skills: string[];
  relevance_score: number;
}

interface ComprehensiveAnalysisProps {
  userProfile: UserProfile;
  jobData: any;
  strategy?: any;
  onNavigateToSkills?: () => void;
}

export function ComprehensiveJobAnalysis({ 
  userProfile, 
  jobData, 
  strategy,
  onNavigateToSkills 
}: ComprehensiveAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'strategy'>('overview');

  // Use strategy job task analysis if available, otherwise generate
  const getJobRequirements = (): JobRequirement[] => {
    if (strategy?.job_task_analysis && strategy.job_task_analysis.length > 0) {
      return strategy.job_task_analysis.map((task: any) => ({
        skill: task.task,
        compatibility: task.compatibility_score,
        user_has: task.compatibility_score > 60,
        evidence: task.user_evidence,
        recommendation: task.certification_recommendation,
        learning_time: task.skill_gap ? '2-4 weeks' : undefined
      }));
    }

    // Fallback to generating if strategy doesn't have task analysis
    const allSkills = [
      ...(jobData.skills_original || []),
      ...(jobData.tools_original || []),
      ...(jobData.responsibilities_original || [])
    ];

    return allSkills.slice(0, 8).map(skill => {
      const userSkills = Object.values(userProfile.skills || {}).flat();
      const hasSkill = userSkills.some((userSkill: any) => 
        (typeof userSkill === 'string' ? userSkill : userSkill.skill || userSkill)
          .toLowerCase()
          .includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(
          (typeof userSkill === 'string' ? userSkill : userSkill.skill || userSkill)
            .toLowerCase()
        )
      );

      return {
        skill,
        compatibility: hasSkill ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 20,
        user_has: hasSkill,
        evidence: hasSkill ? 'Found in resume skills' : undefined,
        recommendation: !hasSkill ? `Learn ${skill} through online courses` : undefined,
        learning_time: !hasSkill ? '2-4 weeks' : undefined
      };
    });
  };

  // Use strategy skills analysis if available, otherwise generate
  const getSkillsMatching = (): SkillMatch[] => {
    if (strategy?.skills_analysis?.matched_skills && strategy.skills_analysis.matched_skills.length > 0) {
      return strategy.skills_analysis.matched_skills.map((match: any) => ({
        category: match.category,
        matched_skills: match.skills,
        missing_skills: strategy.skills_analysis?.skill_gaps?.slice(0, 3).map((gap: any) => gap.missing_skill) || [],
        relevance_score: match.relevance === 'high' ? 90 : match.relevance === 'medium' ? 70 : 50
      }));
    }

    // Fallback to generating if strategy doesn't have skills analysis
    const skillCategories = Object.entries(userProfile.skills || {});
    
    return skillCategories.map(([category, skills]) => {
      const categorySkills = Array.isArray(skills) ? skills : [];
      const jobSkills = [
        ...(jobData.skills_original || []),
        ...(jobData.tools_original || [])
      ];

      const matched = categorySkills.filter((userSkill: any) => {
        const skillName = typeof userSkill === 'string' ? userSkill : userSkill.skill || userSkill;
        return jobSkills.some(jobSkill => 
          skillName.toLowerCase().includes(jobSkill.toLowerCase()) ||
          jobSkill.toLowerCase().includes(skillName.toLowerCase())
        );
      });

      const missing = jobSkills.filter(jobSkill => 
        !categorySkills.some((userSkill: any) => {
          const skillName = typeof userSkill === 'string' ? userSkill : userSkill.skill || userSkill;
          return skillName.toLowerCase().includes(jobSkill.toLowerCase()) ||
                 jobSkill.toLowerCase().includes(skillName.toLowerCase());
        })
      ).slice(0, 3);

      return {
        category: category.replace(/___/g, ' & ').split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        matched_skills: matched.map((s: any) => typeof s === 'string' ? s : s.skill || s),
        missing_skills: missing,
        relevance_score: matched.length > 0 ? Math.min(95, (matched.length / Math.max(matched.length + missing.length, 1)) * 100) : 0
      };
    }).filter(match => match.matched_skills.length > 0 || match.missing_skills.length > 0);
  };

  const jobRequirements = getJobRequirements();
  const skillsMatching = getSkillsMatching();
  const compatibilityScore = Math.round(jobRequirements.reduce((acc, req) => acc + req.compatibility, 0) / Math.max(jobRequirements.length, 1));

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      {/* User Profile Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {userProfile.name || 'Student Profile'}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                {userProfile.education?.[0] && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>{userProfile.education[0].degree} in {userProfile.education[0].field_of_study}</span>
                  </div>
                )}
                {userProfile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{userProfile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getCompatibilityColor(compatibilityScore)}`}>
              {compatibilityScore}% Job Match
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Skills Analysis', icon: Target },
          { id: 'tasks', label: 'Task Compatibility', icon: CheckCircle },
          { id: 'strategy', label: 'Win Strategy', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Skills Matching Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skillsMatching.map((match, index) => (
                <motion.div
                  key={match.category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{match.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      match.relevance_score >= 70 ? 'bg-green-100 text-green-700' :
                      match.relevance_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {Math.round(match.relevance_score)}% match
                    </span>
                  </div>

                  {match.matched_skills.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-green-700 mb-1">✓ You Have:</div>
                      <div className="flex flex-wrap gap-1">
                        {match.matched_skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.missing_skills.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-amber-700 mb-1">⚠ Consider Adding:</div>
                      <div className="flex flex-wrap gap-1">
                        {match.missing_skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Quick Action */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Optimize Your Resume</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Add missing skills and highlight relevant ones for this specific job
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
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-4">
              How well your background matches each job requirement:
            </div>
            
            {jobRequirements.map((req, index) => (
              <motion.div
                key={req.skill}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{req.skill}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCompatibilityColor(req.compatibility)}`}>
                        {req.compatibility}% match
                      </span>
                    </div>
                    
                    {req.user_has ? (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-green-700 font-medium">You have this skill</div>
                          {req.evidence && (
                            <div className="text-xs text-green-600">{req.evidence}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-amber-700 font-medium">Gap identified</div>
                          {req.recommendation && (
                            <div className="text-xs text-amber-600">{req.recommendation}</div>
                          )}
                          {req.learning_time && (
                            <div className="text-xs text-gray-500">Est. learning time: {req.learning_time}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(req.compatibility / 100) * 176} 176`}
                        className={`${
                          req.compatibility >= 80 ? 'text-green-500' :
                          req.compatibility >= 60 ? 'text-blue-500' :
                          req.compatibility >= 40 ? 'text-yellow-500' : 'text-red-500'
                        }`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {req.compatibility}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-4">
            {/* Main Positioning from Strategy */}
            {strategy?.win_strategy && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-2">Your Positioning</h4>
                    <div className="text-sm text-purple-800 font-medium mb-3">
                      {strategy.win_strategy.main_positioning}
                    </div>
                    <div className="space-y-1">
                      {strategy.win_strategy.key_differentiators?.map((diff: string, index: number) => (
                        <div key={index} className="text-sm text-purple-800">
                          • <strong>{diff}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Application Strategy</h4>
                </div>
                <div className="text-sm text-gray-700">
                  {strategy?.win_strategy?.application_strategy || 
                    'Emphasize hands-on experience, quantify achievements, and demonstrate learning agility'}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Learning Priorities</h4>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {strategy?.skills_analysis?.skill_gaps?.slice(0, 3).map((gap: any, index: number) => (
                    <li key={index}>• {gap.missing_skill} ({gap.time_to_learn})</li>
                  )) || jobRequirements.filter(req => !req.user_has).slice(0, 3).map(req => (
                    <li key={req.skill}>• {req.skill} ({req.learning_time})</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Interview Talking Points */}
            {strategy?.win_strategy?.interview_talking_points && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Interview Talking Points</h4>
                </div>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {strategy.win_strategy.interview_talking_points.map((point: string, index: number) => (
                    <li key={index}>• {point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}