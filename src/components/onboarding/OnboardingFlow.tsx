'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowRight, ArrowLeft, Check, Upload, FileText, Sparkles, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { ImageCropModal } from '@/components/resume-editor/ImageCropModal'
import { FileUpload } from '@/components/ui/file-upload'
interface OnboardingData {
  // Resume data
  resumeExtracted?: boolean
  resumeData?: any
  organizedSkills?: any

  // Profile data
  photo?: File
  photoUrl?: string
  hoursAvailable?: number
  currentSemester?: number
  universityName?: string
  startPreference?: 'immediately' | 'within_month' | 'within_3_months' | 'flexible'
}

interface OnboardingFlowProps {
  onComplete: () => void
  userId: string
  userEmail: string
}

export function OnboardingFlow({ onComplete, userId, userEmail }: OnboardingFlowProps) {
  const [step, setStep] = useState(0) // Start at 0 for resume upload
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null)

  // Resume upload states
  const [uploadState, setUploadState] = useState<{
    status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
    progress: number
    error?: string
    file?: File
  }>({ status: 'idle', progress: 0 })
  const [extractedProfile, setExtractedProfile] = useState<any>(null)

  // University autocomplete states
  const [universitySearch, setUniversitySearch] = useState('')
  const [universitySuggestions, setUniversitySuggestions] = useState<Array<{name: string, display: string, city: string, state: string}>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [universityLoading, setUniversityLoading] = useState(false)

  const totalSteps = 6 // 0-5: Resume, Photo, Hours, Semester, University, Start

  // Resume upload handler
  const handleFileUpload = async (file: File) => {
    setUploadState({
      status: 'uploading',
      progress: 25,
      file
    })

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 50
      }))

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/extract', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to extract profile from resume')
      }

      const result = await response.json()

      // DEBUG: Log what was extracted
      console.log('🔍 === ONBOARDING EXTRACTION DEBUG ===')
      console.log('🔍 Experience count:', (result.profile.experience || []).length)
      if (result.profile.experience && result.profile.experience.length > 0) {
        result.profile.experience.forEach((exp: any, idx: number) => {
          console.log(`🔍 Experience ${idx + 1}:`, {
            company: exp.company,
            position: exp.position,
            responsibilities_count: (exp.responsibilities || []).length,
            has_responsibilities: !!exp.responsibilities
          })
        })
      }
      console.log('🔍 Certifications count:', (result.profile.certifications || []).length)
      if (result.profile.certifications && result.profile.certifications.length > 0) {
        result.profile.certifications.forEach((cert: any, idx: number) => {
          console.log(`🔍 Certification ${idx + 1}:`, {
            title: cert.title,
            institution: cert.institution,
            date: cert.date
          })
        })
      }
      console.log('🔍 === END ONBOARDING DEBUG ===')

      setUploadState(prev => ({
        ...prev,
        progress: 100
      }))

      await new Promise(resolve => setTimeout(resolve, 500))

      setExtractedProfile(result.profile)
      setData({
        ...data,
        resumeExtracted: true,
        resumeData: result.profile,
        organizedSkills: result.organizedSkills
      })

      // Save extracted resume data to database immediately (like /upload does)
      console.log('💾 Saving extracted resume data to database immediately...')
      try {
        // Import ResumeDataService
        const { ResumeDataService } = await import('@/lib/services/resumeDataService')
        const resumeService = ResumeDataService.getInstance()

        // Filter out invalid certifications (empty or undefined title)
        const validCertifications = (result.profile.certifications || []).filter((cert: any) =>
          cert && cert.title && typeof cert.title === 'string' && cert.title.trim() !== '' && cert.title.toLowerCase() !== 'undefined'
        )
        console.log('🔍 Filtered certifications:', validCertifications.length, 'out of', (result.profile.certifications || []).length)

        // Convert profile to ResumeData format (EXACT COPY from ElegantTemplateBar.tsx working logic)
        const resumeData: any = {
          personalInfo: {
            name: result.profile.personal_details?.name || 'Unknown',
            email: result.profile.personal_details?.contact?.email || '',
            phone: result.profile.personal_details?.contact?.phone || '',
            location: result.profile.personal_details?.contact?.address || '',
            linkedin: result.profile.personal_details?.contact?.linkedin || ''
          },
          professionalTitle: result.profile.professional_title || "Professional",
          professionalSummary: result.profile.professional_summary || "",
          enableProfessionalSummary: !!result.profile.professional_summary,
          skills: {
            technical: result.profile.skills?.technology || [],
            soft_skills: result.profile.skills?.soft_skills || [],
            tools: result.profile.skills?.design || []
          },
          experience: (result.profile.experience || []).map((exp: any) => ({
            company: exp.company,
            position: exp.position,
            duration: exp.duration,
            achievements: exp.responsibilities
          })),
          education: (result.profile.education || []).map((edu: any) => ({
            degree: edu.degree,
            field_of_study: edu.field_of_study,
            institution: edu.institution,
            year: ((edu as Record<string, any>).year ? String((edu as Record<string, any>).year) : edu.duration) || ''
          })),
          projects: (result.profile.projects || []).map((proj: any) => ({
            name: proj.title,
            description: proj.description,
            technologies: [],
            date: "2023"
          })),
          languages: (result.profile.languages || []).map((lang: any) => {
            if (typeof lang === 'string') {
              const match = lang.match(/^(.+?)\s*\((.+?)\)$/)
              if (match) {
                return {
                  name: match[1].trim(),
                  language: match[1].trim(),
                  level: match[2].trim(),
                  proficiency: match[2].trim()
                }
              }
              return {
                name: lang,
                language: lang,
                level: 'Not specified',
                proficiency: 'Not specified'
              }
            }
            return {
              name: lang.language || lang.name || '',
              language: lang.language || lang.name || '',
              level: lang.proficiency || lang.level || 'Not specified',
              proficiency: lang.proficiency || lang.level || 'Not specified'
            }
          }),
          certifications: (result.profile.certifications || []).map((cert: any) => ({
            name: cert.title,
            issuer: cert.issuer || cert.institution || '',
            date: cert.date || '',
            description: cert.description || ''
          })),
          customSections: result.profile.custom_sections || []
        }

        await resumeService.getOrCreateResumeData() // Initialize
        await resumeService.saveResumeData(resumeData, 'swiss')
        console.log('✅ Resume data saved to database immediately after extraction')
      } catch (saveError) {
        console.error('❌ Failed to save resume data immediately:', saveError)
        // Don't fail the upload, just log the error
      }

      setUploadState(prev => ({
        ...prev,
        status: 'success'
      }))

    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to process resume'
      })
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' })
    setData({ ...data, photo: file })

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(croppedBlob)

    setShowCropModal(false)
    setTempImageSrc(null)
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setTempImageSrc(null)
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/profile.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      return null
    }
  }

  // University search handler
  const handleUniversitySearchChange = async (value: string) => {
    setUniversitySearch(value)
    setData({ ...data, universityName: value })

    if (value.length >= 2) {
      setUniversityLoading(true)
      try {
        const response = await fetch(`/api/universities/search?q=${encodeURIComponent(value)}&limit=10`)
        const result = await response.json()

        if (result.universities) {
          setUniversitySuggestions(result.universities)
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error searching universities:', error)
      } finally {
        setUniversityLoading(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const selectUniversity = (university: {name: string, display: string}) => {
    setUniversitySearch(university.name)
    setData({ ...data, universityName: university.name })
    setShowSuggestions(false)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      let photoUrl = data.photoUrl

      if (data.photo) {
        photoUrl = await uploadPhoto(data.photo) || undefined
      }

      // Check if user_profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      const profileData = {
        photo_url: photoUrl,
        hours_available: data.hoursAvailable,
        current_semester: data.currentSemester,
        university_name: data.universityName,
        start_preference: data.startPreference,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      }

      let error
      if (existingProfile) {
        const result = await (supabase as Record<string, any>)
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', userId)
        error = result.error
      } else {
        const result = await (supabase as Record<string, any>)
          .from('user_profiles')
          .insert({
            user_id: userId,
            email: userEmail,
            ...profileData
          })
        error = result.error
      }

      if (error) {
        console.error('Error saving profile:', error)
        alert('Failed to save onboarding data. Please try again.')
        return
      }

      // Update photo_url in resume_data if a photo was uploaded
      // (Resume data is already saved immediately after extraction in Step 0)
      if (photoUrl) {
        console.log('📸 Updating photo in resume_data...')
        const { error: resumePhotoError } = await (supabase as Record<string, any>)
          .from('resume_data')
          .update({ photo_url: photoUrl })
          .eq('user_id', userId)

        if (resumePhotoError) {
          console.warn('Warning: Could not update photo in resume_data:', resumePhotoError)
        } else {
          console.log('✅ Photo URL updated in resume_data')
        }
      }

      console.log('✅ Onboarding completed successfully!')
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < totalSteps - 1) {
      const nextStepNum = step + 1
      setStep(nextStepNum)

      // Set default semester to 1 when entering step 3
      if (nextStepNum === 3 && !data.currentSemester) {
        setData({ ...data, currentSemester: 1 })
      }
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return uploadState.status === 'success' && data.resumeExtracted
      case 1:
        return true // Photo is optional
      case 2:
        return data.hoursAvailable !== undefined && data.hoursAvailable > 0
      case 3:
        return true // Semester has default value of 1
      case 4:
        return data.universityName !== undefined && data.universityName.trim().length > 0
      case 5:
        return data.startPreference !== undefined
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="w-full max-w-2xl px-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {[0, 1, 2, 3, 4, 5].map((s: any) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">Step {step + 1} of {totalSteps}</p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Resume Upload */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-2">Upload Your Resume</h2>
              <p className="text-lg text-gray-600 mb-8">Our AI will extract and structure your professional information</p>

              {uploadState.status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border-2 border-green-200 p-8 text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-xl">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-gray-900">✨ Resume Analyzed Successfully!</h3>
                    <p className="text-gray-600">
                      Our AI has intelligently extracted and structured your professional information.
                    </p>
                  </div>

                  {extractedProfile && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-lg text-gray-900">{extractedProfile.personal_details?.name || extractedProfile.personal_info?.name || 'Profile Extracted'}</h4>
                          <p className="text-sm text-gray-600">Profile Successfully Extracted</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">{(extractedProfile.experience || []).length}</div>
                          <div className="text-xs text-gray-600">Experience</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-purple-600">{(extractedProfile.education || []).length}</div>
                          <div className="text-xs text-gray-600">Education</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {Object.values(extractedProfile.skills || {}).flat().length}
                          </div>
                          <div className="text-xs text-gray-600">Skills</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <FileUpload
                    onFileUpload={handleFileUpload}
                    isUploading={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                    error={uploadState.error}
                  />

                  {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {uploadState.status === 'uploading' ? '📤 Uploading Resume' : '🤖 AI Processing'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {uploadState.status === 'uploading'
                              ? 'Securing your document...'
                              : 'Extracting and structuring your information...'
                            }
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Progress</span>
                          <span className="text-blue-600 font-medium">{uploadState.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadState.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-lg text-center transition-all ${
                          uploadState.progress >= 25 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className="text-xl mb-1">📄</div>
                          <div className="text-xs text-gray-600">Scan</div>
                        </div>
                        <div className={`p-3 rounded-lg text-center transition-all ${
                          uploadState.progress >= 75 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className="text-xl mb-1">🧠</div>
                          <div className="text-xs text-gray-600">Analyze</div>
                        </div>
                        <div className={`p-3 rounded-lg text-center transition-all ${
                          uploadState.progress >= 100 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className="text-xl mb-1">✨</div>
                          <div className="text-xs text-gray-600">Structure</div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {uploadState.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-800 font-medium">Upload failed. Please try again.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 1: Photo */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-2">Add your photo</h2>
              <p className="text-lg text-gray-600 mb-8">Optional - helps employers put a face to your profile</p>

              <div className="flex justify-center mb-8">
                {photoPreview ? (
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 shadow-xl">
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setPhotoPreview(null)
                        setData({ ...data, photo: undefined })
                      }}
                      className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="w-40 h-40 border-4 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 shadow-lg">
                    <Camera className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Hours */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-2">Hours per week</h2>
              <p className="text-lg text-gray-600 mb-8">How many hours can you work?</p>

              <div className="space-y-3">
                {[10, 15, 20].map((hours: any) => (
                  <button
                    key={hours}
                    onClick={() => setData({ ...data, hoursAvailable: hours })}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      data.hoursAvailable === hours
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg text-gray-900">{hours} hours/week</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {hours === 10 && 'Part-time'}
                          {hours === 15 && 'Balanced'}
                          {hours === 20 && 'Maximum'}
                        </div>
                      </div>
                      {data.hoursAvailable === hours && (
                        <Check className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Or enter custom (1-20)"
                  value={data.hoursAvailable && ![10, 15, 20].includes(data.hoursAvailable) ? data.hoursAvailable : ''}
                  onChange={(e: any) => setData({ ...data, hoursAvailable: parseInt(e.target.value) || undefined })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors text-lg"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Semester */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-2">Current semester</h2>
              <p className="text-lg text-gray-600 mb-8">Which semester are you in?</p>

              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-4 shadow-2xl">
                  <span className="text-5xl font-black">{data.currentSemester || 1}</span>
                </div>
                <p className="text-lg text-gray-700 font-medium">
                  {data.currentSemester === 1 ? '1st semester' :
                   data.currentSemester === 2 ? '2nd semester' :
                   data.currentSemester === 3 ? '3rd semester' :
                   `${data.currentSemester}th semester`}
                </p>
              </div>

              <div className="mb-6">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={data.currentSemester || 1}
                  onChange={(e: any) => setData({ ...data, currentSemester: parseInt(e.target.value) })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${((data.currentSemester || 1) - 1) / 11 * 100}%, rgb(229, 231, 235) ${((data.currentSemester || 1) - 1) / 11 * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2 px-1">
                  <span>1st</span>
                  <span>6th</span>
                  <span>12th+</span>
                </div>
              </div>

              {(data.currentSemester || 1) >= 12 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <input
                    type="number"
                    min="12"
                    max="20"
                    placeholder="Enter semester (12+)"
                    value={data.currentSemester || ''}
                    onChange={(e: any) => setData({ ...data, currentSemester: parseInt(e.target.value) || 12 })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors text-lg"
                    autoFocus
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 4: University with Autocomplete */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-2">Your University</h2>
              <p className="text-lg text-gray-600 mb-8">Which university are you attending?</p>

              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Start typing to search..."
                  value={universitySearch}
                  onChange={(e: any) => handleUniversitySearchChange(e.target.value)}
                  onFocus={() => {
                    if (universitySuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-colors text-lg"
                  autoFocus
                />

                {universityLoading && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 text-center">
                    <div className="text-sm text-gray-600">Searching...</div>
                  </div>
                )}

                {showSuggestions && universitySuggestions.length > 0 && !universityLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
                  >
                    {universitySuggestions.map((uni, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectUniversity(uni)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-gray-900 font-medium">{uni.name}</div>
                        <div className="text-xs text-gray-500">{uni.city}, {uni.state}</div>
                      </button>
                    ))}
                  </motion.div>
                )}

                {showSuggestions && universitySuggestions.length === 0 && !universityLoading && universitySearch.length >= 2 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 text-center">
                    <div className="text-sm text-gray-600">No universities found</div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-6">
                💡 Type at least 2 characters to see suggestions
              </p>
            </motion.div>
          )}

          {/* Step 5: Start Date */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-2">When can you start?</h2>
              <p className="text-lg text-gray-600 mb-8">Help employers know your availability</p>

              <div className="space-y-3">
                {[
                  { value: 'immediately', label: 'Immediately', desc: 'Ready to start right away', icon: '⚡' },
                  { value: 'within_month', label: 'Within a month', desc: 'Can start in 2-4 weeks', icon: '📅' },
                  { value: 'within_3_months', label: 'Within 3 months', desc: 'Planning ahead', icon: '🗓️' },
                  { value: 'flexible', label: 'Flexible', desc: 'Open to discussion', icon: '💬' }
                ].map((option: any) => (
                  <button
                    key={option.value}
                    onClick={() => setData({ ...data, startPreference: option.value })}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      data.startPreference === option.value
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <div className="font-bold text-lg text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                        </div>
                      </div>
                      {data.startPreference === option.value && (
                        <Check className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              step === 0
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={!canProceed() || loading}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 ${
              canProceed() && !loading
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : step === totalSteps - 1 ? (
              <>
                Complete
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        {step !== 0 && (
          <div className="text-center mt-4">
            <button
              onClick={onComplete}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>

      {/* Image Crop Modal */}
      {showCropModal && tempImageSrc && (
        <ImageCropModal
          image={tempImageSrc}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
