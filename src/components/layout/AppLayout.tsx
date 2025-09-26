'use client'

import * as React from 'react'
import AppHeader from '@/components/navigation/AppHeader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen" style={{ background: 'var(--background)' }}>
        {children}
      </main>
    </>
  )
}