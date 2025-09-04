'use client'

import * as React from 'react'
import { JobBrowser } from '@/components/jobs/JobBrowser'
import { SupabaseResumeProvider } from '@/lib/contexts/SupabaseResumeContext'
import { EditModeProvider } from '@/lib/contexts/EditModeContext'

// This page now uses the full-featured JobBrowser component
// instead of the basic job list
export default function JobsPage() {
  const handleJobSelect = (job: any) => {
    // Navigate to tailor page when job is selected
    window.location.href = `/jobs/${job.id}/tailor`
  }

  return (
    <SupabaseResumeProvider autoSaveInterval={2000}>
      <EditModeProvider>
        <JobBrowser 
          onJobSelect={handleJobSelect}
          className="min-h-screen"
        />
      </EditModeProvider>
    </SupabaseResumeProvider>
  )
}