'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  Upload,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PenTool,
  MoreHorizontal,
  Home
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
  const [hovering, setHovering] = React.useState(false)

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Resume', href: '/?edit=1', icon: FileText },
    { label: 'Job Browser', href: '/jobs', icon: Briefcase },
    { label: 'Tailor Resume', href: '/jobs?tailor=1', icon: Target },
    { label: 'Cover Letters', href: '/cover-letters', icon: PenTool },
  ]

  const bottomNavItems: NavItem[] = [
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help', href: '/help', icon: HelpCircle },
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
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "relative bg-white border-r border-gray-200 transition-all duration-200 flex flex-col h-full",
          collapsed ? "w-[60px]" : "w-[240px]"
        )}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Logo/Home */}
        <div className="h-16 flex items-center px-3 border-b border-gray-100">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RC</span>
              </div>
              <span className="font-semibold text-gray-900">ResumeCraft</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">R</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          <div className="mb-2">
            {!collapsed && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
                Main
              </p>
            )}
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start relative group",
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    !collapsed && "mr-3"
                  )} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-gray-200" />

          {/* Bottom Navigation */}
          <div>
            {!collapsed && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 mb-2">
                Support
              </p>
            )}
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start relative group",
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    !collapsed && "mr-3"
                  )} />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        {/* More Menu */}
        <div className="p-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start text-gray-600 hover:text-gray-900",
              collapsed && "justify-center px-2"
            )}
          >
            <MoreHorizontal className={cn(
              "w-5 h-5 flex-shrink-0",
              !collapsed && "mr-3"
            )} />
            {!collapsed && <span>More</span>}
          </Button>
        </div>
      </aside>

      {/* Collapse Toggle - Vertical bar on edge */}
      <div
        className={cn(
          "relative w-1 hover:w-2 bg-gray-200 hover:bg-gray-300 transition-all cursor-col-resize group",
          "flex items-center justify-center"
        )}
        onClick={() => onCollapsedChange(!collapsed)}
      >
        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white border border-gray-300 rounded-full p-1 shadow-sm">
            {collapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </div>
        </div>
      </div>
    </>
  )
}