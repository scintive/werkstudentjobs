'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Loader2, CheckCircle2, Bug, Lightbulb, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other'

const feedbackTypes = [
  { value: 'bug' as FeedbackType, label: 'Bug Report', icon: Bug, color: 'text-red-600 bg-red-50' },
  { value: 'feature' as FeedbackType, label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50' },
  { value: 'improvement' as FeedbackType, label: 'Improvement', icon: Star, color: 'text-blue-600 bg-blue-50' },
  { value: 'other' as FeedbackType, label: 'Other', icon: MessageCircle, color: 'text-gray-600 bg-gray-50' },
]

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('other')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) return

    setIsSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Submit feedback
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        email: user?.email || null,
        name: user?.user_metadata?.full_name || null,
        type,
        message: message.trim(),
        rating: rating || null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        status: 'new'
      })

      if (error) throw error

      // Show success state
      setIsSuccess(true)
      
      // Reset form after delay
      setTimeout(() => {
        setIsOpen(false)
        setMessage('')
        setRating(0)
        setType('other')
        setIsSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-40 group"
        aria-label="Send feedback"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full animate-pulse"></span>
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Send Feedback
        </span>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Send Feedback</h2>
                  <p className="text-blue-100 text-sm">Help us improve WerkstudentJobs</p>
                </div>
              </div>
            </div>

            {/* Success State */}
            {isSuccess ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">Your feedback has been received. We'll review it soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    What type of feedback is this?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackTypes.map((feedbackType) => {
                      const Icon = feedbackType.icon
                      return (
                        <button
                          key={feedbackType.value}
                          type="button"
                          onClick={() => setType(feedbackType.value)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            type === feedbackType.value
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded ${feedbackType.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm font-medium ${type === feedbackType.value ? 'text-blue-900' : 'text-gray-700'}`}>
                            {feedbackType.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think or what went wrong..."
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/500 characters
                  </p>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    How would you rate your experience? (Optional)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-all hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Feedback
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your feedback helps us improve WerkstudentJobs for everyone
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

