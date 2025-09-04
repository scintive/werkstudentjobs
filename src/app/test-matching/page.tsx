'use client'

import { useState, useEffect } from 'react'
import { JobMatchingService } from '@/lib/services/jobMatchingService'
import { ResumeDataService } from '@/lib/services/resumeDataService'

export default function TestMatchingPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  const runMatching = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get services
      const matchingService = JobMatchingService.getInstance()
      const resumeService = ResumeDataService.getInstance()
      
      // First ensure we have synced the user profile
      const sessionId = localStorage.getItem('resume_session_id')
      console.log('Session ID:', sessionId)
      
      if (!sessionId) {
        setError('No session found. Please edit your resume first.')
        return
      }
      
      // Get resume data and sync profile
      const resumeData = await resumeService.getOrCreateResumeData()
      console.log('Resume data loaded:', resumeData)
      
      // Force sync to ensure user profile exists
      await resumeService.syncUserProfile(resumeData.data)
      console.log('Profile synced')
      
      // Get profile ID
      const userProfileId = resumeService.getUserProfileId()
      setProfileId(userProfileId)
      console.log('User Profile ID:', userProfileId)
      
      // Run matching
      const matchResults = await matchingService.matchUserToJobs({
        limit: 50,
        useCache: false
      })
      
      console.log('Match results:', matchResults)
      setMatches(matchResults)
      
      // Save results to database
      if (userProfileId) {
        await matchingService.saveMatchResults(userProfileId)
        console.log('Results saved to database')
      }
      
    } catch (err) {
      console.error('Matching error:', err)
      setError(err instanceof Error ? err.message : 'Failed to run matching')
    } finally {
      setLoading(false)
    }
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }
  
  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Job Matching Test</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Session ID: {localStorage.getItem('resume_session_id') || 'Not found'}
            </p>
            {profileId && (
              <p className="text-sm text-gray-600 mb-2">
                Profile ID: {profileId}
              </p>
            )}
          </div>
          
          <button
            onClick={runMatching}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Matching'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {matches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Match Results ({matches.length} jobs)
          </h2>
          
          <div className="space-y-4">
            {matches.map((match, index) => (
              <div key={match.job_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      #{index + 1} - {match.title}
                    </h3>
                    <p className="text-gray-600">
                      {match.company_name || 'Unknown Company'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {match.location || 'Location not specified'} • {match.work_mode}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(match.overall_score)}`}>
                      {match.overall_score.toFixed(1)}%
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getScoreBadge(match.overall_score)}`}>
                      Match Score
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">Skills:</span>
                    <div className="font-semibold">{match.skills_score.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">
                      {match.skills_matched.length} matched
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tools:</span>
                    <div className="font-semibold">{match.tools_score.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">
                      {match.tools_matched.length} matched
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Language:</span>
                    <div className="font-semibold">{match.language_score.toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <div className="font-semibold">{match.location_score.toFixed(1)}%</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Explanation:</strong> {match.match_explanation}
                  </p>
                  
                  {match.skills_matched.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Matched Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.skills_matched.slice(0, 5).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {match.skills_matched.length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            +{match.skills_matched.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {match.skills_missing.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Missing Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.skills_missing.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {match.skills_missing.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            +{match.skills_missing.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {match.application_link && (
                  <div className="mt-3">
                    <a 
                      href={match.application_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Apply Now →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}