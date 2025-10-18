'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, User, Clock, MapPin, Globe2, Calendar, 
  CheckCircle2, ArrowRight, ArrowLeft, Upload, FileText,
  Sparkles, Award, Code, BookOpen, Plus, X, Languages,
  CreditCard, Building2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { StudentProfile, CourseworkModule, AcademicProject, LanguageProficiency } from '@/lib/types/studentProfile';

interface StudentOnboardingProps {
  onComplete: (profile: Partial<StudentProfile>) => void;
  initialProfile?: Partial<StudentProfile>;
  onSkip?: () => void;
  className?: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  required: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'academic',
    title: 'Academic Background',
    subtitle: 'Your degree, university, and graduation timeline',
    icon: <GraduationCap className="w-6 h-6" />,
    required: true
  },
  {
    id: 'availability',
    title: 'Work Availability',
    subtitle: 'Hours per week, start date, and duration preferences',
    icon: <Clock className="w-6 h-6" />,
    required: true
  },
  {
    id: 'location',
    title: 'Location & Remote',
    subtitle: 'Where you want to work and remote preferences',
    icon: <MapPin className="w-6 h-6" />,
    required: true
  },
  {
    id: 'legal',
    title: 'Legal Status',
    subtitle: 'Visa status and work authorization',
    icon: <CreditCard className="w-6 h-6" />,
    required: true
  },
  {
    id: 'languages',
    title: 'Language Skills',
    subtitle: 'German and English proficiency levels',
    icon: <Languages className="w-6 h-6" />,
    required: false
  },
  {
    id: 'coursework',
    title: 'Relevant Coursework',
    subtitle: 'Modules and courses related to your target roles',
    icon: <BookOpen className="w-6 h-6" />,
    required: false
  },
  {
    id: 'projects',
    title: 'Academic Projects',
    subtitle: 'University projects, assignments, and achievements',
    icon: <Code className="w-6 h-6" />,
    required: false
  }
];

const GERMAN_CITIES = [
  'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 
  'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden',
  'Hannover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld'
];

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const;

export default function StudentOnboarding({ 
  onComplete, 
  initialProfile = {}, 
  onSkip,
  className 
}: StudentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<StudentProfile>>(initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step navigation
  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    }
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const step = ONBOARDING_STEPS[currentStep];
    const newErrors: Record<string, string> = {};

    if (step.required) {
      switch (step.id) {
        case 'academic':
          if (!profile.degree_program) newErrors.degree_program = 'Degree program is required';
          if (!profile.university) newErrors.university = 'University is required';
          if (!profile.expected_graduation) newErrors.expected_graduation = 'Expected graduation is required';
          break;
        case 'availability':
          if (!profile.weekly_availability) newErrors.weekly_availability = 'Weekly availability is required';
          if (!profile.earliest_start_date) newErrors.earliest_start_date = 'Start date is required';
          break;
        case 'location':
          if (!profile.preferred_locations?.length) newErrors.preferred_locations = 'At least one preferred location is required';
          break;
        case 'legal':
          if (!profile.enrollment_status) newErrors.enrollment_status = 'Enrollment status is required';
          break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, profile]);

  const handleComplete = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    try {
      await onComplete(profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
    setErrors({});
  };

  const addCourseworkModule = () => {
    const newModule: CourseworkModule = {
      course_name: '',
      semester: '',
      relevant_topics: [],
      projects: []
    };
    updateProfile({
      relevant_coursework: [...(profile.relevant_coursework || []), newModule]
    });
  };

  const updateCourseworkModule = (index: number, updates: Partial<CourseworkModule>) => {
    const coursework = [...(profile.relevant_coursework || [])];
    coursework[index] = { ...coursework[index], ...updates };
    updateProfile({ relevant_coursework: coursework });
  };

  const removeCourseworkModule = (index: number) => {
    const coursework = [...(profile.relevant_coursework || [])];
    coursework.splice(index, 1);
    updateProfile({ relevant_coursework: coursework });
  };

  const addProject = () => {
    const newProject: AcademicProject = {
      title: '',
      duration: '',
      description: '',
      technologies: [],
      metrics: []
    };
    updateProfile({
      academic_projects: [...(profile.academic_projects || []), newProject]
    });
  };

  const updateProject = (index: number, updates: Partial<AcademicProject>) => {
    const projects = [...(profile.academic_projects || [])];
    projects[index] = { ...projects[index], ...updates };
    updateProfile({ academic_projects: projects });
  };

  const removeProject = (index: number) => {
    const projects = [...(profile.academic_projects || [])];
    projects.splice(index, 1);
    updateProfile({ academic_projects: projects });
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];

    switch (step.id) {
      case 'academic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree_program">Degree Program *</Label>
                <Input
                  id="degree_program"
                  placeholder="e.g., Computer Science, Business Administration"
                  value={profile.degree_program || ''}
                  onChange={(e: any) => updateProfile({ degree_program: e.target.value })}
                  className={errors.degree_program ? 'border-red-500' : ''}
                />
                {errors.degree_program && (
                  <p className="text-sm text-red-600 mt-1">{errors.degree_program}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="university">University *</Label>
                <Input
                  id="university"
                  placeholder="e.g., Technical University of Munich"
                  value={profile.university || ''}
                  onChange={(e: any) => updateProfile({ university: e.target.value })}
                  className={errors.university ? 'border-red-500' : ''}
                />
                {errors.university && (
                  <p className="text-sm text-red-600 mt-1">{errors.university}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_year">Current Year/Semester</Label>
                <select
                  id="current_year"
                  value={profile.current_year || ''}
                  onChange={(e: any) => updateProfile({ current_year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select year</option>
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                  <option value={6}>Master's 1st Year</option>
                  <option value={7}>Master's 2nd Year</option>
                </select>
              </div>

              <div>
                <Label htmlFor="expected_graduation">Expected Graduation *</Label>
                <Input
                  id="expected_graduation"
                  type="month"
                  value={profile.expected_graduation || ''}
                  onChange={(e: any) => updateProfile({ expected_graduation: e.target.value })}
                  className={errors.expected_graduation ? 'border-red-500' : ''}
                />
                {errors.expected_graduation && (
                  <p className="text-sm text-red-600 mt-1">{errors.expected_graduation}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="space-y-6">
            <div>
              <Label>Weekly Availability *</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="hours_min" className="text-sm">Minimum hours/week</Label>
                  <Input
                    id="hours_min"
                    type="number"
                    min="5"
                    max="40"
                    placeholder="15"
                    value={profile.weekly_availability?.hours_min || ''}
                    onChange={(e: any) => updateProfile({
                      weekly_availability: {
                        ...profile.weekly_availability,
                        hours_min: parseInt(e.target.value) || 0,
                        hours_max: profile.weekly_availability?.hours_max || 20,
                        flexible: profile.weekly_availability?.flexible ?? true
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="hours_max" className="text-sm">Maximum hours/week</Label>
                  <Input
                    id="hours_max"
                    type="number"
                    min="5"
                    max="40"
                    placeholder="20"
                    value={profile.weekly_availability?.hours_max || ''}
                    onChange={(e: any) => updateProfile({
                      weekly_availability: {
                        ...profile.weekly_availability,
                        hours_min: profile.weekly_availability?.hours_min || 15,
                        hours_max: parseInt(e.target.value) || 0,
                        flexible: profile.weekly_availability?.flexible ?? true
                      }
                    })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={profile.weekly_availability?.flexible ?? true}
                  onChange={(e: any) => updateProfile({
                    weekly_availability: {
                      hours_min: profile.weekly_availability?.hours_min || 15,
                      hours_max: profile.weekly_availability?.hours_max || 20,
                      flexible: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Flexible with exact hours</span>
              </label>
              {errors.weekly_availability && (
                <p className="text-sm text-red-600 mt-1">{errors.weekly_availability}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Earliest Start Date *</Label>
                <select
                  id="start_date"
                  value={profile.earliest_start_date || ''}
                  onChange={(e: any) => updateProfile({ earliest_start_date: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.earliest_start_date ? 'border-red-500' : ''
                  )}
                >
                  <option value="">Select start date</option>
                  <option value="immediately">Immediately</option>
                  <option value="next_month">Next month</option>
                  <option value="next_semester">Next semester</option>
                  <option value="after_exams">After current exams</option>
                </select>
                {errors.earliest_start_date && (
                  <p className="text-sm text-red-600 mt-1">{errors.earliest_start_date}</p>
                )}
              </div>

              <div>
                <Label>Preferred Duration</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    placeholder="6"
                    value={profile.preferred_duration?.months_min || ''}
                    onChange={(e: any) => updateProfile({
                      preferred_duration: {
                        ...profile.preferred_duration,
                        months_min: parseInt(e.target.value) || 0,
                        months_max: profile.preferred_duration?.months_max || 12,
                        open_ended: profile.preferred_duration?.open_ended ?? false
                      }
                    })}
                  />
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    placeholder="12"
                    value={profile.preferred_duration?.months_max || ''}
                    onChange={(e: any) => updateProfile({
                      preferred_duration: {
                        months_min: profile.preferred_duration?.months_min || 6,
                        months_max: parseInt(e.target.value) || 0,
                        open_ended: profile.preferred_duration?.open_ended ?? false
                      }
                    })}
                  />
                </div>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={profile.preferred_duration?.open_ended ?? false}
                    onChange={(e: any) => updateProfile({
                      preferred_duration: {
                        months_min: profile.preferred_duration?.months_min || 6,
                        months_max: profile.preferred_duration?.months_max || 12,
                        open_ended: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Open to longer-term positions</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div>
              <Label>Preferred Cities *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {GERMAN_CITIES.map(city => (
                  <label key={city} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.preferred_locations?.includes(city) ?? false}
                      onChange={(e: any) => {
                        const current = profile.preferred_locations || [];
                        if (e.target.checked) {
                          updateProfile({ preferred_locations: [...current, city] });
                        } else {
                          updateProfile({ 
                            preferred_locations: current.filter(l => l !== city) 
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{city}</span>
                  </label>
                ))}
              </div>
              {errors.preferred_locations && (
                <p className="text-sm text-red-600 mt-1">{errors.preferred_locations}</p>
              )}
            </div>

            <div>
              <Label>Remote Work Preference</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {[
                  { value: 'onsite_only', label: 'On-site only' },
                  { value: 'hybrid_preferred', label: 'Hybrid preferred' },
                  { value: 'remote_preferred', label: 'Remote preferred' },
                  { value: 'flexible', label: 'Flexible' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="remote_preference"
                      value={option.value}
                      checked={profile.remote_preference === option.value}
                      onChange={(e: any) => updateProfile({ remote_preference: e.target.value as unknown })}
                      className="border-gray-300"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-6">
            <div>
              <Label>Enrollment Status *</Label>
              <div className="space-y-2 mt-2">
                {[
                  { value: 'enrolled', label: 'Currently enrolled' },
                  { value: 'graduating_soon', label: 'Graduating within 6 months' },
                  { value: 'gap_year', label: 'Taking a gap year' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="enrollment_status"
                      value={option.value}
                      checked={profile.enrollment_status === option.value}
                      onChange={(e: any) => updateProfile({ enrollment_status: e.target.value as unknown })}
                      className="border-gray-300"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.enrollment_status && (
                <p className="text-sm text-red-600 mt-1">{errors.enrollment_status}</p>
              )}
            </div>

            <div>
              <Label>Work Authorization</Label>
              <div className="space-y-2 mt-2">
                {[
                  { value: 'eu_citizen', label: 'EU Citizen' },
                  { value: 'student_visa', label: 'Student Visa (work allowed)' },
                  { value: 'work_permit', label: 'Work Permit' },
                  { value: 'needs_sponsorship', label: 'Requires visa sponsorship' }
                ].map(option => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visa_status"
                      value={option.value}
                      checked={profile.visa_status === option.value}
                      onChange={(e: any) => updateProfile({ visa_status: e.target.value as unknown })}
                      className="border-gray-300"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="immatrikulation_proof"
                checked={profile.immatrikulation_proof ?? false}
                onChange={(e: any) => updateProfile({ immatrikulation_proof: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="immatrikulation_proof" className="text-sm">
                I can provide Immatrikulationsbescheinigung (enrollment certificate)
              </Label>
            </div>
          </div>
        );

      case 'languages':
        return (
          <div className="space-y-6">
            <div>
              <Label>Language Proficiencies</Label>
              <p className="text-sm text-gray-600 mt-1">
                German proficiency is crucial for most Werkstudent positions
              </p>
              
              <div className="space-y-4 mt-4">
                {(profile.language_proficiencies || []).map((lang, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <Input
                      placeholder="Language (e.g., German, English)"
                      value={lang.language}
                      onChange={(e: any) => {
                        const languages = [...(profile.language_proficiencies || [])];
                        languages[index].language = e.target.value;
                        updateProfile({ language_proficiencies: languages });
                      }}
                      className="flex-1"
                    />
                    <select
                      value={lang.cefr_level}
                      onChange={(e: any) => {
                        const languages = [...(profile.language_proficiencies || [])];
                        languages[index].cefr_level = e.target.value as unknown;
                        updateProfile({ language_proficiencies: languages });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Level</option>
                      {CEFR_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const languages = [...(profile.language_proficiencies || [])];
                        languages.splice(index, 1);
                        updateProfile({ language_proficiencies: languages });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const newLang: LanguageProficiency = {
                      language: '',
                      cefr_level: 'B1'
                    };
                    updateProfile({
                      language_proficiencies: [...(profile.language_proficiencies || []), newLang]
                    });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </div>
          </div>
        );

      case 'coursework':
        return (
          <div className="space-y-6">
            <div>
              <Label>Relevant Coursework</Label>
              <p className="text-sm text-gray-600 mt-1">
                Add modules and courses that are relevant to your target roles
              </p>

              <div className="space-y-4 mt-4">
                {(profile.relevant_coursework || []).map((course, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Course name (e.g., Database Systems)"
                          value={course.course_name}
                          onChange={(e: any) => updateCourseworkModule(index, { course_name: e.target.value })}
                          className="flex-1 mr-2"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCourseworkModule(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Semester (e.g., WS 2024)"
                          value={course.semester}
                          onChange={(e: any) => updateCourseworkModule(index, { semester: e.target.value })}
                        />
                        <Input
                          placeholder="Grade (optional)"
                          value={course.grade || ''}
                          onChange={(e: any) => updateCourseworkModule(index, { grade: e.target.value })}
                        />
                      </div>

                      <Textarea
                        placeholder="Relevant topics covered (comma-separated)"
                        value={course.relevant_topics?.join(', ') || ''}
                        onChange={(e: any) => updateCourseworkModule(index, { 
                          relevant_topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        })}
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addCourseworkModule}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6">
            <div>
              <Label>Academic Projects</Label>
              <p className="text-sm text-gray-600 mt-1">
                Include university projects, assignments, and personal coding projects
              </p>

              <div className="space-y-4 mt-4">
                {(profile.academic_projects || []).map((project, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Project title"
                          value={project.title}
                          onChange={(e: any) => updateProject(index, { title: e.target.value })}
                          className="flex-1 mr-2"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Duration (e.g., 3 months)"
                          value={project.duration}
                          onChange={(e: any) => updateProject(index, { duration: e.target.value })}
                        />
                        <Input
                          placeholder="Team size (optional)"
                          type="number"
                          value={project.team_size || ''}
                          onChange={(e: any) => updateProject(index, { 
                            team_size: e.target.value ? parseInt(e.target.value) : undefined 
                          })}
                        />
                      </div>

                      <Textarea
                        placeholder="Project description"
                        value={project.description}
                        onChange={(e: any) => updateProject(index, { description: e.target.value })}
                        rows={3}
                      />

                      <Textarea
                        placeholder="Technologies used (comma-separated)"
                        value={project.technologies?.join(', ') || ''}
                        onChange={(e: any) => updateProject(index, { 
                          technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        })}
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addProject}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100 mb-4"
        >
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Student Profile Setup</span>
        </motion.div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Werkstudent Profile
        </h1>
        <p className="text-gray-600">
          Help us match you with the perfect working student positions in Germany
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto">
        <div className="flex items-center gap-4">
          {ONBOARDING_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  index === currentStep
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : index < currentStep
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                )}
                whileHover={{ scale: 1.05 }}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                  index === currentStep
                    ? "bg-blue-500 text-white"
                    : index < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                )}>
                  {index < currentStep ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:inline">
                  {step.title}
                </span>
                {step.required && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </motion.div>
              {index < ONBOARDING_STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="p-8 mb-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              {ONBOARDING_STEPS[currentStep].icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {ONBOARDING_STEPS[currentStep].title}
                {ONBOARDING_STEPS[currentStep].required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h2>
              <p className="text-gray-600 text-sm">
                {ONBOARDING_STEPS[currentStep].subtitle}
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-gray-600"
            >
              Skip Setup
            </Button>
          )}

          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Complete Setup
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}