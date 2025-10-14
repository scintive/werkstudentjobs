'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminPage() {
  const [profileCount, setProfileCount] = useState<number | null>(null)
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const checkProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/profiles')
      const data = await response.json()
      if (data.success) {
        setProfileCount(data.count)
        setMessage(`Found ${data.count} profiles`)
      } else {
        setMessage('Error checking profiles')
      }
    } catch (error) {
      setMessage('Error checking profiles')
    }
    setLoading(false)
  }

  const deleteAllProfiles = async () => {
    if (!confirm('Are you sure you want to delete ALL user profiles? This cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/profiles', { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setMessage('All profiles deleted successfully')
        setProfileCount(0)
      } else {
        setMessage('Error deleting profiles')
      }
    } catch (error) {
      setMessage('Error deleting profiles')
    }
    setLoading(false)
  }

  const clearSession = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/clear-session', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setMessage('Session cookies cleared successfully')
        // Also clear local storage
        localStorage.clear()
        // Clear document cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        })
      } else {
        setMessage('Error clearing session')
      }
    } catch (error) {
      setMessage('Error clearing session')
    }
    setLoading(false)
  }

  const resetEverything = async () => {
    if (!confirm('This will delete ALL data and clear all sessions. Are you sure?')) {
      return
    }

    await deleteAllProfiles()
    await clearSession()
    setMessage('Everything reset! You can now visit / for a fresh start.')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={checkProfiles}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Check Profiles
              </button>
              {profileCount !== null && (
                <span className="text-gray-700">Found: {profileCount} profiles</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={deleteAllProfiles}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Delete All Profiles
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={clearSession}
                disabled={loading}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                Clear Session Cookies
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={resetEverything}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 font-bold"
              >
                🚨 RESET EVERYTHING 🚨
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded ${
                message.includes('Error') 
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                {message}
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded">
              <h3 className="font-bold text-blue-900 mb-2">How to get a fresh start:</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Click "🚨 RESET EVERYTHING 🚨" to clear all data</li>
                <li>Visit <Link href="/" className="underline font-medium">http://localhost:3000</Link> in a new tab</li>
                <li>You should now see the upload interface</li>
                <li>Upload a resume to create a new profile</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}