// Enhanced AI-Powered Skills Categorization System
// Provides granular subcategories and intelligent skill suggestions

export interface EnhancedSkillCategories {
  // Programming & Development
  programming_languages?: string[];
  web_technologies?: string[];
  frameworks_libraries?: string[];
  databases?: string[];
  cloud_platforms?: string[];
  dev_tools?: string[];
  
  // Design & Creative
  ui_ux_design?: string[];
  graphic_design?: string[];
  multimedia_production?: string[];
  content_creation?: string[];
  
  // Business & Strategy
  project_management?: string[];
  business_analysis?: string[];
  marketing_sales?: string[];
  finance_accounting?: string[];
  
  // Leadership & Management
  team_leadership?: string[];
  strategic_planning?: string[];
  operations_management?: string[];
  
  // Communication & Soft Skills
  communication?: string[];
  problem_solving?: string[];
  collaboration?: string[];
  adaptability?: string[];
  
  // Industry Specific
  domain_expertise?: string[];
  certifications?: string[];
  regulatory_compliance?: string[];
  
  // Languages
  spoken_languages?: string[];
  
  // Other/Custom
  [key: string]: string[] | undefined;
}

// Comprehensive skill mappings for intelligent categorization
const ENHANCED_SKILL_MAPPINGS = {
  // Programming & Development
  programming_languages: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'lua', 'dart', 'elixir', 'haskell',
    'clojure', 'f#', 'objective-c', 'assembly', 'cobol', 'fortran', 'julia', 'erlang'
  ],
  
  web_technologies: [
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'stylus', 'tailwind css', 'tailwind',
    'bootstrap', 'bulma', 'foundation', 'semantic ui', 'material ui', 'chakra ui', 'ant design',
    'webpack', 'vite', 'parcel', 'rollup', 'gulp', 'grunt', 'babel', 'eslint', 'prettier',
    'responsive design', 'mobile-first', 'accessibility', 'wcag', 'seo', 'sem', 'web analytics'
  ],
  
  frameworks_libraries: [
    'react', 'vue', 'angular', 'svelte', 'ember', 'backbone', 'jquery', 'lodash', 'underscore',
    'next.js', 'nextjs', 'nuxt', 'gatsby', 'remix', 'sveltekit', 'astro',
    'node.js', 'nodejs', 'express', 'fastify', 'koa', 'nestjs', 'hapi',
    'spring', 'spring boot', 'django', 'flask', 'fastapi', 'laravel', 'symfony', 'rails',
    'asp.net', '.net core', 'entity framework', 'hibernate', 'sequelize', 'prisma', 'typeorm'
  ],
  
  databases: [
    'mysql', 'postgresql', 'sqlite', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'dynamodb', 'firebase', 'supabase', 'neo4j', 'influxdb', 'couchdb', 'oracle',
    'sql server', 'mariadb', 'amazon rds', 'google cloud sql', 'azure sql'
  ],
  
  cloud_platforms: [
    'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud platform',
    'heroku', 'netlify', 'vercel', 'digitalocean', 'linode', 'vultr', 'cloudflare',
    'docker', 'kubernetes', 'helm', 'terraform', 'ansible', 'jenkins', 'gitlab ci',
    'github actions', 'travis ci', 'circleci', 'devops', 'ci/cd', 'infrastructure as code'
  ],
  
  dev_tools: [
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
    'vscode', 'webstorm', 'intellij', 'eclipse', 'sublime text', 'atom', 'vim', 'emacs',
    'postman', 'insomnia', 'swagger', 'openapi', 'graphql playground',
    'jest', 'cypress', 'selenium', 'playwright', 'testing library', 'mocha', 'chai',
    'jira', 'confluence', 'trello', 'asana', 'monday.com', 'notion', 'linear'
  ],
  
  // Design & Creative
  ui_ux_design: [
    'ui design', 'ux design', 'user experience', 'user interface', 'wireframing', 'prototyping',
    'user research', 'usability testing', 'design thinking', 'information architecture',
    'interaction design', 'visual design', 'design systems', 'accessibility design',
    'mobile design', 'responsive design', 'figma', 'sketch', 'adobe xd', 'invision',
    'framer', 'principle', 'origami', 'zeplin', 'marvel', 'balsamiq'
  ],
  
  graphic_design: [
    'graphic design', 'logo design', 'brand identity', 'branding', 'visual identity',
    'print design', 'packaging design', 'poster design', 'brochure design', 'book design',
    'magazine layout', 'typography', 'color theory', 'layout design', 'composition',
    'adobe creative suite', 'photoshop', 'illustrator', 'indesign', 'canva', 'affinity designer'
  ],
  
  multimedia_production: [
    'video editing', 'motion graphics', 'animation', '2d animation', '3d animation',
    'after effects', 'premiere pro', 'final cut pro', 'davinci resolve', 'blender',
    'cinema 4d', 'maya', '3ds max', 'photography', 'photo editing', 'lightroom',
    'audio editing', 'sound design', 'music production', 'podcasting', 'video production'
  ],
  
  content_creation: [
    'content writing', 'copywriting', 'technical writing', 'creative writing', 'blogging',
    'content strategy', 'content marketing', 'social media content', 'email marketing',
    'storytelling', 'editing', 'proofreading', 'seo writing', 'grant writing'
  ],
  
  // Business & Strategy
  project_management: [
    'project management', 'pmp', 'prince2', 'agile', 'scrum', 'kanban', 'waterfall',
    'lean', 'six sigma', 'change management', 'risk management', 'stakeholder management',
    'resource planning', 'budget management', 'timeline management', 'quality assurance'
  ],
  
  business_analysis: [
    'business analysis', 'requirements gathering', 'process mapping', 'workflow optimization',
    'process optimization', 'workflow improvement', 'process improvement', 'business process',
    'data analysis', 'statistical analysis', 'business intelligence', 'kpi tracking',
    'market research', 'competitive analysis', 'swot analysis', 'feasibility studies',
    'cost-benefit analysis', 'roi analysis', 'business case development'
  ],
  
  marketing_sales: [
    'digital marketing', 'social media marketing', 'content marketing', 'email marketing',
    'paid advertising', 'ppc', 'google ads', 'facebook ads', 'linkedin ads',
    'marketing automation', 'crm management', 'client relationship management', 'customer relationship', 
    'patient relationship management', 'relationship management', 'lead generation', 'conversion optimization',
    'sales strategy', 'account management', 'customer relationship management',
    'brand management', 'product marketing', 'growth hacking', 'affiliate marketing'
  ],
  
  finance_accounting: [
    'financial analysis', 'budgeting', 'forecasting', 'financial modeling', 'accounting',
    'bookkeeping', 'tax preparation', 'auditing', 'compliance', 'risk assessment',
    'investment analysis', 'portfolio management', 'financial reporting', 'cost accounting',
    'management accounting', 'treasury management', 'cash flow management'
  ],
  
  // Leadership & Management
  team_leadership: [
    'team leadership', 'people management', 'team building', 'mentoring', 'coaching',
    'performance management', 'talent development', 'succession planning', 'delegation',
    'conflict resolution', 'employee engagement', 'organizational development'
  ],
  
  strategic_planning: [
    'strategic planning', 'business strategy', 'corporate strategy', 'strategic thinking',
    'vision development', 'goal setting', 'okr', 'balanced scorecard', 'scenario planning',
    'competitive strategy', 'market positioning', 'business development'
  ],
  
  operations_management: [
    'operations management', 'process improvement', 'supply chain management', 'logistics',
    'inventory management', 'quality management', 'vendor management', 'procurement',
    'facility management', 'production planning', 'capacity planning'
  ],
  
  // Communication & Soft Skills
  communication: [
    'verbal communication', 'written communication', 'presentation skills', 'public speaking',
    'interpersonal communication', 'cross-cultural communication', 'technical communication',
    'stakeholder communication', 'client communication', 'negotiation', 'persuasion'
  ],
  
  problem_solving: [
    'problem solving', 'analytical thinking', 'critical thinking', 'decision making',
    'creative problem solving', 'root cause analysis', 'troubleshooting', 'debugging',
    'systems thinking', 'logical reasoning', 'pattern recognition'
  ],
  
  collaboration: [
    'teamwork', 'collaboration', 'cross-functional collaboration', 'remote collaboration',
    'facilitation', 'consensus building', 'group dynamics', 'virtual team management',
    'cultural sensitivity', 'emotional intelligence', 'empathy'
  ],
  
  adaptability: [
    'adaptability', 'flexibility', 'resilience', 'change management', 'learning agility',
    'continuous learning', 'growth mindset', 'innovation', 'creativity', 'resourcefulness',
    'stress management', 'time management', 'prioritization', 'multitasking'
  ],
  
  // Languages
  spoken_languages: [
    'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'dutch', 'russian',
    'chinese', 'mandarin', 'japanese', 'korean', 'arabic', 'hindi', 'bengali', 'urdu',
    'turkish', 'polish', 'czech', 'hungarian', 'greek', 'hebrew', 'thai', 'vietnamese',
    'native', 'fluent', 'advanced', 'intermediate', 'basic', 'conversational',
    'a1', 'a2', 'b1', 'b2', 'c1', 'c2' // CEFR levels
  ]
};

/**
 * Enhanced skill categorization that provides more granular categories
 */
export function enhancedCategorizeSkill(skill: string): keyof EnhancedSkillCategories {
  const normalizedSkill = skill.toLowerCase().trim();
  
  // Check each category in priority order
  const categoryOrder: (keyof EnhancedSkillCategories)[] = [
    'spoken_languages', 'programming_languages', 'web_technologies', 'frameworks_libraries',
    'databases', 'cloud_platforms', 'dev_tools', 'ui_ux_design', 'graphic_design',
    'multimedia_production', 'content_creation', 'project_management', 'business_analysis',
    'marketing_sales', 'finance_accounting', 'team_leadership', 'strategic_planning',
    'operations_management', 'communication', 'problem_solving', 'collaboration', 'adaptability'
  ];
  
  for (const category of categoryOrder) {
    const keywords = ENHANCED_SKILL_MAPPINGS[category] || [];
    if (keywords.some(keyword => 
      normalizedSkill.includes(keyword) || 
      keyword.includes(normalizedSkill) ||
      // Handle common variations
      normalizedSkill.replace(/[.\-_\s]/g, '') === keyword.replace(/[.\-_\s]/g, '')
    )) {
      return category;
    }
  }
  
  // Default to domain_expertise for unknown skills
  return 'domain_expertise';
}

/**
 * Auto-categorize an array of mixed skills into enhanced granular categories
 */
export function enhancedAutoCategorizeSkills(skills: string[]): EnhancedSkillCategories {
  const categorized: EnhancedSkillCategories = {};
  
  skills.forEach(skill => {
    if (skill.trim()) {
      const category = enhancedCategorizeSkill(skill);
      if (!categorized[category]) {
        categorized[category] = [];
      }
      if (!categorized[category]!.includes(skill)) {
        categorized[category]!.push(skill);
      }
    }
  });
  
  return categorized;
}

/**
 * GPT Prompt for intelligent skill suggestions and organization
 */
export const SKILL_ENHANCEMENT_PROMPT = `
You are an expert career counselor and resume specialist. Given a user's current skills and professional background, suggest relevant skills they might be missing and organize all skills into the most appropriate granular subcategories.

Analyze the provided skills and context, then:

1. **Split compound skills**: If a skill contains "&" or "and", split it into separate individual skills (e.g., "Process Optimization & Workflow Improvement" becomes "Process Optimization", "Workflow Improvement")
2. **Organize existing skills** into granular subcategories that best represent their skillset
3. **Suggest 3-5 relevant missing skills** for each major category based on their profile
4. **Provide soft skills suggestions** that most professionals would be comfortable adding
5. **Create custom subcategories** if the user's skills don't fit standard categories

Categories to consider:
- Programming Languages, Web Technologies, Frameworks & Libraries, Databases, Cloud Platforms, Dev Tools
- UI/UX Design, Graphic Design, Multimedia Production, Content Creation  
- Project Management, Business Analysis, Marketing & Sales, Finance & Accounting
- Team Leadership, Strategic Planning, Operations Management
- Communication, Problem Solving, Collaboration, Adaptability
- Domain Expertise, Certifications, Regulatory Compliance
- Spoken Languages

Return a JSON object with:
- "organized_skills": skills organized by subcategory
- "suggestions": { "category_name": ["skill1", "skill2", ...] }
- "soft_skills_suggestions": ["universal soft skill suggestions"]
- "reasoning": "brief explanation of categorization logic"

Focus on skills that enhance the user's marketability and are commonly expected in their field.
`;

/**
 * Convert user profile context for GPT skill enhancement
 */
export function createSkillEnhancementContext(userProfile: any): string {
  const context = {
    current_skills: [],
    experience: [],
    education: [],
    industry: 'Unknown'
  };

  // Handle null or undefined userProfile
  if (!userProfile) {
    return JSON.stringify(context, null, 2);
  }

  // Extract current skills
  if (userProfile.skills) {
    if (Array.isArray(userProfile.skills)) {
      context.current_skills = userProfile.skills;
    } else if (typeof userProfile.skills === 'object') {
      // Flatten skills object
      Object.values(userProfile.skills).forEach((skillList: any) => {
        if (Array.isArray(skillList)) {
          context.current_skills.push(...skillList);
        }
      });
    }
  }

  // Extract experience for context
  if (userProfile.experience && Array.isArray(userProfile.experience)) {
    context.experience = userProfile.experience.map((exp: any) => ({
      position: exp.position || exp.title,
      company: exp.company,
      responsibilities: exp.responsibilities || exp.achievements
    })).slice(0, 3); // Limit to top 3 experiences
  }

  // Extract education
  if (userProfile.education && Array.isArray(userProfile.education)) {
    context.education = userProfile.education.map((edu: any) => ({
      degree: edu.degree,
      field: edu.field_of_study || edu.field,
      institution: edu.institution
    }));
  }

  // Try to determine industry from experience
  if (context.experience.length > 0) {
    const positions = context.experience.map((exp: any) => exp.position).join(' ');
    if (positions.toLowerCase().includes('engineer') || positions.toLowerCase().includes('developer')) {
      context.industry = 'Technology';
    } else if (positions.toLowerCase().includes('designer')) {
      context.industry = 'Design';
    } else if (positions.toLowerCase().includes('manager')) {
      context.industry = 'Management';
    } else if (positions.toLowerCase().includes('analyst')) {
      context.industry = 'Business Analysis';
    } else if (positions.toLowerCase().includes('marketing')) {
      context.industry = 'Marketing';
    }
  }

  return JSON.stringify(context, null, 2);
}

/**
 * Beautiful category display names for UI
 */
export const CATEGORY_DISPLAY_NAMES: Record<keyof EnhancedSkillCategories, string> = {
  programming_languages: 'Programming Languages',
  web_technologies: 'Web Technologies',
  frameworks_libraries: 'Frameworks & Libraries',
  databases: 'Databases & Storage',
  cloud_platforms: 'Cloud & DevOps',
  dev_tools: 'Development Tools',
  ui_ux_design: 'UI/UX Design',
  graphic_design: 'Graphic Design',
  multimedia_production: 'Multimedia & Production',
  content_creation: 'Content & Writing',
  project_management: 'Project Management',
  business_analysis: 'Business Analysis',
  marketing_sales: 'Marketing & Sales',
  finance_accounting: 'Finance & Accounting',
  team_leadership: 'Leadership & Management',
  strategic_planning: 'Strategic Planning',
  operations_management: 'Operations',
  communication: 'Communication',
  problem_solving: 'Problem Solving',
  collaboration: 'Teamwork & Collaboration',
  adaptability: 'Adaptability & Growth',
  domain_expertise: 'Domain Expertise',
  certifications: 'Certifications',
  regulatory_compliance: 'Compliance & Regulations',
  spoken_languages: 'Languages'
};

/**
 * Get category icon for enhanced UI
 */
export function getCategoryIcon(category: keyof EnhancedSkillCategories): string {
  const iconMap: Record<keyof EnhancedSkillCategories, string> = {
    programming_languages: '🔧',
    web_technologies: '🌐',
    frameworks_libraries: '📚',
    databases: '🗄️',
    cloud_platforms: '☁️',
    dev_tools: '🛠️',
    ui_ux_design: '🎨',
    graphic_design: '🖼️',
    multimedia_production: '🎬',
    content_creation: '✍️',
    project_management: '📋',
    business_analysis: '📊',
    marketing_sales: '📈',
    finance_accounting: '💰',
    team_leadership: '👥',
    strategic_planning: '🎯',
    operations_management: '⚙️',
    communication: '💬',
    problem_solving: '🧩',
    collaboration: '🤝',
    adaptability: '🌱',
    domain_expertise: '🏆',
    certifications: '🏅',
    regulatory_compliance: '📋',
    spoken_languages: '🗣️'
  };
  
  return iconMap[category] || '📌';
}