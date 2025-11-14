/**
 * Application Configuration for Visual Web App
 * Adapted from CLI version with web-specific settings
 */

export const APP_CONFIG = {
  // OpenAI Configuration
  OPENAI: {
    DEFAULT_MODEL: 'gpt-4o-mini',
    FALLBACK_MODELS: ['gpt-3.5-turbo'],
    DEFAULT_TEMPERATURE: 0.2,
    DEFAULT_MAX_TOKENS: 1500,
    
    // Model-specific settings
    MODELS: {
      'gpt-4o-mini': {
        max_tokens: 5000,
        temperature: 0.2,
        suitable_for: ['analysis', 'extraction', 'generation'],
        supports_web_search: true,
        confidence_threshold: 0.7
      },
      'gpt-4o': {
        max_tokens: 5000,
        temperature: 0.2,
        suitable_for: ['analysis', 'extraction', 'web_search', 'complex_analysis'],
        supports_web_search: true,
        confidence_threshold: 0.8
      },
      'gpt-3.5-turbo': {
        max_tokens: 4000,
        temperature: 0.2,
        suitable_for: ['simple_tasks', 'generation']
      },
      'gpt-4': {
        max_tokens: 4000,
        temperature: 0.3,
        suitable_for: ['complex_analysis', 'creative_writing']
      }
    }
  },

  // File Paths and Directories
  PATHS: {
    OUTPUT_DIR: 'uploads',
    GENERATED_DOCS_DIR: 'generated_documents',
    TEMPLATES_DIR: 'templates',
    CONFIG_DIR: 'config'
  },

  // Job Fetching Configuration
  JOB_FETCHING: {
    DEFAULT_LIMIT: 5,
    MAX_LIMIT: 50,
    DATASET_URL: process.env.APIFY_DATASET_URL || ''
  },

  // Resume Templates Configuration
  RESUME_TEMPLATES: {
    DEFAULT: 'swiss',
    AVAILABLE: ['swiss', 'classic', 'professional'],
    
    // Template-specific settings
    SETTINGS: {
      swiss: {
        name: 'Swiss',
        description: 'Clean, minimal design with elegant typography',
        font_family: 'Inter',
        color_scheme: 'blue',
        layout: 'sidebar',
        professional_level: 'executive'
      },
      classic: {
        name: 'Classic',
        description: 'Traditional professional format',
        font_family: 'Times',
        color_scheme: 'minimal',
        layout: 'traditional',
        professional_level: 'traditional'
      },
      professional: {
        name: 'Professional',
        description: 'Corporate-ready design with balanced layout',
        font_family: 'Inter',
        color_scheme: 'corporate',
        layout: 'balanced',
        professional_level: 'senior'
      }
    }
  },

  // PDF Generation Configuration
  PDF_GENERATION: {
    MARGIN: '0',
    FORMAT: 'A4',
    PRINT_BACKGROUND: true,
    PREFER_CSS_PAGE_SIZE: true,
    
    // Puppeteer settings
    PUPPETEER: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    }
  },

  // Document Processing
  DOCUMENT_PROCESSING: {
    // Cover letter settings
    COVER_LETTER: {
      MIN_WORDS: 400,
      MAX_WORDS: 600,
      DEFAULT_ADDRESSING: 'Dear Hiring Team,'
    },
    
    // Resume settings
    RESUME: {
      MAX_EXPERIENCE_ITEMS: 10,
      MAX_PROJECT_ITEMS: 8,
      MAX_CERTIFICATION_ITEMS: 12
    }
  },

  // Validation Rules
  VALIDATION: {
    REQUIRED_PROFILE_FIELDS: ['personal_details', 'experience'],
    REQUIRED_JOB_FIELDS: ['raw'],
    
    // Email validation regex
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Phone validation regex (flexible international format)
    PHONE_REGEX: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/
  },

  // Error Handling
  ERROR_HANDLING: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    TIMEOUT_MS: 30000,
    
    // Mock responses for offline mode
    ENABLE_MOCK_RESPONSES: false,
    MOCK_RESPONSES: {
      fit_summary: ["Mock fit summary: set OPENAI_API_KEY to use real model."],
      cover_letter_markdown: "# Cover Letter\n\nThis is a mock cover letter. Set OPENAI_API_KEY to generate real content.",
      resume_markdown: "# Resume\n\nThis is a mock resume. Set OPENAI_API_KEY to generate real content.",
      job_description_link: null
    }
  },

  // Feature Flags
  FEATURES: {
    // Unified tailoring (strategy + variant + atomic suggestions)
    // Preview-first with inline chips - enabled via env var
    ENABLE_TAILORING_UNIFIED: process.env.NEXT_PUBLIC_ENABLE_TAILORING_UNIFIED === 'true',
    ENABLE_PDF_GENERATION: true,
    ENABLE_TEMPLATE_SELECTION: true,
    ENABLE_PROFILE_REVIEW: true,
    ENABLE_JOB_ANALYSIS: true,
    ENABLE_COVER_LETTER_GENERATION: true,
    
    // Debug features
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    SAVE_INTERMEDIATE_FILES: true
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-notation path to config value (e.g., 'OPENAI.DEFAULT_MODEL')
 * @returns {*} The configuration value
 */
export function getConfig(path: string): unknown {
  return path.split('.').reduce((obj: any, key: string) => obj?.[key], APP_CONFIG as any);
}

/**
 * Get OpenAI model configuration
 * @param {string} model - Model name
 * @returns {Object} Model configuration
 */
export function getModelConfig(model: string | null = null): unknown {
  const modelName = model || getConfig('OPENAI.DEFAULT_MODEL');
  return getConfig(`OPENAI.MODELS.${modelName}`) || getConfig('OPENAI.MODELS.gpt-4o-mini');
}

/**
 * Get template configuration
 * @param {string} template - Template name
 * @returns {Object} Template configuration
 */
export function getTemplateConfig(template: string | null = null): unknown {
  const templateName = template || getConfig('RESUME_TEMPLATES.DEFAULT');
  return getConfig(`RESUME_TEMPLATES.SETTINGS.${templateName}`) || getConfig('RESUME_TEMPLATES.SETTINGS.swiss');
}

/**
 * Validate configuration on startup
 * @returns {Object} Validation result with warnings and errors
 */
export function validateConfig(): { warnings: string[], errors: string[], isValid: boolean } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required environment variables
  if (!process.env.OPENAI_API_KEY && !getConfig('ERROR_HANDLING.ENABLE_MOCK_RESPONSES')) {
    warnings.push('OPENAI_API_KEY not set - will use mock responses');
  }

  // Validate template availability
  const availableTemplates = getConfig('RESUME_TEMPLATES.AVAILABLE');
  const defaultTemplate = getConfig('RESUME_TEMPLATES.DEFAULT');
  if (!(availableTemplates as any).includes(defaultTemplate)) {
    errors.push(`Default template '${defaultTemplate}' not in available templates`);
  }

  // Validate model configuration
  const defaultModel = getConfig('OPENAI.DEFAULT_MODEL');
  const modelConfig = getConfig(`OPENAI.MODELS.${defaultModel}`);
  if (!modelConfig) {
    warnings.push(`No configuration found for default model '${defaultModel}'`);
  }

  return { warnings, errors, isValid: errors.length === 0 };
}
