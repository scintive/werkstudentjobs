// Ensure URL.canParse exists before importing OpenAI SDK (which relies on it in Node)
import '@/lib/polyfills/url-canparse';
/**
 * LLM Service - Abstraction layer for AI model interactions
 * Web application version with client/server support
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AICacheService } from './aiCacheService';
import { getConfig, getModelConfig } from '../config/app';
import { getPrompt, fillPromptTemplate } from '../config/prompts';
import type { UserProfile, JobData, ExtractedJob, AnalysisResult } from '../types';

// JSON Schemas for responses.create API
const JobExtractionSchema = {
  type: "object",
  properties: {
    job_description_link: { type: ["string", "null"] },
    portal_link: { type: ["string", "null"] },
    date_posted: { type: ["string", "null"] },
    company_name: { type: ["string", "null"] },
    german_required: { enum: ["DE", "EN", "both", "unknown"] },
    werkstudent: { type: ["boolean", "null"] },
    work_mode: { enum: ["Remote", "Onsite", "Hybrid", "Unknown"] },
    location_city: { type: ["string", "null"] },
    location_country: { type: ["string", "null"] },
    hiring_manager: { type: ["string", "null"] },
    tasks_responsibilities: {
      type: "array",
      items: { type: "string" }
    },
    nice_to_have: {
      type: "array",
      items: { type: "string" }
    },
    benefits: {
      type: "array",
      items: { type: "string" }
    },
    named_skills_tools: { type: "array", items: { type: "string" } },
    important_statements: { type: "array", items: { type: "string" } }
  },
  required: [
    "job_description_link", "portal_link", "date_posted", "company_name",
    "german_required", "werkstudent", "work_mode", "location_city", 
    "location_country", "hiring_manager", "tasks_responsibilities",
    "nice_to_have", "benefits", "named_skills_tools", "important_statements"
  ],
  additionalProperties: false
};

const ProfileExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    personal_details: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        date_of_birth: { type: "string" },
        nationality: { type: "string" },
        gender: { type: "string" },
        contact: {
          type: "object",
          additionalProperties: false,
          properties: {
            phone: { type: "string" },
            email: { type: "string" },
            address: { type: "string" },
            linkedin: { type: "string" }
          },
          required: ["phone", "email", "address", "linkedin"]
        }
      },
      required: ["name", "date_of_birth", "nationality", "gender", "contact"]
    },
    professional_title: { type: "string" },
    professional_summary: { type: "string" },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          degree: { type: "string" },
          field_of_study: { type: "string" },
          institution: { type: "string" },
          duration: { type: "string" },
          year: { type: "string" },
          location: { type: "string" }
        },
        required: ["degree", "field_of_study", "institution", "duration", "year", "location"]
      }
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          institution: { type: "string" },
          date: { type: "string" }
        },
        required: ["title", "institution"]  // date is optional
      }
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          duration: { type: "string" },
          responsibilities: { type: "array", items: { type: "string" } }
        },
        required: ["company", "position", "duration", "responsibilities"]
      }
    },
    skills: {
      type: "object",
      additionalProperties: false,
      properties: {
        technology: { type: "array", items: { type: "string" } },
        soft_skills: { type: "array", items: { type: "string" } },
        design: { type: "array", items: { type: "string" } }
      },
      required: ["technology", "soft_skills", "design"]
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          language: { type: "string" },
          proficiency: { type: "string" }
        },
        required: ["language", "proficiency"]
      }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      }
    },
    custom_sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                subtitle: { type: "string" },
                date: { type: "string" },
                description: { type: "string" }
              },
              required: ["title", "subtitle", "date", "description"]
            }
          }
        },
        required: ["title", "items"]
      }
    }
  },
  required: [
    "personal_details", "professional_title", "professional_summary",
    "education", "certifications", "experience", "skills", "languages", "projects", "custom_sections"
  ]
};

const SkillsOrganizationSchema = {
  type: "object",
  properties: {
    organized_categories: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          skills: { type: "array", items: { type: "string" } },
          suggestions: { type: "array", items: { type: "string" } },
          reasoning: { type: "string" }
        },
        required: ["skills", "suggestions", "reasoning"],
        additionalProperties: false
      }
    },
    profile_assessment: {
      type: "object",
      properties: {
        career_focus: { type: "string" },
        skill_level: { type: "string" },
        recommendations: { type: "string" }
      },
      required: ["career_focus", "skill_level", "recommendations"],
      additionalProperties: false
    },
    category_mapping: {
      type: "object",
      additionalProperties: { type: "string" }
    }
  },
  required: ["profile_assessment"],
  additionalProperties: false
};

const CategorySuggestionsSchema = {
  type: "object",
  properties: {
    suggestions: { type: "array", items: { type: "string" } }
  },
  required: ["suggestions"],
  additionalProperties: false
};

class LLMService {
  private client: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  /**
   * Initialize OpenAI client with proper configuration
   */
  initializeClient() {
    // Only initialize on server side
    if (typeof window !== 'undefined') {
      throw new Error('LLM service should only be used on server side');
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      if (getConfig('ERROR_HANDLING.ENABLE_MOCK_RESPONSES')) {
        return this.createMockClient();
      }
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    return new OpenAI({ apiKey });
  }

  /**
   * Initialize Anthropic Claude client
   */
  initializeAnthropicClient() {
    if (typeof window !== 'undefined') {
      throw new Error('Anthropic client should only be used on server side');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    return new Anthropic({ apiKey });
  }

  /**
   * Create mock client for testing/offline mode
   */
  createMockClient() {
    const mockResponses = getConfig('ERROR_HANDLING.MOCK_RESPONSES');
    
    return {
      chat: {
        completions: {
          create: async ({ messages }: { messages: unknown[] }) => {
            const lastMessage = messages[messages.length - 1]?.content || '';
            console.warn('🤖 Using mock LLM responses - set OPENAI_API_KEY for real AI');
            
            return { 
              choices: [{ 
                message: { 
                  content: JSON.stringify(mockResponses) 
                } 
              }] 
            };
          }
        }
      }
    } as unknown;
  }

  /**
   * Get client instance (lazy initialization)
   */
  private getClient() {
    if (!this.client) {
      this.client = this.initializeClient();
    }
    return this.client;
  }

  /**
   * Create JSON response with schema validation using Chat Completions API
   * Supports OpenAI models with structured outputs and fallback
   */
  async createJsonResponse<T>({
    model = 'gpt-4o-mini',
    system,
    user,
    schema,
    temperature = 0.2,
    maxTokens = 1000,
    retries = 3,
  }: {
    model?: string;
    system: string;
    user: string;
    schema: Record<string, unknown>;
    temperature?: number;
    maxTokens?: number;
    retries?: number;
  }): Promise<T> {
    const client = this.getClient();
    let lastErr: unknown;

    // Build payload for caching
    const payload = { model, system, user, schema }

    // Try cache first
    const cached = await AICacheService.get(model, payload)
    if (cached) {
      console.log('📦 Using cached response for model:', model);
      return cached as T
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🚀 Using chat.completions API with structured outputs: ${model} (attempt ${attempt}/${retries})`);
        console.log('📊 Request details - maxTokens:', maxTokens, 'temperature:', temperature);
        
        const response = await client!.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'Result', schema, strict: true },
          },
          // Standard OpenAI models configuration
          ...(model === 'gpt-4o'
            ? {
                max_tokens: maxTokens,
                temperature
              }
            : { max_tokens: maxTokens, temperature }),
        });

        const content = response.choices?.[0]?.message?.content || '{}';
        
        if (!content || content.trim() === '{}') {
          console.error('🔴 createJsonResponse got empty content from API');
          throw new Error('API returned empty JSON content');
        }
        
        console.log('✅ Got valid response from API, content length:', content.length);
        
        // Attempt JSON parsing with repair fallback
        let parsed: T;
        try {
          parsed = JSON.parse(content) as T;
        } catch (parseError) {
          console.log('🔧 JSON parse failed, attempting repair...');
          try {
            const repairedData = await this.repairMalformedJson(content, 'JOB_EXTRACTION');
            parsed = repairedData as T;
            console.log('✅ JSON repair successful');
          } catch (repairError) {
            console.error('🔴 JSON repair also failed:', repairError);
            throw parseError; // Throw original parse error
          }
        }
        
        // Save to cache
        await AICacheService.set(model, payload, parsed)
        console.log('💾 Saved response to cache');
        return parsed
      } catch (e) {
        lastErr = e;
        console.error(`🔴 Attempt ${attempt}/${retries} failed for model ${model}:`, (e as Error).message);
        console.error('🔴 Full error:', e);
        
        if (attempt < retries) {
          const delay = 250 * attempt + Math.floor(Math.random() * 100);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    console.error('🔴 All attempts exhausted, throwing final error');
    throw lastErr ?? new Error('All attempts failed');
  }

  /**
   * Create JSON completion with retry logic and model fallback
   */
  async createJsonCompletion(options: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    model?: string;
    allowArray?: boolean;
  }): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const {
      messages,
      temperature,
      max_tokens = getConfig('OPENAI.DEFAULT_MAX_TOKENS'),
      model = getConfig('OPENAI.DEFAULT_MODEL'),
      allowArray = false
    } = options;

    // Set temperature based on options
    const effectiveTemperature = temperature ?? getConfig('OPENAI.DEFAULT_TEMPERATURE');

    const modelConfig = getModelConfig(model);
    const fallbackModels = getConfig('OPENAI.FALLBACK_MODELS');
    const modelsToTry = [model, ...fallbackModels].filter(Boolean);
    
    let lastError = null;
    const maxRetries = getConfig('ERROR_HANDLING.MAX_RETRIES');
    const client = this.getClient();
    
    // Build cache payload
    const payloadBase = { messages, allowArray }
    
    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const payload = { ...payloadBase, model: modelName, max_tokens, temperature: effectiveTemperature }
          const cached = await AICacheService.get(modelName, payload)
          if (cached) {
            return cached
          }
          const response = await client!.chat.completions.create({
            model: modelName,
            ...(allowArray ? {} : { response_format: { type: 'json_object' } }),
            messages: messages as unknown,
            // Standard OpenAI models configuration
            temperature: effectiveTemperature,
            max_tokens: Math.min(max_tokens, modelConfig?.max_tokens || max_tokens)
          });
          
          return response;
          
        } catch (error) {
          lastError = error;
          console.warn(`Attempt ${attempt}/${maxRetries} failed for model ${modelName}:`, (error as Error).message);
          
          if (attempt < maxRetries) {
            const delay = getConfig('ERROR_HANDLING.RETRY_DELAY_MS') * attempt;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    
    throw lastError || new Error('All completion attempts failed');
  }

  /**
   * Extract job information from raw job data  
   * Now uses responses.create API for better reliability and schema validation
   */
  async extractJobInfo(jobData: unknown): Promise<ExtractedJob> {
    const systemPrompt = getPrompt('JOB_EXTRACTION', 'SYSTEM');
    const userPrompt = fillPromptTemplate(
      getPrompt('JOB_EXTRACTION', 'USER_TEMPLATE'),
      { JOB_DATA: JSON.stringify(jobData, null, 2) }
    );

    try {
      // Use new responses.create API with schema validation
      return await this.createJsonResponse<ExtractedJob>({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for job extraction
        system: systemPrompt,
        user: userPrompt,
        schema: JobExtractionSchema,
        temperature: 0.3,
        maxTokens: 1200,
        retries: 3
      });
    } catch (error) {
      // Fallback to original method if new API fails
      console.warn('🔄 Job extraction responses API failed, falling back to original method:', (error as Error).message);
      
      const response = await this.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1200
      });

      const content = response.choices?.[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Attempt JSON repair (keeping existing logic)
        return await this.repairMalformedJson(content, 'JOB_EXTRACTION');
      }
    }
  }

  /**
   * Parse job information only (no company research) to reduce token costs
   */
  async parseJobInfoOnly(jobData: unknown): Promise<ExtractedJob> {
    console.log('📋 === PARSING JOB INFO ONLY (NO COMPANY RESEARCH) ===');
    console.log('📋 Job Title:', jobData.title);
    console.log('📋 Company:', jobData.companyName);

    const systemPrompt = `You are a job analysis expert. Extract comprehensive job information from job postings WITHOUT performing web research.

UNIVERSAL TRANSLATION RULE - APPLIES TO ALL JOBS:
**ALL OUTPUT MUST BE IN ENGLISH - NO EXCEPTIONS**
- Every skill, responsibility, benefit, requirement MUST be translated to English
- If input is German: translate everything to English
- If input is already English: keep it in English
- NO German words should appear in ANY output field
- This is a UNIVERSAL rule that applies to EVERY job, EVERY field, EVERY time

CRITICAL: For skills extraction, focus on:
1. Extract actual skills from job responsibilities (e.g., "Content Marketing", "Social Media Strategy", "Google Analytics") 
2. NOT platform names or tools mentioned as context (avoid "LinkedIn", "Facebook" unless they're the actual skill being required)
3. Extract technologies, methodologies, and professional skills explicitly mentioned
4. Include both hard skills (technical) and soft skills (communication, leadership)

CLEAN ARRAY FORMATTING: For content sections (tasks_responsibilities, nice_to_have, benefits, who_we_are_looking_for), return clean arrays of individual items:
- Extract each responsibility, requirement, or benefit as a separate item
- Remove markdown formatting, bullet points, and headers
- Return clean, readable text suitable for professional display
- No emojis, no markdown symbols, no formatting markup
- Each array item should be a complete, standalone sentence or phrase

CRITICAL TRANSLATION REQUIREMENT - UNIVERSAL RULE FOR ALL JOBS:
**EVERYTHING MUST BE IN ENGLISH - NO EXCEPTIONS**
- ALL skills must be translated (e.g., "Datenanalyse" → "Data Analysis", "Präsentationserstellung" → "Presentation Creation")
- ALL responsibilities must be translated (e.g., "Unterstützung des Teams" → "Supporting the team")
- ALL benefits must be translated (e.g., "Flexible Arbeitszeiten" → "Flexible working hours")
- ALL requirements must be translated to English
- ALL content sections must be in English
- If original is German, translate it. If original is English, keep it in English
- Use professional, industry-standard English terminology
- DO NOT return any German text in the output

Extract information directly from the provided job posting text only. Do NOT make assumptions or add external knowledge about the company.`;

    const userPrompt = `EXTRACT JOB INFORMATION FROM THIS POSTING:

JOB DATA:
${JSON.stringify(jobData, null, 2)}

🚨 CRITICAL SKILL EXTRACTION REQUIREMENT:
You MUST extract 15-30+ skills from the "named_skills_tools" field. This is NOT optional.
- Extract ALL tools, software, platforms, methodologies explicitly mentioned
- Extract competencies from action verbs (e.g., "Durchführung von Analysen" → "Data Analysis")
- Extract educational fields as skills (e.g., "Wirtschaftsingenieurwesen" → "Industrial Engineering")
- Extract ALL soft skills mentioned in requirements (e.g., "strukturierte Arbeitsweise" → "Structured Work Approach")
- Extract language requirements (e.g., "sehr gute Deutschkenntnisse" → "German Language Proficiency")
- If a tool category is mentioned (e.g., "MS Power Platform"), also extract specific tools (e.g., "Power Apps", "Power Automate")
- If a methodology is mentioned (e.g., "Lean"), also extract related skills (e.g., "Lean Methods", "Lean Manufacturing")

DO NOT BE CONSERVATIVE. Extract MORE skills, not fewer.

REQUIRED JSON OUTPUT:
{
  "job_description_link": string | null,
  "portal_link": string | null,
  "date_posted": string | null,
  "company_name": string | null, // Extract the ACTUAL HIRING COMPANY NAME from the job posting
  "german_required": "DE" | "EN" | "both" | "unknown", // Use "EN" if job is in English with no German language requirements mentioned
  "werkstudent": boolean | null,
  "work_mode": "Remote" | "Onsite" | "Hybrid" | "Unknown",
  "location_city": string | null, // ONLY city name (e.g., "Berlin", "Munich", "Hamburg") - NO addresses, postal codes, or districts
  "location_country": string | null, // ONLY country name (e.g., "Germany", "Austria", "Switzerland")
  "hiring_manager": string | null,
  "tasks_responsibilities": string[], // Job responsibilities/duties - ALWAYS IN ENGLISH (translate if needed) - Extract as individual bullet points
  "nice_to_have": string[], // ONLY items explicitly marked as optional/preferred/nice-to-have/advantageous - ALWAYS IN ENGLISH - Extract as individual bullet points
  "benefits": string[], // Perks and benefits - ALWAYS IN ENGLISH (translate if needed) - Extract as individual bullet points
  "who_we_are_looking_for": string[], // Required qualifications, education, experience - ALWAYS IN ENGLISH - Extract as individual bullet points, NOT as a paragraph
  "application_requirements": string[], // What to send in the application (e.g., CV, cover letter, portfolio, transcripts) - ALWAYS IN ENGLISH - Extract as individual bullet points
  "named_skills_tools": string[], // IMPORTANT: Extract ACTUAL skills from job responsibilities, not just platform names - IN ENGLISH
  "important_statements": string[] // Key requirements or statements - IN ENGLISH
}

SKILLS EXTRACTION RULES - EXTRACT COMPREHENSIVELY FOR ALL INDUSTRIES:
Extract EVERY skill, tool, technology, platform, competency, certification, software, and methodology mentioned in the job description. Be thorough and exhaustive across ALL industries.

⚠️ IMPORTANT EXAMPLES OF EXHAUSTIVE EXTRACTION:

EXAMPLE 1 - Marketing Job:
Job mentioning: "manage social media, create content in Canva, analyze data in Google Analytics, coordinate with design team, write blog posts, organize events, communicate with clients, maintain CRM database, assist with email campaigns in Mailchimp, track KPIs"

❌ BAD (Only 5 skills): Social Media Management, Canva, Google Analytics, Email Marketing, CRM
✅ GOOD (20+ skills): Social Media Management, Content Creation, Canva, Graphic Design, Data Analysis, Google Analytics, Team Coordination, Cross-functional Collaboration, Copywriting, Blog Writing, Event Planning, Event Management, Client Communication, Stakeholder Management, CRM Systems, Database Management, Email Marketing, Mailchimp, Marketing Analytics, KPI Tracking, Project Coordination, Marketing Campaigns, Performance Tracking

EXAMPLE 2 - Engineering/Technical Job:
Job mentioning: "Lean-Methoden, Smart Factory, Analysen durchführen, digitale Werkzeuge, MS 365, MS Power Platform, Programmiersprachen, strukturierte Arbeitsweise, Prozesse in der Produktion, IT-Systemen, Wirtschaftsingenieurwesen, eigenständige Teilprojekte, interdisziplinären Umfeld"

❌ BAD (Only 6 skills): Lean Methods, Digital Tools, MS 365, MS Power Platform, Digitalization, IT Systems
✅ GOOD (22+ skills): Lean Methods, Lean Manufacturing, Smart Factory, Industry 4.0, Data Analysis, Digital Tools, MS 365, MS Office, MS Power Platform, Power Automate, Power Apps, Programming, Programming Languages, Structured Work Approach, Production Processes, Production Management, IT Systems, Process Optimization, Industrial Engineering, Project Management, Interdisciplinary Collaboration, Cross-functional Teamwork, Process Analysis, Digitalization, IT/OT Integration, German Language Proficiency

⚠️ TWO-STEP EXTRACTION PROCESS:
STEP 1: Read the ENTIRE job description and extract ALL mentioned skills, tools, competencies
STEP 2: Review your extraction - Ask yourself: "Did I miss ANY skills, tools, software, methodologies, or competencies mentioned ANYWHERE in the description? Check responsibilities, requirements, nice-to-have, benefits, company info"

COMPREHENSIVE SKILL CATEGORIES (Extract from ALL of these):

**TECHNOLOGY & SOFTWARE:**
1. Programming Languages: Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, R, MATLAB, etc.
2. Web Frameworks: React, Angular, Vue, Next.js, Django, Flask, Express, Spring, Laravel, etc.
3. Mobile Development: iOS Development, Android Development, Flutter, React Native, SwiftUI, etc.
4. AI/ML: TensorFlow, PyTorch, ChatGPT, Claude, GPT-4, Machine Learning, Deep Learning, NLP, Computer Vision, Stable Diffusion, etc.
5. Data Science: Data Analysis, Data Visualization, Statistical Analysis, Predictive Modeling, R, Python, Jupyter, etc.
6. Databases: PostgreSQL, MySQL, MongoDB, Redis, Oracle, SQL Server, Supabase, Firebase, etc.
7. Cloud & DevOps: AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Jenkins, GitHub Actions, Terraform, etc.
8. Design Tools: Figma, Adobe Creative Suite, Photoshop, Illustrator, InDesign, Sketch, Canva, AutoCAD, etc.
9. Business Tools: Excel, Power BI, Tableau, SAP, Salesforce, HubSpot, Google Analytics, etc.
10. Collaboration: Jira, Confluence, Slack, Notion, Asana, Trello, Microsoft Teams, etc.

**FINANCE & ACCOUNTING:**
11. Financial Analysis, Financial Modeling, Valuation, DCF, Financial Reporting, GAAP, IFRS
12. Accounting Software: SAP, Oracle Financials, QuickBooks, Xero, DATEV
13. Investment: Portfolio Management, Asset Management, Risk Management, Trading, Bloomberg Terminal
14. Banking: Credit Analysis, Loan Processing, KYC, AML, Compliance
15. Tax: Tax Preparation, Tax Planning, Tax Law, VAT
16. Corporate Finance: M&A, Due Diligence, FP&A, Budgeting, Forecasting
17. Excel Skills: Financial Modeling, Pivot Tables, VLOOKUP, Macros, VBA

**HEALTHCARE & MEDICINE:**
18. Clinical Skills: Patient Care, Vital Signs, Medical Terminology, Diagnosis, Treatment Planning
19. Medical Software: Epic, Cerner, MEDISTAR, Practice Management Systems
20. Healthcare Administration: Medical Billing, Coding (ICD-10, CPT), Claims Processing, HIPAA
21. Laboratory: Lab Techniques, Quality Control, Sample Analysis, Lab Equipment Operation
22. Pharmacy: Medication Management, Prescription Processing, Drug Interactions
23. Research: Clinical Research, Data Collection, Protocol Development, IRB Compliance

**LEGAL:**
24. Legal Research, Contract Law, Contract Drafting, Legal Writing, Due Diligence
25. Compliance: Regulatory Compliance, GDPR, Data Protection, Corporate Governance
26. Intellectual Property: Patent Law, Trademark Law, Copyright
27. Litigation: Case Management, Discovery, Depositions
28. Legal Software: Westlaw, LexisNexis, Document Management Systems

**ENGINEERING & MANUFACTURING:**
29. CAD Software: AutoCAD, SolidWorks, CATIA, Inventor, Fusion 360, Creo
30. Manufacturing: Lean Manufacturing, Six Sigma, Kaizen, 5S, Quality Control
31. Production: Production Planning, Process Optimization, Supply Chain Management
32. Engineering: Mechanical Engineering, Electrical Engineering, Civil Engineering, Chemical Engineering
33. Testing: Quality Assurance, Testing Protocols, Failure Analysis, Test Equipment
34. Automotive: Vehicle Systems, Engine Development, Automotive Testing, ADAS

**ARCHITECTURE & CONSTRUCTION:**
35. CAD: AutoCAD, Revit, SketchUp, ArchiCAD, Rhino
36. BIM: Building Information Modeling, BIM Coordination, Clash Detection
37. Construction: Project Management, Site Management, Building Codes, Construction Law
38. Planning: Urban Planning, Site Planning, Zoning, Permits
39. Sustainability: LEED, Green Building, Energy Efficiency, Sustainable Design

**MARKETING & SALES:**
40. Digital Marketing: SEO, SEM, PPC, Google Ads, Facebook Ads, Content Marketing
41. Social Media: Social Media Management, Instagram, TikTok, LinkedIn, YouTube, Community Management
42. Email Marketing: Mailchimp, Campaign Monitor, Newsletter Design, A/B Testing
43. Sales: B2B Sales, B2C Sales, Lead Generation, CRM, Salesforce, Pipeline Management
44. Content: Content Creation, Copywriting, Storytelling, Video Production, Photography
45. Analytics: Google Analytics, Marketing Analytics, Conversion Rate Optimization, KPI Tracking

**RETAIL & E-COMMERCE:**
46. Retail Operations: Inventory Management, Merchandising, Visual Merchandising, POS Systems
47. E-Commerce: Shopify, WooCommerce, Magento, Amazon Seller, eBay
48. Customer Service: Customer Support, Complaint Resolution, CRM
49. Supply Chain: Logistics, Procurement, Vendor Management, Order Fulfillment

**HOSPITALITY & EVENTS:**
50. Event Planning: Event Management, Conference Planning, Wedding Planning, Venue Selection
51. Catering: Menu Planning, Food Service, Banquet Operations
52. Hotel Management: Front Desk, Reservations, Guest Services, Hotel Software (Opera, Fidelio)
53. Tourism: Tour Planning, Travel Coordination, Destination Management

**HR & ADMINISTRATION:**
54. Recruiting: Talent Acquisition, Interviewing, Candidate Sourcing, ATS Systems
55. HR Management: Employee Relations, Performance Management, HRIS, Payroll
56. Training: Training & Development, Onboarding, Learning Management Systems
57. Office Management: Administrative Support, Scheduling, Office Coordination

**LOGISTICS & SUPPLY CHAIN:**
58. Warehouse Management: WMS, Inventory Control, Order Picking, Packing
59. Transportation: Route Planning, Fleet Management, Freight Forwarding
60. Procurement: Sourcing, Vendor Negotiation, Purchase Orders, Supplier Management

**MEDIA & COMMUNICATIONS:**
61. Journalism: Writing, Editing, Reporting, Interviewing
62. PR: Public Relations, Press Releases, Media Relations, Crisis Communication
63. Broadcasting: Video Production, Audio Production, Editing (Premiere, Final Cut Pro)
64. Graphic Design: Layout Design, Typography, Branding, Print Design

**EDUCATION & RESEARCH:**
65. Teaching: Curriculum Development, Lesson Planning, Classroom Management, Assessment
66. Research: Research Design, Literature Review, Data Analysis, Academic Writing, Grant Writing
67. Tutoring: Subject Matter Expertise, Test Preparation, Mentoring

**LANGUAGE & TRANSLATION:**
68. Languages: German, English, French, Spanish, Italian, Chinese, Arabic, etc.
69. Translation: Translation, Interpretation, Localization, Proofreading
70. Language Proficiency: Native, Fluent, Advanced, Intermediate, Basic

**SOFT SKILLS & COMPETENCIES:**
71. Communication: Presentation Skills, Public Speaking, Technical Writing, Report Writing
72. Leadership: Team Leadership, People Management, Mentoring, Decision Making
73. Problem Solving: Analytical Thinking, Critical Thinking, Creative Problem Solving
74. Organization: Time Management, Prioritization, Multi-tasking, Attention to Detail
75. Collaboration: Teamwork, Cross-functional Collaboration, Stakeholder Management
76. Adaptability: Flexibility, Learning Agility, Change Management

EXTRACTION RULES:
✅ **ALWAYS Extract**:
- Every tool, software, platform, or technology explicitly mentioned
- All programming languages and frameworks
- All methodologies and processes (Agile, Scrum, Lean, Six Sigma, etc.)
- All certifications and licenses
- All industry-specific software and tools
- All technical skills and domain expertise
- All soft skills explicitly mentioned
- All languages and language requirements
- Tools mentioned in ANY format (acronyms, full names, etc.)

❌ **DON'T Extract as Skills** (unless the job is specifically about them):
- Generic social media platforms for posting only (LinkedIn, Facebook, Instagram)
- Basic office tools unless specifically required
- Company names unless they're also skills (e.g., "SAP" is both)

🚨 CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. Read the ENTIRE job description from start to finish - EVERY sentence matters
2. Extract skills from ALL sections: responsibilities, requirements, nice-to-have, benefits, company description, qualifications
3. Include BOTH technical AND soft skills - do not focus only on technical
4. Preserve exact names as written (including version numbers if mentioned)
5. Extract skills from ANY industry - tech, finance, healthcare, legal, retail, manufacturing, hospitality, etc.
6. Be EXHAUSTIVE - aim for 15-30+ skills per job, NOT just 4-5
7. Extract the underlying COMPETENCIES, not just tool names (e.g., if they say "maintain website", extract both "Website Maintenance" AND any tools mentioned)
8. Better to include more than miss important skills - when in doubt, INCLUDE IT
9. **HIRING MANAGER EXTRACTION:** Look for hiring manager names in phrases like "Contact: [Name]", "Your contact: [Name]", "Ansprechpartner: [Name]", "Your hiring manager: [Name]", or email signatures
10. After extraction, VERIFY: Review the description again and ask "Did I miss anything?"

⚠️ FINAL VERIFICATION CHECKPOINT:
Before returning your response, count your extracted skills. If you have less than 12 skills, you MISSED SOMETHING. Go back and extract more thoroughly.

CRITICAL RULES FOR "nice_to_have":
- ONLY include items explicitly marked with keywords: "preferred", "nice to have", "advantageous", "plus", "bonus", "desirable", "would be nice", "optional"
- Everything else goes in "tasks_responsibilities"
- When in doubt, put it in "tasks_responsibilities"

LANGUAGE RULES:
- If job is in German: translate ALL text to English
- If job is in English: keep as-is
- Use professional terminology
- Preserve technical terms and proper nouns

🎯 FINAL MANDATORY SKILL EXTRACTION CHECKLIST:
Before submitting your response, ensure you extracted skills from ALL of these sources:
1. ✅ Explicit tools/software mentioned (MS 365, SAP, Python, etc.)
2. ✅ Action verbs → competencies (e.g., "Durchführung von Analysen" → "Data Analysis", "Programmierung" → "Programming")
3. ✅ Study fields/qualifications mentioned (e.g., "Wirtschaftsingenieurwesen" → "Industrial Engineering")
4. ✅ Methodologies mentioned (e.g., "Lean-Methoden" → "Lean Methods", "Agile" → "Agile Methodology")
5. ✅ Domain expertise (e.g., "Smart Factory" → "Smart Factory", "Produktion" → "Production Management")
6. ✅ Soft skills in requirements (e.g., "strukturierte Arbeitsweise" → "Structured Work Approach")
7. ✅ Language requirements (e.g., "sehr gute Deutschkenntnisse" → "German Language Proficiency")
8. ✅ Certifications or specific knowledge areas mentioned

🔍 SKILL COUNT VERIFICATION:
- Most jobs should yield 15-30+ skills
- If you have less than 12 skills, you are NOT being exhaustive enough
- Review the description ONE MORE TIME and extract what you missed

Focus on skills that would be valuable for vector database matching with user profiles.`;

    const response = await this.createJsonCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7, // Higher temperature for exhaustive extraction (0.7 for more creativity)
      max_tokens: 2500, // Increased to accommodate 15-30+ skills per job
      model: 'gpt-4o-mini' // Use cost-effective model
    });

    const content = response.choices?.[0]?.message?.content || '{}';
    
    try {
      const result = JSON.parse(content);
      console.log('📋 Extracted skills:', result.named_skills_tools);
      console.log('📋 Job parsing completed successfully');
      return result;
    } catch (parseError) {
      console.warn('📋 Job parsing failed, attempting repair');
      return await this.repairMalformedJson(content, 'JOB_EXTRACTION');
    }
  }

  /**
   * Enhanced job extraction with web research capabilities (EXPENSIVE - use parseJobInfoOnly + smartCompanyResearch separately)
   * @deprecated Use parseJobInfoOnly() + smartCompanyResearch() separately to reduce costs
   */
  async extractJobInfoWithResearch(jobData: unknown): Promise<ExtractedJob> {
    console.log('🔍🌐 === STARTING ENHANCED JOB EXTRACTION WITH WEB RESEARCH ===');
    console.log('🔍🌐 Job Title:', jobData.title);
    console.log('🔍🌐 Company:', jobData.companyName);
    console.log('🔍🌐 Has Link:', !!jobData.link);

    const systemPrompt = `You are an advanced job analysis AI with web research capabilities. Your task is to extract comprehensive job information while performing intelligent web searches to gather additional company and role details.

CAPABILITIES:
1. Parse job postings for standard information
2. Research companies using web search
3. Find hiring manager information where possible
4. Gather detailed company information (size, culture, recent news)
5. Analyze job posting links for additional details
6. Cross-reference information for accuracy

RESEARCH APPROACH:
- Use the company name to search for company information, leadership, and recent updates
- If a job portal link is provided, analyze what additional information might be available
- Look for hiring manager names in the job description or company leadership
- Research company culture, benefits, and employee reviews
- Find company size, funding, and industry position

Return comprehensive job information with research-enhanced details in JSON format.`;

    const userPrompt = `ANALYZE AND RESEARCH THIS JOB POSTING:

JOB DATA:
${JSON.stringify(jobData, null, 2)}

RESEARCH TASKS:
1. Extract all standard job information
2. Research "${jobData.companyName || 'Unknown Company'}" for comprehensive company intelligence:
   - Foundation year and company history
   - Official website URL
   - Careers page URL
   - Current job posting page URL
   - Employee count and company size category
   - Leadership team and potential hiring managers
   - Company culture, values, and mission
   - Recent funding, acquisitions, or growth announcements
   - Industry position and competitors
   - Employee satisfaction ratings (Glassdoor, etc.)
   - Office locations and remote work policies
   - Notable products, services, or achievements

3. If job portal link provided (${jobData.link || 'none'}), analyze for additional job-specific details

4. Cross-reference job requirements with industry standards and salary benchmarks

ENHANCED OUTPUT REQUIRED:
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
  "important_statements": string[],
  "company_research": {
    "founded_year": string | null,
    "official_website": string | null,
    "careers_page": string | null,
    "job_posting_page": string | null,
    "employee_count": string | null,
    "company_size_category": "startup" | "small" | "medium" | "large" | "enterprise" | null,
    "headquarters_location": string | null,
    "office_locations": string[] | null,
    "industry_sector": string | null,
    "business_model": string | null,
    "key_products_services": string[] | null,
    "recent_news": string[] | null,
    "funding_status": string | null,
    "notable_investors": string[] | null,
    "leadership_team": string[] | null,
    "potential_hiring_managers": string[] | null,
    "culture_highlights": string[] | null,
    "company_values": string[] | null,
    "glassdoor_rating": string | null,
    "employee_reviews_summary": string | null,
    "competitors": string[] | null,
    "remote_work_policy": string | null,
    "diversity_initiatives": string[] | null,
    "awards_recognition": string[] | null
  },
  "research_confidence": "high" | "medium" | "low",
  "additional_insights": string[] | null,
  "job_market_analysis": {
    "salary_range_estimate": string | null,
    "demand_level": "high" | "medium" | "low" | null,
    "similar_roles_market": string | null
  }
}

Use your knowledge of companies, industry standards, and typical organizational structures to provide informed research results. Be honest about confidence levels.

Please return the response as a valid JSON object following the schema above.`;

    const response = await this.createJsonCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Slightly higher for creative research
      max_tokens: 2500, // More tokens for comprehensive research
      model: 'gpt-4o-mini' // Use gpt-4o-mini for main extraction
    });

    const content = response.choices?.[0]?.message?.content || '{}';
    
    try {
      const result = JSON.parse(content);
      
      // Use smart research with confidence-based web search for company data
      const smartResearch = await this.smartCompanyResearch(
        jobData.companyName || 'Unknown Company',
        jobData
      );

      console.log('🔍🌐 Smart research completed successfully');
      console.log('🔍🌐 Research confidence:', smartResearch.confidence);
      console.log('🔍🌐 Web search used:', smartResearch.searchUsed);
      console.log('🔍🌐 Estimated cost:', smartResearch.cost);
      
      // Merge smart research results into the job extraction result
      result.company_research = smartResearch.research;
      result.research_metadata = {
        confidence: smartResearch.confidence,
        searchUsed: smartResearch.searchUsed,
        cost: smartResearch.cost
      };
      
      console.log('🔍🌐 Company research confidence:', result.company_research?.research_confidence || 'undefined');
      console.log('🔍🌐 Hiring manager found:', !!result.company_research?.hiring_manager);
      console.log('🔍🌐 Additional insights:', result.additional_insights?.length || 0);
      return result;
    } catch (parseError) {
      console.warn('🔍🌐 Enhanced extraction failed, falling back to standard extraction');
      return await this.extractJobInfo(jobData);
    }
  }

  /**
   * Extract profile from PDF text
   * Now uses responses.create API for better reliability and schema validation
   */
  async extractProfileFromText(resumeText: string): Promise<UserProfile> {
    const systemPrompt = getPrompt('PROFILE_EXTRACTION', 'SYSTEM');
    const userPrompt = fillPromptTemplate(
      getPrompt('PROFILE_EXTRACTION', 'USER_TEMPLATE'),
      { RESUME_TEXT: resumeText }
    );

    try {
      // Use new responses.create API with schema validation
      return await this.createJsonResponse<UserProfile>({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for profile extraction
        system: systemPrompt,
        user: userPrompt,
        schema: ProfileExtractionSchema,
        temperature: 0.3,
        maxTokens: 3500,
        retries: 3
      });
    } catch (error) {
      // Fallback to original method if new API fails
      console.warn('🔄 Responses API failed, falling back to original method:', (error as Error).message);
      
      try {
        const response = await this.createJsonCompletion({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 3500,
          model: 'gpt-4o-mini' // Use stable model for fallback
        });

        const content = response.choices?.[0]?.message?.content;
        
        if (!content || content.trim() === '' || content.trim() === '{}') {
          console.error('🔴 Profile extraction returned empty content from LLM');
          throw new Error('LLM returned empty profile content');
        }
        
        console.log('📝 Raw LLM response content length:', content.length);
        console.log('📝 First 200 chars of response:', content.substring(0, 200));
        
        const parsed = JSON.parse(content);
        
        // Validate the parsed profile has required fields
        if (!parsed || typeof parsed !== 'object' || !parsed.personal_details) {
          console.error('🔴 Parsed profile missing required fields:', parsed);
          throw new Error('Parsed profile is invalid or missing personal_details');
        }
        
        console.log('✅ Successfully parsed profile in fallback mode');
        return parsed;
      } catch (fallbackError) {
        console.error('🔴 Fallback profile extraction failed:', fallbackError);
        // Return a minimal valid profile structure to prevent crashes
        return {
          personal_details: {
            name: 'Unknown',
            email: '',
            phone: '',
            linkedin: '',
            github: '',
            location: ''
          },
          professional_summary: '',
          experience: [],
          education: [],
          skills: {
            technical: [],
            tools: [],
            soft_skills: [],
            languages: []
          },
          projects: [],
          custom_sections: [],
          certifications: [],
          languages: []
        } as unknown as UserProfile;
      }
    }
  }

  /**
   * Analyze job against profile
   */
  async analyzeJobForProfile(jobData: JobData, profileData: UserProfile): Promise<AnalysisResult> {
    const systemPrompt = getPrompt('JOB_PROFILE_ANALYSIS', 'SYSTEM');
    const userPrompt = fillPromptTemplate(
      getPrompt('JOB_PROFILE_ANALYSIS', 'USER_TEMPLATE'),
      { 
        JOB_DATA: JSON.stringify(jobData, null, 2),
        PROFILE_DATA: JSON.stringify(profileData, null, 2)
      }
    );

    const response = await this.createJsonCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 5000
    });

    const content = response.choices?.[0]?.message?.content || '{}';
    
    // Parse with JSON5 support for robustness
    let data: AnalysisResult;
    try {
      data = JSON.parse(content);
    } catch (error) {
      console.warn('Standard JSON parse failed, trying robust parsing:', (error as Error).message);
      try {
        // Fallback to manual JSON repair
        data = JSON.parse(content.replace(/,(\s*[}\]])/g, '$1'));
      } catch (json5Error) {
        console.error('All JSON parsing attempts failed:', (json5Error as Error).message);
        data = {
          fit_summary: ['Error parsing LLM response'],
          cover_letter_markdown: 'Error generating cover letter',
          resume_markdown: 'Error generating resume',
          tailored_resume_data: null
        };
      }
    }

    return data;
  }

  /**
   * Review and enhance profile
   */
  async reviewProfile(profileData: UserProfile): Promise<{
    critique: string[];
    improvement_plan: string[];
    base_resume: unknown;
  }> {
    const systemPrompt = getPrompt('PROFILE_REVIEW', 'SYSTEM');
    const userPrompt = fillPromptTemplate(
      getPrompt('PROFILE_REVIEW', 'USER_TEMPLATE'),
      { PROFILE_DATA: JSON.stringify(profileData, null, 2) }
    );

    const response = await this.createJsonCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1800
    });

    const content = response.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  /**
   * Repair malformed JSON using LLM
   */
  async repairMalformedJson(malformedJson: string, promptCategory: string): Promise<unknown> {
    const schema = this.getSchemaForCategory(promptCategory);
    const systemPrompt = getPrompt(promptCategory, 'JSON_REPAIR_SYSTEM');
    const userPrompt = fillPromptTemplate(
      getPrompt(promptCategory, 'JSON_REPAIR_TEMPLATE'),
      { 
        SCHEMA: schema,
        MALFORMED_JSON: malformedJson 
      }
    );

    const response = await this.createJsonCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 800
    });

    const content = response.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  /**
   * Get schema definition for a prompt category
   */
  getSchemaForCategory(category: string): string {
    const schemas: Record<string, string> = {
      JOB_EXTRACTION: `{
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
      }`
    };
    
    return schemas[category] || '{}';
  }

  /**
   * Generate category-specific skill suggestions
   */
  async generateCategorySkillSuggestions(categoryName: string, profileData: unknown, currentCategorySkills: string[] = []): Promise<string[]> {
    console.log('🎯📂 === STARTING CATEGORY-SPECIFIC SKILL SUGGESTIONS ===');
    console.log('🎯📂 Category:', categoryName);
    console.log('🎯📂 Current skills in category:', currentCategorySkills);

    try {
      if (!this.client) {
        this.client = this.initializeClient();
      }

      // Extract key context from profile for more tailored suggestions
      const experience = profileData?.experience || [];
      const education = profileData?.education || [];
      const currentRole = experience[0]?.position || 'Professional';
      const industry = experience[0]?.company || 'General';
      const allSkills = Object.values(profileData?.skills || {}).flat()
        .map((s: unknown) => typeof s === 'string' ? s : s?.skill || s)
        .filter(Boolean);

      const categoryPrompt = `You are an expert career consultant analyzing a ${currentRole}'s resume.

CATEGORY: "${categoryName}"

PROFESSIONAL BACKGROUND:
- Current/Recent Role: ${currentRole}
- Industry/Company: ${industry}
- Education: ${education.map((e: Record<string, any>) => `${e.degree || ''} in ${e.field_of_study || e.field || ''}`).join(', ') || 'Not specified'}
- Years of Experience: ${experience.length > 0 ? 'Experienced professional' : 'Entry level'}

EXISTING SKILLS PROFILE (shows their skill level):
${allSkills.slice(0, 20).join(', ')}

SKILLS ALREADY IN THIS CATEGORY (avoid duplicates):
${currentCategorySkills.join(', ') || 'None yet'}

TASK: Suggest 5-8 highly relevant skills for the "${categoryName}" category that:
1. Are specifically relevant to someone working as a ${currentRole}
2. Would be natural progressions or complements to their existing skillset
3. Are in-demand in their industry
4. Match the sophistication level of their current skills
5. Are practical skills they could realistically have or quickly develop

Focus on skills that make sense for THIS specific person based on their background, not generic suggestions.
Ensure suggestions are concrete, specific skills (not vague concepts).

Return ONLY a JSON array of skill names:
["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]`;

      try {
        // Use new responses.create API with schema validation
        const result = await this.createJsonResponse<{suggestions: string[]}>({
          model: 'gpt-4o-mini', // Using gpt-4o-mini for structured outputs support (json_schema)
          system: 'You are a career consultant. Generate skill suggestions for the specified category.',
          user: categoryPrompt,
          schema: CategorySuggestionsSchema,
          temperature: 0.7,
          maxTokens: 500,
          retries: 3
        });
        
        console.log('🎯📂 === RESPONSES API SUCCESS ===');
        const suggestions = result.suggestions || [];
        console.log('🎯📂 Category suggestions generated:', suggestions);
        
        return suggestions.filter(skill => 
          typeof skill === 'string' && 
          !currentCategorySkills.some(existing => 
            existing.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(existing.toLowerCase())
          )
        );
      } catch (responsesError) {
        // Fallback to original method if new API fails
        console.warn('🔄 Category suggestions responses API failed, falling back to original method:', (responsesError as Error).message);
        
        const response = await this.createJsonCompletion({
          messages: [
            { role: 'system', content: 'You are a career consultant. Return only a JSON array of skill suggestions.' },
            { role: 'user', content: categoryPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
          allowArray: true // Allow array responses
        });

        const content = response.choices?.[0]?.message?.content || '[]';
        console.log('🎯📂 Raw Response:', content);

        try {
          const suggestions = JSON.parse(content);
          if (Array.isArray(suggestions)) {
            console.log('🎯📂 Category suggestions generated:', suggestions);
            return suggestions.filter(skill => 
              typeof skill === 'string' && 
              !currentCategorySkills.some(existing => 
                existing.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(existing.toLowerCase())
              )
            );
          }
        } catch (parseError) {
          console.warn('🎯📂 Failed to parse category suggestions, using fallback');
        }
      }

      // Fallback suggestions based on category name
      return this.getFallbackCategorySkills(categoryName);

    } catch (error) {
      console.error('🎯📂 Category suggestions failed:', error);
      return this.getFallbackCategorySkills(categoryName);
    }
  }

  /**
   * Fallback category-specific skills
   */
  public getFallbackCategorySkills(categoryName: string): string[] {
    const fallbacks: Record<string, string[]> = {
      'CRM & Administrative Software': ['Salesforce', 'HubSpot', 'Microsoft CRM', 'Customer Service', 'Data Entry', 'Process Management'],
      'Marketing': ['Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'SEO', 'Email Marketing', 'Analytics'],
      'Finance': ['Financial Analysis', 'Budgeting', 'Excel', 'QuickBooks', 'Financial Reporting', 'Accounting'],
      'Project Management': ['Agile', 'Scrum', 'Jira', 'Trello', 'Risk Management', 'Stakeholder Management'],
      'Development Tools': ['Git', 'Docker', 'Jenkins', 'Webpack', 'npm', 'VS Code'],
      'Design': ['Adobe Creative Suite', 'Sketch', 'InVision', 'Prototyping', 'User Research', 'Wireframing'],
      'Communication': ['Public Speaking', 'Technical Writing', 'Presentation Skills', 'Team Collaboration', 'Negotiation']
    };

    // Try to find a match for the category
    const lowerCategoryName = categoryName.toLowerCase();
    for (const [key, skills] of Object.entries(fallbacks)) {
      if (lowerCategoryName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategoryName)) {
        return skills;
      }
    }

    // If no specific match, return generic business skills
    return ['Communication', 'Problem Solving', 'Time Management', 'Teamwork', 'Leadership'];
  }

  /**
   * Intelligent skill organization and suggestions based on user profile
   */
  async organizeSkillsIntelligently(profileData: unknown, currentSkills: unknown): Promise<unknown> {
    console.log('🧠🎯 === STARTING INTELLIGENT SKILL ORGANIZATION ===');
    console.log('🧠🎯 Profile Keys:', Object.keys(profileData || {}));
    console.log('🧠🎯 Current Skills:', JSON.stringify(currentSkills, null, 2));

    try {
      if (!this.client) {
        console.log('🧠🎯 LLM Client not initialized, initializing now...');
        this.client = this.initializeClient();
      }

      // Determine career level from experience
      const careerLevel = this.determineCareerLevel(profileData);
      console.log('🧠🎯 Determined career level:', careerLevel);

      const systemPrompt = getPrompt('SKILL_ORGANIZATION', 'SYSTEM');
      const userPrompt = fillPromptTemplate(
        getPrompt('SKILL_ORGANIZATION', 'USER_TEMPLATE'),
        { 
          PROFILE_DATA: JSON.stringify(profileData, null, 2),
          CURRENT_SKILLS: JSON.stringify(currentSkills, null, 2),
          CAREER_LEVEL: careerLevel
        }
      );

      console.log('🧠🎯 === GPT PROMPTS ===');
      console.log('🧠🎯 Career Level:', careerLevel);
      console.log('🧠🎯 User Prompt Length:', userPrompt.length);

      console.log('🧠🎯 === CALLING GPT API ===');
      
      let organization;
      try {
        // Use new responses.create API with schema validation
        organization = await this.createJsonResponse<unknown>({
          model: 'gpt-4o-mini', // Using gpt-4o-mini for skills organization
          system: systemPrompt,
          user: userPrompt,
          schema: SkillsOrganizationSchema,
          temperature: 0.3,
          maxTokens: 3000,
          retries: 3
        });
        
        console.log('🧠🎯 === RESPONSES API SUCCESS ===');
        console.log('🧠🎯 Categories:', Object.keys(organization.organized_categories || {}));
      } catch (responsesError) {
        // Fallback to original method if new API fails
        console.warn('🔄 Skills organization responses API failed, falling back to original method:', (responsesError as Error).message);
        
        const response = await this.createJsonCompletion({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please analyze this profile and organize skills intelligently. Return your response in valid JSON format:

${userPrompt}` }
          ],
          temperature: 0.3,
          max_tokens: 3000
        });

        console.log('🧠🎯 === FALLBACK GPT RESPONSE ===');
        console.log('🧠🎯 Response received, parsing...');
        
        const content = response.choices?.[0]?.message?.content || '{}';
        console.log('🧠🎯 Raw Content Length:', content.length);
        
        try {
          organization = JSON.parse(content);
          console.log('🧠🎯 Parsed Successfully - Categories:', Object.keys(organization.organized_categories || {}));
        } catch (parseError) {
          console.error('🧠🎯 JSON Parse Error:', parseError);
          console.log('🧠🎯 Attempting JSON Repair...');
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            organization = JSON.parse(jsonMatch[0]);
            console.log('🧠🎯 Repair Successful');
          } else {
            throw parseError;
          }
        }
      }
      
      console.log('🧠🎯 === FINAL RESULT ===');
      console.log('🧠🎯 Categories Created:', Object.keys(organization.organized_categories || {}).length);
      console.log('🧠🎯 Profile Assessment:', organization.profile_assessment?.career_focus);
      
      return organization;
    } catch (error) {
      console.error('🧠🎯 === INTELLIGENT ORGANIZATION FAILED ===');
      console.error('🧠🎯 Error:', error);
      
      // Minimal fallback - basic categories
      return {
        organized_categories: {
          "Core Skills": {
            skills: [],
            suggestions: ["Communication", "Problem Solving", "Time Management"],
            reasoning: "Essential professional skills"
          },
          "Technical Skills": {
            skills: [],
            suggestions: ["Microsoft Office", "Data Analysis", "Project Management"],
            reasoning: "Basic technical competencies"
          }
        },
        profile_assessment: {
          career_focus: "Professional Development",
          skill_level: "entry",
          recommendations: "Build foundational skills"
        },
        category_mapping: {}
      };
    }
  }

  /**
   * Determine career level from profile data
   */
  private determineCareerLevel(profileData: unknown): string {
    if (!profileData?.experience) return 'entry';
    
    const experience = profileData.experience;
    if (!Array.isArray(experience)) return 'entry';
    
    // Count years and analyze titles
    let totalYears = 0;
    let hasSeniorTitle = false;
    let hasLeadTitle = false;
    
    for (const job of experience) {
      const duration = job.duration || '';
      const position = (job.position || '').toLowerCase();
      
      // Extract years from duration (rough estimation)
      const yearMatch = duration.match(/(\d+)\s*(?:year|yr)/i);
      if (yearMatch) {
        totalYears += parseInt(yearMatch[1]);
      }
      
      // Check for senior/lead titles
      if (position.includes('senior') || position.includes('sr.')) {
        hasSeniorTitle = true;
      }
      if (position.includes('lead') || position.includes('manager') || position.includes('director')) {
        hasLeadTitle = true;
      }
    }
    
    if (totalYears >= 5 || hasLeadTitle) return 'senior';
    if (totalYears >= 2 || hasSeniorTitle) return 'mid';
    return 'entry';
  }

  /**
   * Generate intelligent skill suggestions based on user profile analysis
   */
  async generateSkillSuggestions(profileData: unknown, currentSkills: unknown): Promise<unknown> {
    console.log('🎯🔍 === STARTING GPT SKILL SUGGESTIONS ===');
    console.log('🎯🔍 Profile Data Keys:', Object.keys(profileData || {}));
    console.log('🎯🔍 Current Skills:', JSON.stringify(currentSkills, null, 2));

    try {
      // Check if client is initialized
      if (!this.client) {
        console.log('🎯🔍 LLM Client not initialized, initializing now...');
        this.client = this.initializeClient();
      }

      const systemPrompt = getPrompt('SKILL_SUGGESTIONS', 'SYSTEM');
      const userPrompt = fillPromptTemplate(
        getPrompt('SKILL_SUGGESTIONS', 'USER_TEMPLATE'),
        { 
          PROFILE_DATA: JSON.stringify(profileData, null, 2),
          CURRENT_SKILLS: JSON.stringify(currentSkills, null, 2)
        }
      );

      console.log('🎯🔍 === GPT PROMPTS ===');
      console.log('🎯🔍 System Prompt:', systemPrompt);
      console.log('🎯🔍 User Prompt Length:', userPrompt.length);

      console.log('🎯🔍 === CALLING GPT API ===');
      const response = await this.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // Higher creativity for suggestions
        max_tokens: 2500 // More tokens for comprehensive suggestions
      });

      console.log('🎯🔍 === GPT RESPONSE ===');
      console.log('🎯🔍 Response received, parsing...');
      
      const content = response.choices?.[0]?.message?.content || '{}';
      console.log('🎯🔍 Raw Content Length:', content.length);
      
      let skillSuggestions;
      try {
        skillSuggestions = JSON.parse(content);
        console.log('🎯🔍 Parsed Successfully:', Object.keys(skillSuggestions));
      } catch (parseError) {
        console.error('🎯🔍 JSON Parse Error:', parseError);
        console.log('🎯🔍 Attempting JSON Repair...');
        
        // Try to extract just the JSON object
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          skillSuggestions = JSON.parse(jsonMatch[0]);
          console.log('🎯🔍 Repair Successful');
        } else {
          throw parseError;
        }
      }
      
      console.log('🎯🔍 === FINAL RESULT ===');
      console.log('🎯🔍 Suggestions Generated:', !!skillSuggestions.skill_suggestions);
      console.log('🎯🔍 Priority Recommendations:', skillSuggestions.priority_recommendations?.length || 0);
      
      return skillSuggestions;
    } catch (error) {
      console.error('🎯🔍 === GPT SKILL SUGGESTIONS FAILED ===');
      console.error('🎯🔍 Error:', error);
      
      // Return fallback suggestions
      return {
        skill_suggestions: {
          technical: [
            { skill: "Data Analysis", reason: "Highly valued across industries" },
            { skill: "Project Management", reason: "Essential for career advancement" }
          ],
          soft_skills: [
            { skill: "Communication", reason: "Critical for professional success" },
            { skill: "Problem Solving", reason: "Core competency for any role" }
          ],
          industry_specific: [
            { skill: "Industry Knowledge", reason: "Stay current with field trends" }
          ],
          tools_platforms: [
            { skill: "Microsoft Office", reason: "Standard workplace requirement" }
          ]
        },
        priority_recommendations: [
          { skill: "Communication", category: "soft_skills", impact: "High impact for career growth" }
        ],
        learning_path: {
          immediate: ["Communication Skills", "Time Management"],
          short_term: ["Project Management", "Data Analysis"],
          long_term: ["Leadership", "Strategic Thinking"]
        },
        profile_analysis: "Fallback suggestions provided due to API error"
      };
    }
  }

  /**
   * Format education entries using AI to expand abbreviations and improve typography
   */
  async formatEducationEntries(educationData: unknown[]): Promise<any[]> {
    if (!educationData || educationData.length === 0) {
      console.log('🎓 No education data to format');
      return educationData;
    }

    console.log('🎓🔍 === STARTING GPT EDUCATION FORMATTING ===');
    console.log('🎓🔍 Input Data:', JSON.stringify(educationData, null, 2));
    console.log('🎓🔍 Data Type:', Array.isArray(educationData) ? 'Array' : typeof educationData);
    console.log('🎓🔍 Array Length:', educationData.length);

    try {
      // Check if client is initialized
      if (!this.client) {
        console.log('🎓🔍 LLM Client not initialized, initializing now...');
        this.client = this.initializeClient();
      }
      console.log('🎓🔍 LLM Client Status:', this.client ? 'Initialized' : 'Failed to initialize');

      const systemPrompt = getPrompt('EDUCATION_FORMATTING', 'SYSTEM');
      const userPrompt = fillPromptTemplate(
        getPrompt('EDUCATION_FORMATTING', 'USER_TEMPLATE'),
        { EDUCATION_DATA: JSON.stringify(educationData, null, 2) }
      );

      console.log('🎓🔍 === GPT PROMPTS ===');
      console.log('🎓🔍 System Prompt:', systemPrompt);
      console.log('🎓🔍 User Prompt:', userPrompt);

      console.log('🎓🔍 === CALLING GPT API ===');
      const response = await this.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0,
        max_tokens: 1000,
        allowArray: true
      });

      console.log('🎓🔍 === GPT RESPONSE ===');
      console.log('🎓🔍 Full Response Object:', JSON.stringify(response, null, 2));
      
      const content = response.choices?.[0]?.message?.content || '[]';
      console.log('🎓🔍 Raw Content:', content);
      console.log('🎓🔍 Content Type:', typeof content);
      console.log('🎓🔍 Content Length:', content.length);
      
      let formattedEducation;
      try {
        console.log('🎓🔍 === PARSING JSON ===');
        formattedEducation = JSON.parse(content);
        console.log('🎓🔍 Parsed Successfully:', JSON.stringify(formattedEducation, null, 2));
      } catch (parseError) {
        console.error('🎓🔍 JSON Parse Error:', parseError);
        console.log('🎓🔍 Attempting JSON Repair...');
        
        // Try to extract just the array part
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          console.log('🎓🔍 Found Array Match:', arrayMatch[0]);
          formattedEducation = JSON.parse(arrayMatch[0]);
          console.log('🎓🔍 Repair Successful:', JSON.stringify(formattedEducation, null, 2));
        } else {
          console.error('🎓🔍 No Array Found in Response');
          throw parseError;
        }
      }
      
      // Validate result
      const isValidArray = Array.isArray(formattedEducation);
      const hasCorrectLength = isValidArray && formattedEducation.length === educationData.length;
      
      console.log('🎓🔍 === VALIDATION ===');
      console.log('🎓🔍 Is Array:', isValidArray);
      console.log('🎓🔍 Original Length:', educationData.length);
      console.log('🎓🔍 Result Length:', isValidArray ? formattedEducation.length : 'N/A');
      console.log('🎓🔍 Length Match:', hasCorrectLength);

      const result = isValidArray ? formattedEducation : educationData;
      console.log('🎓🔍 === FINAL RESULT ===');
      console.log('🎓🔍 Final Output:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('🎓🔍 === GPT FORMATTING FAILED ===');
      console.error('🎓🔍 Error Type:', (error as unknown).constructor.name);
      console.error('🎓🔍 Error Message:', (error as Error).message);
      console.error('🎓🔍 Error Stack:', (error as Error).stack);
      console.log('🎓🔍 Returning Original Data:', JSON.stringify(educationData, null, 2));
      return educationData;
    }
  }

  /**
   * Generate a compact style guide for consistent tone/voice/keywords per job+session
   */
  async generateStyleGuide(context: { job: unknown; profile: any }) {
    const model = 'gpt-4o-mini'
    const system = `You are a concise style guide generator for resumes.
Return strict JSON only with keys: {"voice": string, "tone": string, "keywords": string[], "action_verbs": string[], "notes": string}`
    const user = `Create a short style guide to optimize resume bullets and summary for this job and profile.
JOB: ${JSON.stringify(context.job).slice(0, 2000)}
PROFILE: ${JSON.stringify(context.profile).slice(0, 2000)}

Rules:
- Be specific and compact (<= 80 words in notes)
- Keywords: 6-10 terms, single words or short phrases
- Action verbs: 6-10 strong verbs
- Tone: 2-5 words (e.g., "impact-focused, confident, precise")`
    const payload = { model, system, user }
    const cached = await AICacheService.get(model, payload)
    if (cached) return cached
    const resp = await this.createJsonCompletion({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      model,
      temperature: 0.2,
      max_tokens: 300
    })
    const content = resp.choices?.[0]?.message?.content || '{}'
    const guide = JSON.parse(content)
    await AICacheService.set(model, payload, guide)
    return guide
  }

  /**
   * Confidence-based company research with optional web search
   * First checks if GPT can confidently answer, then searches if needed
   */
  async smartCompanyResearch(companyName: string, jobData: unknown): Promise<{
    research: unknown;
    confidence: number;
    searchUsed: boolean;
    cost: string;
  }> {
    console.log(`🧠 === SMART COMPANY RESEARCH FOR: ${companyName} ===`);
    
    try {
      // Phase 1: Confidence assessment
      const confidencePrompt = `You are a company research AI. Assess your confidence in providing comprehensive information about "${companyName}".

      Consider if you know:
      - Basic company info (industry, size, location)
      - What the company does (products/services)
      - Company culture and values
      
      For well-known companies (Fortune 500, major brands, tech companies), return confidence 0.8+
      For lesser-known or regional companies, return confidence 0.3-0.5
      
      Respond with a confidence score (0.0-1.0) and brief reasoning in JSON format:
      {
        "confidence": 0.8,
        "reasoning": "Well-known tech company with extensive public information",
        "knowledge_gaps": ["specific hiring managers", "recent organizational changes"]
      }`;

      const confidenceCompletion = await this.createJsonCompletion({
        messages: [{ role: 'user', content: confidencePrompt }],
        max_tokens: 200,
        model: 'gpt-4o-mini'
      });

      // Parse structured content from completion safely
      let confidencePayload: unknown = { confidence: 0.0 };
      try {
        const content = confidenceCompletion.choices?.[0]?.message?.content || '{}';
        confidencePayload = JSON.parse(content);
      } catch {}

      const confidence = Number(confidencePayload.confidence ?? 0.0) || 0.0;
      const threshold = getModelConfig('gpt-4o-mini')?.confidence_threshold || 0.7;

      console.log(`🧠 Confidence: ${confidence}/1.0 (threshold: ${threshold})`);
      console.log(`🧠 Reasoning: ${confidencePayload.reasoning || 'n/a'}`);

      let searchUsed = false;
      let research;

      if (confidence >= threshold) {
        // Phase 2A: High confidence - use internal knowledge
        console.log(`✅ High confidence - using internal knowledge`);
        research = await this.generateCompanyResearchFromKnowledge(companyName, jobData);
      } else {
        // Phase 2B: Low confidence - use Tavily Search + Scraping (COST EFFICIENT)
        console.log(`🔍 Low confidence - triggering Tavily Search + Scraping`);
        try {
          const tavilySearchResult = await this.generateCompanyResearchWithGoogleSearch(companyName, jobData);
          research = tavilySearchResult.research || tavilySearchResult;
          searchUsed = tavilySearchResult.actualWebSearchUsed || false;
          console.log(`🔍 Tavily Search + Scraping succeeded for ${companyName} - Cost: ${tavilySearchResult.cost}`);
        } catch (tavilyError) {
          console.log(`🔍 Tavily Search failed, falling back to expensive OpenAI web search for ${companyName}`);
          const webSearchResult = await this.generateCompanyResearchWithWebSearch(companyName, jobData);
          research = webSearchResult.research || webSearchResult;
          searchUsed = webSearchResult.actualWebSearchUsed || false;
        }
      }

      return {
        research,
        confidence,
        searchUsed,
        cost: this.estimateAPICost(confidence >= threshold ? 'internal' : 'web_search')
      };
    } catch (error) {
      console.error('🧠 Smart research error:', error);
      // Fallback to basic research
      return {
        research: { research_confidence: 'low' },
        confidence: 0.0,
        searchUsed: false,
        cost: '$0.0001'
      };
    }
  }

  /**
   * Generate company research using internal knowledge only
   */
  private async generateCompanyResearchFromKnowledge(companyName: string, jobData: unknown): Promise<unknown> {
    const researchPrompt = `Based on your training knowledge, provide comprehensive research about "${companyName}" in JSON format.

    Include MAXIMUM DETAIL:
    - official_website: string | null
    - logo_url: string | null (LinkedIn or official website logo)
    - founded_year: number | null
    - headquarters_location: string | null
    - employee_count: string | null
    - industry_sector: string | null
    - business_model: string | null
    - key_products_services: string[] | null
    - leadership_team: string[] | null (format: "Title: Name")
    - company_values: string[] | null
    - culture_highlights: string[] | null
    - remote_work_policy: string | null
    - diversity_initiatives: string[] | null
    - awards_recognition: string[] | null
    - glassdoor_rating: string | null
    - competitors: string[] | null
    - office_locations: string[] | null
    - recent_news: string[] | null
    - research_confidence: "high" | "medium" | "low"

    Only include information you're confident about. Use null for uncertain data.`;

    const response = await this.createJsonCompletion({
      messages: [{ role: 'user', content: researchPrompt }],
      max_tokens: 800,
      model: 'gpt-4o-mini'
    });
    // Parse into JSON object
    try {
      const content = response.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch {
      return { company_name: companyName, research_confidence: 'low' };
    }
  }


  /**
   * Generate company research using Tavily Search + Web Scraping + GPT parsing (COST EFFICIENT)
   */
  private async generateCompanyResearchWithGoogleSearch(companyName: string, jobData: unknown): Promise<unknown> {
    console.log(`🔍 === TAVILY SEARCH + SCRAPING FOR: ${companyName} ===`);
    
    try {
      // 1. Search Tavily for company information  
      const searchData = await this.performTavilySearchWithAnswer(companyName);
      console.log(`🔍 Tavily Search returned ${searchData.results.length} results for ${companyName}`);
      
      // SKIP TAVILY ANSWER OPTIMIZATION: It doesn't contain rich company data
      // We need to scrape actual web pages to get company values, culture, diversity, awards, etc.
      console.log(`🔍 Skipping Tavily answer - need rich data from actual web pages`);
      
      if (searchData.results.length === 0) {
        throw new Error('No search results found');
      }
      
      // 2. SMART SCRAPING: Prioritize LinkedIn company pages and About/Team/Values pages
      // LinkedIn has the richest structured data, then company About/Team/Values pages
      const urlsToScrape: string[] = [];

      // Add LinkedIn company pages first (highest priority)
      for (const result of searchData.results) {
        if (result.url.includes('linkedin.com/company')) {
          urlsToScrape.push(result.url);
        }
      }

      // Then add company website About/Team/Values pages
      for (const result of searchData.results) {
        if (!result.url.includes('linkedin.com')) {
          const baseUrl = result.url.split('/').slice(0, 3).join('/');
          // Add About Us, Team, Values, Careers pages
          urlsToScrape.push(
            `${baseUrl}/about`,
            `${baseUrl}/about-us`,
            `${baseUrl}/ueber-uns`,
            `${baseUrl}/team`,
            `${baseUrl}/werte`,
            `${baseUrl}/values`,
            `${baseUrl}/careers`,
            `${baseUrl}/karriere`,
            result.url
          );
        }
      }

      // Remove duplicates and limit to top 5 URLs
      const uniqueUrls = [...new Set(urlsToScrape)].slice(0, 5);

      const scrapedContent = await this.scrapeWebsiteContent(
        uniqueUrls.map(url => ({ url, title: '' })),
        companyName
      );
      console.log(`🔍 Scraped content from ${scrapedContent.length} websites for ${companyName} (tried ${uniqueUrls.length} URLs)`);
      
      if (!scrapedContent.length) {
        throw new Error('No content could be scraped');
      }
      
      // 3. Parse scraped content with GPT
      const parsedData = await this.parseScrapedContentWithGPT(scrapedContent, companyName, jobData);
      console.log(`🔍 GPT parsing completed for ${companyName}`);
      
      return {
        research: parsedData,
        actualWebSearchUsed: true,
        cost: '$0.003', // Reduced cost due to less scraping
        method: 'tavily_search_scraping_optimized'
      };
      
    } catch (error) {
      console.error(`🔍 Tavily Search + Scraping failed for ${companyName}:`, (error as Error).message);
      throw error;
    }
  }

  /**
   * Perform Tavily Search API call (replacing Google Search)
   */
  private async performTavilySearchWithAnswer(companyName: string): Promise<{results: unknown[], answer: string | null}> {
    const API_KEY = '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';

    // SMART SEARCH: Prioritize LinkedIn company pages + search for specific data points
    const searchQuery = `${companyName} employees founded year locations headquarters site:linkedin.com/company OR ${companyName}`;

    console.log(`🔍 Searching Tavily for: ${searchQuery}`);
    
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 3,  // OPTIMIZATION: Reduced from 5 to 3 to save credits
          include_answer: true,  // OPTIMIZATION: Use Tavily's answer to potentially avoid scraping
          include_raw_content: false,
          search_depth: 'basic',
          topic: 'general'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 Tavily Search API Error:', data);
        throw new Error(`Tavily Search API failed: ${data.error || response.statusText}`);
      }
      
      const results = data.results || [];
      const answer = data.answer || null;
      
      if (results.length === 0) {
        console.log(`🔍 No search results for ${companyName}`);
        return { results: [], answer };
      }
      
      // Convert Tavily format to our format
      const convertedResults = results.map((item: Record<string, any>) => ({
        title: item.title,
        url: item.url,
        snippet: item.content,
        displayLink: new URL(item.url).hostname,
        score: item.score
      }));
      
      console.log(`🔍 Tavily Search Results for ${companyName}:`, convertedResults.map((r: Record<string, any>) => r.displayLink));
      return { results: convertedResults, answer };
      
    } catch (error) {
      console.error(`🔍 Tavily Search failed for ${companyName}:`, error);
      throw error;
    }
  }
  
  // Legacy method for backward compatibility  
  private async performTavilySearch(companyName: string): Promise<any[]> {
    const API_KEY = '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';
    
    // OPTIMIZATION: More targeted search query
    const searchQuery = `${companyName} company information website`;
    
    console.log(`🔍 Searching Tavily for: ${searchQuery}`);
    
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          query: searchQuery,
          max_results: 2,  // FURTHER OPTIMIZATION: Reduced from 3 to 2 to save more credits
          include_answer: false,  
          include_raw_content: false,
          search_depth: 'basic',
          topic: 'general'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('🔍 Tavily Search API Error:', data);
        throw new Error(`Tavily Search API failed: ${data.error || response.statusText}`);
      }
      
      if (!data.results || data.results.length === 0) {
        console.log(`🔍 No search results for ${companyName}`);
        return [];
      }
      
      // Convert Tavily format to our format
      const results = data.results.map((item: Record<string, any>) => ({
        title: item.title,
        url: item.url,
        snippet: item.content,
        displayLink: new URL(item.url).hostname,
        score: item.score
      }));
      
      console.log(`🔍 Tavily Search Results for ${companyName}:`, results.map((r: Record<string, any>) => r.displayLink));
      return results;
      
    } catch (error) {
      console.error(`🔍 Tavily Search failed for ${companyName}:`, error);
      throw error;
    }
  }

  /**
   * Scrape content from websites using HTTP requests + content extraction
   */
  private async scrapeWebsiteContent(searchResults: unknown[], companyName: string): Promise<any[]> {
    console.log(`🕷️ Scraping content from ${searchResults.length} URLs for ${companyName}`);
    
    const scrapedContent: unknown[] = [];
    
    for (const result of searchResults) {
      try {
        console.log(`🕷️ Scraping: ${result.displayLink}`);
        
        // HTTP request with proper headers
        const response = await fetch(result.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          }
          // timeout: 10000 // 10 second timeout - commented out as timeout is not a valid RequestInit property
        } as unknown);
        
        if (!response.ok) {
          console.log(`🕷️ Failed to fetch ${result.displayLink}: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        
        // Extract main content from HTML
        const cleanContent = this.extractMainContent(html, result.url);
        
        if (cleanContent && cleanContent.length > 200) {
          scrapedContent.push({
            url: result.url,
            domain: result.displayLink,
            title: result.title,
            content: cleanContent,
            snippet: result.snippet
          });
          
          console.log(`🕷️ Successfully scraped ${cleanContent.length} chars from ${result.displayLink}`);
        } else {
          console.log(`🕷️ Insufficient content from ${result.displayLink}`);
        }
        
      } catch (error) {
        console.log(`🕷️ Scraping failed for ${result.displayLink}:`, (error as Error).message);
        continue;
      }
    }
    
    return scrapedContent;
  }

  /**
   * Extract main content from HTML (remove boilerplate, ads, navigation)
   */
  private extractMainContent(html: string, url: string): string {
    try {
      // Remove scripts, styles, and other non-content elements
      let cleaned = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');
      
      // Extract text content from remaining HTML
      cleaned = cleaned
        .replace(/<[^>]+>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Look for main content indicators (prioritizing LinkedIn employee data)
      const contentSections = [
        'about us', 'about the company', 'company overview', 'our story',
        'founded', 'headquarters', 'employees', 'team size', 'mission',
        'what we do', 'our products', 'services', 'leadership team',
        // LinkedIn-specific patterns
        'see all.*employees', 'employees on linkedin', '\\d+.*employees',
        'company size', 'organization size', 'people.*work.*here'
      ];
      
      // Try to find relevant sections
      const relevantContent = contentSections
        .map(section => {
          const regex = new RegExp(`(${section}[\\s\\S]{0,500})`, 'gi');
          const matches = cleaned.match(regex);
          return matches ? matches.join(' ') : '';
        })
        .filter(content => content.length > 50)
        .join(' ');
      
      // Return relevant content if found, otherwise return first 2000 chars
      const finalContent = relevantContent.length > 200 
        ? relevantContent.substring(0, 2000)
        : cleaned.substring(0, 2000);
        
      // Debug: Log content for LinkedIn pages to see what we're getting
      if (url.includes('linkedin.com')) {
        console.log(`🔍 LinkedIn Content Sample (first 500 chars):`, finalContent.substring(0, 500));
        
        // Look for employee patterns in the content
        const employeePatterns = [
          /(\d+)\s*employees/i,
          /see all (\d+) employees/i,
          /(\d+)-(\d+) employees/i,
          /(\d{1,3}(?:,\d{3})*)\s*employees/i
        ];
        
        employeePatterns.forEach((pattern, index) => {
          const match = finalContent.match(pattern);
          if (match) {
            console.log(`🔍 Found employee pattern ${index + 1}:`, match[0]);
          }
        });
      }
        
      return finalContent;
      
    } catch (error) {
      console.error(`Content extraction failed for ${url}:`, error);
      return '';
    }
  }

  /**
   * Parse scraped content using GPT to extract structured company data
   */
  private async parseScrapedContentWithGPT(scrapedContent: unknown[], companyName: string, jobData: unknown): Promise<unknown> {
    console.log(`🤖 GPT parsing scraped content for ${companyName}`);
    console.log(`🤖 DEBUG - scrapedContent type:`, typeof scrapedContent[0]);
    console.log(`🤖 DEBUG - scrapedContent first item:`, typeof scrapedContent[0] === 'string' ? scrapedContent[0].substring(0, 200) : JSON.stringify(scrapedContent[0], null, 2).substring(0, 200));

    // Combine all scraped content
    // Handle both string content (from Tavily answer) and object content (from scraping)
    const combinedContent = scrapedContent
      .map(item => {
        if (typeof item === 'string') {
          return item; // Tavily answer is already a string
        }
        return `=== ${item.domain} ===\n${item.content}`; // Scraped content
      })
      .join('\n\n');

    console.log(`🤖 DEBUG - Combined content length:`, combinedContent.length);
    console.log(`🤖 DEBUG - Combined content preview:`, combinedContent.substring(0, 300));
    
    const systemPrompt = `You are a company research analyst specializing in LinkedIn and company website data extraction.

CRITICAL INSTRUCTIONS:
1. The content may be in German (DE) or English (EN) - extract data from BOTH languages
2. LinkedIn pages have the most accurate employee counts and company info - prioritize them
3. German company pages often have "Über uns", "Team", "Werte" sections with rich data
4. Extract ALL available information - be thorough and detailed
5. Translate German content to English for standardized output`;

    const userPrompt = `Extract MAXIMUM DETAIL for "${companyName}" from the web content below.

SPECIAL FOCUS FOR GERMAN CONTENT:
- "Über uns" / "About us" = description, mission, history
- "Team" / "Werte" / "Values" = company values, culture, leadership
- "Karriere" / "Careers" = work culture, benefits, remote policy
- Look for diversity statements, awards, employee testimonials

${combinedContent}

**CRITICAL PRIORITY - MUST EXTRACT THESE BASIC FACTS:**

1. **FOUNDED YEAR** (HIGHEST PRIORITY):
   - Look for: "Founded in YYYY", "Since YYYY", "Established YYYY", "Gründung YYYY", "gegründet YYYY"
   - Search ENTIRE content for any 4-digit year between 1800-2025
   - Check: company history, timeline, about section, footer

2. **EMPLOYEE COUNT** (HIGHEST PRIORITY):
   - LinkedIn: "X employees", "See all X employees", "1-10 employees", "51-200 employees", "201-500 employees"
   - German: "X Mitarbeiter", "X Beschäftigte", "Mitarbeiteranzahl"
   - Company pages: "We are X people", "team of X", "over X employees", "mehr als X Mitarbeiter"
   - Accept: exact numbers, ranges, "500+", "1000+", etc.

3. **HEADQUARTERS & LOCATIONS** (HIGHEST PRIORITY):
   - Headquarters: "Hauptsitz", "Headquartered in", "Sitz in", "based in"
   - Multiple locations: "Standorte:", "Locations:", "offices in", "Niederlassungen"
   - Extract ALL city names mentioned

**LinkedIn Company Pages** - PRIORITIZE for accuracy

Return the information in this exact JSON format with MAXIMUM DETAIL:
{
  "company_name": "${companyName}",
  "website": "official website URL or null",
  "logo_url": "company logo URL (from LinkedIn or website) or null",
  "headquarters": "city only (e.g., 'Paris', 'Berlin') or null",
  "founded": year as number or null,
  "employee_count": "exact number from LinkedIn or range (e.g., '53', '51-200', '500+') or null",
  "industry": "industry sector or null",
  "description": "concise company description (max 300 chars) or null",
  "business_model": "how the company makes money or null",
  "products_services": ["array of main products/services"] or null,
  "leadership_team": ["CEO: Name", "CTO: Name", "Department Head: Name"] or null,
  "company_values": ["core company values"] or null,
  "culture_highlights": ["work culture and environment highlights"] or null,
  "remote_work_policy": "description of remote work policy or null",
  "diversity_initiatives": ["diversity and inclusion programs"] or null,
  "awards_recognition": ["awards, certifications, industry recognition"] or null,
  "recent_news": ["recent developments, funding, products"] or null,
  "competitors": ["main competitors"] or null,
  "glassdoor_rating": "rating as string or null",
  "office_locations": ["city names only (e.g., 'Berlin', 'Paris', 'Munich')"] or null,
  "additional_insights": ["key insights for job seekers"] or null
}

Extract ALL information available. Be aggressive - infer company values and culture from any mentions of team, mission, work environment, or employee benefits. Use null ONLY if truly no information exists.`;

    try {
      const response = await this.createJsonCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000, // Increased for rich data extraction
        model: 'gpt-4o-mini' // Use cheaper model for parsing
      });
      
      console.log(`🤖 GPT parsing successful for ${companyName}`);

      // Extract and parse the JSON content from the response
      const content = response.choices?.[0]?.message?.content || '{}';
      try {
        const parsedResult = JSON.parse(content);
        console.log(`🔍 GPT parsing completed for ${companyName}`);
        console.log(`🔍 DEBUG - GPT extracted data:`, JSON.stringify({
          industry: parsedResult.industry,
          website: parsedResult.website,
          employee_count: parsedResult.employee_count,
          headquarters: parsedResult.headquarters,
          description: parsedResult.description ? parsedResult.description.substring(0, 100) : null
        }));
        return parsedResult;
      } catch (parseError) {
        console.warn(`🔍 JSON parsing failed for ${companyName}, attempting repair:`, parseError);
        return await this.repairMalformedJson(content, 'JOB_EXTRACTION');
      }
      
    } catch (error) {
      console.error(`🤖 GPT parsing failed for ${companyName}:`, error);
      throw error;
    }
  }

  /**
   * FALLBACK: Original OpenAI web search tool (EXPENSIVE - use only if Google Search fails)
   */
  private async generateCompanyResearchWithWebSearch(companyName: string, jobData: unknown): Promise<unknown> {
    const searchInput = `Perform COMPREHENSIVE web research on company "${companyName}" and analyze the specific job posting "${jobData.title}". I need detailed intelligence for job matching:

    **COMPANY RESEARCH:**
    1. Visit the company's official website - get exact description, mission, products/services
    2. Find detailed company stats: exact employee count, revenue, funding rounds, valuation
    3. Get precise location info: headquarters address, all office locations globally
    4. Company history: founding year, key milestones, major achievements
    5. Leadership team: CEO, CTO, department heads with names and LinkedIn profiles
    6. Recent developments: latest funding, partnerships, product launches, press releases
    7. Company culture: values, working environment, employee benefits
    8. Market position: competitors, market share, industry ranking
    9. Technology stack and business model details

    **JOB-SPECIFIC RESEARCH:**
    10. Visit the specific job posting URL: ${jobData.linkedin_url || jobData.portal_link || 'Search for the job posting'}
    11. Extract hiring manager names, contact information, team leads
    12. Find direct application portal link (not LinkedIn)
    13. Get additional job requirements not in the original description
    14. Identify team structure and reporting hierarchy for this role
    15. Check for salary ranges, benefits, visa sponsorship if mentioned

    **SEARCH MULTIPLE SOURCES:**
    - Company website, careers page, about page
    - LinkedIn company page and employee profiles
    - Crunchbase for funding and business details
    - Glassdoor for company culture and employee reviews
    - Recent news articles and press releases
    - Industry reports and market analysis

    Return comprehensive JSON with exact data:
    {
      "company_name": "${companyName}",
      "website": "exact_website_url",
      "headquarters": "full_address_with_city_country",
      "founded": "exact_year",
      "employee_count": "exact_number_or_range",
      "revenue": "annual_revenue_if_available",
      "funding": "total_funding_and_latest_round",
      "description": "detailed_company_description_and_mission",
      "products_services": ["list_of_main_products_and_services"],
      "industry": "specific_industry_sector",
      "business_model": "how_company_makes_money",
      "technology_stack": ["key_technologies_used"],
      "leadership_team": ["CEO: Name", "CTO: Name", "Relevant Department Head: Name"],
      "office_locations": ["all_office_locations_worldwide"],
      "recent_news": ["latest_funding_round", "product_launches", "partnerships"],
      "company_culture": "work_environment_and_values",
      "competitors": ["main_competitors"],
      "glassdoor_rating": "employee_satisfaction_if_available",
      "job_specific": {
        "hiring_manager": "name_if_found",
        "direct_application_link": "company_careers_page_url",
        "team_structure": "reporting_hierarchy",
        "additional_requirements": ["requirements_not_in_original_description"],
        "salary_range": "if_mentioned_anywhere",
        "visa_sponsorship": "if_mentioned"
      },
      "additional_insights": ["market_position", "growth_trajectory", "why_good_place_to_work"]
    }`;

    console.log('🔍🌐 Making ACTUAL web search call to OpenAI Responses API...');
    
    try {
      const client = this.getClient();
      
      // Use the Responses API with actual web search tool
      const response = await client!.responses.create({
        model: 'gpt-4o-mini',
        input: searchInput,
        // Enable actual built-in Web search tool (let model decide when to use)
        tools: [{ type: 'web_search_preview' as unknown }],
        max_output_tokens: 3000
      });

      console.log('🔍🌐 Web search response received, processing...');
      console.log('🔍🌐 DEBUG: Response output type:', typeof response.output);
      console.log('🔍🌐 DEBUG: Response output:', Array.isArray(response.output) ? 'Array length: ' + response.output.length : response.output);
      
      // Extract the research data from response
      const output = response.output;
      if (!output) {
        throw new Error('No output from web search response');
      }

      // Parse the research results - handle array response from web search tools
      let researchData;
      try {
        let textContent = '';
        
        // If output is an array (web search tool calls), extract the actual content
        if (Array.isArray(output)) {
          console.log('🔍🌐 Processing web search tool call array...');
          console.log('🔍🌐 DEBUG: Array items:', output.map((item, index) => ({
            index, 
            type: typeof item, 
            keys: typeof item === 'object' && item ? Object.keys(item) : 'N/A',
            sample: typeof item === 'object' && item ? JSON.stringify(item).substring(0, 100) + '...' : item
          })));
          
          // Try multiple extraction strategies
          let extractedContent = '';
          
          // Strategy 1: Look for nested OpenAI response structure
          for (const item of output) {
            if (item && typeof item === 'object') {
              // Check if this looks like an OpenAI message response
              if ((item as unknown).content && Array.isArray((item as unknown).content)) {
                const outputText = (item as unknown).content.find((c: Record<string, any>) => c.type === 'output_text');
                if (outputText && outputText.text) {
                  extractedContent = outputText.text;
                  console.log('🔍🌐 Found nested OpenAI response text');
                  break;
                }
              }

              // Fallback to direct text/content fields
              const possibleContent = (item as unknown).content || (item as unknown).text || (item as unknown).output || (item as unknown).message || (item as unknown).response;
              if (possibleContent && typeof possibleContent === 'string') {
                extractedContent = possibleContent;
                console.log('🔍🌐 Found content in object field:', (item as unknown).type || 'unknown type');
                break;
              }
            }
          }
          
          // Strategy 2: Look for direct string responses
          if (!extractedContent) {
            const stringResponse = output.find(item => typeof item === 'string' && (item as string).trim().length > 0);
            if (stringResponse) {
              extractedContent = stringResponse as string;
              console.log('🔍🌐 Found direct string response');
            }
          }
          
          // Strategy 3: JSON stringify the most promising object (fallback)
          if (!extractedContent && output.length > 0) {
            const lastItem = output[output.length - 1];
            if (lastItem && typeof lastItem === 'object') {
              extractedContent = JSON.stringify(lastItem);
              console.log('🔍🌐 Using JSON.stringify of last object');
            }
          }
          
          textContent = extractedContent || JSON.stringify(output);
        } else {
          textContent = typeof output === 'string' ? output : JSON.stringify(output);
        }

        console.log('🔍🌐 DEBUG: textContent type:', typeof textContent);
        console.log('🔍🌐 DEBUG: textContent length:', textContent.length || 'N/A');
        
        // Ensure textContent is a string
        const textContentString = String(textContent);
        console.log('🔍🌐 Extracted text content preview:', textContentString.substring(0, 300) + '...');
        console.log('🔍🌐 Looking for JSON markers in text...');
        console.log('🔍🌐 Contains ```json:', textContentString.includes('```json'));
        console.log('🔍🌐 Contains { and }:', textContentString.includes('{') && textContentString.includes('}'));
        
        // Try to parse as JSON first - handle markdown code blocks
        if (textContentString.includes('{') && textContentString.includes('}')) {
          let jsonContent = textContentString;
          
          // Remove markdown code block markers if present
          if (textContentString.includes('```json')) {
            console.log('🔍🌐 Removing markdown code block markers');
            jsonContent = textContentString.replace(/```json\s*\n?/g, '').replace(/\n?\s*```/g, '');
          }
          
          // Extract JSON from text
          const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            researchData = JSON.parse(jsonMatch[0]);
            console.log('🔍🌐 Successfully parsed JSON from web search response');
            console.log('🔍🌐 Extracted data keys:', Object.keys(researchData));
          } else {
            throw new Error('No JSON found in response');
          }
        } else {
          throw new Error('Response does not contain JSON');
        }
        
      } catch (parseError) {
        console.warn('🔍🌐 Could not parse web search JSON:', (parseError as Error).message);
        console.log('🔍🌐 Using fallback structured format');
        researchData = {
          company_name: companyName,
          website: 'N/A',
          headquarters: 'N/A', 
          founded: 'N/A',
          size_category: 'Unknown',
          description: typeof output === 'string' ? output : 'Research completed via web search',
          industry: 'N/A',
          recent_news: [],
          leadership: [],
          hiring_managers: [],
          additional_insights: ['Web search research completed successfully']
        };
      }

      console.log('🔍🌐 ✅ REAL web search completed successfully!');
      return {
        research: researchData,
        actualWebSearchUsed: true
      };

    } catch (error) {
      console.error('🔍🌐 ❌ Real web search failed:', error);
      
      // Fallback to internal knowledge if web search fails
      console.log('🔍🌐 Falling back to internal knowledge...');
      const fallbackResearch = await this.generateCompanyResearchFromKnowledge(companyName, jobData);
      return {
        research: fallbackResearch,
        actualWebSearchUsed: false
      };
    }
  }

  /**
   * Verify if a URL is accessible (not 404)
   * Returns true if accessible, false otherwise
   */
  private async verifyUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to avoid downloading content
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeout);

      const isValid = response.ok; // 200-299 status codes
      console.log(`🔗 URL Verification: ${url} - ${isValid ? '✅ Valid' : `❌ Invalid (${response.status})`}`);
      return isValid;
    } catch (error) {
      console.log(`🔗 URL Verification: ${url} - ❌ Failed (${error instanceof Error ? error.message : 'Unknown error'})`);
      return false;
    }
  }

  /**
   * Generate learning paths using GPT-4o-mini - SINGLE CALL for all tasks
   * Filters out Udemy/Coursera
   * Using GPT-4o-mini for speed and cost efficiency
   */
  async generateLearningPaths(tasks: Array<{ task: string; category?: string }>): Promise<Record<string, { quick_wins: Array<{label: string; url: string}>; certifications: Array<{label: string; url: string}>; deepening: Array<{label: string; url: string}> }>> {
    const prompt = `For each job responsibility below, suggest EXACTLY 1 best FREE learning resource per category (quick_wins, certifications, deepening). Just the #1 most valuable resource - nothing more.

INCLUDE (diverse resource types):
- Official documentation & guides
- Interactive coding platforms (CodePen, Replit, StackBlitz)
- YouTube tutorials from verified channels
- GitHub repositories with examples
- Free courses from freeCodeCamp, Codecademy (free tier), edX (audit)
- Interactive learning tools
- Technical blog posts from experts
- Open-source books

STRICTLY EXCLUDE:
- NO Udemy links
- NO Coursera links
- NO paid courses
- NO dead/404 links

RULES:
- 100% FREE and accessible
- VERIFIED working URLs only
- EXACT match to responsibility
- Diverse resource types (not just tutorials)
- Prefer official sources and well-known platforms

OUTPUT JSON - EXACTLY 1 resource per category:
{
  "task": {
    "quick_wins": [{"label": "Quick Start Resource", "url": "https://..."}],
    "certifications": [{"label": "Free Certification", "url": "https://..."}],
    "deepening": [{"label": "Deep Learning Resource", "url": "https://..."}]
  }
}

RESPONSIBILITIES:
${tasks.map((t, i) => `${i + 1}. ${t.task}`).join('\n')}`;

    try {
      console.log('🤖 GPT-4o-mini: Starting learning path generation for', tasks.length, 'tasks (SINGLE CALL)');
      console.log('🤖 GPT-4o-mini: API key present:', !!process.env.OPENAI_API_KEY);

      const client = this.getClient(); // Get OpenAI client instance

      const response = await client!.chat.completions.create({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency and speed
        messages: [{
          role: 'system',
          content: 'You are an expert learning resource curator specializing in finding the best free educational content from diverse sources. You NEVER recommend Udemy or Coursera. You only recommend resources you are confident are active and valuable. Prioritize official documentation, interactive platforms, and well-established free resources. Return responses in valid JSON format only.'
        }, {
          role: 'user',
          content: prompt
        }],
        max_completion_tokens: 12000, // Increased to handle all tasks with full URLs in single call
        temperature: 0.3, // Lower temperature for consistent, focused recommendations
        response_format: { type: "json_object" } // Enforce JSON output
      });

      console.log('🤖 GPT-4o-mini: Received response, status:', response.choices[0].finish_reason);
      const content = response.choices[0].message.content || '{}';
      console.log('🤖 GPT-4o-mini: Response length:', content.length);

      // Check if response was truncated
      if (response.choices[0].finish_reason === 'length') {
        console.error('❌ GPT-4o-mini: Response was truncated due to max_completion_tokens limit!');
        console.error('❌ GPT-4o-mini: Increase max_completion_tokens or reduce number of tasks');
        console.error('❌ GPT-4o-mini: Partial content received:', content.substring(0, 200));
      }

      // Parse JSON response
      let learningPaths;
      try {
        learningPaths = JSON.parse(content);
        console.log(`🤖 GPT-4o-mini: Generated learning paths for ${Object.keys(learningPaths).length} tasks`);
      } catch (parseError) {
        console.error('❌ GPT-4o-mini: JSON parse error:', parseError instanceof Error ? parseError.message : String(parseError));
        console.error('❌ GPT-4o-mini: Raw content:', content);
        learningPaths = {}; // Return empty object on parse error
      }

      // Verify all URLs and filter out invalid ones
      console.log('🔗 Verifying all URLs...');
      const verifiedPaths: Record<string, unknown> = {};

      for (const [task, categories] of Object.entries(learningPaths)) {
        verifiedPaths[task] = {
          quick_wins: [],
          certifications: [],
          deepening: []
        };

        // Verify quick_wins
        for (const resource of (categories as unknown).quick_wins || []) {
          const url = resource.url?.toLowerCase() || '';

          // Skip Udemy/Coursera
          if (url.includes('udemy.com') || url.includes('coursera.org')) {
            console.log(`🚫 Filtered out banned platform: ${url}`);
            continue;
          }

          // Verify URL
          const isValid = await this.verifyUrl(resource.url);
          if (isValid) {
            verifiedPaths[task].quick_wins.push(resource);
          }
        }

        // Verify certifications
        for (const resource of (categories as unknown).certifications || []) {
          const url = resource.url?.toLowerCase() || '';

          // Skip Udemy/Coursera
          if (url.includes('udemy.com') || url.includes('coursera.org')) {
            console.log(`🚫 Filtered out banned platform: ${url}`);
            continue;
          }

          // Verify URL
          const isValid = await this.verifyUrl(resource.url);
          if (isValid) {
            verifiedPaths[task].certifications.push(resource);
          }
        }

        // Verify deepening
        for (const resource of (categories as unknown).deepening || []) {
          const url = resource.url?.toLowerCase() || '';

          // Skip Udemy/Coursera
          if (url.includes('udemy.com') || url.includes('coursera.org')) {
            console.log(`🚫 Filtered out banned platform: ${url}`);
            continue;
          }

          // Verify URL
          const isValid = await this.verifyUrl(resource.url);
          if (isValid) {
            verifiedPaths[task].deepening.push(resource);
          }
        }
      }

      console.log('✅ URL verification complete');
      return verifiedPaths;
    } catch (error) {
      console.error('🤖 GPT-4o-mini learning path generation failed:', error);
      console.error('🤖 GPT-4o-mini: Error details:', error instanceof Error ? error.message : String(error));
      return {}; // Return empty object on error
    }
  }

  /**
   * Estimate API cost for different research types
   */
  private estimateAPICost(type: 'internal' | 'web_search'): string {
    // GPT-4o-mini: approx costs + web search tool costs
    const costs = {
      internal: '$0.0015', // ~500 input + 300 output tokens with GPT-4o-mini
      web_search: '$0.0125' // ~1500 input + 3000 output tokens with GPT-4o-mini + web search tool fees
    };
    return costs[type];
  }
}

// Export singleton instance
export const llmService = new LLMService();
