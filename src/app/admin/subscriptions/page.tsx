'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  Crown,
  AlertCircle,
  Check,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SubscriptionStats {
  total_users: number
  active_subscriptions: number
  mrr: number
  churn_rate: number
}

interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  created_at: string
  user_email?: string
  plan_name?: string
}

export default function SubscriptionsAdminPage() {
  const [stats, setStats] = React.useState<SubscriptionStats>({
    total_users: 0,
    active_subscriptions: 0,
    mrr: 0,
    churn_rate: 0
  })
  const [subscriptions, setSubscriptions] = React.useState<UserSubscription[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    try {
      // Load subscription stats
      const { data: subsData } = await supabase
        .from('user_subscriptions')
        .select('*')

      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')

      if (subsData && plansData) {
        // Calculate stats
        const active = subsData.filter(s => s.status === 'active').length
        const planMap = new Map(plansData.map(p => [p.id, p]))

        // Calculate MRR
        const mrr = subsData
          .filter(s => s.status === 'active')
          .reduce((sum, sub) => {
            const plan = planMap.get(sub.plan_id)
            if (!plan) return sum
            const monthlyValue = sub.billing_cycle === 'yearly'
              ? plan.price_yearly / 12
              : plan.price_monthly
            return sum + monthlyValue
          }, 0)

        setStats({
          total_users: subsData.length,
          active_subscriptions: active,
          mrr: mrr / 100, // Convert from cents
          churn_rate: subsData.length > 0 ? ((subsData.length - active) / subsData.length) * 100 : 0
        })

        // Load subscriptions with user emails
        const { data: fullSubs } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            plan:subscription_plans(name)
          `)
          .order('created_at', { ascending: false })

        if (fullSubs) {
          // Get user emails from auth
          const userIds = fullSubs.map(s => s.user_id)
          const usersData = await Promise.all(
            userIds.map(async (id) => {
              const { data } = await supabase.auth.admin.getUserById(id)
              return { id, email: data.user?.email }
            })
          )

          const userEmailMap = new Map(usersData.map(u => [u.id, u.email]))

          const enrichedSubs = fullSubs.map(sub => ({
            ...sub,
            user_email: userEmailMap.get(sub.user_id),
            plan_name: (sub.plan as any)?.name
          }))

          setSubscriptions(enrichedSubs)
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Active' },
      canceled: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Canceled' },
      past_due: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Past Due' },
      trialing: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Trial' },
    }

    const config = statusConfig[status] || statusConfig.active

    return (
      <Badge className={cn('border', config.color)}>
        {config.label}
      </Badge>
    )
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchQuery ||
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="page-content">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Subscriptions</h1>
            <p className="text-gray-600">Manage and monitor all user subscriptions</p>
          </div>
          <Button className="btn-primary">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="icon-container icon-container-primary">
                <Users className="w-5 h-5" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats.total_users}
            </div>
            <div className="text-sm text-gray-600">Total Subscriptions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="icon-container bg-gradient-to-br from-green-500 to-emerald-500">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats.active_subscriptions}
            </div>
            <div className="text-sm text-gray-600">Active Subscriptions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="icon-container bg-gradient-to-br from-purple-500 to-pink-500">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              €{stats.mrr.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Monthly Recurring Revenue</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="icon-container bg-gradient-to-br from-orange-500 to-red-500">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              {stats.churn_rate > 10 ? (
                <X className="w-5 h-5 text-red-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats.churn_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Churn Rate</div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trialing">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="skeleton h-64" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Plan</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Billing</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Period End</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Created</th>
                    <th className="text-right p-4 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub, index) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {sub.user_email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{sub.user_email}</div>
                            <div className="text-xs text-gray-500">{sub.user_id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {sub.plan_id === 'enterprise' && (
                            <Crown className="w-4 h-4 text-purple-500" />
                          )}
                          <span className="font-medium text-gray-900">{sub.plan_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="p-4">
                        <Badge className="badge badge-secondary">
                          {sub.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Button className="btn-secondary btn-sm">
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
