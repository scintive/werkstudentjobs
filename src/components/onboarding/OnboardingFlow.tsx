'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { ImageCropModal } from '@/components/resume-editor/ImageCropModal'

interface OnboardingData {
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
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null)

  const totalSteps = 5

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

      // Read the file and show crop modal
      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to file
    const file = new File([croppedBlob], 'profile-photo.jpg', { type: 'image/jpeg' })
    setData({ ...data, photo: file })

    // Create preview
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

  const handleComplete = async () => {
    setLoading(true)
    try {
      let photoUrl = data.photoUrl

      if (data.photo) {
        photoUrl = await uploadPhoto(data.photo) || undefined
      }

      // First, check if user_profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single()

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
        // Update existing profile
        const result = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', userId)
        error = result.error
      } else {
        // Create new profile
        const result = await supabase
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

      // Also update resume_data.photo_url if photoUrl exists
      if (photoUrl) {
        const { error: resumeUpdateError } = await supabase
          .from('resume_data')
          .update({ photo_url: photoUrl })
          .eq('user_id', userId)

        if (resumeUpdateError) {
          console.warn('Warning: Could not update photo in resume_data:', resumeUpdateError)
        } else {
          console.log('✅ Photo URL also updated in resume_data')
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
    if (step < totalSteps) {
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
    if (step > 1) setStep(step - 1)
  }

  const canProceed = () => {
    switch (step) {
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl px-6">
        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>Step {step} of {totalSteps}</p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Photo */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-heading-2" style={{ color: 'var(--text-primary)' }}>Add your photo</h2>
              <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>Optional - helps employers put a face to your profile</p>

              <div className="flex justify-center mb-8">
                {photoPreview ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={photoPreview}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setPhotoPreview(null)
                        setData({ ...data, photo: undefined })
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload</span>
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
              <h2 className="text-heading-2" style={{ color: 'var(--text-primary)' }}>Hours per week</h2>
              <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>How many hours can you work?</p>

              <div className="space-y-3">
                {[10, 15, 20].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setData({ ...data, hoursAvailable: hours })}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      data.hoursAvailable === hours
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{hours} hours/week</div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {hours === 10 && 'Part-time'}
                          {hours === 15 && 'Balanced'}
                          {hours === 20 && 'Maximum'}
                        </div>
                      </div>
                      {data.hoursAvailable === hours && (
                        <Check className="w-5 h-5 text-gray-900" />
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
                  onChange={(e) => setData({ ...data, hoursAvailable: parseInt(e.target.value) || undefined })}
                  className="w-full p-4 border border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none transition-colors"
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
              <h2 className="text-heading-2" style={{ color: 'var(--text-primary)' }}>Current semester</h2>
              <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>Which semester are you in?</p>

              {/* Current Semester Display */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-4">
                  <span className="text-4xl font-black">{data.currentSemester || 1}</span>
                </div>
                <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  {data.currentSemester === 1 ? '1st semester' :
                   data.currentSemester === 2 ? '2nd semester' :
                   data.currentSemester === 3 ? '3rd semester' :
                   `${data.currentSemester}th semester`}
                </p>
              </div>

              {/* Slider */}
              <div className="mb-6">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={data.currentSemester || 1}
                  onChange={(e) => setData({ ...data, currentSemester: parseInt(e.target.value) })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${((data.currentSemester || 1) - 1) / 11 * 100}%, rgb(229, 231, 235) ${((data.currentSemester || 1) - 1) / 11 * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1st</span>
                  <span>6th</span>
                  <span>12th+</span>
                </div>
              </div>

              {/* Custom Input for 13+ */}
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
                    onChange={(e) => setData({ ...data, currentSemester: parseInt(e.target.value) || 12 })}
                    className="input input-lg w-full"
                    autoFocus
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 4: University Name */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-heading-2" style={{ color: 'var(--text-primary)' }}>Your University</h2>
              <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>Which university are you attending?</p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="e.g., Technical University of Munich"
                  value={data.universityName || ''}
                  onChange={(e) => setData({ ...data, universityName: e.target.value })}
                  className="input input-lg w-full"
                  autoFocus
                />
                <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                  This helps employers understand your educational background
                </p>

                {/* Common German universities as quick options */}
                <div className="space-y-2 pt-4">
                  <p className="text-caption font-semibold" style={{ color: 'var(--text-secondary)' }}>Popular choices:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Technical University of Munich (TUM)',
                      'Ludwig Maximilian University of Munich (LMU)',
                      'University of Heidelberg',
                      'Humboldt University of Berlin',
                      'RWTH Aachen University',
                      'Free University of Berlin'
                    ].map((uni) => (
                      <button
                        key={uni}
                        onClick={() => setData({ ...data, universityName: uni })}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                          data.universityName === uni
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-body">{uni}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              <h2 className="text-heading-2" style={{ color: 'var(--text-primary)' }}>When can you start?</h2>
              <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>Help employers know your availability</p>

              <div className="space-y-3">
                {[
                  { value: 'immediately', label: 'Immediately', desc: 'Ready to start right away' },
                  { value: 'within_month', label: 'Within a month', desc: 'Can start in 2-4 weeks' },
                  { value: 'within_3_months', label: 'Within 3 months', desc: 'Planning ahead' },
                  { value: 'flexible', label: 'Flexible', desc: 'Open to discussion' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setData({ ...data, startPreference: option.value as any })}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      data.startPreference === option.value
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{option.desc}</div>
                      </div>
                      {data.startPreference === option.value && (
                        <Check className="w-5 h-5 text-gray-900" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`btn btn-ghost ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={!canProceed() || loading}
            className={`btn ${canProceed() && !loading ? 'btn-primary' : 'btn-secondary'}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : step === totalSteps ? (
              <>
                Complete
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button
            onClick={onComplete}
            className="link link-muted text-body-small"
          >
            Skip for now
          </button>
        </div>
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