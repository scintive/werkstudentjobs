'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  Target,
  Zap,
  CheckCircle,
  Globe2,
  Check,
  Bookmark,
  BookmarkCheck,
  X,
  Edit3,
  Wand2,
  Download,
  Eye
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Job {
  id: string
  title: string
  city: string
  country: string
  employment_type: string
  work_mode: string
  created_at: string
  company_name?: string
  company_logo?: string
  match_score?: number
  german_required?: string
  is_werkstudent?: boolean
  skills_canonical?: string[]
}

// Match score colors from JobBrowser
const getMatchScoreColor = (score: number) => {
  if (score >= 90) return 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg'
  if (score >= 85) return 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-md'
  if (score >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md'
  if (score >= 70) return 'bg-gradient-to-r from-sky-400 to-indigo-400'
  if (score >= 60) return 'bg-gradient-to-r from-blue-400 to-cyan-400'
  if (score >= 50) return 'bg-gradient-to-r from-amber-400 to-orange-400'
  if (score > 0) return 'bg-gradient-to-r from-orange-300 to-red-400'
  return 'bg-gradient-to-r from-red-500 to-rose-600 shadow-md'
}

const getMatchScoreTextColor = (score: number) => {
  if (score >= 50) return 'text-white'
  if (score === 0) return 'text-white'
  return 'text-gray-700'
}

// Colorful skill pill styles - varied colors for visual interest
const skillColors = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-rose-100 text-rose-700 border-rose-200',
]

const getSkillColor = (index: number) => skillColors[index % skillColors.length]

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [latestJobs, setLatestJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)
  const [savedJobs, setSavedJobs] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const isLoggedIn = !!data.session?.user
      setIsAuthenticated(isLoggedIn)

      // If user is logged in, redirect to dashboard
      if (isLoggedIn) {
        router.push('/dashboard')
        return
      }

      try {
        const token = data.session?.access_token
        const response = await fetch('/api/jobs/latest', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })

        if (response.ok) {
          const result = await response.json()
          setLatestJobs(result.jobs?.slice(0, 5) || [])
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const getTimeSincePosted = (dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffTime = Math.abs(now.getTime() - posted.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  return (
    <div className="page-content">
      {/* Hero Section - 2 Columns */}
      <div className="max-w-7xl mx-auto mb-20 pt-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Hero Content */}
          <div className="pr-4">
            <h1 className="text-5xl font-black text-gray-900 mb-4 leading-tight">
              AI-powered job applications for Werkstudent roles
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Upload your resume once. Our AI analyzes it, matches you with relevant jobs, and generates tailored applications in seconds.
            </p>

            <div className="flex items-center gap-3 mb-6">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <button className="btn btn-primary">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/jobs">
                    <button className="btn btn-secondary">
                      Browse Jobs
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register">
                    <button className="btn btn-primary">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="btn btn-secondary">
                      Sign In
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>AI-powered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>1000+ jobs daily</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
              <div>
                <div className="text-2xl font-black text-gray-900">5,000+</div>
                <div className="text-xs text-gray-600">Students helped</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">95%</div>
                <div className="text-xs text-gray-600">Success rate</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">4.9/5</div>
                <div className="text-xs text-gray-600">User rating</div>
              </div>
            </div>
          </div>

          {/* Right: Latest 5 Jobs - Ultra Compact */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Latest Opportunities</h3>
                <p className="text-xs text-gray-500">Fresh roles updated daily</p>
              </div>
              {!isAuthenticated && (
                <Badge className="badge badge-success text-xs px-2 py-0.5">New</Badge>
              )}
            </div>

            {loading ? (
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((i: any) => (
                  <div key={i} className="skeleton" style={{ height: '64px' }} />
                ))}
              </div>
            ) : latestJobs.length > 0 ? (
              <div className="space-y-1.5">
                {latestJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div
                      className={cn(
                        "p-2 border-l-2 cursor-pointer transition-all duration-200 group relative rounded-md",
                        "bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50",
                        "border-blue-200 hover:border-blue-400 hover:shadow-md"
                      )}
                      onClick={() => router.push(isAuthenticated ? `/jobs/${job.id}` : '/register')}
                    >
                      <div className="flex gap-2">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-50 to-purple-50 rounded flex items-center justify-center overflow-hidden shadow-sm border border-blue-100">
                            {job.company_logo ? (
                              <img src={job.company_logo} alt={job.company_name || ''} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-400" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title and Score */}
                          <div className="flex items-start justify-between mb-0.5">
                            <h3 className="font-semibold text-gray-900 text-xs truncate pr-1 leading-tight">{job.title}</h3>
                            {job.match_score !== undefined && (
                              <div
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 flex items-center gap-0.5 border",
                                  getMatchScoreColor(job.match_score),
                                  getMatchScoreTextColor(job.match_score),
                                  "border-white/20"
                                )}
                              >
                                <Sparkles className="w-2 h-2" />
                                <span className="text-xs">{job.match_score}%</span>
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 truncate mb-0.5">{job.company_name}</p>

                          {/* Meta - Ultra Compact */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            {job.city && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="text-xs">{job.city}</span>
                              </span>
                            )}
                            {job.work_mode && job.work_mode !== 'Unknown' && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs">{job.work_mode}</span>
                              </>
                            )}
                            {job.created_at && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs text-gray-400">
                                  {getTimeSincePosted(job.created_at)}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Badges - Super Compact */}
                          <div className="flex items-center gap-0.5 flex-wrap mb-1">
                            {job.is_werkstudent && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs h-3.5 px-1 font-medium">
                                Werkstudent
                              </Badge>
                            )}
                            {job.employment_type && job.employment_type.toLowerCase().includes('intern') && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-3.5 px-1 font-medium">
                                Intern
                              </Badge>
                            )}
                            {job.german_required && job.german_required !== 'unknown' && (
                              <Badge className={cn("gap-0.5 text-xs h-3.5 px-1 font-medium border",
                                job.german_required === 'DE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                job.german_required === 'EN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                job.german_required === 'both' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''
                              )}>
                                <Globe2 className="w-2 h-2" />
                                <span className="text-xs">
                                  {job.german_required === 'DE' ? 'DE' :
                                   job.german_required === 'EN' ? 'EN' :
                                   job.german_required === 'both' ? 'DE/EN' : ''}
                                </span>
                              </Badge>
                            )}
                          </div>

                          {/* Top 5 Skills Pills - Colorful */}
                          {job.skills_canonical && job.skills_canonical.length > 0 && (
                            <div className="flex items-center gap-0.5 flex-wrap">
                              {job.skills_canonical.slice(0, 5).map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-xs font-medium border inline-block",
                                    getSkillColor(skillIndex)
                                  )}
                                  style={{ fontSize: '10px' }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No jobs available</p>
              </div>
            )}

            {/* CTA */}
            {!isAuthenticated && latestJobs.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <Link href="/register">
                  <button className="btn btn-primary btn-sm w-full text-sm">
                    Sign Up to View All
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resume Editor Section */}
      <div className="max-w-7xl mx-auto mb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full mb-6">
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Visual Resume Editor</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Professional resume editor with live preview
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Edit your resume with a powerful visual editor that shows you exactly how it will look. No more guessing or formatting issues.
            </p>
            <ul className="space-y-3">
              {[
                { icon: Eye, text: "Split-pane editor with live PDF preview" },
                { icon: Wand2, text: "AI-powered skill categorization" },
                { icon: FileText, text: "Dynamic sections for custom content" },
                { icon: Download, text: "Export to multiple professional templates" }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="icon-container icon-container-sm icon-container-primary flex-shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
              <FileText className="w-24 h-24 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Job Tailoring Section */}
      <div className="max-w-7xl mx-auto mb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="aspect-video bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
              <Zap className="w-24 h-24 text-gray-300" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full mb-6">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Smart Job Tailoring</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              AI tailors your resume for every job
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Our AI analyzes each job posting and automatically adapts your resume to highlight the most relevant experience and skills. Accept or reject suggestions with one click.
            </p>
            <ul className="space-y-3">
              {[
                { icon: Sparkles, text: "AI analyzes job requirements and your profile" },
                { icon: Target, text: "Suggests targeted improvements for each section" },
                { icon: Check, text: "Inline accept/reject for full control" },
                { icon: Download, text: "Generate tailored PDF in seconds" }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="icon-container icon-container-sm icon-container-purple flex-shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cover Letter Section */}
      <div className="max-w-7xl mx-auto mb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full mb-6">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">Cover Letter Generator</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Personalized cover letters in seconds
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Generate professional, job-specific cover letters that highlight why you're the perfect fit. No more starting from a blank page.
            </p>
            <ul className="space-y-3">
              {[
                { icon: Wand2, text: "AI writes tailored cover letter for each job" },
                { icon: Edit3, text: "Edit and customize every word" },
                { icon: Eye, text: "Live preview while you edit" },
                { icon: Download, text: "Export as formatted PDF" }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="icon-container icon-container-sm icon-container-success flex-shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center">
              <FileText className="w-24 h-24 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto mb-24">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">
          Trusted by students across Germany
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Sarah M.",
              role: "Computer Science, TUM",
              text: "Got 3 interviews in my first week! The AI tailoring made my resume stand out.",
              rating: 5
            },
            {
              name: "Max K.",
              role: "Business Admin, LMU",
              text: "Saved hours on applications. The cover letter generator is incredible!",
              rating: 5
            },
            {
              name: "Lena W.",
              role: "Data Science, HU Berlin",
              text: "Finally landed my dream Werkstudent role. Worth every cent of the Pro plan!",
              rating: 5
            }
          ].map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Sparkles key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
              <div>
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing Teaser */}
      {!isAuthenticated && (
        <div className="max-w-7xl mx-auto mb-24">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-black mb-4">
              Start free. Upgrade as you grow.
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Get 5 free AI-tailored resumes per month. Upgrade to Pro for unlimited access and premium features.
            </p>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-black">€0</div>
                <div className="text-sm">Free Plan</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-black">€9.99</div>
                <div className="text-sm">Pro Monthly</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-black">€8.33</div>
                <div className="text-sm">Pro Yearly</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <button className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-lg transition-all shadow-lg">
                  Start Free Today
                  <ArrowRight className="w-5 h-5 inline ml-2" />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="bg-white/10 text-white border-2 border-white hover:bg-white/20 font-bold px-8 py-4 rounded-lg transition-all">
                  View All Plans
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Final CTA */}
      {!isAuthenticated && (
        <div className="max-w-3xl mx-auto text-center mb-24">
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            Ready to land your next role?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join 5,000+ students finding Werkstudent jobs with AI-powered applications
          </p>
          <Link href="/register">
            <button className="btn btn-primary btn-lg">
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Cancel anytime • 14-day money-back guarantee
          </p>
        </div>
      )}
    </div>
  )
}
