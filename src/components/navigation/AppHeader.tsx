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
  Sparkles,
  LayoutDashboard,
  PenTool,
  Target,
  Bell
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
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const navigationItems: NavigationItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Jobs', href: '/jobs', icon: Briefcase },
  ]

  React.useEffect(() => {
    let mounted = true

    const loadUserData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!mounted) return

      const user = sessionData.session?.user
      if (user) {
        setEmail(user.email || null)

        // Try to get user's name and photo from resume_data
        const { data: resumeData } = await supabase
          .from('resume_data')
          .select('personal_info, photo_url')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (resumeData && resumeData[0]) {
          setUserName(resumeData[0].personal_info?.name || '')
          setPhotoUrl(resumeData[0].photo_url || null)
        }

        // If no name from resume_data, fallback to auth metadata
        if (!resumeData?.[0]?.personal_info?.name && user.user_metadata?.name) {
          setUserName(user.user_metadata.name)
        }

        // If no photo in resume_data, check user_profiles
        if (!resumeData?.[0]?.photo_url) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('photo_url')
            .eq('user_id', user.id)
            .single()

          if (profileData?.photo_url) {
            setPhotoUrl(profileData.photo_url)
          }
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
    if (href === '/edit-resume') return pathname === '/edit-resume'
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href={email ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <span className="text-white font-bold">W</span>
              </div>
              <span className="font-bold text-xl hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                WerkStudentJobs
              </span>
            </Link>

            {/* Desktop Navigation - Only show when authenticated */}
            {email && (
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
                          ? "bg-orange-50 text-orange-600 font-medium"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
            )}
          </div>

          {/* Right side - User menu or Auth buttons */}
          <div className="flex items-center gap-3">
            {email ? (
              <>
                {/* Edit Resume Button */}
                <Link href="/edit-resume" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Resume
                  </Button>
                </Link>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <div className="flex items-center gap-2">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={userName || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                            <span className="text-white text-sm font-medium">
                              {userName ? userName[0].toUpperCase() : email[0].toUpperCase()}
                            </span>
                          </div>
                        )}
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
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/help')}>
                      <User className="mr-2 h-4 w-4" />
                      Help & Support
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
                <Link href="/login" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" prefetch={true}>
                  <Button
                    size="sm"
                    style={{ background: 'var(--primary)' }}
                    className="hover:opacity-90 text-white"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  )
}