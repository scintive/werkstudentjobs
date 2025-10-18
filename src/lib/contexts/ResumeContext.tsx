'use client'

import * as React from 'react'
import type { ResumeData } from '@/lib/types'

// Action types for the reducer
export type ResumeAction =
  | { type: 'SET_RESUME_DATA'; payload: ResumeData }
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<ResumeData['personalInfo']> }
  | { type: 'UPDATE_FIELD'; payload: { path: string; value: unknown } }
  | { type: 'ADD_EXPERIENCE'; payload: ResumeData['experience'][0] }
  | { type: 'UPDATE_EXPERIENCE'; payload: { index: number; data: Partial<ResumeData['experience'][0]> } }
  | { type: 'REMOVE_EXPERIENCE'; payload: { index: number } }
  | { type: 'REORDER_EXPERIENCE'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'ADD_EDUCATION'; payload: ResumeData['education'][0] }
  | { type: 'UPDATE_EDUCATION'; payload: { index: number; data: Partial<ResumeData['education'][0]> } }
  | { type: 'REMOVE_EDUCATION'; payload: { index: number } }
  | { type: 'REORDER_EDUCATION'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'ADD_PROJECT'; payload: NonNullable<ResumeData['projects']>[0] }
  | { type: 'UPDATE_PROJECT'; payload: { index: number; data: Partial<NonNullable<ResumeData['projects']>[0]> } }
  | { type: 'REMOVE_PROJECT'; payload: { index: number } }
  | { type: 'REORDER_PROJECTS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'ADD_SKILL'; payload: { category: string; skill: string } }
  | { type: 'REMOVE_SKILL'; payload: { category: string; index: number } }
  | { type: 'UPDATE_SKILL'; payload: { category: string; index: number; value: string } }
  | { type: 'ADD_CUSTOM_SECTION'; payload: NonNullable<ResumeData['customSections']>[0] }
  | { type: 'UPDATE_CUSTOM_SECTION'; payload: { id: string; data: Partial<NonNullable<ResumeData['customSections']>[0]> } }
  | { type: 'REMOVE_CUSTOM_SECTION'; payload: { id: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }

// Initial state
const initialResumeData: ResumeData = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: ""
  },
  professionalTitle: "",
  professionalSummary: "",
  enableProfessionalSummary: false,
  skills: {
    technical: [],
    tools: [],
    soft_skills: [],
    languages: []
  },
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  customSections: []
}

// Context state interface
interface ResumeContextState {
  present: ResumeData
  past: ResumeData[]
  future: ResumeData[]
}

// Context interface
interface ResumeContextValue {
  resumeData: ResumeData
  dispatch: React.Dispatch<ResumeAction>
  canUndo: boolean
  canRedo: boolean
}

// Utility function to update nested object properties
function setNestedProperty(obj: unknown, path: string, value: unknown): unknown {
  const keys = path.split('.')
  const result = JSON.parse(JSON.stringify(obj)) // Deep clone
  
  let current = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      // Handle array indices
      if (/^\d+$/.test(keys[i + 1])) {
        current[key] = []
      } else {
        current[key] = {}
      }
    }
    current = current[key]
  }
  
  const lastKey = keys[keys.length - 1]
  current[lastKey] = value
  
  return result
}

// Reducer function with undo/redo support
function resumeReducer(state: ResumeContextState, action: ResumeAction): ResumeContextState {
  const { present, past, future } = state

  // Helper function to create new state with history
  const createNewState = (newPresent: ResumeData): ResumeContextState => ({
    present: newPresent,
    past: [...past, present].slice(-20), // Keep only last 20 states
    future: [] // Clear future when new action is performed
  })

  switch (action.type) {
    case 'SET_RESUME_DATA':
      return createNewState(action.payload)

    case 'UPDATE_PERSONAL_INFO':
      return createNewState({
        ...present,
        personalInfo: { ...present.personalInfo, ...action.payload }
      })

    case 'UPDATE_FIELD':
      return createNewState(setNestedProperty(present, action.payload.path, action.payload.value))

    case 'ADD_EXPERIENCE':
      return createNewState({
        ...present,
        experience: [...present.experience, action.payload]
      })

    case 'UPDATE_EXPERIENCE':
      const updatedExperience = present.experience.map((exp, index) => 
        index === action.payload.index ? { ...exp, ...action.payload.data } : exp
      )
      return createNewState({
        ...present,
        experience: updatedExperience
      })

    case 'REMOVE_EXPERIENCE':
      return createNewState({
        ...present,
        experience: present.experience.filter((_, index) => index !== action.payload.index)
      })

    case 'REORDER_EXPERIENCE':
      const { fromIndex, toIndex } = action.payload
      const reorderedExperience = [...present.experience]
      const [movedItem] = reorderedExperience.splice(fromIndex, 1)
      reorderedExperience.splice(toIndex, 0, movedItem)
      return createNewState({
        ...present,
        experience: reorderedExperience
      })

    case 'ADD_EDUCATION':
      return createNewState({
        ...present,
        education: [...present.education, action.payload]
      })

    case 'UPDATE_EDUCATION':
      const updatedEducation = present.education.map((edu, index) => 
        index === action.payload.index ? { ...edu, ...action.payload.data } : edu
      )
      return createNewState({
        ...present,
        education: updatedEducation
      })

    case 'REMOVE_EDUCATION':
      return createNewState({
        ...present,
        education: present.education.filter((_, index) => index !== action.payload.index)
      })

    case 'REORDER_EDUCATION':
      const reorderedEducation = [...present.education]
      const [movedEducation] = reorderedEducation.splice(action.payload.fromIndex, 1)
      reorderedEducation.splice(action.payload.toIndex, 0, movedEducation)
      return createNewState({
        ...present,
        education: reorderedEducation
      })

    case 'ADD_PROJECT':
      return createNewState({
        ...present,
        projects: [...(present.projects || []), action.payload]
      })

    case 'UPDATE_PROJECT':
      const updatedProjects = (present.projects || []).map((proj, index) => 
        index === action.payload.index ? { ...proj, ...action.payload.data } : proj
      )
      return createNewState({
        ...present,
        projects: updatedProjects
      })

    case 'REMOVE_PROJECT':
      return createNewState({
        ...present,
        projects: (present.projects || []).filter((_, index) => index !== action.payload.index)
      })

    case 'REORDER_PROJECTS':
      const reorderedProjects = [...(present.projects || [])]
      const [movedProject] = reorderedProjects.splice(action.payload.fromIndex, 1)
      reorderedProjects.splice(action.payload.toIndex, 0, movedProject)
      return createNewState({
        ...present,
        projects: reorderedProjects
      })

    case 'ADD_SKILL':
      const currentSkills = present.skills[action.payload.category as keyof typeof present.skills] || []
      return createNewState({
        ...present,
        skills: {
          ...present.skills,
          [action.payload.category]: [...currentSkills, action.payload.skill]
        }
      })

    case 'REMOVE_SKILL':
      const skillsToUpdate = present.skills[action.payload.category as keyof typeof present.skills] || []
      return createNewState({
        ...present,
        skills: {
          ...present.skills,
          [action.payload.category]: skillsToUpdate.filter((_, index) => index !== action.payload.index)
        }
      })

    case 'UPDATE_SKILL':
      const skillsArray = present.skills[action.payload.category as keyof typeof present.skills] || []
      const updatedSkillsArray = skillsArray.map((skill, index) => 
        index === action.payload.index ? action.payload.value : skill
      )
      return createNewState({
        ...present,
        skills: {
          ...present.skills,
          [action.payload.category]: updatedSkillsArray
        }
      })

    case 'ADD_CUSTOM_SECTION':
      return createNewState({
        ...present,
        customSections: [...(present.customSections || []), action.payload]
      })

    case 'UPDATE_CUSTOM_SECTION':
      const updatedCustomSections = (present.customSections || []).map((section) => 
        section.id === action.payload.id ? { ...section, ...action.payload.data } : section
      )
      return createNewState({
        ...present,
        customSections: updatedCustomSections
      })

    case 'REMOVE_CUSTOM_SECTION':
      return createNewState({
        ...present,
        customSections: (present.customSections || []).filter((section) => section.id !== action.payload.id)
      })

    case 'UNDO':
      if (past.length === 0) return state
      return {
        present: past[past.length - 1],
        past: past.slice(0, -1),
        future: [present, ...future]
      }

    case 'REDO':
      if (future.length === 0) return state
      return {
        present: future[0],
        past: [...past, present],
        future: future.slice(1)
      }

    default:
      return state
  }
}

// Create the context
const ResumeContext = React.createContext<ResumeContextValue | null>(null)

// Context provider component
interface ResumeProviderProps {
  children: React.ReactNode
  initialData?: ResumeData
}

export function ResumeProvider({ children, initialData = initialResumeData }: ResumeProviderProps) {
  // DEBUG: Log initialData photoUrl
  React.useEffect(() => {
    console.log('🎯 RESUME CONTEXT: initialData photoUrl:', (initialData as unknown)?.photoUrl)
  }, [initialData])

  const [state, dispatch] = React.useReducer(resumeReducer, {
    present: initialData,
    past: [],
    future: []
  })

  // DEBUG: Log state.present photoUrl
  React.useEffect(() => {
    console.log('🎯 RESUME CONTEXT: state.present (resumeData) photoUrl:', (state.present as unknown)?.photoUrl)
  }, [state.present])

  const contextValue = React.useMemo(() => ({
    resumeData: state.present,
    dispatch,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  }), [state])

  return (
    <ResumeContext.Provider value={contextValue}>
      {children}
    </ResumeContext.Provider>
  )
}

// Custom hook to use the resume context
export function useResumeContext() {
  const context = React.useContext(ResumeContext)
  if (!context) {
    throw new Error('useResumeContext must be used within a ResumeProvider')
  }
  return context
}

// Custom hook for specific actions
export function useResumeActions() {
  const { dispatch } = useResumeContext()

  return React.useMemo(() => ({
    setResumeData: (data: ResumeData) => dispatch({ type: 'SET_RESUME_DATA', payload: data }),
    updatePersonalInfo: (info: Partial<ResumeData['personalInfo']>) => dispatch({ type: 'UPDATE_PERSONAL_INFO', payload: info }),
    updateField: (path: string, value: unknown) => dispatch({ type: 'UPDATE_FIELD', payload: { path, value } }),
    
    // Experience actions
    addExperience: (experience: ResumeData['experience'][0]) => dispatch({ type: 'ADD_EXPERIENCE', payload: experience }),
    updateExperience: (index: number, data: Partial<ResumeData['experience'][0]>) => dispatch({ type: 'UPDATE_EXPERIENCE', payload: { index, data } }),
    removeExperience: (index: number) => dispatch({ type: 'REMOVE_EXPERIENCE', payload: { index } }),
    reorderExperience: (fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_EXPERIENCE', payload: { fromIndex, toIndex } }),
    
    // Education actions
    addEducation: (education: ResumeData['education'][0]) => dispatch({ type: 'ADD_EDUCATION', payload: education }),
    updateEducation: (index: number, data: Partial<ResumeData['education'][0]>) => dispatch({ type: 'UPDATE_EDUCATION', payload: { index, data } }),
    removeEducation: (index: number) => dispatch({ type: 'REMOVE_EDUCATION', payload: { index } }),
    reorderEducation: (fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_EDUCATION', payload: { fromIndex, toIndex } }),
    
    // Project actions
    addProject: (project: NonNullable<ResumeData['projects']>[0]) => dispatch({ type: 'ADD_PROJECT', payload: project }),
    updateProject: (index: number, data: Partial<NonNullable<ResumeData['projects']>[0]>) => dispatch({ type: 'UPDATE_PROJECT', payload: { index, data } }),
    removeProject: (index: number) => dispatch({ type: 'REMOVE_PROJECT', payload: { index } }),
    reorderProjects: (fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_PROJECTS', payload: { fromIndex, toIndex } }),
    
    // Skills actions
    addSkill: (category: string, skill: string) => dispatch({ type: 'ADD_SKILL', payload: { category, skill } }),
    removeSkill: (category: string, index: number) => dispatch({ type: 'REMOVE_SKILL', payload: { category, index } }),
    updateSkill: (category: string, index: number, value: string) => dispatch({ type: 'UPDATE_SKILL', payload: { category, index, value } }),
    
    // Custom sections actions
    addCustomSection: (section: NonNullable<ResumeData['customSections']>[0]) => dispatch({ type: 'ADD_CUSTOM_SECTION', payload: section }),
    updateCustomSection: (id: string, data: Partial<NonNullable<ResumeData['customSections']>[0]>) => dispatch({ type: 'UPDATE_CUSTOM_SECTION', payload: { id, data } }),
    removeCustomSection: (id: string) => dispatch({ type: 'REMOVE_CUSTOM_SECTION', payload: { id } }),
    
    // Undo/Redo actions
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' })
  }), [dispatch])
}