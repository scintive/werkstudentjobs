import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X, Globe, Info } from 'lucide-react'

interface Language {
  name?: string
  language?: string  // Some templates expect 'language' instead of 'name'
  proficiency: string
  level?: string  // Some templates expect 'level' instead of 'proficiency'
}

interface LanguagesCardProps {
  languages: Language[]
  onLanguagesChange: (languages: Language[]) => void
  expandedSections: { languages: boolean }
  toggleSection: (section: 'languages') => void
}

// Group proficiency levels for better UX
const proficiencyGroups = [
  {
    label: 'Professional Levels',
    options: [
      { value: 'Native or bilingual', display: 'Native/Bilingual' },
      { value: 'Full professional', display: 'Full Professional' },
      { value: 'Professional working', display: 'Professional Working' }
    ]
  },
  {
    label: 'CEFR Levels (European Standard)',
    options: [
      { value: 'C2', display: 'C2 - Mastery' },
      { value: 'C1', display: 'C1 - Advanced' },
      { value: 'B2', display: 'B2 - Upper Intermediate' },
      { value: 'B1', display: 'B1 - Intermediate' },
      { value: 'A2', display: 'A2 - Elementary' },
      { value: 'A1', display: 'A1 - Beginner' }
    ]
  },
  {
    label: 'Basic Levels',
    options: [
      { value: 'Limited working', display: 'Limited Working' },
      { value: 'Elementary', display: 'Elementary' }
    ]
  }
]

export default function LanguagesCard({
  languages,
  onLanguagesChange,
  expandedSections,
  toggleSection
}: LanguagesCardProps) {
  const [newLanguage, setNewLanguage] = useState('')

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      // Default to B2 for new languages (common intermediate level)
      // Include both 'name' and 'language' for compatibility
      const newLang = {
        name: newLanguage.trim(),
        language: newLanguage.trim(),
        proficiency: 'B2',
        level: 'B2'
      }
      const updatedLanguages = [...languages, newLang]
      onLanguagesChange(updatedLanguages)
      setNewLanguage('')
    }
  }

  const handleRemoveLanguage = (index: number) => {
    const updatedLanguages = languages.filter((_, i) => i !== index)
    onLanguagesChange(updatedLanguages)
  }

  const handleProficiencyChange = (index: number, proficiency: string) => {
    const updatedLanguages = [...languages]
    updatedLanguages[index] = {
      ...updatedLanguages[index],
      proficiency,
      level: proficiency  // Keep both for compatibility
    }
    onLanguagesChange(updatedLanguages)
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => toggleSection('languages')}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Languages</h3>
          {languages.length > 0 && (
            <span className="text-sm text-gray-500 bg-purple-50 px-2 py-0.5 rounded-full">
              {languages.length}
            </span>
          )}
        </div>
        {expandedSections.languages ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {expandedSections.languages && (
        <div className="p-4 pt-0 space-y-3">
          {/* Info tip about CEFR levels */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 text-xs text-purple-700 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Tip:</strong> In Germany/Europe, CEFR levels (A1-C2) are widely recognized.
              C2 = Native level, B2 = Good working knowledge.
            </div>
          </div>
          {languages.map((language, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 p-2.5 rounded-md border border-gray-200">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">{language.name || language.language}</span>
                <select
                  value={language.proficiency}
                  onChange={(e) => handleProficiencyChange(index, e.target.value)}
                  className="ml-auto px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  {proficiencyGroups.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.display}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveLanguage(index)
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
              placeholder="Add a new language..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleAddLanguage}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}