'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Users, 
  Building2, 
  Globe2, 
  Filter,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Home,
  Laptop,
  Building,
  Star,
  X,
  Check,
  ArrowUpDown,
  ChevronDown,
  Zap,
  Award,
  Target,
  Mail,
  Phone,
  LinkIcon,
  FileText,
  Heart,
  Share2,
  Download,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { SkillsAnalysisPanel } from './SkillsAnalysisPanel'
import { CompanyIntelligencePanel } from './CompanyIntelligencePanel'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { AITailorButton } from '@/components/ui/AITailorButton'
import { MatchScore } from '@/components/ui/MatchScore'
import { useGeoEnhancedJobs } from '@/lib/hooks/useGeoEnhancedJobs'
import EligibilityChecker from '@/components/werkstudent/EligibilityChecker'
import type { StudentProfile } from '@/lib/types/studentProfile'

// Import types
import type { JobWithCompany } from '@/lib/supabase/types'

interface JobBrowserProps {
  userProfile?: any
  onJobSelect?: (job: JobWithCompany) => void
  className?: string
}

// Work mode icons
const workModeIcons = {
  remote: <Laptop className="w-4 h-4" />,
  hybrid: <Home className="w-4 h-4" />,
  onsite: <Building className="w-4 h-4" />,
  unknown: <Globe2 className="w-4 h-4" />
}

// Work mode colors
const workModeColors = {
  remote: 'bg-green-50 text-green-700 border-green-200',
  hybrid: 'bg-blue-50 text-blue-700 border-blue-200',
  onsite: 'bg-purple-50 text-purple-700 border-purple-200',
  unknown: 'bg-gray-50 text-gray-700 border-gray-200'
}

// Enhanced Match score colors - Professional gradient palette
const getMatchScoreColor = (score: number) => {
  if (score >= 90) return 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg'
  if (score >= 85) return 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-md'
  if (score >= 75) return 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md'
  if (score >= 70) return 'bg-gradient-to-r from-sky-400 to-indigo-400'
  if (score >= 60) return 'bg-gradient-to-r from-blue-400 to-cyan-400'
  if (score >= 50) return 'bg-gradient-to-r from-amber-400 to-orange-400'
  if (score > 0) return 'bg-gradient-to-r from-orange-300 to-red-400'
  return 'bg-gradient-to-r from-red-500 to-rose-600 shadow-md' // 0% - Strong red for no match
}

// Get match score text color for better contrast
const getMatchScoreTextColor = (score: number) => {
  if (score >= 50) return 'text-white'
  if (score === 0) return 'text-white' // White text on red background for 0%
  return 'text-gray-700'
}

// Get match score description
const getMatchScoreDescription = (score: number, isPlaceholder: boolean = false) => {
  const baseDescription = (() => {
    if (score >= 90) return 'Excellent Match'
    if (score >= 85) return 'Great Match'
    if (score >= 75) return 'Very Good Match'
    if (score >= 70) return 'Good Match'
    if (score >= 60) return 'Fair Match'
    if (score >= 50) return 'Potential Match'
    if (score >= 25) return 'Low Match'
    if (score > 0) return 'Minimal Match'
    return 'No Skills Match'
  })()
  
  return isPlaceholder ? `${baseDescription} (Estimated)` : baseDescription
}

// Get detailed tooltip text for match scores
const getMatchScoreTooltip = (score: number, isPlaceholder: boolean = false, jobTitle: string = '') => {
  if (isPlaceholder) {
    return `Estimated ${getMatchScoreDescription(score, false)} (${score}%)\n\nThis is a placeholder score. Upload your resume in step 1 to get real AI-powered match scores based on:\n• Skills overlap (55%)\n• Tools & technologies (20%)\n• Language requirements (15%)\n• Location preferences (10%)`
  }
  
  if (score === 0) {
    return `No Skills Match (0%)\n\nThis job has zero overlap with your current skill set.\n\n📊 AI Analysis:\n• Skills overlap: 0% (no matching skills found)\n• Tools & technologies: 0% (no matching tools)\n• Language requirements: May still match\n• Location: May still match\n\n💡 Consider this as a learning opportunity or career pivot role.\n\nFor "${jobTitle}"`
  }
  
  return `${getMatchScoreDescription(score)} (${score}%)\n\nCalculated using AI-powered matching:\n• Skills overlap: 55% weight\n• Tools & technologies: 20% weight\n• Language requirements: 15% weight\n• Location preferences: 10% weight\n\nFor "${jobTitle}"`
}

// Helper function to render content that can be either array or markdown string
function renderJobContent(content: any) {
  // If it's an array (new clean format), render as clean list
  if (Array.isArray(content)) {
    return (
      <ul className="space-y-1.5">
        {content.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="flex-shrink-0 w-1.5 h-1.5 bg-sky-400 rounded-full mt-2 mr-3"></span>
            <span className="text-slate-600 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  
  // If it's a string (fallback or old data), try to render as markdown if it contains markdown syntax
  if (typeof content === 'string') {
    // Check if it contains markdown formatting
    if (content.includes('**') || content.includes('*') || content.includes('#') || content.includes('•')) {
      return <MarkdownRenderer content={content} variant="compact" />;
    } else {
      // Plain text - render as single item
      return (
        <div className="text-slate-600 leading-relaxed">
          {content}
        </div>
      );
    }
  }
  
  return null;
}

// Helper function to convert user profile to student profile format
function convertToStudentProfile(userProfile: any): Partial<StudentProfile> | null {
  if (!userProfile || typeof userProfile !== 'object') return null;
  
  // Check if this looks like a student profile
  const hasStudentIndicators = (
    userProfile.degree_program ||
    userProfile.university ||
    userProfile.current_year ||
    userProfile.expected_graduation ||
    userProfile.enrollment_status ||
    userProfile.weekly_availability
  );
  
  if (!hasStudentIndicators) return null;
  
  return {
    degree_program: userProfile.degree_program || 'Computer Science',
    university: userProfile.university || '',
    current_year: userProfile.current_year || 3,
    expected_graduation: userProfile.expected_graduation,
    weekly_availability: userProfile.weekly_availability || { hours_min: 15, hours_max: 20, flexible: true },
    earliest_start_date: userProfile.earliest_start_date || 'immediately',
    preferred_duration: userProfile.preferred_duration || { months_min: 6, months_max: 12, open_ended: false },
    enrollment_status: userProfile.enrollment_status || 'enrolled',
    language_proficiencies: userProfile.language_proficiencies || [],
    academic_projects: userProfile.academic_projects || [],
    relevant_coursework: userProfile.relevant_coursework || [],
    preferred_locations: userProfile.preferred_locations || [],
    remote_preference: userProfile.remote_preference || 'flexible',
    visa_status: userProfile.visa_status
  };
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

// Mock data for demonstration
const mockJobs = [
  {
    id: '1',
    company_id: '1',
    external_id: '12345',
    title: 'Senior Full Stack Developer',
    description_html: '<p>Join our team...</p>',
    description_text: 'Join our team as a Senior Full Stack Developer...',
    location_city: 'Berlin',
    location_country: 'Germany',
    location_full: 'Berlin, Germany',
    work_mode: 'Hybrid',
    employment_type: 'Full-time',
    seniority_level: 'Senior',
    salary_info: '€80,000 - €120,000',
    posted_at: '2025-08-20',
    application_url: 'https://example.com/apply',
    linkedin_url: 'https://linkedin.com/jobs/123',
    job_function: 'Engineering',
    industries: ['Technology', 'SaaS'],
    applicants_count: 45,
    is_werkstudent: false,
    german_required: 'both',
    created_at: '2025-08-20',
    updated_at: '2025-08-20',
    user_saved: false,
    user_applied: false,
    user_notes: null,
    match_score: 92,
    company: {
      id: '1',
      name: 'TechCorp Solutions',
      logo_url: 'https://via.placeholder.com/100',
      domain: 'techcorp.com',
      linkedin_url: 'https://linkedin.com/company/techcorp',
      description: 'Leading technology solutions provider',
      slogan: 'Innovation at Scale',
      employee_count: 500,
      industry: 'Technology',
      headquarters: 'Berlin, Germany',
      size_category: 'medium' as const,
      created_at: '2025-08-20',
      updated_at: '2025-08-20',
      external_id: null,
      website_url: 'https://techcorp.com',
      location: 'Berlin, Germany',
      founded_year: null,
      careers_page_url: null,
      headquarters_location: 'Berlin, Germany',
      office_locations: null,
      industry_sector: null,
      business_model: null,
      key_products_services: null,
      company_size_category: null,
      funding_status: null,
      notable_investors: null,
      leadership_team: null,
      company_values: null,
      culture_highlights: null,
      glassdoor_rating: null
    }
  },
  {
    id: '2',
    company_id: '2',
    external_id: '12346',
    title: 'Product Designer',
    description_html: '<p>We are looking for...</p>',
    description_text: 'We are looking for a talented Product Designer...',
    location_city: 'Munich',
    location_country: 'Germany',
    location_full: 'Munich, Germany',
    work_mode: 'remote',
    employment_type: 'Full-time',
    seniority_level: 'Mid-level',
    salary_info: '€60,000 - €85,000',
    posted_at: '2025-08-22',
    application_url: 'https://example.com/apply',
    linkedin_url: 'https://linkedin.com/jobs/124',
    job_function: 'Design',
    industries: ['Design', 'Digital'],
    applicants_count: 28,
    is_werkstudent: false,
    german_required: 'no',
    created_at: '2025-08-22',
    updated_at: '2025-08-22',
    user_saved: true,
    user_applied: false,
    user_notes: null,
    match_score: 78,
    company: {
      id: '2',
      name: 'Design Studio Pro',
      logo_url: 'https://via.placeholder.com/100',
      website: 'https://designstudio.com',
      linkedin_url: 'https://linkedin.com/company/designstudio',
      description: 'Award-winning design agency',
      slogan: 'Design that Matters',
      employee_count: 150,
      industry: 'Design',
      location: 'Munich, Germany',
      created_at: '2025-08-22',
      updated_at: '2025-08-22'
    }
  }
]

export function JobBrowser({ userProfile, onJobSelect, className }: JobBrowserProps) {
  const router = useRouter()
  const [jobs, setJobs] = React.useState<JobWithCompany[]>([])
  const [loading, setLoading] = React.useState(true) // Start with loading=true
  const [loadingMore, setLoadingMore] = React.useState(false) // For pagination
  const [hasMore, setHasMore] = React.useState(true) // More jobs available
  const [currentPage, setCurrentPage] = React.useState(0) // Track pagination
  const [showPlaceholderNotice, setShowPlaceholderNotice] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedTab, setSelectedTab] = React.useState('all')
  const [selectedWorkMode, setSelectedWorkMode] = React.useState<string>('all')
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>('all')
  const [selectedLocation, setSelectedLocation] = React.useState<string>('all')
  const [locationSearch, setLocationSearch] = React.useState<string>('')
  const [distanceRadius, setDistanceRadius] = React.useState<number>(100)
  const [selectedJobType, setSelectedJobType] = React.useState<string>('all')
  const [selectedTimeFilter, setSelectedTimeFilter] = React.useState<string>('all') // Latest jobs filter
  const [tailoredFilter, setTailoredFilter] = React.useState<'all' | 'only' | 'hide'>('all')
  const [sortBy, setSortBy] = React.useState<string>('date') // Default to latest jobs first
  const [savedJobs, setSavedJobs] = React.useState<Set<string>>(new Set())
  const [appliedJobs, setAppliedJobs] = React.useState<Set<string>>(new Set())
  const [tailoredJobs, setTailoredJobs] = React.useState<Map<string, { created_at: string, match_score?: number }>>(new Map())
  const [selectedJob, setSelectedJob] = React.useState<JobWithCompany | null>(null)
  const [expandedSkillSections, setExpandedSkillSections] = React.useState<{
    technical: boolean;
    soft: boolean;
    design: boolean;
  }>({ technical: false, soft: false, design: false })

  // Reference for infinite scroll
  const jobsContainerRef = React.useRef<HTMLDivElement>(null)

  // Extract user location from profile or location search for geo-enhanced matching
  const userLocation = React.useMemo(() => {
    console.log('🗺️ DEBUG: userProfile structure:', JSON.stringify(userProfile, null, 2));
    console.log('🗺️ DEBUG: locationSearch:', locationSearch);
    
    // Priority 1: If user typed a location search, use that
    if (locationSearch.trim()) {
      console.log('🗺️ Using location search as user location:', locationSearch.trim());
      return locationSearch.trim();
    }
    
    // Priority 2: Extract from user profile
    if (userProfile && typeof userProfile === 'object') {
      let profileLocation = null;
      
      // Try different possible location fields
      if ('personal_details' in userProfile && userProfile.personal_details) {
        const details = userProfile.personal_details as any;
        profileLocation = details?.contact?.address || details?.location || details?.city || details?.address || null;
      }
      
      // Try alternative structures
      if (!profileLocation && 'personalInfo' in userProfile) {
        const info = (userProfile as any).personalInfo;
        profileLocation = info?.location || info?.address || info?.city || null;
      }
      
      if (profileLocation) {
        console.log('🗺️ Using profile location as user location:', profileLocation);
        return profileLocation;
      } else {
        console.log('🗺️ No location found in user profile');
      }
    }
    
    console.log('🗺️ No user location available');
    return null;
  }, [userProfile, locationSearch]);

  // Geo-enhanced job matching
  const {
    enhancedJobs,
    jobsByDistance,
    isProcessing: isGeoProcessing,
    stats: geoStats
  } = useGeoEnhancedJobs({
    jobs,
    userLocation,
    maxDistanceKm: distanceRadius,
    enableGeoMatching: true
  });

  // Fetch jobs on mount
  React.useEffect(() => {
    fetchJobs()
    fetchTailoredJobs()
    fetchAppliedJobs()
  }, [])

  const fetchTailoredJobs = async () => {
    try {
      // Get auth token from supabase
      const { supabase } = await import('@/lib/supabase/client')
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      if (!token) {
        console.log('✨ No auth token, skipping tailored jobs fetch')
        return
      }

      const response = await fetch('/api/jobs/tailored-status', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✨ Fetched tailored jobs:', data)

        // Create a map of job_id -> metadata
        const tailoredMap = new Map()
        data.tailoredJobs?.forEach((item: any) => {
          tailoredMap.set(item.job_id, {
            created_at: item.created_at,
            match_score: item.match_score
          })
        })

        setTailoredJobs(tailoredMap)
      }
    } catch (error) {
      console.error('Error fetching tailored jobs:', error)
    }
  }

  const fetchAppliedJobs = async () => {
    try {
      const response = await fetch('/api/jobs/applied-status', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched applied jobs:', data)

        // Create a set of applied job IDs
        const appliedSet = new Set<string>()
        data.appliedJobs?.forEach((item: any) => {
          appliedSet.add(item.job_id)
        })

        setAppliedJobs(appliedSet)
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error)
    }
  }

  // LocalStorage helper functions
  const JOBS_CACHE_KEY = 'jobs_cache'
  const CACHE_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

  const loadJobsFromCache = (): JobWithCompany[] | null => {
    try {
      const cached = localStorage.getItem(JOBS_CACHE_KEY)
      if (!cached) return null

      const { jobs: cachedJobs, timestamp } = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - timestamp < CACHE_EXPIRY_MS) {
        console.log('📦 Loaded', cachedJobs.length, 'jobs from cache')
        return cachedJobs
      } else {
        console.log('📦 Cache expired, clearing...')
        localStorage.removeItem(JOBS_CACHE_KEY)
        return null
      }
    } catch (error) {
      console.error('Error loading jobs from cache:', error)
      return null
    }
  }

  const saveJobsToCache = (jobs: JobWithCompany[]) => {
    try {
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify({
        jobs,
        timestamp: Date.now()
      }))
      console.log('📦 Saved', jobs.length, 'jobs to cache')
    } catch (error) {
      console.error('Error saving jobs to cache:', error)
    }
  }

  const fetchJobs = async (page: number = 0, append: boolean = false) => {
    // Don't show main loader if appending
    if (!append) {
      setLoading(true)

      // Try loading from cache first on initial load
      if (page === 0) {
        const cachedJobs = loadJobsFromCache()
        if (cachedJobs && cachedJobs.length > 0) {
          setJobs(cachedJobs)
          if (cachedJobs.length > 0 && !selectedJob) {
            setSelectedJob(cachedJobs[0])
          }
          setLoading(false)
          setHasMore(false) // Cache means we already loaded all jobs
          return
        }
      }
    } else {
      setLoadingMore(true)
    }

    try {
      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

      // Fetch ALL jobs initially (up to 1000), then use pagination for more if needed
      const limit = page === 0 ? 1000 : 100 // First page: all jobs, subsequent: 100 at a time
      const offset = page * (page === 0 ? 1000 : 100)

      const response = await fetch(`/api/jobs/fetch?limit=${limit}&offset=${offset}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        
        // Data is now coming directly from Supabase in the correct format
        const transformedJobs = data.jobs.map((job: any) => {
          // Job already comes with the correct Supabase structure and company info
          return {
            ...job,
            // Normalize/alias fields for UI expectations
            work_mode: (job.work_mode ? String(job.work_mode) : 'unknown').toLowerCase(),
            location_city: job.location_city || job.city || job.location_raw || null,
            application_url: job.application_url || job.application_link || job.linkedin_url || null,
            // Ensure compatibility with existing component expectations
            company: job.companies || {
              id: job.company_id,
              name: 'Unknown Company',
              logo_url: null,
              domain: null,
              industry: null,
              size_category: null,
              headquarters: null,
              website_url: job.website || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
        })

        // DEBUG: Check conditions BEFORE matching conditional
        console.log('🔍 DEBUG: About to check matching conditions', {
          hasUserProfile: !!userProfile,
          userProfileType: typeof userProfile,
          userProfileKeys: userProfile ? Object.keys(userProfile as any).slice(0, 10) : [],
          transformedJobsLength: transformedJobs.length,
          firstJob: transformedJobs[0]?.title,
          firstJobSkills: transformedJobs[0]?.skills,
          firstJobSkillsCount: Array.isArray(transformedJobs[0]?.skills) ? transformedJobs[0]?.skills.length : 'NOT AN ARRAY',
          willRunMatching: !!(userProfile && transformedJobs.length > 0)
        })

        // WEIGHTED MATCHING: Calculate real match scores if user profile is available
        if (userProfile && transformedJobs.length > 0) {
          console.log('🎯 User profile available, calculating weighted match scores...')
          console.log('🎯 DEBUG: User profile structure:', {
            hasSkills: !!(userProfile as any).skills,
            skillCategories: (userProfile as any).skills ? Object.keys((userProfile as any).skills) : [],
            sampleSkills: (userProfile as any).skills ? Object.entries((userProfile as any).skills).slice(0, 2).map(([k, v]: [string, any]) => [k, Array.isArray(v) ? v.slice(0, 3) : v]) : [],
            hasLanguages: !!(userProfile as any).languages,
            languagesCount: Array.isArray((userProfile as any).languages) ? (userProfile as any).languages.length : 0
          })
          try {
            const matchingController = new AbortController()
            const matchingTimeoutId = setTimeout(() => matchingController.abort(), 30000) // 30s timeout for matching

            // DEBUG: Log what we're about to send to matching API
            console.log('🎯 POST BODY DEBUG - About to send to /api/jobs/match-scores:', {
              jobsCount: transformedJobs.length,
              firstJobId: transformedJobs[0]?.id,
              firstJobTitle: transformedJobs[0]?.title,
              firstJobHasSkills: !!transformedJobs[0]?.skills,
              firstJobSkillsType: Array.isArray(transformedJobs[0]?.skills) ? 'array' : typeof transformedJobs[0]?.skills,
              firstJobSkillsCount: Array.isArray(transformedJobs[0]?.skills) ? transformedJobs[0]?.skills.length : 'N/A',
              firstJobSkillsSample: Array.isArray(transformedJobs[0]?.skills) ? transformedJobs[0]?.skills.slice(0, 3) : transformedJobs[0]?.skills
            })

            const matchingResponse = await fetch('/api/jobs/match-scores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userProfile,
                jobs: transformedJobs
              }),
              signal: matchingController.signal
            })
            
            clearTimeout(matchingTimeoutId)
            
            if (matchingResponse.ok) {
              const matchingData = await matchingResponse.json()
              console.log('🎯 Weighted matching successful:', matchingData.algorithm, '- Average score:', matchingData.averageScore)

              // Use the matched jobs with calculated scores
              const matchedJobs = matchingData.matchedJobs || transformedJobs

              // Append or replace based on mode
              if (append) {
                const updatedJobs = [...jobs, ...matchedJobs]
                setJobs(updatedJobs)
                saveJobsToCache(updatedJobs) // Update cache with appended jobs
              } else {
                setJobs(matchedJobs)
                saveJobsToCache(matchedJobs) // Cache initial jobs
              }

              // Check if more jobs available from API response
              setHasMore(data.hasMore || false)
              setCurrentPage(page)

              // Auto-select first job only on initial load
              if (!append && matchedJobs.length > 0 && !selectedJob) {
                setSelectedJob(matchedJobs[0])
              }
            } else {
              console.warn('🎯 Matching API failed, showing jobs without scores')
              // NO PLACEHOLDER SCORES - just show jobs without match scores
              if (append) {
                const updatedJobs = [...jobs, ...transformedJobs]
                setJobs(updatedJobs)
                saveJobsToCache(updatedJobs)
              } else {
                setJobs(transformedJobs)
                saveJobsToCache(transformedJobs)
              }

              setHasMore(transformedJobs.length >= 30)
              setCurrentPage(page)

              if (!append && transformedJobs.length > 0 && !selectedJob) {
                setSelectedJob(transformedJobs[0])
              }
            }
          } catch (matchingError) {
            console.warn('🎯 Matching error:', matchingError)
            // NO PLACEHOLDER SCORES - just show jobs without match scores
            if (append) {
              const updatedJobs = [...jobs, ...transformedJobs]
              setJobs(updatedJobs)
              saveJobsToCache(updatedJobs)
            } else {
              setJobs(transformedJobs)
              saveJobsToCache(transformedJobs)
            }

            setHasMore(data.hasMore || false)
            setCurrentPage(page)

            if (!append && transformedJobs.length > 0 && !selectedJob) {
              setSelectedJob(transformedJobs[0])
            }
          }
        } else {
          console.log('🎯 No user profile provided - showing jobs without match scores')
          // NO PROFILE = Show jobs WITHOUT match scores (no redirect to avoid loops)
          if (append) {
            const updatedJobs = [...jobs, ...transformedJobs]
            setJobs(updatedJobs)
            saveJobsToCache(updatedJobs)
          } else {
            setJobs(transformedJobs)
            saveJobsToCache(transformedJobs)
          }

          setShowPlaceholderNotice(false) // Don't show placeholder notice
          setHasMore(transformedJobs.length >= 30)
          setCurrentPage(page)

          if (!append && transformedJobs.length > 0 && !selectedJob) {
            setSelectedJob(transformedJobs[0])
          }
        }
      } else {
        console.error('JobBrowser: API returned error status:', response.status)
      }
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        console.error('JobBrowser: API request timed out after 2 minutes')
      } else {
        console.error('JobBrowser: Error fetching jobs:', error)
      }
      
      // No fallback - show empty state as requested
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more jobs
  const loadMoreJobs = () => {
    if (!loadingMore && hasMore) {
      fetchJobs(currentPage + 1, true)
    }
  }

  // Poll for tailored job status updates every 30 seconds
  React.useEffect(() => {
    const pollInterval = setInterval(() => {
      // Silently fetch tailored status in background
      fetchTailoredJobs()
    }, 30000) // 30 seconds

    return () => clearInterval(pollInterval)
  }, [])

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const toggleAppliedStatus = async (jobId: string) => {
    const isCurrentlyApplied = appliedJobs.has(jobId)
    const newStatus = !isCurrentlyApplied

    // Optimistically update UI
    setAppliedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })

    // Update in database
    try {
      const response = await fetch('/api/jobs/update-applied-status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          applied: newStatus
        })
      })

      if (!response.ok) {
        console.error('Failed to update applied status')
        // Revert on error
        setAppliedJobs(prev => {
          const newSet = new Set(prev)
          if (isCurrentlyApplied) {
            newSet.add(jobId)
          } else {
            newSet.delete(jobId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error updating applied status:', error)
      // Revert on error
      setAppliedJobs(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyApplied) {
          newSet.add(jobId)
        } else {
          newSet.delete(jobId)
        }
        return newSet
      })
    }
  }

  // Filter and sort jobs (using geo-enhanced jobs)
  const filteredJobs = React.useMemo(() => {
    let filtered = [...enhancedJobs]

    // Enhanced search filter - search across multiple fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(job => {
        // Search in job title
        if (job.title.toLowerCase().includes(query)) return true
        // Search in company name
        if (job.company.name.toLowerCase().includes(query)) return true
        // Search in location
        if (job.location_city?.toLowerCase().includes(query)) return true
        if (job.city?.toLowerCase().includes(query)) return true
        if (job.country?.toLowerCase().includes(query)) return true
        // Search in skills
        if (job.skills && Array.isArray(job.skills)) {
          if (job.skills.some((skill: any) => typeof skill === 'string' && skill.toLowerCase().includes(query))) return true
        }
        // Search in tools
        if (job.tools && Array.isArray(job.tools)) {
          if (job.tools.some((tool: any) => typeof tool === 'string' && tool.toLowerCase().includes(query))) return true
        }
        // Search in job description
        if (job.description?.toLowerCase().includes(query)) return true

        return false
      })
    }

    // Tab filter
    if (selectedTab === 'saved') {
      filtered = filtered.filter(job => savedJobs.has(job.id))
    } else if (selectedTab === 'applied') {
      filtered = filtered.filter(job => appliedJobs.has(job.id))
    }

    // Tailored jobs filter (3-state: all, only, hide)
    if (tailoredFilter === 'only') {
      filtered = filtered.filter(job => tailoredJobs.has(job.id))
    } else if (tailoredFilter === 'hide') {
      filtered = filtered.filter(job => !tailoredJobs.has(job.id))
    }

    // Work mode filter - handle multiple possible field names
    if (selectedWorkMode !== 'all') {
      filtered = filtered.filter(job => {
        const workMode = job.work_mode?.toLowerCase() || '';
        const selectedMode = selectedWorkMode.toLowerCase();
        
        // Handle remote jobs
        if (selectedMode === 'remote') {
          return workMode === 'remote' || job.is_remote === true || job.remote_allowed === true;
        }
        
        // Handle hybrid jobs  
        if (selectedMode === 'hybrid') {
          return workMode === 'hybrid' || job.hybrid_allowed === true;
        }
        
        // Handle onsite jobs
        if (selectedMode === 'onsite') {
          return workMode === 'onsite' || workMode === 'office' ||
                 (workMode !== 'Remote' && workMode !== 'Hybrid' && !job.is_remote && !job.remote_allowed);
        }
        
        return workMode === selectedMode;
      })
    }

    // Language filter - handle multiple possible field names and values
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(job => {
        const germanReq = job.german_required?.toLowerCase() || '';
        const languageReq = job.language_required?.toLowerCase() || '';
        const contentLang = job.content_language?.toLowerCase() || '';
        
        if (selectedLanguage === 'EN') {
          // English only - jobs that don't require German
          return germanReq === 'no' || germanReq === 'en' || !germanReq ||
                 languageReq === 'en' || contentLang === 'en';
        }
        
        if (selectedLanguage === 'DE') {
          // German required - jobs that require German
          return germanReq === 'yes' || germanReq === 'de' || germanReq === 'both' ||
                 languageReq === 'de' || contentLang === 'de';
        }
        
        if (selectedLanguage === 'BOTH') {
          // Both languages required
          return germanReq === 'both' || languageReq === 'both';
        }
        
        return true;
      })
    }

    // Location + Distance filtering - use geo distance when available, text matching as fallback
    if (locationSearch.trim()) {
      const searchTerm = locationSearch.toLowerCase().trim()

      filtered = filtered.filter(job => {
        // Always include remote jobs
        if (job.work_mode === 'Remote') return true

        // If geo distance is available, use distance-based filtering
        if ('distanceKm' in job && typeof job.distanceKm === 'number') {
          return job.distanceKm <= distanceRadius
        }

        // Fallback: text-based location matching (for jobs without geo data)
        const city = (job.city || job.location_city || '').toLowerCase()
        const country = (job.country || job.location_country || '').toLowerCase()
        const fullLocation = (job.location_full || '').toLowerCase()

        return city.includes(searchTerm) ||
               country.includes(searchTerm) ||
               fullLocation.includes(searchTerm)
      })
    }

    // Remote location filter (legacy)
    if (selectedLocation === 'Remote') {
      filtered = filtered.filter(job => job.is_remote || job.work_mode === 'Remote');
    }

    // Job type filter
    if (selectedJobType !== 'all') {
      filtered = filtered.filter(job => {
        if (selectedJobType === 'internship') {
          return job.title.toLowerCase().includes('intern') || job.employment_type?.toLowerCase().includes('intern')
        }
        if (selectedJobType === 'werkstudent') {
          return job.is_werkstudent === true || job.title.toLowerCase().includes('werkstudent')
        }
        return true
      })
    }

    // Time filter (Latest jobs only)
    if (selectedTimeFilter !== 'all') {
      const now = new Date()
      const cutoffDays = parseInt(selectedTimeFilter)
      const cutoffDate = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(job => {
        const jobDate = new Date(job.posted_at || job.created_at || 0)
        return jobDate >= cutoffDate
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match_score':
          // Use enhanced match score if available, otherwise fall back to original
          const scoreA = ('enhancedMatchScore' in a ? a.enhancedMatchScore : a.match_score) || 0;
          const scoreB = ('enhancedMatchScore' in b ? b.enhancedMatchScore : b.match_score) || 0;
          return scoreB - scoreA;
        case 'distance':
          // Sort by distance (remote jobs go last)
          const distA = ('distanceKm' in a && a.work_mode !== 'Remote') ? a.distanceKm || 999 : 999;
          const distB = ('distanceKm' in b && b.work_mode !== 'Remote') ? b.distanceKm || 999 : 999;
          return distA - distB;
        case 'date':
          return new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime()
        case 'applicants':
          return (a.applicants_count || 0) - (b.applicants_count || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [enhancedJobs, searchQuery, selectedTab, selectedWorkMode, selectedLocation, locationSearch, distanceRadius, selectedJobType, selectedTimeFilter, tailoredFilter, sortBy, savedJobs, appliedJobs, tailoredJobs])

  // Get unique locations for filter
  const locations = React.useMemo(() => {
    const locs = new Set(jobs.map(job => job.location_city).filter(Boolean))
    return Array.from(locs)
  }, [jobs])
  
  // Convert user profile to student profile if applicable
  const studentProfile = React.useMemo(() => {
    return convertToStudentProfile(userProfile);
  }, [userProfile]);

  return (
    <div className={cn("w-full h-screen flex flex-col bg-gray-50", className)}>
      {/* Header Section - Ultra Compact */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 flex-shrink-0 w-full">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Find Your Perfect Role</h2>
            <p className="text-gray-600 text-xs">AI-powered job matching</p>
          </div>
        </div>

        {/* Beautiful Search Interface */}
        <div className="space-y-4">
          {/* Primary Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search jobs, companies, and skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 text-sm bg-white border-gray-200 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Modern Filter Row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs sm:text-sm font-medium text-gray-600">Filter by:</span>

            {/* Work Mode Filter */}
            <Select value={selectedWorkMode} onValueChange={setSelectedWorkMode}>
              <SelectTrigger className="h-9 w-[110px] sm:w-[140px] bg-white border-gray-200 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Laptop className="w-3 sm:w-4 h-3 sm:h-4 text-gray-500" />
                  <SelectValue placeholder="Any mode" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any mode</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>

            {/* Job Type Filter */}
            <Select value={selectedJobType} onValueChange={setSelectedJobType}>
              <SelectTrigger className="h-9 w-[130px] sm:w-[160px] bg-white border-gray-200 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Briefcase className="w-3 sm:w-4 h-3 sm:h-4 text-gray-500" />
                  <SelectValue placeholder="All types" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="internship">Internships</SelectItem>
                <SelectItem value="werkstudent">Werkstudent</SelectItem>
              </SelectContent>
            </Select>

            {/* Time Filter (Latest Jobs) */}
            <Select value={selectedTimeFilter} onValueChange={setSelectedTimeFilter}>
              <SelectTrigger className="h-9 w-[130px] sm:w-[160px] bg-white border-gray-200 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-gray-500" />
                  <SelectValue placeholder="All time" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Input */}
            <div className="relative">
              <div className="flex items-center gap-2 h-9 bg-white border border-gray-200 rounded-md px-3 min-w-[220px]">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Berlin, Munich, Frankfurt."
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedLocation('all');
                    }
                  }}
                  className="flex-1 text-sm bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                />
                {locationSearch && (
                  <button
                    onClick={() => setLocationSearch('')}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Distance Filter */}
            <Select value={String(distanceRadius)} onValueChange={(val) => setDistanceRadius(Number(val))}>
              <SelectTrigger className="h-9 w-[100px] bg-white border-gray-200 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20km</SelectItem>
                <SelectItem value="50">50km</SelectItem>
                <SelectItem value="100">100km</SelectItem>
                <SelectItem value="200">200km</SelectItem>
                <SelectItem value="500">500km</SelectItem>
              </SelectContent>
            </Select>

            {/* Language Filter */}
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="h-9 w-[160px] bg-white border-gray-200 text-sm">
                <div className="flex items-center gap-2 w-full overflow-hidden">
                  <Globe2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">
                    <SelectValue placeholder="Language" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any language</SelectItem>
                <SelectItem value="EN">English only</SelectItem>
                <SelectItem value="DE">German required</SelectItem>
                <SelectItem value="BOTH">Both required</SelectItem>
              </SelectContent>
            </Select>

            {/* Tailored Jobs Filter (3-state: all, only, hide) */}
            <Button
              variant={tailoredFilter !== 'all' ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 px-3 gap-2 text-sm font-medium transition-all whitespace-nowrap",
                tailoredFilter === 'only' && "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-sm",
                tailoredFilter === 'hide' && "bg-gradient-to-r from-gray-500 to-slate-500 text-white hover:from-gray-600 hover:to-slate-600 shadow-sm"
              )}
              onClick={() => {
                setTailoredFilter(prev => {
                  if (prev === 'all') return 'only'
                  if (prev === 'only') return 'hide'
                  return 'all'
                })
              }}
              title={
                tailoredFilter === 'all' ? 'Show all jobs (click to show only tailored)' :
                tailoredFilter === 'only' ? 'Showing only tailored jobs (click to hide tailored)' :
                'Hiding tailored jobs (click to show all)'
              }
            >
              {tailoredFilter === 'all' && (
                <>
                  <Zap className="w-4 h-4" />
                  All Jobs
                </>
              )}
              {tailoredFilter === 'only' && (
                <>
                  <Zap className="w-4 h-4" />
                  Only Tailored
                </>
              )}
              {tailoredFilter === 'hide' && (
                <>
                  <X className="w-4 h-4" />
                  Tailored Hidden
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Placeholder Scores Notice */}
      {showPlaceholderNotice && (
        <motion.div 
          className="bg-white border border-blue-200 mx-6 my-2 p-3 rounded-lg shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Showing Estimated Match Scores
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                Upload your resume in <strong>Step 1</strong> to get real AI-powered match scores based on skills overlap, tools, language requirements, and location preferences.
              </p>
            </div>
            <button
              onClick={() => setShowPlaceholderNotice(false)}
              className="flex-shrink-0 text-blue-500 hover:text-blue-700 transition-colors p-1"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* LinkedIn-style Layout: Jobs List + Job Details */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Jobs List - Compact - Full width on mobile, 1/3 on desktop */}
        <div className={cn(
          "w-full md:w-1/3 min-w-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto",
          selectedJob && "hidden md:block"
        )}>
          <div className="p-2">
            <div className="text-xs text-gray-600 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{filteredJobs.length} jobs</span>
                {tailoredJobs.size > 0 && (
                  <div className="flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-sm" title={`${tailoredJobs.size} jobs with tailored resumes`}>
                    <Zap className="w-2.5 h-2.5" />
                    <span className="text-xs font-bold">{tailoredJobs.size} Tailored</span>
                  </div>
                )}
                {showPlaceholderNotice && (
                  <div className="flex items-center gap-0.5 text-blue-600" title="Estimated scores shown - upload resume for real AI matching">
                    <Target className="w-2.5 h-2.5" />
                    <span className="text-xs font-medium">Est. Scores</span>
                  </div>
                )}
                {/* Geo-enhanced stats */}
                {userLocation && geoStats && geoStats.jobsWithDistance > 0 && (
                  <div className="flex items-center gap-0.5 text-emerald-600" title={`Enhanced location matching active - ${geoStats.nearbyJobs} nearby jobs`}>
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="text-xs font-medium">{geoStats.nearbyJobs} nearby</span>
                    {isGeoProcessing && <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>}
                  </div>
                )}
              </div>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="h-7 bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs px-3 h-5 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-600 transition-all"
                  >
                    All Jobs
                  </TabsTrigger>
                  <TabsTrigger 
                    value="saved" 
                    className="text-xs px-3 h-5 font-medium data-[state=active]:bg-blue-600 data-[state=active]:shadow-sm data-[state=active]:text-white data-[state=inactive]:text-gray-600 transition-all"
                  >
                    <Bookmark className="w-3 h-3 mr-1" />
                    Saved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Outer spinning circle */}
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

                  {/* Inner pulsing dot */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="w-4 h-4 bg-blue-600 rounded-full" />
                  </motion.div>
                </motion.div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="space-y-3 text-center px-6">
                  <Search className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600 text-sm">No jobs found</p>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchQuery('')
                    setSelectedWorkMode('all')
                    setSelectedLanguage('all')
                    setSelectedLocation('all')
                    setLocationSearch('')
                    setSelectedJobType('all')
                    setTailoredFilter('all')
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <motion.div
                      data-testid="job-card"
                      className={cn(
                        "p-1.5 border-b cursor-pointer transition-all duration-200 group relative",
                        tailoredJobs.has(job.id)
                          ? selectedJob?.id === job.id
                            ? "bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-l-4 border-l-emerald-500 shadow-md border-emerald-100"
                            : "bg-gradient-to-r from-emerald-50/50 to-green-50/30 border-l-3 border-l-emerald-400 hover:shadow-md hover:border-l-emerald-500 border-emerald-100"
                          : selectedJob?.id === job.id
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-sm border-gray-100"
                            : "hover:bg-gray-50 hover:shadow-sm hover:border-l-2 hover:border-l-gray-300 border-gray-100"
                      )}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="flex gap-1.5">
                        {/* Enhanced Company Logo */}
                        <div className="flex-shrink-0">
                          <motion.div 
                            className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-md flex items-center justify-center overflow-hidden shadow-sm border border-gray-200/50 group-hover:shadow-md transition-shadow"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {job.company.logo_url ? (
                              <img src={job.company.logo_url} alt={job.company.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            )}
                          </motion.div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title and Score - Same Line */}
                          <div className="flex items-start justify-between mb-0.5">
                            <h3 className="font-medium text-gray-900 text-xs truncate pr-1 leading-tight">{job.title}</h3>
                            {(job.match_score || job.match_score === 0) && (
                              <MatchScore
                                score={job.match_score}
                                size="sm"
                                showLabel={false}
                                breakdown={(job as any).matchCalculation ? {
                                  skills: Math.round(((job as any).matchCalculation.skillsOverlap?.score || 0) * 100),
                                  tools: Math.round(((job as any).matchCalculation.toolsOverlap?.score || 0) * 100),
                                  language: Math.round(((job as any).matchCalculation.languageFit?.score || 0) * 100),
                                  location: Math.round(((job as any).matchCalculation.locationFit?.score || 0) * 100)
                                } : undefined}
                              />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mb-0.5">
                            <p className="text-[11px] text-gray-600 truncate font-medium">{job.company.name}</p>
                          </div>

                          {/* Ultra Compact Meta with Distance */}
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                            {(job.city || job.location_city) && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-2 h-2" />
                                {job.city || job.location_city}
                              </span>
                            )}
                            {/* Show distance if available */}
                            {'distanceKm' in job && job.distanceKm !== undefined && job.work_mode !== 'Remote' && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs font-medium text-blue-600">{job.distanceKm}km</span>
                              </>
                            )}
                            {job.work_mode && job.work_mode !== 'Unknown' && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs">{job.work_mode}</span>
                              </>
                            )}
                          </div>

                          {/* Employment Type, Language Badges, and Eligibility */}
                          <div className="flex items-center gap-0.5 flex-wrap">
                            {appliedJobs.has(job.id) && (
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400 text-xs h-3.5 px-1 font-medium gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Applied
                              </Badge>
                            )}
                            {job.is_werkstudent && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs h-3.5 px-1 font-medium">
                                Werkstudent
                              </Badge>
                            )}
                            {((job.employment_type && job.employment_type.toLowerCase().includes('intern')) || 
                              (job.title && job.title.toLowerCase().includes('intern')) ||
                              (job.contract_type && job.contract_type.toLowerCase().includes('intern'))) && (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs h-3.5 px-1 font-medium">
                                Intern
                              </Badge>
                            )}
                            
                            {/* Werkstudent Eligibility Badge */}
                            {(job.is_werkstudent || (job.title && job.title.toLowerCase().includes('werkstudent'))) && studentProfile && (
                              <div className="mt-0.5">
                                <EligibilityChecker
                                  studentProfile={studentProfile}
                                  jobRequirements={{
                                    hours_per_week: (job as any).hours_per_week || '15-20',
                                    language_required: job.german_required || job.language_required || undefined,
                                    location: job.location_city || undefined,
                                    duration: (job as any).duration_months?.toString(),
                                    start_date: (job as any).start_date
                                  }}
                                  compact={true}
                                />
                              </div>
                            )}
                            {((): React.ReactNode => {
                              // Smart language detection for existing jobs
                              let detectedLanguage: any = job.german_required;

                              // If unknown, try to detect from job content
                              if (detectedLanguage === 'unknown' || !detectedLanguage) {
                                // Check if job content appears to be in English
                                const englishIndicators = [
                                  job.title?.includes('Intern'),
                                  job.responsibilities?.some((r: any) => typeof r === 'string' && /^[A-Z][a-z\s]+[.]$/.test(r)),
                                  job.skills?.some((s: any) => typeof s === 'string' && ['Marketing', 'Analysis', 'Management', 'Development'].some((eng: string) => s.includes(eng)))
                                ];

                                if (englishIndicators.filter(Boolean).length >= 2) {
                                  detectedLanguage = 'EN';
                                }
                              }
                              
                              return detectedLanguage && detectedLanguage !== 'unknown' ? (
                                <Badge className={cn("gap-0.5 text-xs h-4 px-1.5 font-medium border", 
                                  detectedLanguage === 'DE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  detectedLanguage === 'EN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  detectedLanguage === 'both' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''
                                )}>
                                  <Globe2 className="w-2.5 h-2.5" />
                                  {detectedLanguage === 'DE' ? 'DE' :
                                   detectedLanguage === 'EN' ? 'EN' :
                                   detectedLanguage === 'both' ? 'DE/EN' : ''}
                                </Badge>
                              ) : null;
                            })()}
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {tailoredJobs.has(job.id) && (
                                <motion.div
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  title="You've tailored your resume for this job"
                                >
                                  <Zap className="w-2.5 h-2.5" />
                                  <span className="text-xs font-medium">Tailored</span>
                                </motion.div>
                              )}
                              <Button
                                size="sm"
                                variant={savedJobs.has(job.id) ? "default" : "ghost"}
                                className="h-4 w-4 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSaveJob(job.id)
                                }}
                              >
                                {savedJobs.has(job.id) ? (
                                  <BookmarkCheck className="w-2.5 h-2.5" />
                                ) : (
                                  <Bookmark className="w-2.5 h-2.5" />
                                )}
                              </Button>
                              {job.posted_at && (
                                <span className="text-xs text-gray-400">
                                  {new Date(job.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                            
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Load More Button */}
                {hasMore && !loading && filteredJobs.length > 0 && (
                  <div className="p-4 flex justify-center border-t border-gray-100">
                    <Button
                      onClick={loadMoreJobs}
                      disabled={loadingMore}
                      variant="outline"
                      size="sm"
                      className="w-full max-w-xs"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                          Loading more jobs...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Load More Jobs
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Job Details */}
        <div className={cn(
          "flex-1 min-w-0 overflow-y-auto bg-white",
          !selectedJob && "hidden md:block"
        )}>
          {selectedJob ? (
            <div className="h-full">
              {/* Back Button - Mobile Only */}
              <button
                onClick={() => setSelectedJob(null)}
                className="md:hidden sticky top-0 z-10 w-full flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                <span className="font-medium">Back to Jobs</span>
              </button>

              {/* Job Header - Enhanced with match score emphasis */}
              <motion.div
                className="border-b border-gray-200 p-3 sm:p-4 relative overflow-hidden bg-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Background decoration for high matches */}
                {selectedJob.match_score && selectedJob.match_score >= 85 && (
                  <motion.div 
                    className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-2xl"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 mb-1 pr-2">{selectedJob.title}</h1>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <span className="font-medium">{selectedJob.company.name}</span>
                      {(selectedJob.city || selectedJob.location_city) && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {selectedJob.city || selectedJob.location_city}
                          </span>
                        </>
                      )}
                      {selectedJob.posted_at && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(selectedJob.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Werkstudent Eligibility for Selected Job */}
                    {(selectedJob.is_werkstudent || (selectedJob.title && selectedJob.title.toLowerCase().includes('werkstudent'))) && studentProfile && (
                      <div className="mb-3">
                        <EligibilityChecker
                          studentProfile={studentProfile}
                          jobRequirements={{
                            hours_per_week: (selectedJob as any).hours_per_week || '15-20',
                            language_required: selectedJob.german_required || selectedJob.language_required || undefined,
                            location: selectedJob.location_city || undefined,
                            duration: (selectedJob as any).duration_months?.toString(),
                            start_date: (selectedJob as any).start_date || undefined
                          }}
                          compact={false}
                        />
                      </div>
                    )}


                    {/* Compact Badges */}
                    <div className="flex flex-wrap gap-1">
                      {(selectedJob.match_score || selectedJob.match_score === 0) && (
                        <MatchScore
                          score={selectedJob.match_score}
                          size="md"
                          showLabel={true}
                          breakdown={(selectedJob as any).matchCalculation ? {
                            skills: Math.round(((selectedJob as any).matchCalculation.skillsOverlap?.score || 0) * 100),
                            tools: Math.round(((selectedJob as any).matchCalculation.toolsOverlap?.score || 0) * 100),
                            language: Math.round(((selectedJob as any).matchCalculation.languageFit?.score || 0) * 100),
                            location: Math.round(((selectedJob as any).matchCalculation.locationFit?.score || 0) * 100)
                          } : undefined}
                        />
                      )}
                      {selectedJob.work_mode && selectedJob.work_mode !== 'Unknown' && (
                        <Badge variant="outline" className="gap-0.5 text-xs h-5 px-1.5">
                          {workModeIcons[selectedJob.work_mode as keyof typeof workModeIcons]}
                          {selectedJob.work_mode}
                        </Badge>
                      )}
                      {selectedJob.employment_type && selectedJob.employment_type !== 'Unknown' && (
                        <Badge variant="outline" className="text-xs h-5 px-1.5">{selectedJob.employment_type}</Badge>
                      )}
                      {selectedJob.is_werkstudent && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs h-5 px-1.5">Werkstudent</Badge>
                      )}
                      {((): React.ReactNode => {
                        // Smart language detection for existing jobs
                        let detectedLanguage: string | null = selectedJob.german_required;

                        // If unknown, try to detect from job content
                        if (detectedLanguage === 'unknown' || !detectedLanguage) {
                          // Check if job content appears to be in English
                          const englishIndicators = [
                            selectedJob.title?.includes('Intern'),
                            selectedJob.responsibilities?.some((r: any) => typeof r === 'string' && /^[A-Z][a-z\s]+[.]$/.test(r)),
                            selectedJob.skills?.some((s: any) => typeof s === 'string' && ['Marketing', 'Analysis', 'Management', 'Development', 'Laboratory', 'Technical'].some((eng: string) => s.includes(eng)))
                          ];

                          if (englishIndicators.filter(Boolean).length >= 2) {
                            detectedLanguage = 'EN';
                          }
                        }
                        
                        return detectedLanguage && detectedLanguage !== 'unknown' ? (
                          <Badge className={cn("gap-0.5 text-xs h-5 px-1.5 font-medium border", 
                            detectedLanguage === 'DE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            detectedLanguage === 'EN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            detectedLanguage === 'both' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''
                          )}>
                            <Globe2 className="w-2.5 h-2.5" />
                            {detectedLanguage === 'DE' ? 'DE' :
                             detectedLanguage === 'EN' ? 'EN' :
                             detectedLanguage === 'both' ? 'DE/EN' : ''}
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="ml-3 flex gap-1 flex-shrink-0">
                    {tailoredJobs.has(selectedJob.id) ? (
                      <Link href={`/jobs/${selectedJob.id}/tailor`} prefetch={true}>
                        <Button
                          size="sm"
                          className="h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                        >
                          <Zap className="w-3 h-3 mr-1.5" />
                          View Application
                        </Button>
                      </Link>
                    ) : (
                      <AITailorButton
                        jobId={selectedJob.id}
                        isTailored={tailoredJobs.has(selectedJob.id)}
                        matchScore={tailoredJobs.get(selectedJob.id)?.match_score}
                      />
                    )}

                    <Button
                      variant={savedJobs.has(selectedJob.id) ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleSaveJob(selectedJob.id)}
                    >
                      {savedJobs.has(selectedJob.id) ? (
                        <BookmarkCheck className="w-3 h-3" />
                      ) : (
                        <Bookmark className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Job Content - Ultra Compact */}
              <div className="p-3">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-3">
                    {/* Salary Information - Inline */}
                    {(extractSalaryFromBenefits(selectedJob.benefits) || selectedJob.salary_min || selectedJob.salary_max || selectedJob.salary_info) && (
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded p-2 border border-emerald-200">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <h3 className="font-medium text-emerald-900 text-sm">Compensation</h3>
                        </div>
                        <div className="text-emerald-800 text-xs space-y-0.5">
                          {extractSalaryFromBenefits(selectedJob.benefits) && (
                            <p className="font-medium">{extractSalaryFromBenefits(selectedJob.benefits)}</p>
                          )}
                          {(selectedJob.salary_min || selectedJob.salary_max) && (
                            <p>
                              {selectedJob.salary_min && selectedJob.salary_max 
                                ? `€${selectedJob.salary_min.toLocaleString()} - €${selectedJob.salary_max.toLocaleString()}`
                                : selectedJob.salary_min 
                                ? `From €${selectedJob.salary_min.toLocaleString()}`
                                : `Up to €${selectedJob.salary_max?.toLocaleString()}`
                              }
                            </p>
                          )}
                          {selectedJob.salary_info && <p>{selectedJob.salary_info}</p>}
                        </div>
                      </div>
                    )}

                    {/* Company Context/Description - Compact */}
                    {selectedJob.company?.description && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          <h3 className="font-medium text-blue-900 text-sm">About {selectedJob.company.name}</h3>
                        </div>
                        <div className="text-blue-800 text-xs leading-relaxed">
                          <p>{selectedJob.company.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Responsibilities - Compact */}
                    {selectedJob.responsibilities && (Array.isArray(selectedJob.responsibilities) ? selectedJob.responsibilities.length > 0 : true) && (
                      <div className="bg-white rounded border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-3 h-3 text-blue-600" />
                          <h3 className="font-medium text-gray-900 text-sm">What You'll Do</h3>
                        </div>
                        <div className="text-xs">
                          {renderJobContent(selectedJob.responsibilities)}
                        </div>
                      </div>
                    )}

                    {/* Who We Are Looking For - Compact */}
                    {selectedJob.who_we_are_looking_for && (Array.isArray(selectedJob.who_we_are_looking_for) ? selectedJob.who_we_are_looking_for.length > 0 : true) && (
                      <div className="bg-white rounded border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-3 h-3 text-indigo-600" />
                          <h3 className="font-medium text-gray-900 text-sm">Who We're Looking For</h3>
                        </div>
                        <div className="text-xs">
                          {renderJobContent(selectedJob.who_we_are_looking_for)}
                        </div>
                      </div>
                    )}

                    {/* Nice to Have - Compact */}
                    {selectedJob.nice_to_have && (Array.isArray(selectedJob.nice_to_have) ? selectedJob.nice_to_have.length > 0 : true) && (
                      <div className="bg-white rounded border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-3 h-3 text-emerald-600" />
                          <h3 className="font-medium text-gray-900 text-sm">Nice to Have</h3>
                        </div>
                        <div className="text-xs">
                          {renderJobContent(selectedJob.nice_to_have)}
                        </div>
                      </div>
                    )}

                    {/* Benefits - Compact */}
                    {selectedJob.benefits && (Array.isArray(selectedJob.benefits) ? selectedJob.benefits.length > 0 : true) && (
                      <div className="bg-white rounded border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-3 h-3 text-purple-600" />
                          <h3 className="font-medium text-gray-900 text-sm">What We Offer</h3>
                        </div>
                        <div className="text-xs">
                          {renderJobContent(selectedJob.benefits)}
                        </div>
                      </div>
                    )}

                    {/* Application Requirements - Pills Format */}
                    {selectedJob.application_requirements && Array.isArray(selectedJob.application_requirements) && selectedJob.application_requirements.length > 0 && (
                      <div className="bg-white rounded border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-3 h-3 text-orange-600" />
                          <h3 className="font-medium text-gray-900 text-sm">What to Include in Your Application</h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedJob.application_requirements.map((requirement, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1 font-medium hover:bg-orange-100 transition-colors"
                            >
                              {requirement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Sidebar - Compact */}
                  <div className="space-y-2">
                    {userProfile && selectedJob && (
                      <div className="transform scale-90 origin-top">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                            <h3 className="font-semibold text-green-900 text-sm">Matching Skills</h3>
                            <div className="ml-auto text-xs text-green-600 font-medium">
                              {((): string => {
                                // Prefer server-calculated overlap if available
                                const mc = (selectedJob as any).matchCalculation;
                                if (mc && mc.skillsOverlap && Array.isArray(mc.skillsOverlap.matched)) {
                                  if (process.env.NEXT_PUBLIC_MATCH_DEBUG === '1') {
                                     
                                    console.debug('[match.debug] server overlap', {
                                      jobId: (selectedJob as any).id,
                                      skillsMatched: mc.skillsOverlap.matched.slice(0, 5),
                                      toolsMatched: (mc.toolsOverlap?.matched || []).slice(0, 5)
                                    })
                                  }
                                  return `${mc.skillsOverlap.matched.length} matches`;
                                }
                                // Fallback: simple intersection
                                const allUserSkills: string[] = [];
                                if ((userProfile as any).skills && typeof (userProfile as any).skills === 'object') {
                                  Object.values((userProfile as any).skills).forEach(arr => {
                                    if (Array.isArray(arr)) {
                                      for (const s of arr) allUserSkills.push(String(s));
                                    }
                                  });
                                }
                                const normalizedUserSkills = allUserSkills.map(s => s.toLowerCase().trim());
                                const rawJobSkills = (selectedJob as any).skills || [];
                                const jobSkills = Array.isArray(rawJobSkills) ? rawJobSkills.map((s: any) => String(s).toLowerCase().trim()) : [];
                                const matchingSkills = jobSkills.filter(jobSkill => normalizedUserSkills.some(userSkill => userSkill === jobSkill || userSkill.includes(jobSkill) || jobSkill.includes(userSkill)));
                                if (process.env.NEXT_PUBLIC_MATCH_DEBUG === '1') {
                                   
                                  console.debug('[match.debug] fallback overlap', {
                                    jobId: (selectedJob as any).id,
                                    userSkills: normalizedUserSkills.slice(0, 5),
                                    jobSkills: jobSkills.slice(0, 5),
                                    count: matchingSkills.length
                                  })
                                }
                                return `${matchingSkills.length} matches`;
                              })()}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {((): React.ReactNode => {
                              // Prefer server-calculated lists
                              const mc = (selectedJob as any).matchCalculation;
                              if (mc && mc.skillsOverlap && Array.isArray(mc.skillsOverlap.matched)) {
                                const matchingTechSkills: string[] = mc.skillsOverlap.matched || [];
                                const matchingDesignSkills: string[] = (mc.toolsOverlap?.matched as string[]) || [];
                                const matchingSoftSkills: string[] = [];
                                return (
                                  <>
                                    {matchingTechSkills.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span className="text-xs font-medium text-green-800">Technical</span>
                                          <span className="text-xs text-green-600">({matchingTechSkills.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {(expandedSkillSections.technical ? matchingTechSkills : matchingTechSkills.slice(0, 6)).map((skill: string, index: number) => (
                                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">{skill}</span>
                                          ))}
                                          {matchingTechSkills.length > 6 && (
                                            <button onClick={() => setExpandedSkillSections(prev => ({ ...prev, technical: !prev.technical }))} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                                              {expandedSkillSections.technical ? 'Show less' : `+${matchingTechSkills.length - 6} more`}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {matchingDesignSkills.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-1 mb-1">
                                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                          <span className="text-xs font-medium text-purple-800">Tools</span>
                                          <span className="text-xs text-purple-600">({matchingDesignSkills.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {(expandedSkillSections.design ? matchingDesignSkills : matchingDesignSkills.slice(0, 4)).map((skill: string, index: number) => (
                                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">{skill}</span>
                                          ))}
                                          {matchingDesignSkills.length > 4 && (
                                            <button onClick={() => setExpandedSkillSections(prev => ({ ...prev, design: !prev.design }))} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                                              {expandedSkillSections.design ? 'Show less' : `+${matchingDesignSkills.length - 4} more`}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {matchingTechSkills.length === 0 && matchingDesignSkills.length === 0 && (
                                      <div className="text-center py-2">
                                        <span className="text-xs text-gray-500">No matching skills found</span>
                                      </div>
                                    )}
                                  </>
                                );
                              }

                              // Fallback: original client-side intersection by category
                              const userTechSkills: string[] = [];
                              const userSoftSkills: string[] = [];
                              const userDesignSkills: string[] = [];
                              if ((userProfile as any).skills && typeof (userProfile as any).skills === 'object') {
                                Object.entries((userProfile as any).skills).forEach(([category, skillArray]) => {
                                  if (Array.isArray(skillArray)) {
                                    const normalizedSkills = skillArray.map(s => String(s).toLowerCase().trim());
                                    if (category.toLowerCase().includes('technical') || category.toLowerCase().includes('tech')) {
                                      userTechSkills.push(...normalizedSkills);
                                    } else if (category.toLowerCase().includes('soft') || category.toLowerCase().includes('business')) {
                                      userSoftSkills.push(...normalizedSkills);
                                    } else if (category.toLowerCase().includes('design') || category.toLowerCase().includes('tools')) {
                                      userDesignSkills.push(...normalizedSkills);
                                    } else {
                                      userTechSkills.push(...normalizedSkills);
                                    }
                                  }
                                });
                              }
                              const jobSkills = (selectedJob as any).skills || [];
                              const matchingTechSkills = (jobSkills as any[]).filter(jobSkill => userTechSkills.some(userSkill => userSkill === String(jobSkill).toLowerCase().trim() || userSkill.includes(String(jobSkill).toLowerCase().trim()) || String(jobSkill).toLowerCase().trim().includes(userSkill)));
                              const matchingSoftSkills = (jobSkills as any[]).filter(jobSkill => userSoftSkills.some(userSkill => userSkill === String(jobSkill).toLowerCase().trim() || userSkill.includes(String(jobSkill).toLowerCase().trim()) || String(jobSkill).toLowerCase().trim().includes(userSkill)));
                              const matchingDesignSkills = (jobSkills as any[]).filter(jobSkill => userDesignSkills.some(userSkill => userSkill === String(jobSkill).toLowerCase().trim() || userSkill.includes(String(jobSkill).toLowerCase().trim()) || String(jobSkill).toLowerCase().trim().includes(userSkill)));

                              return (
                                <>
                                  {matchingTechSkills.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-medium text-green-800">Technical</span>
                                        <span className="text-xs text-green-600">({matchingTechSkills.length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {(expandedSkillSections.technical ? matchingTechSkills : matchingTechSkills.slice(0, 6)).map((skill: string, index: number) => (
                                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">{String(skill)}</span>
                                        ))}
                                        {matchingTechSkills.length > 6 && (
                                          <button onClick={() => setExpandedSkillSections(prev => ({ ...prev, technical: !prev.technical }))} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                                            {expandedSkillSections.technical ? 'Show less' : `+${matchingTechSkills.length - 6} more`}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {matchingSoftSkills.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span className="text-xs font-medium text-emerald-800">Soft Skills</span>
                                        <span className="text-xs text-emerald-600">({matchingSoftSkills.length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {(expandedSkillSections.soft ? matchingSoftSkills : matchingSoftSkills.slice(0, 4)).map((skill: string, index: number) => (
                                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">{String(skill)}</span>
                                        ))}
                                        {matchingSoftSkills.length > 4 && (
                                          <button onClick={() => setExpandedSkillSections(prev => ({ ...prev, soft: !prev.soft }))} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer">
                                            {expandedSkillSections.soft ? 'Show less' : `+${matchingSoftSkills.length - 4} more`}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {matchingDesignSkills.length > 0 && (
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span className="text-xs font-medium text-purple-800">Design & Tools</span>
                                        <span className="text-xs text-purple-600">({matchingDesignSkills.length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {(expandedSkillSections.design ? matchingDesignSkills : matchingDesignSkills.slice(0, 4)).map((skill: string, index: number) => (
                                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">{String(skill)}</span>
                                        ))}
                                        {matchingDesignSkills.length > 4 && (
                                          <button onClick={() => setExpandedSkillSections(prev => ({ ...prev, design: !prev.design }))} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                                            {expandedSkillSections.design ? 'Show less' : `+${matchingDesignSkills.length - 4} more`}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {matchingTechSkills.length === 0 && matchingSoftSkills.length === 0 && matchingDesignSkills.length === 0 && (
                                    <div className="text-center py-2">
                                      <span className="text-xs text-gray-500">No matching skills found</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skills Analysis Panel - Moved to top */}
                    {((): boolean => {
                      const skills = (selectedJob as any).skills
                        ;
                      return Array.isArray(skills) && skills.length > 0;
                    })() && (
                      <div className="transform scale-90 origin-top">
                        <SkillsAnalysisPanel 
                          jobSkills={(selectedJob as any).skills
                            || (selectedJob as any).skills_canonical_flat
                            || (selectedJob as any).skills_canonical}
                          jobTitle={selectedJob.title}
                        />
                      </div>
                    )}
                    
                    {/* Company Intelligence Panel - Moved below skills */}
                    <div className="transform scale-90 origin-top">
                      <CompanyIntelligencePanel
                        company={selectedJob.company}
                        jobSpecificInsights={{
                          hiring_manager: selectedJob.hiring_manager,
                          additional_insights: selectedJob.additional_insights
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Button - Bottom of Card */}
                {(selectedJob.application_url || selectedJob.linkedin_url) && (
                  <div className="px-3 pb-3 pt-0 space-y-2">
                    <Button
                      className="w-full gap-2 h-11 text-base font-medium"
                      onClick={() => window.open(selectedJob.application_url || selectedJob.linkedin_url!, '_blank')}
                    >
                      Apply on Company Website
                      <ExternalLink className="w-4 h-4" />
                    </Button>

                    <Button
                      variant={appliedJobs.has(selectedJob.id) ? "default" : "outline"}
                      className={cn(
                        "w-full gap-2 h-9 text-sm font-medium",
                        appliedJobs.has(selectedJob.id) && "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
                      )}
                      onClick={() => toggleAppliedStatus(selectedJob.id)}
                    >
                      {appliedJobs.has(selectedJob.id) ? (
                        <>
                          <Check className="w-4 h-4" />
                          Application Submitted
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Mark as Applied
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto" />
                <p className="text-gray-500">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
