import type { ResumeData } from '@/lib/types'

interface UseResumeExportProps {
  localData: ResumeData
  activeTemplate: string
  resumeData: ResumeData
  showSkillLevelsInResume: boolean
}

export const useResumeExport = ({
  localData,
  activeTemplate,
  resumeData,
  showSkillLevelsInResume
}: UseResumeExportProps) => {
  const exportToPDF = async () => {
    try {
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
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${localData.personalInfo.name || 'resume'}.pdf`
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
