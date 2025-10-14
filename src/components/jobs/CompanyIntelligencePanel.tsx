'use client';

import * as React from 'react';
import {
  Building2, Globe, Users, MapPin, Calendar, Star,
  ExternalLink, Briefcase, Award, ChevronDown, ChevronUp, CheckCircle,
  Heart, Home, Trophy, Sparkles, Mail, Phone
} from 'lucide-react';

interface CompanyIntelligencePanelProps {
  company: {
    name: string;
    description?: string | null;
    logo_url?: string | null;
    website_url?: string | null;
    headquarters_location?: string | null;
    founded_year?: number | null;
    employee_count?: number | null;
    industry_sector?: string | null;
    industry?: string | null;
    key_products_services?: string[] | null;
    office_locations?: string[] | null;
    business_model?: string | null;
    leadership_team?: string[] | null;
    recent_news?: string[] | null;
    competitors?: string[] | null;
    company_values?: string[] | null;
    culture_highlights?: string[] | null;
    remote_work_policy?: string | null;
    diversity_initiatives?: string[] | null;
    awards_recognition?: string[] | null;
    glassdoor_rating?: number | null;
    funding_status?: string | null;
    careers_page_url?: string | null;
    size_category?: string | null;
  };
  jobSpecificInsights?: {
    hiring_manager?: string | null;
    additional_insights?: string[] | null;
  };
}

function CompanyMetric({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-500" />
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

export function CompanyIntelligencePanel({ company, jobSpecificInsights }: CompanyIntelligencePanelProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
    locations: false,
    services: false,
    values: false,
    culture: false,
    diversity: false,
    awards: false
  });
  
  if (!company) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Company information not available</p>
        </div>
      </div>
    );
  }

  // Company data available - ready to display
  const hasComprehensiveData = company.founded_year || company.employee_count || company.key_products_services?.length || company.company_values?.length;
  
  // Check if description is long enough to need truncation
  const isDescriptionLong = company.description && company.description.length > 150;
  
  // Helper function to format employee count - just the number
  const formatEmployeeCount = (): string => {
    if (company.employee_count) {
      return company.employee_count.toLocaleString();
    }

    // Fallback to size category ranges if no exact count
    const categoryMap: { [key: string]: string } = {
      'startup': '1-50',
      'small': '50-200',
      'medium': '200-1K',
      'large': '1K-10K',
      'enterprise': '10K+'
    };

    return company.size_category ? categoryMap[company.size_category] || '—' : '—';
  };
  
  // Separate metrics into regular (2-col) and full-width
  const metrics = [];
  let industryMetric = null;

  if (company.founded_year) {
    metrics.push({
      icon: Calendar,
      label: 'Founded',
      value: company.founded_year.toString()
    });
  }

  if (company.employee_count || company.size_category) {
    metrics.push({
      icon: Users,
      label: 'Team Size',
      value: formatEmployeeCount()
    });
  }

  // Industry gets full width treatment
  if (company.industry_sector || company.industry) {
    const industryValue = company.industry_sector || company.industry;
    if (industryValue &&
        industryValue !== 'N/A' &&
        industryValue !== 'Unknown' &&
        industryValue !== 'null' &&
        industryValue.toString().trim() &&
        industryValue.toString().trim() !== 'null') {
      industryMetric = {
        icon: Building2,
        label: 'Industry',
        value: industryValue
      };
    }
  }

  if (company.glassdoor_rating) {
    metrics.push({
      icon: Star,
      label: 'Rating',
      value: `${company.glassdoor_rating}★`
    });
  }

  // Fix website URL with robust validation
  const fixedWebsiteUrl = React.useMemo(() => {
    if (!company.website_url || typeof company.website_url !== 'string' || !company.website_url.trim()) {
      return null;
    }
    
    const url = company.website_url.trim();
    
    // Skip if it's obviously invalid
    if (url === 'N/A' || url === 'Unknown' || url === 'null' || url.length < 4) {
      return null;
    }
    
    try {
      // If already has protocol, validate it
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const testUrl = new URL(url);
        // Basic validation - must have valid hostname
        if (testUrl.hostname && testUrl.hostname.includes('.')) {
          return url;
        }
      } else {
        // Add https and validate
        const httpsUrl = `https://${url}`;
        const testUrl = new URL(httpsUrl);
        // Basic validation - must have valid hostname with TLD
        if (testUrl.hostname && testUrl.hostname.includes('.') && testUrl.hostname.length > 3) {
          return httpsUrl;
        }
      }
    } catch (error) {
      // Invalid URL
      console.warn('Invalid company website URL:', url);
    }
    
    return null;
  }, [company.website_url]);

  // Verify company website link
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!fixedWebsiteUrl) { setIsVerified(null); return; }
      try {
        setIsVerifying(true);
        const res = await fetch('/api/links/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ links: [{ label: 'Company Website', url: fixedWebsiteUrl }] })
        });
        if (!res.ok) { setIsVerified(null); return; }
        const data = await res.json();
        const ok = !!data?.results?.[fixedWebsiteUrl]?.ok;
        if (active) setIsVerified(ok);
      } catch {
        if (active) setIsVerified(null);
      } finally {
        if (active) setIsVerifying(false);
      }
    })();
    return () => { active = false; };
  }, [fixedWebsiteUrl]);

  return (
    <div className="space-y-4">
      {/* Sleek & Compact Company Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Header - Compact */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/30">
          <div className="flex items-start gap-3">
            {company.logo_url && (
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-slate-200 shadow-sm p-1.5 flex items-center justify-center">
                <img
                  src={company.logo_url}
                  alt={`${company.name} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{company.name}</h2>
              {company.description && (
                <p className={`text-xs text-slate-600 leading-relaxed mt-1 break-words ${
                  !isDescriptionExpanded && isDescriptionLong ? 'max-h-[2.5rem] overflow-hidden' : ''
                }`}
                   style={!isDescriptionExpanded && isDescriptionLong ? {
                     display: '-webkit-box',
                     WebkitLineClamp: 2,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden',
                     wordBreak: 'break-word'
                   } : {}}>
                  {company.description}
                </p>
              )}
              {isDescriptionLong && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                >
                  {isDescriptionExpanded ? '↑ Less' : '↓ More'}
                </button>
              )}
            </div>
            {fixedWebsiteUrl && (
              <a
                href={fixedWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                Visit
                {isVerified && !isVerifying && <CheckCircle className="w-3 h-3" />}
              </a>
            )}
          </div>

          {/* Compact Metrics */}
          {(metrics.length > 0 || industryMetric) && (
            <div className="space-y-2 mt-3">
              {/* 2-Column Grid for Founded, Team Size, Rating */}
              {metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {metrics.map((metric, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-slate-200/50">
                      <metric.icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{metric.label}</div>
                        <div className="text-xs font-semibold text-slate-900 truncate">{metric.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full-Width Industry */}
              {industryMetric && (
                <div className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-slate-200/50">
                  <industryMetric.icon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{industryMetric.label}</div>
                    <div className="text-xs font-semibold text-slate-900 truncate">{industryMetric.value}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content - Ultra Compact */}
        <div className="p-4 space-y-3">

          {/* Locations - Compact Pills */}
          {company.office_locations && company.office_locations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Locations</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(expandedSections.locations ? company.office_locations : company.office_locations.slice(0, 6)).map((location, index) => (
                  <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200/60">
                    {location}
                  </span>
                ))}
                {company.office_locations.length > 6 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, locations: !prev.locations }))}
                    className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200 font-medium"
                  >
                    {expandedSections.locations ? '− Less' : `+${company.office_locations.length - 6}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Services - Compact Pills */}
          {company.key_products_services && company.key_products_services.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Services</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(expandedSections.services ? company.key_products_services : company.key_products_services.slice(0, 4)).map((product, index) => (
                  <span key={index} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200/60">
                    {product}
                  </span>
                ))}
                {company.key_products_services.length > 4 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, services: !prev.services }))}
                    className="px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200 font-medium"
                  >
                    {expandedSections.services ? '− Less' : `+${company.key_products_services.length - 4}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Business Model */}
          {company.business_model && company.business_model !== 'N/A' && company.business_model !== 'Unknown' &&
           company.business_model !== 'null' && company.business_model.toString().trim() && company.business_model.toString().trim() !== 'null' && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Business Model</h4>
              </div>
              <p className="text-xs text-slate-600 bg-purple-50/60 px-2.5 py-1.5 rounded border border-purple-200/50 leading-relaxed">
                {company.business_model}
              </p>
            </div>
          )}

          {/* Values - Bullet List */}
          {company.company_values && company.company_values.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Values</h4>
              </div>
              <div className="space-y-0.5">
                {(expandedSections.values ? company.company_values : company.company_values.slice(0, 3)).map((value, index) => (
                  <div key={index} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span className="leading-relaxed">{value}</span>
                  </div>
                ))}
                {company.company_values.length > 3 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, values: !prev.values }))}
                    className="text-xs text-yellow-600 hover:text-yellow-700 font-medium mt-0.5"
                  >
                    {expandedSections.values ? '↑ Less' : `↓ +${company.company_values.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Culture - Bullet List */}
          {company.culture_highlights && company.culture_highlights.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Culture</h4>
              </div>
              <div className="space-y-0.5">
                {(expandedSections.culture ? company.culture_highlights : company.culture_highlights.slice(0, 3)).map((highlight, index) => (
                  <div key={index} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <span className="text-pink-500 mt-0.5">•</span>
                    <span className="leading-relaxed">{highlight}</span>
                  </div>
                ))}
                {company.culture_highlights.length > 3 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, culture: !prev.culture }))}
                    className="text-xs text-pink-600 hover:text-pink-700 font-medium mt-0.5"
                  >
                    {expandedSections.culture ? '↑ Less' : `↓ +${company.culture_highlights.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Remote Work */}
          {company.remote_work_policy && company.remote_work_policy !== 'N/A' && company.remote_work_policy !== 'Unknown' &&
           company.remote_work_policy !== 'null' && company.remote_work_policy.toString().trim() && company.remote_work_policy.toString().trim() !== 'null' && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Remote Work</h4>
              </div>
              <p className="text-xs text-slate-600 bg-indigo-50/60 px-2.5 py-1.5 rounded border border-indigo-200/50 leading-relaxed">
                {company.remote_work_policy}
              </p>
            </div>
          )}

          {/* Diversity - Bullet List */}
          {company.diversity_initiatives && company.diversity_initiatives.length > 0 &&
           company.diversity_initiatives.some(initiative => initiative && initiative.trim() && initiative !== 'null') && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Diversity</h4>
              </div>
              <div className="space-y-0.5">
                {(expandedSections.diversity ? company.diversity_initiatives : company.diversity_initiatives.slice(0, 3))
                  .filter(initiative => initiative && initiative.trim() && initiative !== 'null')
                  .map((initiative, index) => (
                    <div key={index} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span className="leading-relaxed">{initiative}</span>
                    </div>
                  ))}
                {company.diversity_initiatives.filter(i => i && i.trim() && i !== 'null').length > 3 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, diversity: !prev.diversity }))}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-0.5"
                  >
                    {expandedSections.diversity ? '↑ Less' : `↓ +${company.diversity_initiatives.filter(i => i && i.trim() && i !== 'null').length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Awards - Bullet List */}
          {company.awards_recognition && company.awards_recognition.length > 0 &&
           company.awards_recognition.some(award => award && award.trim() && award !== 'null') && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Awards</h4>
              </div>
              <div className="space-y-0.5">
                {(expandedSections.awards ? company.awards_recognition : company.awards_recognition.slice(0, 3))
                  .filter(award => award && award.trim() && award !== 'null')
                  .map((award, index) => (
                    <div key={index} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="leading-relaxed">{award}</span>
                    </div>
                  ))}
                {company.awards_recognition.filter(a => a && a.trim() && a !== 'null').length > 3 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, awards: !prev.awards }))}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-0.5"
                  >
                    {expandedSections.awards ? '↑ Less' : `↓ +${company.awards_recognition.filter(a => a && a.trim() && a !== 'null').length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hiring Manager */}
          {jobSpecificInsights?.hiring_manager && (() => {
            const managerText = jobSpecificInsights.hiring_manager;
            // Parse for email and phone patterns
            const emailMatch = managerText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
            const phoneMatch = managerText.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
            const email = emailMatch ? emailMatch[0] : null;
            const phone = phoneMatch ? phoneMatch[0] : null;
            // Extract name (text before email/phone or full text)
            let name = managerText;
            if (email || phone) {
              name = managerText.split(/[\(,]|@|[\+\d]/)[0].trim();
            }

            return (
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Hiring Manager</h4>
                </div>
                <div className="bg-orange-50/60 px-2.5 py-1.5 rounded border border-orange-200/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-900 font-semibold">{name}</p>
                    {(email || phone) && (
                      <div className="flex items-center gap-1.5">
                        {email && (
                          <a
                            href={`mailto:${email}`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
                            title={`Email: ${email}`}
                          >
                            <Mail className="w-3 h-3" />
                          </a>
                        )}
                        {phone && (
                          <a
                            href={`tel:${phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
                            title={`Phone: ${phone}`}
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          
        </div>
      </div>
    </div>
  );
}
