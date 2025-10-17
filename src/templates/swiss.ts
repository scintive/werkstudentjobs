// Swiss Resume Template - Single Source of Truth
// Used for both preview and PDF generation

import { ResumeData } from '@/lib/types';

export function generateSwissResumeHTML(data: ResumeData & { showSkillLevelsInResume?: boolean }): string {
  const { personalInfo, professionalTitle, professionalSummary, enableProfessionalSummary, skills, experience, projects, education, certifications, customSections, languages, showSkillLevelsInResume, photoUrl } = data;

  console.log('📸 SWISS TEMPLATE: Received photoUrl =', photoUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.name || 'Resume'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3b82f6;
            --text-primary: #1e293b;
            --text-secondary: #475569;
            --bg-primary: #ffffff;
            --bg-secondary: #f8fafc;
            --border-color: #e2e8f0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
            size: A4;
            margin: 8mm 0 8mm 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 10px;
            line-height: 1.5;
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
        }

        /* Sidebar background that extends across all pages */
        @page {
            background: linear-gradient(90deg, #fafbfc 0%, #fafbfc 32.5%, transparent 32.5%);
        }

        /* Fallback for non-PDF */
        .resume-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 32%;
            min-height: 100%;
            background: #fafbfc;
            z-index: 0;
        }

        @media print {
            @page {
                background: linear-gradient(90deg, #fafbfc 0%, #fafbfc 68mm, transparent 68mm);
            }
        }

        /* Content wrapper for grid */
        .content-wrapper {
            position: relative;
            z-index: 1;
            display: grid;
            grid-template-columns: 32% 2% 66%;
            min-height: 100vh;
        }

        /* For PDF generation, use exact measurements */
        @media print {
            .content-wrapper {
                width: 210mm;
                max-width: 210mm;
                grid-template-columns: 68mm 4mm 138mm;
                margin: 0 auto;
            }
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

        .section-header {
            page-break-after: avoid;
            break-after: avoid;
        }

        .sidebar {
            orphans: 3;
            widows: 3;
            padding: 0 5mm;
            grid-column: 1;
            position: relative;
            z-index: 2;
        }

        .profile-photo {
            width: 100%;
            max-width: 50mm;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 50%;
            margin: 0 auto 4mm auto;
            display: block;
            border: 2px solid var(--primary-color);
            box-shadow: 0 2mm 6mm rgba(59, 130, 246, 0.15);
        }

        .swiss-gutter {
            grid-column: 2;
            background: transparent;
            position: relative;
            z-index: 2;
        }

        .main-content {
            orphans: 3;
            widows: 3;
            padding: 0 8mm 0 0;
            grid-column: 3;
            position: relative;
            z-index: 2;
        }
        .name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 2mm;
            letter-spacing: 0.2px;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .title {
            font-size: 9px;
            color: var(--text-secondary);
            font-weight: 400;
            text-transform: uppercase;
            margin-bottom: 6mm;
            position: relative;
            letter-spacing: 1px;
        }
        .title::after {
            content: '';
            position: absolute;
            bottom: -2mm;
            left: 0;
            width: 16mm;
            height: 0.5px;
            background: var(--primary-color);
        }
        .section-header {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 4mm;
            color: var(--text-primary);
            letter-spacing: 1.2px;
            position: relative;
            padding-bottom: 1mm;
        }
        .section-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0.5px;
            background: var(--border-color);
        }
        .contact-item {
            font-size: 9px;
            margin-bottom: 2mm;
            color: var(--text-secondary);
        }
        .skill-chip {
            display: inline-block;
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 1mm 2mm;
            font-size: 8px;
            font-weight: 400;
            margin: 1mm 1mm 1mm 0;
            border: 0.5px solid var(--border-color);
            letter-spacing: 0.3px;
        }
        .skill-chip.with-proficiency {
            display: inline-flex;
            align-items: center;
            gap: 1mm;
            padding: 1mm 2mm;
        }
        .skill-level {
            font-size: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.6;
            font-weight: 500;
        }
        .language-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2mm;
            font-size: 9px;
        }
        .language-name {
            font-weight: 500;
            color: var(--text-primary);
        }
        .language-proficiency {
            font-size: 8px;
            color: var(--text-secondary);
            background: var(--bg-secondary);
            padding: 0.5mm 1.5mm;
            border-radius: 1mm;
        }
        .skills-category {
            margin-bottom: 4mm;
        }
        .skills-category-title {
            font-size: 9px;
            font-weight: 600;
            color: var(--text-primary);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2mm;
            padding-bottom: 1mm;
        }
        .summary-section {
            background: var(--bg-primary);
            padding: 6mm 0;
            margin-bottom: 8mm;
            border-left: 2px solid var(--primary-color);
            padding-left: 4mm;
        }
        .summary-text {
            font-size: 9px;
            line-height: 1.6;
            color: var(--text-primary);
            font-weight: 400;
            text-align: justify;
        }
        .experience-item {
            margin-bottom: 6mm;
            position: relative;
            border-bottom: 0.5px solid var(--border-color);
            padding-bottom: 4mm;
        }
        .experience-item:last-child {
            border-bottom: none;
        }
        /* Education-specific styling - reduced spacing, no borders */
        .education-section .experience-item {
            margin-bottom: 3mm;
            border-bottom: none;
            padding-bottom: 2mm;
        }
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3mm;
            gap: 4mm;
        }
        .job-title {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 1mm;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .job-company {
            font-size: 9px;
            color: var(--text-secondary);
            margin-bottom: 2mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .job-duration {
            font-size: 9px;
            color: var(--primary-color);
            font-weight: 400;
            white-space: nowrap;
            text-align: right;
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
            line-height: 1.5;
            text-align: justify;
        }
        .achievements li::before {
            content: '—';
            position: absolute;
            left: 0;
            color: var(--primary-color);
            font-weight: 400;
            margin-right: 1mm;
        }
        .project-item {
            margin-bottom: 6mm;
            position: relative;
            border-bottom: 0.5px solid var(--border-color);
            padding-bottom: 4mm;
        }
        .project-item:last-child {
            border-bottom: none;
        }
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3mm;
            gap: 4mm;
        }
        .project-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .project-date {
            font-size: 9px;
            color: var(--primary-color);
            font-weight: 500;
            white-space: nowrap;
        }
        .project-description {
            font-size: 9px;
            line-height: 1.5;
            margin-bottom: 2mm;
            text-align: justify;
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="content-wrapper">
            <aside class="sidebar">
            ${photoUrl ? `<img src="${photoUrl}" alt="Profile Photo" class="profile-photo" crossorigin="anonymous" />` : ''}
            <header>
                <h1 class="name" data-section="name">${personalInfo.name || ''}</h1>
                <div class="title" data-section="title">${professionalTitle || 'Professional'}</div>
                ${personalInfo.customHeader ? `<div style="font-size: 8px; color: var(--text-secondary); margin-top: 2mm; font-style: italic;">${personalInfo.customHeader}</div>` : ''}
            </header>
            
            <section>
                <h2 class="section-header">Contact</h2>
                ${personalInfo.phone ? `<div class="contact-item">${personalInfo.phone}</div>` : ''}
                ${personalInfo.email ? `<div class="contact-item">${personalInfo.email}</div>` : ''}
                ${personalInfo.location ? `<div class="contact-item">${personalInfo.location}</div>` : ''}
                ${personalInfo.linkedin ? `<div class="contact-item">${personalInfo.linkedin}</div>` : ''}
                ${personalInfo.website ? `<div class="contact-item">${personalInfo.website}</div>` : ''}
            </section>
            
            ${Object.keys(skills).length > 0 ? `
            <section data-section="skills">
                <h2 class="section-header">Skills</h2>
                ${Object.entries(skills).map(([category, skillList]) => `
                    <div class="skills-category" data-category="${category}">
                        <div class="skills-category-title">${category}</div>
                        <div>${skillList.map((skill, i) => {
                            // Handle both string skills and skill objects with proficiency
                            if (typeof skill === 'string') {
                                return `<span class="skill-chip" data-section="skills" data-category="${category}" data-index="${i}">${skill}</span>`;
                            } else if (skill.skill && showSkillLevelsInResume && skill.proficiency) {
                                // Show proficiency as text
                                const levelAbbr = skill.proficiency === 'Expert' ? 'EXP' : 
                                                 skill.proficiency === 'Advanced' ? 'ADV' : 
                                                 skill.proficiency === 'Intermediate' ? 'INT' : 'BEG';
                                return `<span class="skill-chip with-proficiency" data-section="skills" data-category="${category}" data-index="${i}">${skill.skill} <span class="skill-level">${levelAbbr}</span></span>`;
                            } else if (skill.skill) {
                                return `<span class="skill-chip" data-section="skills" data-category="${category}" data-index="${i}">${skill.skill}</span>`;
                            }
                            return '';
                        }).join('')}</div>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${certifications.length > 0 ? `
            <section>
                <h2 class="section-header">Certifications</h2>
                ${certifications.map(cert => `
                    <div style="margin-bottom: 4mm;">
                        <div style="font-size: 9px; font-weight: 600; color: var(--text-primary); margin-bottom: 1mm;">${cert.name}</div>
                        ${cert.issuer ? `<div style="font-size: 8px; color: var(--text-secondary);">${cert.issuer}${cert.date ? ` • ${cert.date}` : ''}</div>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${languages && languages.length > 0 ? `
            <section>
                <h2 class="section-header">Languages</h2>
                ${languages.map(lang => `
                    <div class="language-item">
                        <span class="language-name">${(lang.language || lang.name || '').toString()}</span>
                        <span class="language-proficiency">${(lang.proficiency || lang.level || '').toString()}</span>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            
            ${customSections && customSections.length > 0 ? customSections.map(section => `
            <section>
                <h2 class="section-header">${section.title}</h2>
                ${section.items.map(item => `
                    <div style="margin-bottom: 5mm; page-break-inside: avoid;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm;">
                            <div style="flex: 1;">
                                <div style="font-size: 10px; font-weight: 600; color: var(--text-primary); margin-bottom: 1mm;">${item.title || ''}</div>
                                ${item.subtitle ? `<div style="font-size: 9px; color: var(--text-secondary);">${item.subtitle}</div>` : ''}
                            </div>
                            ${item.date ? `<div style="font-size: 8px; color: var(--primary-color); font-weight: 500; padding: 1mm 2mm; background: rgba(79, 70, 229, 0.08); border-radius: 3px; white-space: nowrap; margin-left: 3mm;">${item.date}</div>` : ''}
                        </div>
                        ${item.description ? `<div style="font-size: 9px; color: var(--text-primary); line-height: 1.5; text-align: justify;">${item.description}</div>` : ''}
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
        
        <div class="swiss-gutter"></div>
        
        <main class="main-content">
            ${enableProfessionalSummary && professionalSummary ? `
            <section class="summary-section" data-section="summary">
                <div class="summary-text">${professionalSummary}</div>
            </section>
            ` : ''}

            ${experience.length > 0 ? `
            <section>
                <h2 class="section-header">Experience</h2>
                ${experience.map((job, jIndex) => `
                    <article class="experience-item" data-section="experience" data-exp-index="${jIndex}">
                        <div class="job-header">
                            <div>
                                <h3 class="job-title">${job.position}</h3>
                                <div class="job-company">${job.company}</div>
                            </div>
                            <div class="job-duration">${job.duration}</div>
                        </div>
                        ${job.achievements && job.achievements.length > 0 ? `
                            <ul class="achievements">
                                ${job.achievements.map((achievement, aIndex) => `<li data-section="experience" data-path="experience[${jIndex}].achievements[${aIndex}]">${achievement}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </article>
                `).join('')}
            </section>
            ` : ''}

            ${projects.length > 0 ? `
            <section data-section="projects">
                <h2 class="section-header">Projects</h2>
                ${projects.map((project, pIndex) => `
                    <article class="project-item" data-section="projects" data-proj-index="${pIndex}">
                        <div class="project-header">
                            <h3 class="project-title">${project.name}</h3>
                            ${project.date ? `<span class="project-date">${project.date}</span>` : ''}
                        </div>
                        <p class="project-description" data-path="projects[${pIndex}].description">${project.description}</p>
                        ${project.technologies && project.technologies.length > 0 ? `
                            <div>${project.technologies.map((tech, tIndex) => `<span class="skill-chip" data-section="skills" data-category="Technologies" data-index="${tIndex}">${tech}</span>`).join('')}</div>
                        ` : ''}
                    </article>
                `).join('')}
            </section>
            ` : ''}

            ${education.length > 0 ? `
            <section class="education-section" data-section="education">
                <h2 class="section-header">Education</h2>
                ${education.map((edu, eIndex) => `
                    <article class="experience-item" data-section="education" data-edu-index="${eIndex}">
                        <div class="job-header">
                            <div>
                                <h3 class="job-title" style="font-size: 11px;">${edu.degree}</h3>
                                <div class="job-company">${edu.field_of_study || ''}</div>
                                <div class="job-company">${edu.institution}</div>
                            </div>
                            <div class="job-duration">${edu.year || edu.duration || ''}</div>
                        </div>
                    </article>
                `).join('')}
            </section>
            ` : ''}

        </main>
        </div>
    </div>
</body>
</html>`;
}
