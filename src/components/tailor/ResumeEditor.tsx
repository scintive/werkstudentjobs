'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ResumeData {
  personalInfo: {
    name: string
    email: string
    phone: string
    location: string
    linkedin: string
    website: string
  }
  professionalSummary: string
  skills: Record<string, string[]>
  experience: any[]
  education: any[]
  projects: any[]
  certifications: any[]
}

interface ResumeEditorProps {
  data: ResumeData
  onChange: (data: ResumeData) => void
  aiSuggestions?: any[]
  onSuggestionAccept?: (id: string) => void
  onSuggestionReject?: (id: string) => void
}

export function ResumeEditor({
  data,
  onChange,
  aiSuggestions = [],
  onSuggestionAccept,
  onSuggestionReject
}: ResumeEditorProps) {
  const updateData = (updates: Partial<ResumeData>) => {
    onChange({ ...data, ...updates })
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={data.personalInfo.name}
              onChange={(e) => updateData({
                personalInfo: { ...data.personalInfo, name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={data.personalInfo.email}
              onChange={(e) => updateData({
                personalInfo: { ...data.personalInfo, email: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={data.personalInfo.phone}
              onChange={(e) => updateData({
                personalInfo: { ...data.personalInfo, phone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={data.personalInfo.location}
              onChange={(e) => updateData({
                personalInfo: { ...data.personalInfo, location: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Summary</h3>
        <textarea
          value={data.professionalSummary}
          onChange={(e) => updateData({ professionalSummary: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Write a compelling professional summary..."
        />
        
        {/* AI Suggestions for Summary */}
        {aiSuggestions.filter(s => s.section === 'summary').map(suggestion => (
          <div key={suggestion.id} className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">AI Suggestion:</p>
                <p className="text-sm text-gray-900">{suggestion.suggestion}</p>
                <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onSuggestionAccept?.(suggestion.id)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => onSuggestionReject?.(suggestion.id)}
                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
        {Object.entries(data.skills).map(([category, skills]) => (
          <div key={category} className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(skills) && skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}