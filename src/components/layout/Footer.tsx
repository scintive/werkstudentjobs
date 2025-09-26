'use client'

import * as React from 'react'
import { Heart, Github, Linkedin, Mail, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">ResumeBuilder Pro</h3>
            <p className="text-sm text-gray-600">
              AI-powered resume optimization for your dream job
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
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
                <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Resume Editor
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Job Browser
                </Link>
              </li>
              <li>
                <Link href="/cover-letters" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Cover Letters
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                  Templates
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                  Resume Guide
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1">
                  Career Blog
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <Link href="/settings" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600">
              © {currentYear} ResumeBuilder Pro. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for job seekers everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}