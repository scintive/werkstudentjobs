/**
 * Centralized Prompt Configuration
 * All LLM prompts used throughout the web application
 */

export const PROMPTS = {
  
  // Job Extraction Prompts
  JOB_EXTRACTION: {
    SYSTEM: "You are a precise information extractor that returns strict JSON only.",
    
    USER_TEMPLATE: `You are master job researcher and really good at analyzing job descriptions and understanding everything about the job roles. Extract the following fields from the job post JSON. Copy important lists word-for-word (no rephrasing). If German, include original lists and add English translations alongside. Output STRICT JSON matching the schema below, no extra text.

Schema:
{
  "job_description_link": string | null,
  "portal_link": string | null,
  "date_posted": string | null,
  "company_name": string | null,
  "german_required": "DE" | "EN" | "both" | "unknown",
  "werkstudent": boolean | null,
  "work_mode": "Remote" | "Onsite" | "Hybrid" | "Unknown",
  "location_city": string | null,
  "location_country": string | null,
  "hiring_manager": string | null,
  "tasks_responsibilities": { original: string[] | null, english: string[] | null },
  "nice_to_have": { original: string[] | null, english: string[] | null },
  "benefits": { original: string[] | null, english: string[] | null },
  "named_skills_tools": string[],
  "important_statements": string[]
}

Rules:
- Copy lists verbatim. Do not paraphrase. Preserve punctuation and capitalization.
- If the job is in German, keep original lists and provide English translations in parallel.
- Only fill translations if German detected; otherwise set english to null.
- Set fields to null if unknown.
- Determine german_required: DE if job primarily in German; EN if English; both if mixed.

Job JSON:
{{JOB_DATA}}`,

    JSON_REPAIR_SYSTEM: "You are a JSON linter. Return ONLY valid JSON matching the provided schema. If something is missing, set it to null or [].",
    
    JSON_REPAIR_TEMPLATE: `Schema:
{{SCHEMA}}

Malformed JSON:
{{MALFORMED_JSON}}`
  },

  // Profile Extraction from PDF
  PROFILE_EXTRACTION: {
    SYSTEM: "You are a professional resume analyzer that extracts and generates compelling career positioning for maximum recruiter impact.",
    
    USER_TEMPLATE: `Convert this resume text into structured JSON with AI-generated professional title and summary optimized for recruiters.

**PROFESSIONAL TITLE GENERATION (2-3 WORDS MAX):**
1. Analyze career level from experience duration and job titles (entry/mid/senior)
2. Identify strongest domain (e.g., software engineering, data science, marketing, operations, design)
3. Combine seniority + expertise: "Senior Data Scientist", "Operations Specialist", "Marketing Manager"
4. Make it ATS-searchable and recruiter-memorable
5. NEVER use generic "Professional" - always be specific

**PROFESSIONAL SUMMARY GENERATION (2-4 SENTENCES, 60-80 WORDS):**
1. Start: "X+ years of experience in [domain]" 
2. Include quantified achievement with metrics/percentages
3. List 2-3 key relevant skills/technologies
4. End with value proposition for employers
5. Focus on measurable impact and results

**CRITICAL DATA EXTRACTION GUIDELINES:**

**EDUCATION DATES - EXTRACT BOTH YEAR AND DURATION:**
- Extract both "year" (graduation year like "2023") AND "duration" (period like "2020-2023") when available
- If only one date format exists, set the other to empty string
- Look for degrees, examinations, qualifications (e.g., "G.C.E Advanced Level", "Bachelor's", "Master's")
- Preserve exact institution names and all date information

**CUSTOM SECTIONS - EXTRACT ALL NON-STANDARD SECTIONS:**
- Look for sections like "Leadership", "Volunteer Experience", "Awards", "Publications", "Honors", "Activities", "Community Service", etc.
- Extract these as custom_sections with title and array of items
- Common custom section titles: Leadership & Volunteer, Awards & Achievements, Publications, Community Involvement, Professional Associations, Honors, etc.
- IMPORTANT: DO NOT duplicate sections that are already extracted as core sections (education, experience, projects, certifications, languages, skills)
- CRITICAL: "Academic Projects", "Personal Projects", "Side Projects", "Research Projects" or ANY variation of "Projects" should ALWAYS go in the main "projects" array, NEVER in custom_sections
- Only extract truly custom/additional sections not covered by the main schema

**LANGUAGE PROFICIENCY - PRESERVE EXACT LEVELS:**
- Parse languages with ACTUAL proficiency levels mentioned in resume
- Common levels: A1/A2/B1/B2/C1/C2, Native Speaker, Fluent, Advanced, Intermediate, Basic, Professional Working Proficiency, Limited Working Proficiency, Elementary Proficiency, Native or Bilingual Proficiency, Full Professional Proficiency, etc.
- DO NOT default to "Professional working" - use EXACT wording from resume
- If no level specified, use "Not specified" rather than making assumptions

**OTHER GUIDELINES:**
- Include ALL certifications and professional qualifications WITH DATES (if no date visible, estimate based on career timeline)  
- Keep all experience responsibilities verbatim - do NOT truncate, especially quantified achievements
- **PRIORITIZE QUANTIFIABLE RESULTS**: Revenue generated, costs reduced, efficiency improved, team leadership, project scale
- Include ALL digital/technical skills mentioned with focus on specialized/advanced technologies

Required JSON structure:
{
  "personal_details": {
    "name": string,
    "date_of_birth": string,
    "nationality": string, 
    "gender": string,
    "contact": {
      "phone": string,
      "email": string,
      "address": string,
      "linkedin": string
    }
  },
  "professional_title": string, // REQUIRED: 2-3 words, specific domain expertise (e.g., "Senior Data Scientist", "Operations Specialist")
  "professional_summary": string, // REQUIRED: 2-4 sentences with metrics and value proposition
  "education": [{
    "degree": string, // e.g., "G.C.E Advanced Level", "BSc", etc.
    "field_of_study": string,
    "institution": string,
    "duration": string, // e.g., "2020-2023" or "2020 - 2023"
    "year": string, // e.g., "2023" (graduation year)
    "location": string
  }],
  "certifications": [{
    "title": string,
    "institution": string,
    "date": string
  }],
  "experience": [{
    "company": string,
    "position": string,
    "duration": string,
    "responsibilities": string[] // Keep ALL responsibilities
  }],
  "skills": {
    "technology": string[],
    "soft_skills": string[],
    "design": string[]
  },
  "languages": [{
    "language": string,
    "proficiency": string // EXACT proficiency mentioned in resume - DO NOT use "Professional working" unless specifically stated
  }],
  "projects": [{
    "title": string,
    "description": string
  }], // ALL projects go here: Academic Projects, Personal Projects, Side Projects, Research Projects, etc.
  "custom_sections": [{
    "title": string, // e.g., "Leadership & Volunteer", "Awards", "Publications", etc.
    "items": string[] // Array of achievements, activities, or items under this section
  }]
}

Resume text:
{{RESUME_TEXT}}`
  },

  // Job-Profile Analysis
  JOB_PROFILE_ANALYSIS: {
    SYSTEM: "You are a concise career assistant returning strict JSON.",
    
    USER_TEMPLATE: `You are a meticulous career documents generator with expertise in creating compelling, substantial content. Your primary goal is to create resumes that capture recruiter attention within the first 10 seconds of reading.

**PROFESSIONAL TITLE ANALYSIS STRATEGY**:
1. Analyze candidate's career level (entry/mid/senior) from experience duration and leadership roles
2. Identify their strongest technical domain (e.g., software engineering, data science, marketing, operations)
3. Consider the specific job they're applying for to ensure relevance
4. Generate a title that combines seniority + expertise (e.g., "Senior" + "Data Engineer", "Strategic" + "Marketing Manager")
5. Ensure it's searchable by ATS systems and memorable for recruiters

**PROFESSIONAL SUMMARY IMPACT FORMULA**:
1. Years of experience + core expertise (sentence 1): "X+ years of experience in [domain]" 
2. Quantified achievement that demonstrates value (sentence 2): Include specific metrics, percentages, or outcomes
3. Key skills/technologies relevant to target role (sentence 3): Match with job requirements
4. Value proposition for future employer (sentence 4, if needed): What they bring to the team/company

**PROFESSIONAL SUMMARY EXAMPLES FOR REFERENCE**:
- Software Engineer: "Full-stack developer with 4+ years building scalable web applications. Led development of e-commerce platform serving 50K+ users, increasing conversion rates by 35%. Expert in React, Node.js, and AWS with strong focus on performance optimization. Passionate about creating user-centric solutions that drive business growth."
- Marketing Professional: "Strategic marketing manager with 6+ years driving digital growth for SaaS companies. Increased lead generation by 150% through data-driven campaigns and marketing automation. Specialized in content strategy, SEO, and conversion optimization with proven track record of ROI improvement."
- Data Analyst: "Results-driven data analyst with 3+ years transforming complex datasets into actionable business insights. Developed predictive models that improved forecasting accuracy by 40% and reduced operational costs by $200K annually. Proficient in Python, SQL, and Tableau with expertise in statistical analysis."

TASKS:
1) Fit assessment (bullets): strengths, gaps, language fit, location/visa fit if obvious.
2) Cover letter (Markdown, 400-500 words): Compelling, motivational letter with strong narrative; 4-5 substantial paragraphs including opening hook, 2-3 body paragraphs with detailed achievements and company research, and strong closing. Must demonstrate genuine interest and deep understanding of role/company.
3) Resume (Markdown, comprehensive): Complete sections with Summary, Skills (grouped), Experience (ALL responsibilities with metrics), Education, Projects, Certifications. Professional and substantial presentation.

LANGUAGE:
- Generate ONLY English versions. Do not create multiple language versions.
- Generate exactly ONE cover letter and ONE resume in English only.

COVER LETTER REQUIREMENTS:
- 400-500 words minimum (substantially longer than typical)
- Opening paragraph: Strong hook showing knowledge of company/role
- Body paragraph 1: Detailed relevant experience with specific metrics and outcomes
- Body paragraph 2: Additional achievements/skills that directly match job requirements  
- Body paragraph 3: Company research showing genuine interest, specific projects/values/culture alignment
- Closing: Strong call to action and enthusiasm
- Professional letter format with sender address (use candidate's location from profile), date, recipient address
- ADDRESSING: Use "Dear Hiring Team," or "Dear [Company Name] Team," (NOT "Dear Hiring Manager,")
- Include candidate's actual location in sender address (extract from profile data)
- Demonstrate thorough research of company and role
- Show passion and genuine motivation, not just qualifications

RESUME REQUIREMENTS:
- **PROFESSIONAL TITLE (CRITICAL FOR RECRUITER ATTENTION)**: Generate a POWERFUL 2-3 word title that makes recruiters want to read more. Analyze the candidate's strongest skills, industry position, and career level. Create a title that conveys expertise and value immediately. Examples: "Senior Data Scientist", "Full-Stack Developer", "Strategic Marketing Leader", "Business Intelligence Analyst", "Product Design Expert". Make it specific, professional, and attention-grabbing.
- **PROFESSIONAL SUMMARY (HIGH-IMPACT RECRUITER HOOK)**: Create 2-4 sentences (60-80 words) that serve as a powerful elevator pitch. Start with years of experience and strongest expertise. Include 2-3 key achievements with metrics. End with value proposition for employers. Must capture recruiter attention in first 10 seconds of reading. Focus on quantifiable impact, specialized skills, and career growth trajectory.
- Complete skills categorization (technical, tools, business, soft skills, languages)
- ALL experience with detailed responsibilities and quantified achievements
- Include ALL projects, certifications, education details
- Professional formatting suitable for senior-level positions
- Substantial content that fills page appropriately

STYLE RULES:
- **Professional Title**: Must be immediately compelling and ATS-keyword optimized. Should make recruiter want to continue reading. Avoid generic titles like "Professional" or "Specialist" without context.
- **Professional Summary**: Must hook recruiter attention within 5 seconds. Start with strong impact statement, include hard metrics, end with value proposition. Every word must add value.
- Cover letters: Engaging, research-driven, motivational tone with specific company insights
- Resumes: Professional, comprehensive, achievement-focused with strong action verbs
- Use specific metrics, percentages, and quantifiable outcomes wherever possible
- Maintain truthfulness while presenting information compellingly
- No placeholder text - integrate all information naturally
- Make content substantial and impressive while remaining authentic

INPUTS:
JOB_JSON:
{{JOB_DATA}}

PROFILE_JSON:
{{PROFILE_DATA}}

Return STRICT JSON only:
{
  "fit_summary": string[],
  "cover_letter_markdown": string,
  "resume_markdown": string,
  "tailored_resume_data": {
    "personalInfo": { "name": string, "email": string, "phone": string, "location": string, "linkedin": string },
    "professionalTitle": string, // MUST be 2-3 words maximum, recruiter-focused, ATS-optimized (e.g., "Senior Data Scientist", "Full-Stack Developer")
    "professionalSummary": string, // MUST be 2-4 sentences, 60-80 words, include metrics and value proposition
    "skills": { "technical": string[], "tools": string[], "soft_skills": string[], "languages": string[] },
    "experience": [{ "company": string, "position": string, "duration": string, "achievements": string[] }],
    "education": [{ "degree": string, "field_of_study": string, "institution": string, "year": string, "duration": string }],
    "projects": [{ "name": string, "description": string, "technologies": string[], "date": string }],
    "certifications": [{ "name": string, "issuer": string, "date": string }]
  }
}`
  },

  // Profile Review and Enhancement
  PROFILE_REVIEW: {
    SYSTEM: "You are a precise resume reviewer that returns strict JSON only.",
    
    USER_TEMPLATE: `You are a rigorous resume reviewer. Given the user's current structured profile JSON, produce:
- critique: issues and opportunities to improve (structure, gaps, impact, ATS keywords)
- improvement_plan: prioritized steps
- base_resume: a resume JSON (same shape used below) suitable for generic applications, with quantified bullets when possible
Return strict JSON with keys: {"critique": string[], "improvement_plan": string[], "base_resume": ResumeJSON}.

ResumeJSON shape:
{
  "personalInfo": {"name": string, "email": string, "phone": string, "location": string, "website"?: string, "linkedin"?: string},
  "professionalSummary": string,
  "skillCategories": {"technical"?: string[], "creative"?: string[], "business"?: string[], "tools"?: string[], "languages"?: string[]},
  "experience"?: [{"title": string, "company": string, "location"?: string, "duration"?: string, "achievements"?: string[]}],
  "projects"?: [{"name": string, "description": string, "impact"?: string, "technologies"?: string[]}],
  "education"?: [{"degree": string, "institution": string, "location"?: string, "year"?: string}],
  "certifications"?: [{"name": string, "issuer"?: string, "year"?: string, "credential_id"?: string}],
  "additionalSections"?: {"achievements"?: string[]}
}

User Profile JSON:
{{PROFILE_DATA}}`
  },

  // Education Formatting Prompts
  EDUCATION_FORMATTING: {
    SYSTEM: "Return JSON array only. Start with [ and end with ]. No other text.",
    
    USER_TEMPLATE: `Transform each education entry by expanding degree abbreviations:

BSc → Bachelor of Science
MSc → Master of Science  
BA → Bachelor of Arts
MA → Master of Arts
AS → Associate of Science
AA → Associate of Arts
PhD → Doctor of Philosophy

Input: {{EDUCATION_DATA}}

Output format (JSON array only):
[
  {
    "degree": "Expanded degree name",
    "field_of_study": "Keep same", 
    "institution": "Keep same",
    "year": "Keep same"
  }
]`
  },

  // Intelligent Skill Organization & Suggestions
  SKILL_ORGANIZATION: {
    SYSTEM: "You are an expert career consultant who organizes skills into intelligent categories based on user profiles. Return strict JSON only.",
    
    USER_TEMPLATE: `Analyze the user's profile and existing skills, then:

1. **REORGANIZE** their current skills into 5-7 intelligent categories tailored to their career
2. **SUGGEST** additional relevant skills for each category based on their profile

PROFILE ANALYSIS:
- Career level: {{CAREER_LEVEL}} (entry/mid/senior based on experience)
- Industry focus: Determine from experience and education
- Technical depth: Assess from skills and responsibilities

CATEGORIZATION RULES:
- Create 5-7 categories maximum
- Categories must be specific to their career path
- Use professional, resume-appropriate category names
- Tech profiles: "Frontend Development", "Backend Systems", "DevOps & Tools", etc.
- Business profiles: "Client Relations", "Strategic Planning", "Process Management", etc.
- Mixed profiles: Balance technical and business categories

USER PROFILE:
{{PROFILE_DATA}}

CURRENT SKILLS (to reorganize):
{{CURRENT_SKILLS}}

Return STRICT JSON:
{
  "organized_categories": {
    "Category Name 1": {
      "skills": ["Current skills that fit this category"],
      "suggestions": ["3-5 relevant additional skills"],
      "reasoning": "Why this category fits their profile"
    },
    "Category Name 2": {
      "skills": ["Current skills that fit this category"], 
      "suggestions": ["3-5 relevant additional skills"],
      "reasoning": "Why this category fits their profile"
    }
  },
  "profile_assessment": {
    "career_focus": "Their main career direction",
    "skill_level": "entry/mid/senior",
    "recommendations": "Key areas for growth"
  },
  "category_mapping": {
    "Suggested Skill Name": "Category Name it belongs to"
  }
}`
  },

  // GPT Skill Suggestions (missing category fix)
  SKILL_SUGGESTIONS: {
    SYSTEM: "You are a career assistant. Return ONLY strict JSON. Suggest skills to add and briefly explain why.",
    USER_TEMPLATE: `Analyze the user's profile and current skills and return JSON:\n\n{\n  "skill_suggestions": {\n    "technical": [{"skill": "string", "reason": "string"}],\n    "soft_skills": [{"skill": "string", "reason": "string"}],\n    "industry_specific": [{"skill": "string", "reason": "string"}],\n    "tools_platforms": [{"skill": "string", "reason": "string"}]\n  },\n  "priority_recommendations": [{"skill": "string", "category": "string", "impact": "string"}],\n  "learning_path": {"immediate": [], "short_term": [], "long_term": []},\n  "profile_analysis": "string"\n}\n\nPROFILE:\n{{PROFILE_DATA}}\n\nCURRENT_SKILLS:\n{{CURRENT_SKILLS}}\n\nRules:\n- Use real, resume-appropriate skills.\n- Do not invent technologies not supported by profile/job context.\n- Be concise; 3-6 items per bucket is enough.`
  }
};

/**
 * Get a specific prompt by category and type
 * @param {string} category - The prompt category (e.g., 'JOB_EXTRACTION')
 * @param {string} type - The prompt type (e.g., 'SYSTEM', 'USER_TEMPLATE')
 * @returns {string} The prompt template
 */
export function getPrompt(category: string, type: string): string {
  const categoryPrompts = PROMPTS[category as keyof typeof PROMPTS];
  if (!categoryPrompts) {
    throw new Error(`Prompt category '${category}' not found`);
  }
  
  const prompt = categoryPrompts[type as keyof typeof categoryPrompts];
  if (!prompt) {
    throw new Error(`Prompt type '${type}' not found in category '${category}'`);
  }
  
  return prompt as string;
}

/**
 * Fill a prompt template with data
 * @param {string} template - The prompt template with {{PLACEHOLDER}} syntax
 * @param {Record<string, any>} data - The data to fill into the template
 * @returns {string} The filled prompt
 */
export function fillPromptTemplate(template: string, data: Record<string, any>): string {
  return Object.entries(data).reduce((prompt, [key, value]) => {
    const placeholder = `{{${key}}}`;
    return prompt.replace(new RegExp(placeholder, 'g'), String(value));
  }, template);
}