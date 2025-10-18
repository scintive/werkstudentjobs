'use client'

import * as React from 'react'
import { Trash2, X, Calendar } from 'lucide-react'
import type { ResumeData } from '@/lib/types'
import { CleanInput } from '../PerfectStudio'
import { SuggestionIndicator, SuggestionBadge } from '../SuggestionIndicator'

interface ProjectsSectionProps {
  localData: ResumeData
  setLocalData: (data: ResumeData) => void
  suggestionsEnabled: boolean
  getSuggestionsForSection: (section: string) => unknown[]
  getSuggestionForField: (field: string) => unknown
  acceptSuggestion: (id: string) => void
  declineSuggestion: (id: string) => void
}

export const ProjectsSection = React.memo(({
  localData,
  setLocalData,
  suggestionsEnabled,
  getSuggestionsForSection,
  getSuggestionForField,
  acceptSuggestion,
  declineSuggestion
}: ProjectsSectionProps) => {
  return (
    <div className="space-y-4">
      {localData.projects?.map((project, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
          <button
            onClick={() => {
              setLocalData({
                ...localData,
                projects: localData.projects?.filter((_, i) => i !== index) || []
              })
            }}
            className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <CleanInput
              label="Project Name"
              value={project.name}
              onChange={(value: any) => {
                const newProjects = [...(localData.projects || [])]
                newProjects[index].name = value
                setLocalData({ ...localData, projects: newProjects })
              }}
              placeholder="e.g., E-commerce Platform"
            />
            <CleanInput
              label="Date/Duration"
              value={project.date || ''}
              onChange={(value: any) => {
                const newProjects = [...(localData.projects || [])]
                newProjects[index].date = value
                setLocalData({ ...localData, projects: newProjects })
              }}
              placeholder="e.g., Jan 2024 - Mar 2024"
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
              Description
              {/* Show suggestion badge for this project */}
              {suggestionsEnabled && (
                <span className="ml-2">
                  <SuggestionBadge
                    count={getSuggestionsForSection('projects').filter(s =>
                      s.targetPath === `projects.${index}`
                    ).length}
                    section={`project-${index}`}
                  />
                </span>
              )}
            </label>
            {/* Show suggestion indicator if available */}
            {suggestionsEnabled && getSuggestionForField(`projects.${index}`) && (
              <div className="mb-2">
                <SuggestionIndicator
                  suggestion={getSuggestionForField(`projects.${index}`)!}
                  onAccept={acceptSuggestion}
                  onDecline={declineSuggestion}
                  compact={false}
                />
              </div>
            )}
            <CleanInput
              value={project.description}
              onChange={(value: any) => {
                const newProjects = [...(localData.projects || [])]
                newProjects[index].description = value
                setLocalData({ ...localData, projects: newProjects })
              }}
              placeholder="Brief description of the project..."
              multiline
            />
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Technologies Used
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {project.technologies?.map((tech, techIndex) => (
                <span key={techIndex} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs">
                  {tech}
                  <button
                    onClick={() => {
                      const newProjects = [...(localData.projects || [])]
                      newProjects[index].technologies = newProjects[index].technologies?.filter((_, i) => i !== techIndex) || []
                      setLocalData({ ...localData, projects: newProjects })
                    }}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add technology (press Enter)"
                className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs"
                onKeyPress={(e: any) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    const newProjects = [...(localData.projects || [])]
                    newProjects[index].technologies = [...(newProjects[index].technologies || []), (e.target as HTMLInputElement).value.trim()]
                    setLocalData({ ...localData, projects: newProjects });
                    (e.target as HTMLInputElement).value = ''
                  }
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

ProjectsSection.displayName = 'ProjectsSection'
