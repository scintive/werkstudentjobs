'use client'

import * as React from 'react'
import { Trash2, Calendar } from 'lucide-react'
import type { ResumeData } from '@/lib/types'
import { CleanInput } from '../PerfectStudio'

interface CertificationsSectionProps {
  localData: ResumeData
  setLocalData: (data: ResumeData) => void
}

export const CertificationsSection = React.memo(({
  localData,
  setLocalData
}: CertificationsSectionProps) => {
  return (
    <div className="space-y-3">
      {localData.certifications?.map((cert, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
          <button
            onClick={() => {
              setLocalData({
                ...localData,
                certifications: localData.certifications?.filter((_, i) => i !== index) || []
              })
            }}
            className="absolute top-2 right-2 p-1 hover:bg-red-50 rounded text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <CleanInput
              label="Certification Name"
              value={cert.name}
              onChange={(value: any) => {
                const newCerts = [...(localData.certifications || [])]
                newCerts[index].name = value
                setLocalData({ ...localData, certifications: newCerts })
              }}
              placeholder="e.g., AWS Certified Developer"
            />
            <CleanInput
              label="Issuing Organization"
              value={cert.issuer}
              onChange={(value: any) => {
                const newCerts = [...(localData.certifications || [])]
                newCerts[index].issuer = value
                setLocalData({ ...localData, certifications: newCerts })
              }}
              placeholder="e.g., Amazon Web Services"
            />
            <CleanInput
              label="Date Obtained"
              value={cert.date}
              onChange={(value: any) => {
                const newCerts = [...(localData.certifications || [])]
                newCerts[index].date = value
                setLocalData({ ...localData, certifications: newCerts })
              }}
              placeholder="e.g., Jan 2024"
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
        </div>
      ))}
    </div>
  )
})

CertificationsSection.displayName = 'CertificationsSection'
