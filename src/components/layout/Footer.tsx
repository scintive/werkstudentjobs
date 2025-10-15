'use client'

import * as React from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { useCookieConsent } from '@/lib/contexts/CookieConsentContext'

export const Footer = () => {
  const currentYear = new Date().getFullYear()
  const { openSettings } = useCookieConsent()

  return (
    <footer className="mt-auto border-t bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">WerkStudentJobs</h3>
            <p className="text-sm text-gray-600">
              AI-powered job applications for Werkstudent roles in Germany
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal - English */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <button
                  onClick={openSettings}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Legal - German */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Rechtliches</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/impressum" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Datenschutzerklärung
                </Link>
              </li>
              <li>
                <button
                  onClick={openSettings}
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Cookie-Einstellungen
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-sm text-gray-600">
              © {currentYear} WerkStudentJobs. All rights reserved.
            </p>
            <p className="text-sm text-gray-600">
              Made by <a href="https://scintive.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">Scintive</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}