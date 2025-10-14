import type { ResumeData } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

interface UseResumeExportProps {
  localData: ResumeData
  activeTemplate: string
  resumeData: ResumeData
  showSkillLevelsInResume: boolean
  variantId?: string | null
}

export const useResumeExport = ({
  localData,
  activeTemplate,
  resumeData,
  showSkillLevelsInResume,
  variantId
}: UseResumeExportProps) => {
  const exportToPDF = async () => {
    try {
      // If variantId is available (tailor mode), use GET endpoint with proper filename
      if (variantId) {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token

        if (!token) {
          console.warn('No auth token available for variant download')
          // Fall through to POST method
        } else {
          const response = await fetch(`/api/resume/pdf-download?variant_id=${variantId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `${localData.personalInfo.name || 'resume'}.pdf` // fallback
            if (contentDisposition) {
              const matches = /filename="([^"]+)"/.exec(contentDisposition)
              if (matches && matches[1]) {
                filename = matches[1]
              }
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            a.click()
            window.URL.revokeObjectURL(url)
            return
          }
          // If GET failed, fall through to POST method
        }
      }

      // Fallback: Use POST endpoint (for base resume mode)
      const response = await fetch('/api/resume/pdf-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: localData,
          template: activeTemplate,
          userProfile: resumeData,
          showSkillLevelsInResume: showSkillLevelsInResume
        })
      })

      if (response.ok) {
        // Extract filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = `${localData.personalInfo.name || 'resume'}.pdf` // fallback
        if (contentDisposition) {
          const matches = /filename="([^"]+)"/.exec(contentDisposition)
          if (matches && matches[1]) {
            filename = matches[1]
          }
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('PDF export failed:', error)
    }
  }

  return {
    exportToPDF
  }
}
