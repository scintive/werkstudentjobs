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
  AlertCircle
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
  { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', accent: 'bg-orange-500' },
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

  // Enhanced initialization with AI analysis
  React.useEffect(() => {
    const initializeSkills = async () => {
      if (organizedSkills?.organized_categories) {
        // Analyze job relevance if job data available
        let enhancedData = organizedSkills
        
        if (jobData && strategy && aiMode) {
          enhancedData = await analyzeJobRelevance(organizedSkills)
        }
        
        setOrganizedData(enhancedData)
        
        // Auto-expand high relevance categories
        const autoExpanded: Record<string, boolean> = {}
        Object.entries(enhancedData.organized_categories).forEach(([key, category]) => {
          autoExpanded[key] = category.jobRelevance === 'high' || true // Default to expanded
        })
        setExpandedCategories(autoExpanded)
      } else if (Object.keys(skills).length > 0 && !skipAutoReorganization) {
        console.log('🧠 Auto-reorganization triggered (skills changed, no organized data, not skipping)')
        await organizeExistingSkills()
      } else if (skipAutoReorganization) {
        console.log('🚫 Skipping auto-reorganization due to individual suggestion processing')
      }
    }

    initializeSkills()
  }, [skills, organizedSkills, jobData, strategy, aiMode, skipAutoReorganization])

  const analyzeJobRelevance = async (skillsData: OrganizedSkillsResponse) => {
    if (!jobData || !strategy) return skillsData
    
    try {
      const jobKeywords = [
        ...(strategy.ats_keywords || []),
        ...(strategy.must_have_gaps || []).map((gap: any) => gap.skill),
        ...(jobData.skills_original || []),
        ...(jobData.responsibilities_original || [])
      ]
      
      const enhancedCategories: Record<string, OrganizedCategory> = {}
      
      Object.entries(skillsData.organized_categories).forEach(([categoryKey, category]) => {
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
        
        // Track job-optimized skills
        if (jobRelevance === 'high') {
          setJobOptimizedSkills(prev => [...prev, ...relevantSkills])
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

    if (!skill.trim() || !organizedData) {
      console.log('❌ ADD SKILL FAILED: Missing skill or organized data')
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

  return (
    <div className="space-y-6 text-[13px]">
      {/* AI Mode Header */}
      {aiMode && jobData && jobOptimizedSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">AI Skills Optimization Active</h4>
                <p className="text-xs text-gray-600">
                  Skills are analyzed for relevance to: <span className="font-semibold">{jobData.title}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600 font-medium">
                {jobOptimizedSkills.length} optimized skills
              </span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Skills Categories */}
      <div className="space-y-4">
        {Object.entries(organizedData.organized_categories).map(([categoryKey, categoryData], index) => {
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
              className={`${colors.bg} ${colors.border} border-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${colors.accent} rounded-xl shadow-md relative`}>
                      <IconComponent className="w-5 h-5 text-white" />
                      {categoryData.aiOptimized && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className={`text-lg font-bold ${colors.text}`}>{displayName}</h4>
                        <span className={`px-3 py-1 ${colors.accent} text-white rounded-full text-sm font-semibold`}>
                          {categoryData.skills.length}
                        </span>
                        
                        {/* Job Relevance Indicator */}
                        {categoryData.jobRelevance && aiMode && (
                          <div className={`px-3 py-1 bg-gradient-to-r ${relevanceColor} text-white rounded-full text-xs font-bold uppercase tracking-wide shadow-sm`}>
                            {categoryData.jobRelevance} relevance
                          </div>
                        )}
                      </div>
                      
                      {categoryData.reasoning && (
                        <p className="text-sm text-gray-600 mt-1 max-w-md">
                          {categoryData.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {aiMode && (
                      <motion.button
                        onClick={() => generateAISuggestions(categoryKey)}
                        disabled={loadingStates[categoryKey]}
                        className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Get AI suggestions"
                      >
                        {loadingStates[categoryKey] ? (
                          <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4 text-purple-600" />
                        )}
                      </motion.button>
                    )}
                    
                    <motion.button
                      onClick={() => toggleCategory(categoryKey)}
                      className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      )}
                    </motion.button>
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
                      <div className="space-y-4">
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
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
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
                            className="p-4 bg-gradient-to-r from-purple-100/50 to-blue-100/50 rounded-xl border border-purple-200"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Lightbulb className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-800">AI Suggestions for this job:</span>
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
                                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-purple-50 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 transition-colors"
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
      
      {/* AI Optimization Summary */}
      {aiMode && jobOptimizedSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-green-800">Skills Optimized for This Job</h4>
              <p className="text-sm text-green-700">
                {jobOptimizedSkills.length} skills have been identified as highly relevant
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {jobOptimizedSkills.slice(0, 8).map((skill, i) => (
              <div
                key={i}
                className="px-3 py-2 bg-white border border-green-200 rounded-lg text-sm font-medium text-green-700 text-center"
              >
                {skill}
              </div>
            ))}
          </div>
          
          {jobOptimizedSkills.length > 8 && (
            <p className="text-sm text-green-600 mt-3 text-center">
              +{jobOptimizedSkills.length - 8} more optimized skills
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
