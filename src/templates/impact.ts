// Impact Resume Template - Bold, Colorful, Eye-catching
// Designed to make a memorable impression on recruiters

export function generateImpactResumeHTML(data: any): string {
  const { personalInfo, professionalTitle, professionalSummary, enableProfessionalSummary, skills, experience, projects, education, certifications, customSections, languages, showSkillLevelsInResume } = data;
  
  // Dynamic color palette - vibrant but professional (no purple!)
  const colors = {
    primary: '#0ea5e9',    // Sky blue
    secondary: '#f97316',  // Orange accent
    tertiary: '#14b8a6',   // Teal
    warning: '#f59e0b',    // Amber
    success: '#10b981',    // Emerald
    info: '#3b82f6',       // Blue
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.name || 'Resume'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { 
            size: A4; 
            margin: 0;
        }
        
        /* Page break optimization */
        .section { page-break-inside: avoid; }
        .experience-item, .project-item { page-break-inside: avoid; }
        
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #ffffff;
            color: #1e293b;
            font-size: 10px;
            line-height: 1.5;
        }
        
        .resume-container {
            width: 100%;
            max-width: none;
            min-height: 297mm;
            position: relative;
            overflow: hidden;
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
        
        /* Compact Header - No Background */
        .hero-header {
            padding: 6mm 12mm;
            border-bottom: 3px solid ${colors.primary};
            position: relative;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 8mm;
        }
        
        .name-section {
            flex: 1;
        }
        
        .name {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: -0.3px;
            margin-bottom: 1mm;
        }
        
        .title {
            font-size: 11px;
            font-weight: 600;
            color: ${colors.primary};
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: auto auto;
            gap: 1mm 3mm;
            font-size: 8px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 0.5mm;
            color: #475569;
            font-weight: 500;
        }
        
        .icon {
            width: 14px;
            height: 14px;
            display: inline-block;
        }
        
        /* Main Content Grid - Smaller Sidebar */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 45mm;
            gap: 6mm;
            padding: 5mm 12mm 8mm 12mm;
        }
        
        .left-column {
            grid-column: 1;
        }
        
        .right-column {
            grid-column: 2;
        }
        
        /* Summary goes full width */
        .summary-section {
            grid-column: 1 / -1;
            margin-bottom: 4mm;
        }
        
        /* Section Headers with Icons - Compact */
        .section {
            margin-bottom: 5mm;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 2mm;
            margin-bottom: 3mm;
            padding-bottom: 1mm;
            border-bottom: 2px solid;
        }
        
        .section-icon {
            width: 16px;
            height: 16px;
            padding: 2px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        /* Color-coded sections */
        .experience-section .section-header {
            border-color: ${colors.primary};
        }
        .experience-section .section-icon {
            background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
            color: white;
        }
        .experience-section .section-title {
            color: ${colors.primary};
        }
        
        .education-section .section-header {
            border-color: ${colors.tertiary};
        }
        .education-section .section-icon {
            background: linear-gradient(135deg, ${colors.tertiary}, ${colors.success});
            color: white;
        }
        .education-section .section-title {
            color: ${colors.tertiary};
        }
        
        .skills-section .section-header {
            border-color: ${colors.warning};
        }
        .skills-section .section-icon {
            background: linear-gradient(135deg, ${colors.warning}, ${colors.secondary});
            color: white;
        }
        .skills-section .section-title {
            color: ${colors.warning};
        }
        
        .projects-section .section-header {
            border-color: ${colors.info};
        }
        .projects-section .section-icon {
            background: linear-gradient(135deg, ${colors.info}, ${colors.primary});
            color: white;
        }
        .projects-section .section-title {
            color: ${colors.info};
        }
        
        /* Summary - Simple and Clean */
        .summary-box {
            border-left: 3px solid ${colors.primary};
            padding: 3mm 4mm;
            background: #f8fafc;
        }
        
        .summary-text {
            font-size: 10px;
            line-height: 1.5;
            color: #374151;
            text-align: justify;
        }
        
        /* Experience Items - Clean & Compact */
        .experience-item {
            margin-bottom: 4mm;
            border-left: 2px solid ${colors.primary};
            padding-left: 3mm;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1mm;
        }
        
        .job-info {
            flex: 1;
        }
        
        .job-title {
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.5mm;
        }
        
        .job-company {
            font-size: 10px;
            color: ${colors.secondary};
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .job-duration {
            font-size: 9px;
            color: ${colors.primary};
            font-weight: 600;
            white-space: nowrap;
            margin-top: 1px;
        }
        
        .achievements {
            list-style: none;
            margin-top: 1.5mm;
        }
        
        .achievements li {
            font-size: 9px;
            margin-bottom: 1mm;
            padding-left: 3mm;
            position: relative;
            color: #475569;
            line-height: 1.4;
        }
        
        .achievements li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: ${colors.primary};
            font-weight: bold;
        }
        
        /* Skills - Compact Pills */
        .skills-grid {
            display: flex;
            flex-direction: column;
            gap: 2mm;
        }
        
        .skill-category {
            margin-bottom: 2mm;
        }
        
        .skill-category-title {
            font-size: 9px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 1.5mm;
        }
        
        .skill-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 1mm;
        }
        
        .skill-pill {
            display: inline-block;
            padding: 1mm 2mm;
            border-radius: 8px;
            font-size: 8px;
            font-weight: 600;
        }
        
        .skill-pill.with-proficiency {
            display: inline-flex;
            align-items: center;
            gap: 1mm;
        }
        
        .skill-level {
            font-size: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            opacity: 0.8;
            font-weight: 700;
        }
        
        /* Color rotation without purple */
        .skill-pill:nth-child(4n+1) {
            background: ${colors.primary};
            color: white;
        }
        
        .skill-pill:nth-child(4n+2) {
            background: ${colors.secondary};
            color: white;
        }
        
        .skill-pill:nth-child(4n+3) {
            background: ${colors.tertiary};
            color: white;
        }
        
        .skill-pill:nth-child(4n) {
            background: ${colors.warning};
            color: white;
        }
        
        /* Education - Compact */
        .education-item {
            border-left: 2px solid ${colors.tertiary};
            padding-left: 3mm;
            margin-bottom: 3mm;
        }
        
        .education-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 0.5mm;
        }
        
        .education-degree {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
        }
        
        .education-year {
            font-size: 9px;
            color: ${colors.tertiary};
            font-weight: 600;
        }
        
        .education-details {
            font-size: 9px;
            color: #64748b;
        }
        
        /* Projects - Compact */
        .project-item {
            border-left: 2px solid ${colors.info};
            padding-left: 3mm;
            margin-bottom: 3mm;
        }
        
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 1mm;
        }
        
        .project-name {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
        }
        
        .project-date {
            font-size: 9px;
            color: ${colors.info};
            font-weight: 600;
        }
        
        .project-description {
            font-size: 9px;
            color: #475569;
            line-height: 1.4;
            margin-bottom: 1mm;
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 1mm;
        }
        
        .tech-tag {
            font-size: 7px;
            padding: 0.5mm 1mm;
            background: rgba(59, 130, 246, 0.1);
            color: ${colors.info};
            border-radius: 3px;
            font-weight: 600;
        }
        
        /* Certifications with badges */
        .certification-item {
            display: flex;
            align-items: start;
            gap: 2mm;
            margin-bottom: 3mm;
        }
        
        .cert-badge {
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, ${colors.success}, ${colors.tertiary});
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 10px;
            flex-shrink: 0;
        }
        
        .cert-content {
            flex: 1;
        }
        
        .cert-name {
            font-size: 10px;
            font-weight: 700;
            color: #1e293b;
        }
        
        .cert-details {
            font-size: 9px;
            color: #64748b;
        }
        
        /* Custom sections */
        .custom-item {
            margin-bottom: 4mm;
            padding: 3mm;
            background: linear-gradient(135deg, #fefce8, #ffffff);
            border-left: 3px solid ${colors.warning};
            border-radius: 0 6px 6px 0;
        }
        
        /* Languages */
        .languages-section .section-header {
            border-color: ${colors.success};
        }
        .languages-section .section-icon {
            background: linear-gradient(135deg, ${colors.success}, ${colors.primary});
            color: white;
        }
        .languages-section .section-title {
            color: ${colors.success};
        }
        
        .language-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2mm;
            padding: 1.5mm;
            border-left: 2px solid ${colors.success};
            background: rgba(16, 185, 129, 0.05);
        }
        
        .language-name {
            font-size: 10px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .language-proficiency {
            font-size: 9px;
            color: ${colors.success};
            font-weight: 700;
            background: rgba(16, 185, 129, 0.1);
            padding: 0.5mm 1.5mm;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <!-- Compact Header -->
        <div class="hero-header">
            <div class="header-content">
                <div class="name-section">
                    <h1 class="name" data-section="name">${personalInfo.name || ''}</h1>
                    ${professionalTitle ? `<div class="title" data-section="title">${professionalTitle}</div>` : ''}
                </div>
                <div class="contact-grid">
                    ${personalInfo.email ? `
                        <div class="contact-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="m22 7-10 5L2 7"/>
                            </svg>
                            ${personalInfo.email}
                        </div>
                    ` : ''}
                    ${personalInfo.phone ? `
                        <div class="contact-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="5" y="2" width="14" height="20" rx="2"/>
                                <path d="M12 18h.01"/>
                            </svg>
                            ${personalInfo.phone}
                        </div>
                    ` : ''}
                    ${personalInfo.location ? `
                        <div class="contact-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            ${personalInfo.location}
                        </div>
                    ` : ''}
                    ${personalInfo.linkedin ? `
                        <div class="contact-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                            </svg>
                            LinkedIn
                        </div>
                    ` : ''}
                    ${personalInfo.website || personalInfo.portfolio ? `
                        <div class="contact-item">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            ${personalInfo.website || personalInfo.portfolio}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <!-- Content Grid -->
        <div class="content-grid">
            ${enableProfessionalSummary && professionalSummary ? `
            <!-- Summary - Full Width -->
            <section class="full-width" data-section="summary">
                <div class="summary-box">
                    <div class="summary-text">${professionalSummary}</div>
                </div>
            </section>
            ` : ''}
            
            <!-- Left Column -->
            <div class="left-column">
                ${experience.length > 0 ? `
                <!-- Experience Section -->
                <section class="section experience-section" data-section="experience">
                    <div class="section-header">
                        <div class="section-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="7" width="20" height="14" rx="2"/>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                        </div>
                        <h2 class="section-title">Experience</h2>
                    </div>
                    ${experience.map((job, jIndex) => `
                        <div class="experience-item" data-exp-index="${jIndex}">
                            <div class="job-header">
                                <div class="job-info">
                                    <div class="job-title">${job.position}</div>
                                    <div class="job-company">${job.company}</div>
                                </div>
                                <span class="job-duration">${job.duration}</span>
                            </div>
                            ${job.achievements && job.achievements.length > 0 ? `
                                <ul class="achievements">
                                    ${job.achievements.map((achievement, aIndex) => `<li data-section=\"experience\" data-path=\"experience[${jIndex}].achievements[${aIndex}]\">${achievement}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>
                ` : ''}
                
                ${projects.length > 0 ? `
                <!-- Projects Section -->
                <section class="section projects-section">
                    <div class="section-header">
                        <div class="section-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                        <h2 class="section-title">Projects</h2>
                    </div>
                    ${projects.map(project => `
                        <div class="project-item">
                            <div class="project-header">
                                <div class="project-name">${project.name}</div>
                                ${project.date ? `<div class="project-date">${project.date}</div>` : ''}
                            </div>
                            <div class="project-description">${project.description}</div>
                            ${project.technologies && project.technologies.length > 0 ? `
                                <div class="project-tech">
                                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>
                ` : ''}
            </div>
            
            <!-- Right Column -->
            <div class="right-column">
                ${Object.keys(skills).length > 0 ? `
                <!-- Skills Section -->
                <section class="section skills-section" data-section="skills">
                    <div class="section-header">
                        <div class="section-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        <h2 class="section-title">Skills</h2>
                    </div>
                    <div class="skills-grid">
                        ${Object.entries(skills).map(([category, skillList]) => `
                            <div class="skill-category" data-category="${category}">
                                <div class="skill-category-title">${category}</div>
                                <div class="skill-pills">
                                    ${skillList.map((skill, i) => {
                                        if (typeof skill === 'string') {
                                            return `<span class=\"skill-pill\" data-section=\"skills\" data-category=\"${category}\" data-index=\"${i}\">${skill}</span>`;
                                        } else if (skill.skill && showSkillLevelsInResume && skill.proficiency) {
                                            const levelAbbr = skill.proficiency === 'Expert' ? 'EXP' : 
                                                             skill.proficiency === 'Advanced' ? 'ADV' : 
                                                             skill.proficiency === 'Intermediate' ? 'INT' : 'BEG';
                                            return `<span class=\"skill-pill with-proficiency\" data-section=\"skills\" data-category=\"${category}\" data-index=\"${i}\">${skill.skill} <span class=\"skill-level\">${levelAbbr}</span></span>`;
                                        } else if (skill.skill) {
                                            return `<span class=\"skill-pill\" data-section=\"skills\" data-category=\"${category}\" data-index=\"${i}\">${skill.skill}</span>`;
                                        }
                                        return '';
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
                ` : ''}
                
                ${education.length > 0 ? `
                <!-- Education Section -->
                <section class="section education-section">
                    <div class="section-header">
                        <div class="section-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                <path d="M6 12v5c0 1.657 3.582 3 6 3s6-1.343 6-3v-5"/>
                            </svg>
                        </div>
                        <h2 class="section-title">Education</h2>
                    </div>
                    ${education.map(edu => `
                        <div class="education-item">
                            <div class="education-header">
                                <div class="education-degree">${edu.degree}</div>
                                <div class="education-year">${edu.year}</div>
                            </div>
                            <div class="education-details">
                                ${edu.field_of_study ? `${edu.field_of_study} • ` : ''}${edu.institution}
                            </div>
                        </div>
                    `).join('')}
                </section>
                ` : ''}
                
                ${languages && languages.length > 0 ? `
                <!-- Languages Section -->
                <section class="section languages-section">
                    <div class="section-header">
                        <div class="section-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                <path d="M2 12h20"/>
                            </svg>
                        </div>
                        <h2 class="section-title">Languages</h2>
                    </div>
                ${languages.map(lang => `
                        <div class="language-item">
                            <span class="language-name">${(lang.language || lang.name || '').toString()}</span>
                            <span class="language-proficiency">${(lang.proficiency || lang.level || '').toString()}</span>
                        </div>
                    `).join('')}
                </section>
                ` : ''}
                
                ${certifications.length > 0 ? `
                <!-- Certifications Section -->
                <section class="section">
                    <div class="section-header" style="border-color: ${colors.success};">
                        <div class="section-icon" style="background: linear-gradient(135deg, ${colors.success}, ${colors.tertiary});">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 2v8l3-3 3 3V2M19 9v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9"/>
                                <path d="M12 17h.01"/>
                            </svg>
                        </div>
                        <h2 class="section-title" style="color: ${colors.success};">Certifications</h2>
                    </div>
                    ${certifications.map((cert, idx) => `
                        <div class="certification-item">
                            <div class="cert-badge">✓</div>
                            <div class="cert-content">
                                <div class="cert-name">${cert.name}</div>
                                <div class="cert-details">${cert.issuer}${cert.date ? ` • ${cert.date}` : ''}</div>
                            </div>
                        </div>
                    `).join('')}
                </section>
                ` : ''}
            </div>
            
            ${customSections && customSections.length > 0 ? `
                ${customSections.map(section => `
                <!-- Custom Section - Full Width -->
                <section class="section full-width">
                    <div class="section-header" style="border-color: ${colors.warning};">
                        <div class="section-icon" style="background: linear-gradient(135deg, ${colors.warning}, ${colors.secondary});">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 3l1.912 5.813 6.088.437-4.55 4.05L17.362 19l-5.362-2.9L6.638 19l1.912-5.7L4 9.25l6.088-.437z"/>
                            </svg>
                        </div>
                        <h2 class="section-title" style="color: ${colors.warning};">${section.title}</h2>
                    </div>
                    ${section.items.map(item => `
                        <div class="custom-item">
                            ${item.title || item.field1 ? `
                                <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 1mm;">
                                    ${item.title || item.field1}
                                    ${item.date || item.field3 ? `<span style="float: right; font-size: 9px; color: ${colors.warning}; font-weight: 600;">${item.date || item.field3}</span>` : ''}
                                </div>
                            ` : ''}
                            ${item.subtitle || item.field2 ? `
                                <div style="font-size: 10px; color: #64748b; margin-bottom: 1mm;">${item.subtitle || item.field2}</div>
                            ` : ''}
                            ${item.description || item.field4 ? `
                                <div style="font-size: 10px; color: #475569; line-height: 1.5;">${item.description || item.field4}</div>
                            ` : ''}
                            ${item.details && item.details.length > 0 ? `
                                <ul class="achievements" style="margin-top: 2mm;">
                                    ${item.details.map(detail => `<li>${detail}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </section>
                `).join('')}
            ` : ''}
        </div>
    </div>
</body>
</html>`;
}
