'use client'

import * as React from 'react'
import { ResumeProvider, useResumeContext, useResumeActions } from './ResumeContext'
import { supabase } from '@/lib/supabase/client'
import { ResumeDataService, refreshSessionFromCookies } from '@/lib/services/resumeDataService'
import type { ResumeData } from '@/lib/types'

// Extended context that adds Supabase persistence
interface SupabaseResumeContextValue {
  resumeData: ResumeData
  dispatch: React.Dispatch<any>
  canUndo: boolean
  canRedo: boolean
  // Supabase-specific additions
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  resumeId: string | null
  saveError: string | null
}

const SupabaseResumeContext = React.createContext<SupabaseResumeContextValue | null>(null)

interface SupabaseResumeProviderProps {
  children: React.ReactNode
  initialData?: ResumeData
  autoSaveInterval?: number // Auto-save interval in ms (default: 2000ms)
  // When true, do not call /api/profile/latest on mount (use local service fallback)
  skipProfileApiFetch?: boolean
}

export function SupabaseResumeProvider({ 
  children, 
  initialData,
  autoSaveInterval = 2000,
  skipProfileApiFetch = false,
}: SupabaseResumeProviderProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [resumeId, setResumeId] = React.useState<string | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [resumeDataFromDB, setResumeDataFromDB] = React.useState<ResumeData | null>(null)
  
  const resumeService = React.useRef<ResumeDataService>(ResumeDataService.getInstance())
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = React.useRef<string>('') // For change detection

  // Initialize data from Supabase on mount
  React.useEffect(() => {
    let isMounted = true
    
    const initializeData = async () => {
      try {
        setIsLoading(true)
        setSaveError(null)
        
        // Refresh session from cookies in case user logged in
        refreshSessionFromCookies()
        
        console.log('🔄 SUPABASE CONTEXT: Initializing resume context')
        
        if (!skipProfileApiFetch) {
          console.log('🔄 SUPABASE CONTEXT: Fetching profile from /api/profile/latest')
          // Use the working /api/profile/latest endpoint with Supabase JWT
          const { data: session } = await supabase.auth.getSession()
          const token = session.session?.access_token
          if (token) {
            const profileResponse = await fetch('/api/profile/latest', {
              method: 'GET',
              credentials: 'include',
              headers: { Authorization: `Bearer ${token}` }
            })
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              console.log('🔄 SUPABASE CONTEXT: Profile API response:', profileData.success)
              
              if (profileData.success && profileData.resumeData) {
                if (isMounted) {
                  setResumeId(profileData.profile?.id || 'unknown')
                  setResumeDataFromDB(profileData.resumeData)
                  setLastSaved(new Date())
                  lastSavedDataRef.current = JSON.stringify(profileData.resumeData)
                }
                return
              }
            } else {
              console.log('🔄 SUPABASE CONTEXT: Profile API not available (status:', profileResponse.status, ')')
            }
          } else {
            console.log('🔒 SUPABASE CONTEXT: No auth token; skipping /api/profile/latest')
          }
        } else {
          console.log('⏭️ SUPABASE CONTEXT: skipProfileApiFetch=true — skipping /api/profile/latest')
        }

        // Fallback to local session-backed record
        const result = await resumeService.current.getOrCreateResumeData()
        if (isMounted) {
          setResumeId(result.id)
          setResumeDataFromDB(result.data)
          setLastSaved(new Date())
          lastSavedDataRef.current = JSON.stringify(result.data)
        }
        
      } catch (error) {
        console.error('🔄 SUPABASE CONTEXT: Failed to initialize resume data:', error)
        if (isMounted) {
          setSaveError(error instanceof Error ? error.message : 'Failed to load data')
          // Use initial data as fallback
          if (initialData) {
            setResumeDataFromDB(initialData)
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initializeData()
    
    return () => {
      isMounted = false
    }
  }, [initialData])

  // Auto-save function with debouncing
  const saveToSupabase = React.useCallback(async (data: ResumeData, template?: string) => {
    const currentDataString = JSON.stringify(data)
    
    // Skip if data hasn't changed
    if (currentDataString === lastSavedDataRef.current) {
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)
      
      await resumeService.current.saveResumeData(data, template)
      
      setLastSaved(new Date())
      lastSavedDataRef.current = currentDataString
    } catch (error) {
      console.error('Failed to save resume data:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save data')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Debounced auto-save
  const scheduleAutoSave = React.useCallback((data: ResumeData) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveToSupabase(data)
    }, autoSaveInterval)
  }, [saveToSupabase, autoSaveInterval])

  // Clean up timeouts
  React.useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading your resume...</span>
        </div>
      </div>
    )
  }

  // Use loaded data or fallback
  const dataToUse = resumeDataFromDB || initialData

  return (
    <ResumeProvider initialData={dataToUse}>
      <SupabaseResumeWrapper
        scheduleAutoSave={scheduleAutoSave}
        isLoading={isLoading}
        isSaving={isSaving}
        lastSaved={lastSaved}
        resumeId={resumeId}
        saveError={saveError}
      >
        {children}
      </SupabaseResumeWrapper>
    </ResumeProvider>
  )
}

// Wrapper component that provides Supabase-enhanced context
interface SupabaseResumeWrapperProps {
  children: React.ReactNode
  scheduleAutoSave: (data: ResumeData) => void
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  resumeId: string | null
  saveError: string | null
}

function SupabaseResumeWrapper({
  children,
  scheduleAutoSave,
  isLoading,
  isSaving,
  lastSaved,
  resumeId,
  saveError
}: SupabaseResumeWrapperProps) {
  const { resumeData, dispatch, canUndo, canRedo } = useResumeContext()
  
  // Watch for changes and trigger auto-save
  React.useEffect(() => {
    if (!isLoading) {
      scheduleAutoSave(resumeData)
    }
  }, [resumeData, scheduleAutoSave, isLoading])

  const contextValue = React.useMemo((): SupabaseResumeContextValue => ({
    resumeData,
    dispatch,
    canUndo,
    canRedo,
    isLoading,
    isSaving,
    lastSaved,
    resumeId,
    saveError
  }), [resumeData, dispatch, canUndo, canRedo, isLoading, isSaving, lastSaved, resumeId, saveError])

  return (
    <SupabaseResumeContext.Provider value={contextValue}>
      {children}
    </SupabaseResumeContext.Provider>
  )
}

// Custom hook to use the enhanced context
export function useSupabaseResumeContext() {
  const context = React.useContext(SupabaseResumeContext)
  if (!context) {
    throw new Error('useSupabaseResumeContext must be used within a SupabaseResumeProvider')
  }
  return context
}

// Enhanced actions hook that includes manual save
export function useSupabaseResumeActions() {
  const baseActions = useResumeActions()
  const { resumeData } = useSupabaseResumeContext()
  const resumeService = React.useRef<ResumeDataService>(ResumeDataService.getInstance())

  return React.useMemo(() => ({
    ...baseActions,
    // Manual save function
    saveNow: async (template?: string) => {
      await resumeService.current.saveResumeData(resumeData, template)
    },
    // Force refresh from database
    refreshFromDatabase: async () => {
      const result = await resumeService.current.getOrCreateResumeData()
      baseActions.setResumeData(result.data)
    }
  }), [baseActions, resumeData])
}

// Save status indicator component
export function SaveStatusIndicator() {
  const { isSaving, lastSaved, saveError } = useSupabaseResumeContext()

  if (saveError) {
    return (
      <div className="flex items-center space-x-2 text-red-600 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>Failed to save</span>
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className="flex items-center space-x-2 text-blue-600 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Saving...</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-2 text-green-600 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span>Saved {formatTimestamp(lastSaved)}</span>
      </div>
    )
  }

  return null
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)

  if (diffSeconds < 10) {
    return 'just now'
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}
