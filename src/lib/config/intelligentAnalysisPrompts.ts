/**
 * GPT Prompts for Intelligent Job Analysis
 *
 * Centralized prompt templates for job compatibility analysis.
 * Separated from business logic for easy maintenance and testing.
 */

export interface PromptContext {
  job: any;
  userProfile: any;
  userExperience: any[];
  userProjects: any[];
  userSkills: Record<string, string[]>;
}

/**
 * Build the main analysis prompt for GPT
 */
export function buildJobAnalysisPrompt(context: PromptContext): string {
  const { job, userProfile, userExperience, userProjects, userSkills } = context;

  // Extract clean job data
  const jobTitle = job.title || 'Unknown Position';
  const jobResponsibilities = job.responsibilities || [];
  const jobRequiredSkills = [
    ...(job.skills_canonical_flat || []),
    ...(job.tools_canonical_flat || [])
  ];
  const jobDescription = job.description || '';

  // Extract clean user data
  const userName = userProfile.name || 'Candidate';
  const userEducation = userProfile.education || [];
  const allUserSkills = Object.values(userSkills).flat();

  return `You are a friendly career counselor speaking directly to ${userName}. Provide a DETAILED, HONEST analysis using "you" language (e.g., "You have strong experience in...", "You need to work on...").

JOB DETAILS:
Title: ${jobTitle}
Company: ${job.companies?.name || 'Company'}

Key Responsibilities:
${jobResponsibilities.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

Required Skills: ${jobRequiredSkills.join(', ')}

Description: ${jobDescription.substring(0, 500)}

---

YOUR PROFILE:
Name: ${userName}
Education: ${userEducation.map((e: any) => `${e.degree} in ${e.field_of_study} from ${e.institution}`).join(', ')}

Experience:
${userExperience.map((exp: any, i: number) => `
${i + 1}. ${exp.position} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})
   ${exp.description || ''}
   Key achievements: ${(exp.achievements || []).join(', ')}
`).join('\n')}

Projects:
${userProjects.map((proj: any, i: number) => `
${i + 1}. ${proj.title}
   ${proj.description || ''}
   Technologies: ${(proj.technologies || []).join(', ')}
`).join('\n')}

Certifications:
${(userProfile.certifications || []).map((cert: any, i: number) => `
${i + 1}. ${cert.title}
   Institution: ${cert.institution}
   Date: ${cert.date || 'N/A'}
`).join('\n')}

${userProfile.custom_sections?.awards?.length > 0 ? `
Awards & Achievements:
${userProfile.custom_sections.awards.map((award: any, i: number) => `
${i + 1}. ${typeof award === 'string' ? award : award.title || award.name}
   ${typeof award === 'object' && award.description ? award.description : ''}
`).join('\n')}
` : ''}

${userProfile.custom_sections?.leadership?.length > 0 ? `
Leadership Experience:
${userProfile.custom_sections.leadership.map((lead: any, i: number) => `
${i + 1}. ${typeof lead === 'string' ? lead : lead.title || lead.name}
   ${typeof lead === 'object' && lead.description ? lead.description : ''}
`).join('\n')}
` : ''}

${userProfile.custom_sections?.volunteer?.length > 0 ? `
Volunteer Work:
${userProfile.custom_sections.volunteer.map((vol: any, i: number) => `
${i + 1}. ${typeof vol === 'string' ? vol : vol.role || vol.title}
   ${typeof vol === 'object' && vol.organization ? `@ ${vol.organization}` : ''}
   ${typeof vol === 'object' && vol.description ? vol.description : ''}
`).join('\n')}
` : ''}

Skills: ${allUserSkills.join(', ')}

---

PROVIDE DETAILED ANALYSIS in this JSON format (MUST BE VALID JSON):
${getAnalysisJsonTemplate()}

${getCriticalRules()}`;
}

/**
 * JSON response template for GPT
 */
function getAnalysisJsonTemplate(): string {
  return `{
  "overall_match_score": <number 0-100>,
  "responsibility_breakdown": [
    {
      "responsibility": "<responsibility text>",
      "compatibility_score": <0-100>,
      "user_evidence": ["<evidence in second person: 'You have...', 'Your experience at...'>"],
      "gap_analysis": "<what's missing in second person: 'You need...', 'You should work on...'>",
      "learning_recommendation": "<advice in second person: 'Focus on...', 'I recommend you...'>"
    }
  ],
  "relevant_experiences": [
    {
      "position": "<job title>",
      "company": "<company name>",
      "relevance_score": <0-100>,
      "key_skills_demonstrated": ["<skill>"],
      "why_relevant": "<in second person: 'Your experience here shows...'>",
      "highlighted_achievements": ["<achievement>"]
    }
  ],
  "skills_analysis": [],
  "positioning_strategy": {
    "your_unique_angle": "<brief positioning in second person>",
    "key_differentiators": [],
    "red_flags_to_address": [],
    "interview_talking_points": []
  },
  "action_plan": []
}`;
}

/**
 * Critical rules for GPT to follow
 */
function getCriticalRules(): string {
  return `CRITICAL RULES:
1. MUST return valid JSON with ALL fields (use empty arrays [] for optional fields)
2. overall_match_score is REQUIRED and must be a number 0-100
3. responsibility_breakdown: MUST analyze EVERY SINGLE job responsibility listed above
   - Do NOT skip or sample responsibilities
   - Create one entry for EACH responsibility
   - Include compatibility_score, user_evidence, gap_analysis, and learning_recommendation
4. relevant_experiences: MUST analyze ALL past experiences, projects, certifications, awards, leadership, and volunteer work
   - Calculate relevance_score honestly (even if below 40%, still include if ANY relevant skills)
   - Include experiences with relevance >= 40%
   - For each experience, explain HOW it's relevant to THIS SPECIFIC JOB using "you" language
   - Be SPECIFIC about skills/experiences that match job requirements
   - Example: "Your experience managing the campus newsletter shows your ability to create engaging content for a target audience, which directly relates to this content marketing role"
5. Be HONEST with scores - calculate based on actual match
6. IMPORTANT: Use SECOND PERSON throughout (You/Your, not "The candidate" or their name)
7. IMPORTANT: Make experience descriptions HIGHLY TAILORED to the specific job
   - Don't just say "relevant" - explain EXACTLY WHY and HOW
   - Connect specific responsibilities from the job to specific achievements from their profile
8. IMPORTANT: Analyze ALL sections - experience, projects, certifications, awards, leadership, volunteer`;
}

/**
 * System prompt for GPT
 */
export const SYSTEM_PROMPT = 'You are an expert career advisor. Always respond with valid JSON only, no markdown or explanations.';
