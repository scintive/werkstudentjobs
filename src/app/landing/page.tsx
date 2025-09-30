'use client'

import * as React from "react"
import { motion } from "framer-motion"
import {
  Sparkles, Upload, Brain, Target, FileText, Download,
  Clock, CheckCircle2, ArrowRight, Zap, Users, TrendingUp,
  Briefcase, MapPin, Building2, Globe
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"

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
}

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [latestJobs, setLatestJobs] = React.useState<Job[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session?.user)
    })

    // Fetch latest jobs
    const fetchJobs = async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token

        const response = await fetch('/api/jobs/latest', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })

        if (response.ok) {
          const result = await response.json()
          setLatestJobs(result.jobs || [])
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const features = [
    {
      icon: Upload,
      title: "Smart Resume Upload",
      description: "Upload your resume and our AI extracts every detail with precision in seconds",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Brain,
      title: "AI Profile Builder",
      description: "Transform your raw data into a professionally structured profile optimized for German Werkstudent roles",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "Intelligent Job Matching",
      description: "Three powerful matching engines analyze thousands of jobs to find your perfect fit",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Auto-Tailored Applications",
      description: "Get custom resumes and cover letters tailored to each job in seconds, not hours",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: FileText,
      title: "Professional Templates",
      description: "Choose from Swiss, Professional, Classic, or Impact templates - all optimized for ATS",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: Download,
      title: "One-Click Export",
      description: "Download your complete application kit as polished PDFs ready to submit",
      gradient: "from-pink-500 to-rose-500"
    }
  ]

  const stats = [
    { number: "5", label: "Minutes to Job-Ready", suffix: "min" },
    { number: "1000+", label: "Werkstudent Jobs", suffix: "" },
    { number: "3", label: "AI Matching Engines", suffix: "" },
    { number: "4", label: "Professional Templates", suffix: "" }
  ]

  const timeline = [
    {
      step: 1,
      title: "Upload Resume",
      description: "Drag & drop your PDF - AI extracts everything instantly",
      time: "30 sec",
      icon: Upload
    },
    {
      step: 2,
      title: "Build Profile",
      description: "Review and enhance your profile with AI suggestions",
      time: "2 min",
      icon: Brain
    },
    {
      step: 3,
      title: "Find Jobs",
      description: "Browse matched jobs with detailed compatibility scores",
      time: "1 min",
      icon: Target
    },
    {
      step: 4,
      title: "Tailor & Export",
      description: "Get custom resume + cover letter for each application",
      time: "90 sec",
      icon: FileText
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation - Conditional */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">WerkstudentJobs AI</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                <Link href="/jobs" className="text-gray-700 hover:text-gray-900 font-medium">
                  Browse Jobs
                </Link>
                <Link href="/logout" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-all">
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                  Login
                </Link>
                <Link href="/register" className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90]
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI-Powered Job Application Platform</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
              Land Your Dream
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Werkstudent Job
              </span>
              <br />
              in 5 Minutes
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
              Upload your resume → AI builds your profile → Browse 1000+ matched jobs →
              <br />
              Download tailored resumes & cover letters. <span className="font-bold text-gray-900">That's it.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-2xl hover:shadow-3xl transition-all flex items-center gap-2"
                >
                  Start Building Your Profile
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="#how-it-works">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-white border-2 border-gray-300 text-gray-900 font-bold text-lg hover:border-gray-400 transition-all"
                >
                  See How It Works
                </motion.button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-200/50 shadow-lg"
                >
                  <div className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              From Resume to Job Offer
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform handles everything - you just focus on landing the interview
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center mb-4 mt-4">
                    <item.icon className="w-7 h-7 text-blue-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>

                  {/* Time Badge */}
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <Clock className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{item.time}</span>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < timeline.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every feature designed to save you time and increase your chances of landing the job
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all h-full">
                  {/* Icon with Gradient */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Latest Werkstudent Jobs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fresh opportunities updated daily from top companies across Germany
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : latestJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {latestJobs.slice(0, 10).map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Company Logo Placeholder */}
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Job Title */}
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {job.title}
                      </h3>

                      {/* Company & Location */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                        {job.company_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {job.company_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.city}, {job.country}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                          {job.employment_type}
                        </span>
                        <span className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-semibold text-purple-700">
                          {job.work_mode}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No jobs available at the moment. Check back soon!
            </div>
          )}

          {/* View All Jobs CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href={isAuthenticated ? "/jobs" : "/register"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
              >
                Browse All Jobs
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              Ready to Get Hired?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed">
              Join thousands of students who've landed their dream Werkstudent jobs.
              <br />
              Your perfect role is just 5 minutes away.
            </p>

            <Link href={isAuthenticated ? "/dashboard" : "/register"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 rounded-xl bg-white text-gray-900 font-black text-xl shadow-2xl hover:shadow-3xl transition-all inline-flex items-center gap-3"
              >
                Get Started for Free
                <Sparkles className="w-6 h-6" />
              </motion.button>
            </Link>

            <p className="text-white/80 mt-6 text-sm">
              No credit card required • Free forever • 5-minute setup
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">WerkstudentJobs AI</span>
              </div>
              <p className="text-sm">
                AI-powered job application platform for students in Germany.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/templates" className="hover:text-white">Templates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 WerkstudentJobs AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}