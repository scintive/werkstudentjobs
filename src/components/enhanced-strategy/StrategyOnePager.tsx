"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Briefcase, FileText, Award, Info } from 'lucide-react';
import { bestFallbackFor } from '@/lib/linkSources';

type Props = {
  userProfile: any;
  jobData: any;
  strategy?: any;
  onTailorSkills?: () => void;
  onMatchScoreCalculated?: (score: number) => void;
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

// Fallback keyword generator for crash-course searches when GPT keywords are unavailable
function fallbackKeywordFor(task: string): string {
  const raw = (task || '').toLowerCase();
  // Remove punctuation
  const cleaned = raw.replace(/[^a-z0-9\s+.-]/g, ' ');
  const stop = new Set(['the','and','for','with','to','of','on','in','into','using','through','by','a','an','as','that','this','these','those','across','including','such','as','over','new','key']);
  const tokens = cleaned.split(/\s+/).filter(w => w && !stop.has(w) && w.length > 2);
  // Pick up to 3 most meaningful tokens (prefer hyphenated or long tokens)
  const scored = tokens.map(w => ({ w, s: (w.includes('-')?3:0) + (w.length>=8?2:w.length>=6?1:0) }));
  scored.sort((a,b)=>b.s-a.s);
  const pick = Array.from(new Set(scored.map(x=>x.w))).slice(0,3);
  const kw = pick.join(' ') || tokens.slice(0,3).join(' ');
  return kw || 'fundamentals';
}

function sanitizeKeyword(keyword?: string): string | undefined {
  if (!keyword || typeof keyword !== 'string') return undefined;
  const cleaned = keyword.toLowerCase().replace(/[^a-z0-9\s+.-]/g, ' ');
  const parts = cleaned.trim().split(/\s+/).filter(Boolean).slice(0,4);
  if (parts.length === 0) return undefined;
  return parts.join(' ');
}

// Suggest quick learning resources (URLs are generic search queries; no external calls)
function quickLearnLinks(task: string): { label: string; url: string }[] {
  const t = norm(task);
  const q = encodeURIComponent(task);
  const YT = (label = 'Crash course') => ({ label, url: `https://www.youtube.com/results?search_query=${q}+crash+course` });
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

export default function StrategyOnePager({ userProfile, jobData, strategy, onTailorSkills, onMatchScoreCalculated }: Props) {
  // Source tasks from strategy when available, else job responsibilities
  const rawTasks: string[] = (strategy?.job_task_analysis?.map((t: any) => t.task) || jobData?.responsibilities || [])
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

    // Learning paths: prefer AI-provided direct links if available; otherwise fall back to meaningful searches
    const normalizeItems = (arr: any[]): { label: string; url: string }[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => {
        if (!item) return null;
        if (typeof item === 'object' && (item.label || item.name) && item.url) {
          return { label: String(item.label || item.name), url: String(item.url) };
        }
        const label = typeof item === 'string' ? item : String(item);
        // Prefer direct docs/cert vendors when the label matches known providers
        return bestFallbackFor(label, task);
      }).filter(Boolean) as { label: string; url: string }[];
    };

    const aiQuick = normalizeItems(aiTasks[idx]?.learning_paths?.quick_wins || []);
    const aiCerts = normalizeItems(aiTasks[idx]?.learning_paths?.certifications || []);
    const aiDeep = normalizeItems(aiTasks[idx]?.learning_paths?.deepening || []);
    let learn = [...aiQuick, ...aiCerts, ...aiDeep];
    if (learn.length < 2) {
      learn = [...learn, ...quickLearnLinks(task)];
    }
    if (aiTasks[idx]?.certification_recommendation) {
      const cf = bestFallbackFor(aiTasks[idx]!.certification_recommendation, task);
      learn.unshift(cf);
    }

    return { task, pct, evidence, learn };
  });

  // Verified links state (per card index)
  const [verifiedLinks, setVerifiedLinks] = React.useState<Record<number, { label: string; url: string }[]>>({});
  const [verifyOk, setVerifyOk] = React.useState<Record<string, boolean>>({});
  const [isVerifying, setIsVerifying] = React.useState<boolean>(false);
  const [crashKw, setCrashKw] = React.useState<Record<number, string>>({});

  // Get optimized crash-course keywords for each task (once)
  React.useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/links/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: taskCards.map(t => t.task) }),
          signal: controller.signal
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.keywords) setCrashKw(data.keywords);
      } catch {}
    })();
    return () => controller.abort();
  }, [JSON.stringify(taskCards.map(t => t.task))]);

  React.useEffect(() => {
    // Collect all visible links and verify via API; if any invalid, swap for crash-course/search fallback
    const all = taskCards.flatMap((c) => c.learn).filter(Boolean);
    if (all.length === 0) return;
    const unique = Array.from(new Map(all.map(l => [l.url, l])).values());
    const controller = new AbortController();
    (async () => {
      try {
        setIsVerifying(true);
        const res = await fetch('/api/links/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ links: unique }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const results: Record<string, { ok: boolean }> = data?.results || {};
        setVerifyOk(Object.fromEntries(Object.entries(results).map(([u, r]: any) => [u, !!r.ok])));
        // Build per-card arrays with fallbacks for broken links
        const next: Record<number, { label: string; url: string }[]> = {};
        taskCards.forEach((c, i) => {
          const kw = sanitizeKeyword(crashKw[i]) || fallbackKeywordFor(c.task);
          const crashForTask = { label: `Crash course: ${kw}`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(kw + ' crash course')}` };
          const googleForTask = { label: `Google: ${kw}`, url: `https://www.google.com/search?q=${encodeURIComponent(kw)}` };
          const isCrash = (lab: string, url: string) => /crash course/i.test(lab) || /youtube\.com\/results\?search_query=/i.test(url);
          let items = c.learn.map((l) => {
            const vr = results[l.url];
            // Normalize any crash-course item to our optimized keyword version
            if (isCrash(l.label || '', l.url || '')) return crashForTask;
            // If a deep YouTube video, convert to search for stability
            if (/youtube\.com\/watch\?v=|youtu\.be\//i.test(l.url || '')) {
              return crashForTask;
            }
            if (vr && vr.ok) return l;
            // Smarter fallback based on label/task
            return bestFallbackFor(l.label, c.task);
          });
          // De‑duplicate by URL and avoid duplicate 'Quick Crash Course'
          const seen = new Set<string>();
          let hasCrash = false;
          const dedup: { label: string; url: string }[] = [];
          for (const it of items) {
            const key = (it.url || '').toLowerCase();
            const nowCrash = isCrash(it.label || '', it.url || '');
            if (seen.has(key)) continue;
            if (nowCrash && hasCrash) continue;
            seen.add(key);
            if (nowCrash) hasCrash = true;
            dedup.push(it);
          }
          items = dedup;
          // Guarantee at least one crash course and one non‑crash if possible
          if (!items.some(it => isCrash(it.label || '', it.url || ''))) {
            items.unshift(crashForTask);
          }
          if (items.filter(it => !isCrash(it.label || '', it.url || '')).length === 0) {
            items.push(googleForTask);
          }
          next[i] = items;
        });
        setVerifiedLinks(next);
      } catch {
      } finally {
        setIsVerifying(false);
      }
    })();
    return () => controller.abort();
  }, [JSON.stringify(taskCards.map(c => c.learn)), JSON.stringify(crashKw)]);

  // Effective match score: prefer server match_score; otherwise derive from AI task compat or local pct average
  const serverScore = (typeof jobData?.match_score === 'number') ? Number(jobData.match_score) : NaN;
  const aiCompatAvg = (() => {
    const vals = (strategy?.job_task_analysis || [])
      .map((t: any) => typeof t?.compatibility_score === 'number' ? t.compatibility_score : null)
      .filter((v: number | null) => typeof v === 'number') as number[];
    if (!vals.length) return NaN;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  })();
  const cardPctAvg = taskCards.length ? Math.round(taskCards.reduce((a, b) => a + (b.pct || 0), 0) / taskCards.length) : NaN;
  const matchScore = Number.isFinite(serverScore) && serverScore > 0
    ? Math.round(serverScore)
    : Number.isFinite(aiCompatAvg)
      ? aiCompatAvg
      : Number.isFinite(cardPctAvg) ? cardPctAvg : 0;
  const isEstimated = !(Number.isFinite(serverScore) && serverScore > 0);

  // Call the callback when match score is calculated
  React.useEffect(() => {
    if (onMatchScoreCalculated && matchScore > 0) {
      onMatchScoreCalculated(matchScore);
    }
  }, [matchScore, onMatchScoreCalculated]);

  return (
    <div className="card card-elevated" style={{ padding: '2rem' }}>
      {/* Header */}
      <div className="card-header" style={{ paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div className="flex items-center gap-4 flex-1">
          <div className="icon-container icon-container-lg icon-container-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-heading-2">Job Analysis</div>
            <div className="text-caption mt-1">AI-powered task breakdown and skill matching</div>
          </div>
        </div>
        <div className="badge badge-success badge-lg" title={isEstimated ? 'Estimated from task analysis' : 'Server match score'}>
          {matchScore}% match
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tasks grid (spans two columns on xl) */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {taskCards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="card"
              style={{ padding: '1.25rem' }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="text-body-large font-semibold leading-snug line-clamp-2 flex-1">{c.task}</div>
                <div className="text-lg font-bold text-blue-600 flex-shrink-0">{c.pct}%</div>
              </div>
              <div className="progress-bar mb-4">
                <div className="progress-bar-fill" style={{ width: `${c.pct}%` }} />
              </div>
              {aiTasks[i]?.task_explainer && (
                <div className="text-body-small mb-4 leading-relaxed line-clamp-3">{aiTasks[i]!.task_explainer}</div>
              )}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {(verifiedLinks[i] || c.learn).slice(0,2).map((l, idx2) => (
                  <a
                    key={`${l.url}-${i}-${idx2}`}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-emerald"
                    style={{ textDecoration: 'none' }}
                  >
                    {l.label}
                    {verifyOk[l.url] && <CheckCircle className="w-3.5 h-3.5" />}
                  </a>
                ))}
                {isVerifying && (
                  <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" aria-label="Verifying links" />
                )}
              </div>
              {/* Evidence info box */}
              {(aiTasks[i]?.user_alignment || c.evidence.length > 0) && (
                <div className="info-box info-box-primary">
                  <Info className="info-box-icon" />
                  <div className="info-box-content line-clamp-3">
                    {aiTasks[i]?.user_alignment || c.evidence[0]}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Evidence column */}
        <div className="xl:col-span-1 space-y-5">
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-container icon-container-md icon-container-primary">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-heading-4">Relevant Experience</div>
            </div>
            <ul className="space-y-4">
              {(userProfile?.experience || []).slice(0,3).map((e: any, idx: number) => {
                const first = stripTags(e?.achievements?.[0] || e?.description || '');
                // Strict relevance: only derive a relation if overlap is strong (>50%)
                const maybe = bestRelatedTask(first || `${e?.position} ${e?.company}`, taskCards.map(t => t.task));
                const related = maybe && jaccard(new Set(norm(maybe).split(' ').filter(w => w.length>3)), new Set((first?norm(first):'').split(' ').filter(w => w.length>3))) > 0.5 ? maybe : null;
                return (
                  <li key={idx} className="text-body-small leading-relaxed">
                    <div className="text-label">{e?.position}</div>
                    <div className="text-caption mb-2">@ {e?.company}</div>
                    {first && <div className="text-body-small line-clamp-2 mb-2 leading-relaxed">{first}</div>}
                    {related && (
                      <span className="badge badge-primary badge-sm">
                        Relates to: {related}
                      </span>
                    )}
                  </li>
                );
              })}
              {(!userProfile?.experience || userProfile.experience.length===0) && (
                <li className="text-caption">No prior experience listed</li>
              )}
            </ul>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-container icon-container-md icon-container-success">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-heading-4">Projects</div>
            </div>
            <ul className="space-y-4">
              {(userProfile?.projects || []).slice(0,3).map((p: any, idx: number) => {
                const desc = stripTags(p?.description || '');
                const related = bestRelatedTask(desc || p?.name || '', taskCards.map(t => t.task));
                return (
                  <li key={idx} className="text-body-small leading-relaxed">
                    <div className="text-label">{p?.name}</div>
                    {desc && <div className="text-body-small line-clamp-2 mb-2 leading-relaxed">{desc}</div>}
                    {related && (
                      <span className="badge badge-emerald badge-sm">
                        Relates to: {related}
                      </span>
                    )}
                  </li>
                );
              })}
              {(!userProfile?.projects || userProfile.projects.length===0) && (
                <li className="text-caption">No projects listed</li>
              )}
            </ul>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-container icon-container-md icon-container-purple">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-heading-4">Certifications</div>
            </div>
            <div className="space-y-2">
              {(userProfile?.certifications || []).slice(0,4).map((c: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-body font-medium text-gray-900">{c?.name}</div>
                    {c?.issuer && <div className="text-caption text-gray-500">{c?.issuer} {c?.date && `• ${c?.date}`}</div>}
                  </div>
                </div>
              ))}
              {(!userProfile?.certifications || userProfile.certifications.length===0) && (
                <span className="text-caption">No certifications</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
