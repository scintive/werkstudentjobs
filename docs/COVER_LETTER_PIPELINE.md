# Cover Letter Pipeline Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Flow](#user-flow)
4. [Technical Implementation](#technical-implementation)
5. [Data Flow](#data-flow)
6. [API Endpoints](#api-endpoints)
7. [UI Components](#ui-components)
8. [Troubleshooting](#troubleshooting)

## Overview

The Cover Letter Pipeline is an AI-powered system that generates personalized, job-specific cover letters for users. It supports both regular job applications and Werkstudent (working student) positions with tailored content generation.

### Key Features
- **Automatic Profile Detection**: Determines if user is a student based on enrollment status
- **Dual API Support**: Separate endpoints for regular and student applications
- **Multiple Tones**: Confident, warm, and direct writing styles
- **Variable Length**: Short (180-220), medium (280-320), or long (380-420) words
- **PDF Export**: Professional PDF generation with proper formatting
- **Real-time Preview**: Live preview with inline editing capabilities
- **Personal Info Integration**: Automatically includes user's name, email, phone, and location

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         CoverLetterStudioTab Component                 │    │
│  │  - Tone Selection (confident/warm/direct)              │    │
│  │  - Length Selection (short/medium/long)                │    │
│  │  - Generate Button                                     │    │
│  │  - Live Preview                                        │    │
│  │  - Edit Mode                                           │    │
│  │  - Export to PDF                                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cover Letter Generation                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          Profile Detection & Routing                    │    │
│  │  - Check enrollment_status                              │    │
│  │  - Check expected_graduation date                       │    │
│  │  - Route to appropriate API                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │  Student API          │    │  Regular API         │          │
│  │  /cover-letter-student│    │  /cover-letter       │          │
│  └──────────────────────┘    └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - Resume Data (personalInfo, experience, skills)      │    │
│  │  - User Profile (enrollment, graduation, availability)  │    │
│  │  - Job Details (title, company, requirements)           │    │
│  │  - Strategy Context (positioning, key themes)           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Processing (GPT-4)                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - Context-aware prompts                                │    │
│  │  - Tone-specific instructions                           │    │
│  │  - Word count constraints                               │    │
│  │  - Student/Professional templates                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Output & Export                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  - Structured JSON response                             │    │
│  │  - Preview rendering                                    │    │
│  │  - PDF generation via Puppeteer                         │    │
│  │  - Clipboard copy                                       │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow

### 1. Initial Access
```
User navigates to Job Details (/jobs/[id]/tailor)
    ↓
Clicks on "Cover Letter Studio" tab
    ↓
System fetches user profile and resume data
    ↓
Personal information auto-populated in preview
```

### 2. Configuration
```
User selects tone:
  - Confident: Authority and proven results
  - Warm: Enthusiasm and personal connection
  - Direct: Concise and professional
    ↓
User selects length:
  - Short: 180-220 words
  - Medium: 280-320 words
  - Long: 380-420 words
```

### 3. Generation
```
User clicks "Generate Cover Letter"
    ↓
System determines if student or regular profile
    ↓
Appropriate API endpoint called with:
  - Job details
  - User profile/resume data
  - Selected tone and length
  - Strategy context
    ↓
GPT-4 generates tailored content
    ↓
Response parsed and displayed in preview
```

### 4. Review & Edit
```
User reviews generated letter
    ↓
Optional: Click "Edit Letter" to modify
    ↓
In-place editing with rich text support
    ↓
Save or discard changes
```

### 5. Export
```
User clicks "Export PDF"
    ↓
HTML template generated with styling
    ↓
Puppeteer converts to PDF
    ↓
File downloaded to user's device
```

## Technical Implementation

### Key Files and Components

#### Frontend Components
- **`/src/app/jobs/[id]/tailor/page.tsx`**
  - Main page containing CoverLetterStudioTab
  - Handles state management and API calls
  - Contains PDF export logic

#### API Endpoints
- **`/src/app/api/jobs/cover-letter-student/route.ts`**
  - Werkstudent-specific cover letter generation
  - Emphasizes academic achievements, availability
  - 180-420 word range

- **`/src/app/api/jobs/cover-letter/route.ts`**
  - Professional cover letter generation
  - Focus on experience and achievements
  - Standard business format

- **`/src/app/api/resume/pdf-download/route.ts`**
  - PDF generation using Puppeteer
  - Accepts HTML content or resume data
  - Returns binary PDF

### Data Structures

#### Cover Letter Response
```typescript
interface CoverLetter {
  id: string;
  job_id: string;
  user_profile_id: string;
  tone: 'confident' | 'warm' | 'direct';
  length: 'short' | 'medium' | 'long';
  content: {
    intro: string;
    body_paragraphs: string[];
    closing: string;
    sign_off: string; // "Best regards\n\nName"
  };
  metadata?: {
    word_count: number;
    generation_time: number;
    model_used: string;
  };
  student_specifics?: {
    enrollment_mentioned: boolean;
    availability_mentioned: boolean;
    graduation_mentioned: boolean;
  };
}
```

#### Resume Data Structure
```typescript
interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  professionalTitle: string;
  professionalSummary: string;
  experience: Experience[];
  education: Education[];
  skills: {
    technical?: string[];
    tools?: string[];
    languages?: string[];
    soft_skills?: string[];
    [category: string]: string[]; // Dynamic categories
  };
  projects?: Project[];
  certifications?: Certification[];
}
```

## Data Flow

### 1. Input Collection
```javascript
// Gathering data for cover letter generation
const requestBody = {
  job_id: jobId,
  user_profile_id: 'latest',
  tone: selectedTone,
  length: selectedLength,
  strategy_context: strategy,
  tailored_resume: resumeData,
  job_details: job,
  comprehensive_mode: true
};
```

### 2. Profile Detection
```javascript
// Determine if user is a student
const isEnrolled = fetchedProfile?.enrollment_status === 'enrolled';
const expectedGradIsFuture = new Date(fetchedProfile.expected_graduation) > new Date();
const isStudentProfile = !!(isEnrolled || expectedGradIsFuture);
const endpoint = isStudentProfile ? '/api/jobs/cover-letter-student' : '/api/jobs/cover-letter';
```

### 3. Personal Info Access
```javascript
// Correct field access pattern (camelCase)
const userName = resumeData?.personalInfo?.name ||
                 userProfile?.personalInfo?.name ||
                 'Your Name';
const userEmail = resumeData?.personalInfo?.email ||
                  userProfile?.personalInfo?.email ||
                  'your.email@example.com';
```

### 4. PDF Generation
```javascript
// HTML template for PDF with proper formatting
const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 60px;
        font-size: 11pt;
      }
      .signoff p.name {
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${personalInfo.name}</h1>
      <p>${personalInfo.email} | ${personalInfo.phone}</p>
      <p>${personalInfo.location}</p>
    </div>
    <!-- Letter content -->
    <div class="signoff">
      <p>Best regards</p>
      <p class="name">${personalInfo.name}</p>
    </div>
  </body>
  </html>
`;
```

## API Endpoints

### POST `/api/jobs/cover-letter-student`
**Purpose**: Generate cover letter for Werkstudent positions

**Request Body**:
```json
{
  "job_id": "string",
  "user_profile_id": "string",
  "tone": "confident | warm | direct",
  "length": "short | medium | long",
  "tailored_resume": {},
  "job_details": {},
  "strategy_context": {}
}
```

**Response**:
```json
{
  "success": true,
  "cover_letter": {
    "content": {
      "intro": "string",
      "body_paragraphs": ["string"],
      "closing": "string",
      "sign_off": "Mit freundlichen Grüßen\n\nName"
    },
    "student_specifics": {
      "enrollment_mentioned": true,
      "availability_mentioned": true
    }
  }
}
```

### POST `/api/resume/pdf-download`
**Purpose**: Convert HTML or resume data to PDF

**Request Body**:
```json
{
  "resumeData": {},
  "html": "string (optional)",
  "template": "string",
  "filename": "string"
}
```

**Response**: Binary PDF file

## UI Components

### CoverLetterStudioTab
Main component managing the cover letter interface.

**Key Features**:
- Tone selector with descriptions
- Length selector with word counts
- Generate button with loading state
- Preview pane with formatted display
- Edit mode toggle
- Export to PDF functionality
- Copy to clipboard

**State Management**:
```javascript
const [selectedTone, setSelectedTone] = useState('confident');
const [selectedLength, setSelectedLength] = useState('medium');
const [isEditing, setIsEditing] = useState(false);
const [editableContent, setEditableContent] = useState(coverLetter);
```

### Display Formatting
```javascript
// Proper line break rendering for sign-off
{editableContent.content.sign_off.split('\n').map((line, idx) => (
  <p key={idx} className={idx === 0 ? "" : "mt-3"}>
    {line}
  </p>
))}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Personal Information Not Showing
**Issue**: "Your Name" appears instead of actual name

**Cause**: Incorrect field access (snake_case vs camelCase)

**Solution**:
- Use `personalInfo` (camelCase) not `personal_info`
- Check both resumeData and userProfile for fallbacks
- Ensure data is properly loaded before rendering

#### 2. PDF Export Fails (400 Error)
**Issue**: PDF generation returns 400 Bad Request

**Cause**: Missing required `resumeData` parameter

**Solution**:
```javascript
body: JSON.stringify({
  resumeData: resumeData || {}, // Required
  html: htmlContent,
  filename: 'Cover_Letter.pdf'
})
```

#### 3. City Not Displaying
**Issue**: Company city shows as "City" placeholder

**Cause**: Field might be `location` instead of `location_city`

**Solution**:
```javascript
{job.location_city || job.location || 'City'}
```

#### 4. Sign-off Formatting
**Issue**: Name appears on same line as "Best regards"

**Cause**: Newline not properly rendered in HTML

**Solution**:
- Split sign_off by '\n' and render separately
- Use proper spacing (mt-3) between lines
- In PDF, use `<br>` tags or separate `<p>` elements

#### 5. Student vs Regular Detection
**Issue**: Wrong API endpoint being called

**Debug Steps**:
1. Check `enrollment_status` field
2. Verify `expected_graduation` date
3. Look for Werkstudent keywords in job title
4. Console log the detection logic

### Debug Logging

Add these console logs for troubleshooting:

```javascript
console.log('🎯 Profile detection:', {
  enrollmentStatus: profile?.enrollment_status,
  expectedGrad: profile?.expected_graduation,
  isStudent: isStudentProfile,
  endpoint: endpoint
});

console.log('🎯 Personal info:', {
  fromResume: resumeData?.personalInfo,
  fromProfile: userProfile?.personalInfo,
  final: userName
});

console.log('🎯 PDF export:', {
  hasResumeData: !!resumeData,
  htmlLength: htmlContent.length,
  job: job
});
```

## Recent Fixes (September 2025)

1. **Personal Info Display**: Fixed camelCase field access
2. **PDF Export**: Added required resumeData parameter
3. **Sign-off Formatting**: Proper line breaks with spacing
4. **City Display**: Added fallback to job.location
5. **PDF Styling**: Improved typography and layout

## Testing Checklist

- [ ] Generate cover letter for regular job
- [ ] Generate cover letter for Werkstudent position
- [ ] Test all three tones (confident, warm, direct)
- [ ] Test all three lengths (short, medium, long)
- [ ] Verify personal info displays correctly
- [ ] Edit generated letter and save changes
- [ ] Export to PDF and verify formatting
- [ ] Copy to clipboard functionality
- [ ] Test with missing personal info (fallbacks)
- [ ] Test with German job (language detection)