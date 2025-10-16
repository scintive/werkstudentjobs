'use client'

import * as React from 'react'
import AppHeader from '@/components/navigation/AppHeader'
import { Footer } from '@/components/layout/Footer'
import { CookieConsentProvider } from '@/lib/contexts/CookieConsentContext'
import { CookieBanner } from '@/components/gdpr/CookieBanner'
import { FeedbackButton } from '@/components/feedback/FeedbackButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1" style={{ background: 'var(--background)' }}>
          {children}
        </main>
        <Footer />
        <CookieBanner />
        <FeedbackButton />
      </div>
    </CookieConsentProvider>
  )
}