'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Wand2,
  BarChart3,
  Target,
  BookOpen,
  MoreHorizontal,
  Bell,
  Activity,
  Send,
  Edit3,
  Eye,
  Download
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MatchScore } from '@/components/ui/MatchScore'

interface TailoredResume {
  id: string
  job_id: string
  variant_name: string
  match_score: number
  created_at: string
  updated_at: string
  has_cover_letter: boolean
  jobs: {
    id: string
    title: string
    companies: {
      name: string
    }
  }
}

interface Activity {
  id: string
  type: 'application' | 'resume_edit' | 'job_view' | 'tailor'
  title: string
  description: string
  timestamp: string
  icon: 'success' | 'info' | 'warning'
}

interface HighMatchJob {
  id: string
  title: string
  company: string
  match_score: number
  posted_date: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [userName, setUserName] = React.useState('there')
  const [userId, setUserId] = React.useState<string | null>(null)
  const [tailoredResumes, setTailoredResumes] = React.useState<TailoredResume[]>([])
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [stats, setStats] = React.useState({
    profileCompletion: 0,
    activeApplications: 0,
    jobMatches: 0,
    avgMatchScore: 0
  })
  const [highMatchJobs, setHighMatchJobs] = React.useState<HighMatchJob[]>([])
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [downloading, setDownloading] = React.useState<string | null>(null)

  React.useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.user) {
        router.push('/login')
        return
      }

      const userId = sessionData.session.user.id
      setUserId(userId)

      // Check if user has completed onboarding
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', userId)
        .single()

      const onboardingProfile = profileData as any;

      if (!onboardingProfile?.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      // Check if user has uploaded resume
      const { data: resumeCheck } = await supabase
        .from('resume_data')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (!resumeCheck || resumeCheck.length === 0) {
        router.push('/upload')
        return
      }

      // Load user name
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('personal_info, professional_title, skills')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (resumeData && resumeData[0]) {
        const latestResume = resumeData[0] as any;
        const firstName = latestResume.personal_info?.name?.split(' ')[0] || 'there'
        setUserName(firstName)

        // Calculate profile completion
        let completion = 0
        if (latestResume.personal_info?.name) completion += 20
        if (latestResume.personal_info?.email) completion += 20
        if (latestResume.professional_title) completion += 20
        if (latestResume.skills && Object.keys(latestResume.skills).length > 0) completion += 20
        if (latestResume.personal_info?.phone) completion += 20

        setStats(prev => ({ ...prev, profileCompletion: completion }))
      }

      // Load tailored resumes with match scores from resume_variants
      const { data: variants } = await supabase
        .from('resume_variants')
        .select(`
          id,
          job_id,
          variant_name,
          match_score,
          created_at,
          updated_at,
          jobs (
            id,
            title,
            companies (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5)

      const variantRows = (variants as any[]) || [];

      if (variantRows.length > 0) {
        setTailoredResumes(variantRows as TailoredResume[])
        setStats(prev => ({ ...prev, activeApplications: variantRows.length }))
      }

      // Load job matches count from resume_variants (tailored resumes from last 7 days)
      const { count } = await supabase
        .from('resume_variants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (count !== null) {
        setStats(prev => ({ ...prev, jobMatches: count }))
      }

      // Calculate average match score from resume_variants
      const { data: allVariants } = await supabase
        .from('resume_variants')
        .select('match_score')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (allVariants && allVariants.length > 0) {
        const variantScores = allVariants as any[];
        const avgScore = variantScores.reduce((acc, v) => acc + (v.match_score || 0), 0) / variantScores.length
        setStats(prev => ({ ...prev, avgMatchScore: Math.round(avgScore) }))
      }

      // Load high match jobs (90%+) from resume_variants
      const { data: highMatches } = await supabase
        .from('resume_variants')
        .select(`
          job_id,
          match_score,
          jobs (
            id,
            title,
            posted_at,
            companies (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .gte('match_score', 90)
        .order('match_score', { ascending: false })
        .limit(5)

      if (highMatches) {
        const highMatchRows = highMatches as any[];
        const formattedHighMatches: HighMatchJob[] = highMatchRows.map(m => ({
          id: m.jobs?.id || '',
          title: m.jobs?.title || '',
          company: m.jobs?.companies?.name || '',
          match_score: m.match_score || 0,
          posted_date: m.jobs?.posted_at || new Date().toISOString()
        }))
        setHighMatchJobs(formattedHighMatches)
      }

      // Create recent activities from real data only
      const recentActivities: Activity[] = []

      // Add tailored resume activities
      if (variantRows.length > 0) {
        variantRows.slice(0, 5).forEach((v: any) => {
          recentActivities.push({
            id: v.id,
            type: 'tailor',
            title: `Resume tailored for ${v.jobs?.companies?.name || 'Company'}`,
            description: v.jobs?.title || 'Position',
            timestamp: v.updated_at,
            icon: 'info'
          })
        })
      }

      setActivities(recentActivities.slice(0, 5))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="heading-xl" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {userName}
        </h1>
        <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with your job search today.
        </p>
      </div>

      {/* Notification Bell */}
      <div className="absolute top-4 right-8">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {highMatchJobs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {highMatchJobs.length}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Top Job Matches</h3>
                <p className="text-xs text-gray-500">Jobs with 90%+ match score</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {highMatchJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-gray-600">{job.company}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(job.posted_date), { addSuffix: true })}
                        </p>
                      </div>
                      <MatchScore score={job.match_score} size="sm" showLabel={true} />
                    </div>
                  </div>
                ))}
                {highMatchJobs.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No high-match jobs at the moment
                  </div>
                )}
              </div>
              <div className="p-3 border-t">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => router.push('/jobs')}
                >
                  View All Jobs
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Profile Completion */}
        <div className="stat-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/edit-resume')}>
          <div className="stat-icon-wrapper" style={{ background: stats.profileCompletion === 100 ? 'var(--success-bg)' : 'var(--warning-bg)' }}>
            <CheckCircle className="w-6 h-6" style={{ color: stats.profileCompletion === 100 ? 'var(--success)' : 'var(--warning)' }} />
          </div>
          <div>
            <p className="stat-label">Profile Completion</p>
            <p className="stat-value">{stats.profileCompletion}%</p>
            <p className="stat-sublabel">{stats.profileCompletion === 100 ? 'Click to edit resume' : 'Complete your profile'}</p>
          </div>
          <div className="stat-progress">
            <div className="stat-progress-fill" style={{ width: `${stats.profileCompletion}%`, background: stats.profileCompletion === 100 ? 'var(--success)' : 'var(--warning)' }} />
          </div>
        </div>

        {/* Active Applications */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--primary-light)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="stat-label">Active Applications</p>
            <p className="stat-value">{stats.activeApplications}</p>
            <p className="stat-sublabel">In progress</p>
          </div>
        </div>

        {/* Job Matches */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--info-bg)' }}>
            <Briefcase className="w-6 h-6" style={{ color: 'var(--info)' }} />
          </div>
          <div>
            <p className="stat-label">Job Matches</p>
            <p className="stat-value">{stats.jobMatches}</p>
            <p className="stat-sublabel">New opportunities</p>
          </div>
          <span className="stat-badge badge-info">
            +12 today
          </span>
        </div>

        {/* Match Score */}
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)' }}>
            <Target className="w-6 h-6" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <p className="stat-label">Match Score</p>
            <p className="stat-value">{stats.avgMatchScore}%</p>
            <p className="stat-sublabel">Average compatibility</p>
          </div>
          <div className="stat-progress">
            <div className="stat-progress-fill" style={{ width: `${stats.avgMatchScore}%`, background: 'var(--warning)' }} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Resumes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Tailored Resumes */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="heading-md" style={{ color: 'var(--text-primary)' }}>
                Recent Tailored Resumes
              </h2>
              <button
                className="text-sm font-medium hover:underline cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => router.push('/jobs')}
              >
                View All →
              </button>
            </div>

            <div className="space-y-3">
              {tailoredResumes.length > 0 ? (
                tailoredResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="resume-item cursor-pointer"
                    onClick={() => {
                      console.log('🔍 Clicking resume card, navigating to:', `/jobs/${resume.job_id}/tailor?tab=strategy`)
                      router.push(`/jobs/${resume.job_id}/tailor?tab=strategy`)
                    }}
                  >
                    <div className="resume-icon">
                      <FileText className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div className="resume-details">
                      <div className="resume-title">
                        {resume.jobs?.title || resume.variant_name || 'Tailored Resume'}
                      </div>
                      <div className="resume-meta">
                        <span className="resume-meta-item">
                          <Building2 className="w-3.5 h-3.5" />
                          {resume.jobs?.companies?.name || 'Company'}
                        </span>
                        <span className="resume-meta-item">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(resume.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="resume-actions" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                        Tailored
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1">
                            <MoreHorizontal className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${resume.job_id}/tailor?tab=strategy`)}>
                            <Target className="w-4 h-4 mr-2" />
                            Job Strategy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${resume.job_id}/tailor?tab=resume`)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Resume
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${resume.job_id}/tailor?tab=cover-letter`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Cover Letter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${resume.job_id}/tailor?tab=download`)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Kit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No tailored resumes yet</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push('/jobs')}
                  >
                    Browse Jobs to Tailor
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <h2 className="heading-md mb-5" style={{ color: 'var(--text-primary)' }}>
              Recent Activity
            </h2>

            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => {
                  const getActivityIcon = () => {
                    switch (activity.type) {
                      case 'application': return <Send className="w-4 h-4" />
                      case 'resume_edit': return <Edit3 className="w-4 h-4" />
                      case 'job_view': return <Eye className="w-4 h-4" />
                      case 'tailor': return <Wand2 className="w-4 h-4" />
                      default: return <Activity className="w-4 h-4" />
                    }
                  }

                  const getIconColor = () => {
                    switch (activity.icon) {
                      case 'success': return { bg: 'var(--success-bg)', color: 'var(--success)' }
                      case 'warning': return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
                      default: return { bg: 'var(--info-bg)', color: 'var(--info)' }
                    }
                  }

                  const iconStyle = getIconColor()

                  return (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon" style={{ background: iconStyle.bg }}>
                        {React.cloneElement(getActivityIcon(), { style: { color: iconStyle.color } })}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-desc">{activity.description}</div>
                      </div>
                      <div className="activity-time">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Start by creating or tailoring a resume</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
