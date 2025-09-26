'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  HelpCircle,
  Mail,
  MessageSquare,
  Book,
  FileText,
  Zap,
  Shield,
  ExternalLink
} from 'lucide-react'

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I create my first resume?',
      answer: 'Start by uploading your existing resume or create one from scratch using our Resume Editor. Our AI will help optimize it for your target jobs.'
    },
    {
      question: 'What is the Tailor Resume feature?',
      answer: 'Tailor Resume uses AI to customize your resume for specific job postings, increasing your chances of passing ATS systems and catching recruiters\' attention.'
    },
    {
      question: 'How many resumes can I create?',
      answer: 'Free users can create up to 3 resumes. Pro users get unlimited resumes and additional premium features.'
    },
    {
      question: 'Can I export my resume to PDF?',
      answer: 'Yes! All resumes can be exported to PDF format. You can also choose from multiple professional templates.'
    },
    {
      question: 'How does the job matching work?',
      answer: 'Our AI analyzes your skills and experience against job requirements to show you the best matching opportunities.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption and security practices to protect your personal information.'
    }
  ]

  const resources = [
    {
      icon: Book,
      title: 'Getting Started Guide',
      description: 'Learn the basics of using WerkstudentJobs',
      link: '#'
    },
    {
      icon: FileText,
      title: 'Resume Best Practices',
      description: 'Tips for creating an effective resume',
      link: '#'
    },
    {
      icon: Zap,
      title: 'AI Features Tutorial',
      description: 'Master our AI-powered tools',
      link: '#'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'How we protect your data',
      link: '#'
    }
  ]

  return (
    <div className="page-content">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="heading-xl" style={{ color: 'var(--text-primary)' }}>
            Help & Support
          </h1>
          <p className="text-base mt-2" style={{ color: 'var(--text-secondary)' }}>
            Find answers to common questions and get support
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ background: 'var(--primary-light)' }}>
                  <MessageSquare className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="font-semibold">Live Chat</p>
                  <p className="text-sm text-gray-600">Chat with support team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ background: 'var(--info-bg)' }}>
                  <Mail className="w-6 h-6" style={{ color: 'var(--info)' }} />
                </div>
                <div>
                  <p className="font-semibold">Email Support</p>
                  <p className="text-sm text-gray-600">support@werkstudentjobs.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ background: 'var(--success-bg)' }}>
                  <Book className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <div>
                  <p className="font-semibold">Documentation</p>
                  <p className="text-sm text-gray-600">Browse help articles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {faq.question}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <div>
          <h2 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
            Helpful Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource, index) => {
              const Icon = resource.icon
              return (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Icon className="w-8 h-8" style={{ color: 'var(--primary)' }} />
                        <div>
                          <p className="font-semibold">{resource.title}</p>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Contact Section */}
        <Card className="mt-8 text-center">
          <CardContent className="py-8">
            <h3 className="heading-md mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Our support team is here to assist you
            </p>
            <Button
              style={{ background: 'var(--primary)' }}
              className="text-white hover:opacity-90"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}