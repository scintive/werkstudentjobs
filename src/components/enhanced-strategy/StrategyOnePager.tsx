"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Briefcase, FileText, Award, Info, ExternalLink } from 'lucide-react';

type Props = {
  userProfile: unknown;
  jobData: unknown;
  strategy?: unknown;
  onTailorSkills?: () => void;
  onMatchScoreCalculated?: (score: number) => void;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\w\s+#.-]/g, " ").replace(/\s+/g, " ").trim();
}

function flatten(arr: unknown): string[] {
  const out: string[] = [];
  if (!arr) return out;
  if (Array.isArray(arr)) {
    for (const v of arr) {
      if (!v) continue;
      if (typeof v === 'string') out.push(v);
      else if (typeof v === 'object') {
        const vObj = v as Record<string, unknown>;
        out.push(String(vObj.skill || vObj.name || v));
      }
    }
  }
  return out;
}

function buildResumeCorpus(profile: unknown) {
  const profileObj = profile as Record<string, unknown>;
  const skills = flatten(Object.values((profileObj?.skills as Record<string, unknown>) || {}).flat());
  const exp = ((profileObj?.experience as unknown[]) || []).flatMap((e: unknown) => {
    const eObj = e as Record<string, unknown>;
    return flatten(eObj?.achievements) || [];
  });
  const projects = ((profileObj?.projects as unknown[]) || []).flatMap((p: unknown) => {
    const pObj = p as Record<string, unknown>;
    return [pObj?.name, pObj?.description];
  }).filter(Boolean);
  const certs = ((profileObj?.certifications as unknown[]) || []).flatMap((c: unknown) => {
    const cObj = c as Record<string, unknown>;
    return [cObj?.name, cObj?.issuer];
  }).filter(Boolean);
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
  const strategyObj = strategy as Record<string, unknown>;
  const jobDataObj = jobData as Record<string, unknown>;
  const userProfileObj = userProfile as Record<string, unknown>;

  // Source tasks from strategy job_task_analysis (with Claude learning paths)
  const rawTasks: string[] = (((strategyObj?.job_task_analysis as unknown[])?.map((t: unknown) => {
    const tObj = t as Record<string, unknown>;
    return tObj.task;
  }) || (jobDataObj?.responsibilities as unknown[]) || []) as unknown[])
    .filter((t: unknown) => !!t && typeof t === 'string') as string[];

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
  }> = ((strategyObj?.job_task_analysis as unknown[]) || []).map((t: unknown) => {
    const tObj = t as Record<string, unknown>;
    return {
      task: tObj?.task as string,
      task_explainer: tObj?.task_explainer as string | undefined,
      user_alignment: tObj?.user_alignment as string | undefined,
      compatibility_score: typeof tObj?.compatibility_score === 'number' ? tObj.compatibility_score : undefined,
      user_evidence: tObj?.user_evidence as string | undefined,
      learning_paths: tObj?.learning_paths as {
        quick_wins?: Array<{ label: string; url: string }>;
        certifications?: Array<{ label: string; url: string }>;
        deepening?: Array<{ label: string; url: string }>;
      } | undefined
    };
  }).filter((t: any) => t.task);

  const taskCards = (aiTasks.length > 0 ? aiTasks.map((t: any) => t.task) : tasks).map((task: unknown, idx: number) => {
    const taskNorm = norm(task as string);
    const taskTokens = new Set(taskNorm.split(' ').filter((w: string) => w.length > 3));
    const resumeTokens = new Set(normAll.flatMap((s: string) => s.split(' ').filter((w: string) => w.length > 3)));

    // Token overlap score
    const tokScore = jaccard(taskTokens, resumeTokens);

    // Skill hit bonus
    const skillHit = skills.some((s: unknown) => {
      const n = norm(String(s));
      return n && (taskNorm.includes(n) || n.includes(taskNorm));
    }) ? 0.15 : 0;

    // Use AI compatibility score if available
    const aiCompat = aiTasks[idx]?.compatibility_score;
    const score = Math.min(1, typeof aiCompat === 'number' ? aiCompat / 100 : tokScore * 0.85 + skillHit);
    const pct = Math.round(score * 100);

    // Evidence from AI or fallback
    const findEv = (arr: unknown[], label: string) => {
      for (const item of arr || []) {
        const itemObj = item as Record<string, unknown>;
        const text = typeof item === 'string' ? item : ((itemObj?.description as string) || (itemObj?.name as string) || (itemObj?.title as string) || item);
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
    ].filter((x: unknown) => Boolean(x)) as string[];

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
  const serverScore = (typeof jobDataObj?.match_score === 'number') ? Number(jobDataObj.match_score) : NaN;
  const aiCompatAvg = (() => {
    const vals = ((strategyObj?.job_task_analysis as unknown[]) || [])
      .map((t: unknown) => {
        const tObj = t as Record<string, unknown>;
        return typeof tObj?.compatibility_score === 'number' ? tObj.compatibility_score : null;
      })
      .filter((v: number | null) => typeof v === 'number') as number[];
    if (!vals.length) return NaN;
    return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
  })();
  const cardPctAvg = taskCards.length ? Math.round(taskCards.reduce((a: number, b: unknown) => {
    const bObj = b as Record<string, unknown>;
    return a + ((bObj.pct as number) || 0);
  }, 0) / taskCards.length) : NaN;
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
          {taskCards.map((c: unknown, i: number) => {
            const cObj = c as Record<string, unknown>;
            const learn = cObj.learn as Array<{ label: string; url: string }>;
            const evidence = cObj.evidence as string[];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="card"
                style={{ padding: '1.25rem' }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-body-large font-semibold leading-snug line-clamp-2 flex-1">{cObj.task as string}</div>
                  <div className="text-lg font-bold text-blue-600 flex-shrink-0">{cObj.pct as number}%</div>
                </div>
                <div className="progress-bar mb-4">
                  <div className="progress-bar-fill" style={{ width: `${cObj.pct as number}%` }} />
                </div>
                {aiTasks[i]?.task_explainer && (
                  <div className="text-body-small mb-4 leading-relaxed line-clamp-3">{aiTasks[i]!.task_explainer}</div>
                )}

                {/* QUICK LEARNING PATH - Claude generated links only */}
                {learn.length > 0 && (
                  <div className="mb-4">
                    <div className="text-caption text-gray-600 font-medium mb-2 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      QUICK LEARNING PATH
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {learn.slice(0, 2).map((l, idx2: number) => (
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
                {(aiTasks[i]?.user_alignment || evidence.length > 0) && (
                  <div className="info-box info-box-primary">
                    <Info className="info-box-icon" />
                    <div className="info-box-content line-clamp-3">
                      <strong>What you bring:</strong> {aiTasks[i]?.user_alignment || evidence[0]}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
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
              {((userProfileObj?.experience as unknown[]) || []).slice(0, 3).map((e: unknown, idx: number) => {
                const eObj = e as Record<string, unknown>;
                const achievements = eObj?.achievements as unknown[] | undefined;
                const first = stripTags((achievements?.[0] as string) || (eObj?.description as string) || '');
                const maybe = bestRelatedTask(first || `${eObj?.position} ${eObj?.company}`, taskCards.map((t: unknown) => {
                  const tObj = t as Record<string, unknown>;
                  return tObj.task as string;
                }));
                const related = maybe && jaccard(new Set(norm(maybe).split(' ').filter((w: string) => w.length > 3)), new Set((first ? norm(first) : '').split(' ').filter((w: string) => w.length > 3))) > 0.5 ? maybe : null;
                return (
                  <li key={idx} className="text-body-small leading-relaxed">
                    <div className="text-label">{eObj?.position as string}</div>
                    <div className="text-caption mb-2">@ {eObj?.company as string}</div>
                    {first && <div className="text-body-small line-clamp-2 mb-2 leading-relaxed">{first}</div>}
                    {related && (
                      <span className="badge badge-primary badge-sm">
                        Relates to: {related}
                      </span>
                    )}
                  </li>
                );
              })}
              {(!(userProfileObj?.experience as unknown[]) || (userProfileObj.experience as unknown[]).length === 0) && (
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
              {((userProfileObj?.projects as unknown[]) || []).slice(0, 3).map((p: unknown, idx: number) => {
                const pObj = p as Record<string, unknown>;
                const desc = stripTags((pObj?.description as string) || '');
                const related = bestRelatedTask(desc || (pObj?.name as string) || '', taskCards.map((t: unknown) => {
                  const tObj = t as Record<string, unknown>;
                  return tObj.task as string;
                }));
                return (
                  <li key={idx} className="text-body-small leading-relaxed">
                    <div className="text-label">{pObj?.name as string}</div>
                    {desc && <div className="text-body-small line-clamp-2 mb-2 leading-relaxed">{desc}</div>}
                    {related && (
                      <span className="badge badge-emerald badge-sm">
                        Relates to: {related}
                      </span>
                    )}
                  </li>
                );
              })}
              {(!(userProfileObj?.projects as unknown[]) || (userProfileObj.projects as unknown[]).length === 0) && (
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
              {((userProfileObj?.certifications as unknown[]) || []).slice(0, 4).map((c: unknown, idx: number) => {
                const cObj = c as Record<string, unknown>;
                const issuer = cObj?.issuer as string | undefined;
                const certDate = cObj?.date as string | undefined;
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="text-body font-medium text-gray-900">{cObj?.name as string}</div>
                      {issuer && <div className="text-caption text-gray-500">{issuer} {certDate && `• ${certDate}`}</div>}
                    </div>
                  </div>
                );
              })}
              {(!(userProfileObj?.certifications as unknown[]) || (userProfileObj.certifications as unknown[]).length === 0) && (
                <span className="text-caption">No certifications</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
