'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface AITailorButtonProps {
  jobId: string
  className?: string
}

export function AITailorButton({ jobId, className = '' }: AITailorButtonProps) {
  return (
    <Link href={`/jobs/${jobId}/tailor`} prefetch={true}>
      <button
        title="Tailor resume + cover letter for this job"
        className={`h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 flex items-center gap-1.5 text-sm font-medium transition-colors ${className}`}
      >
        <Sparkles className="w-3 h-3" />
        <span className="whitespace-nowrap">Tailor Profile</span>
      </button>
    </Link>
  )
}
