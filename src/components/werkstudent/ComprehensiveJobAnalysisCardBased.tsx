'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target, CheckCircle, AlertTriangle, BookOpen, ExternalLink, Briefcase, Rocket, Award, Heart, Code
} from 'lucide-react';
import type { IntelligentJobAnalysis } from '@/lib/services/intelligentJobAnalysisService';
import { bestFallbackFor } from '@/lib/linkSources';

interface Props {
  analysis: IntelligentJobAnalysis;
  userProfile: any;
  jobData: any;
}

// Learning resource generator based on skill/responsibility
function getLearningResources(skill: string, task: string): { label: string; url: string }[] {
  const norm = (s: string) => s.toLowerCase().trim();
  const t = norm(task + ' ' + skill);
  const resources: { label: string; url: string }[] = [];

  // Technical skills
  if (/(react|javascript|typescript|frontend)/.test(t)) {
    resources.push(
      { label: 'freeCodeCamp JavaScript', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/' },
      { label: 'Meta Front-End Cert', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' }
    );
  }

  if (/(python|data)/.test(t)) {
    resources.push(
      { label: 'Kaggle Micro-courses', url: 'https://www.kaggle.com/learn' },
      { label: 'IBM Data Analysis', url: 'https://www.coursera.org/learn/data-analysis-with-python' }
    );
  }

  if (/(sql|database)/.test(t)) {
    resources.push(
      { label: 'freeCodeCamp SQL', url: 'https://www.freecodecamp.org/news/learn-sql-free-relational-database-courses-for-beginners/' },
      { label: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' }
    );
  }

  if (/(aws|cloud|azure)/.test(t)) {
    resources.push(
      { label: 'AWS Cloud Practitioner', url: 'https://www.aws.training/Details/Curriculum?id=20685' },
      { label: 'AWS Certified Developer', url: 'https://aws.amazon.com/certification/certified-developer-associate/' }
    );
  }

  if (/(docker|kubernetes|devops)/.test(t)) {
    resources.push(
      { label: 'Docker Get Started', url: 'https://docs.docker.com/get-started/' },
      { label: 'Kubernetes Basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' }
    );
  }

  // Design/UX
  if (/(ux|ui|design|figma)/.test(t)) {
    resources.push(
      { label: 'Google UX Design', url: 'https://www.coursera.org/professional-certificates/google-ux-design' },
      { label: 'Figma Learn', url: 'https://help.figma.com/hc/en-us/articles/1500004361281-Get-started-with-Figma' }
    );
  }

  // Marketing/Analytics
  if (/(seo|marketing|analytics|google analytics)/.test(t)) {
    resources.push(
      { label: 'Google Skillshop', url: 'https://skillshop.exceedlms.com/student/catalog' },
      { label: 'HubSpot Academy', url: 'https://academy.hubspot.com/' },
      { label: 'Google Analytics Cert', url: 'https://skillshop.exceedlms.com/student/path/2938-google-analytics-certification' }
    );
  }

  // Project Management
  if (/(scrum|agile|jira|project management)/.test(t)) {
    resources.push(
      { label: 'The Scrum Guide', url: 'https://scrumguides.org/' },
      { label: 'Atlassian Jira', url: 'https://university.atlassian.com/student/catalog' }
    );
  }

  // eCommerce
  if (/(ecommerce|shopify|woocommerce)/.test(t)) {
    resources.push(
      { label: 'Shopify Learn', url: 'https://www.shopify.com/blog/topics/guides' },
      { label: 'eCommerce Fundamentals', url: 'https://www.coursera.org/learn/ecommerce' }
    );
  }

  // Content/Social Media
  if (/(content|social media|copywriting)/.test(t)) {
    resources.push(
      { label: 'HubSpot Content Marketing', url: 'https://academy.hubspot.com/courses/content-marketing' },
      { label: 'Meta Social Media Marketing', url: 'https://www.coursera.org/professional-certificates/facebook-social-media-marketing' }
    );
  }

  // Fallback: YouTube crash course
  if (resources.length === 0) {
    const q = encodeURIComponent(task + ' ' + skill);
    resources.push(
      { label: 'Crash course', url: `https://www.youtube.com/results?search_query=${q}+crash+course` }
    );
  }

  return resources.slice(0, 3);
}

export function ComprehensiveJobAnalysis({ analysis, userProfile, jobData }: Props) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const overallColor = getScoreColor(analysis.overall_match_score);

  // Extract additional sections from user profile
  const userProjects = userProfile?.projects || [];
  const userCertifications = userProfile?.certifications || [];

  // Extract custom sections if they exist
  const customSections = userProfile?.custom_sections || {};
  const hasLeadership = customSections?.leadership?.length > 0 || customSections?.awards?.length > 0;
  const hasVolunteer = customSections?.volunteer?.length > 0;

  return (
    <div className="card card-elevated" style={{ padding: '2rem' }}>
      {/* Header with creative typography */}
      <div className="card-header" style={{ paddingBottom: '1.5rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
        <div className="flex items-center gap-4 flex-1">
          <div
            className="icon-container icon-container-lg"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3), 0 4px 6px rgba(102, 126, 234, 0.2)'
            }}
          >
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <div
              className="font-bold tracking-tight"
              style={{
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}
            >
              Job Analysis
            </div>
            <div className="text-body text-gray-600 font-medium tracking-wide" style={{ marginTop: '0.25rem' }}>
              AI-powered compatibility analysis and learning paths
            </div>
          </div>
        </div>
        <div
          className={`badge badge-lg border-2 font-bold`}
          style={{
            fontSize: '1.25rem',
            padding: '0.75rem 1.5rem',
            background: analysis.overall_match_score >= 80
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : analysis.overall_match_score >= 60
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {analysis.overall_match_score}% match
        </div>
      </div>

      {/* Grid layout - Responsibility cards and sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content - Responsibility cards */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {analysis.responsibility_breakdown.map((resp, i) => {
            const color = getScoreColor(resp.compatibility_score);
            const learningResources = getLearningResources(
              resp.responsibility,
              jobData.title
            );

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="card"
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}
              >
                {/* Responsibility title and score - CREATIVE TYPOGRAPHY */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="font-bold leading-tight flex-1"
                    style={{
                      fontSize: '1.125rem',
                      letterSpacing: '-0.01em',
                      color: '#1f2937',
                      lineHeight: '1.4'
                    }}
                  >
                    {resp.responsibility}
                  </div>
                  <div
                    className="flex-shrink-0 font-extrabold"
                    style={{
                      fontSize: '1.5rem',
                      background: resp.compatibility_score >= 80
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : resp.compatibility_score >= 60
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {resp.compatibility_score}%
                  </div>
                </div>

                {/* Progress bar with depth */}
                <div
                  className="mb-5"
                  style={{
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div
                    style={{
                      width: `${resp.compatibility_score}%`,
                      height: '100%',
                      background: resp.compatibility_score >= 80
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : resp.compatibility_score >= 60
                        ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                        : 'linear-gradient(90deg, #f59e0b, #d97706)',
                      borderRadius: '999px',
                      transition: 'width 0.6s ease-in-out',
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
                    }}
                  />
                </div>

                {/* Gap analysis if exists */}
                {resp.gap_analysis && (
                  <div
                    className="mb-5 leading-relaxed font-medium"
                    style={{
                      fontSize: '0.9375rem',
                      color: '#4b5563',
                      lineHeight: '1.7'
                    }}
                  >
                    {resp.gap_analysis}
                  </div>
                )}

                {/* Learning resources - Use GPT recommendations if available, otherwise fallback */}
                {resp.learning_recommendation && (
                  <div className="mb-5">
                    <div
                      className="flex items-center gap-2 mb-3"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        color: '#059669',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      <BookOpen className="w-4 h-4" />
                      Quick Learning Path
                    </div>
                    <div className="flex flex-wrap gap-2 max-w-full">
                      {(resp.recommended_courses && resp.recommended_courses.length > 0
                        ? resp.recommended_courses.map((course, idx) => ({
                            label: `${course.name} (${course.provider})`,
                            url: course.url || `https://www.google.com/search?q=${encodeURIComponent(course.name + ' ' + course.provider)}`
                          }))
                        : learningResources
                      ).map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all max-w-full"
                          style={{
                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            color: '#065f46',
                            textDecoration: 'none',
                            wordBreak: 'break-word',
                            border: '1px solid #86efac',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)'
                          }}
                        >
                          <span className="truncate">{resource.label}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                    <div
                      className="mt-3 leading-relaxed"
                      style={{
                        fontSize: '0.8125rem',
                        color: '#6b7280',
                        fontWeight: 500,
                        lineHeight: '1.6'
                      }}
                    >
                      💡 {resp.learning_recommendation}
                    </div>
                  </div>
                )}

                {/* Evidence if user has it - FIXED: No truncation, smaller icon */}
                {resp.user_evidence && resp.user_evidence.length > 0 && (
                  <div
                    className="flex gap-3 p-4 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
                      border: '1px solid #bfdbfe'
                    }}
                  >
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div style={{ fontSize: '0.8125rem' }}>
                      <div className="font-bold mb-2 text-blue-900" style={{ fontSize: '0.875rem' }}>
                        Your Evidence:
                      </div>
                      {resp.user_evidence.map((evidence, idx) => (
                        <div
                          key={idx}
                          className="mb-1.5 leading-relaxed text-blue-800"
                          style={{ lineHeight: '1.6' }}
                        >
                          • {evidence}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar - Multiple sections */}
        <div className="xl:col-span-1 space-y-5">
          {/* Relevant Experience Section */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{
              padding: '1.5rem',
              background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb'
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="icon-container icon-container-md"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 4px 8px rgba(59, 130, 246, 0.25)'
                }}
              >
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div
                className="font-bold tracking-tight"
                style={{
                  fontSize: '1.25rem',
                  color: '#1f2937',
                  letterSpacing: '-0.01em'
                }}
              >
                Relevant Experience
              </div>
            </div>

            {analysis.relevant_experiences.length > 0 ? (
              <ul className="space-y-5">
                {analysis.relevant_experiences.map((exp, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: '1rem',
                        color: '#111827',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {exp.position}
                    </div>
                    <div
                      className="mb-2 font-medium"
                      style={{
                        fontSize: '0.8125rem',
                        color: '#6b7280'
                      }}
                    >
                      @ {exp.company}
                    </div>
                    <div
                      className="mb-3 leading-relaxed"
                      style={{
                        fontSize: '0.875rem',
                        color: '#4b5563',
                        lineHeight: '1.6'
                      }}
                    >
                      {exp.why_relevant}
                    </div>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold`}
                      style={{
                        background: exp.relevance_score >= 80
                          ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                          : exp.relevance_score >= 60
                          ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
                          : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                        color: exp.relevance_score >= 80
                          ? '#065f46'
                          : exp.relevance_score >= 60
                          ? '#1e40af'
                          : '#92400e',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {exp.relevance_score}% relevant
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="text-center py-6 px-4 rounded-lg"
                style={{
                  background: '#f9fafb',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                No highly relevant experience found. Focus on building skills through projects and courses above.
              </div>
            )}
          </motion.div>

          {/* Projects Section - NEW */}
          {userProjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="icon-container icon-container-md"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 8px rgba(139, 92, 246, 0.25)'
                  }}
                >
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: '1.25rem',
                    color: '#1f2937',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Your Projects
                </div>
              </div>

              <div className="space-y-4">
                {userProjects.slice(0, 3).map((project: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)',
                      border: '1px solid #e9d5ff'
                    }}
                  >
                    <div
                      className="font-bold mb-2"
                      style={{
                        fontSize: '0.9375rem',
                        color: '#581c87',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {project.title}
                    </div>
                    <div
                      className="leading-relaxed"
                      style={{
                        fontSize: '0.8125rem',
                        color: '#6b21a8',
                        lineHeight: '1.5'
                      }}
                    >
                      {project.description}
                    </div>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {project.technologies.slice(0, 5).map((tech: string, techIdx: number) => (
                          <span
                            key={techIdx}
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: '#ddd6fe',
                              color: '#5b21b6'
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {userProjects.length > 3 && (
                <div
                  className="mt-3 text-center font-semibold"
                  style={{
                    fontSize: '0.75rem',
                    color: '#7c3aed',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  +{userProjects.length - 3} more projects
                </div>
              )}
            </motion.div>
          )}

          {/* Certifications Section - NEW */}
          {userCertifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="icon-container icon-container-md"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: '1.25rem',
                    color: '#1f2937',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Certifications
                </div>
              </div>

              <div className="space-y-3">
                {userCertifications.map((cert: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
                      border: '1px solid #a7f3d0'
                    }}
                  >
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: '0.9375rem',
                        color: '#065f46',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {cert.title}
                    </div>
                    <div
                      className="font-medium"
                      style={{
                        fontSize: '0.8125rem',
                        color: '#047857'
                      }}
                    >
                      {cert.institution}
                    </div>
                    {cert.date && (
                      <div
                        className="mt-1 font-semibold"
                        style={{
                          fontSize: '0.75rem',
                          color: '#059669'
                        }}
                      >
                        {cert.date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Leadership & Awards Section - NEW */}
          {hasLeadership && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="icon-container icon-container-md"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 8px rgba(245, 158, 11, 0.25)'
                  }}
                >
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: '1.25rem',
                    color: '#1f2937',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Leadership & Awards
                </div>
              </div>

              <div className="space-y-3">
                {customSections?.leadership?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%)',
                      border: '1px solid #fde68a'
                    }}
                  >
                    <div
                      className="font-bold"
                      style={{
                        fontSize: '0.875rem',
                        color: '#92400e',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {typeof item === 'string' ? item : item.title || item.name}
                    </div>
                    {typeof item === 'object' && item.description && (
                      <div
                        className="mt-1 leading-relaxed"
                        style={{
                          fontSize: '0.8125rem',
                          color: '#b45309',
                          lineHeight: '1.5'
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
                {customSections?.awards?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%)',
                      border: '1px solid #fde68a'
                    }}
                  >
                    <div
                      className="font-bold"
                      style={{
                        fontSize: '0.875rem',
                        color: '#92400e',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      🏆 {typeof item === 'string' ? item : item.title || item.name}
                    </div>
                    {typeof item === 'object' && item.description && (
                      <div
                        className="mt-1 leading-relaxed"
                        style={{
                          fontSize: '0.8125rem',
                          color: '#b45309',
                          lineHeight: '1.5'
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Volunteer Work Section - NEW */}
          {hasVolunteer && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="icon-container icon-container-md"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    boxShadow: '0 4px 8px rgba(236, 72, 153, 0.25)'
                  }}
                >
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: '1.25rem',
                    color: '#1f2937',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Volunteer Work
                </div>
              </div>

              <div className="space-y-3">
                {customSections?.volunteer?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
                      border: '1px solid #fbcfe8'
                    }}
                  >
                    <div
                      className="font-bold mb-1"
                      style={{
                        fontSize: '0.9375rem',
                        color: '#9f1239',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {typeof item === 'string' ? item : item.role || item.title}
                    </div>
                    {typeof item === 'object' && item.organization && (
                      <div
                        className="font-medium mb-1"
                        style={{
                          fontSize: '0.8125rem',
                          color: '#be123c'
                        }}
                      >
                        @ {item.organization}
                      </div>
                    )}
                    {typeof item === 'object' && item.description && (
                      <div
                        className="leading-relaxed"
                        style={{
                          fontSize: '0.8125rem',
                          color: '#e11d48',
                          lineHeight: '1.5'
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
