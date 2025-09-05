Matching Flow Summary (Ground Truth)

Inputs
- Resume skills: strings and objects (e.g., {skill, proficiency}, {name}).
- Job skills/tools: multiple sources per job row:
  - skills_canonical_flat (preferred for matching)
  - skills_canonical (fallback)
  - skills_original (legacy)
  - named_skills_tools (primarily tools)

Normalization
- For both resume and job inputs:
  - toString → trim → collapse whitespace → lowercase
  - remove stray punctuation except +, #, -, .
  - expand simple synonyms for common tech (js/javascript, node/node.js, etc.)
  - de‑duplicate after normalization

Overlap
- Build sets of normalized resume skills and job skills.
- For each resume skill, find best matching job skill using:
  - exact match (1.0), contains/contained (0.8), fuzzy (Levenshtein > 0.7 → 0.6)
- Overlap object (used by UI chips):
  - matched: string[] (normalized labels that matched)
  - onlyInResume: string[] (resume minus job)
  - onlyInJob: string[] (job minus resume)

Score (fast matching)
- Components (research‑based weights):
  - skills 50%, tools 20%, experience 15%, language 10%, location 5%
- Skills/tools subscore uses TF‑IDF‑style importance weighting + confidence from match quality.
  - coverage = matchedImportance / totalImportance
  - final skill score = 0.7*coverage + 0.3*avgConfidence
- Total score = weighted sum of components, rounded 0–100.

Server Response Structure
- matchCalculation: {
  skillsOverlap: { matched, onlyInResume, onlyInJob, score, intersection?, missing? },
  toolsOverlap:  { matched, onlyInResume, onlyInJob, score, intersection?, missing? },
  languageFit:   { score, required, userHas, explanation },
  locationFit:   { score, jobLocation, userLocation, remoteAllowed, explanation },
  totalScore: number,
  weights: { skills, tools, experience, language, location }
}

UI Contract
- Prefer server overlap for chips:
  const server = selectedJob?.matchCalculation?.skillsOverlap?.matched ?? []
  const fallback = computeClientIntersection(...)
  const matched = server.length > 0 ? server : fallback
- Percentages come from match_score and matchCalculation.totalScore.

Notes
- Jobs with empty original arrays must still match via canonical arrays.
- Resume skills may arrive under various categories; server treats any object values as arrays and concatenates all categories.
