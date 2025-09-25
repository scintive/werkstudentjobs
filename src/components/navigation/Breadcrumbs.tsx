'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/')
      let label = path.charAt(0).toUpperCase() + path.slice(1)

      // Special cases for better labels
      if (path === 'jobs') label = 'Jobs'
      else if (path === 'tailor') label = 'Tailor Resume'
      else if (path === 'dashboard') label = 'Dashboard'
      else if (path.match(/^[a-f0-9-]{36}$/)) label = 'Details' // UUID

      breadcrumbs.push({
        label,
        href: index === paths.length - 1 ? undefined : href
      })
    })

    return breadcrumbs
  }

  const breadcrumbItems = generateBreadcrumbs()

  if (breadcrumbItems.length === 0) return null

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      <Link
        href="/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}