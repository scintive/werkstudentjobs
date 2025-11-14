'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, Crown, ArrowRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface PricingPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  features: string[]
  limits: Record<string, number>
  sort_order: number
  isPopular?: boolean
}

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = React.useState<PricingPlan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  React.useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session?.user)

      // Fetch plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (plansData) {
        setPlans(plansData as PricingPlan[])
      }

      setLoading(false)
    }

    init()
  }, [])

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      router.push(`/register?plan=${planId}&billing=${billingCycle}`)
      return
    }

    if (planId === 'free') {
      router.push('/dashboard')
      return
    }

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ planId, billingCycle })
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro':
        return Zap
      case 'enterprise':
        return Crown
      default:
        return Sparkles
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'pro':
        return 'from-blue-500 to-indigo-500'
      case 'enterprise':
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  const yearlyDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12
    const savings = monthlyTotal - yearlyPrice
    const percentage = Math.round((savings / monthlyTotal) * 100)
    return percentage
  }

  return (
    <div className="page-content">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            Choose your plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-semibold transition-all',
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2',
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Yearly
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 mb-20">
        {plans.map((plan, index) => {
          const Icon = getPlanIcon(plan.id)
          const isPopular = plan.id === 'pro'
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
          const monthlyPrice = billingCycle === 'yearly' ? Math.round(plan.price_yearly / 12) : plan.price_monthly

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {isPopular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div
                className={cn(
                  'card p-8 h-full flex flex-col',
                  isPopular && 'ring-2 ring-blue-500 shadow-2xl'
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('icon-container bg-gradient-to-br', getPlanColor(plan.id))}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                </div>

                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-8">
                  {plan.id === 'free' ? (
                    <div className="flex items-baseline">
                      <span className="text-5xl font-black text-gray-900">Free</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-gray-900">
                          €{(monthlyPrice / 100).toFixed(0)}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-sm text-gray-500 mt-1">
                          Billed €{(price / 100).toFixed(0)} yearly
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className={cn(
                    'w-full mb-8',
                    isPopular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  )}
                >
                  {plan.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="space-y-3 flex-1">
                  {plan.features && plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto mb-20">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">
          Compare all features
        </h2>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center p-4 font-semibold text-gray-900">Free</th>
                <th className="text-center p-4 font-semibold text-gray-900">Pro</th>
                <th className="text-center p-4 font-semibold text-gray-900">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Job Browsing', free: '✓', pro: '✓', enterprise: '✓' },
                { feature: 'Resume Editor', free: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
                { feature: 'AI Tailoring', free: '5/month', pro: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'Resume Exports', free: '3/month', pro: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'Cover Letters', free: '2/month', pro: 'Unlimited', enterprise: 'Unlimited' },
                { feature: 'Templates', free: 'Basic', pro: 'Premium', enterprise: 'Custom' },
                { feature: 'Support', free: 'Community', pro: 'Priority', enterprise: 'Dedicated' },
                { feature: 'Analytics', free: '—', pro: '✓', enterprise: '✓' },
                { feature: 'Team Collaboration', free: '—', pro: '—', enterprise: '✓' },
                { feature: 'API Access', free: '—', pro: '—', enterprise: '✓' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="p-4 text-gray-700">{row.feature}</td>
                  <td className="p-4 text-center text-gray-600">{row.free}</td>
                  <td className="p-4 text-center text-gray-600">{row.pro}</td>
                  <td className="p-4 text-center text-gray-600">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-20">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-12">
          Frequently asked questions
        </h2>

        <div className="space-y-4">
          {[
            {
              question: 'Can I switch plans at any time?',
              answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any charges.'
            },
            {
              question: 'What happens when I hit my usage limit?',
              answer: 'On the free plan, you'll be prompted to upgrade to continue using premium features. Pro and Enterprise plans have unlimited usage for core features.'
            },
            {
              question: 'Do you offer refunds?',
              answer: 'Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.'
            },
            {
              question: 'Is there a free trial?',
              answer: 'All paid plans include a 14-day free trial. No credit card required to start.'
            },
            {
              question: 'Can I cancel anytime?',
              answer: 'Absolutely! You can cancel your subscription at any time from your account settings. You'll retain access until the end of your billing period.'
            }
          ].map((faq, i) => (
            <details key={i} className="card p-4 cursor-pointer group">
              <summary className="flex items-start gap-3 font-semibold text-gray-900 list-none">
                <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{faq.question}</span>
              </summary>
              <p className="mt-3 ml-8 text-gray-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-12 mb-20">
        <h2 className="text-4xl font-black text-white mb-4">
          Ready to accelerate your job search?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of students landing their dream Werkstudent roles with AI
        </p>
        <Link href={isAuthenticated ? '/dashboard' : '/register'}>
          <Button className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg">
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
