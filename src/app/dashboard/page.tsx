'use client'

import * as React from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import {
  FileText,
  Briefcase,
  TrendingUp,
  Target,
  ChevronRight,
  Upload,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Plus,
  Activity,
  Users,
  Building2,
  Calendar,
  Zap,
  PenTool
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeVariant {
  id: string
  job_id: string
  variant_name?: string
  match_score?: number
  created_at: string
  updated_at: string
  jobs?: {
    title: string
    company_name?: string
  }
}

interface QuickStat {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down'
  icon: React.ElementType
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [resumeName, setResumeName] = React.useState<string>('')
  const [completeness, setCompleteness] = React.useState<number>(0)
  const [jobsCount, setJobsCount] = React.useState<number>(0)
  const [resumeVariants, setResumeVariants] = React.useState<ResumeVariant[]>([])
  const [baseResumeId, setBaseResumeId] = React.useState<string | null>(null)
  const [recentActivity, setRecentActivity] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!mounted) return
        const email = sessionData.session?.user?.email || null
        setUserEmail(email)

        // Fetch latest resume_data for this user
        if (email) {
          const userId = sessionData.session!.user!.id
          const { data } = await supabase
            .from('resume_data')
            .select('id, personal_info, profile_completeness')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)

          if (data && data.length > 0) {
            const rec: any = data[0]
            setResumeName(rec.personal_info?.name || '')
            setCompleteness(Math.round((rec.profile_completeness || 0) * 100))
            setBaseResumeId(rec.id)

            // Fetch resume variants with job info
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
                  title,
                  company_name
                )
              `)
              .eq('base_resume_id', rec.id)
              .order('updated_at', { ascending: false })
              .limit(5)

            if (variants) {
              setResumeVariants(variants as ResumeVariant[])
            }
          }
        }

        // Fetch job count
        const { count } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        setJobsCount(count || 0)

      } catch (error) {
        console.error('Dashboard data fetch error:', error)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const quickStats: QuickStat[] = [
    {
      label: 'Profile Completion',
      value: `${completeness}%`,
      change: completeness >= 80 ? 'Ready' : 'In Progress',
      trend: completeness >= 80 ? 'up' : 'down',
      icon: completeness >= 80 ? CheckCircle2 : AlertCircle
    },
    {
      label: 'Tailored Resumes',
      value: resumeVariants.length,
      change: 'This month',
      icon: FileText
    },
    {
      label: 'Jobs Available',
      value: jobsCount.toLocaleString(),
      change: 'Active positions',
      icon: Briefcase
    },
    {
      label: 'Match Rate',
      value: resumeVariants.length > 0
        ? `${Math.round(resumeVariants.reduce((acc, v) => acc + (v.match_score || 0), 0) / resumeVariants.length)}%`
        : '0%',
      change: 'Average score',
      icon: Target
    }
  ]

  const actionCards = [
    {
      title: 'Find Your Next Job',
      description: 'Browse tailored job matches',
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
      href: '/jobs',
      cta: 'Browse Jobs'
    },
    {
      title: 'Optimize Resume',
      description: 'AI-powered improvements',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-600',
      href: '/?edit=1',
      cta: 'Edit Resume'
    },
    {
      title: 'Create Cover Letter',
      description: 'Generate personalized letters',
      icon: PenTool,
      color: 'from-green-500 to-emerald-600',
      href: '/cover-letters',
      cta: 'Start Writing'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header with Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            Welcome back{resumeName ? `, ${resumeName.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your job search today.</p>
        </div>
        <Button
          onClick={() => window.location.href = '/?upload=new'}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload New Resume
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center gap-1">
                        {stat.trend && (
                          <TrendingUp className={cn(
                            "w-4 h-4",
                            stat.trend === 'up' ? "text-green-500" : "text-red-500"
                          )} />
                        )}
                        <p className="text-xs text-gray-500">{stat.change}</p>
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    stat.trend === 'up' ? "bg-green-50" : "bg-gray-50"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      stat.trend === 'up' ? "text-green-600" : "text-gray-600"
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tailored Resumes - 2 columns wide */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tailored Resumes</CardTitle>
                  <CardDescription>Your customized resume versions</CardDescription>
                </div>
                {resumeVariants.length > 0 && (
                  <Link href="/jobs">
                    <Button variant="ghost" size="sm">
                      View all
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {resumeVariants.length > 0 ? (
                <div className="space-y-3">
                  {resumeVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                      onClick={() => window.location.href = `/jobs/${variant.job_id}/tailor?variant_id=${variant.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <p className="font-medium text-gray-900 truncate">
                              {variant.jobs?.title || variant.variant_name || 'Untitled Position'}
                            </p>
                            {variant.match_score && (
                              <Badge
                                variant={variant.match_score >= 80 ? "default" : "secondary"}
                                className={cn(
                                  "ml-2",
                                  variant.match_score >= 80 && "bg-green-100 text-green-700"
                                )}
                              >
                                {variant.match_score}% match
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {variant.jobs?.company_name || 'Company not specified'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(variant.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No tailored resumes yet</p>
                  <Button
                    onClick={() => window.location.href = '/jobs'}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Browse Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - 1 column */}
        <div className="space-y-4">
          {actionCards.map((action, index) => {
            const Icon = action.icon
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all cursor-pointer"
                onClick={() => window.location.href = action.href}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center",
                      action.color
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                      <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        {action.cta}
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Resume Health Check */}
      {baseResumeId && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center",
                  completeness >= 80 ? "bg-green-100" : "bg-yellow-100"
                )}>
                  <Activity className={cn(
                    "w-7 h-7",
                    completeness >= 80 ? "text-green-600" : "text-yellow-600"
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Resume Health Check</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={completeness} className="w-32 h-2" />
                    <span className="text-sm text-gray-600">{completeness}% complete</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {completeness >= 80
                      ? "Your resume is ready for applications!"
                      : "Complete your profile for better job matches"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/?edit=1'}
              >
                {completeness >= 80 ? 'View Resume' : 'Complete Profile'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}