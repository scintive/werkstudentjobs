'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface OnboardingData {
  photo?: File
  photoUrl?: string
  hoursAvailable?: number
  currentSemester?: number
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

  const totalSteps = 4

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
      setData({ ...data, photo: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
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

      const { error } = await supabase
        .from('user_profiles')
        .update({
          photo_url: photoUrl,
          hours_available: data.hoursAvailable,
          current_semester: data.currentSemester,
          start_preference: data.startPreference,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to save onboarding data. Please try again.')
        return
      }

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
      setStep(step + 1)
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
        return true
      case 2:
        return data.hoursAvailable !== undefined && data.hoursAvailable > 0
      case 3:
        return data.currentSemester !== undefined && data.currentSemester > 0
      case 4:
        return data.startPreference !== undefined
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-full max-w-lg px-6">
        {/* Progress */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add your photo</h2>
              <p className="text-gray-600 mb-8">Optional - helps employers put a face to your profile</p>

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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hours per week</h2>
              <p className="text-gray-600 mb-8">How many hours can you work?</p>

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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Current semester</h2>
              <p className="text-gray-600 mb-8">Which semester are you in?</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setData({ ...data, currentSemester: sem })}
                    className={`aspect-square p-4 rounded-lg border text-2xl font-semibold transition-all ${
                      data.currentSemester === sem
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="20"
                placeholder="10+ (enter custom)"
                value={data.currentSemester && data.currentSemester > 9 ? data.currentSemester : ''}
                onChange={(e) => setData({ ...data, currentSemester: parseInt(e.target.value) || undefined })}
                className="w-full p-4 border border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none transition-colors"
              />
            </motion.div>
          )}

          {/* Step 4: Start Date */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">When can you start?</h2>
              <p className="text-gray-600 mb-8">Help employers know your availability</p>

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
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              step === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={!canProceed() || loading}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
              canProceed() && !loading
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
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
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}