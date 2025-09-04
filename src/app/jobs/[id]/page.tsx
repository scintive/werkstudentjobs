import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MapPin, Calendar, Building2, Users, Globe, DollarSign, Sparkles, Target, Zap, CheckCircle, Star, Award, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import { SkillsAnalysisPanel } from '@/components/jobs/SkillsAnalysisPanel';
import { CompanyIntelligencePanel } from '@/components/jobs/CompanyIntelligencePanel';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

type Job = Database['public']['Tables']['jobs']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];
type JobWithCompany = Job & { companies: Company };

async function getJob(id: string): Promise<JobWithCompany | null> {
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      companies (*)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !job) {
    return null;
  }

  return job as JobWithCompany;
}

function extractSalaryFromBenefits(benefits: string[] | null): string | null {
  if (!benefits || !Array.isArray(benefits)) return null;
  
  for (const benefit of benefits) {
    if (typeof benefit === 'string') {
      // Look for salary patterns like "€520 per month", "$2000/month", etc.
      const salaryMatch = benefit.match(/[€$£¥][\d,.]+ (?:per month|\/month|monthly|per year|\/year|annually)/i);
      if (salaryMatch) {
        return salaryMatch[0];
      }
      // Look for just numbers with currency
      const currencyMatch = benefit.match(/[€$£¥][\d,.]+/);
      if (currencyMatch && benefit.toLowerCase().includes('month')) {
        return `${currencyMatch[0]} per month`;
      }
    }
  }
  return null;
}

// Helper function to render content that can be either array or markdown string
function renderJobContent(content: any, fallbackIcon: React.ComponentType<{ className?: string }>) {
  // If it's an array (legacy format), render as list
  if (Array.isArray(content)) {
    return (
      <ul className="space-y-2">
        {content.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3"></span>
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  
  // If it's a markdown string (new format), render with MarkdownRenderer
  if (typeof content === 'string') {
    return <MarkdownRenderer content={content} variant="elegant" />;
  }
  
  return null;
}

function LanguageBadge({ language }: { language: string | null }) {
  if (!language || language === 'unknown') return null;
  
  const badgeText = language === 'DE' ? 'Deutsch' :
                   language === 'EN' ? 'English' :
                   language === 'both' ? 'DE/EN' : language;
  
  const badgeColor = language === 'DE' ? 'bg-red-100 text-red-800' :
                    language === 'EN' ? 'bg-blue-100 text-blue-800' :
                    language === 'both' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
      <Globe className="w-3 h-3 mr-1" />
      {badgeText}
    </span>
  );
}

function WerkstudentBadge({ isWerkstudent }: { isWerkstudent: boolean | null }) {
  if (!isWerkstudent) return null;
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <Users className="w-3 h-3 mr-1" />
      Werkstudent
    </span>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const extractedSalary = extractSalaryFromBenefits(job.benefits_original);

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title with gradient accent */}
              <div className="mb-4">
                <div className="mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                    {job.title}
                  </h1>
                </div>
                <p className="text-gray-600 text-lg">{job.companies.name}</p>
              </div>
              
              {/* Enhanced metadata */}
              <div className="flex items-center flex-wrap gap-4 mb-6">
                {(job.city || job.location_city) && (
                  <div className="flex items-center text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    {job.city || job.location_city}
                    {(job.country || job.location_country) && `, ${job.country || job.location_country}`}
                  </div>
                )}
                {job.posted_at && (
                  <div className="flex items-center text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {new Date(job.posted_at).toLocaleDateString()}
                  </div>
                )}
                {extractedSalary && (
                  <div className="flex items-center text-green-700 bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                    <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                    {extractedSalary}
                  </div>
                )}
              </div>
              
              {/* Premium badges */}
              <div className="flex flex-wrap gap-2">
                <LanguageBadge language={job.german_required} />
                <WerkstudentBadge isWerkstudent={job.is_werkstudent} />
                {job.work_mode && job.work_mode !== 'Unknown' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                    <Target className="w-3 h-3 mr-1" />
                    {job.work_mode}
                  </span>
                )}
                {job.employment_type && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                    {job.employment_type}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  AI Matched
                </span>
              </div>
            </div>
            
            {/* Premium Apply Button */}
            <div className="ml-6">
              {(job.application_link || job.job_description_link || job.portal_link) && (
                <div className="space-y-3">
                  <a
                    href={job.application_link || job.job_description_link || job.portal_link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
                  >
                    Apply Now
                    <ExternalLink className="w-5 h-5 ml-2" />
                  </a>
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      💡 Direct application link researched by AI
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 px-8 py-8">
            {/* Salary Information */}
            {(extractedSalary || job.salary_min || job.salary_max || job.salary_info) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Compensation
                </h2>
                <div className="space-y-2">
                  {extractedSalary && (
                    <p className="text-lg font-medium text-green-600">{extractedSalary}</p>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <p className="text-gray-700">
                      {job.salary_min && job.salary_max 
                        ? `€${job.salary_min.toLocaleString()} - €${job.salary_max.toLocaleString()}`
                        : job.salary_min 
                        ? `From €${job.salary_min.toLocaleString()}`
                        : `Up to €${job.salary_max?.toLocaleString()}`
                      }
                    </p>
                  )}
                  {job.salary_info && (
                    <p className="text-gray-600">{job.salary_info}</p>
                  )}
                  {!extractedSalary && !job.salary_min && !job.salary_max && !job.salary_info && (
                    <p className="text-gray-500 italic">Salary not mentioned</p>
                  )}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities_original && (Array.isArray(job.responsibilities_original) ? job.responsibilities_original.length > 0 : true) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    Tasks & Responsibilities
                  </h2>
                  <p className="text-sm text-gray-600">What you'll be working on</p>
                </div>
                <div className="p-6">
                  {renderJobContent(job.responsibilities_original, Target)}
                </div>
              </div>
            )}


            {/* Nice to Have */}
            {job.nice_to_have_original && (Array.isArray(job.nice_to_have_original) ? job.nice_to_have_original.length > 0 : true) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Star className="w-5 h-5 text-emerald-600" />
                    </div>
                    Nice to Have
                  </h2>
                  <p className="text-sm text-gray-600">Bonus qualifications that would be great</p>
                </div>
                <div className="p-6">
                  {renderJobContent(job.nice_to_have_original, Star)}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits_original && (Array.isArray(job.benefits_original) ? job.benefits_original.length > 0 : true) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    Benefits & Perks
                  </h2>
                  <p className="text-sm text-gray-600">What we offer you</p>
                </div>
                <div className="p-6">
                  {renderJobContent(job.benefits_original, Gift)}
                </div>
              </div>
            )}

            {/* Who We Are Looking For */}
            {job.who_we_are_looking_for_original && (() => {
              try {
                // Try to parse as JSON first (legacy format)
                const whoWeAreLookingFor = JSON.parse(job.who_we_are_looking_for_original);
                const content = Array.isArray(whoWeAreLookingFor) && whoWeAreLookingFor.length > 0 ? whoWeAreLookingFor : null;
                
                if (content) {
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                          </div>
                          Who We Are Looking For
                        </h2>
                        <p className="text-sm text-gray-600">The ideal candidate profile</p>
                      </div>
                      <div className="p-6">
                        {renderJobContent(content, CheckCircle)}
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                // If JSON parsing fails, treat as markdown string (new format)
                if (typeof job.who_we_are_looking_for_original === 'string' && job.who_we_are_looking_for_original.trim()) {
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-indigo-600" />
                          </div>
                          Who We Are Looking For
                        </h2>
                        <p className="text-sm text-gray-600">The ideal candidate profile</p>
                      </div>
                      <div className="p-6">
                        {renderJobContent(job.who_we_are_looking_for_original, CheckCircle)}
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Hiring Manager & Research Insights */}
            {(job.hiring_manager || job.additional_insights) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Insights</h2>
                
                {job.hiring_manager && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Potential Hiring Manager
                    </h3>
                    <p className="text-blue-800 text-sm">{job.hiring_manager}</p>
                    <p className="text-blue-600 text-xs mt-1">
                      💡 This information was researched from company data and job posting analysis
                    </p>
                  </div>
                )}

                {job.additional_insights && Array.isArray(job.additional_insights) && job.additional_insights.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Additional Insights</h3>
                    <ul className="space-y-2">
                      {job.additional_insights.map((insight, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-3"></span>
                          <span className="text-gray-700 text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.research_confidence && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Research Confidence:</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        job.research_confidence === 'high' ? 'bg-green-100 text-green-800' :
                        job.research_confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.research_confidence.charAt(0).toUpperCase() + job.research_confidence.slice(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Original Description */}
            {job.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Original Job Description</h2>
                <div className="prose max-w-none">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premium Right Sidebar */}
          <div className="space-y-6 px-8 py-8 bg-gray-50 border-l border-gray-200">
            {/* Company Intelligence Panel - Top Priority */}
            <CompanyIntelligencePanel 
              company={job.companies} 
              jobSpecificInsights={{
                hiring_manager: job.hiring_manager,
                additional_insights: job.additional_insights
              }}
            />
            
            {/* Skills Analysis Panel */}
            {job.skills_original && Array.isArray(job.skills_original) && job.skills_original.length > 0 && (
              <SkillsAnalysisPanel 
                jobSkills={job.skills_original}
                jobTitle={job.title}
              />
            )}


            {/* Apply Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply</h3>
              <div className="space-y-3">
                {job.application_link && (
                  <a
                    href={job.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Directly
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
                {job.job_description_link && job.job_description_link !== job.application_link && (
                  <a
                    href={job.job_description_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Original Posting
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
                {job.portal_link && job.portal_link !== job.application_link && job.portal_link !== job.job_description_link && (
                  <a
                    href={job.portal_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View on {job.portal}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}