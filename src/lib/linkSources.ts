export function bestFallbackFor(label: string, task?: string): { label: string; url: string } {
  const l = (label || '').toLowerCase();
  const t = (task || '').toLowerCase();

  const pick = (lab: string, url: string) => ({ label: lab, url });

  // Frameworks & Languages
  if (l.includes('react')) return pick('React – Learn', 'https://react.dev/learn');
  if (l.includes('node')) return pick('Node.js Guides', 'https://nodejs.org/en/learn');
  if (l.includes('express')) return pick('Express – Getting Started', 'https://expressjs.com/en/starter/installing.html');
  if (l.includes('typescript')) return pick('TypeScript Handbook', 'https://www.typescriptlang.org/docs/');
  if (l.includes('javascript')) return pick('MDN Web Docs – JS', 'https://developer.mozilla.org/en-US/docs/Learn');
  if (l.includes('wordpress')) return pick('Learn WordPress', 'https://learn.wordpress.org/');
  if (l.includes('figma')) return pick('Figma Learn', 'https://help.figma.com/hc/en-us/articles/1500004361281-Get-started-with-Figma');
  if (l.includes('google analytics')) return pick('Google Skillshop – Analytics', 'https://skillshop.exceedlms.com/student/path/18164-google-analytics');
  if (l.includes('seo')) return pick('Google Skillshop – Search', 'https://skillshop.exceedlms.com/student/catalog');
  if (l.includes('docker')) return pick('Docker – Get Started', 'https://docs.docker.com/get-started/');
  if (l.includes('kubernetes')) return pick('Kubernetes Basics', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/');
  if (l.includes('aws')) return pick('AWS Cloud Practitioner', 'https://www.aws.training/Details/Curriculum?id=20685');
  if (l.includes('power bi')) return pick('Microsoft Learn – Power BI', 'https://learn.microsoft.com/power-bi/');
  if (l.includes('tableau')) return pick('Tableau Training', 'https://www.tableau.com/learn/training');
  if (l.includes('salesforce')) return pick('Salesforce Trailhead', 'https://trailhead.salesforce.com/');
  if (l.includes('jira')) return pick('Atlassian University – Jira', 'https://university.atlassian.com/student/catalog');
  if (l.includes('scrum')) return pick('The Scrum Guide', 'https://scrumguides.org/');
  if (l.includes('customer success')) return pick('HubSpot Academy – Customer Success', 'https://academy.hubspot.com/courses/customer-success');
  if (l.includes('crm')) return pick('Salesforce Trailhead – Admin', 'https://trailhead.salesforce.com/credentials/administrator');
  if (l.includes('operations') || l.includes('operational') || l.includes('process')) return pick('Google Project Management Certificate', 'https://www.coursera.org/professional-certificates/google-project-management');
  if (l.includes('kpi') || l.includes('metrics')) return pick('Excel for Data Analysis (Microsoft Learn)', 'https://learn.microsoft.com/training/paths/analyze-data-excel/');
  if (l.includes('lean') || l.includes('six sigma')) return pick('Six Sigma Yellow Belt (Coursera)', 'https://www.coursera.org/learn/six-sigma-tools-define-measure-and-analyze');
  if (l.includes('event') && l.includes('planning')) return pick('Event Planning & Management (Coursera Specialization)', 'https://www.coursera.org/specializations/event-planning-management');

  // Certifications common
  if (l.includes('certificate') || l.includes('certification')) {
    if (l.includes('google ux')) return pick('Google UX Design (Coursera)', 'https://www.coursera.org/professional-certificates/google-ux-design');
    if (l.includes('meta front') || l.includes('front-end')) return pick('Meta Front-End (Coursera)', 'https://www.coursera.org/professional-certificates/meta-front-end-developer');
  }

  // Fallback to crash course for the task topic
  const q = encodeURIComponent(`${task || label} crash course`);
  return { label: 'Crash course', url: `https://www.youtube.com/results?search_query=${q}` };
}
