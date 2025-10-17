'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  MessageCircle, 
  Bug, 
  Lightbulb, 
  Star, 
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  User,
  Globe,
  Edit3
} from 'lucide-react'

type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed'
type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other'

interface Feedback {
  id: string
  user_id: string | null
  email: string | null
  name: string | null
  type: FeedbackType
  message: string
  rating: number | null
  page_url: string | null
  status: FeedbackStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

const feedbackTypeConfig = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200' },
  feature: { label: 'Feature', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  improvement: { label: 'Improvement', icon: Star, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  other: { label: 'Other', icon: MessageCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

const statusConfig = {
  new: { label: 'New', icon: Clock, color: 'text-blue-600 bg-blue-50' },
  in_progress: { label: 'In Progress', icon: Edit3, color: 'text-yellow-600 bg-yellow-50' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  closed: { label: 'Closed', icon: XCircle, color: 'text-gray-600 bg-gray-50' },
}

export default function FeedbackAdminPage() {
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadFeedback = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedbacks(data || [])
    } catch (error) {
      console.error('Error loading feedback:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAuthorization = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== 'varunmisra@gmail.com') {
      router.push('/dashboard')
      return
    }

    setIsAuthorized(true)
    loadFeedback()
  }, [router, loadFeedback])

  useEffect(() => {
    checkAuthorization()
  }, [checkAuthorization])

  const updateStatus = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, status: newStatus } : f
      ))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const updateNotes = async (id: string, notes: string) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ admin_notes: notes })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, admin_notes: notes } : f
      ))
    } catch (error) {
      console.error('Error updating notes:', error)
      alert('Failed to update notes')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredFeedback = feedbacks.filter(f => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false
    if (filterType !== 'all' && f.type !== filterType) return false
    return true
  })

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    in_progress: feedbacks.filter(f => f.status === 'in_progress').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
    avgRating: feedbacks.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length || 0
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Feedback</h1>
                <p className="text-gray-600">Manage and respond to user feedback</p>
              </div>
            </div>
            <button
              onClick={loadFeedback}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Total</div>
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">New</div>
              <div className="text-2xl font-bold text-blue-900">{stats.new}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
              <div className="text-sm text-yellow-600 font-medium mb-1">In Progress</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.in_progress}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Resolved</div>
              <div className="text-2xl font-bold text-green-900">{stats.resolved}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Avg Rating</div>
              <div className="text-2xl font-bold text-purple-900 flex items-center gap-1">
                {stats.avgRating.toFixed(1)}
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Filter className="w-5 h-5" />
            Filters:
          </div>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FeedbackStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FeedbackType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="bug">Bugs</option>
            <option value="feature">Features</option>
            <option value="improvement">Improvements</option>
            <option value="other">Other</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredFeedback.length} of {feedbacks.length} feedbacks
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Found</h3>
            <p className="text-gray-600">No feedback matches your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((feedback) => {
              const typeConfig = feedbackTypeConfig[feedback.type]
              const statusConfigItem = statusConfig[feedback.status]
              const TypeIcon = typeConfig.icon
              const StatusIcon = statusConfigItem.icon
              const isExpanded = expandedId === feedback.id

              return (
                <div key={feedback.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : feedback.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Type Badge */}
                      <div className={`p-2 rounded-lg border ${typeConfig.color}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${typeConfig.color}`}>
                                {typeConfig.label}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 ${statusConfigItem.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusConfigItem.label}
                              </span>
                              {feedback.rating && (
                                <span className="flex items-center gap-1 text-xs">
                                  {[...Array(feedback.rating)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  ))}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 line-clamp-2">{feedback.message}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(feedback.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {feedback.email && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {feedback.name || feedback.email}
                            </div>
                          )}
                          {!feedback.email && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <User className="w-3 h-3" />
                              Anonymous
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                      {/* Page URL */}
                      {feedback.page_url && (
                        <div>
                          <div className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Page URL
                          </div>
                          <a 
                            href={feedback.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                          >
                            {feedback.page_url}
                          </a>
                        </div>
                      )}

                      {/* Status Change */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Update Status
                        </label>
                        <select
                          value={feedback.status}
                          onChange={(e) => updateStatus(feedback.id, e.target.value as FeedbackStatus)}
                          disabled={updatingId === feedback.id}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      {/* Admin Notes */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Admin Notes (Internal)
                        </label>
                        <textarea
                          defaultValue={feedback.admin_notes || ''}
                          onBlur={(e) => {
                            if (e.target.value !== feedback.admin_notes) {
                              updateNotes(feedback.id, e.target.value)
                            }
                          }}
                          placeholder="Add internal notes about this feedback..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                        />
                      </div>

                      {updatingId === feedback.id && (
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

