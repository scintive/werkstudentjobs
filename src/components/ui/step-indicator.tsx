'use client'

import * as React from "react"
import { Check } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import type { AppStep } from "@/lib/types"

interface StepIndicatorProps {
  steps: AppStep[]
  currentStep: string
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative">
              {/* Step Circle */}
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: step.completed 
                    ? "hsl(var(--primary))"
                    : step.current 
                      ? "hsl(var(--primary))" 
                      : "hsl(var(--muted))",
                  borderColor: step.completed || step.current 
                    ? "hsl(var(--primary))" 
                    : "hsl(var(--border))",
                }}
                className={cn(
                  "flex items-center justify-center w-10 h-10 border-2 rounded-full",
                  "transition-colors duration-200"
                )}
              >
                {step.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <span 
                    className={cn(
                      "text-sm font-medium",
                      step.current ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-24">
                <p className={cn(
                  "text-xs font-medium",
                  step.current ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 mt-[-2rem]">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: steps[index + 1].completed || (step.completed && steps[index + 1].current)
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                  }}
                  className="h-0.5 w-full transition-colors duration-300"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
}