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
import { User, Mail, Phone, MapPin, Trash2, Save, CreditCard, Crown, TrendingUp, Calendar, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

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
  const [subscription, setSubscription] = useState<any>(null)
  const [usageData, setUsageData] = useState<any>({})

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
    loadSubscriptionData()
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
          } as never)
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
          } as never)
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

      // Type assertion for partial select
      const typedResumeData = resumeData as Array<{ personal_info: any }> | null

      // Load onboarding fields from user_profiles
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('hours_available, current_semester, university_name, start_preference')
        .eq('user_id', sessionData.session.user.id)
        .single()

      // Type assertion for partial select
      const typedProfileData = profileData as { hours_available: number | null; current_semester: number | null; university_name: string | null; start_preference: string | null } | null

      if (typedResumeData && typedResumeData[0]?.personal_info) {
        const info = typedResumeData[0].personal_info
        setFormData({
          name: info.name || '',
          email: sessionData.session.user.email || '',
          phone: info.phone || '',
          location: info.location || '',
          linkedin: info.linkedin || '',
          website: info.website || '',
          hoursAvailable: typedProfileData?.hours_available ?? undefined,
          currentSemester: typedProfileData?.current_semester ?? undefined,
          universityName: typedProfileData?.university_name || '',
          startPreference: typedProfileData?.start_preference || ''
        })
      } else if (typedProfileData) {
        // If no resume_data but profile exists, populate onboarding fields
        setFormData(prev => ({
          ...prev,
          hoursAvailable: typedProfileData.hours_available ?? undefined,
          currentSemester: typedProfileData.current_semester ?? undefined,
          universityName: typedProfileData.university_name || '',
          startPreference: typedProfileData.start_preference || ''
        }))
      }
    } catch (err) {
      console.error('Error loading user data:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptionData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) return

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)

        // Load usage for key features
        if (data.plan?.limits) {
          const features = ['ai_tailoring_per_month', 'resume_exports_per_month', 'cover_letters_per_month']
          const usage: any = {}

          for (const feature of features) {
            const usageResponse = await fetch(`/api/subscription/usage?feature=${feature}`, {
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`
              }
            })

            if (usageResponse.ok) {
              const usageInfo = await usageResponse.json()
              usage[feature] = usageInfo
            }
          }

          setUsageData(usage)
        }
      }
    } catch (err) {
      console.error('Error loading subscription data:', err)
    }
  }

  const handleManageBilling = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) return

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (err) {
      console.error('Error creating portal session:', err)
      setError('Failed to open billing portal')
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
        } as never)
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
        } as never)
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

        {/* Billing & Subscription */}
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription and view usage
                </CardDescription>
              </div>
              {subscription?.plan && (
                <Badge className={`${
                  subscription.plan.id === 'enterprise' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                  subscription.plan.id === 'pro' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {subscription.plan.id === 'enterprise' && <Crown className="w-3 h-3 mr-1" />}
                  {subscription.plan.name}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.is_free ? (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-2">Upgrade to unlock premium features</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get unlimited AI tailoring, premium templates, and priority support
                </p>
                <Link href="/pricing">
                  <Button className="btn-primary">
                    <TrendingUp className="w-4 h-4" />
                    View Plans
                  </Button>
                </Link>
              </div>
            ) : subscription?.subscription ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700 mb-1">Status</div>
                    <div className="font-bold text-gray-900 capitalize">{subscription.subscription.status}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-700 mb-1">Billing Cycle</div>
                    <div className="font-bold text-gray-900 capitalize">{subscription.subscription.billing_cycle}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Renews On
                    </div>
                    <div className="font-bold text-gray-900">
                      {new Date(subscription.subscription.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Usage Metrics */}
                {Object.keys(usageData).length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-900">Usage This Month</h4>
                    {Object.entries(usageData).map(([feature, data]: [string, any]) => {
                      const featureName = feature.replace('_per_month', '').replace(/_/g, ' ')
                      const isUnlimited = data.is_unlimited
                      const percentage = isUnlimited ? 0 : (data.used / data.limit) * 100

                      return (
                        <div key={feature}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm capitalize text-gray-700">{featureName}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {isUnlimited ? 'Unlimited' : `${data.used} / ${data.limit}`}
                            </span>
                          </div>
                          {!isUnlimited && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  percentage >= 90 ? 'bg-red-500' :
                                  percentage >= 70 ? 'bg-orange-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button
                  onClick={handleManageBilling}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Manage Billing
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

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
                  onChange={(e: any) => setFormData({ ...formData, universityName: e.target.value })}
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
                  onChange={(e: any) => setFormData({ ...formData, currentSemester: e.target.value ? parseInt(e.target.value) : undefined })}
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
                  onChange={(e: any) => setFormData({ ...formData, hoursAvailable: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startPreference">Start Preference</Label>
                <Input
                  id="startPreference"
                  value={formData.startPreference}
                  onChange={(e: any) => setFormData({ ...formData, startPreference: e.target.value })}
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
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
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
                  onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e: any) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Personal Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e: any) => setFormData({ ...formData, website: e.target.value })}
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