'use client'

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AITailorButtonProps {
  jobId: string
  className?: string
}

export function AITailorButton({ jobId, className = '' }: AITailorButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/jobs/${jobId}/tailor`)}
      title="Tailor resume + cover letter for this job"
      className={`btn btn-success ${className}`}
    >
      <Sparkles className="w-5 h-5 flex-shrink-0" />
      <span className="whitespace-nowrap">AI Tailor Apply</span>
    </button>
  )
}
