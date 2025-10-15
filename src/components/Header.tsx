'use client'

import Link from 'next/link'
import * as React from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function Header() {
  const [email, setEmail] = React.useState<string | null>(null)
  const pathname = usePathname()

  React.useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setEmail(data.session?.user?.email || null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email || null)
    })
    return () => { sub.subscription.unsubscribe(); mounted = false }
  }, [])

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === href ? 'text-blue-700' : 'text-gray-700 hover:text-gray-900'}`}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/werkstudentjobslogo.png"
              alt="WerkStudentJobs"
              className="h-10 w-auto transition-transform duration-200 group-hover:scale-105"
            />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-normal text-blue-600">
                WerkStudentJobs
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50/50 text-blue-600/60 border border-blue-200/30">
                Free Preview
              </span>
            </div>
          </Link>
          {email && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/jobs" label="Jobs" />
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">{email}</span>
              <Link href="/logout" className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Logout</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Sign in</Link>
              <Link href="/register" className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

