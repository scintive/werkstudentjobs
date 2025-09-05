"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Briefcase, FileText, Award, Info } from 'lucide-react';

type Props = {
  userProfile: any;
  jobData: any;
  strategy?: any;
  onTailorSkills?: () => void;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\w\s+#.-]/g, " ").replace(/\s+/g, " ").trim();
}

function flatten(arr: any): string[] {
  const out: string[] = [];
  if (!arr) return out;
  if (Array.isArray(arr)) {
    for (const v of arr) {
      if (!v) continue;
      if (typeof v === 'string') out.push(v);
      else if (typeof v === 'object') out.push(String((v as any).skill || (v as any).name || v));
    }
  }
  return out;
}

function buildResumeCorpus(profile: any) {
  const skills = flatten(Object.values(profile?.skills || {}).flat());
  const exp = (profile?.experience || []).flatMap((e: any) => flatten(e?.achievements) || []);
  const projects = (profile?.projects || []).flatMap((p: any) => [p?.name, p?.description]).filter(Boolean);
  const certs = (profile?.certifications || []).flatMap((c: any) => [c?.name, c?.issuer]).filter(Boolean);
  const all = [...skills, ...exp, ...projects, ...certs].filter(Boolean) as string[];
  const normAll = all.map(norm);
  return { skills, exp, projects, certs, normAll };
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function bestRelatedTask(text: string, taskList: string[]): string | null {
  const tNorm = norm(text);
  const tokens = new Set(tNorm.split(' ').filter(w => w.length > 3));
  let best: { task: string; score: number } | null = null;
  for (const task of taskList) {
    const taskTokens = new Set(norm(task).split(' ').filter(w => w.length > 3));
    const inter = new Set([...tokens].filter(x => taskTokens.has(x))).size;
    const score = inter / (taskTokens.size || 1);
    if (!best || score > best.score) best = { task, score };
  }
  return best && best.score > 0 ? best.task : null;
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter(x => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}

// Suggest quick learning resources (URLs are generic search queries; no external calls)
function quickLearnLinks(task: string): { label: string; url: string }[] {
  const t = norm(task);
  const q = encodeURIComponent(task);
  const YT = (label = 'YouTube crash course') => ({ label, url: `https://www.youtube.com/results?search_query=${q}+crash+course` });
  const links: { label: string; url: string }[] = [];

  const push = (...items: { label: string; url: string }[]) => items.forEach(it => links.push(it));

  // Front‑end web
  if (/(react|frontend|javascript|typescript|html|css|web)/.test(t)) {
    push(
      { label: 'freeCodeCamp JS', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/' },
      { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Learn' },
      { label: 'Meta Front‑End Cert', url: 'https://www.coursera.org/professional-certificates/meta-front-end-developer' }
    );
  }

  // APIs
  if (/(api|rest|graphql)/.test(t)) {
    push(
      { label: 'Postman Student Expert', url: 'https://www.postman.com/company/student-program/' },
      { label: 'freeCodeCamp APIs', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/' }
    );
  }

  // Node/Express backend
  if (/(node|express)/.test(t)) {
    push(
      { label: 'Node.js Guides', url: 'https://nodejs.org/en/learn' },
      { label: 'Express Guide', url: 'https://expressjs.com/en/starter/installing.html' }
    );
  }

  // Python + data
  if (/(python|pandas|numpy)/.test(t)) {
    push(
      { label: 'Kaggle Micro‑courses', url: 'https://www.kaggle.com/learn' },
      { label: 'IBM Data Analysis (free audit)', url: 'https://www.coursera.org/learn/data-analysis-with-python' }
    );
  }

  // Java/Spring
  if (/(java|spring)/.test(t)) {
    push(
      { label: 'Spring Boot Guides', url: 'https://spring.io/guides' },
      { label: 'Oracle Java Tutorials', url: 'https://docs.oracle.com/javase/tutorial/' }
    );
  }

  // SQL/Databases
  if (/(sql|postgres|mysql|database)/.test(t)) {
    push(
      { label: 'freeCodeCamp SQL', url: 'https://www.freecodecamp.org/news/learn-sql-free-relational-database-courses-for-beginners/' },
      { label: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' }
    );
  }

  // BI/Excel/Tableau/Power BI
  if (/(power bi|tableau|excel)/.test(t)) {
    push(
      { label: 'Microsoft Learn — Power BI', url: 'https://learn.microsoft.com/power-bi/' },
      { label: 'Tableau Free Training', url: 'https://www.tableau.com/learn/training' },
      { label: 'Excel Data Analysis', url: 'https://learn.microsoft.com/training/paths/analyze-data-excel/' }
    );
  }

  // DevOps/Cloud
  if (/(aws|azure|gcp|docker|kubernetes|devops|ci)/.test(t)) {
    push(
      { label: 'AWS Cloud Practitioner', url: 'https://www.aws.training/Details/Curriculum?id=20685' },
      { label: 'Docker — Get Started', url: 'https://docs.docker.com/get-started/' },
      { label: 'Kubernetes Basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/' }
    );
  }

  // UX/UI/Design
  if (/(ux|ui|figma|prototyp|user research|design)/.test(t)) {
    push(
      { label: 'Google UX Design (audit)', url: 'https://www.coursera.org/professional-certificates/google-ux-design' },
      { label: 'Figma Learn', url: 'https://help.figma.com/hc/en-us/articles/1500004361281-Get-started-with-Figma' },
      { label: 'NN/g Articles', url: 'https://www.nngroup.com/articles/' }
    );
  }

  // Product/Agile/Jira
  if (/(scrum|agile|jira|kanban|product management)/.test(t)) {
    push(
      { label: 'The Scrum Guide', url: 'https://scrumguides.org/' },
      { label: 'Atlassian University — Jira', url: 'https://university.atlassian.com/student/catalog' },
      { label: 'Product School Primer', url: 'https://productschool.com/resources' }
    );
  }

  // Marketing/SEO/Analytics/Ads
  if (/(seo|sem|google analytics|analytics|content marketing|social media|ads)/.test(t)) {
    push(
      { label: 'Google Skillshop', url: 'https://skillshop.exceedlms.com/student/catalog' },
      { label: 'HubSpot Academy', url: 'https://academy.hubspot.com/' },
      { label: 'Meta Blueprint', url: 'https://www.facebook.com/business/learn' }
    );
  }

  // QA/Testing
  if (/(testing|qa|playwright|cypress|jest)/.test(t)) {
    push(
      { label: 'Playwright Docs', url: 'https://playwright.dev/docs/intro' },
      { label: 'Cypress Learn', url: 'https://learn.cypress.io/' },
      { label: 'Jest Docs', url: 'https://jestjs.io/docs/getting-started' }
    );
  }

  // CRM/Salesforce/HubSpot
  if (/(salesforce|crm|hubspot)/.test(t)) {
    push(
      { label: 'Salesforce Trailhead', url: 'https://trailhead.salesforce.com/users/strailhead/trailmixes/prepare-for-your-salesforce-administrator-credential' },
      { label: 'HubSpot CRM Academy', url: 'https://academy.hubspot.com/courses/crm' }
    );
  }

  // German language upskill
  if (/(german|deutsch|b1|b2)/.test(t)) {
    push(
      { label: 'DW Learn German', url: 'https://learngerman.dw.com/en/overview' },
      { label: 'Goethe Institut — German', url: 'https://www.goethe.de/en/spr/ueb.html' }
    );
  }

  // If nothing matched, provide a good generic
  if (links.length === 0) {
    links.push(YT());
  }

  return links.slice(0, 3);
}

export default function StrategyOnePager({ userProfile, jobData, strategy, onTailorSkills }: Props) {
  // Source tasks from strategy when available, else job responsibilities
  const rawTasks: string[] = (strategy?.job_task_analysis?.map((t: any) => t.task) || jobData?.responsibilities_original || [])
    .filter((t: any) => !!t && typeof t === 'string');

  // Keep the top 6 concise tasks for a dense two‑column layout
  const tasks = rawTasks.slice(0, 6);

  const { skills, exp, projects, certs, normAll } = buildResumeCorpus(userProfile || {});

  // Compute per‑task match and evidence
  // Prefer GPT task analysis if available
  const aiTasks: Array<{ task: string; task_explainer?: string; user_alignment?: string; compatibility?: number; evidence?: string; certification_recommendation?: string; learning_paths?: { quick_wins?: string[]; certifications?: string[]; deepening?: string[] } }> =
    (strategy?.job_task_analysis || []).map((t: any) => ({
      task: t?.task,
      task_explainer: t?.task_explainer,
      user_alignment: t?.user_alignment,
      compatibility: typeof t?.compatibility_score === 'number' ? t.compatibility_score : undefined,
      evidence: t?.user_evidence,
      certification_recommendation: t?.certification_recommendation,
      learning_paths: t?.learning_paths
    })).filter(t => t.task);

  const taskCards = (aiTasks.length > 0 ? aiTasks.map(t => t.task) : tasks).map((task, idx) => {
    const taskNorm = norm(task);
    const taskTokens = new Set(taskNorm.split(' ').filter(w => w.length > 3));
    const resumeTokens = new Set(normAll.flatMap(s => s.split(' ').filter(w => w.length > 3)));
    
    // token overlap score
    const tokScore = jaccard(taskTokens, resumeTokens);

    // skill hit bonus if any resume skill appears in task
    const skillHit = skills.some(s => {
      const n = norm(String(s));
      return n && (taskNorm.includes(n) || n.includes(taskNorm));
    }) ? 0.15 : 0;

    // Use AI compatibility score if available for this row
    const aiCompat = aiTasks[idx]?.compatibility;
    let score = Math.min(1, typeof aiCompat === 'number' ? aiCompat / 100 : tokScore * 0.85 + skillHit);
    const pct = Math.round(score * 100);

    // Evidence: pick first matching items from experience/projects/certs
    const findEv = (arr: any[], label: string) => {
      for (const item of arr || []) {
        const text = typeof item === 'string' ? item : (item?.description || item?.name || item?.title || item);
        if (!text) continue;
        const n = norm(String(text));
        if (n.includes([...taskTokens][0] || '')) return `${label}: ${String(text).slice(0, 90)}`;
      }
      return null;
    };
    const evidence = [
      aiTasks[idx]?.evidence || undefined,
      findEv(exp, 'Experience'),
      findEv(projects, 'Project'),
      findEv(certs, 'Cert')
    ].filter(Boolean) as string[];

    // Learning paths: heuristic + AI recommendation if present
    // Merge AI learning paths with curated chips (limit total to 3)
    const aiQuick = (aiTasks[idx]?.learning_paths?.quick_wins || []).map((label: string) => ({ label, url: `https://www.google.com/search?q=${encodeURIComponent(label)}` }));
    const aiCerts = (aiTasks[idx]?.learning_paths?.certifications || []).map((label: string) => ({ label, url: `https://www.google.com/search?q=${encodeURIComponent(label)}` }));
    const aiDeep = (aiTasks[idx]?.learning_paths?.deepening || []).map((label: string) => ({ label, url: `https://www.google.com/search?q=${encodeURIComponent(label)}` }));
    let learn = [...aiQuick, ...aiCerts, ...aiDeep];
    if (learn.length < 2) {
      learn = [...learn, ...quickLearnLinks(task)];
    }
    if (aiTasks[idx]?.certification_recommendation) {
      learn.unshift({ label: aiTasks[idx]!.certification_recommendation, url: `https://www.google.com/search?q=${encodeURIComponent(aiTasks[idx]!.certification_recommendation)}` });
    }

    return { task, pct, evidence, learn };
  });

  const matchScore = Math.round(Number(jobData?.match_score || 0));

  return (
    <div className="bg-white/90 border border-gray-200 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 text-white rounded-md flex items-center justify-center">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500">AI Strategy One‑Pager</div>
            <div className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">{jobData?.title}</div>
          </div>
        </div>
        <div className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
          {matchScore}% match
        </div>
      </div>

      {/* Dense grid: 3 columns on xl (2 columns tasks + 1 evidence) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Tasks grid (spans two columns on xl) */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {taskCards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="border border-gray-200 rounded-lg p-2.5 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[12px] text-gray-900 font-medium leading-snug line-clamp-2">{c.task}</div>
                <div className="text-[11px] font-bold text-gray-700">{c.pct}%</div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${c.pct>=80? 'bg-green-500': c.pct>=60? 'bg-blue-500': c.pct>=40? 'bg-yellow-500':'bg-red-500'}`}
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              {aiTasks[i]?.task_explainer && (
                <div className="mt-1 text-[11px] text-gray-600 leading-snug line-clamp-2">{aiTasks[i]!.task_explainer}</div>
              )}
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {c.learn.slice(0,2).map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] border border-amber-200 hover:bg-amber-100">
                      {l.label.replace(' crash course','')}
                    </a>
                  ))}
                </div>
                {/* Intentionally no per‑task Tailor button for a cleaner design */}
              </div>
              {/* Evidence tooltip on hover */}
              {(aiTasks[i]?.user_alignment || c.evidence.length > 0) && (
                <div className="mt-1.5 text-[10px] text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-gray-400" />
                  <span className="truncate" title={aiTasks[i]?.user_alignment || c.evidence[0]}>
                    {aiTasks[i]?.user_alignment || c.evidence[0]}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Evidence column */}
        <div className="xl:col-span-1 border border-gray-200 rounded-lg p-3 xl:border-l xl:pl-4">
          <div className="space-y-2">
            <div className="bg-gray-50/60 border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-gray-700" />
                <div className="text-[12px] font-semibold text-gray-800">Relevant Experience</div>
              </div>
              <ul className="space-y-2">
                {(userProfile?.experience || []).slice(0,3).map((e: any, idx: number) => {
                  const first = stripTags(e?.achievements?.[0] || e?.description || '');
                  // Strict relevance: only derive a relation if overlap is strong (>50%)
                  const maybe = bestRelatedTask(first || `${e?.position} ${e?.company}`, taskCards.map(t => t.task));
                  const related = maybe && jaccard(new Set(norm(maybe).split(' ').filter(w => w.length>3)), new Set((first?norm(first):'').split(' ').filter(w => w.length>3))) > 0.5 ? maybe : null;
                  return (
                    <li key={idx} className="text-[12px] text-gray-800 leading-snug">
                      <div className="font-semibold text-gray-900">{e?.position} <span className="text-gray-500">@ {e?.company}</span></div>
                      {first && <div className="text-[12px] text-gray-700 line-clamp-2">{first}</div>}
                      {related && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] border border-blue-200">relates: {related}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
                {(!userProfile?.experience || userProfile.experience.length===0) && (
                  <li className="text-[12px] text-gray-500">No prior experience listed</li>
                )}
              </ul>
            </div>

            <div className="bg-gray-50/60 border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-700" />
                <div className="text-[12px] font-semibold text-gray-800">Projects</div>
              </div>
              <ul className="space-y-2">
                {(userProfile?.projects || []).slice(0,3).map((p: any, idx: number) => {
                  const desc = stripTags(p?.description || '');
                  const related = bestRelatedTask(desc || p?.name || '', taskCards.map(t => t.task));
                  return (
                    <li key={idx} className="text-[12px] text-gray-800 leading-snug">
                      <div className="font-semibold text-gray-900">{p?.name}</div>
                      {desc && <div className="text-[12px] text-gray-700 line-clamp-2">{desc}</div>}
                      {related && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] border border-emerald-200">relates: {related}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
                {(!userProfile?.projects || userProfile.projects.length===0) && (
                  <li className="text-[12px] text-gray-500">No projects listed</li>
                )}
              </ul>
            </div>

            <div className="bg-gray-50/60 border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-gray-700" />
                <div className="text-[12px] font-semibold text-gray-800">Certifications</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {(userProfile?.certifications || []).slice(0,4).map((c: any, idx: number) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-white text-gray-800 rounded-full text-[10px] border border-gray-200" title={c?.issuer || ''}>{c?.name}</span>
                ))}
                {(!userProfile?.certifications || userProfile.certifications.length===0) && (
                  <span className="text-[12px] text-gray-500">No certifications</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
