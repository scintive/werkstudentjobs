'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
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
  Trash2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  PenTool,
  Edit
} from 'lucide-react'

interface TailorEnhancedSkillsManagerProps {
  skills: any // Current skills object
  onSkillsChange: (skills: any) => void
  userProfile?: any
  organizedSkills?: any // Pre-organized skills from profile extraction
  languages?: Language[] // Separate language data with proficiency
  onLanguagesChange?: (languages: Language[]) => void
  onShowSkillLevelsChange?: (show: boolean) => void // Callback for skill level toggle
  // AI Enhancement props for tailor
  jobData?: any
  strategy?: any
  aiMode?: boolean
  onAIOptimize?: () => void
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
  aiOptimized?: boolean
  jobRelevance?: 'high' | 'medium' | 'low'
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

// Enhanced category colors with AI optimization indicators
const CATEGORY_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', accent: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', accent: 'bg-purple-500' },
  { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', accent: 'bg-amber-500' },
  { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600', accent: 'bg-slate-500' },
  { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', accent: 'bg-indigo-500' },
  { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600', accent: 'bg-teal-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600', accent: 'bg-cyan-500' },
  { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600', accent: 'bg-violet-500' }
]

// Enhanced icons for categories with AI indicators
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

// Job relevance indicators
const getRelevanceColor = (relevance: string) => {
  switch (relevance) {
    case 'high':
      return 'from-green-400 to-emerald-400'
    case 'medium':
      return 'from-yellow-400 to-amber-400'
    case 'low':
      return 'from-gray-400 to-slate-400'
    default:
      return 'from-blue-400 to-purple-400'
  }
}

export function TailorEnhancedSkillsManager({
  skills = {},
  onSkillsChange,
  userProfile,
  organizedSkills,
  languages = [],
  onLanguagesChange,
  onShowSkillLevelsChange,
  jobData,
  strategy,
  aiMode = false,
  onAIOptimize
}: TailorEnhancedSkillsManagerProps) {
  const [organizedData, setOrganizedData] = React.useState<OrganizedSkillsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({})
  const [showSkillLevels, setShowSkillLevels] = React.useState(false)
  const [categoryBeingAdded, setCategoryBeingAdded] = React.useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = React.useState('')
  const [newSkillInputs, setNewSkillInputs] = React.useState<Record<string, string>>({})
  const [aiSuggestions, setAISuggestions] = React.useState<Record<string, string[]>>({})
  const [jobOptimizedSkills, setJobOptimizedSkills] = React.useState<string[]>([])

  // Flag to prevent automatic reorganization during individual suggestion processing
  const [skipAutoReorganization, setSkipAutoReorganization] = React.useState(false)
  // Flag to prevent re-initialization after category deletion
  const [skipReinitialization, setSkipReinitialization] = React.useState(false)

  // State for success feedback and category editing
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  const [skillsAccepted, setSkillsAccepted] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = React.useState('')
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{ categoryKey: string; displayName: string } | null>(null)

  // Helper function to check if organized skills have already been synced with current skills
  const checkIfSkillsAlreadySynced = (organizedCategories: Record<string, OrganizedCategory>, currentSkills: any): boolean => {
    // Convert organized categories to the same format as skills object
    const organizedSkillsMap: Record<string, string[]> = {}
    Object.entries(organizedCategories).forEach(([categoryKey, category]) => {
      const displayName = categoryKey
        .replace(/___/g, ' & ')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      organizedSkillsMap[displayName] = category.skills.map(skill =>
        typeof skill === 'string' ? skill : skill.skill
      )
    })

    // Compare with current skills
    const organizedCategoryNames = Object.keys(organizedSkillsMap).sort()
    const currentCategories = Object.keys(currentSkills).filter(key => key !== 'languages').sort()

    // If different number of categories, not synced
    if (organizedCategoryNames.length !== currentCategories.length) {
      return false
    }

    // Check if all categories and skills match
    for (const category of organizedCategoryNames) {
      const organizedSkills = organizedSkillsMap[category] || []
      const currentCategorySkills = currentSkills[category] || []

      // Compare skill arrays
      if (organizedSkills.length !== currentCategorySkills.length) {
        return false
      }

      // Check if all skills exist (order doesn't matter)
      const organizedSet = new Set(organizedSkills.map(s => s.toLowerCase()))
      const currentSet = new Set(currentCategorySkills.map((s: any) =>
        typeof s === 'string' ? s.toLowerCase() : s.skill?.toLowerCase() || ''
      ))

      if (organizedSet.size !== currentSet.size) {
        return false
      }

      for (const skill of organizedSet) {
        if (!currentSet.has(skill)) {
          return false
        }
      }
    }

    return true
  }

  // Enhanced initialization with AI analysis
  React.useEffect(() => {
    const initializeSkills = async () => {
      // Don't re-initialize after category deletion
      if (skipReinitialization) {
        console.log('🚫 Skipping re-initialization after category deletion')
        return
      }

      // CRITICAL: Only initialize from organizedSkills prop if we don't have organizedData yet
      // This prevents overwriting local changes (like deletions) with stale prop data
      if (organizedSkills?.organized_categories && !organizedData) {
        console.log('🎨 Initializing skills from organizedSkills prop (first load)')
        // Analyze job relevance if job data available
        let enhancedData = organizedSkills

        if (jobData && strategy && aiMode) {
          enhancedData = await analyzeJobRelevance(organizedSkills)
        }

        setOrganizedData(enhancedData)

        // Check if skills have already been accepted by comparing organized data with current skills
        const skillsAlreadyAccepted = checkIfSkillsAlreadySynced(enhancedData.organized_categories, skills)
        if (skillsAlreadyAccepted) {
          setSkillsAccepted(true)
        }

        // Auto-expand high relevance categories
        const autoExpanded: Record<string, boolean> = {}
        Object.entries(enhancedData.organized_categories).forEach(([key, category]) => {
          autoExpanded[key] = category.jobRelevance === 'high' || true // Default to expanded
        })
        // Always include languages in expanded categories
        autoExpanded['languages'] = true
        setExpandedCategories(autoExpanded)

        // Auto-generate suggestions for relevant categories when in AI mode
        if (jobData && aiMode) {
          const categoriesToSuggest = Object.keys(enhancedData.organized_categories)
            .filter(key => !key.toLowerCase().includes('language'))
            .slice(0, 3)

          categoriesToSuggest.forEach((categoryKey, index) => {
            setTimeout(() => generateAISuggestions(categoryKey), 1000 * (index + 1))
          })
        }
      } else if (Object.keys(skills).length > 0 && !skipAutoReorganization && !organizedData) {
        console.log('🧠 Auto-reorganization triggered (skills changed, no organized data, not skipping)')
        await organizeExistingSkills()
      } else if (skipAutoReorganization) {
        console.log('🚫 Skipping auto-reorganization due to individual suggestion processing')
      }
    }

    initializeSkills()
  }, [skills, organizedSkills, jobData, strategy, aiMode, skipAutoReorganization, skipReinitialization])

  const analyzeJobRelevance = async (skillsData: OrganizedSkillsResponse) => {
    if (!jobData || !strategy) return skillsData

    try {
      // Clear previous job-optimized skills to prevent accumulation
      setJobOptimizedSkills([])
      const jobKeywords = [
        ...(strategy.ats_keywords || []),
        ...(strategy.must_have_gaps || []).map((gap: any) => gap.skill),
        ...(jobData.skills_original || []),
        ...(jobData.responsibilities_original || [])
      ]
      
      const enhancedCategories: Record<string, OrganizedCategory> = {}

      Object.entries(skillsData.organized_categories).forEach(([categoryKey, category]) => {
        // Skip language categories - they should never be analyzed as skills
        if (categoryKey.toLowerCase().includes('language')) {
          enhancedCategories[categoryKey] = category
          return
        }

        const categorySkills = category.skills.map(skill =>
          typeof skill === 'string' ? skill : skill.skill
        )

        // Calculate relevance based on job keywords
        const relevantSkills = categorySkills.filter(skill =>
          jobKeywords.some(keyword =>
            skill.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(skill.toLowerCase())
          )
        )

        const relevanceRatio = relevantSkills.length / categorySkills.length
        let jobRelevance: 'high' | 'medium' | 'low' = 'low'

        if (relevanceRatio > 0.6) jobRelevance = 'high'
        else if (relevanceRatio > 0.3) jobRelevance = 'medium'

        enhancedCategories[categoryKey] = {
          ...category,
          jobRelevance,
          aiOptimized: true
        }

        // Track job-optimized skills (excluding language-related skills)
        if (jobRelevance === 'high') {
          setJobOptimizedSkills(prev => {
            const combined = [...prev, ...relevantSkills]
            // Remove duplicates using Set
            return Array.from(new Set(combined))
          })
        }
      })
      
      return {
        ...skillsData,
        organized_categories: enhancedCategories
      }
    } catch (error) {
      console.error('Job relevance analysis failed:', error)
      return skillsData
    }
  }

  const organizeExistingSkills = async () => {
    console.log('🧠 TailorSkills: Organizing skills with GPT intelligence...')
    setIsLoading(true)
    
    try {
      // Get user profile data for intelligent organization
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) {
        console.warn('🔒 TailorSkills: Skipping /api/profile/latest — no auth token')
      }
      const profileResponse = await fetch('/api/profile/latest', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      
      let profileData = null
      if (profileResponse.ok) {
        const result = await profileResponse.json()
        profileData = result.profile || result.resumeData
      }
      
      // Call the sophisticated skills organization API
      const response = await fetch('/api/skills/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: profileData,
          currentSkills: skills
        })
      })
      
      if (response.ok) {
        const organizedResponse: OrganizedSkillsResponse = await response.json()
        console.log('🧠 TailorSkills: GPT organization successful:', organizedResponse.profile_assessment?.career_focus)
        
        // Analyze job relevance if available
        let enhancedResponse = organizedResponse
        if (jobData && strategy && aiMode) {
          enhancedResponse = await analyzeJobRelevance(organizedResponse)
        }
        
        setOrganizedData(enhancedResponse)
        
        // Auto-expand high relevance categories
        const autoExpanded: Record<string, boolean> = {}
        Object.entries(enhancedResponse.organized_categories).forEach(([key, category]) => {
          autoExpanded[key] = category.jobRelevance === 'high' || true // Default expanded
        })
        setExpandedCategories(autoExpanded)
        
        // Auto-generate suggestions for relevant categories (staggered to prevent rate limits)
        if (jobData && aiMode) {
          Object.keys(enhancedResponse.organized_categories).slice(0, 3).forEach((categoryKey, index) => {
            setTimeout(() => generateAISuggestions(categoryKey), 1000 * (index + 1))
          })
        }
      } else {
        // Fallback to basic organization
        console.log('🧠 TailorSkills: API failed, using fallback organization')
        await organizeSkillsFallback()
      }
    } catch (error) {
      console.error('🧠 TailorSkills: Organization failed:', error)
      await organizeSkillsFallback()
    } finally {
      setIsLoading(false)
    }
  }
  
  const organizeSkillsFallback = async () => {
    const organizedCategories: Record<string, OrganizedCategory> = {}
    
    Object.entries(skills).forEach(([categoryKey, skillArray]) => {
      if (Array.isArray(skillArray)) {
        organizedCategories[categoryKey] = {
          skills: skillArray,
          suggestions: [],
          reasoning: `Existing ${categoryKey} skills from your profile`,
          jobRelevance: aiMode ? 'medium' : undefined,
          aiOptimized: aiMode
        }
      }
    })
    
    const organizedResponse: OrganizedSkillsResponse = {
      organized_categories: organizedCategories,
      profile_assessment: {
        career_focus: 'Multi-disciplinary professional',
        skill_level: 'Intermediate',
        recommendations: 'Consider adding more job-specific skills'
      },
      category_mapping: {},
      success: true,
      source: 'fallback'
    }
    
    if (aiMode && jobData) {
      const enhancedData = await analyzeJobRelevance(organizedResponse)
      setOrganizedData(enhancedData)
    } else {
      setOrganizedData(organizedResponse)
    }
    
    // Auto-expand all categories
    const autoExpanded: Record<string, boolean> = {}
    Object.keys(organizedCategories).forEach(key => {
      autoExpanded[key] = true
    })
    setExpandedCategories(autoExpanded)
  }

  const addSkillToCategory = (categoryKey: string, skill: string) => {
    console.log('🔧 ADD SKILL TO CATEGORY CALLED:', {
      categoryKey,
      skill,
      hasOrganizedData: !!organizedData,
      skillToAdd: skill.trim()
    })

    if (!skill.trim()) {
      console.log('❌ ADD SKILL FAILED: Empty skill')
      return
    }

    // Special handling for languages
    if (categoryKey === 'languages') {
      console.log('🌐 Adding language:', skill)
      // CRITICAL: Set flag to prevent automatic reorganization during individual processing
      console.log('🚫 Setting skipAutoReorganization = true to prevent AI reorganization')
      setSkipAutoReorganization(true)

      const updatedSkills = { ...skills }
      if (!updatedSkills.languages) {
        updatedSkills.languages = []
      }
      if (Array.isArray(updatedSkills.languages)) {
        updatedSkills.languages.push(skill.trim())
        onSkillsChange(updatedSkills)
      }
      setNewSkillInputs(prev => ({ ...prev, [categoryKey]: '' }))

      // Reset flag after a short delay
      setTimeout(() => {
        console.log('✅ Resetting skipAutoReorganization = false')
        setSkipAutoReorganization(false)
      }, 100)
      return
    }

    if (!organizedData) {
      console.log('❌ ADD SKILL FAILED: No organized data')
      return
    }

    // CRITICAL: Set flag to prevent automatic reorganization during individual processing
    console.log('🚫 Setting skipAutoReorganization = true to prevent AI reorganization')
    setSkipAutoReorganization(true)

    const updatedData = { ...organizedData }
    const category = updatedData.organized_categories[categoryKey]

    if (category && !category.skills.some(s =>
      (typeof s === 'string' ? s : s.skill).toLowerCase() === skill.toLowerCase()
    )) {
      console.log('✅ ADDING SINGLE SKILL TO CATEGORY:', {
        categoryKey,
        skill: skill.trim(),
        currentSkillsInCategory: category.skills.length,
        skillsBeforeAdd: category.skills.map(s => typeof s === 'string' ? s : s.skill)
      })

      category.skills.push(skill.trim())
      setOrganizedData(updatedData)

      console.log('📝 SKILLS AFTER ADD:', {
        categoryKey,
        skillsAfterAdd: category.skills.map(s => typeof s === 'string' ? s : s.skill),
        totalSkillsInCategory: category.skills.length
      })

      syncWithSkillsObject(updatedData)

      // Reset flag after a short delay to allow sync to complete
      setTimeout(() => {
        console.log('✅ Resetting skipAutoReorganization = false after individual skill processing')
        setSkipAutoReorganization(false)
      }, 100)
    } else {
      console.log('⚠️ SKILL NOT ADDED: Either category missing or skill already exists')
      // Reset flag even if skill wasn't added
      setSkipAutoReorganization(false)
    }

    setNewSkillInputs(prev => ({ ...prev, [categoryKey]: '' }))
  }

  const removeSkillFromCategory = (categoryKey: string, skillIndex: number) => {
    console.log('🚨🚨 INDIVIDUAL SKILL REMOVAL CLICKED:', {
      categoryKey,
      skillIndex,
      skillBeingRemoved: organizedData?.organized_categories[categoryKey]?.skills[skillIndex],
      allSkillsInCategory: organizedData?.organized_categories[categoryKey]?.skills,
      totalCategories: Object.keys(organizedData?.organized_categories || {}).length
    })

    // Special handling for languages
    if (categoryKey === 'languages') {
      console.log('🌐 Removing language at index:', skillIndex)
      // CRITICAL: Set flag to prevent automatic reorganization during individual processing
      console.log('🚫 Setting skipAutoReorganization = true to prevent AI reorganization during removal')
      setSkipAutoReorganization(true)

      const updatedSkills = { ...skills }
      if (Array.isArray(updatedSkills.languages)) {
        updatedSkills.languages.splice(skillIndex, 1)
        onSkillsChange(updatedSkills)
      }

      // Reset flag after a short delay
      setTimeout(() => {
        console.log('✅ Resetting skipAutoReorganization = false')
        setSkipAutoReorganization(false)
      }, 100)
      return
    }

    if (!organizedData) return

    // CRITICAL: Set flag to prevent automatic reorganization during individual processing
    console.log('🚫 Setting skipAutoReorganization = true to prevent AI reorganization during removal')
    setSkipAutoReorganization(true)

    const updatedData = { ...organizedData }
    updatedData.organized_categories[categoryKey].skills.splice(skillIndex, 1)
    setOrganizedData(updatedData)
    syncWithSkillsObject(updatedData)

    // Reset flag after a short delay to allow sync to complete
    setTimeout(() => {
      console.log('✅ Resetting skipAutoReorganization = false after individual skill removal')
      setSkipAutoReorganization(false)
    }, 100)

    console.log('✅ INDIVIDUAL SKILL REMOVAL COMPLETE')
  }

  const syncWithSkillsObject = (data: OrganizedSkillsResponse) => {
    console.log('🔄 SYNC WITH SKILLS OBJECT CALLED:', {
      dataKeys: Object.keys(data.organized_categories || {}),
      hasOnSkillsChange: !!onSkillsChange,
      totalCategoriesBeingSync: Object.keys(data.organized_categories || {}).length
    })

    const skillsObject: any = {}

    Object.entries(data.organized_categories).forEach(([categoryKey, category]) => {
      const displayName = categoryKey
        .replace(/___/g, ' & ')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      skillsObject[displayName] = category.skills.map(skill =>
        typeof skill === 'string' ? skill : skill.skill
      )

      console.log(`📝 Category "${displayName}" (${categoryKey}):`, {
        skillCount: skillsObject[displayName].length,
        skills: skillsObject[displayName]
      })
    })

    // Preserve languages from the original skills prop if they exist
    if (skills.languages && !skillsObject.Languages) {
      skillsObject.languages = skills.languages
      console.log('📝 Preserving languages from skills prop:', skills.languages)
    }

    console.log('📤 CALLING onSkillsChange with COMPLETE skills object:', {
      categories: Object.keys(skillsObject),
      totalSkillsAcrossAllCategories: Object.values(skillsObject).reduce((total, skills) => total + (skills as string[]).length, 0),
      completeSkillsObject: skillsObject
    })

    onSkillsChange(skillsObject)
    console.log('✅ SYNC WITH SKILLS OBJECT COMPLETE')
  }

  const generateAISuggestions = async (categoryKey: string) => {
    if (!jobData || !aiMode) return
    
    setLoadingStates(prev => ({ ...prev, [categoryKey]: true }))
    
    try {
      console.log(`🎯 TailorSkills: Generating GPT suggestions for ${categoryKey}...`)
      
      // Get user profile data for context
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      const profileResponse = await fetch('/api/profile/latest', {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      
      let profileData = null
      if (profileResponse.ok) {
        const result = await profileResponse.json()
        profileData = result.profile || result.resumeData
      }
      
      const categorySkills = organizedData?.organized_categories[categoryKey]?.skills || []
      const currentCategorySkills = categorySkills.map(skill => 
        typeof skill === 'string' ? skill : skill.skill
      )
      
      // Create job context for smarter suggestions
      const jobContext = {
        title: jobData.title || '',
        company: jobData.company_name || '',
        skills_required: jobData.skills_original || [],
        responsibilities: jobData.responsibilities_original || [],
        ats_keywords: strategy?.ats_keywords || [],
        must_have_gaps: strategy?.must_have_gaps || []
      }
      
      // Call the sophisticated category suggestions API
      const response = await fetch('/api/skills/category-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: categoryKey.replace(/_/g, ' ').replace(/___/g, ' & '),
          profileData: { ...profileData, jobContext },
          currentCategorySkills: currentCategorySkills
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const suggestions = result.suggestions || []
        console.log(`🎯 TailorSkills: GPT suggestions for ${categoryKey}:`, suggestions)
        setAISuggestions(prev => ({ ...prev, [categoryKey]: suggestions }))
      } else {
        // Fallback to job-based suggestions
        console.log(`🎯 TailorSkills: API failed, using job-based fallback for ${categoryKey}`)
        const jobSkills = [
          ...(jobData.skills_original || []),
          ...(strategy?.ats_keywords || []),
          ...(strategy?.must_have_gaps || []).map((gap: any) => gap.skill)
        ]
        
        const suggestions = jobSkills
          .filter(skill => !currentCategorySkills.some(existing => 
            existing.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(existing.toLowerCase())
          ))
          .slice(0, 4)
        
        setAISuggestions(prev => ({ ...prev, [categoryKey]: suggestions }))
      }
    } catch (error) {
      console.error(`🎯 TailorSkills: Suggestions failed for ${categoryKey}:`, error)
      // Simple fallback
      setAISuggestions(prev => ({ ...prev, [categoryKey]: [] }))
    } finally {
      setLoadingStates(prev => ({ ...prev, [categoryKey]: false }))
    }
  }

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }))
  }

  if (!organizedData) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Organizing your skills with AI...</p>
      </div>
    )
  }

  const updatePreview = () => {
    console.log('🔄 Updating preview with current organized skills')
    if (organizedData && onSkillsChange) {
      // Convert organized data back to skills object format and trigger update
      syncWithSkillsObject(organizedData)

      // Show success feedback
      setSkillsAccepted(true)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    }
  }

  const handleRenameCategory = (oldKey: string, newName: string) => {
    if (!newName.trim() || newName === oldKey) {
      setEditingCategory(null)
      return
    }

    const newKey = newName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    const newCategories = { ...organizedData.organized_categories }
    const categoryData = newCategories[oldKey]
    delete newCategories[oldKey]
    newCategories[newKey] = { ...categoryData, displayName: newName }

    setOrganizedData({
      ...organizedData,
      organized_categories: newCategories
    })

    setEditingCategory(null)
    syncWithSkillsObject({ ...organizedData, organized_categories: newCategories })
  }

  const handleDeleteCategory = (categoryKey: string, displayName: string) => {
    setDeleteConfirmation({ categoryKey, displayName })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return

    console.log('🗑️ Deleting category:', deleteConfirmation.categoryKey)

    // Set flag to prevent re-initialization from overwriting deletion
    setSkipReinitialization(true)

    const newCategories = { ...organizedData.organized_categories }
    delete newCategories[deleteConfirmation.categoryKey]

    setOrganizedData({
      ...organizedData,
      organized_categories: newCategories
    })

    syncWithSkillsObject({ ...organizedData, organized_categories: newCategories })
    setDeleteConfirmation(null)

    // Reset flag after sync completes
    setTimeout(() => {
      console.log('✅ Resetting skipReinitialization after category deletion')
      setSkipReinitialization(false)
    }, 500)
  }

  return (
    <div className="space-y-3 text-[13px]">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
            >
              <h3 className="text-heading-3 mb-4">Delete Category</h3>
              <p className="text-body mb-6 text-gray-600">
                Delete the entire "{deleteConfirmation.displayName}" category?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="info-box info-box-success mb-4"
          >
            <CheckCircle className="info-box-icon" />
            <div className="info-box-content">
              Skills updated successfully! Changes have been applied to your resume.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Preview Button */}
      {aiMode && organizedData && !skillsAccepted && (
        <div className="flex justify-end">
          <button onClick={updatePreview} className="btn btn-primary btn-sm">
            <CheckCircle className="w-4 h-4" />
            Accept All Skills
          </button>
        </div>
      )}

      {/* AI Mode Header - Hide after accepting */}
      {aiMode && jobData && jobOptimizedSkills.length > 0 && !skillsAccepted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="info-box info-box-primary"
        >
          <Brain className="info-box-icon" />
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-1">AI Skills Optimization Active</div>
            <div className="text-sm text-gray-600">
              Skills are analyzed for relevance to: <span className="font-semibold">{jobData.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-primary">
              {jobOptimizedSkills.length} optimized skills
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
        </motion.div>
      )}

      {/* Skills Categories */}
      <div className="space-y-2">
        {Object.entries(organizedData.organized_categories)
          .sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically to match preview order
          .map(([categoryKey, categoryData], index) => {
          const colorIndex = index % CATEGORY_COLORS.length
          const colors = CATEGORY_COLORS[colorIndex]

          const categoryWords = categoryKey.split('_')
          const iconKey = categoryWords.find(word => CATEGORY_ICONS[word.toLowerCase()]) || 'core'
          const IconComponent = CATEGORY_ICONS[iconKey] || Star

          const displayName = categoryKey
            .replace(/___/g, ' & ')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          const isExpanded = expandedCategories[categoryKey]
          const relevanceColor = categoryData.jobRelevance ? getRelevanceColor(categoryData.jobRelevance) : null
          
          return (
            <motion.div
              key={categoryKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 ${colors.bg} rounded-lg relative`}>
                      <IconComponent className={`w-4 h-4 ${colors.text}`} />
                      {categoryData.aiOptimized && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {editingCategory === categoryKey ? (
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            onBlur={() => handleRenameCategory(categoryKey, editingCategoryName)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameCategory(categoryKey, editingCategoryName)
                              if (e.key === 'Escape') setEditingCategory(null)
                            }}
                            autoFocus
                            className="input input-sm max-w-xs"
                          />
                        ) : (
                          <h4 className={`text-label ${colors.text}`}>{displayName}</h4>
                        )}
                        <span className="badge badge-sm">
                          {categoryData.skills.length}
                        </span>

                        {/* Job Relevance Indicator */}
                        {categoryData.jobRelevance && aiMode && (
                          <span className="badge badge-success badge-sm">
                            {categoryData.jobRelevance} relevance
                          </span>
                        )}
                      </div>

                      {categoryData.reasoning && (
                        <p className="text-body-small text-gray-600 mt-1 max-w-md">
                          {categoryData.reasoning}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Edit Category Button */}
                    <button
                      onClick={() => {
                        setEditingCategory(categoryKey)
                        setEditingCategoryName(displayName)
                      }}
                      className="btn-icon btn-ghost btn-sm"
                      title="Rename category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete Category Button */}
                    <button
                      onClick={() => handleDeleteCategory(categoryKey, displayName)}
                      className="btn-icon btn-ghost btn-sm"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>

                    {aiMode && (
                      <button
                        onClick={() => generateAISuggestions(categoryKey)}
                        disabled={loadingStates[categoryKey]}
                        className="btn-icon btn-ghost btn-sm"
                        title="Get AI suggestions"
                      >
                        {loadingStates[categoryKey] ? (
                          <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4 text-purple-600" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className="btn-icon btn-ghost btn-sm"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-2">
                        {/* Skills Pills */}
                        <div className="flex flex-wrap gap-2">
                          {categoryData.skills.map((skill, skillIndex) => {
                            const skillName = typeof skill === 'string' ? skill : skill.skill
                            const isJobOptimized = jobOptimizedSkills.includes(skillName)
                            
                            return (
                              <motion.div
                                key={skillIndex}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: skillIndex * 0.05 }}
                                className={`group flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 ${colors.border} rounded-full shadow-sm hover:shadow-md transition-all duration-200 relative`}
                              >
                                {isJobOptimized && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <Zap className="w-2.5 h-2.5 text-white" />
                                  </div>
                                )}
                                
                                <span className={`font-medium ${colors.text}`}>
                                  {skillName}
                                </span>
                                
                                <motion.button
                                  onClick={() => removeSkillFromCategory(categoryKey, skillIndex)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-full transition-all"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </motion.button>
                              </motion.div>
                            )
                          })}
                        </div>
                        
                        {/* AI Suggestions */}
                        {aiSuggestions[categoryKey] && aiSuggestions[categoryKey].length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-blue-50/50 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Lightbulb className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-800">AI Suggestions for this job:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {aiSuggestions[categoryKey].map((suggestion, i) => (
                                <motion.button
                                  key={i}
                                  onClick={() => {
                                    console.log('🚨🚨 INDIVIDUAL SUGGESTION APPLY CLICKED:', {
                                      categoryKey,
                                      suggestion,
                                      allSuggestionsInCategory: aiSuggestions[categoryKey],
                                      suggestionIndex: i
                                    })
                                    addSkillToCategory(categoryKey, suggestion)

                                    // Remove this specific suggestion from AI suggestions after adding
                                    setAISuggestions(prev => ({
                                      ...prev,
                                      [categoryKey]: prev[categoryKey]?.filter((_, index) => index !== i) || []
                                    }))
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Plus className="w-3 h-3" />
                                  {suggestion}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Add New Skill */}
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newSkillInputs[categoryKey] || ''}
                            onChange={(e) => setNewSkillInputs(prev => ({ 
                              ...prev, 
                              [categoryKey]: e.target.value 
                            }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addSkillToCategory(categoryKey, newSkillInputs[categoryKey] || '')
                              }
                            }}
                            placeholder="Add a new skill..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <motion.button
                            onClick={() => addSkillToCategory(categoryKey, newSkillInputs[categoryKey] || '')}
                            className={`px-4 py-2 ${colors.accent} hover:bg-opacity-80 text-white rounded-lg font-semibold transition-colors`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Add
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Languages Section Removed - Using separate LanguagesCard component */}
      {false && (() => {
        // Debug logging
        console.log('🔍 Looking for languages in:', {
          organizedCategories: Object.keys(organizedData.organized_categories),
          skills: Object.keys(skills)
        })

        // First try to find languages in organized data
        let languageEntry = Object.entries(organizedData.organized_categories).find(([key]) => {
          const displayName = key
            .replace(/___/g, ' & ')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          return displayName.toLowerCase() === 'languages'
        })

        // If not found in organized data, check the skills prop directly
        let languageSkills: any[] = []
        let languageCategoryKey = 'languages'

        if (languageEntry) {
          languageSkills = languageEntry[1].skills || []
          languageCategoryKey = languageEntry[0]
          console.log('✅ Found languages in organized data:', languageSkills)
        } else if (skills.languages) {
          // Languages might be directly in skills object
          languageSkills = Array.isArray(skills.languages) ? skills.languages : []
          console.log('✅ Found languages in skills prop:', languageSkills)
        } else {
          console.log('⚠️ No languages found in either location')
        }

        // Always show languages section
        if (true) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Globe2 className="w-4 h-4 text-purple-600" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm font-semibold text-purple-600">Languages</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {languageSkills.length}
                        </span>

                        {/* Job Relevance Indicator */}
                        {languageEntry && languageEntry[1].jobRelevance && aiMode && (
                          <div className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium uppercase">
                            {languageEntry[1].jobRelevance} relevance
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => toggleCategory(languageCategoryKey)}
                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {expandedCategories[languageCategoryKey] ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {expandedCategories[languageCategoryKey] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-2">
                        {/* Language Pills */}
                        <div className="flex flex-wrap gap-2">
                          {languageSkills.map((lang, skillIndex) => {
                            const langName = typeof lang === 'string' ? lang : lang.skill
                            // Parse language and proficiency if in format "Language (Proficiency)"
                            const match = langName?.match(/^(.+?)\s*\((.+?)\)$/)
                            const language = match ? match[1] : langName
                            const proficiency = match ? match[2] : ''

                            return (
                              <motion.div
                                key={skillIndex}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: skillIndex * 0.05 }}
                                className="group flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 border-2 border-purple-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <span className="font-medium text-purple-600">
                                  {language}
                                </span>

                                {/* Proficiency Dropdown */}
                                <select
                                  value={proficiency || 'Professional working'}
                                  onChange={(e) => {
                                    const updatedSkills = { ...skills }
                                    const newLangValue = `${language} (${e.target.value})`

                                    // Check if languages exist in organized categories or directly in skills
                                    if (languageEntry) {
                                      // Update in the organized categories structure
                                      const categoryKey = languageEntry[0]
                                      if (!updatedSkills[categoryKey]) {
                                        updatedSkills[categoryKey] = []
                                      }
                                      if (Array.isArray(updatedSkills[categoryKey])) {
                                        updatedSkills[categoryKey][skillIndex] = newLangValue
                                      }
                                    } else if (updatedSkills.languages && Array.isArray(updatedSkills.languages)) {
                                      // Update directly in languages array
                                      updatedSkills.languages[skillIndex] = newLangValue
                                    } else {
                                      // Create languages array if it doesn't exist
                                      if (!updatedSkills.languages) {
                                        updatedSkills.languages = []
                                      }
                                      updatedSkills.languages[skillIndex] = newLangValue
                                    }

                                    console.log('📝 Updating language proficiency:', {
                                      language,
                                      newValue: newLangValue,
                                      updatedSkills
                                    })

                                    onSkillsChange(updatedSkills)
                                  }}
                                  className="text-xs text-gray-600 bg-transparent border-0 focus:ring-1 focus:ring-purple-500 rounded cursor-pointer"
                                >
                                  <option value="Native">Native</option>
                                  <option value="Full professional">Full professional</option>
                                  <option value="Professional working">Professional working</option>
                                  <option value="Limited working">Limited working</option>
                                  <option value="Elementary">Elementary</option>
                                </select>

                                <motion.button
                                  onClick={() => removeSkillFromCategory(languageCategoryKey, skillIndex)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-full transition-all ml-auto"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </motion.button>
                              </motion.div>
                            )
                          })}
                        </div>

                        {/* Add New Language */}
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newSkillInputs[languageCategoryKey] || ''}
                            onChange={(e) => setNewSkillInputs(prev => ({
                              ...prev,
                              [languageCategoryKey]: e.target.value
                            }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addSkillToCategory(languageCategoryKey, newSkillInputs[languageCategoryKey] || '')
                              }
                            }}
                            placeholder="Add a new language..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <motion.button
                            onClick={() => addSkillToCategory(languageCategoryKey, newSkillInputs[languageCategoryKey] || '')}
                            className="px-4 py-2 bg-purple-500 hover:bg-opacity-80 text-white rounded-lg font-semibold transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Add
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        }
        return null
      })()}

      {/* AI Optimization Summary */}
      {aiMode && jobOptimizedSkills.filter(skill => {
        const lowerSkill = skill.toLowerCase()
        return !lowerSkill.includes('language') && !lowerSkill.includes('proficiency')
      }).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-green-800">Skills Optimized for This Job</h4>
              <p className="text-sm text-green-700">
                {jobOptimizedSkills.filter(skill => {
                  const lowerSkill = skill.toLowerCase()
                  return !lowerSkill.includes('language') && !lowerSkill.includes('proficiency')
                }).length} skills have been identified as highly relevant
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {jobOptimizedSkills.filter(skill => {
              const lowerSkill = skill.toLowerCase()
              return !lowerSkill.includes('language') && !lowerSkill.includes('proficiency')
            }).map((skill, i) => (
              <div
                key={i}
                className="px-3 py-2 bg-white border border-green-200 rounded-lg text-sm font-medium text-green-700 whitespace-nowrap"
              >
                {skill}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
