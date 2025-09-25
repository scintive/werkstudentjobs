'use client'

import Link from 'next/link'
import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  FileText,
  Briefcase,
  Settings,
  LogOut,
  User,
  Upload,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  PenTool,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

export default function AppHeader() {
  const [email, setEmail] = React.useState<string | null>(null)
  const [userName, setUserName] = React.useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navigationItems: NavigationItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Resume', href: '/?edit=1', icon: FileText },
    { label: 'Jobs', href: '/jobs', icon: Briefcase, badge: 'New' },
    { label: 'Tailor', href: '/jobs?tailor=1', icon: Target },
  ]

  React.useEffect(() => {
    let mounted = true

    const loadUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!mounted) return

      const user = sessionData.session?.user
      if (user) {
        setEmail(user.email || null)

        // Try to get user's name from resume_data
        const { data: resumeData } = await supabase
          .from('resume_data')
          .select('personal_info')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (resumeData && resumeData[0]) {
          setUserName(resumeData[0].personal_info?.name || '')
        }
      }
    }

    loadUserData()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email || null)
      if (session?.user && !userName) {
        loadUserData()
      }
    })

    return () => {
      sub.subscription.unsubscribe()
      mounted = false
    }
  }, [userName])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return pathname === href
    if (href === '/jobs?tailor=1') return pathname.includes('/tailor')
    if (href === '/?edit=1') return pathname === '/' && !pathname.includes('/jobs')
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
                ResumeCraft AI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right side - User menu or Auth buttons */}
          <div className="flex items-center gap-3">
            {email ? (
              <>
                {/* Quick Actions */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => router.push('/?upload=new')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {userName ? userName[0].toUpperCase() : email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {userName || 'User'}
                          </p>
                          <p className="text-xs text-gray-500">{email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/?edit=1')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Edit Resume
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/login')}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/register')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Progress bar for loading states */}
      <div className="h-0.5 bg-gray-100">
        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300" style={{ width: '0%' }} />
      </div>
    </header>
  )
}