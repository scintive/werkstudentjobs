import React from 'react'
import Link from 'next/link'
import { FileText, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Impressum - AI Job Application System',
  description: 'Impressum und rechtliche Angaben gemäß § 5 TMG',
}

export default function ImpressumPage() {
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
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Angaben gemäß § 5 TMG (Telemediengesetz)
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Important Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-gray-800 font-semibold mb-2">⚠️ Wichtiger Hinweis</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Dieses Impressum enthält Platzhalter und muss mit den tatsächlichen Daten des Websitebetreibers
                ausgefüllt werden. Ein vollständiges und korrektes Impressum ist in Deutschland gesetzlich
                vorgeschrieben (§ 5 TMG, § 55 RStV).
              </p>
              <p className="text-gray-700 text-sm mt-2">
                <strong>Erforderliche Angaben:</strong> Name, Anschrift, Kontaktdaten, ggf. Rechtsform,
                Vertretungsberechtigte, Handelsregister, Umsatzsteuer-ID, Aufsichtsbehörde.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 space-y-8">

          {/* Service Provider */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Diensteanbieter</h2>
            <div className="space-y-6">

              {/* Company/Name */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Name des Betreibers
                </h3>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-gray-800 font-medium">[Ihr vollständiger Name oder Firmenname]</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Bei Unternehmen: Rechtsform angeben (z.B. GmbH, UG, AG, GbR, Einzelunternehmen)
                  </p>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Anschrift
                </h3>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                  <p className="text-gray-800">[Straße und Hausnummer]</p>
                  <p className="text-gray-800">[PLZ und Ort]</p>
                  <p className="text-gray-800">Deutschland</p>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Kontakt
                </h3>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-2">
                  <p className="text-gray-800">
                    <strong className="text-gray-700">E-Mail:</strong>{' '}
                    <a href="mailto:info@example.com" className="text-blue-600 hover:underline">
                      info@example.com
                    </a>
                  </p>
                  <p className="text-gray-800">
                    <strong className="text-gray-700">Telefon:</strong>{' '}
                    <a href="tel:+49123456789" className="text-blue-600 hover:underline">
                      +49 (0) 123 456789
                    </a>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Hinweis: Mindestens eine Form der elektronischen Kontaktaufnahme ist erforderlich
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Company Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Angaben zur Gesellschaft (falls zutreffend)</h2>
            <div className="space-y-4">

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Vertretungsberechtigte(r):</strong> [Name des Geschäftsführers / der Geschäftsführerin]
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Handelsregister:</strong> [z.B. Amtsgericht München, HRB 123456]
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Umsatzsteuer-ID:</strong> [Ihre USt-IdNr. gemäß § 27a UStG]
                </p>
                <p className="text-xs text-gray-600 mt-3">
                  Diese Angaben sind nur erforderlich, wenn Sie ein eingetragenes Unternehmen betreiben.
                  Einzelunternehmer und Freiberufler müssen ggf. andere Angaben machen.
                </p>
              </div>

            </div>
          </section>

          {/* Responsible for Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-gray-800">[Name und vollständige Anschrift]</p>
              <p className="text-sm text-gray-600 mt-2">
                Bei Gesellschaften: Name des Vertretungsberechtigten und vollständige Anschrift des Unternehmens
              </p>
            </div>
          </section>

          {/* EU Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              EU-Streitschlichtung
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            </p>
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            <p className="text-gray-700 leading-relaxed mt-3">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          {/* Consumer Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              (Alternativ: Falls Sie zur Teilnahme verpflichtet sind oder freiwillig teilnehmen möchten,
              geben Sie hier die zuständige Schlichtungsstelle an)
            </p>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Haftungsausschluss</h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Haftung für Inhalte</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Haftung für Links</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
              Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">Urheberrecht</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          {/* Source */}
          <section className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">
              Quelle: Erstellt mit einem kostenlosen Impressum-Generator
            </p>
          </section>

        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/datenschutz" className="text-blue-600 hover:text-blue-700 font-medium">
            Datenschutzerklärung →
          </Link>
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
            Privacy Policy (English) →
          </Link>
        </div>
      </div>
    </div>
  )
}
