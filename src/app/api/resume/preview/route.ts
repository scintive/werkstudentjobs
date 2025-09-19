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

export async function POST(request: NextRequest) {
  try {
    const { resumeData, template = 'swiss', userProfile, showSkillLevelsInResume = false } = await request.json();

    if (!resumeData) {
      return NextResponse.json({ error: 'Resume data is required' }, { status: 400 });
    }

    // Minimal observability: track proficiency toggle and template only
    // console.debug('preview: skillLevels=', showSkillLevelsInResume, 'template=', template)

    // Format the resume data exactly like CLI (now with GPT education formatting)
    const templateData = await formatResumeDataForTemplate(resumeData, userProfile, showSkillLevelsInResume);

    // Generate HTML using the same direct approach as CLI
    let html = '';
    switch (template) {
      case 'swiss':
        html = generateSwissResumeHTML(templateData);
        break;
      case 'classic':
        html = generateClassicResumeHTML(templateData);
        break;
      case 'professional':
        html = generateProfessionalResumeHTML(templateData);
        break;
      case 'impact':
        html = generateImpactResumeHTML(templateData);
        break;
      default:
        html = generateSwissResumeHTML(templateData);
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


async function formatResumeDataForTemplate(resumeData: ResumeData, userProfile?: any, showSkillLevelsInResume: boolean = false): Promise<any> {
  // Defensive: ensure skills exists to avoid crashes and disappearing sections
  if (!resumeData.skills || typeof resumeData.skills !== 'object') {
    (resumeData as any).skills = {};
  }
  // Format skills - support both legacy and new universal categories
  // When showSkillLevelsInResume is true, preserve skill objects with proficiency
  const skills: { [key: string]: any[] } = {};
  
  // Helper function to process skills based on proficiency toggle and intelligent categorization
  const processSkillArray = (skillArray: any[], categoryName: string) => {
    // Determine if this category should have proficiency
    const shouldHaveProficiency = showSkillLevelsInResume && shouldCategoryHaveProficiency(categoryName);
    
    if (!shouldHaveProficiency) {
      // Return as strings when proficiency is disabled or category shouldn't have proficiency
      const result = skillArray.map(skill => typeof skill === 'string' ? skill : (skill as any).skill || skill);
      return result;
    } else {
      // Convert to skill objects with proficiency when enabled AND category supports it
      const result = skillArray.map(skill => {
        if (typeof skill === 'string') {
          return { skill, proficiency: 'Intermediate' }; // Default proficiency
        } else if ((skill as any).skill) {
          return skill; // Already a skill object
        } else {
          return { skill: skill.toString(), proficiency: 'Intermediate' };
        }
      });
      return result;
    }
  };

  // Handle new universal categories
  if ((resumeData as any).skills.core?.length) skills['Core Skills'] = processSkillArray((resumeData as any).skills.core, 'Core Skills');
  if ((resumeData as any).skills.technical?.length) skills['Technical & Digital'] = processSkillArray((resumeData as any).skills.technical, 'Technical & Digital');
  if ((resumeData as any).skills.creative?.length) skills['Creative & Design'] = processSkillArray((resumeData as any).skills.creative, 'Creative & Design');
  if ((resumeData as any).skills.business?.length) skills['Business & Strategy'] = processSkillArray((resumeData as any).skills.business, 'Business & Strategy');
  if ((resumeData as any).skills.interpersonal?.length) skills['Communication & Leadership'] = processSkillArray((resumeData as any).skills.interpersonal, 'Communication & Leadership');
  // REMOVED: Languages are now handled separately, not in skills
  if ((resumeData as any).skills.specialized?.length) skills['Specialized'] = processSkillArray((resumeData as any).skills.specialized, 'Specialized');

  // Backward compatibility - handle legacy categories
  if ((resumeData as any).skills.tools?.length) {
    // Merge tools into Technical & Digital if it exists, otherwise create separate category
    const processedTools = processSkillArray((resumeData as any).skills.tools, 'Tools');
    if (skills['Technical & Digital']) {
      skills['Technical & Digital'].push(...processedTools);
    } else {
      skills['Tools & Platforms'] = processedTools;
    }
  }
  if ((resumeData as any).skills.soft_skills?.length) {
    // Merge soft_skills into Communication & Leadership if it exists, otherwise create separate category
    const processedSoftSkills = processSkillArray((resumeData as any).skills.soft_skills, 'Soft Skills');
    if (skills['Communication & Leadership']) {
      skills['Communication & Leadership'].push(...processedSoftSkills);
    } else {
      skills['Soft Skills'] = processedSoftSkills;
    }
  }

  // INTELLIGENT SKILLS SYSTEM: Handle dynamic categories created by GPT
  // These categories have keys like "client_relations___communication" and proper display names
  const knownCategories = new Set(['core', 'technical', 'creative', 'business', 'interpersonal', 'languages', 'specialized', 'tools', 'soft_skills']);
  
  Object.entries((resumeData as any).skills).forEach(([categoryKey, skillArray]) => {
    // Skip if it's a known/handled category or if it's empty
    if (knownCategories.has(categoryKey) || !Array.isArray(skillArray) || skillArray.length === 0) {
      return;
    }
    
    // Convert underscore-separated keys to proper display names
    const displayName = categoryKey
      .replace(/___/g, ' & ')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    skills[displayName] = processSkillArray(skillArray as any[], displayName);
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
    experience: (resumeData.experience || []).map(exp => ({
      position: exp.position,
      company: exp.company,
      duration: exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate || exp.endDate || ''),
      achievements: exp.achievements || []
    })),
    education: (resumeData.education || []).map(edu => ({
      degree: edu.degree || '',
      field_of_study: edu.field_of_study || edu.field || '',
      institution: edu.institution || '',
      year: edu.year || edu.duration || ''
    })),
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
    customSections: resumeData.customSections?.filter(section => 
      section.title?.trim() && section.items?.some(item => 
        item.field1?.trim() || item.field2?.trim() || item.field3?.trim() || item.field4?.trim() ||
        item.title?.trim() || item.description?.trim() || item.subtitle?.trim()
      )
    ).map(section => ({
      id: section.id,
      title: section.title,
      type: section.type,
      items: section.items?.filter(item => 
        item.field1?.trim() || item.field2?.trim() || item.field3?.trim() || item.field4?.trim() ||
        item.title?.trim() || item.description?.trim() || item.subtitle?.trim()
      ).map(item => ({
        field1: item.field1 || item.title || '',
        field2: item.field2 || item.subtitle || '',
        field3: item.field3 || item.date || '',
        field4: item.field4 || item.description || '',
        title: item.title || item.field1 || '',
        subtitle: item.subtitle || item.field2 || '',
        date: item.date || item.field3 || '',
        description: item.description || item.field4 || ''
      })) || []
    })) || [],
    // Prefer explicit resume data languages if present; otherwise fall back to userProfile
    languages: (resumeData as any).languages?.length ? (resumeData as any).languages : (userProfile?.languages || []),
    showSkillLevelsInResume: showSkillLevelsInResume // Pass skill level toggle to templates
  };
}
