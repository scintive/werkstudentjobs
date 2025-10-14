/**
 * Analysis Loading State Component
 *
 * Clean, reusable loading animation for job analysis
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2 } from 'lucide-react';

interface AnalysisLoadingStateProps {
  message?: string;
  submessage?: string;
}

export function AnalysisLoadingState({
  message = "Analyzing Your Profile...",
  submessage = "Our AI is performing deep compatibility analysis. This takes 20-30 seconds."
}: AnalysisLoadingStateProps) {
  return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated icon */}
        <motion.div
          className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
          }}
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 3, -3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Target className="w-8 h-8 text-white" />
        </motion.div>

        {/* Loading text */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
          {submessage}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: '#667eea' }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.1, 0.8]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
