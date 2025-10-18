'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Sparkles,
  Code2,
  Palette,
  Target,
  Users,
  Globe2,
  Award,
  Wand2,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Zap,
  Brain,
  Star,
  RefreshCw,
  Trash2
} from 'lucide-react'

interface EnhancedSkillsManagerProps {
  skills: any // Current skills object from resume data
  onSkillsChange: (skills: unknown) => void
  userProfile?: any
  languages?: Language[] // Separate language data with proficiency
  onLanguagesChange?: (languages: Language[]) => void
  onShowSkillLevelsChange?: (show: boolean) => void // Callback for skill level toggle
  suggestions?: Record<string, any>[] // Suggestions for tailor mode
  onAcceptSuggestion?: (suggestionId: string) => void
  onDeclineSuggestion?: (suggestionId: string) => void
  mode?: 'base' | 'tailor'
}

interface Language {
  language: string
  proficiency: string
}

interface TechnicalSkillWithProficiency {
  skill: string
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
}

interface OrganizedCategory {
  skills: (string | TechnicalSkillWithProficiency)[]
  suggestions: string[]
  reasoning: string
  allowProficiency?: boolean // Enable proficiency for technical skills
  priority?: number // Priority for consistent ordering with preview (lower = first)
}

interface OrganizedSkillsResponse {
  organized_categories: Record<string, OrganizedCategory>
  profile_assessment: {
    career_focus: string
    skill_level: string
    recommendations: string
  }
  category_mapping: Record<string, string>
  success?: boolean
  source?: string
}

// Subtle category color hints - professional palette
const CATEGORY_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', icon: 'bg-blue-100' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', icon: 'bg-emerald-100' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500', icon: 'bg-purple-100' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500', icon: 'bg-amber-100' },
  { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', accent: 'bg-slate-500', icon: 'bg-slate-100' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-500', icon: 'bg-indigo-100' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', accent: 'bg-teal-500', icon: 'bg-teal-100' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500', icon: 'bg-rose-100' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-500', icon: 'bg-cyan-100' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500', icon: 'bg-violet-100' }
]

// Default icons for categories
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'technical': Code2,
  'programming': Code2,
  'development': Code2,
  'frontend': Palette,
  'backend': Target,
  'design': Palette,
  'business': Users,
  'project': Target,
  'management': Users,
  'marketing': Globe2,
  'communication': Users,
  'leadership': Award,
  'soft': Users,
  'core': Star,
  'tools': Wand2,
  'languages': Globe2,
  'software': Code2,
  'platform': Target
}

function getCategoryIcon(categoryName: string): React.ElementType {
  const lowerName = categoryName.toLowerCase()
  
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerName.includes(key)) {
      return icon
    }
  }
  
  return Sparkles // Default icon
}

// Consistent category priority mapping for preview alignment
function getCategoryPriority(categoryName: string): number {
  const name = categoryName.toLowerCase().trim()

  // Priority mapping based on typical resume importance order
  const priorityMap: Record<string, number> = {
    'core skills': 1,
    'technical skills': 1,
    'programming': 1,
    'software development': 1,
    'data analysis': 2,
    'data visualization': 2,
    'digital marketing': 2,
    'content creation': 3,
    'design': 3,
    'project management': 4,
    'business': 4,
    'communication': 5,
    'leadership': 5,
    'customer service': 6,
    'research': 6,
    'tools': 7,
    'platforms': 7,
    'soft skills': 8,
    'other': 9,
    'languages': 10 // Languages handled separately but included for completeness
  }

  // Find best match based on category name keywords
  for (const [keyword, priority] of Object.entries(priorityMap)) {
    if (name.includes(keyword) || keyword.includes(name)) {
      return priority
    }
  }

  // Default priority for unknown categories
  return 5
}

// Intelligent proficiency categorization function
function shouldCategoryHaveProficiency(categoryName: string): boolean {
  const lowerName = categoryName.toLowerCase()
  
  // EXPLICIT EXCLUSIONS - Categories that should NEVER have proficiency
  const exclusions = [
    'soft', 'communication', 'leadership', 'management', 'interpersonal', 'personal',
    'project', 'business', 'strategy', 'stakeholder', 'change', 'agile', 'scrum',
    'lean', 'kanban', 'waterfall', 'methodology', 'process', 'team', 'collaboration',
    'planning', 'organization', 'coordination', 'negotiation', 'presentation',
    'client', 'customer', 'sales', 'marketing', 'relations', 'networking'
  ]
  
  // Check if category should be excluded
  for (const exclusion of exclusions) {
    if (lowerName.includes(exclusion)) {
      return false
    }
  }
  
  // EXPLICIT INCLUSIONS - Categories that should HAVE proficiency
  const inclusions = [
    'technical', 'programming', 'development', 'coding', 'software', 'framework',
    'database', 'cloud', 'devops', 'automation', 'tool', 'platform', 'system',
    'frontend', 'backend', 'fullstack', 'mobile', 'web', 'api', 'server',
    'language', 'javascript', 'python', 'java', 'react', 'node', 'sql',
    'aws', 'azure', 'docker', 'kubernetes', 'git', 'ci/cd', 'testing',
    'figma', 'photoshop', 'illustrator', 'sketch', 'adobe', 'design software'
  ]
  
  // Check if category should be included
  for (const inclusion of inclusions) {
    if (lowerName.includes(inclusion)) {
      return true
    }
  }
  
  // Special case: Design categories
  if (lowerName.includes('design')) {
    // Only allow proficiency for tool-based design categories
    const designTools = ['ui/ux', 'graphic', 'web design', 'app design', 'interface']
    for (const tool of designTools) {
      if (lowerName.includes(tool)) {
        return true
      }
    }
    return false // General design concepts don't need proficiency
  }
  
  // Default: no proficiency for uncategorized items
  return false
}

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const
const LANGUAGE_PROFICIENCY_LEVELS = ['Elementary', 'Limited working', 'Professional working', 'Full professional', 'Native or bilingual'] as const

// Map old proficiency levels to new ones
function mapLanguageProficiency(oldProficiency: string): string {
  const mapping: Record<string, string> = {
    'A1': 'Elementary',
    'A2': 'Elementary', 
    'B1': 'Limited working',
    'B2': 'Professional working',
    'C1': 'Full professional',
    'C2': 'Full professional',
    'Native': 'Native or bilingual',
    'Fluent': 'Full professional',
    'Advanced': 'Full professional',
    'Intermediate': 'Professional working',
    'Basic': 'Limited working',
    'Beginner': 'Elementary',
    'Elementary': 'Elementary',
    'Limited working': 'Limited working',
    'Professional working': 'Professional working',
    'Full professional': 'Full professional',
    'Native or bilingual': 'Native or bilingual'
  }
  
  return mapping[oldProficiency] || 'Professional working'
}

export function EnhancedSkillsManager({
  skills,
  onSkillsChange,
  userProfile, 
  languages = [], 
  onLanguagesChange, 
  onShowSkillLevelsChange,
  suggestions = [],
  onAcceptSuggestion,
  onDeclineSuggestion,
  mode = 'base'
}: EnhancedSkillsManagerProps) {
  // Helper: normalize incoming language objects to canonical shape
  const normalizeLanguage = React.useCallback((l: Record<string, any>): Language => ({
    language: (l?.language ?? l?.name ?? '').toString(),
    proficiency: (l?.proficiency ?? l?.level ?? 'Not specified').toString()
  }), [])

  // Always work with normalized languages internally
  const normalizedLanguages = React.useMemo<Language[]>(
    () => (languages || []).map(normalizeLanguage),
    [languages, normalizeLanguage]
  )
  // Debug logging
  console.log('🎯 EnhancedSkillsManager props:', { 
    mode, 
    suggestionsCount: suggestions?.length || 0,
    hasSuggestionHandlers: !!onAcceptSuggestion && !!onDeclineSuggestion
  })
  if (suggestions && suggestions.length > 0) {
    console.log('📋 Skill suggestions:', suggestions)
  }
  
  // REMOVED: isOrganizing state - no longer needed since skills come pre-organized
  const [organizedData, setOrganizedData] = React.useState<OrganizedSkillsResponse | null>(null)
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = React.useState<Record<string, boolean>>({})
  const [newSkillInput, setNewSkillInput] = React.useState<Record<string, string>>({})
  const [showAddSkill, setShowAddSkill] = React.useState<Record<string, boolean>>({})
  const [isInternalUpdate, setIsInternalUpdate] = React.useState(false)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [showAddCategory, setShowAddCategory] = React.useState(false)
  const [showAddLanguage, setShowAddLanguage] = React.useState(false)
  const [newLanguage, setNewLanguage] = React.useState({ language: '', proficiency: 'Elementary' })
  const [showSkillLevelsInResume, setShowSkillLevelsInResume] = React.useState(false) // Default: DISABLED
  const [skillProficiencyMode, setSkillProficiencyMode] = React.useState<Record<string, boolean>>({})
  const [openProficiencyDropdowns, setOpenProficiencyDropdowns] = React.useState<Record<string, boolean>>({})
  const [openLanguageDropdowns, setOpenLanguageDropdowns] = React.useState<Record<number, boolean>>({})

  // Normalize languages and standardize proficiency once on load
  React.useEffect(() => {
    if (!onLanguagesChange) return
    if (!normalizedLanguages || normalizedLanguages.length === 0) return
    const standardized = normalizedLanguages.map(l => ({
      language: l.language,
      proficiency: mapLanguageProficiency(l.proficiency)
    }))
    // If incoming array differs from standardized, push standardized up
    const a = JSON.stringify(normalizedLanguages)
    const b = JSON.stringify(standardized)
    if (a !== b) {
      onLanguagesChange(standardized)
    }
  }, [normalizedLanguages.length])

  // SIMPLIFIED: Initialize from legacy skills format directly
  React.useEffect(() => {
    if (!skills || Object.keys(skills).length === 0) return

    // Don't rebuild organized data if the change came from internal operations like category deletion
    if (isInternalUpdate) {
      setIsInternalUpdate(false)
      return
    }

    // Convert legacy skills format to organized format for display
    const organizedCategories: Record<string, OrganizedCategory> = {}

    Object.entries(skills).forEach(([categoryKey, skillsList]) => {
      if (!Array.isArray(skillsList)) return

      // Skip languages - they have their own section
      if (categoryKey.toLowerCase().includes('language')) return

      const displayName = categoryKey
        .replace(/___/g, ' & ')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      organizedCategories[displayName] = {
        skills: skillsList.map(skill => typeof skill === 'string' ? skill : skill),
        suggestions: [],
        reasoning: '',
        allowProficiency: shouldCategoryHaveProficiency(displayName),
        priority: getCategoryPriority(displayName)
      }
    })

    setOrganizedData({
      organized_categories: organizedCategories,
      profile_assessment: {
        career_focus: '',
        skill_level: '',
        recommendations: ''
      },
      category_mapping: {}
    })
    setExpandedCategories(new Set(Object.keys(organizedCategories)))
  }, [skills])

  // Convert legacy skills format to organized format
  const convertSkillsToFlatArray = React.useCallback((skillsData: unknown): string[] => {
    if (!skillsData) return []
    
    const allSkills: string[] = []
    
    if (Array.isArray(skillsData)) {
      allSkills.push(...skillsData)
    } else if (typeof skillsData === 'object') {
      // Handle categorized skills
      Object.values(skillsData).forEach(categorySkills => {
        if (Array.isArray(categorySkills)) {
          allSkills.push(...categorySkills)
        }
      })
    }
    
    return [...new Set(allSkills)] // Remove duplicates
  }, [])

  // REMOVED: handleIntelligentOrganization function
  // All skill organization now happens in /api/profile/extract
  // This eliminates the separate API call that was causing delays

  // Helper function to remove language skills from organized categories
  const filterLanguagesFromCategories = (categories: Record<string, OrganizedCategory>) => {
    const filtered: Record<string, OrganizedCategory> = {}
    
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      // Skip language-related categories
      if (categoryName.toLowerCase().includes('language')) {
        return
      }
      
      // Use intelligent proficiency categorization
      const isTechnical = shouldCategoryHaveProficiency(categoryName)
      
      filtered[categoryName] = {
        ...categoryData,
        allowProficiency: isTechnical
      }
    })
    
    return filtered
  }

  const convertOrganizedToSkillsFormat = (organizedCategories: Record<string, OrganizedCategory>) => {
    const skillsFormat: Record<string, unknown[]> = {}

    // SIMPLIFIED: Direct mapping to legacy format - same logic as preview
    const categoryMapping: Record<string, string> = {
      'core skills': 'core',
      'technical & digital': 'technical',
      'technical skills': 'technical',
      'creative & design': 'creative',
      'business & strategy': 'business',
      'communication & leadership': 'interpersonal',
      'tools & platforms': 'tools',
      'soft skills': 'soft_skills',
      'specialized': 'specialized'
    }

    Object.entries(organizedCategories).forEach(([categoryName, categoryData]) => {
      // Skip languages - they have their own separate section
      if (categoryName.toLowerCase().includes('language')) {
        return
      }

      // Map to legacy category key or use custom key
      const lowerName = categoryName.toLowerCase()
      let categoryKey = categoryMapping[lowerName]

      if (!categoryKey) {
        // For custom categories, use the category name directly
        // This ensures it appears in the preview
        categoryKey = categoryName
        console.log('🆕 Custom category being added to skills:', categoryKey)
      }

      // Simple conversion - keep skills as they are
      skillsFormat[categoryKey] = categoryData.skills.map(skill => {
        if (typeof skill === 'string') return skill
        return (skill as Record<string, any>).skill || skill
      })
    })

    return skillsFormat
  }

  // Canonicalize category keys (align UI display names to slug keys from suggestions)
  const toCanonicalKey = (name: string) => {
    const lower = (name || '').toLowerCase().trim()
    const map: Record<string, string> = {
      'technical skills': 'technical',
      'technical & digital': 'technical',
      'technical': 'technical',
      'soft skills': 'soft_skills',
      'communication & collaboration': 'communication___collaboration',
      'business intelligence & strategy': 'business_intelligence___strategy',
      'domain expertise': 'domain_expertise',
      'data analysis & visualization': 'data_analysis___visualization',
      'project management': 'project_management'
    }
    if (map[lower]) return map[lower]
    return lower
      .replace(/\s*(&|and)\s*/g, '___')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  // Humanize canonical category key for display (e.g., data_analysis___visualization → Data Analysis & Visualization)
  const humanizeCategoryKey = (key: string) => {
    if (!key) return 'New Category'

    // Special mappings for common categories to avoid duplicates/confusion
    const specialMappings: Record<string, string> = {
      'technical': 'Technical Skills',
      'technical_skills': 'Technical Skills',
      'content_creation': 'Content Creation Mastery',
      'collaboration_communication': 'Collaboration & Communication',
      'problem_solving_critical_thinking': 'Problem Solving & Critical Thinking',
      'project_leadership_project_management': 'Project Leadership',
      'location_shooting_expertise': 'Location & Shooting Expertise',
      'audience_engagement_techniques': 'Audience Engagement',
      'performance_optimization': 'Performance Optimization',
      'practical_application': 'Practical Application'
    }

    const lowerKey = key.toLowerCase()
    if (specialMappings[lowerKey]) {
      return specialMappings[lowerKey]
    }

    const withAnd = key.replace(/___/g, ' & ')
    const spaced = withAnd.replace(/_/g, ' ')
    return spaced.replace(/\b\w/g, c => c.toUpperCase())
  }

  const handleAddSkill = (categoryName: string, skill: string, proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') => {
    if (!organizedData) return

    const updatedCategories = { ...organizedData.organized_categories }

    if (!updatedCategories[categoryName]) {
      updatedCategories[categoryName] = { skills: [], suggestions: [], reasoning: '', allowProficiency: false }
    }

    // Check if skill already exists
    const skillExists = updatedCategories[categoryName].skills.some(existingSkill =>
      (typeof existingSkill === 'string' ? existingSkill : existingSkill.skill) === skill
    )

    if (!skillExists) {
      // Add skill with proficiency if category supports it and proficiency is provided
      const shouldUseProficiency = updatedCategories[categoryName].allowProficiency && proficiency
      const skillToAdd = shouldUseProficiency ? { skill, proficiency } : skill

      updatedCategories[categoryName].skills.push(skillToAdd)
      
      // Remove from suggestions
      updatedCategories[categoryName].suggestions = updatedCategories[categoryName].suggestions.filter(s => s !== skill)
      
      // Update organized data
      const newOrganizedData = { ...organizedData, organized_categories: updatedCategories }
      setOrganizedData(newOrganizedData)
      
      // Update skills for resume - DON'T modify base resume in tailor mode!
      if (mode !== 'tailor') {
        const newSkillsFormat = convertOrganizedToSkillsFormat(updatedCategories)
        onSkillsChange(newSkillsFormat)
      } else {
        console.log('🚫 Tailor mode: Preventing base resume skills modification')
      }
    }
  }

  const handleRemoveSkill = (categoryName: string, skill: string) => {
    if (!organizedData) return

    const updatedCategories = { ...organizedData.organized_categories }
    
    if (updatedCategories[categoryName]) {
      updatedCategories[categoryName].skills = updatedCategories[categoryName].skills.filter(s => 
        (typeof s === 'string' ? s : s.skill) !== skill
      )
      
      // Update organized data
      const newOrganizedData = { ...organizedData, organized_categories: updatedCategories }
      setOrganizedData(newOrganizedData)
      
      // Update skills for resume - DON'T modify base resume in tailor mode!
      if (mode !== 'tailor') {
        const newSkillsFormat = convertOrganizedToSkillsFormat(updatedCategories)
        onSkillsChange(newSkillsFormat)
      } else {
        console.log('🚫 Tailor mode: Preventing base resume skills modification')
      }
    }
  }

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const refreshSuggestions = async (categoryName: string) => {
    if (!userProfile) return
    
    setLoadingSuggestions(prev => ({ ...prev, [categoryName]: true }))
    
    try {
      const response = await fetch('/api/skills/category-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryName,
          profileData: userProfile,
          currentCategorySkills: dataToUse?.organized_categories[categoryName]?.skills || []
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (organizedData) {
          const updatedCategories = { ...organizedData.organized_categories }
          if (updatedCategories[categoryName]) {
            updatedCategories[categoryName].suggestions = data.suggestions || []
            setOrganizedData({ ...organizedData, organized_categories: updatedCategories })
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh suggestions:', error)
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [categoryName]: false }))
    }
  }

  const handleAddCustomSkill = (categoryName: string) => {
    const skillName = newSkillInput[categoryName]?.trim()
    if (!skillName || !organizedData) return

    const category = organizedData.organized_categories[categoryName]
    const defaultProficiency = category?.allowProficiency ? 'Intermediate' : undefined
    
    handleAddSkill(categoryName, skillName, defaultProficiency)
    setNewSkillInput(prev => ({ ...prev, [categoryName]: '' }))
    setShowAddSkill(prev => ({ ...prev, [categoryName]: false }))
  }

  // Language management functions
  const handleAddLanguage = () => {
    if (!newLanguage.language.trim() || !onLanguagesChange) return
    
    const updatedLanguages = [...normalizedLanguages, normalizeLanguage(newLanguage)]
    onLanguagesChange(updatedLanguages)
    setNewLanguage({ language: '', proficiency: 'Elementary' })
    setShowAddLanguage(false)
  }

  const handleRemoveLanguage = (index: number) => {
    if (!onLanguagesChange) return
    
    const updatedLanguages = normalizedLanguages.filter((_, i) => i !== index)
    onLanguagesChange(updatedLanguages)
  }

  const handleUpdateLanguageProficiency = (index: number, proficiency: string) => {
    if (!onLanguagesChange) return
    
    console.log(`🔄 Updating language ${normalizedLanguages[index]?.language} proficiency from "${normalizedLanguages[index]?.proficiency}" to "${proficiency}"`)
    
    const updatedLanguages = [...normalizedLanguages]
    updatedLanguages[index] = { ...updatedLanguages[index], proficiency }
    
    console.log('📝 Updated languages:', updatedLanguages)
    onLanguagesChange(updatedLanguages)
  }

  const handleUpdateSkillProficiency = (categoryName: string, skillName: string, proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') => {
    if (!organizedData) return

    const updatedCategories = { ...organizedData.organized_categories }
    const category = updatedCategories[categoryName]

    if (category) {
      category.skills = category.skills.map(skill => {
        if (typeof skill === 'string' && skill === skillName) {
          return { skill: skillName, proficiency }
        } else if (typeof skill === 'object' && skill.skill === skillName) {
          return { ...skill, proficiency }
        }
        return skill
      })
      
      const newOrganizedData = { ...organizedData, organized_categories: updatedCategories }
      setOrganizedData(newOrganizedData)
      
      // Update skills for resume - DON'T modify base resume in tailor mode!
      if (mode !== 'tailor') {
        const newSkillsFormat = convertOrganizedToSkillsFormat(updatedCategories)
        onSkillsChange(newSkillsFormat)
      } else {
        console.log('🚫 Tailor mode: Preventing base resume skills modification')
      }
    }
  }

  const handleDeleteCategory = (categoryName: string) => {
    if (!organizedData || !window.confirm(`Delete "${categoryName}" category and all its skills?`)) return

    const updatedCategories = { ...organizedData.organized_categories }
    delete updatedCategories[categoryName]

    const newOrganizedData = { ...organizedData, organized_categories: updatedCategories }
    setOrganizedData(newOrganizedData)

    // Update skills for resume and mark as internal update to prevent useEffect rebuild
    const newSkillsFormat = convertOrganizedToSkillsFormat(updatedCategories)
    setIsInternalUpdate(true)
    onSkillsChange(newSkillsFormat)
    
    // Remove from expanded categories
    const newExpanded = new Set(expandedCategories)
    newExpanded.delete(categoryName)
    setExpandedCategories(newExpanded)
  }

  const handleAddNewCategory = () => {
    const categoryName = newCategoryName.trim()
    if (!categoryName || !organizedData) return

    // Check if category already exists
    if (organizedData.organized_categories[categoryName]) {
      alert('Category already exists!')
      return
    }

    const updatedCategories = {
      ...organizedData.organized_categories,
      [categoryName]: {
        skills: [],
        suggestions: [],
        reasoning: 'Custom category'
      }
    }

    const newOrganizedData = { ...organizedData, organized_categories: updatedCategories }
    setOrganizedData(newOrganizedData)

    // Update skills for resume
    const newSkillsFormat = convertOrganizedToSkillsFormat(updatedCategories)
    console.log('🆕 New category added:', categoryName)
    console.log('📦 Updated skills format:', newSkillsFormat)
    onSkillsChange(newSkillsFormat)

    // Expand the new category
    setExpandedCategories(prev => new Set([...prev, categoryName]))

    // Reset form
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Profile Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Please upload your resume first to enable intelligent skill organization
        </p>
      </div>
    )
  }

  // Show loading state only if we don't have organized data
  if (!organizedData || !organizedData.organized_categories || Object.keys(organizedData.organized_categories).length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Waiting for Skills
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Skills will appear automatically after profile extraction completes
        </p>
      </div>
    )
  }

  // Use the organized data we built from legacy skills
  const dataToUse = organizedData

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* WORLD-CLASS PROFESSIONAL HEADER */}
      <div className="bg-gradient-to-r from-white to-slate-50/30 border-b border-gray-100/80">
        <div className="p-6 space-y-5">
          {/* Top Row - Title & Add Category */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                <Brain className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-[15px]">
                  Skills Intelligence
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  AI-powered skill organization with proficiency tracking
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 rounded-lg text-sm font-medium transition-all duration-200"
              title="Add new skill category"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {/* DISABLED: Proficiency Toggle - Skills system needs fixing first */}
          {false && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-gray-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Show skill proficiency levels
                </span>
              </div>
            </div>

            {/* Simple Toggle Switch */}
            <button
              onClick={() => {
                const newValue = !showSkillLevelsInResume
                setShowSkillLevelsInResume(newValue)
                onShowSkillLevelsChange?.(newValue)

                // Update organized data to reflect proficiency toggle
                if (organizedData) {
                  const updatedCategories: Record<string, OrganizedCategory> = {}

                  Object.entries(organizedData.organized_categories).forEach(([categoryName, categoryData]) => {
                    const isTechnical = shouldCategoryHaveProficiency(categoryName)
                    const shouldHaveProficiency = newValue && isTechnical

                    // Convert skills based on the new proficiency setting
                    const updatedSkills = categoryData.skills.map(skill => {
                      if (typeof skill === 'string') {
                        // Converting string to object (turning proficiency ON)
                        return shouldHaveProficiency ? {
                          skill: skill,
                          proficiency: 'Intermediate' as const // Default proficiency
                        } : skill
                      } else {
                        // Converting object to string (turning proficiency OFF) or keeping object
                        return shouldHaveProficiency ? skill : skill.skill
                      }
                    })

                    updatedCategories[categoryName] = {
                      ...categoryData,
                      skills: updatedSkills,
                      allowProficiency: shouldHaveProficiency
                    }
                  })

                  // Update organized data with preserved skills
                  const newOrganizedData = { ...organizedData, organized_categories: updatedCategories }
                  setOrganizedData(newOrganizedData)

                  // Convert to skills format for the resume - DON'T modify base resume in tailor mode!
                  if (mode !== 'tailor') {
                    const newSkillsFormat = convertOrganizedToSkillsFormat(updatedCategories)
                    onSkillsChange(newSkillsFormat)
                  } else {
                    console.log('🚫 Tailor mode: Preventing base resume skills modification')
                  }
                }
              }}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border-2 transition-all duration-200 ${
                showSkillLevelsInResume
                  ? 'bg-green-500 border-green-500'
                  : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full transition-all duration-200 shadow-md ${
                  showSkillLevelsInResume
                    ? 'translate-x-6 bg-white'
                    : 'translate-x-1 bg-white'
                }`}
              />
              <span className="sr-only">Toggle skill proficiency display</span>
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">

      {/* Tailor Mode Suggestions - Simple & Intuitive UI */}
      {mode === 'tailor' && suggestions && suggestions.length > 0 && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">AI Skills Optimization</h3>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              {suggestions.filter(s => s.section === 'skills' && s.status === 'pending').length} pending
            </span>
          </div>
          <div className="space-y-2">
            {suggestions
              .filter(s => s.section === 'skills' && (s.type === 'skill_add' || s.type === 'skill_addition' || s.type === 'skill_remove' || s.type === 'skill_removal'))
              .filter(s => s.status === 'pending')
              .map(suggestion => (
                <div key={suggestion.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                  <div className="flex-1">
                    { (suggestion.type === 'skill_add' || suggestion.type === 'skill_addition') ? (
                      <span className="text-sm font-medium text-green-700">✓ Add: {suggestion.suggested}</span>
                    ) : (
                      <span className="text-sm font-medium text-red-700">✗ Remove: {suggestion.original}</span>
                    )}
                    {suggestion.rationale && (
                      <p className="text-xs text-gray-600 mt-1">{suggestion.rationale}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (onAcceptSuggestion) {
                          onAcceptSuggestion(suggestion.id)
                        }
                      }}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        if (onDeclineSuggestion) {
                          onDeclineSuggestion(suggestion.id)
                        }
                      }}
                      className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm font-medium transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Category</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e: any) => setNewCategoryName(e.target.value)}
              placeholder="Category name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e: any) => e.key === 'Enter' && handleAddNewCategory()}
            />
            <button
              onClick={handleAddNewCategory}
              disabled={!newCategoryName.trim()}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddCategory(false)
                setNewCategoryName('')
              }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories - clean and minimal */}
      {dataToUse && dataToUse.organized_categories && (
        <div className="space-y-3">
          {/* Sort categories by priority to match preview order */}
          {Object.entries(dataToUse.organized_categories)
            .sort(([categoryNameA, categoryDataA], [categoryNameB, categoryDataB]) => {
              // Use priority-based sorting to match preview order
              const priorityA = categoryDataA.priority || 999
              const priorityB = categoryDataB.priority || 999

              // Lower priority numbers appear first (same as preview)
              if (priorityA !== priorityB) {
                return priorityA - priorityB
              }

              // If priorities are equal, sort alphabetically
              return categoryNameA.localeCompare(categoryNameB)
            })
            .map(([categoryName, categoryDataRaw], index) => {
            const categoryData: OrganizedCategory = {
              skills: Array.isArray((categoryDataRaw as Record<string, any>)?.skills) ? (categoryDataRaw as Record<string, any>).skills : [],
              suggestions: Array.isArray((categoryDataRaw as Record<string, any>)?.suggestions) ? (categoryDataRaw as Record<string, any>).suggestions : [],
              reasoning: typeof (categoryDataRaw as Record<string, any>)?.reasoning === 'string' ? (categoryDataRaw as Record<string, any>).reasoning : '',
              allowProficiency: !!(categoryDataRaw as Record<string, any>)?.allowProficiency
            }
            const isExpanded = expandedCategories.has(categoryName)
            const CategoryIcon = getCategoryIcon(categoryName)
            const colorScheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
            
            return (
              <motion.div
                key={categoryName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border ${colorScheme.border} rounded-xl overflow-hidden hover:shadow-sm transition-all duration-200`}
              >
                {/* Category Header - subtle colors */}
                <div
                  className={`${colorScheme.bg} hover:opacity-80 px-4 py-3.5 cursor-pointer transition-all duration-150`}
                  onClick={() => toggleCategory(categoryName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${colorScheme.icon} rounded-lg`}>
                        <CategoryIcon className={`h-4 w-4 ${colorScheme.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-gray-900">{categoryName}</h3>
                          <button
                            onClick={(e: any) => {
                              e.stopPropagation()
                              handleDeleteCategory(categoryName)
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{categoryData.reasoning}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${colorScheme.text} ${colorScheme.icon} px-2.5 py-1 rounded-lg`}>
                        {categoryData.skills.length}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-white"
                    >
                      <div className="px-4 py-4 space-y-4">
                        {/* Current Skills */}
                        <div className="space-y-3">
                          {categoryData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {categoryData.skills.map((skill, skillIndex) => {
                                const isSkillObject = typeof skill === 'object'
                                const skillName = isSkillObject ? skill.skill : skill
                                const skillProficiency = isSkillObject ? skill.proficiency : null
                                const showProficiency = shouldCategoryHaveProficiency(categoryName) && showSkillLevelsInResume
                                
                                const lowerCategoryName = categoryName.toLowerCase()
                                
                                return (
                                  <motion.div
                                    key={`${skillName}-${skillIndex}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 ${colorScheme.bg} border-2 ${colorScheme.border} rounded-xl text-sm font-semibold ${colorScheme.text} hover:shadow-md transition-all`}
                                  >
                                    <span className="font-medium">{skillName}</span>
                                    {showProficiency && showSkillLevelsInResume && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-px h-4 bg-current opacity-20"></div>
                                        <div className="relative">
                                          <button
                                            onClick={(e: any) => {
                                              e.stopPropagation()
                                              const dropdownKey = `${categoryName}-${skillName}`
                                              setOpenProficiencyDropdowns(prev => ({
                                                ...prev,
                                                [dropdownKey]: !prev[dropdownKey]
                                              }))
                                            }}
                                            className="group relative flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          >
                                            <div className={`w-2 h-2 rounded-full ${
                                              skillProficiency === 'Expert' ? 'bg-emerald-500' :
                                              skillProficiency === 'Advanced' ? 'bg-blue-500' :
                                              skillProficiency === 'Intermediate' ? 'bg-amber-500' :
                                              'bg-gray-400'
                                            }`} />
                                            <span className="font-semibold">
                                              {skillProficiency || 'Intermediate'}
                                            </span>
                                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                          </button>
                                          
                                          {openProficiencyDropdowns[`${categoryName}-${skillName}`] && (
                                            <motion.div
                                              initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                              animate={{ opacity: 1, y: 0, scale: 1 }}
                                              exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                              className="absolute top-full left-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 backdrop-blur-sm"
                                            >
                                              <div className="p-2">
                                                {PROFICIENCY_LEVELS.map((level, idx) => {
                                                  const isSelected = (skillProficiency || 'Intermediate') === level
                                                  const levelColor = 
                                                    level === 'Expert' ? 'emerald' :
                                                    level === 'Advanced' ? 'blue' :
                                                    level === 'Intermediate' ? 'amber' : 'gray'
                                                  
                                                  return (
                                                    <button
                                                      key={level}
                                                      onClick={(e: any) => {
                                                        e.stopPropagation()
                                                        handleUpdateSkillProficiency(categoryName, skillName, level)
                                                        setOpenProficiencyDropdowns(prev => ({
                                                          ...prev,
                                                          [`${categoryName}-${skillName}`]: false
                                                        }))
                                                      }}
                                                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl text-xs font-medium transition-all duration-200 ${
                                                        isSelected
                                                          ? `bg-${levelColor}-50 text-${levelColor}-700 border border-${levelColor}-200 shadow-sm`
                                                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                                      }`}
                                                    >
                                                      <div className={`w-2.5 h-2.5 rounded-full ${
                                                        level === 'Expert' ? 'bg-emerald-500' :
                                                        level === 'Advanced' ? 'bg-blue-500' :
                                                        level === 'Intermediate' ? 'bg-amber-500' :
                                                        'bg-gray-400'
                                                      }`} />
                                                      <span className="flex-1 font-semibold">{level}</span>
                                                      {isSelected && (
                                                        <Check className="h-4 w-4 text-current" />
                                                      )}
                                                    </button>
                                                  )
                                                })}
                                              </div>
                                            </motion.div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => handleRemoveSkill(categoryName, skillName)}
                                      className="text-current opacity-60 hover:opacity-100 hover:bg-white/50 rounded-full p-0.5 transition-all"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </motion.div>
                                )
                              })}
                            </div>
                          )}

                          {/* Add Custom Skill */}
                          <div className="flex items-center gap-2">
                            {showAddSkill[categoryName] ? (
                              <>
                                <input
                                  type="text"
                                  value={newSkillInput[categoryName] || ''}
                                  onChange={(e: any) => setNewSkillInput(prev => ({ ...prev, [categoryName]: e.target.value }))}
                                  placeholder="Add skill..."
                                  className={`flex-1 px-3 py-1.5 border ${colorScheme.border} rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-current focus:border-transparent`}
                                  onKeyPress={(e: any) => e.key === 'Enter' && handleAddCustomSkill(categoryName)}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleAddCustomSkill(categoryName)}
                                  disabled={!newSkillInput[categoryName]?.trim()}
                                  className={`px-2 py-1.5 ${colorScheme.accent} hover:opacity-80 disabled:opacity-30 text-white rounded-lg text-xs font-medium transition-all`}
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAddSkill(prev => ({ ...prev, [categoryName]: false }))
                                    setNewSkillInput(prev => ({ ...prev, [categoryName]: '' }))
                                  }}
                                  className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setShowAddSkill(prev => ({ ...prev, [categoryName]: true }))}
                                  className={`flex items-center gap-2 px-4 py-2 ${colorScheme.bg} border ${colorScheme.border} ${colorScheme.text} rounded-lg text-xs font-medium hover:opacity-80 hover:shadow-sm transition-all`}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Skill
                                </button>
                                {categoryData.allowProficiency && (
                                  <span className="text-xs text-gray-400 italic">with proficiency</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Suggestions */}
                        {categoryData.suggestions.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 font-medium">Suggestions</span>
                              <button
                                onClick={() => refreshSuggestions(categoryName)}
                                disabled={loadingSuggestions[categoryName]}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors"
                                title="Get fresh AI suggestions for this category"
                              >
                                <RefreshCw className={`h-3 w-3 ${loadingSuggestions[categoryName] ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {categoryData.suggestions.map((skill: any) => (
                                <motion.button
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleAddSkill(categoryName, skill)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border ${colorScheme.border} ${colorScheme.text} rounded-full text-xs font-medium hover:${colorScheme.bg} hover:shadow-sm transition-all`}
                                >
                                  <Plus className="h-3 w-3" />
                                  {skill}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Languages section removed - now handled by separate LanguagesCard component */}

      {/* REMOVED: Loading state - skills now come pre-organized from profile extraction */}
      </div>
    </div>
  )
}
