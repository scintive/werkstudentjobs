'use client'

import * as React from 'react'
import AppHeader from '@/components/navigation/AppHeader'
import { Footer } from '@/components/layout/Footer'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1" style={{ background: 'var(--background)' }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}