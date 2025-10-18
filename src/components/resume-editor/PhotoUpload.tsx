'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface PhotoUploadProps {
  currentPhotoUrl?: string
  onPhotoUpdate: (photoUrl: string | null) => void
  userId: string
}

export function PhotoUpload({ currentPhotoUrl, onPhotoUpdate, userId }: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoUrl || null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      setSelectedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${userId}/profile-${Date.now()}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, selectedFile, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload photo. Please try again.')
        return
      }

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      onPhotoUpdate(urlData.publicUrl)
      setIsOpen(false)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('An error occurred while uploading. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async () => {
    setPhotoPreview(null)
    setSelectedFile(null)
    onPhotoUpdate(null)
    setIsOpen(false)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {currentPhotoUrl ? (
          <>
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300">
              <Image
                src={currentPhotoUrl}
                alt="Profile"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span>Change Photo</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>Add Photo</span>
          </>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Profile Photo</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Photo Preview/Upload Area */}
                <div className="mb-6">
                  {photoPreview ? (
                    <div className="relative">
                      <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                        <Image
                          src={photoPreview}
                          alt="Preview"
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setPhotoPreview(currentPhotoUrl || null)
                          setSelectedFile(null)
                        }}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer">
                      <div className="h-full flex flex-col items-center justify-center p-8">
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <span className="text-gray-600 text-center mb-2">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-sm text-gray-400">
                          PNG, JPG up to 5MB
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Info Text */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">Professional Tip</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Use a high-quality headshot with good lighting. Your photo will appear on Swiss and Professional resume templates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {currentPhotoUrl && (
                    <button
                      onClick={removePhoto}
                      className="flex-1 px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                    >
                      Remove Photo
                    </button>
                  )}
                  <button
                    onClick={selectedFile ? uploadPhoto : () => setIsOpen(false)}
                    disabled={uploading}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedFile && !uploading
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </div>
                    ) : selectedFile ? (
                      'Save Photo'
                    ) : (
                      'Cancel'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}