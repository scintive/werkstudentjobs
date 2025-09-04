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

    console.log('🎯 API: PROFICIENCY DEBUG - showSkillLevelsInResume:', showSkillLevelsInResume);
    console.log('API: Received request for template:', template);
    console.log('API: Resume data keys:', Object.keys(resumeData));
    console.log('API: Raw skills data:', JSON.stringify(resumeData.skills, null, 2));
    console.log('API: Raw experience count:', resumeData.experience?.length || 0);
    console.log('API: Raw experience sample:', JSON.stringify(resumeData.experience?.[0], null, 2));
    console.log('API: Raw certifications count:', resumeData.certifications?.length || 0);

    // Format the resume data exactly like CLI (now with GPT education formatting)
    const templateData = await formatResumeDataForTemplate(resumeData, userProfile, showSkillLevelsInResume);
    console.log('API: Formatted template data keys:', Object.keys(templateData));
    console.log('API: Personal info:', templateData.personalInfo);
    console.log('API: Formatted skills:', JSON.stringify(templateData.skills, null, 2));
    console.log('API: Formatted certifications:', JSON.stringify(templateData.certifications, null, 2));
    console.log('API: Formatted custom sections:', JSON.stringify(templateData.customSections, null, 2));

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

    console.log('API: Generated HTML length:', html.length);
    console.log('API: HTML preview (first 500 chars):', html.substring(0, 500));

    return NextResponse.json({ 
      success: true,
      html,
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
  // Format skills - support both legacy and new universal categories
  // When showSkillLevelsInResume is true, preserve skill objects with proficiency
  const skills: { [key: string]: any[] } = {};
  
  // Helper function to process skills based on proficiency toggle and intelligent categorization
  const processSkillArray = (skillArray: any[], categoryName: string) => {
    console.log('🔧 processSkillArray called with:', { 
      categoryName,
      showSkillLevelsInResume, 
      skillArraySample: skillArray.slice(0, 3),
      skillArrayLength: skillArray.length 
    });
    
    // Use intelligent categorization to determine if this category should have proficiency
    const shouldHaveProficiency = showSkillLevelsInResume && shouldCategoryHaveProficiency(categoryName);
    console.log(`🔧 Category "${categoryName}" should have proficiency:`, shouldHaveProficiency);
    
    if (!shouldHaveProficiency) {
      // Return as strings when proficiency is disabled or category shouldn't have proficiency
      const result = skillArray.map(skill => typeof skill === 'string' ? skill : skill.skill || skill);
      console.log('🔧 Returning strings:', result.slice(0, 3));
      return result;
    } else {
      // Convert to skill objects with proficiency when enabled AND category supports it
      const result = skillArray.map(skill => {
        if (typeof skill === 'string') {
          return { skill, proficiency: 'Intermediate' }; // Default proficiency
        } else if (skill.skill) {
          return skill; // Already a skill object
        } else {
          return { skill: skill.toString(), proficiency: 'Intermediate' };
        }
      });
      console.log('🔧 Returning skill objects with proficiency:', result.slice(0, 3));
      return result;
    }
  };

  // Handle new universal categories
  if (resumeData.skills.core?.length) skills['Core Skills'] = processSkillArray(resumeData.skills.core, 'Core Skills');
  if (resumeData.skills.technical?.length) skills['Technical & Digital'] = processSkillArray(resumeData.skills.technical, 'Technical & Digital');
  if (resumeData.skills.creative?.length) skills['Creative & Design'] = processSkillArray(resumeData.skills.creative, 'Creative & Design');
  if (resumeData.skills.business?.length) skills['Business & Strategy'] = processSkillArray(resumeData.skills.business, 'Business & Strategy');
  if (resumeData.skills.interpersonal?.length) skills['Communication & Leadership'] = processSkillArray(resumeData.skills.interpersonal, 'Communication & Leadership');
  // REMOVED: Languages are now handled separately, not in skills
  if (resumeData.skills.specialized?.length) skills['Specialized'] = processSkillArray(resumeData.skills.specialized, 'Specialized');
  
  // Backward compatibility - handle legacy categories
  if (resumeData.skills.tools?.length) {
    // Merge tools into Technical & Digital if it exists, otherwise create separate category
    const processedTools = processSkillArray(resumeData.skills.tools, 'Tools');
    if (skills['Technical & Digital']) {
      skills['Technical & Digital'].push(...processedTools);
    } else {
      skills['Tools & Platforms'] = processedTools;
    }
  }
  if (resumeData.skills.soft_skills?.length) {
    // Merge soft_skills into Communication & Leadership if it exists, otherwise create separate category
    const processedSoftSkills = processSkillArray(resumeData.skills.soft_skills, 'Soft Skills');
    if (skills['Communication & Leadership']) {
      skills['Communication & Leadership'].push(...processedSoftSkills);
    } else {
      skills['Soft Skills'] = processedSoftSkills;
    }
  }

  // INTELLIGENT SKILLS SYSTEM: Handle dynamic categories created by GPT
  // These categories have keys like "client_relations___communication" and proper display names
  const knownCategories = new Set(['core', 'technical', 'creative', 'business', 'interpersonal', 'languages', 'specialized', 'tools', 'soft_skills']);
  
  Object.entries(resumeData.skills).forEach(([categoryKey, skillArray]) => {
    // Skip if it's a known/handled category or if it's empty
    if (knownCategories.has(categoryKey) || !Array.isArray(skillArray) || skillArray.length === 0) {
      return;
    }
    
    // Convert underscore-separated keys to proper display names
    // e.g., "client_relations___communication" -> "Client Relations & Communication"
    // e.g., "technical_proficiency" -> "Technical Proficiency"
    const displayName = categoryKey
      .replace(/___/g, ' & ')  // Triple underscores become " & "
      .split('_')              // Split on remaining single underscores
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(' ');              // Join with spaces
    
    skills[displayName] = processSkillArray(skillArray, displayName);
  });

  console.log('🎯 FINAL PROCESSED SKILLS:', JSON.stringify(skills, null, 2));
  console.log('🎯 showSkillLevelsInResume passed to templates:', showSkillLevelsInResume);

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
    experience: resumeData.experience.map(exp => ({
      position: exp.position,
      company: exp.company,
      duration: exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate || exp.endDate || ''),
      achievements: exp.achievements || []
    })),
    education: resumeData.education.map(edu => ({
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
    languages: userProfile?.languages || [], // Pass languages separately from userProfile
    showSkillLevelsInResume: showSkillLevelsInResume // Pass skill level toggle to templates
  };
}
