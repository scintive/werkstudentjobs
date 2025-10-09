'use client'

import * as React from "react"
import { Scale, Shield, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="page-content">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: 'var(--primary-light)' }}>
            <Scale className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-display mb-4" style={{ color: 'var(--text-primary)' }}>
            Terms of Service
          </h1>
          <p className="text-body-large mb-2" style={{ color: 'var(--text-secondary)' }}>
            Please read these terms carefully before using WerkstudentJobs AI.
          </p>
          <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
            Last updated: January 2025 | Effective Date: January 1, 2025
          </p>
        </div>

        {/* Agreement */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-primary flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                Agreement to Terms
              </h2>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                By accessing or using WerkStudentJobs ("the Platform", "our Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the service. These Terms constitute a legally binding agreement between you and WerkStudentJobs, governed by German law (Bürgerliches Gesetzbuch - BGB).
              </p>
            </div>
          </div>
        </div>

        {/* Service Description */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-primary flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Service Description
              </h2>
              <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                WerkStudentJobs provides an AI-powered platform that helps students find and apply for Werkstudent positions in Germany. Our services include:
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  "AI-powered resume parsing and profile extraction",
                  "Professional profile builder and editor",
                  "Job matching using multiple AI algorithms",
                  "Resume and cover letter tailoring for specific jobs",
                  "PDF generation for application documents",
                  "Job database access and search functionality"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--primary)' }} />
                    <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="info-box info-box-warning">
                <AlertTriangle className="info-box-icon" />
                <div className="info-box-content">
                  <strong>Important:</strong> Our service facilitates job applications but does not guarantee job placement, interview invitations, or employment. We are not an employment agency (Arbeitsvermittlung) under German law.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-success flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Eligibility
              </h2>
              <p className="text-body mb-3" style={{ color: 'var(--text-secondary)' }}>
                To use our service, you must:
              </p>
              <ul className="space-y-2">
                {[
                  "Be at least 16 years old (minimum age under GDPR Art. 8 for digital services)",
                  "Provide accurate and complete registration information",
                  "Maintain the security of your account credentials",
                  "Accept responsibility for all activities under your account",
                  "Not use the service for any unlawful or prohibited purposes"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--success)' }} />
                    <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Acceptable Use */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md flex-shrink-0" style={{ background: 'var(--danger-bg)' }}>
              <XCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Acceptable Use Policy
              </h2>
              <p className="text-label mb-3" style={{ color: 'var(--text-primary)' }}>
                You agree NOT to:
              </p>
              <ul className="space-y-2">
                {[
                  "Use the service for any illegal purpose or in violation of German law",
                  "Upload malicious code, viruses, or harmful software",
                  "Attempt to gain unauthorized access to our systems or other users' accounts",
                  "Scrape, crawl, or systematically extract data from the platform",
                  "Reverse engineer, decompile, or disassemble any part of the service",
                  "Use automated bots or scripts to access the service (except approved APIs)",
                  "Submit false, misleading, or fraudulent information",
                  "Impersonate others or misrepresent your identity",
                  "Harass, abuse, or harm other users or our staff",
                  "Resell or commercially exploit the service without permission"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--danger)' }} />
                    <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* AI Content */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-purple flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                AI-Generated Content
              </h2>
              <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                Our service uses AI (OpenAI's GPT models) to analyze resumes, categorize skills, match jobs, and generate application content. You acknowledge and agree:
              </p>
              <div className="space-y-4">
                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-label mb-1" style={{ color: 'var(--text-primary)' }}>
                    AI Accuracy
                  </h4>
                  <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                    AI-generated content is provided as suggestions and may contain errors. You are responsible for reviewing and verifying all generated content before use.
                  </p>
                </div>
                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-label mb-1" style={{ color: 'var(--text-primary)' }}>
                    No Guarantees
                  </h4>
                  <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                    We do not guarantee that AI suggestions will improve your job application success rate or lead to interviews/employment.
                  </p>
                </div>
                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-label mb-1" style={{ color: 'var(--text-primary)' }}>
                    Human Review Required
                  </h4>
                  <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                    You must review all AI-generated resumes, cover letters, and suggestions before submitting them to employers. Never submit AI content without verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-primary flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Intellectual Property Rights
              </h2>

              <h3 className="text-heading-4 mb-3" style={{ color: 'var(--text-primary)' }}>
                Our IP
              </h3>
              <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
                The Platform, including its software, design, features, logos, and content (excluding user-generated content) is owned by WerkStudentJobs and protected by German and international copyright, trademark, and intellectual property laws.
              </p>

              <h3 className="text-heading-4 mb-3" style={{ color: 'var(--text-primary)' }}>
                Your Content
              </h3>
              <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                You retain all rights to your uploaded resumes, personal information, and user-generated content. By using our service, you grant us a limited, non-exclusive license to:
              </p>
              <ul className="space-y-2">
                {[
                  "Store and process your data to provide the service",
                  "Use AI to analyze and generate suggestions based on your data",
                  "Display your profile within the platform for your use",
                  "Create derived works (tailored resumes) based on your input"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--primary)' }} />
                    <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Liability */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md flex-shrink-0" style={{ background: 'var(--warning-bg)' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Limitation of Liability
              </h2>

              <div className="space-y-4">
                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-label mb-2" style={{ color: 'var(--text-primary)' }}>
                    Unlimited Liability
                  </h4>
                  <p className="text-body-small mb-2" style={{ color: 'var(--text-secondary)' }}>
                    We are fully liable for:
                  </p>
                  <ul className="space-y-1">
                    {[
                      "Intentional misconduct (Vorsatz) or gross negligence (grobe Fahrlässigkeit)",
                      "Personal injury, death, or health damage",
                      "Fraudulent concealment of defects",
                      "Violations of guaranteed characteristics"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-body-small" style={{ color: 'var(--text-muted)' }}>•</span>
                        <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <h4 className="text-label mb-2" style={{ color: 'var(--text-primary)' }}>
                    Limited Liability
                  </h4>
                  <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                    For simple negligence (einfache Fahrlässigkeit), we are only liable for breaches of essential contractual obligations (wesentliche Vertragspflichten). Liability is limited to typical, foreseeable damages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Governing Law */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-primary flex-shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Governing Law and Dispute Resolution
              </h2>

              <h3 className="text-heading-4 mb-2" style={{ color: 'var(--text-primary)' }}>
                Applicable Law
              </h3>
              <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
                These Terms are governed by the laws of the Federal Republic of Germany (Bundesrepublik Deutschland), excluding the UN Convention on Contracts for the International Sale of Goods (CISG).
              </p>

              <h3 className="text-heading-4 mb-2" style={{ color: 'var(--text-primary)' }}>
                Jurisdiction
              </h3>
              <div className="space-y-3">
                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-label mb-1" style={{ color: 'var(--text-primary)' }}>
                    For Consumers:
                  </p>
                  <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                    Mandatory consumer protection laws of your country of residence apply if more favorable. Disputes may be filed in your local courts.
                  </p>
                </div>
                <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-label mb-1" style={{ color: 'var(--text-primary)' }}>
                    EU Online Dispute Resolution:
                  </p>
                  <p className="text-body-small" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    https://ec.europa.eu/consumers/odr
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
          <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
            Contact Information
          </h2>
          <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            For questions about these Terms of Service, please contact:
          </p>
          <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <div className="text-body-small" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              <strong>Email:</strong> legal@werkstudentjobs.com<br />
              <strong>Support:</strong> support@werkstudentjobs.com
            </div>
          </div>
        </div>

        {/* Acceptance */}
        <div className="card mt-8" style={{ background: 'var(--success-bg)', borderColor: 'var(--success)' }}>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--success)' }} />
            <h3 className="text-heading-3" style={{ color: 'var(--text-primary)' }}>
              Agreement Acknowledgment
            </h3>
          </div>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            By creating an account and using WerkStudentJobs, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
