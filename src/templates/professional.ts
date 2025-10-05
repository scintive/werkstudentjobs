// Professional Resume Template - Single Source of Truth
// Used for both preview and PDF generation

export function generateProfessionalResumeHTML(data: any): string {
  const { personalInfo, professionalTitle, professionalSummary, enableProfessionalSummary, skills, experience, projects, education, certifications, customSections, languages, showSkillLevelsInResume, photoUrl } = data;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.name || 'Resume'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3b82f6;
            --accent-color: #1e40af;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --border-color: #e5e7eb;
            --accent-light: #dbeafe;
            --accent-subtle: #f0f9ff;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
            size: A4;
            margin: 0;
        }
        
        /* Page break optimization */
        .experience-item, .project-item, .education-item, .certification-item {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .section {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .sidebar-header {
            page-break-after: avoid;
            break-after: avoid;
        }
        
        .main-header {
            page-break-after: avoid;
            break-after: avoid;
        }
        
        body {
            font-family: 'Roboto', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 11px;
            line-height: 1.4;
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
            min-height: 100vh;
            position: relative;
            margin: 0;
        }

        /* Continuous sidebar background and border across all pages */
        .resume-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 38%;
            height: 100%;
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--accent-subtle) 100%);
            z-index: 0;
        }

        .resume-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 38%;
            width: 3px;
            height: 100%;
            background: var(--primary-color);
            z-index: 1;
        }

        .content-wrapper {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 38% 62%;
            min-height: 100vh;
        }

        /* For PDF generation, use exact measurements */
        @media print {
            .resume-container::before {
                width: 75mm;
            }
            .resume-container::after {
                left: 75mm;
            }
            .content-wrapper {
                width: 210mm;
                max-width: 210mm;
                grid-template-columns: 75mm 135mm;
                margin: 0 auto;
            }
        }
        .sidebar {
            padding: 8mm 6mm 10mm 6mm;
            position: relative;
            z-index: 2;
        }
        .main-content {
            padding: 8mm 8mm 10mm 8mm;
            position: relative;
            z-index: 2;
        }
        .profile-section {
            text-align: center;
            margin-bottom: 8mm;
            padding-bottom: 6mm;
            border-bottom: 2px solid var(--border-color);
        }
        .profile-photo {
            width: 100%;
            max-width: 45mm;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 50%;
            margin: 0 auto 4mm auto;
            border: 3px solid var(--primary-color);
            display: block;
        }
        .name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 2mm;
            color: var(--accent-color);
        }
        .title {
            font-size: 10px;
            font-weight: 500;
            color: var(--primary-color);
            margin-bottom: 4mm;
        }
        .contact-item {
            font-size: 8px;
            margin-bottom: 1.5mm;
            color: var(--text-secondary);
        }
        .sidebar-section {
            margin-bottom: 6mm;
        }
        .sidebar-header {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 3mm;
            color: var(--accent-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .skill-category {
            margin-bottom: 4mm;
        }
        .skill-category-title {
            font-size: 8px;
            font-weight: 600;
            margin-bottom: 2mm;
            color: var(--primary-color);
        }
        .skill-pill {
            display: inline-block;
            background: #f8fafc;
            color: #475569;
            padding: 1mm 2mm;
            border-radius: 2mm;
            font-size: 8px;
            font-weight: 500;
            margin: 0.5mm 1mm 1mm 0;
            border: 1px solid #e2e8f0;
            position: relative;
        }
        .skill-pill.with-proficiency {
            padding-right: 3.5mm;
        }
        .skill-pill.with-proficiency::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 1.5mm;
            transform: translateY(-50%);
            width: 1.5mm;
            height: 1.5mm;
            border-radius: 50%;
            opacity: 0.6;
        }
        .skill-pill[data-level="Expert"]::after {
            background: #10b981;
        }
        .skill-pill[data-level="Advanced"]::after {
            background: #3b82f6;
        }
        .skill-pill[data-level="Intermediate"]::after {
            background: #f59e0b;
        }
        .skill-pill[data-level="Beginner"]::after {
            background: #6b7280;
        }
        .skill-text {
            font-size: 7px;
            color: var(--text-secondary);
        }
        .main-section {
            margin-bottom: 6mm;
        }
        .main-header {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 4mm;
            color: var(--primary-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid var(--accent-light);
            padding-bottom: 1mm;
            position: relative;
        }
        .main-header::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 25%;
            height: 2px;
            background: var(--primary-color);
        }
        .summary-text {
            font-size: 10px;
            line-height: 1.6;
            text-align: justify;
            background: var(--bg-secondary);
            padding: 4mm;
            border-radius: 4px;
        }
        .experience-item {
            margin-bottom: 6mm;
            position: relative;
            padding-left: 6mm;
        }
        .experience-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 2mm;
            width: 6px;
            height: 6px;
            background: var(--primary-color);
            border-radius: 50%;
        }
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2mm;
        }
        .job-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--accent-color);
        }
        .job-company {
            font-size: 9px;
            color: var(--text-secondary);
            margin-top: 1mm;
        }
        .job-duration {
            font-size: 8px;
            background: #f1f5f9;
            color: var(--primary-color);
            padding: 0.5mm 1.5mm;
            border-radius: 2px;
            font-weight: 500;
            border: 1px solid #e2e8f0;
        }
        .achievements {
            list-style: none;
            padding-left: 0;
            margin-top: 2mm;
        }
        .achievements li {
            font-size: 9px;
            margin-bottom: 2mm;
            padding-left: 4mm;
            position: relative;
            line-height: 1.4;
        }
        .achievements li::before {
            content: '◦';
            position: absolute;
            left: 0;
            color: var(--primary-color);
            font-weight: bold;
        }
        .education-item {
            margin-bottom: 4mm;
        }
        .education-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--accent-color);
        }
        .education-details {
            font-size: 10px;
            color: var(--text-secondary);
            margin-top: 1mm;
        }
        .language-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2mm;
            padding: 2mm;
            background: rgba(74, 85, 104, 0.05);
            border-radius: 3px;
            border-left: 3px solid var(--primary-color);
        }
        .language-name {
            font-size: 10px;
            font-weight: 600;
            color: var(--accent-color);
        }
        .language-proficiency {
            font-size: 8px;
            background: #f1f5f9;
            color: #475569;
            padding: 0.5mm 1.5mm;
            border-radius: 2px;
            font-weight: 500;
            border: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="content-wrapper">
        <aside class="sidebar">
            <div class="profile-section">
                ${photoUrl ? `<img src="${photoUrl}" alt="Profile Photo" class="profile-photo" crossorigin="anonymous" />` : ''}
                <h1 class="name" data-section="name">${personalInfo.name || ''}</h1>
                <div class="title" data-section="title">${professionalTitle || 'Professional'}</div>
                ${personalInfo.phone ? `<div class="contact-item">📱 ${personalInfo.phone}</div>` : ''}
                ${personalInfo.email ? `<div class="contact-item">📧 ${personalInfo.email}</div>` : ''}
                ${personalInfo.location ? `<div class="contact-item">📍 ${personalInfo.location}</div>` : ''}
                ${personalInfo.linkedin ? `<div class="contact-item">🔗 ${personalInfo.linkedin}</div>` : ''}
                ${personalInfo.website ? `<div class="contact-item">🌐 ${personalInfo.website}</div>` : ''}
            </div>
            
            ${Object.keys(skills).length > 0 ? `
            <section class="sidebar-section" data-section="skills">
                <h2 class="sidebar-header">Skills</h2>
                ${Object.entries(skills).map(([category, skillList]) => `
                    <div class="skill-category" data-category="${category}">
                        <div class="skill-category-title">${category}</div>
                        <div style="margin-bottom: 3mm;">
                            ${skillList.map((skill, i) => {
                                // Handle both string skills and skill objects with proficiency
                                if (typeof skill === 'string') {
                                    return `<span class="skill-pill" data-section="skills" data-category="${category}" data-index="${i}">${skill}</span>`;
                                } else if (skill.skill && showSkillLevelsInResume && skill.proficiency) {
                                    // Clean proficiency indicator with subtle dot
                                    return `<span class="skill-pill with-proficiency" data-level="${skill.proficiency}" title="${skill.proficiency}" data-section="skills" data-category="${category}" data-index="${i}">${skill.skill}</span>`;
                                } else if (skill.skill) {
                                    return `<span class="skill-pill" data-section="skills" data-category="${category}" data-index="${i}">${skill.skill}</span>`;
                                }
                                return '';
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${languages && languages.length > 0 ? `
            <section class="sidebar-section">
                <h2 class="sidebar-header">Languages</h2>
                ${languages.map(lang => `
                    <div class="language-item">
                        <span class="language-name">${(lang.language || lang.name || '').toString()}</span>
                        <span class="language-proficiency">${(lang.proficiency || lang.level || '').toString()}</span>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${education.length > 0 ? `
            <section class="sidebar-section">
                <h2 class="sidebar-header">Education</h2>
                ${education.map(edu => `
                    <div class="education-item">
                        <div class="education-title">${edu.degree}</div>
                        <div class="education-details">${edu.field_of_study}</div>
                        <div class="education-details">${edu.institution}</div>
                        <div class="education-details">${edu.year}</div>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${certifications.length > 0 ? `
            <section class="sidebar-section">
                <h2 class="sidebar-header">Certifications</h2>
                ${certifications.map(cert => `
                    <div class="education-item">
                        <div class="education-title">${cert.name}</div>
                        <div class="education-details">${cert.issuer}</div>
                        ${cert.date ? `<div class="education-details">${cert.date}</div>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${customSections && customSections.length > 0 ? customSections.map(section => `
            <section class="sidebar-section">
                <h2 class="sidebar-header">${section.title}</h2>
                ${section.items.map(item => `
                    <div class="education-item" style="page-break-inside: avoid;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm;">
                            <div style="flex: 1;">
                                <div class="education-title" style="margin-bottom: 1mm;">${item.title || ''}</div>
                                ${item.subtitle ? `<div class="education-details">${item.subtitle}</div>` : ''}
                            </div>
                            ${item.date ? `<div style="font-size: 8px; background: #f1f5f9; color: #475569; padding: 0.5mm 1.5mm; border-radius: 2px; font-weight: 500; border: 1px solid #e2e8f0; white-space: nowrap; margin-left: 2mm;">${item.date}</div>` : ''}
                        </div>
                        ${item.description ? `<div class="education-details" style="margin-top: 2mm; line-height: 1.4; text-align: justify;">${item.description}</div>` : ''}
                        ${item.details && item.details.length > 0 ? `
                            <ul style="margin-top: 2mm; padding-left: 4mm; list-style: none;">
                                ${item.details.map(detail => `<li style="font-size: 9px; color: var(--text-primary); margin-bottom: 1.5mm; padding-left: 3mm; position: relative; line-height: 1.4;"><span style="position: absolute; left: 0; color: var(--primary-color); font-weight: bold;">◦</span>${detail}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
            `).join('') : ''}
        </aside>
        
        <main class="main-content">
            ${enableProfessionalSummary && professionalSummary ? `
            <section class="main-section">
                <h2 class="main-header">Professional Summary</h2>
                <div class="summary-text">${professionalSummary}</div>
            </section>
            ` : ''}

            ${experience.length > 0 ? `
            <section class="main-section" data-section="experience">
                <h2 class="main-header">Professional Experience</h2>
                ${experience.map((job, jIndex) => `
                    <div class="experience-item" data-section="experience" data-exp-index="${jIndex}">
                        <div class="job-header">
                            <div>
                                <div class="job-title">${job.position}</div>
                                <div class="job-company">${job.company}</div>
                            </div>
                            <div class="job-duration">${job.duration}</div>
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
            <section class="main-section" data-section="projects">
                <h2 class="main-header">Projects</h2>
                ${projects.map((project, pIndex) => `
                    <div class="experience-item" data-section="projects" data-proj-index="${pIndex}">
                        <div class="job-header">
                            <div class="job-title">${project.name}</div>
                            ${project.date ? `<div class="job-duration">${project.date}</div>` : ''}
                        </div>
                        <div style="font-size: 9px; line-height: 1.4; margin-bottom: 2mm;" data-path="projects[${pIndex}].description">${project.description}</div>
                        ${project.technologies && project.technologies.length > 0 ? `
                            <div style="font-size: 8px; color: var(--text-secondary);">
                                <strong>Technologies:</strong> ${project.technologies.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}
        </main>
        </div>
    </div>
</body>
</html>`;
}
