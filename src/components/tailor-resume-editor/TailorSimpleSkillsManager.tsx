'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  X, 
  Target,
  Check,
  AlertCircle,
  Sparkles,
  CheckCircle
} from 'lucide-react'

interface TailorSimpleSkillsManagerProps {
  skills: any // Current skills object
  onSkillsChange: (skills: unknown) => void
  jobData?: any
  strategy?: any // Add strategy for AI recommendations
}

interface SkillSuggestion {
  skill: string
  category: string
  relevance: 'high' | 'medium' | 'low'
  reason: string
}

export function TailorSimpleSkillsManager({ 
  skills = {}, 
  onSkillsChange,
  jobData,
  strategy
}: TailorSimpleSkillsManagerProps) {
  const [suggestions, setSuggestions] = React.useState<SkillSuggestion[]>([])
  const [loading, setLoading] = React.useState(false)
  
  // Generate job-relevant suggestions
  React.useEffect(() => {
    if (jobData && Object.keys(skills).length > 0) {
      generateJobSuggestions()
    }
  }, [jobData, skills])

  const generateJobSuggestions = async () => {
    if (!jobData) return
    
    setLoading(true)
    try {
      const newSuggestions: SkillSuggestion[] = []
      
      // Use strategy skills analysis if available
      if (strategy?.skills_analysis?.skills_to_add) {
        strategy.skills_analysis.skills_to_add.forEach((skill: string) => {
          newSuggestions.push({
            skill,
            category: categorizeSkill(skill),
            relevance: 'high',
            reason: `AI recommends adding for ${jobData.title}`
          })
        })
      } else {
        // Fallback to job requirements analysis
        const jobRequirements = [
          ...(jobData.skills || []),
          ...(jobData.tools || []),
          ...(jobData.responsibilities || [])
        ]

        jobRequirements.slice(0, 8).forEach(requirement => {
          const normalizedReq = requirement.toLowerCase()
          
          // Check if skill is missing from current skills
          const hasSkill = Object.values(skills).flat().some((skill: unknown) => 
            (typeof skill === 'string' ? skill : skill.skill || skill)
              .toLowerCase()
              .includes(normalizedReq.toLowerCase()) ||
            normalizedReq.includes(
              (typeof skill === 'string' ? skill : skill.skill || skill)
                .toLowerCase()
            )
          )
          
          if (!hasSkill) {
            newSuggestions.push({
              skill: requirement,
              category: categorizeSkill(requirement),
              relevance: 'high',
              reason: `Required for ${jobData.title} at ${jobData.company_name}`
            })
          }
        })
      }
      
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const categorizeSkill = (skill: string): string => {
    const techSkills = ['react', 'javascript', 'python', 'node', 'sql', 'aws', 'docker', 'api']
    const designSkills = ['figma', 'photoshop', 'ui', 'ux', 'design', 'prototype']
    const businessSkills = ['project management', 'agile', 'scrum', 'strategy', 'analysis']
    
    const skillLower = skill.toLowerCase()
    
    if (techSkills.some(tech => skillLower.includes(tech))) return 'technical'
    if (designSkills.some(design => skillLower.includes(design))) return 'design'  
    if (businessSkills.some(business => skillLower.includes(business))) return 'business'
    return 'general'
  }

  const addSkill = (suggestion: SkillSuggestion) => {
    const categoryKey = `job_relevant_${suggestion.category}`
    const updatedSkills = { ...skills }
    
    if (!updatedSkills[categoryKey]) {
      updatedSkills[categoryKey] = []
    }
    
    updatedSkills[categoryKey].push(suggestion.skill)
    onSkillsChange(updatedSkills)
    
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => s.skill !== suggestion.skill))
  }

  const removeSkill = (categoryKey: string, skillIndex: number) => {
    const updatedSkills = { ...skills }
    updatedSkills[categoryKey].splice(skillIndex, 1)
    
    // Remove empty categories
    if (updatedSkills[categoryKey].length === 0) {
      delete updatedSkills[categoryKey]
    }
    
    onSkillsChange(updatedSkills)
  }

  const getSkillDisplayName = (skill: unknown): string => {
    return typeof skill === 'string' ? skill : skill.skill || skill.name || String(skill)
  }

  const formatCategoryName = (categoryKey: string): string => {
    return categoryKey
      .replace(/___/g, ' & ')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Current Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Current Skills</h3>
          {jobData && (
            <div className="text-sm text-gray-500">
              Optimizing for: {jobData.title} at {jobData.company_name}
            </div>
          )}
        </div>
        
        {Object.keys(skills).length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No skills found. Upload your resume or add skills manually.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(skills).map(([categoryKey, skillArray]: [string, any]) => (
              <div key={categoryKey} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {formatCategoryName(categoryKey)}
                  </h4>
                  <div className="text-sm text-gray-500">
                    {Array.isArray(skillArray) ? skillArray.length : 0} skills
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(skillArray) && skillArray.map((skill, index) => {
                    const skillName = getSkillDisplayName(skill)
                    const shouldRemove = strategy?.skills_analysis?.skills_to_remove?.some(
                      (s: string) => s.toLowerCase() === skillName.toLowerCase()
                    )
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                          shouldRemove 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <span>{skillName}</span>
                        {shouldRemove && (
                          <span className="text-xs text-red-600 ml-1">(not needed)</span>
                        )}
                        <button
                          onClick={() => removeSkill(categoryKey, index)}
                          className={`ml-1 rounded-full p-0.5 ${
                            shouldRemove ? 'hover:bg-red-200' : 'hover:bg-blue-200'
                          }`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job-Relevant Suggestions */}
      {jobData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recommended for This Job</h3>
            {loading && <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />}
          </div>
          
          {suggestions.length === 0 && !loading ? (
            <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-2" />
              Great! Your skills align well with this job's requirements.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-gray-900">{suggestion.skill}</span>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {suggestion.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{suggestion.reason}</div>
                  </div>
                  
                  <button
                    onClick={() => addSkill(suggestion)}
                    className="ml-3 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}