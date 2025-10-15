"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Briefcase, FileText, Award, Info, ExternalLink } from 'lucide-react';

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

export default function StrategyOnePager({ userProfile, jobData, strategy, onTailorSkills, onMatchScoreCalculated }: Props) {
  // Source tasks from strategy job_task_analysis (with Claude learning paths)
  const rawTasks: string[] = (strategy?.job_task_analysis?.map((t: any) => t.task) || jobData?.responsibilities || [])
    .filter((t: any) => !!t && typeof t === 'string');

  // Keep the top 6 tasks for a dense layout
  const tasks = rawTasks.slice(0, 6);

  const { skills, exp, projects, certs, normAll } = buildResumeCorpus(userProfile || {});

  // Get task analysis from strategy (with Claude-generated learning_paths)
  const aiTasks: Array<{
    task: string;
    task_explainer?: string;
    user_alignment?: string;
    compatibility_score?: number;
    user_evidence?: string;
    learning_paths?: {
      quick_wins?: Array<{ label: string; url: string }>;
      certifications?: Array<{ label: string; url: string }>;
      deepening?: Array<{ label: string; url: string }>;
    };
  }> = (strategy?.job_task_analysis || []).map((t: any) => ({
    task: t?.task,
    task_explainer: t?.task_explainer,
    user_alignment: t?.user_alignment,
    compatibility_score: typeof t?.compatibility_score === 'number' ? t.compatibility_score : undefined,
    user_evidence: t?.user_evidence,
    learning_paths: t?.learning_paths
  })).filter((t: any) => t.task);

  const taskCards = (aiTasks.length > 0 ? aiTasks.map((t: any) => t.task) : tasks).map((task: any, idx: number) => {
    const taskNorm = norm(task);
    const taskTokens = new Set(taskNorm.split(' ').filter((w: any) => w.length > 3));
    const resumeTokens = new Set(normAll.flatMap((s: any) => s.split(' ').filter((w: any) => w.length > 3)));

    // Token overlap score
    const tokScore = jaccard(taskTokens, resumeTokens);

    // Skill hit bonus
    const skillHit = skills.some((s: any) => {
      const n = norm(String(s));
      return n && (taskNorm.includes(n) || n.includes(taskNorm));
    }) ? 0.15 : 0;

    // Use AI compatibility score if available
    const aiCompat = aiTasks[idx]?.compatibility_score;
    const score = Math.min(1, typeof aiCompat === 'number' ? aiCompat / 100 : tokScore * 0.85 + skillHit);
    const pct = Math.round(score * 100);

    // Evidence from AI or fallback
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
      aiTasks[idx]?.user_evidence || undefined,
      findEv(exp, 'Experience'),
      findEv(projects, 'Project'),
      findEv(certs, 'Cert')
    ].filter((x: any) => Boolean(x)) as string[];

    // ONLY use Claude-generated learning paths - NO FALLBACKS
    const learningPaths = aiTasks[idx]?.learning_paths || {};
    const learn = [
      ...(learningPaths.quick_wins || []),
      ...(learningPaths.certifications || []),
      ...(learningPaths.deepening || [])
    ].filter((item): item is { label: string; url: string } =>
      !!item && typeof item === 'object' && !!item.label && !!item.url
    );

    return { task, pct, evidence, learn };
  });

  // Calculate match score
  const serverScore = (typeof jobData?.match_score === 'number') ? Number(jobData.match_score) : NaN;
  const aiCompatAvg = (() => {
    const vals = (strategy?.job_task_analysis || [])
      .map((t: any) => typeof t?.compatibility_score === 'number' ? t.compatibility_score : null)
      .filter((v: number | null) => typeof v === 'number') as number[];
    if (!vals.length) return NaN;
    return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
  })();
  const cardPctAvg = taskCards.length ? Math.round(taskCards.reduce((a: number, b: any) => a + (b.pct || 0), 0) / taskCards.length) : NaN;
  const matchScore = Number.isFinite(serverScore) && serverScore > 0
    ? Math.round(serverScore)
    : Number.isFinite(aiCompatAvg)
      ? aiCompatAvg
      : Number.isFinite(cardPctAvg) ? cardPctAvg : 0;

  // Call the callback when match score is calculated
  React.useEffect(() => {
    if (onMatchScoreCalculated && matchScore > 0) {
      onMatchScoreCalculated(matchScore);
    }
  }, [matchScore, onMatchScoreCalculated]);

  return (
    <div className="card card-elevated" style={{ padding: '2rem' }}>
      {/* Grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tasks grid (spans two columns on xl) */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {taskCards.map((c: any, i: number) => (
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

              {/* QUICK LEARNING PATH - Claude generated links only */}
              {c.learn.length > 0 && (
                <div className="mb-4">
                  <div className="text-caption text-gray-600 font-medium mb-2 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    QUICK LEARNING PATH
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.learn.slice(0, 2).map((l: any, idx2: number) => (
                      <a
                        key={`${l.url}-${i}-${idx2}`}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg transition-colors border border-emerald-200"
                        style={{ textDecoration: 'none' }}
                      >
                        {l.label}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence/Alignment */}
              {(aiTasks[i]?.user_alignment || c.evidence.length > 0) && (
                <div className="info-box info-box-primary">
                  <Info className="info-box-icon" />
                  <div className="info-box-content line-clamp-3">
                    <strong>What you bring:</strong> {aiTasks[i]?.user_alignment || c.evidence[0]}
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
              {(userProfile?.experience || []).slice(0, 3).map((e: any, idx: number) => {
                const first = stripTags(e?.achievements?.[0] || e?.description || '');
                const maybe = bestRelatedTask(first || `${e?.position} ${e?.company}`, taskCards.map((t: any) => t.task));
                const related = maybe && jaccard(new Set(norm(maybe).split(' ').filter((w: any) => w.length > 3)), new Set((first ? norm(first) : '').split(' ').filter((w: any) => w.length > 3))) > 0.5 ? maybe : null;
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
              {(!userProfile?.experience || userProfile.experience.length === 0) && (
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
              {(userProfile?.projects || []).slice(0, 3).map((p: any, idx: number) => {
                const desc = stripTags(p?.description || '');
                const related = bestRelatedTask(desc || p?.name || '', taskCards.map((t: any) => t.task));
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
              {(!userProfile?.projects || userProfile.projects.length === 0) && (
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
              {(userProfile?.certifications || []).slice(0, 4).map((c: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <div>
                    <div className="text-body font-medium text-gray-900">{c?.name}</div>
                    {c?.issuer && <div className="text-caption text-gray-500">{c?.issuer} {c?.date && `• ${c?.date}`}</div>}
                  </div>
                </div>
              ))}
              {(!userProfile?.certifications || userProfile.certifications.length === 0) && (
                <span className="text-caption">No certifications</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
