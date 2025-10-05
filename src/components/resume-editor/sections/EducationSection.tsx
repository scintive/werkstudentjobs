'use client'

import * as React from 'react'
import { Trash2, Calendar, GraduationCap } from 'lucide-react'
import type { ResumeData } from '@/lib/types'
import { CleanInput } from '../PerfectStudio'

interface EducationSectionProps {
  localData: ResumeData
  setLocalData: (data: ResumeData) => void
  handleRemoveEducation: (index: number) => void
}

export const EducationSection = React.memo(({
  localData,
  setLocalData,
  handleRemoveEducation
}: EducationSectionProps) => {
  return (
    <div className="space-y-4">
      {localData.education.length > 0 ? (
        localData.education.map((edu, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg relative group">
            <button
              onClick={() => handleRemoveEducation(index)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CleanInput
                label="Degree"
                value={edu.degree}
                onChange={(value) => {
                  const newEdu = [...localData.education]
                  newEdu[index].degree = value
                  setLocalData({ ...localData, education: newEdu })
                }}
                placeholder="e.g., Bachelor of Science"
              />
              <CleanInput
                label="Field of Study"
                value={edu.field_of_study || (edu as any).field || ''}
                onChange={(value) => {
                  const newEdu = [...localData.education]
                  newEdu[index].field_of_study = value
                  setLocalData({ ...localData, education: newEdu })
                }}
                placeholder="e.g., Computer Science"
              />
              <CleanInput
                label="Institution"
                value={edu.institution}
                onChange={(value) => {
                  const newEdu = [...localData.education]
                  newEdu[index].institution = value
                  setLocalData({ ...localData, education: newEdu })
                }}
                placeholder="University name"
              />
              <CleanInput
                label="Duration"
                value={edu.duration || (edu as any).year || ''}
                onChange={(value) => {
                  const newEdu = [...localData.education]
                  newEdu[index].duration = value
                  setLocalData({ ...localData, education: newEdu })
                }}
                placeholder="e.g., 2020-2024"
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-4">No education added yet</p>
          <button
            onClick={() => {
              setLocalData({
                ...localData,
                education: [...localData.education, {
                  degree: '',
                  field_of_study: '',
                  institution: '',
                  duration: ''
                }]
              })
            }}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Add your first degree
          </button>
        </div>
      )}
    </div>
  )
})

EducationSection.displayName = 'EducationSection'
