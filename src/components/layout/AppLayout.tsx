'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import AppHeader from '@/components/navigation/AppHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  User,
  Mail,
  Calendar,
  Award,
  Sparkles,
  BarChart,
  FileCheck,
  PenTool,
  LogOut,
  Menu
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [userName, setUserName] = React.useState<string>('')
  const [profileCompleteness, setProfileCompleteness] = React.useState(0)
  const [resumeCount, setResumeCount] = React.useState(0)
  const [variantCount, setVariantCount] = React.useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Resume', href: '/?edit=1', icon: FileText },
    { label: 'Job Browser', href: '/jobs', icon: Briefcase },
    { label: 'Tailor Resume', href: '/jobs?tailor=1', icon: Target },
    { label: 'Cover Letters', href: '/cover-letters', icon: PenTool },
    { label: 'Analytics', href: '/analytics', icon: BarChart },
  ]

  const secondaryNavItems: NavItem[] = [
    { label: 'Upload Resume', href: '/?upload=new', icon: Upload },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Help', href: '/help', icon: HelpCircle },
  ]

  React.useEffect(() => {
    let mounted = true

    const loadUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!mounted) return

      const user = sessionData.session?.user
      if (user) {
        setUserEmail(user.email || null)

        // Get user's resume data
        const { data: resumeData } = await supabase
          .from('resume_data')
          .select('personal_info, profile_completeness')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (resumeData && resumeData[0]) {
          const data = resumeData[0]
          setUserName(data.personal_info?.name || '')
          setProfileCompleteness(Math.round((data.profile_completeness || 0) * 100))
        }

        // Count resume variants
        const { count: variantCountData } = await supabase
          .from('resume_variants')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setVariantCount(variantCountData || 0)
      }
    }

    loadUserData()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) {
        loadUserData()
      } else {
        setUserEmail(null)
        setUserName('')
      }
    })

    return () => {
      sub.subscription.unsubscribe()
      mounted = false
    }
  }, [])

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return pathname === href
    if (href === '/jobs?tailor=1') return pathname.includes('/tailor')
    if (href === '/?edit=1') return pathname === '/' && !pathname.includes('/jobs')
    if (href === '/?upload=new') return pathname === '/' && pathname.includes('upload')
    return pathname.startsWith(href.split('?')[0])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Don't show sidebar on auth pages
  const showSidebar = !pathname.includes('/login') && !pathname.includes('/register') && !pathname.includes('/reset')

  if (!showSidebar) {
    return (
      <>
        <AppHeader />
        {children}
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Collapse Toggle */}
          <div className="p-3 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full justify-center"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* User Info Section */}
          {userEmail && (
            <div className={cn(
              "p-4 border-b border-gray-100",
              collapsed && "px-2"
            )}>
              {!collapsed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {userName ? userName[0].toUpperCase() : userEmail[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                  </div>

                  {/* Profile Completeness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Profile</span>
                      <span className="text-gray-900 font-medium">{profileCompleteness}%</span>
                    </div>
                    <Progress value={profileCompleteness} className="h-1.5" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-semibold text-gray-900">{variantCount}</p>
                      <p className="text-xs text-gray-600">Tailored</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {profileCompleteness >= 80 ? '✓' : '○'}
                      </p>
                      <p className="text-xs text-gray-600">Ready</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {userName ? userName[0].toUpperCase() : userEmail[0].toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                    collapsed && "px-0 justify-center"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
                  {!collapsed && (
                    <>
                      {item.label}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}

            {/* Separator */}
            <div className="my-4 border-t border-gray-200" />

            {/* Secondary Navigation */}
            {secondaryNavItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                    collapsed && "px-0 justify-center"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
                  {!collapsed && item.label}
                </Button>
              )
            })}
          </nav>

          {/* Logout Button */}
          {userEmail && (
            <div className="p-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
                  collapsed && "px-0 justify-center"
                )}
                onClick={handleLogout}
              >
                <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
                {!collapsed && "Logout"}
              </Button>
            </div>
          )}

          {/* Premium Upgrade (when not collapsed) */}
          {!collapsed && (
            <div className="p-4 border-t border-gray-100">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-900">Upgrade to Pro</p>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Unlimited tailored resumes & AI features
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </>
  )
}