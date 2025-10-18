import { NextRequest, NextResponse } from 'next/server';
import type { ResumeData } from '@/lib/types';
import { convertLegacySkills, migrateSkillsStructure } from '@/lib/skillsCategorizor';
import { generateSwissResumeHTML } from '@/templates/swiss';
import { generateClassicResumeHTML } from '@/templates/classic';
import { generateProfessionalResumeHTML } from '@/templates/professional';
import { generateImpactResumeHTML } from '@/templates/impact';
import { llmService } from '@/lib/services/llmService';

// Intelligent proficiency categorization function
function shouldCategoryHaveProficiency(categoryName: string): boolean {
  if (!categoryName || typeof categoryName !== 'string') {
    console.warn('⚠️ shouldCategoryHaveProficiency called with invalid categoryName:', categoryName);
    return false;
  }
  
  const lowerName = categoryName.toLowerCase()
  
  // EXPLICIT EXCLUSIONS - Categories that should NEVER have proficiency
  const exclusions = [
    'soft', 'communication', 'leadership', 'management', 'interpersonal', 'personal',
    'project', 'business', 'strategy', 'stakeholder', 'change', 'agile', 'scrum',
    'lean', 'kanban', 'waterfall', 'methodology', 'process', 'team', 'collaboration',
    'planning', 'organization', 'coordination', 'negotiation', 'presentation',
    'client', 'customer', 'sales', 'marketing', 'relations', 'networking'
  ]
  
  // Check if category should be excluded
  for (const exclusion of exclusions) {
    if (lowerName.includes(exclusion)) {
      return false
    }
  }
  
  // EXPLICIT INCLUSIONS - Categories that should HAVE proficiency
  const inclusions = [
    'technical', 'programming', 'development', 'coding', 'software', 'framework',
    'database', 'cloud', 'devops', 'automation', 'tool', 'platform', 'system',
    'frontend', 'backend', 'fullstack', 'mobile', 'web', 'api', 'server',
    'language', 'javascript', 'python', 'java', 'react', 'node', 'sql',
    'aws', 'azure', 'docker', 'kubernetes', 'git', 'ci/cd', 'testing',
    'figma', 'photoshop', 'illustrator', 'sketch', 'adobe', 'design software'
  ]
  
  // Check if category should be included
  for (const inclusion of inclusions) {
    if (lowerName.includes(inclusion)) {
      return true
    }
  }
  
  // Special case: Design categories
  if (lowerName.includes('design')) {
    // Only allow proficiency for tool-based design categories
    const designTools = ['ui/ux', 'graphic', 'web design', 'app design', 'interface']
    for (const tool of designTools) {
      if (lowerName.includes(tool)) {
        return true
      }
    }
    return false // General design concepts don't need proficiency
  }
  
  // Default: no proficiency for uncategorized items
  return false
}

const canonicalizePlanKey = (value?: string | null) => {
  if (!value) return '';
  return value.toString().toLowerCase().trim()
    .replace(/\s*(&|and)\s*/g, '___')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

const humanizePlanKey = (key: string) => {
  if (!key) return 'New Category';
  return key
    .replace(/___/g, ' & ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizePlanSkillEntry = (skill: unknown) => {
  if (!skill) {
    return {
      name: '',
      status: 'keep',
      rationale: '',
      source: 'resume',
      proficiency: null,
      confidence: null
    };
  }

  if (typeof skill === 'object') {
    const skillData = skill as Record<string, unknown>;
    return {
      name: String(skillData.name || skillData.skill || ''),
      status: String(skillData.status || 'keep'),
      rationale: String(skillData.rationale || ''),
      source: String(skillData.source || 'resume'),
      proficiency: skillData.proficiency ?? null,
      confidence: skillData.confidence ?? null
    };
  }

  return {
    name: String(skill),
    status: 'keep',
    rationale: '',
    source: 'resume',
    proficiency: null,
    confidence: null
  };
};

const buildSkillsFromPlan = (
  plan: unknown,
  existingSkills: Record<string, unknown> = {},
  showSkillLevelsInResume: boolean,
  languages: any[] = []
) => {
  const planData = plan as Record<string, unknown> | null;
  const categories = planData?.categories as unknown[] | undefined;

  if (!planData || !Array.isArray(categories)) {
    return { skillsMap: null as Record<string, unknown[]> | null, canonicalSet: new Set<string>() };
  }

  const skillsMap: Record<string, unknown[]> = {};
  const canonicalSet = new Set<string>();

  categories
    .slice()
    .sort((a: unknown, b: unknown) => {
      const aData = a as Record<string, unknown> | undefined;
      const bData = b as Record<string, unknown> | undefined;
      const aPriority = typeof aData?.priority === 'number' ? aData.priority : 999;
      const bPriority = typeof bData?.priority === 'number' ? bData.priority : 999;
      return aPriority - bPriority;
    })
    .forEach(category => {
      const categoryData = category as Record<string, unknown> | undefined;
      const canonical = canonicalizePlanKey((categoryData?.canonical_key as string | undefined) || (categoryData?.display_name as string | undefined));
      if (!canonical) return;

      canonicalSet.add(canonical);

      const displayName = (() => {
        const displayNameValue = categoryData?.display_name;
        const raw = typeof displayNameValue === 'string' ? displayNameValue.trim() : '';
        if (!raw) return humanizePlanKey(canonical);
        if (raw.includes('_') || raw === raw.toLowerCase()) {
          return humanizePlanKey(canonical);
        }
        return raw;
      })();

      const skills = categoryData?.skills as unknown[] | undefined;
      const normalizedEntries = Array.isArray(skills)
        ? skills
            .map(entry => normalizePlanSkillEntry(entry))
            .filter(entry => {
              const entryData = entry as Record<string, unknown> | undefined;
              if (!entryData?.name) return false;
              const status = String(entryData?.status || '').toLowerCase();
              // Only include skills that are 'keep' or 'accepted', not 'add', 'promote', or 'remove'
              return status === 'keep' || status === 'accepted';
            })
        : [];

      const deduped: any[] = [];
      const seen = new Set<string>();

      normalizedEntries.forEach((entry: Record<string, any>) => {
        const entryData = entry as Record<string, unknown> | undefined;
        if (!entryData) return;

        const nameValue = entryData.name;
        const key = typeof nameValue === 'string' ? nameValue.toLowerCase() : '';
        if (!key || seen.has(key)) return;
        seen.add(key);

        if (showSkillLevelsInResume && entryData.proficiency) {
          deduped.push({ skill: entryData.name, proficiency: entryData.proficiency });
        } else {
          deduped.push(entryData.name);
        }
      });

      // Fallback: merge any matching skills from the existing snapshot when plan omits explicit entries
      if (deduped.length === 0 && Array.isArray(existingSkills[canonical])) {
        console.log(`📥 Using fallback skills for category ${canonical}:`, existingSkills[canonical])
        const fallbackList = existingSkills[canonical]
          .map(entry => {
            if (typeof entry === 'string') return entry;
            const entryData = entry as Record<string, unknown> | undefined;
            if (showSkillLevelsInResume && entryData?.proficiency) {
              return { skill: entryData.skill || entryData.name, proficiency: entryData.proficiency };
            }
            return entryData?.skill || entryData?.name || entry;
          })
          .filter(Boolean);

        // Deduplicate fallback skills to prevent multiple entries
        const fallbackSeen = new Set<string>();
        const uniqueFallback = fallbackList.filter(skill => {
          const skillData = skill as Record<string, unknown> | string;
          const key = typeof skillData === 'string' ? skillData.toLowerCase() : String(skillData.skill || '').toLowerCase();
          if (!key || fallbackSeen.has(key)) return false;
          fallbackSeen.add(key);
          return true;
        });

        deduped.push(...uniqueFallback);
      }

      if (deduped.length > 0) {
        skillsMap[displayName] = deduped;
      }
    });

  // REMOVED: Languages should NOT be added to skills map
  // Languages are displayed in a separate dedicated section in templates
  // Adding them here causes duplication

  return { skillsMap, canonicalSet };
};


export async function POST(request: NextRequest) {
  try {
    const { resumeData, template = 'swiss', userProfile, showSkillLevelsInResume = false } = await request.json();

    if (!resumeData) {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
    }

    // Minimal observability: track proficiency toggle and template only
    // console.debug('preview: skillLevels=', showSkillLevelsInResume, 'template=', template)
    const resumeDataTyped = resumeData as Record<string, unknown>;
    console.log('📸 PREVIEW API: Received resumeData.photoUrl =', resumeDataTyped.photoUrl);

    // Format the resume data exactly like CLI (now with GPT education formatting)
    const templateData = await formatResumeDataForTemplate(resumeData, userProfile, showSkillLevelsInResume);
    const templateDataTyped = templateData as Record<string, unknown>;
    console.log('📸 PREVIEW API: templateData.photoUrl =', templateDataTyped.photoUrl);

    // Generate HTML using the same direct approach as CLI
    let html = '';
    const templateDataForGeneration = templateData as ResumeData & { showSkillLevelsInResume?: boolean };
    switch (template) {
      case 'swiss':
        html = generateSwissResumeHTML(templateDataForGeneration);
        break;
      case 'classic':
        html = generateClassicResumeHTML(templateDataForGeneration);
        break;
      case 'professional':
        html = generateProfessionalResumeHTML(templateDataForGeneration);
        break;
      case 'impact':
        html = generateImpactResumeHTML(templateDataForGeneration);
        break;
      default:
        html = generateSwissResumeHTML(templateDataForGeneration);
    }

    // console.debug('preview: html_length=', html.length)

    // Defensive sanitize: strip any script tags before returning
    // Sanitize: strip scripts, inline handlers, and javascript: URLs
    let sanitizedHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove inline event handlers like onload="..."
    sanitizedHtml = sanitizedHtml.replace(/\son[a-zA-Z]+\s*=\s*"[^"]*"/g, '')
    sanitizedHtml = sanitizedHtml.replace(/\son[a-zA-Z]+\s*=\s*'[^']*'/g, '')
    // Neutralize javascript: URLs
    sanitizedHtml = sanitizedHtml.replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"')
    sanitizedHtml = sanitizedHtml.replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'")
    return NextResponse.json({ 
      success: true,
      html: sanitizedHtml,
      template 
    });

  } catch (error) {
    console.error('Resume preview generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate resume preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}


async function formatResumeDataForTemplate(resumeData: ResumeData, userProfile?: unknown, showSkillLevelsInResume: boolean = false): Promise<unknown> {
  // Cast resumeData for property access
  const resumeDataTyped = resumeData as unknown as Record<string, unknown>;

  // Defensive: ensure skills exists to avoid crashes and disappearing sections
  if (!resumeData.skills || typeof resumeData.skills !== 'object') {
    resumeDataTyped.skills = {};
  }

  const resumeSkills = resumeDataTyped.skills as Record<string, unknown[]> | undefined;

  // SIMPLIFIED: Use only legacy skills format as single source of truth
  const skills: { [key: string]: any[] } = {};

  const processSkillArray = (skillArray: any[], categoryName: string) => {
    const shouldHaveProficiency = showSkillLevelsInResume && shouldCategoryHaveProficiency(categoryName);

    if (!shouldHaveProficiency) {
      return skillArray.map(skill => {
        if (typeof skill === 'string') return skill;
        const skillData = skill as Record<string, unknown>;
        return skillData.skill || skill;
      });
    }

    return skillArray.map(skill => {
      if (typeof skill === 'string') {
        return { skill, proficiency: 'Intermediate' };
      }
      const skillData = skill as Record<string, unknown>;
      if (skillData.skill) {
        return skill;
      }
      return { skill: skill.toString(), proficiency: 'Intermediate' };
    });
  };

  // Process ALL skills from resumeData.skills - SIMPLE AND CONSISTENT
  if (resumeSkills?.core?.length) skills['Core Skills'] = processSkillArray(resumeSkills.core as any[], 'Core Skills');
  if (resumeSkills?.technical?.length) skills['Technical & Digital'] = processSkillArray(resumeSkills.technical as any[], 'Technical & Digital');
  if (resumeSkills?.creative?.length) skills['Creative & Design'] = processSkillArray(resumeSkills.creative as any[], 'Creative & Design');
  if (resumeSkills?.business?.length) skills['Business & Strategy'] = processSkillArray(resumeSkills.business as any[], 'Business & Strategy');
  if (resumeSkills?.interpersonal?.length) skills['Communication & Leadership'] = processSkillArray(resumeSkills.interpersonal as any[], 'Communication & Leadership');
  if (resumeSkills?.specialized?.length) skills['Specialized'] = processSkillArray(resumeSkills.specialized as any[], 'Specialized');

  if (resumeSkills?.tools?.length) {
    const processedTools = processSkillArray(resumeSkills.tools as any[], 'Tools');
    if (skills['Technical & Digital']) {
      skills['Technical & Digital'].push(...processedTools);
    } else {
      skills['Tools & Platforms'] = processedTools;
    }
  }
  if (resumeSkills?.soft_skills?.length) {
    const processedSoftSkills = processSkillArray(resumeSkills.soft_skills as any[], 'Soft Skills');
    if (skills['Communication & Leadership']) {
      skills['Communication & Leadership'].push(...processedSoftSkills);
    } else {
      skills['Soft Skills'] = processedSoftSkills;
    }
  }

  const knownCategories = new Set(['core', 'technical', 'creative', 'business', 'interpersonal', 'languages', 'specialized', 'tools', 'soft_skills']);

  // Process any custom categories (this handles AI-generated categories that made it into resumeData.skills)
  // Sort entries to ensure consistent order between editor and preview
  const customEntries = resumeSkills ? Object.entries(resumeSkills)
    .filter(([categoryKey, skillArray]) => {
      if (knownCategories.has(categoryKey) || !Array.isArray(skillArray) || skillArray.length === 0) {
        return false;
      }
      // Skip language categories - they are displayed in a separate Languages section
      if (categoryKey.toLowerCase().includes('language')) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a[0].localeCompare(b[0])) : []; // Sort alphabetically by category key

  customEntries.forEach(([categoryKey, skillArray]) => {
    const displayName = categoryKey
      .replace(/___/g, ' & ')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    skills[displayName] = processSkillArray(skillArray as unknown[], displayName);
  });

  // Minimal: keep templates clean

  return {
    personalInfo: {
      name: resumeData.personalInfo.name,
      email: resumeData.personalInfo.email,
      phone: resumeData.personalInfo.phone,
      location: resumeData.personalInfo.location,
      linkedin: resumeData.personalInfo.linkedin,
      website: resumeData.personalInfo.website,
      customHeader: resumeData.personalInfo.customHeader
    },
    professionalTitle: resumeData.professionalTitle,
    professionalSummary: resumeData.professionalSummary,
    enableProfessionalSummary: resumeData.enableProfessionalSummary !== undefined ? resumeData.enableProfessionalSummary : false,
    skills,
    experience: (resumeData.experience || []).map(exp => {
      const item = exp as Record<string, unknown>;
      return {
        position: item.position,
        company: item.company,
        duration: item.duration || (item.startDate && item.endDate ? `${item.startDate} - ${item.endDate}` : item.startDate || item.endDate || ''),
        achievements: item.achievements || []
      };
    }),
    education: (resumeData.education || []).map(edu => {
      const item = edu as Record<string, unknown>;
      return {
        degree: item.degree || '',
        field_of_study: item.field_of_study || item.field || '',
        institution: item.institution || '',
        year: item.year || item.duration || ''
      };
    }),
    projects: resumeData.projects?.map(project => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies || [],
      date: project.date
    })) || [],
    certifications: resumeData.certifications?.filter(cert => 
      cert.name?.trim() || cert.issuer?.trim() || cert.date?.trim()
    ).map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date
    })) || [],
    customSections: resumeData.customSections?.filter(rawSection => {
      const section = rawSection as Record<string, unknown>;
      const items = section.items as unknown[] | undefined;
      return section.title && String(section.title).trim() && items?.some(rawItem => {
        const item = rawItem as Record<string, unknown>;
        return (
          (item.field1 && String(item.field1).trim()) ||
          (item.field2 && String(item.field2).trim()) ||
          (item.field3 && String(item.field3).trim()) ||
          (item.field4 && String(item.field4).trim()) ||
          (item.title && String(item.title).trim()) ||
          (item.description && String(item.description).trim()) ||
          (item.subtitle && String(item.subtitle).trim())
        );
      });
    }).map(rawSection => {
      const section = rawSection as Record<string, unknown>;
      const sectionItems = section.items as unknown[] | undefined;
      return {
        id: section.id,
        title: section.title,
        type: section.type,
        items: sectionItems?.filter(rawItem => {
          const item = rawItem as Record<string, unknown>;
          return (
            (item.field1 && String(item.field1).trim()) ||
            (item.field2 && String(item.field2).trim()) ||
            (item.field3 && String(item.field3).trim()) ||
            (item.field4 && String(item.field4).trim()) ||
            (item.title && String(item.title).trim()) ||
            (item.description && String(item.description).trim()) ||
            (item.subtitle && String(item.subtitle).trim())
          );
        }).map(rawItem => {
          const item = rawItem as Record<string, unknown>;
          return {
            field1: item.field1 || item.title || '',
            field2: item.field2 || item.subtitle || '',
            field3: item.field3 || item.date || '',
            field4: item.field4 || item.description || '',
            title: item.title || item.field1 || '',
            subtitle: item.subtitle || item.field2 || '',
            date: item.date || item.field3 || '',
            description: item.description || item.field4 || ''
          };
        }) || []
      };
    }) || [],
    // Languages come from the top-level languages field (NOT from skills)
    languages: resumeDataTyped.languages || [],
    photoUrl: resumeDataTyped.photoUrl || null,
    showSkillLevelsInResume: showSkillLevelsInResume // Pass skill level toggle to templates
  };
}
