'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PenTool,
  Home,
  TrendingUp,
  Brain,
  Users,
  BookOpen,
  Sparkles,
  BarChart3
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

interface AppSidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export default function AppSidebar({ collapsed, onCollapsedChange }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Resumes', href: '/?edit=1', icon: FileText },
    { label: 'Job Browser', href: '/jobs', icon: Briefcase },
    { label: 'AI Resume Builder', href: '/jobs?tailor=1', icon: Sparkles },
    { label: 'Cover Letters', href: '/cover-letters', icon: PenTool },
  ]

  const toolsNavItems: NavItem[] = [
    { label: 'Career Insights', href: '/insights', icon: TrendingUp },
    { label: 'Skill Matcher', href: '/skills', icon: Brain },
    { label: 'Interview Prep', href: '/interview', icon: BookOpen },
  ]

  const bottomNavItems: NavItem[] = [
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help & Support', href: '/help', icon: HelpCircle },
  ]

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return pathname === href
    if (href === '/jobs?tailor=1') return pathname.includes('/tailor')
    if (href === '/?edit=1') return pathname === '/' && !pathname.includes('/jobs')
    return pathname.startsWith(href.split('?')[0])
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? '60px' : 'var(--sidebar-width)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)'
      }}
    >
      {/* Logo Area */}
      <div
        className="flex items-center px-4 h-16"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <span className="text-white font-bold">W</span>
            </div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              CareerHub
            </span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Main Section */}
        <div className="mb-6">
          {!collapsed && (
            <p className="nav-section-header mb-3">MAIN</p>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "nav-item w-full mb-2 relative group",
                  isActive && "active"
                )}
              >
                <Icon className="nav-icon" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="badge badge-primary text-xs">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                    style={{
                      background: 'var(--text-primary)',
                      color: 'var(--background)'
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Tools Section */}
        <div className="mb-6">
          {!collapsed && (
            <p className="nav-section-header mb-3">TOOLS</p>
          )}
          {toolsNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "nav-item w-full mb-2 relative group",
                  isActive && "active"
                )}
              >
                <Icon className="nav-icon" />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                    style={{
                      background: 'var(--text-primary)',
                      color: 'var(--background)'
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Support Section */}
        <div>
          {!collapsed && (
            <p className="nav-section-header mb-3">SUPPORT</p>
          )}
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "nav-item w-full mb-2 relative group",
                  isActive && "active"
                )}
              >
                <Icon className="nav-icon" />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                    style={{
                      background: 'var(--text-primary)',
                      color: 'var(--background)'
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Upgrade to Pro */}
      {!collapsed && (
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div
            className="p-4 rounded-lg text-center"
            style={{ background: 'var(--surface-hover)' }}
          >
            <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--primary)' }} />
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              Upgrade to Pro
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Get unlimited features
            </p>
            <Button
              className="w-full btn btn-gradient text-xs"
              size="sm"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <ChevronLeft className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
        )}
      </button>
    </aside>
  )
}