'use client'

import * as React from 'react'
import { Camera, Upload, X, User, Briefcase, Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { ResumeData } from '@/lib/types'
import { CleanInput } from '../PerfectStudio'
import { EnhancedRichText } from '../enhanced-rich-text'
import { SuggestionIndicator, SuggestionBadge } from '../SuggestionIndicator'

interface PersonalInfoSectionProps {
  localData: ResumeData & { photoUrl?: string | null }
  setLocalData: (data: any) => void
  updateField: (field: string, value: any) => void
  saveNow: () => Promise<void>
  setImageToCrop: (url: string) => void
  suggestionsEnabled: boolean
  getSuggestionForField: (field: string) => any
  acceptSuggestion: (id: string) => void
  declineSuggestion: (id: string) => void
  getSuggestionsForSection: (section: string) => any[]
  InlineSummarySuggestions: React.ComponentType
}

export const PersonalInfoSection = React.memo(({
  localData,
  setLocalData,
  updateField,
  saveNow,
  setImageToCrop,
  suggestionsEnabled,
  getSuggestionForField,
  acceptSuggestion,
  declineSuggestion,
  getSuggestionsForSection,
  InlineSummarySuggestions
}: PersonalInfoSectionProps) => {
  // Debug logging
  React.useEffect(() => {
    console.log('🖼️ PersonalInfoSection - photoUrl:', (localData as any).photoUrl)
  }, [(localData as any).photoUrl])

  return (
    <>
      {/* Photo Upload Section */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
        <div className="flex items-center gap-4">
          {(localData as any).photoUrl ? (
            <div className="relative">
              <img
                src={(localData as any).photoUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                onClick={async () => {
                  try {
                    // Delete photo - let the context handle saving to variant or base resume
                    setLocalData({ ...localData, photoUrl: null } as any)
                    updateField('photoUrl' as any, null)

                    // Force immediate save (context will save to variant in tailor mode, or base resume in base mode)
                    await saveNow()
                  } catch (error) {
                    console.error('Failed to delete photo:', error)
                  }
                }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                if (!file.type.startsWith('image/')) {
                  alert('Please upload an image file')
                  return
                }
                if (file.size > 10 * 1024 * 1024) {
                  alert('Image size must be less than 10MB')
                  return
                }

                // Create object URL for cropping
                const imageUrl = URL.createObjectURL(file)
                setImageToCrop(imageUrl)
              }}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              {(localData as any).photoUrl ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP or GIF • Max 10MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CleanInput
          label="Full Name"
          value={localData.personalInfo.name}
          onChange={(value) => setLocalData({
            ...localData,
            personalInfo: { ...localData.personalInfo, name: value }
          })}
          icon={<User className="w-4 h-4" />}
        />
        <CleanInput
          label="Professional Title"
          value={localData.professionalTitle}
          onChange={(value) => {
            setLocalData({
              ...localData,
              professionalTitle: value
            })
            // Auto-save professional title
            try {
              updateField('professionalTitle', value)
            } catch {}
          }}
          icon={<Briefcase className="w-4 h-4" />}
        />
      {suggestionsEnabled && getSuggestionForField('title') && (
        <div className="col-span-2 -mt-2">
          <SuggestionIndicator
            suggestion={getSuggestionForField('title')!}
            onAccept={acceptSuggestion}
            onDecline={declineSuggestion}
          />
        </div>
      )}
        <CleanInput
          label="Email"
          value={localData.personalInfo.email}
          onChange={(value) => setLocalData({
            ...localData,
            personalInfo: { ...localData.personalInfo, email: value }
          })}
          icon={<Mail className="w-4 h-4" />}
        />
        <CleanInput
          label="Phone"
          value={localData.personalInfo.phone}
          onChange={(value) => setLocalData({
            ...localData,
            personalInfo: { ...localData.personalInfo, phone: value }
          })}
          icon={<Phone className="w-4 h-4" />}
        />
        <CleanInput
          label="Location"
          value={localData.personalInfo.location}
          onChange={(value) => setLocalData({
            ...localData,
            personalInfo: { ...localData.personalInfo, location: value }
          })}
          icon={<MapPin className="w-4 h-4" />}
        />
        <CleanInput
          label="LinkedIn Profile"
          value={localData.personalInfo.linkedin || ''}
          onChange={(value) => setLocalData({
            ...localData,
            personalInfo: { ...localData.personalInfo, linkedin: value }
          })}
          placeholder="e.g., linkedin.com/in/yourprofile"
          icon={<Linkedin className="w-4 h-4" />}
        />
        <CleanInput
          label="Portfolio/Website"
          value={localData.personalInfo.website || ''}
          onChange={(value) => setLocalData({
            ...localData,
            personalInfo: { ...localData.personalInfo, website: value }
          })}
          placeholder="e.g., yourportfolio.com or github.com/username"
          icon={<Globe className="w-4 h-4" />}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider">
            Professional Summary
          </label>
          <SuggestionBadge
            count={getSuggestionsForSection('summary').length}
            section="summary"
          />
        </div>
        {localData.enableProfessionalSummary && (
          <div className="space-y-2">
            {/* Always-visible inline summary suggestions */}
            {suggestionsEnabled && <InlineSummarySuggestions />}
            <EnhancedRichText
              value={localData.professionalSummary}
              onChange={(value) => setLocalData({
                ...localData,
                professionalSummary: value
              })}
              multiline
              showHighlight
              placeholder="Write a compelling professional summary..."
              className="min-h-[100px]"
            />
          </div>
        )}
        {!localData.enableProfessionalSummary && (
          <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg">
            Professional summary is disabled and won't appear on your resume.
          </div>
        )}
      </div>
    </>
  )
})

PersonalInfoSection.displayName = 'PersonalInfoSection'
