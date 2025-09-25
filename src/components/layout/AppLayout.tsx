'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import AppHeader from '@/components/navigation/AppHeader'
import AppSidebar from './AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const pathname = usePathname()

  // Don't show sidebar on auth pages
  const showSidebar = !pathname.includes('/login') &&
                      !pathname.includes('/register') &&
                      !pathname.includes('/reset')

  if (!showSidebar) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        <AppSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </>
  )
}