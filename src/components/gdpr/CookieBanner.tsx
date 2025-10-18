'use client'

import React, { useState } from 'react'
import { useCookieConsent } from '@/lib/contexts/CookieConsentContext'
import { X, Settings, Shield, Cookie } from 'lucide-react'
import Link from 'next/link'

export function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, savePreferences, consent } = useCookieConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    functional: consent?.functional ?? false,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  })

  if (!showBanner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !showDetails && rejectAll()} />

      {/* Banner */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cookie className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Cookie-Einstellungen</h2>
          </div>
          <button
            onClick={rejectAll}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Ablehnen und schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!showDetails ? (
            // Simple view
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="mb-3">
                    Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Nutzererfahrung zu bieten.
                    Einige Cookies sind für den Betrieb der Website notwendig, während andere uns helfen, die Website zu verbessern.
                  </p>
                  <p className="text-xs text-gray-600">
                    Weitere Informationen finden Sie in unserer{' '}
                    <Link href="/datenschutz" className="text-blue-600 hover:underline font-medium">
                      Datenschutzerklärung
                    </Link>
                    {' '}und im{' '}
                    <Link href="/impressum" className="text-blue-600 hover:underline font-medium">
                      Impressum
                    </Link>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={acceptAll}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Alle akzeptieren
                </button>
                <button
                  onClick={rejectAll}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Nur notwendige
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Einstellungen
                </button>
              </div>
            </div>
          ) : (
            // Detailed settings view
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">Notwendige Cookies</h3>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                          Erforderlich
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden.
                        Sie ermöglichen grundlegende Funktionen wie Seitennavigation und Zugriff auf sichere Bereiche.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Beispiele: Authentifizierung, Sitzungsverwaltung, Sicherheit
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-not-allowed opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Funktionale Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung, wie z.B. das Speichern
                        Ihrer Einstellungen und Präferenzen.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Beispiele: Benutzereinstellungen, Theme-Auswahl, Spracheinstellungen
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e: any) => setPreferences({ ...preferences, functional: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Analyse-Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, indem
                        Informationen anonym gesammelt und gemeldet werden.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Derzeit nicht verwendet - Keine externen Analytics-Dienste aktiv
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e: any) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Marketing-Cookies</h3>
                      <p className="text-sm text-gray-600">
                        Diese Cookies werden verwendet, um Besuchern auf Webseiten zu folgen und relevante
                        Anzeigen zu schalten.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Derzeit nicht verwendet - Keine Marketing-Dienste aktiv
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e: any) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => savePreferences(preferences)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                >
                  Auswahl speichern
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Zurück
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 text-center">
          Diese Einstellungen können Sie jederzeit im Footer unter "Cookie-Einstellungen" ändern.
        </div>
      </div>
    </div>
  )
}
