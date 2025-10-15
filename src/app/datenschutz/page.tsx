import React from 'react'
import Link from 'next/link'
import { Shield, Database, Cookie, Mail, FileText } from 'lucide-react'

export const metadata = {
  title: 'Datenschutzerklärung - AI Job Application System',
  description: 'Datenschutzerklärung und Informationen zur Datenverarbeitung gemäß DSGVO',
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Zurück zur Startseite
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Datenschutzerklärung</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Informationen zur Datenverarbeitung gemäß DSGVO
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-gray-500">
              Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <Link href="/privacy" className="text-blue-600 hover:underline">
              English version →
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 space-y-8">

          {/* See existing content from before */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              Diese Datenschutzerklärung informiert Sie über die Art, den Umfang und den Zweck der Verarbeitung
              personenbezogener Daten auf unserer Website. Für weitere Informationen besuchen Sie bitte auch unsere{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                englischsprachige Privacy Policy
              </Link>.
            </p>
          </section>

          {/* Link to English version */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
            <p className="text-gray-800 font-medium mb-2">📄 Ausführliche Datenschutzinformationen</p>
            <p className="text-gray-700 text-sm mb-3">
              Eine vollständige Datenschutzerklärung mit allen Details zur Datenverarbeitung finden Sie auf unserer
              englischsprachigen Privacy-Seite.
            </p>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Privacy Policy (English) →
            </Link>
          </div>

          {/* Key Points in German */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Wichtige Informationen</h2>

            <div className="space-y-4">
              <div className="border-l-4 border-gray-300 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Verantwortlicher</h3>
                <p className="text-gray-700 text-sm">
                  WerkStudentJobs<br />
                  E-Mail: privacy@werkstudentjobs.com
                </p>
              </div>

              <div className="border-l-4 border-gray-300 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Welche Daten werden verarbeitet?</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Account-Daten (E-Mail, Passwort verschlüsselt)</li>
                  <li>Lebenslauf-Daten (Berufserfahrung, Ausbildung, Fähigkeiten)</li>
                  <li>Bewerbungsunterlagen (generierte Lebensläufe, Anschreiben)</li>
                  <li>Technische Daten (IP-Adresse, Browser, Cookies)</li>
                </ul>
              </div>

              <div className="border-l-4 border-gray-300 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Rechtsgrundlagen</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
                  <li>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</li>
                  <li>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)</li>
                </ul>
              </div>

              <div className="border-l-4 border-gray-300 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Ihre Rechte</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Auskunftsrecht (Art. 15 DSGVO)</li>
                  <li>Berichtigungsrecht (Art. 16 DSGVO)</li>
                  <li>Löschungsrecht (Art. 17 DSGVO)</li>
                  <li>Einschränkungsrecht (Art. 18 DSGVO)</li>
                  <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                  <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                  <li>Beschwerderecht bei Aufsichtsbehörde (Art. 77 DSGVO)</li>
                </ul>
              </div>

              <div className="border-l-4 border-gray-300 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">Drittanbieter</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li><strong>Supabase:</strong> Datenbank und Authentifizierung (EU-Server, DSGVO-konform)</li>
                  <li><strong>OpenAI:</strong> KI-Verarbeitung (USA, EU-Standardvertragsklauseln)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cookie Notice */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-blue-600" />
              Cookies
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Diese Website verwendet Cookies. Sie können Ihre Cookie-Einstellungen jederzeit über den
              Link im Footer anpassen.
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Notwendige Cookies:</strong> Authentifizierung, Session-Verwaltung</p>
              <p><strong>Funktionale Cookies:</strong> Benutzereinstellungen (nur mit Einwilligung)</p>
              <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (notwendige), Art. 6 Abs. 1 lit. a DSGVO (funktionale)</p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Kontakt
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns:
            </p>
            <p className="text-gray-800 font-medium">
              E-Mail: privacy@werkstudentjobs.com
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Wir antworten innerhalb von 30 Tagen gemäß DSGVO-Anforderungen.
            </p>
          </section>

        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
            Privacy Policy (English) →
          </Link>
          <Link href="/impressum" className="text-blue-600 hover:text-blue-700 font-medium">
            Impressum →
          </Link>
        </div>
      </div>
    </div>
  )
}
