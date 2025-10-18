import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import type { ResumeData } from '@/lib/types'

interface UsePhotoUploadProps {
  localData: ResumeData & { photoUrl?: string | null }
  setLocalData: (data: unknown) => void
  updateField: (field: string, value: unknown) => void
  saveNow: () => Promise<void>
}

export const usePhotoUpload = ({
  localData,
  setLocalData,
  updateField,
  saveNow
}: UsePhotoUploadProps) => {
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)

  const handleCroppedImage = async (croppedBlob: Blob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Compress image
      const compressedFile = await imageCompression(croppedBlob as File, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      })

      // Upload to storage
      const fileName = `${user.id}/profile.jpg`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, compressedFile, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // Get public URL (add timestamp to bust cache)
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`

      // Update state
      setLocalData({ ...localData, photoUrl } as Record<string, any>)
      updateField('photoUrl', photoUrl)

      // Force immediate save (context will save to variant in tailor mode, or base resume in base mode)
      await saveNow()

      // Close crop modal
      setImageToCrop(null)
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert('Failed to upload photo. Please try again.')
    }
  }

  return {
    imageToCrop,
    setImageToCrop,
    handleCroppedImage
  }
}
