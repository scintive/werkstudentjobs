'use client'

import * as React from 'react'
import { Trash2, X, Plus, Calendar } from 'lucide-react'
import type { ResumeData } from '@/lib/types'
import { CleanInput } from '../PerfectStudio'
import { EnhancedRichText } from '../enhanced-rich-text'
import { SuggestionIndicator, SuggestionBadge } from '../SuggestionIndicator'

interface ExperienceSectionProps {
  localData: ResumeData
  setLocalData: (data: ResumeData) => void
  suggestionsEnabled: boolean
  getSuggestionsForSection: (section: string) => unknown[]
  getSuggestionForField: (field: string) => unknown
  acceptSuggestion: (id: string) => void
  declineSuggestion: (id: string) => void
  InlineSuggestionRow: React.ComponentType<{ s: unknown }>
}

export const ExperienceSection = React.memo(({
  localData,
  setLocalData,
  suggestionsEnabled,
  getSuggestionsForSection,
  getSuggestionForField,
  acceptSuggestion,
  declineSuggestion,
  InlineSuggestionRow
}: ExperienceSectionProps) => {
  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {localData.experience.map((exp, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
          <button
            onClick={() => {
              setLocalData({
                ...localData,
                experience: localData.experience.filter((_, i) => i !== index)
              })
            }}
            className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500 z-10"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <CleanInput
              label="Position"
              value={exp.position}
              onChange={(value: any) => {
                const newExp = [...localData.experience]
                newExp[index].position = value
                setLocalData({ ...localData, experience: newExp })
              }}
            />
            <CleanInput
              label="Company"
              value={exp.company}
              onChange={(value: any) => {
                const newExp = [...localData.experience]
                newExp[index].company = value
                setLocalData({ ...localData, experience: newExp })
              }}
            />
          </div>

          <CleanInput
            label="Duration"
            value={exp.duration}
            onChange={(value: any) => {
              const newExp = [...localData.experience]
              newExp[index].duration = value
              setLocalData({ ...localData, experience: newExp })
            }}
            icon={<Calendar className="w-4 h-4" />}
          />

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">
              Responsibilities & Achievements
              {/* Show suggestion count for this experience */}
              {suggestionsEnabled && (
                <span className="ml-2">
                  <SuggestionBadge
                    count={getSuggestionsForSection('experience').filter(s =>
                      s.targetPath?.startsWith(`experience.${index}`)
                    ).length}
                    section={`experience-${index}`}
                  />
                </span>
              )}
            </label>
            {/* Render suggestions not anchored to an existing bullet (e.g., additions) */}
            {suggestionsEnabled && (
              <div className="space-y-2 mb-2">
                {getSuggestionsForSection('experience')
                  .filter(s => s.targetPath?.startsWith(`experience.${index}`))
                  .map((s, i) => (
                    <InlineSuggestionRow key={`${s.id}-${i}`} s={s} />
                  ))}
              </div>
            )}
            {exp.achievements?.map((achievement, achIndex) => {
              const suggestionPath = `experience.${index}.achievements.${achIndex}`
              const suggestion = suggestionsEnabled ? getSuggestionForField(suggestionPath) : null

              return (
                <div key={achIndex} className="space-y-1 mb-2">
                  {/* Show suggestion indicator if available */}
                  {suggestion && (
                    <SuggestionIndicator
                      suggestion={suggestion}
                      onAccept={acceptSuggestion}
                      onDecline={declineSuggestion}
                      compact={false}
                    />
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <EnhancedRichText
                      value={achievement}
                      onChange={(value: any) => {
                        const newExp = [...localData.experience]
                        newExp[index].achievements[achIndex] = value
                        setLocalData({ ...localData, experience: newExp })
                      }}
                      showHighlight
                      placeholder="Describe key responsibility or achievement..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => {
                        const newExp = [...localData.experience]
                        newExp[index].achievements = newExp[index].achievements.filter((_, i) => i !== achIndex)
                        setLocalData({ ...localData, experience: newExp })
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
            <button
              onClick={() => {
                const newExp = [...localData.experience]
                newExp[index].achievements = [...(newExp[index].achievements || []), '']
                setLocalData({ ...localData, experience: newExp })
              }}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1 mt-2"
            >
              <Plus className="w-3 h-3" />
              Add Responsibility
            </button>
          </div>
        </div>
      ))}
    </div>
  )
})

ExperienceSection.displayName = 'ExperienceSection'
