'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface CookieConsent {
  necessary: boolean // Always true, cannot be disabled
  functional: boolean // For user preferences, settings
  analytics: boolean // For usage statistics
  marketing: boolean // For third-party marketing (currently not used)
}

interface CookieConsentContextType {
  consent: CookieConsent | null
  showBanner: boolean
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (preferences: Partial<CookieConsent>) => void
  openSettings: () => void
  hasConsent: (category: keyof CookieConsent) => boolean
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

const CONSENT_STORAGE_KEY = 'cookie_consent'
const CONSENT_TIMESTAMP_KEY = 'cookie_consent_timestamp'
const CONSENT_DURATION_DAYS = 180 // 6 months

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Load consent from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY)

      if (stored && timestamp) {
        const consentDate = new Date(timestamp)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24))

        // Check if consent is still valid (within 6 months)
        if (daysDiff < CONSENT_DURATION_DAYS) {
          setConsent(JSON.parse(stored))
          setShowBanner(false)
        } else {
          // Consent expired, show banner again
          setShowBanner(true)
        }
      } else {
        // No consent found, show banner
        setShowBanner(true)
      }
    } catch (error) {
      console.error('Error loading cookie consent:', error)
      setShowBanner(true)
    }
  }, [])

  const saveConsent = useCallback((newConsent: CookieConsent) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newConsent))
      localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString())
      setConsent(newConsent)
      setShowBanner(false)
      setShowSettings(false)
    } catch (error) {
      console.error('Error saving cookie consent:', error)
    }
  }, [])

  const acceptAll = useCallback(() => {
    const allAccepted: CookieConsent = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    saveConsent(allAccepted)
  }, [saveConsent])

  const rejectAll = useCallback(() => {
    const onlyNecessary: CookieConsent = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }
    saveConsent(onlyNecessary)
  }, [saveConsent])

  const savePreferences = useCallback((preferences: Partial<CookieConsent>) => {
    const newConsent: CookieConsent = {
      necessary: true, // Always true
      functional: preferences.functional ?? false,
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
    }
    saveConsent(newConsent)
  }, [saveConsent])

  const openSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const hasConsent = useCallback((category: keyof CookieConsent): boolean => {
    if (!consent) return category === 'necessary'
    return consent[category]
  }, [consent])

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        showBanner: showBanner || showSettings,
        acceptAll,
        rejectAll,
        savePreferences,
        openSettings,
        hasConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}
