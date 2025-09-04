// Classic Resume Template - Harvard Style
// Single Source of Truth for both preview and PDF generation

export function generateClassicResumeHTML(data: any): string {
  const { personalInfo, professionalTitle, professionalSummary, enableProfessionalSummary, skills, experience, projects, education, certifications, customSections, languages, showSkillLevelsInResume } = data;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.name || 'Resume'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&family=Georgia:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --text-primary: #000000;
            --text-secondary: #333333;
            --bg-primary: #ffffff;
            --border-color: #000000;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { 
            size: A4; 
            margin: 20mm 20mm 25mm 20mm;
        }
        
        /* Page break optimization */
        .section {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .experience-item, .education-item, .project-item {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 11pt;
            line-height: 1.15;
            orphans: 3;
            widows: 3;
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: hidden;
        }
        
        .resume-container {
            width: 100%;
            max-width: none;
            min-height: 297mm;
            padding: 20mm 20mm 25mm 20mm;
            margin: 0;
        }
        
        /* For PDF generation, use exact measurements */
        @media print {
            .resume-container {
                width: 210mm;
                max-width: 210mm;
                margin: 0 auto;
            }
        }
        
        /* Header - Harvard Style */
        .header {
            text-align: center;
            margin-bottom: 3mm;
        }
        
        .name {
            font-size: 18pt;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
        }
        
        .contact-info {
            font-size: 10pt;
            line-height: 1.4;
        }
        
        .contact-separator {
            margin: 0 2mm;
        }
        
        /* Section Headers - Harvard Style with line */
        .section {
            margin-top: 4mm;
            margin-bottom: 3mm;
        }
        
        .section-header {
            font-size: 11pt;
            font-weight: 700;
            text-transform: uppercase;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1mm;
            margin-bottom: 3mm;
        }
        
        /* Content Styling */
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 0.5mm;
        }
        
        .item-left {
            flex: 1;
        }
        
        .item-right {
            text-align: right;
            font-style: italic;
            font-size: 10pt;
        }
        
        .item-title {
            font-weight: 700;
            font-size: 11pt;
        }
        
        .item-subtitle {
            font-style: italic;
            font-size: 11pt;
        }
        
        .item-location {
            font-size: 10pt;
        }
        
        /* Bullet Points - Harvard Style */
        .bullet-list {
            margin-top: 2mm;
            margin-bottom: 3mm;
            padding-left: 0;
            list-style: none;
        }
        
        .bullet-list li {
            margin-bottom: 1mm;
            padding-left: 5mm;
            position: relative;
            text-align: justify;
            font-size: 10.5pt;
            line-height: 1.3;
        }
        
        .bullet-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            font-weight: 700;
        }
        
        /* Experience & Education Items */
        .experience-item, .education-item {
            margin-bottom: 4mm;
        }
        
        /* Skills - Inline Style */
        .skills-inline {
            font-size: 10.5pt;
            line-height: 1.4;
            text-align: justify;
        }
        
        .skill-category {
            margin-bottom: 1mm;
        }
        
        .skill-label {
            font-weight: 700;
        }
        
        /* Summary/Objective */
        .summary-text {
            font-size: 10.5pt;
            line-height: 1.4;
            text-align: justify;
            margin-bottom: 3mm;
        }
        
        /* Projects */
        .project-item {
            margin-bottom: 3mm;
        }
        
        .project-description {
            font-size: 10.5pt;
            line-height: 1.3;
            text-align: justify;
            margin-top: 1mm;
        }
        
        /* Certifications */
        .certification-item {
            margin-bottom: 2mm;
            font-size: 10.5pt;
        }
        
        /* Custom Sections */
        .custom-item {
            margin-bottom: 3mm;
        }
        
        /* Languages */
        .language-item {
            font-size: 10.5pt;
            margin-bottom: 1mm;
        }
        
        .language-name {
            font-weight: 700;
        }
        
        .language-proficiency {
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <!-- Header Section -->
        <header class="header">
            <div class="name">${personalInfo.name || ''}</div>
            <div class="contact-info">
                ${[
                    personalInfo.location,
                    personalInfo.phone,
                    personalInfo.email,
                    personalInfo.linkedin,
                    personalInfo.website
                ].filter(Boolean).join('<span class="contact-separator">•</span>')}
            </div>
        </header>

        ${enableProfessionalSummary && professionalSummary ? `
        <!-- Objective/Summary Section -->
        <section class="section">
            <h2 class="section-header">Objective</h2>
            <div class="summary-text">${professionalSummary}</div>
        </section>
        ` : ''}

        ${education.length > 0 ? `
        <!-- Education Section -->
        <section class="section">
            <h2 class="section-header">Education</h2>
            ${education.map(edu => `
                <div class="education-item">
                    <div class="item-row">
                        <div class="item-left">
                            <span class="item-title">${edu.institution}</span>${edu.location ? `, <span class="item-location">${edu.location}</span>` : ''}
                        </div>
                        <div class="item-right">${edu.year}</div>
                    </div>
                    <div class="item-subtitle">${edu.degree}${edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
                </div>
            `).join('')}
        </section>
        ` : ''}

        ${experience.length > 0 ? `
        <!-- Experience Section -->
        <section class="section">
            <h2 class="section-header">Experience</h2>
            ${experience.map(job => `
                <div class="experience-item">
                    <div class="item-row">
                        <div class="item-left">
                            <span class="item-title">${job.position}</span>
                        </div>
                        <div class="item-right">${job.duration}</div>
                    </div>
                    <div class="item-subtitle">${job.company}${job.location ? `, ${job.location}` : ''}</div>
                    ${job.achievements && job.achievements.length > 0 ? `
                        <ul class="bullet-list">
                            ${job.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </section>
        ` : ''}

        ${projects.length > 0 ? `
        <!-- Projects Section -->
        <section class="section">
            <h2 class="section-header">Projects</h2>
            ${projects.map(project => `
                <div class="project-item">
                    <div class="item-row">
                        <div class="item-left">
                            <span class="item-title">${project.name}</span>
                        </div>
                        ${project.date ? `<div class="item-right">${project.date}</div>` : ''}
                    </div>
                    <div class="project-description">${project.description}</div>
                    ${project.technologies && project.technologies.length > 0 ? `
                        <div style="margin-top: 1mm; font-size: 10pt;">
                            <span style="font-weight: 700;">Technologies:</span> ${project.technologies.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </section>
        ` : ''}

        ${Object.keys(skills).length > 0 ? `
        <!-- Skills Section -->
        <section class="section">
            <h2 class="section-header">Skills</h2>
            <div class="skills-inline">
                ${Object.entries(skills).map(([category, skillList]) => `
                    <div class="skill-category">
                        <span class="skill-label">${category}:</span> ${skillList.map(skill => {
                            if (typeof skill === 'string') {
                                return skill;
                            } else if (skill.skill && showSkillLevelsInResume && skill.proficiency) {
                                const levelAbbr = skill.proficiency === 'Expert' ? 'EXP' : 
                                                 skill.proficiency === 'Advanced' ? 'ADV' : 
                                                 skill.proficiency === 'Intermediate' ? 'INT' : 'BEG';
                                return `${skill.skill} (${levelAbbr})`;
                            } else if (skill.skill) {
                                return skill.skill;
                            }
                            return '';
                        }).filter(s => s).join(', ')}
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        ${languages && languages.length > 0 ? `
        <!-- Languages Section -->
        <section class="section">
            <h2 class="section-header">Languages</h2>
            <div class="skills-inline">
                ${languages.map(lang => `
                    <div class="language-item">
                        <span class="language-name">${lang.language}</span>: <span class="language-proficiency">${lang.proficiency}</span>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        ${certifications.length > 0 ? `
        <!-- Certifications Section -->
        <section class="section">
            <h2 class="section-header">Certifications</h2>
            ${certifications.map(cert => `
                <div class="certification-item">
                    <strong>${cert.name}</strong>${cert.issuer ? `, ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}
                </div>
            `).join('')}
        </section>
        ` : ''}

        ${customSections && customSections.length > 0 ? `
            ${customSections.map(section => `
            <section class="section">
                <h2 class="section-header">${section.title}</h2>
                ${section.items.map(item => `
                    <div class="custom-item">
                        ${item.title || item.field1 ? `
                            <div class="item-row">
                                <div class="item-left">
                                    <span class="item-title">${item.title || item.field1 || ''}</span>
                                </div>
                                ${item.date || item.field3 ? `<div class="item-right">${item.date || item.field3 || ''}</div>` : ''}
                            </div>
                        ` : ''}
                        ${item.subtitle || item.field2 ? `
                            <div class="item-subtitle">${item.subtitle || item.field2 || ''}</div>
                        ` : ''}
                        ${item.description || item.field4 ? `
                            <div class="project-description">${item.description || item.field4 || ''}</div>
                        ` : ''}
                        ${item.details && item.details.length > 0 ? `
                            <ul class="bullet-list">
                                ${item.details.map(detail => `<li>${detail}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
            `).join('')}
        ` : ''}
    </div>
</body>
</html>`;
}