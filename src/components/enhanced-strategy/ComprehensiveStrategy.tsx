'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, 
  CheckCircle, 
  Clock, 
  Users, 
  Brain, 
  Zap,
  TrendingUp,
  Calendar,
  MessageCircle,
  Award,
  BookOpen,
  Eye,
  Star,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  FileText,
  Network,
  Shield,
  Trophy,
  Sparkles,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface ComprehensiveStrategyProps {
  strategy: any
  jobData: any
  loading?: boolean
  onRefresh?: () => void
}

export default function ComprehensiveStrategy({ 
  strategy, 
  jobData, 
  loading = false,
  onRefresh 
}: ComprehensiveStrategyProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    application: true,
    company: true,
    interview: true,
    networking: false,
    skills: false,
    timeline: true,
    differentiation: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
        <p className="ml-4 text-gray-600">Generating your comprehensive strategy...</p>
      </div>
    )
  }

  if (!strategy) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Strategy Available</h3>
        <p className="text-gray-500 mb-6">Generate a comprehensive application strategy to get started.</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Strategy
          </button>
        )}
      </div>
    )
  }

  const sections = [
    {
      key: 'application',
      title: 'Application Optimization',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-500',
      data: strategy.application_strategy
    },
    {
      key: 'company',
      title: 'Company Intelligence',
      icon: <Eye className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      data: strategy.company_intelligence
    },
    {
      key: 'interview',
      title: 'Interview Mastery',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      data: strategy.interview_preparation
    },
    {
      key: 'networking',
      title: 'Strategic Networking',
      icon: <Network className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      data: strategy.networking_strategy
    },
    {
      key: 'skills',
      title: 'Skill Development',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-500',
      data: strategy.skill_development
    },
    {
      key: 'timeline',
      title: 'Action Timeline',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-amber-500 to-yellow-500',
      data: strategy.application_timeline
    },
    {
      key: 'differentiation',
      title: 'Competitive Edge',
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-rose-500 to-pink-500',
      data: strategy.differentiation_strategy
    }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Strategy Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Comprehensive Application Strategy</h1>
              <p className="text-blue-100 text-lg">
                Your personalized roadmap to landing {jobData?.title} at {strategy.metadata?.company_name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg px-4 py-2 mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <div className="text-2xl font-bold text-green-300">HIGH</div>
            </div>
            <div className="text-sm text-blue-200">
              {sections.filter(s => s.data && Object.keys(s.data || {}).length > 0).length} sections generated
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <Target className="w-6 h-6 mb-2 text-green-300" />
            <div className="font-semibold">Targeted</div>
            <div className="text-sm text-blue-200">Company-specific insights</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Zap className="w-6 h-6 mb-2 text-yellow-300" />
            <div className="font-semibold">Actionable</div>
            <div className="text-sm text-blue-200">Step-by-step guidance</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <TrendingUp className="w-6 h-6 mb-2 text-purple-300" />
            <div className="font-semibold">Results-Driven</div>
            <div className="text-sm text-blue-200">Measurable outcomes</div>
          </div>
        </div>
      </motion.div>

      {/* Strategy Sections */}
      <div className="grid gap-6">
        {sections.map((section, index) => (
          <StrategySection
            key={section.key}
            title={section.title}
            icon={section.icon}
            color={section.color}
            data={section.data}
            isExpanded={expandedSections[section.key]}
            onToggle={() => toggleSection(section.key)}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Success Metrics */}
      {strategy.success_metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-3xl p-8 border border-green-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-800">Success Metrics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-green-800 mb-3">Application Indicators</h3>
              <ul className="space-y-2">
                {strategy.success_metrics.application_success_indicators?.map((indicator: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                    <span className="text-sm">{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-800 mb-3">Interview Success Signs</h3>
              <ul className="space-y-2">
                {strategy.success_metrics.interview_success_signs?.map((sign: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                    <span className="text-sm">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-800 mb-3">Negotiation Leverage</h3>
              <ul className="space-y-2">
                {strategy.success_metrics.negotiation_leverage?.map((factor: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                    <span className="text-sm">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Individual Strategy Section Component
function StrategySection({ 
  title, 
  icon, 
  color, 
  data, 
  isExpanded, 
  onToggle, 
  delay 
}: {
  title: string
  icon: React.ReactNode
  color: string
  data: any
  isExpanded: boolean
  onToggle: () => void
  delay: number
}) {
  if (!data || Object.keys(data).length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
    >
      <div
        onClick={onToggle}
        className={`bg-gradient-to-r ${color} p-6 cursor-pointer select-none`}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-6 space-y-6">
              <StrategyContent data={data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Dynamic content renderer for different strategy sections
function StrategyContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {Object.entries(data || {}).map(([key, value]) => (
        <div key={key}>
          <h4 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
            {key.replace(/_/g, ' ')}
          </h4>
          <ContentValue value={value} />
        </div>
      ))}
    </div>
  )
}

function ContentValue({ value }: { value: any }) {
  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            {typeof item === 'object' ? (
              <div className="flex-1">
                {Object.entries(item).map(([itemKey, itemValue]) => (
                  <div key={itemKey} className="mb-2 last:mb-0">
                    <span className="font-medium text-gray-700 capitalize">
                      {itemKey.replace(/_/g, ' ')}: 
                    </span>
                    <span className="ml-2 text-gray-600">
                      {Array.isArray(itemValue) ? itemValue.join(', ') : String(itemValue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-700">{String(item)}</span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
          </div>
        ))}
      </div>
    )
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(value).map(([subKey, subValue]) => (
          <div key={subKey} className="p-4 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-800 mb-2 capitalize">
              {subKey.replace(/_/g, ' ')}
            </div>
            <div className="text-blue-700">
              {Array.isArray(subValue) ? (
                <ul className="space-y-1">
                  {subValue.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-blue-500" />
                      <span>{String(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span>{String(subValue)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <p className="text-gray-700 leading-relaxed">{String(value)}</p>
}