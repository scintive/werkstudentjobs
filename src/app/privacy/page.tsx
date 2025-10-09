'use client'

import * as React from "react"
import { Shield, Lock, Database, FileText, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: FileText,
      title: "Introduction",
      content: `WerkStudentJobs ("we", "our", or "us") is committed to protecting your privacy in compliance with the General Data Protection Regulation (GDPR/DSGVO) and German data protection laws (BDSG). This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our AI-powered job application platform.`
    },
    {
      icon: Database,
      title: "Data We Collect",
      subsections: [
        {
          title: "Account Information",
          items: [
            "Email address (required for account creation and authentication)",
            "Password (encrypted and hashed)",
            "Account creation and last login timestamps"
          ]
        },
        {
          title: "Profile and Resume Data",
          items: [
            "Personal information: Name, contact details (email, phone, address, LinkedIn)",
            "Professional information: Work experience, education, skills, certifications",
            "Resume documents: Uploaded PDF files",
            "Custom sections and projects",
            "Language proficiencies"
          ]
        },
        {
          title: "Job Application Data",
          items: [
            "Job preferences and search history",
            "Job matching scores and compatibility data",
            "Application variants (tailored resumes)",
            "Cover letter drafts and suggestions"
          ]
        },
        {
          title: "AI Processing Data",
          items: [
            "AI-generated profile extractions from uploaded resumes",
            "Skill categorization and suggestions",
            "Job matching analysis results",
            "Cached AI responses (stored for 6 hours)"
          ]
        },
        {
          title: "Technical Data",
          items: [
            "IP address (for security and fraud prevention)",
            "Browser type and version",
            "Device information",
            "Session cookies and authentication tokens",
            "Usage analytics and error logs"
          ]
        }
      ]
    },
    {
      icon: Lock,
      title: "Legal Basis for Processing",
      content: "We process your data based on:",
      items: [
        {
          title: "Contract Performance (Art. 6(1)(b) GDPR)",
          desc: "Processing your resume data, generating tailored applications, and providing job matching services is necessary to fulfill our service contract with you."
        },
        {
          title: "Consent (Art. 6(1)(a) GDPR)",
          desc: "You provide explicit consent when uploading your resume and using our AI-powered features. You can withdraw consent at any time by deleting your account."
        },
        {
          title: "Legitimate Interests (Art. 6(1)(f) GDPR)",
          desc: "We process technical data for security, fraud prevention, service improvement, and analytics based on our legitimate business interests, balanced against your privacy rights."
        }
      ]
    },
    {
      icon: Shield,
      title: "Data Security",
      content: "We implement industry-standard security measures:",
      items: [
        "End-to-end encryption for data in transit (HTTPS/TLS)",
        "Encrypted database storage with access controls",
        "Bcrypt password hashing (never stored in plain text)",
        "Session-based authentication with secure tokens",
        "Row-Level Security (RLS) policies in our database",
        "Regular security audits and updates",
        "Limited employee access with need-to-know basis",
        "Automated backups with encryption"
      ]
    },
    {
      icon: CheckCircle,
      title: "Your Rights Under GDPR",
      items: [
        {
          title: "Right of Access (Art. 15)",
          desc: "Request a copy of all personal data we hold about you"
        },
        {
          title: "Right to Rectification (Art. 16)",
          desc: "Correct inaccurate or incomplete data via your profile settings"
        },
        {
          title: "Right to Erasure (Art. 17)",
          desc: "Request deletion of your account and all associated data"
        },
        {
          title: "Right to Data Portability (Art. 20)",
          desc: "Export your data in JSON format for use elsewhere"
        },
        {
          title: "Right to Object (Art. 21)",
          desc: "Object to processing based on legitimate interests"
        },
        {
          title: "Right to Withdraw Consent (Art. 7)",
          desc: "Withdraw consent at any time by deleting your account"
        },
        {
          title: "Right to Lodge a Complaint (Art. 77)",
          desc: "File a complaint with your local data protection authority"
        }
      ]
    }
  ]

  return (
    <div className="page-content">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: 'var(--primary-light)' }}>
            <Shield className="w-8 h-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-display mb-4" style={{ color: 'var(--text-primary)' }}>
            Privacy Policy
          </h1>
          <p className="text-body-large mb-2" style={{ color: 'var(--text-secondary)' }}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your data.
          </p>
          <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
            Last updated: January 2025 | Effective Date: January 1, 2025
          </p>
        </div>

        {/* Data Controller */}
        <div className="card mb-8">
          <div className="mb-4">
            <h2 className="text-heading-2 mb-2" style={{ color: 'var(--text-primary)' }}>
              Data Controller
            </h2>
            <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
              The data controller responsible for your personal data is:
            </p>
          </div>
          <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <div className="text-body-small" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              WerkStudentJobs<br />
              [Company Address]<br />
              [City, Postal Code]<br />
              Germany<br />
              Email: privacy@werkstudentjobs.com
            </div>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, index) => (
          <div key={index} className="card mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="icon-container icon-container-md icon-container-primary flex-shrink-0">
                <section.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-heading-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                  {section.title}
                </h2>
                {section.content && (
                  <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {section.content}
                  </p>
                )}
              </div>
            </div>

            {section.subsections && (
              <div className="space-y-6 ml-16">
                {section.subsections.map((subsection, subIndex) => (
                  <div key={subIndex}>
                    <h3 className="text-heading-4 mb-3" style={{ color: 'var(--text-primary)' }}>
                      {subsection.title}
                    </h3>
                    <ul className="space-y-2">
                      {subsection.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--primary)' }} />
                          <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {section.items && (
              <div className="space-y-4 ml-16">
                {section.items.map((item, itemIndex) => (
                  typeof item === 'string' ? (
                    <div key={itemIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: 'var(--primary)' }} />
                      <span className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                        {item}
                      </span>
                    </div>
                  ) : (
                    <div key={itemIndex} className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <h4 className="text-label mb-1" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h4>
                      <p className="text-body-small" style={{ color: 'var(--text-secondary)' }}>
                        {item.desc}
                      </p>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Third-Party Services */}
        <div className="card mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-container icon-container-md icon-container-primary flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-heading-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                Third-Party Services & Data Transfers
              </h2>
              <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
                We work with trusted service providers to deliver our platform:
              </p>
            </div>
          </div>

          <div className="space-y-4 ml-16">
            <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <h4 className="text-label mb-2" style={{ color: 'var(--text-primary)' }}>
                Supabase (Database & Authentication)
              </h4>
              <p className="text-body-small mb-2" style={{ color: 'var(--text-secondary)' }}>
                We use Supabase for secure database storage and user authentication. Data is stored in EU regions with GDPR-compliant infrastructure.
              </p>
              <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                Location: EU | Privacy: GDPR Compliant
              </p>
            </div>

            <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <h4 className="text-label mb-2" style={{ color: 'var(--text-primary)' }}>
                OpenAI (AI Processing)
              </h4>
              <p className="text-body-small mb-2" style={{ color: 'var(--text-secondary)' }}>
                We use OpenAI's API for AI-powered resume analysis and content generation. OpenAI does not use API data to train their models. Data is processed in accordance with OpenAI's Enterprise Privacy commitments.
              </p>
              <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                Location: USA | Data Processing Agreement: Standard Contractual Clauses
              </p>
            </div>

            <div className="info-box info-box-primary">
              <AlertCircle className="info-box-icon" />
              <div className="info-box-content">
                <strong>International Data Transfers:</strong> When data is transferred outside the EU (e.g., to OpenAI in the USA), we ensure adequate protection through Standard Contractual Clauses (SCCs) approved by the European Commission, in compliance with GDPR Chapter V.
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card" style={{ background: 'var(--primary-light)', borderColor: 'var(--primary)' }}>
          <h2 className="text-heading-2 mb-4" style={{ color: 'var(--text-primary)' }}>
            Contact Us
          </h2>
          <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
            For questions about this Privacy Policy or to exercise your rights, please contact:
          </p>
          <div className="surface p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
            <div className="text-body-small" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              <strong>Email:</strong> privacy@werkstudentjobs.com<br />
              <strong>Data Protection Officer:</strong> dpo@werkstudentjobs.com<br />
              <strong>Response Time:</strong> Within 30 days (GDPR requirement)
            </div>
          </div>
          <p className="text-caption mt-4" style={{ color: 'var(--text-muted)' }}>
            You also have the right to lodge a complaint with the German Federal Commissioner for Data Protection and Freedom of Information (BfDI) or your local state data protection authority.
          </p>
        </div>
      </div>
    </div>
  )
}
