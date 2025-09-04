# Resume Template System Documentation

## Overview
The resume template system provides a single source of truth for generating both preview HTML and PDF resumes. Each template is a standalone TypeScript file that exports a function to generate complete HTML with embedded CSS.

## Template Architecture

### File Structure
```
src/
├── templates/
│   ├── swiss.ts         # Swiss minimalist design template
│   ├── professional.ts  # Professional corporate template
│   └── classic.ts       # Classic Harvard-style template
└── app/
    └── api/
        └── resume/
            ├── preview/route.ts      # Preview API endpoint
            └── pdf-download/route.ts # PDF generation endpoint
```

### Template Interface
Each template exports a single function with this signature:
```typescript
export function generate[TemplateName]ResumeHTML(data: any): string
```

## Data Structure

### Input Data Format
Templates receive a standardized data object with the following structure:

```typescript
{
  personalInfo: {
    name: string,
    email: string,
    phone: string,
    location: string,
    linkedin: string,
    website: string,
    customHeader?: string
  },
  professionalTitle: string,
  professionalSummary: string,
  skills: {
    [categoryName: string]: string[]
  },
  experience: [{
    position: string,
    company: string,
    duration: string,
    location?: string,
    achievements: string[]
  }],
  education: [{
    degree: string,
    field_of_study: string,
    institution: string,
    year: string,
    location?: string
  }],
  projects: [{
    name: string,
    description: string,
    technologies?: string[],
    date?: string
  }],
  certifications: [{
    name: string,
    issuer: string,
    date?: string
  }],
  customSections: [{
    id: string,
    title: string,
    type: string,
    items: [{
      field1?: string,  // or title
      field2?: string,  // or subtitle
      field3?: string,  // or date
      field4?: string,  // or description
      details?: string[]
    }]
  }]
}
```

### Skills Categories
The system supports universal skill categories that are automatically mapped:
- **Core Skills** → "Core Skills"
- **Technical & Digital** → "Technical & Digital"
- **Creative & Design** → "Creative & Design"
- **Business & Strategy** → "Business & Strategy"
- **Communication & Leadership** → "Communication & Leadership"
- **Languages** → "Languages"
- **Specialized** → "Specialized"

Legacy categories are automatically migrated:
- `tools` → merged into "Technical & Digital"
- `soft_skills` → merged into "Communication & Leadership"

## Template Design Specifications

### 1. Swiss Template (`swiss.ts`)
**Design Philosophy**: Mathematical precision with minimalist aesthetics

**Layout**:
- 3-column grid: 68mm sidebar | 4mm gutter | 138mm main content
- Blue accent color (#3b82f6)
- Inter font family
- Clean lines and generous whitespace

**Typography Hierarchy**:
- Section headers: 10px uppercase with letter-spacing
- Job/Project titles: 11px uppercase bold
- Subsection titles: 9px
- Body text: 9px
- Secondary text: 8px
- Skill chips: 8px with border

**Features**:
- Visual gutter separator
- Skill chips with borders
- Blue accent line on summary
- Consistent spacing with mathematical precision

### 2. Professional Template (`professional.ts`)
**Design Philosophy**: Corporate elegance with subtle sophistication

**Layout**:
- 2-column grid: 75mm sidebar | 125mm main content
- Sidebar with background (#f7fafc)
- Border separator (3px solid primary color)
- Roboto font family

**Typography**:
- Name: 18px bold
- Section headers: 14px with bottom border
- Body text: 11px
- Skill pills: 10px with soft background
- Dates: 8px in styled badges

**Features**:
- Profile section with centered alignment
- Pill-style skills with categories
- Date badges with borders
- Icon markers for contact info
- Summary with background highlight

### 3. Classic Template (`classic.ts`)
**Design Philosophy**: Harvard-style traditional academic format

**Layout**:
- Single column with full width
- Centered header with contact info
- Times New Roman serif font
- Black and white only

**Typography**:
- Name: 18pt bold centered
- Section headers: 11pt uppercase with underline
- Body text: 10.5pt justified
- Dates: 10pt italic right-aligned

**Features**:
- Harvard-style formatting
- Education listed before experience
- Inline skills format (Category: skill1, skill2)
- Bullet points with proper indentation
- Traditional section ordering

## CSS Styling Guidelines

### Page Setup
```css
@page {
  size: A4;
  margin: 15mm 0 20mm 0;  /* Top sides bottom */
}
@page:first {
  margin: 0;  /* No margin on first page */
}
```

### Page Break Optimization
```css
.section {
  page-break-inside: avoid;
  break-inside: avoid;
}

.experience-item {
  orphans: 3;
  widows: 3;
  page-break-inside: avoid;
}
```

### Consistent Units
- Use `mm` for print measurements
- Use `px` for font sizes (more predictable than pt)
- Use CSS variables for colors

## Template Creation Guide

### Step 1: Create Template File
Create a new file in `src/templates/[template-name].ts`

### Step 2: Define Function
```typescript
export function generate[TemplateName]ResumeHTML(data: any): string {
  const { 
    personalInfo, 
    professionalTitle, 
    professionalSummary, 
    skills, 
    experience, 
    projects, 
    education, 
    certifications, 
    customSections 
  } = data;
  
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <!-- Meta and styles -->
    </head>
    <body>
      <!-- Template HTML -->
    </body>
    </html>`;
}
```

### Step 3: Required Elements

1. **Fonts**: Include Google Fonts link
2. **CSS Variables**: Define color scheme
3. **Page Setup**: Configure @page rules
4. **Sections**: Handle all data sections conditionally
5. **Custom Sections**: Support dynamic custom sections

### Step 4: Conditional Rendering
Always check if data exists before rendering:
```javascript
${experience.length > 0 ? `
  <section>
    <!-- Experience content -->
  </section>
` : ''}
```

### Step 5: Handle Arrays
Use `.map()` for arrays and `.join('')` to avoid commas:
```javascript
${experience.map(job => `
  <div>${job.position}</div>
`).join('')}
```

## API Integration

### Preview Route (`/api/resume/preview/route.ts`)
1. Receives POST request with `resumeData` and `template` name
2. Calls `formatResumeDataForTemplate()` to standardize data
3. Imports and calls appropriate template function
4. Returns HTML string in JSON response

### PDF Route (`/api/resume/pdf-download/route.ts`)
1. Gets HTML from preview route
2. Uses Puppeteer to generate PDF
3. Returns PDF buffer as base64

### Data Formatting
The `formatResumeDataForTemplate()` function:
- Migrates legacy skill categories
- Filters empty values
- Standardizes field names
- Handles custom section field mapping

## Testing Templates

### Visual Testing
1. Upload a resume PDF
2. Switch between templates in UI
3. Check responsive preview
4. Download and review PDF

### Data Edge Cases
Test with:
- Missing sections (no projects, no certifications)
- Long content (many bullet points)
- Special characters in text
- Multiple skill categories
- Custom sections with various field combinations

### PDF Generation
Verify:
- Page breaks work correctly
- Fonts render properly
- Colors are accurate
- Margins are consistent
- No content is cut off

## Common Issues and Solutions

### Issue: Content Cut Off in PDF
**Solution**: Add page-break-inside: avoid to containers

### Issue: Fonts Not Loading
**Solution**: Use system fonts as fallback, include font links

### Issue: Skills Not Categorizing
**Solution**: Check skill migration logic in formatResumeDataForTemplate

### Issue: Custom Sections Not Showing
**Solution**: Ensure filtering logic checks all possible fields

## Performance Optimization

1. **Minimize HTML Size**: Use short class names
2. **Inline Critical CSS**: All styles in <style> tag
3. **Avoid External Resources**: Except Google Fonts
4. **Efficient Conditionals**: Check data existence before processing
5. **String Concatenation**: Use template literals for performance

## Maintenance Guidelines

### Adding New Templates
1. Create new file in templates/
2. Follow naming convention: `generate[Name]ResumeHTML`
3. Import in API routes
4. Add to switch statement
5. Update documentation

### Modifying Existing Templates
1. Test changes with various data sets
2. Verify PDF generation still works
3. Check page break behavior
4. Update this documentation if needed

### Debugging Templates
1. Console.log the generated HTML length
2. Check first 500 chars of HTML
3. Validate data structure received
4. Test in both preview and PDF modes

## Version History

### Current Version (v2.0)
- Single source of truth architecture
- Three templates: Swiss, Professional, Classic
- Universal skill categories
- Custom sections support
- Harvard-style Classic redesign

### Previous Version (v1.0)
- Dual template systems (HTML files + inline functions)
- React components (deprecated)
- Legacy skill categories