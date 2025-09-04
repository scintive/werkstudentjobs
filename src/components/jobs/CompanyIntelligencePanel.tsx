'use client';

import React from 'react';
import { 
  Building2, Globe, Users, MapPin, Calendar, Star,
  ExternalLink, Briefcase, Award, ChevronDown, ChevronUp
} from 'lucide-react';

interface CompanyIntelligencePanelProps {
  company: {
    name: string;
    description?: string | null;
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
    glassdoor_rating?: number | null;
    funding_status?: string | null;
    careers_page_url?: string | null;
    awards_recognition?: string[] | null;
    culture_highlights?: string[] | null;
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
    values: false
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
  
  // Helper function to format employee count intelligently
  const formatEmployeeCount = (): string => {
    if (company.employee_count) {
      const count = company.employee_count;
      if (count < 50) return `${count.toLocaleString()} employees • Startup`;
      if (count < 200) return `${count.toLocaleString()} employees • Small company`;
      if (count < 1000) return `${count.toLocaleString()} employees • Mid-size company`;
      if (count < 10000) return `${count.toLocaleString()} employees • Large company`;
      return `${count.toLocaleString()} employees • Enterprise`;
    }
    
    // Fallback to size category with better descriptions
    const categoryMap: { [key: string]: string } = {
      'startup': 'Early-stage startup',
      'small': 'Small company (50-200 employees)',
      'medium': 'Mid-size company (200-1000 employees)', 
      'large': 'Large company (1000+ employees)',
      'enterprise': 'Enterprise (10,000+ employees)'
    };
    
    return company.size_category ? categoryMap[company.size_category] || 'Growing team' : 'Growing team';
  };
  
  // Only show metrics with actual data
  const metrics = [];
  
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
  
  if (company.industry_sector || company.industry) {
    const industryValue = company.industry_sector || company.industry;
    if (industryValue && 
        industryValue !== 'N/A' && 
        industryValue !== 'Unknown' && 
        industryValue !== 'null' &&
        industryValue.toString().trim() &&
        industryValue.toString().trim() !== 'null') {
      metrics.push({
        icon: Building2,
        label: 'Industry',
        value: industryValue
      });
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

  return (
    <div className="space-y-4">
      {/* Compact Company Intelligence Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header Section - Compact */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h2>
              {company.description && (
                <div className="mt-1">
                  <p className={`text-xs text-gray-600 leading-relaxed ${
                    !isDescriptionExpanded && isDescriptionLong ? 'line-clamp-3' : ''
                  }`}>
                    {company.description}
                  </p>
                  {isDescriptionLong && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium transition-colors"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            {fixedWebsiteUrl && (
              <a
                href={fixedWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <Globe className="w-3 h-3" />
                Visit
              </a>
            )}
          </div>
          
          {/* Compact Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-white/60 rounded p-2 border border-gray-200/50">
                <div className="flex items-center gap-1.5">
                  <metric.icon className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">{metric.label}</div>
                    <div className="text-xs font-medium text-gray-900 break-words">{metric.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Sections - Ultra Compact */}
        <div className="p-4 space-y-3">
          
          {/* Office Locations - Inline Tags */}
          {company.office_locations && company.office_locations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-sm font-medium text-gray-900">Locations</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {(expandedSections.locations ? company.office_locations : company.office_locations.slice(0, 6)).map((location, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100"
                  >
                    {location}
                  </span>
                ))}
                {company.office_locations.length > 6 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, locations: !prev.locations }))}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                  >
                    {expandedSections.locations ? (
                      <>
                        <ChevronUp className="w-2.5 h-2.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-2.5 h-2.5" />
                        +{company.office_locations.length - 6} more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Products & Services - Inline Tags */}
          {company.key_products_services && company.key_products_services.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                <h4 className="text-sm font-medium text-gray-900">Services</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {(expandedSections.services ? company.key_products_services : company.key_products_services.slice(0, 4)).map((product, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-100"
                  >
                    {product}
                  </span>
                ))}
                {company.key_products_services.length > 4 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, services: !prev.services }))}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
                  >
                    {expandedSections.services ? (
                      <>
                        <ChevronUp className="w-2.5 h-2.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-2.5 h-2.5" />
                        +{company.key_products_services.length - 4} more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Business Model - Full Text */}
          {company.business_model && 
           company.business_model !== 'N/A' && 
           company.business_model !== 'Unknown' && 
           company.business_model !== 'null' &&
           company.business_model.toString().trim() &&
           company.business_model.toString().trim() !== 'null' && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <h4 className="text-sm font-medium text-gray-900">Business Model</h4>
              </div>
              <p className="text-xs text-slate-600 bg-purple-50 p-2 rounded border border-purple-100 leading-relaxed">
                {company.business_model}
              </p>
            </div>
          )}

          {/* Company Values - Compact */}
          {company.company_values && company.company_values.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-yellow-600" />
                <h4 className="text-sm font-medium text-gray-900">Values</h4>
              </div>
              <div className="space-y-1">
                {(expandedSections.values ? company.company_values : company.company_values.slice(0, 4)).map((value, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="leading-relaxed">{value}</span>
                  </div>
                ))}
                {company.company_values.length > 4 && (
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, values: !prev.values }))}
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded border border-yellow-200 transition-colors mt-1"
                  >
                    {expandedSections.values ? (
                      <>
                        <ChevronUp className="w-2.5 h-2.5" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-2.5 h-2.5" />
                        +{company.company_values.length - 4} more values
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hiring Manager - Compact */}
          {jobSpecificInsights?.hiring_manager && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-orange-600" />
                <h4 className="text-sm font-medium text-gray-900">Hiring Manager</h4>
              </div>
              <div className="bg-orange-50 p-2 rounded border border-orange-200">
                <p className="text-xs text-gray-900 font-medium">{jobSpecificInsights.hiring_manager}</p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}