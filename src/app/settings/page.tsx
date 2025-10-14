'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { User, Mail, Phone, MapPin, Trash2, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    hoursAvailable: undefined as number | undefined,
    currentSemester: undefined as number | undefined,
    universityName: '',
    startPreference: ''
  })

  useEffect(() => {
    loadUserData()
  }, [])

  // Auto-save functionality with 2-second debounce
  useEffect(() => {
    // Skip auto-save on initial load or when user is not set
    if (!userId || loading) return

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setAutoSaving(true)
        console.log('🔄 Auto-saving...')

        // Update all resume_data entries for this user
        const { error: updateError } = await supabase
          .from('resume_data')
          .update({
            personal_info: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              location: formData.location,
              linkedin: formData.linkedin,
              website: formData.website
            },
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (updateError) throw updateError

        // Update onboarding fields in user_profiles
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            hours_available: formData.hoursAvailable,
            current_semester: formData.currentSemester,
            university_name: formData.universityName,
            start_preference: formData.startPreference,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (profileError) throw profileError

        console.log('✅ Auto-saved successfully')
      } catch (err) {
        console.error('❌ Auto-save failed:', err)
      } finally {
        setAutoSaving(false)
      }
    }, 2000)

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [formData, userId, loading])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session?.user) {
        router.push('/login')
        return
      }

      setUserId(sessionData.session.user.id)
      setFormData(prev => ({
        ...prev,
        email: sessionData.session.user.email || ''
      }))

      // Load personal info from resume_data
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('personal_info')
        .eq('user_id', sessionData.session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      // Load onboarding fields from user_profiles
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('hours_available, current_semester, university_name, start_preference')
        .eq('user_id', sessionData.session.user.id)
        .single()

      if (resumeData && resumeData[0]?.personal_info) {
        const info = resumeData[0].personal_info
        setFormData({
          name: info.name || '',
          email: sessionData.session.user.email || '',
          phone: info.phone || '',
          location: info.location || '',
          linkedin: info.linkedin || '',
          website: info.website || '',
          hoursAvailable: profileData?.hours_available,
          currentSemester: profileData?.current_semester,
          universityName: profileData?.university_name || '',
          startPreference: profileData?.start_preference || ''
        })
      } else if (profileData) {
        // If no resume_data but profile exists, populate onboarding fields
        setFormData(prev => ({
          ...prev,
          hoursAvailable: profileData.hours_available,
          currentSemester: profileData.current_semester,
          universityName: profileData.university_name || '',
          startPreference: profileData.start_preference || ''
        }))
      }
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userId) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      console.log('💾 Saving personal info:', formData)

      // Update all resume_data entries for this user
      const { data: updateData, error: updateError } = await supabase
        .from('resume_data')
        .update({
          personal_info: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            linkedin: formData.linkedin,
            website: formData.website
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('❌ Resume data update error:', updateError)
        throw updateError
      }

      console.log('✅ Resume data updated:', updateData)

      // Update onboarding fields in user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .update({
          hours_available: formData.hoursAvailable,
          current_semester: formData.currentSemester,
          university_name: formData.universityName,
          start_preference: formData.startPreference,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (profileError) {
        console.error('❌ Profile update error:', profileError)
        throw profileError
      }

      console.log('✅ Profile updated:', profileData)

      setSuccess('Settings updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('❌ Error saving:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!userId) return

    try {
      // Delete user data from all tables
      await supabase.from('resume_data').delete().eq('user_id', userId)
      await supabase.from('resume_variants').delete().eq('user_id', userId)
      await supabase.from('resume_suggestions').delete().eq('user_id', userId)

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/register')
    } catch (err) {
      console.error('Error deleting account:', err)
      setError('Failed to delete account. Please try again.')
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-xl" style={{ color: 'var(--text-primary)' }}>
                Settings
              </h1>
              <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
                Manage your account settings and personal information
              </p>
            </div>
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>Auto-saving...</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Student Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Update your student profile and availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="universityName">University Name</Label>
                <Input
                  id="universityName"
                  value={formData.universityName}
                  onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                  placeholder="Technical University of Munich"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentSemester">Current Semester</Label>
                <Input
                  id="currentSemester"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.currentSemester || ''}
                  onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoursAvailable">Hours Available per Week</Label>
                <Input
                  id="hoursAvailable"
                  type="number"
                  min="1"
                  max="40"
                  value={formData.hoursAvailable || ''}
                  onChange={(e) => setFormData({ ...formData, hoursAvailable: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startPreference">Start Preference</Label>
                <Input
                  id="startPreference"
                  value={formData.startPreference}
                  onChange={(e) => setFormData({ ...formData, startPreference: e.target.value })}
                  placeholder="Immediately / Next Month / etc."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details that appear on your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Personal Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="johndoe.com"
                />
              </div>
            </div>

            <div className="flex flex-col items-end pt-4 gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                style={{ background: 'var(--primary)' }}
                className="text-white hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Now'}
              </Button>
              <p className="text-xs text-gray-500">
                Changes auto-save after 2 seconds
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
              <div>
                <p className="font-medium text-red-900">Delete Account</p>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data including resumes, job applications, and settings
                from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}