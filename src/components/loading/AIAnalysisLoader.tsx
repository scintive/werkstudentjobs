'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSearch,
  Brain,
  Lightbulb,
  Sparkles,
  Check,
  FileText,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface Step {
  id: number
  label: string
  icon: React.ElementType
}

const STRATEGY_STEPS: Step[] = [
  { id: 1, label: 'Analyzing Job Requirements', icon: FileSearch },
  { id: 2, label: 'Evaluating Your Profile', icon: Brain },
  { id: 3, label: 'Identifying Key Strengths', icon: Lightbulb },
  { id: 4, label: 'Crafting Strategy', icon: Sparkles },
  { id: 5, label: 'Finalizing Analysis', icon: Check }
]

const RESUME_STEPS: Step[] = [
  { id: 1, label: 'Loading Base Resume', icon: FileText },
  { id: 2, label: 'Analyzing Job Match', icon: Brain },
  { id: 3, label: 'Generating Suggestions', icon: Lightbulb },
  { id: 4, label: 'Tailoring Content', icon: Zap },
  { id: 5, label: 'Preparing Editor', icon: Check }
]

interface AIAnalysisLoaderProps {
  type: 'strategy' | 'resume'
  title?: string
  subtitle?: string
}

export function AIAnalysisLoader({ type, title, subtitle }: AIAnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps = type === 'strategy' ? STRATEGY_STEPS : RESUME_STEPS
  const defaultTitle = type === 'strategy' ? '🧪 Brewing Your Perfect Strategy' : 'Preparing AI Resume Editor'
  const defaultSubtitle = type === 'strategy'
    ? 'Mixing your skills with job requirements to craft something amazing...'
    : 'Analyzing and tailoring your resume for this specific opportunity...'

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []

    // Intelligent timing: spread steps across expected GPT duration (20-30s)
    // All steps flow smoothly without long pauses
    // Steps 1-3: Quick (2-3s each) - builds trust early
    // Step 4: Moderate (8-10s) - main processing
    // Step 5: Quick (2s) - final polish
    const stepDurations = type === 'strategy'
      ? [2000, 2500, 3000, 8000, 2000] // Total ~17.5s - smooth flow
      : [1500, 2000, 2500, 7000, 1500] // Total ~14.5s - smooth flow

    let accumulatedTime = 0

    stepDurations.forEach((duration, index) => {
      accumulatedTime += duration

      // Set current step
      timers.push(setTimeout(() => {
        setCurrentStep(index)
      }, accumulatedTime - duration))

      // Mark as completed after duration
      timers.push(setTimeout(() => {
        setCompletedSteps(prev => [...prev, index])
      }, accumulatedTime))
    })

    return () => timers.forEach(timer => clearTimeout(timer))
  }, [type])

  return (
    <motion.div
      className="flex items-center justify-center py-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center max-w-2xl px-4">
        {/* Title */}
        <motion.h3
          className="text-3xl font-bold text-gray-900 mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title || defaultTitle}
        </motion.h3>

        <motion.p
          className="text-gray-500 mb-12 leading-relaxed text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {subtitle || defaultSubtitle}
        </motion.p>

        {/* 5-Circle Progress - Simple & Clean */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isCurrent = currentStep === index
            const Icon = step.icon

            return (
              <div key={step.id} className="flex flex-col items-center gap-3">
                {/* Circle with border - green when completed */}
                <div className="relative">
                  <motion.div
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isCurrent
                        ? 'bg-white border-orange-500'
                        : 'bg-white border-gray-200'
                    }`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: isCurrent ? [1, 1.05, 1] : 1,
                      opacity: 1
                    }}
                    transition={{
                      scale: {
                        duration: 2,
                        repeat: isCurrent ? Infinity : 0,
                        ease: "easeInOut"
                      },
                      opacity: { delay: index * 0.1 }
                    }}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Check className="w-7 h-7 text-white" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <>
                        <Icon
                          className={`w-6 h-6 transition-colors ${
                            isCurrent ? 'text-orange-500' : 'text-gray-300'
                          }`}
                        />
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        )}
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Step Label - always visible, highlight current */}
                <span
                  className={`text-xs font-medium text-center min-h-[32px] max-w-[100px] transition-colors duration-300 ${
                    isCurrent ? 'text-gray-900' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Simple Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((completedSteps.length + (currentStep >= 0 ? 0.5 : 0)) / steps.length) * 100}%`
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          {completedSteps.length === steps.length ? (
            <motion.p
              className="text-sm text-green-600 mt-3 font-semibold flex items-center justify-center gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <Check className="w-4 h-4" />
              Analysis Complete! Loading results...
            </motion.p>
          ) : (
            <motion.p
              className="text-xs text-gray-400 mt-2 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Step {currentStep + 1} of {steps.length}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
