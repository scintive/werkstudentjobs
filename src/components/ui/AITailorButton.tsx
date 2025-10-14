'use client'

import * as React from 'react'
import Link from 'next/link'
import { Sparkles, CheckCircle2 } from 'lucide-react'

interface AITailorButtonProps {
  jobId: string
  className?: string
  isTailored?: boolean
  matchScore?: number
}

export function AITailorButton({ jobId, className = '', isTailored = false, matchScore }: AITailorButtonProps) {
  if (isTailored) {
    return (
      <Link href={`/jobs/${jobId}/tailor`} prefetch={true}>
        <button
          title={`View tailored profile${matchScore ? ` (${matchScore}% match)` : ''}`}
          className={`h-7 rounded-md bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-700 text-white px-3 flex items-center gap-1.5 text-sm font-semibold transition-all shadow-sm hover:shadow-md ${className}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span className="whitespace-nowrap">Tailored</span>
          {matchScore && (
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">
              {matchScore}%
            </span>
          )}
        </button>
      </Link>
    )
  }

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
