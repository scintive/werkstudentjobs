'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, AlertCircle, Clock, MapPin, 
  Languages, Calendar, CreditCard, GraduationCap, Briefcase,
  ChevronRight, Sparkles, Info
} from 'lucide-react';
import type { StudentProfile, WerkstudentEligibility } from '@/lib/types/studentProfile';

interface EligibilityCheckerProps {
  studentProfile: Partial<StudentProfile>;
  userProfile?: unknown; // Add user profile info
  jobRequirements?: {
    hours_per_week?: string;
    language_required?: string;
    location?: string;
    duration?: string;
    start_date?: string;
  };
  onUpdateProfile?: (updates: Partial<StudentProfile>) => void;
  compact?: boolean;
}

export default function EligibilityChecker({ 
  studentProfile, 
  userProfile,
  jobRequirements,
  onUpdateProfile,
  compact = false 
}: EligibilityCheckerProps) {
  const [eligibility, setEligibility] = useState<WerkstudentEligibility | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    checkEligibility();
  }, [studentProfile, jobRequirements]);

  const checkEligibility = () => {
    const checks = {
      enrolled: !!studentProfile.enrollment_status && studentProfile.enrollment_status === 'enrolled',
      availability_match: checkAvailability(),
      location_match: checkLocation(),
      language_match: checkLanguage(),
      visa_ok: checkVisa(),
      duration_match: checkDuration()
    };

    const missing: string[] = [];
    const suggestions: string[] = [];

    if (!checks.enrolled) {
      missing.push('Enrollment verification needed');
      suggestions.push('Upload your Immatrikulationsbescheinigung');
    }
    if (!checks.availability_match) {
      missing.push('Weekly hours not specified');
      suggestions.push('Add your available hours (typically 15-20h/week)');
    }
    if (!checks.language_match) {
      missing.push('Language proficiency not verified');
      suggestions.push('Add your German language level (B1+ recommended)');
    }

    const isEligible = Object.values(checks).every(v => v);
    const hasInfo = Object.values(checks).filter(v => v).length >= 4;

    setEligibility({
      is_eligible: isEligible,
      status: isEligible ? 'eligible' : hasInfo ? 'needs_info' : 'not_eligible',
      checklist: checks,
      missing_requirements: missing,
      suggestions
    });
  };

  const checkAvailability = (): boolean => {
    if (!studentProfile.weekly_availability) return false;
    if (!jobRequirements?.hours_per_week) return true;
    
    const required = parseInt(jobRequirements.hours_per_week);
    return studentProfile.weekly_availability.hours_max >= required;
  };

  const checkLocation = (): boolean => {
    if (!jobRequirements?.location) return true;
    if (!studentProfile.preferred_locations?.length) return false;

    const jobLocation = jobRequirements.location;
    return studentProfile.preferred_locations.some(loc =>
      loc.toLowerCase().includes(jobLocation.toLowerCase())
    ) || studentProfile.remote_preference !== 'onsite_only';
  };

  const checkLanguage = (): boolean => {
    if (!jobRequirements?.language_required) return true;
    if (!studentProfile.language_proficiencies?.length) return false;
    
    const required = jobRequirements.language_required.toUpperCase();
    if (required.includes('DE')) {
      const german = studentProfile.language_proficiencies.find(l => 
        l.language.toLowerCase().includes('german') || l.language.toLowerCase().includes('deutsch')
      );
      return german ? ['B1', 'B2', 'C1', 'C2', 'Native'].includes(german.cefr_level) : false;
    }
    return true;
  };

  const checkVisa = (): boolean => {
    if (!studentProfile.visa_status) return true;
    return studentProfile.visa_status !== 'needs_sponsorship';
  };

  const checkDuration = (): boolean => {
    if (!studentProfile.preferred_duration) return false;
    if (!jobRequirements?.duration) return true;
    
    const requiredMonths = parseInt(jobRequirements.duration);
    return studentProfile.preferred_duration.months_min <= requiredMonths;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible': return 'bg-green-50 border-green-200 text-green-700';
      case 'needs_info': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'not_eligible': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'eligible': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'needs_info': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'not_eligible': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const checklistItems = [
    {
      key: 'enrolled',
      label: 'Student Enrollment',
      icon: <GraduationCap className="w-4 h-4" />,
      value: studentProfile.enrollment_status === 'enrolled' ? 
        `Enrolled until ${studentProfile.expected_graduation || 'TBD'}` : 
        'Not verified',
      action: 'Add enrollment status'
    },
    {
      key: 'availability_match',
      label: 'Weekly Availability',
      icon: <Clock className="w-4 h-4" />,
      value: studentProfile.weekly_availability ? 
        `${studentProfile.weekly_availability.hours_min}-${studentProfile.weekly_availability.hours_max}h/week` : 
        'Not specified',
      action: 'Set availability'
    },
    {
      key: 'location_match',
      label: 'Location',
      icon: <MapPin className="w-4 h-4" />,
      value: studentProfile.preferred_locations?.join(', ') || 'Not specified',
      action: 'Add locations'
    },
    {
      key: 'language_match',
      label: 'Language Skills',
      icon: <Languages className="w-4 h-4" />,
      value: studentProfile.language_proficiencies?.map(l => 
        `${l.language} (${l.cefr_level})`
      ).join(', ') || 'Not specified',
      action: 'Add languages'
    },
    {
      key: 'visa_ok',
      label: 'Work Authorization',
      icon: <CreditCard className="w-4 h-4" />,
      value: studentProfile.visa_status || 'Not specified',
      action: 'Add visa status'
    },
    {
      key: 'duration_match',
      label: 'Commitment Duration',
      icon: <Calendar className="w-4 h-4" />,
      value: studentProfile.preferred_duration ? 
        `${studentProfile.preferred_duration.months_min}-${studentProfile.preferred_duration.months_max} months` : 
        'Not specified',
      action: 'Set duration'
    }
  ];

  if (compact) {
    // Compact view for job cards
    return (
      <div className="flex items-center gap-2">
        {eligibility && (
          <>
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              eligibility.status === 'eligible' ? 'bg-green-100 text-green-700' :
              eligibility.status === 'needs_info' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getStatusIcon(eligibility.status)}
              <span>
                {eligibility.status === 'eligible' ? 'Eligible' :
                 eligibility.status === 'needs_info' ? 'Check Required' :
                 'Not Eligible'}
              </span>
            </div>
            <div className="flex gap-1">
              {Object.entries(eligibility.checklist).map(([key, value]) => (
                <div
                  key={key}
                  className={`w-2 h-2 rounded-full ${
                    value ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={checklistItems.find(item => item.key === key)?.label}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header with User Info */}
      <div className={`p-4 border-b ${eligibility ? getStatusColor(eligibility.status) : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {userProfile?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                {userProfile?.name || 'Student Profile'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                {userProfile?.education?.[0] && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>{userProfile.education[0].degree} • {userProfile.education[0].institution}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                {userProfile?.email && <span>{userProfile.email}</span>}
                {userProfile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{userProfile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {eligibility && (
            <div className="text-right">
              {getStatusIcon(eligibility.status)}
              <div className="text-xs font-medium mt-1">
                {Object.values(eligibility.checklist).filter(v => v).length}/6 Met
              </div>
            </div>
          )}
        </div>

        {/* Compact Progress Bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                eligibility?.status === 'eligible' ? 'bg-green-500' :
                eligibility?.status === 'needs_info' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}
              initial={{ width: 0 }}
              animate={{ 
                width: `${eligibility ? 
                  (Object.values(eligibility.checklist).filter(v => v).length / 6) * 100 : 0}%` 
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Compact Checklist */}
      <div className="p-4 space-y-2">
        {checklistItems.map((item, index) => {
          const isChecked = eligibility?.checklist[item.key as keyof typeof eligibility.checklist];
          const isExpanded = expandedSection === item.key;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg transition-all ${
                isChecked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="w-full p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-md ${
                    isChecked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                    </div>
                    <span className="text-xs text-gray-600">{item.value}</span>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  isChecked ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* Compact Suggestions */}
      {eligibility?.suggestions && eligibility.suggestions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Missing Info</h4>
                <div className="flex flex-wrap gap-1">
                  {eligibility.suggestions.map((suggestion, index) => (
                    <span key={index} className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {suggestion.replace('Upload your ', '').replace('Add your ', '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}