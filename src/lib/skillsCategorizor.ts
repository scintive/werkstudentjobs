// Universal Skills Categorization for Resume Builder
// Covers 90% of professions with broad, adaptable buckets
export interface SkillCategories {
  core: string[]                    // Core Skills / Professional Skills
  technical: string[]               // Technical & Digital Skills  
  creative: string[]                // Creative & Design Skills
  business: string[]                // Business & Strategy Skills
  interpersonal: string[]          // Interpersonal & Communication Skills (Soft Skills)
  languages: string[]               // Languages
  specialized: string[]             // Other / Specialized Skills
}

// Legacy interface for backward compatibility
export interface LegacySkillCategories {
  technical: string[]
  tools: string[]
  soft_skills: string[]
  languages: string[]
}

// Universal skill categorization mappings - works for all professions
const SKILL_MAPPINGS = {
  // Core Skills / Professional Skills - Role-specific hard skills
  core: [
    // Business & Finance
    'accounting', 'bookkeeping', 'financial analysis', 'budgeting', 'forecasting', 'auditing', 'tax preparation',
    'investment analysis', 'risk management', 'financial modeling', 'corporate finance', 'banking',
    
    // Healthcare & Medical
    'patient care', 'medical diagnosis', 'surgery', 'nursing', 'pharmacy', 'physical therapy', 'radiology',
    'laboratory analysis', 'medical coding', 'hipaa compliance', 'electronic health records', 'first aid',
    'cpr', 'medical research', 'clinical trials',
    
    // Education & Training
    'curriculum development', 'lesson planning', 'classroom management', 'educational assessment',
    'learning disabilities', 'special education', 'online learning', 'instructional design', 'tutoring',
    
    // Legal
    'legal research', 'contract law', 'litigation', 'compliance', 'regulatory affairs', 'intellectual property',
    'corporate law', 'family law', 'criminal law', 'legal writing', 'paralegal',
    
    // Sales & Marketing
    'sales forecasting', 'lead generation', 'customer acquisition', 'market research', 'competitive analysis',
    'brand management', 'digital marketing', 'content marketing', 'email marketing', 'social media marketing',
    'paid advertising', 'conversion optimization', 'crm management',
    
    // Engineering & Manufacturing
    'cad design', 'mechanical engineering', 'electrical engineering', 'civil engineering', 'quality control',
    'manufacturing processes', 'lean manufacturing', 'six sigma', 'process improvement', 'safety protocols',
    
    // Retail & Hospitality
    'inventory management', 'pos systems', 'customer service', 'food safety', 'restaurant management',
    'event planning', 'hotel management', 'merchandising', 'vendor relations',
    
    // Trades & Technical
    'plumbing', 'electrical work', 'carpentry', 'welding', 'hvac', 'automotive repair', 'construction',
    'maintenance', 'troubleshooting', 'equipment operation',
    
    // Research & Analysis
    'data analysis', 'statistical analysis', 'research methodology', 'survey design', 'data collection',
    'report writing', 'trend analysis', 'benchmarking'
  ],

  // Technical & Digital Skills - Software, coding, tools, platforms
  technical: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'sql', 'nosql', 'graphql',
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt', 'gatsby', 'remix',
    'node.js', 'nodejs', 'express', 'fastify', 'koa', 'nestjs',
    'spring', 'django', 'flask', 'laravel', 'rails', 'asp.net',
    'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase',
    'rest apis', 'rest', 'api', 'microservices', 'webhooks',
    'machine learning', 'ai', 'data science', 'deep learning', 'tensorflow', 'pytorch',
    'blockchain', 'web3', 'ethereum', 'solidity',
    'devops', 'ci/cd', 'testing', 'unit testing', 'integration testing', 'tdd', 'bdd',
    'agile', 'scrum', 'kanban', 'waterfall',
    'ui/ux design', 'ux design', 'ui design', 'user experience', 'user interface',
    'responsive design', 'mobile-first', 'accessibility', 'wcag',
    'seo', 'sem', 'analytics', 'conversion optimization',
    'product strategy', 'product management', 'roadmapping', 'user research',
    'prompt engineering', 'generative ai workflows', 'automation'
  ],

  // Creative & Design Skills - Visual, content, storytelling, branding
  creative: [
    // Visual Design
    'graphic design', 'logo design', 'brand identity', 'web design', 'ui design', 'ux design',
    'user experience', 'user interface', 'wireframing', 'prototyping', 'visual design',
    
    // Content Creation
    'content writing', 'copywriting', 'technical writing', 'creative writing', 'blogging',
    'content strategy', 'storytelling', 'editing', 'proofreading',
    
    // Media & Production
    'photography', 'videography', 'video editing', 'audio editing', 'animation', '3d modeling',
    'illustration', 'digital art', 'print design', 'packaging design',
    
    // Marketing Creative
    'advertising design', 'campaign creation', 'social media content', 'email design',
    'presentation design', 'infographic design',
    
    // Tools for Creative Work
    'adobe creative suite', 'photoshop', 'illustrator', 'indesign', 'after effects', 'premiere pro',
    'sketch', 'figma', 'canva', 'final cut pro', 'lightroom', 'procreate'
  ],

  // Business & Strategy - Management, leadership, planning
  business: [
    // Management & Leadership
    'project management', 'team management', 'people management', 'change management',
    'performance management', 'talent acquisition', 'succession planning', 'organizational development',
    
    // Strategy & Planning
    'strategic planning', 'business development', 'business strategy', 'market analysis',
    'competitive intelligence', 'swot analysis', 'business modeling', 'roadmapping',
    'product strategy', 'go-to-market strategy',
    
    // Operations
    'operations management', 'process optimization', 'supply chain management', 'logistics',
    'vendor management', 'procurement', 'cost reduction', 'efficiency improvement',
    
    // Finance & Business
    'p&l management', 'budget planning', 'roi analysis', 'business case development',
    'pricing strategy', 'revenue optimization', 'financial planning',
    
    // Methodologies
    'agile methodology', 'scrum', 'kanban', 'lean principles', 'six sigma', 'design thinking',
    'waterfall', 'pmp', 'prince2', 'okr', 'kpi management'
  ],

  // Tools & Platforms (now part of technical skills grouping)
  tools: [
    'git', 'github', 'gitlab', 'bitbucket', 'svn',
    'docker', 'kubernetes', 'helm', 'terraform', 'ansible',
    'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'netlify', 'vercel',
    'jenkins', 'travis', 'circleci', 'github actions', 'gitlab ci',
    'jira', 'confluence', 'trello', 'asana', 'monday.com', 'notion',
    'slack', 'teams', 'discord', 'zoom',
    'vscode', 'webstorm', 'intellij', 'sublime', 'atom', 'vim', 'emacs',
    'postman', 'insomnia', 'swagger', 'openapi',
    'figma', 'sketch', 'adobe xd', 'invision', 'framer', 'canva', 'photoshop',
    'final cut pro', 'adobe premiere', 'after effects',
    'tableau', 'power bi', 'looker', 'grafana',
    'midjourney', 'claude', 'chatgpt', 'zapier', 'make', 'n8n',
    'socket.io', 'webpack', 'vite', 'rollup', 'babel', 'eslint', 'prettier',
    'jest', 'cypress', 'playwright', 'selenium',
    'nginx', 'apache', 'cloudflare', 'cloudfront',
    'stripe', 'paypal', 'square', 'plaid',
    'tailwind css', 'tailwind', 'bootstrap', 'material ui', 'chakra ui',
    'storybook', 'chromatic', 'percy'
  ],

  // Interpersonal & Communication Skills (Soft Skills) - Collaboration, leadership, adaptability
  interpersonal: [
    'leadership', 'management', 'team lead', 'team management', 'people management',
    'communication', 'presentation', 'public speaking', 'writing', 'technical writing',
    'problem solving', 'analytical thinking', 'critical thinking', 'decision making',
    'creativity', 'innovation', 'design thinking', 'strategic thinking',
    'collaboration', 'teamwork', 'cross-functional', 'stakeholder management',
    'mentoring', 'coaching', 'training', 'knowledge sharing',
    'adaptability', 'flexibility', 'learning agility', 'continuous learning',
    'time management', 'project management', 'prioritization', 'organization',
    'customer service', 'client relations', 'account management', 'sales',
    'negotiation', 'conflict resolution', 'diplomacy',
    'empathy', 'emotional intelligence', 'cultural awareness', 'diversity',
    'entrepreneurship', 'business development', 'market research'
  ],

  // Specialized / Other - Industry-specific or unique skills
  specialized: [
    // Aviation
    'flight training', 'aircraft maintenance', 'air traffic control', 'aviation safety',
    
    // Agriculture
    'crop management', 'soil analysis', 'irrigation systems', 'livestock management',
    
    // Real Estate
    'property valuation', 'real estate law', 'mortgage processing', 'property management',
    
    // Emergency Services
    'emergency response', 'disaster management', 'fire safety', 'search and rescue',
    
    // Sports & Fitness
    'personal training', 'sports coaching', 'nutrition planning', 'fitness assessment',
    
    // Arts & Entertainment
    'music composition', 'instrument playing', 'voice training', 'theater production',
    'event production', 'talent management',
    
    // Science & Research
    'laboratory techniques', 'scientific research', 'peer review', 'grant writing',
    'clinical research', 'field research',
    
    // Transportation
    'logistics coordination', 'fleet management', 'route optimization', 'freight management',
    
    // Food & Beverage
    'culinary arts', 'menu development', 'food cost analysis', 'wine knowledge', 'bartending',
    
    // Miscellaneous Professional
    'notary services', 'translation services', 'interpretation', 'cultural consulting',
    'accessibility compliance', 'sustainability practices'
  ],

  // Languages (human languages) - Spoken/written proficiency
  languages: [
    'english', 'german', 'spanish', 'french', 'italian', 'portuguese', 'dutch', 'swedish',
    'chinese', 'mandarin', 'japanese', 'korean', 'hindi', 'arabic', 'russian',
    'polish', 'czech', 'hungarian', 'finnish', 'norwegian', 'danish',
    'turkish', 'greek', 'hebrew', 'thai', 'vietnamese', 'indonesian',
    'native', 'fluent', 'advanced', 'intermediate', 'basic', 'conversational',
    'b1', 'b2', 'c1', 'c2', 'a1', 'a2'  // CEFR levels
  ]
}

/**
 * Automatically categorize a skill based on its name using universal buckets
 */
export function categorizeSkill(skill: string): keyof SkillCategories {
  const normalizedSkill = skill.toLowerCase().trim()
  
  // Check each category in priority order
  const categoryOrder: (keyof SkillCategories)[] = ['languages', 'core', 'creative', 'business', 'interpersonal', 'technical', 'specialized']
  
  for (const category of categoryOrder) {
    const keywords = SKILL_MAPPINGS[category] || []
    if (keywords.some(keyword => 
      normalizedSkill.includes(keyword) || 
      keyword.includes(normalizedSkill) ||
      // Handle common variations
      normalizedSkill.replace(/[.\-_\s]/g, '') === keyword.replace(/[.\-_\s]/g, '')
    )) {
      return category
    }
  }
  
  // Default to specialized if unknown (better than technical for non-tech professionals)
  return 'specialized'
}

/**
 * Auto-categorize an array of mixed skills into universal categories
 */
export function autoCategorizeSkills(skills: string[]): SkillCategories {
  const categorized: SkillCategories = {
    core: [],
    technical: [],
    creative: [],
    business: [],
    interpersonal: [],
    languages: [],
    specialized: []
  }
  
  skills.forEach(skill => {
    if (skill.trim()) {
      const category = categorizeSkill(skill)
      if (!categorized[category].includes(skill)) {
        categorized[category].push(skill)
      }
    }
  })
  
  return categorized
}

/**
 * Migrate existing skills structure to new universal categories
 * Handles both legacy (technical, tools, soft_skills, languages) and new format
 */
export function migrateSkillsStructure(currentSkills: unknown): SkillCategories {
  // Handle different possible skill structures
  let allSkills: string[] = []

  if (Array.isArray(currentSkills)) {
    // Simple array of skills
    allSkills = currentSkills
  } else if (typeof currentSkills === 'object' && currentSkills !== null) {
    // Object structure - collect all skills from all categories
    Object.values(currentSkills as Record<string, unknown>).forEach((skillList: Record<string, any>) => {
      if (Array.isArray(skillList)) {
        allSkills.push(...skillList)
      }
    })
  }
  
  // Remove duplicates
  allSkills = [...new Set(allSkills.filter(skill => skill && skill.trim()))]
  
  return autoCategorizeSkills(allSkills)
}

/**
 * Convert legacy skill structure to new universal structure for backward compatibility
 */
export function convertLegacySkills(legacySkills: LegacySkillCategories): SkillCategories {
  const allSkills = [
    ...(legacySkills.technical || []),
    ...(legacySkills.tools || []),
    ...(legacySkills.soft_skills || []),
    ...(legacySkills.languages || [])
  ]
  
  return autoCategorizeSkills(allSkills)
}

/**
 * Smart suggestions for skills based on existing ones - universal approach
 */
export function suggestSkills(existingSkills: SkillCategories, category: keyof SkillCategories): string[] {
  const suggestions: { [key in keyof SkillCategories]: string[] } = {
    core: [
      'Data Analysis', 'Customer Service', 'Quality Assurance', 'Process Improvement',
      'Market Research', 'Training & Development', 'Compliance Management', 'Risk Assessment'
    ],
    technical: [
      'Excel', 'SQL', 'Python', 'JavaScript', 'API Integration', 'Database Management',
      'Cloud Computing', 'Automation', 'Data Visualization', 'CRM Systems'
    ],
    creative: [
      'Adobe Creative Suite', 'Content Creation', 'Brand Design', 'UI/UX Design',
      'Video Production', 'Social Media Design', 'Presentation Design', 'Creative Writing'
    ],
    business: [
      'Project Management', 'Strategic Planning', 'Business Analysis', 'Process Optimization',
      'Team Leadership', 'Budget Management', 'Vendor Relations', 'Change Management'
    ],
    interpersonal: [
      'Communication', 'Leadership', 'Problem Solving', 'Team Collaboration',
      'Negotiation', 'Mentoring', 'Public Speaking', 'Cultural Awareness'
    ],
    languages: [
      'English (Native)', 'Spanish (Intermediate)', 'German (B2)', 'French (Conversational)',
      'Mandarin (Basic)', 'Arabic (Basic)'
    ],
    specialized: [
      'Industry Expertise', 'Regulatory Knowledge', 'Specialized Software', 'Professional Certification',
      'Technical Standards', 'Safety Protocols', 'Equipment Operation', 'Research Methods'
    ]
  }
  
  // Filter out already existing skills
  const existing = existingSkills[category] || []
  return suggestions[category].filter(suggestion => 
    !existing.some(existing => 
      existing.toLowerCase().includes(suggestion.toLowerCase()) ||
      suggestion.toLowerCase().includes(existing.toLowerCase())
    )
  ).slice(0, 4) // Limit suggestions
}