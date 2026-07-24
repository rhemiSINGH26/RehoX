import { CATEGORY_ORDER, type CategoryCode, type ParsedSource, type Profile, type Skill, type SkillMatchResult, type SkillsetGapRow, type TalentCheckResult } from "./types";
import { COMPANY_REQUIRED, type Company } from "./mockData";

// Estimate candidate level (1-10) per category from their skills.
export function candidateLevels(skills: Skill[]): Record<CategoryCode, number> {
  const buckets: Record<CategoryCode, Skill[]> = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, [] as Skill[]]),
  ) as Record<CategoryCode, Skill[]>;
  buckets.OTHER = [];
  for (const sk of skills) {
    (buckets[sk.category_code] ??= []).push(sk);
  }
  const out = {} as Record<CategoryCode, number>;
  for (const c of CATEGORY_ORDER) {
    const arr = buckets[c] ?? [];
    if (arr.length === 0) { out[c] = 0; continue; }
    const w = arr.reduce((sum, s) => sum + (s.confidence === "high" ? 3 : s.confidence === "medium" ? 2 : 1), 0);
    // 1 signal ~ 4, 2 ~ 6, 3+ ~ 7-9 depending on confidence
    const base = 3 + Math.min(6, w);
    out[c] = Math.max(1, Math.min(10, base));
  }
  out.OTHER = 0;
  return out;
}

export function runTalentCheck(profile: Profile, company: Company): TalentCheckResult {
  const required = COMPANY_REQUIRED[company];
  const levels = candidateLevels(profile.skills);
  const rows: SkillsetGapRow[] = CATEGORY_ORDER.map((c) => ({
    category_code: c,
    required_level: required[c],
    candidate_level: levels[c],
    gap: levels[c] < required[c],
  }));
  const totalReq = rows.reduce((s, r) => s + r.required_level, 0);
  const totalHit = rows.reduce((s, r) => s + Math.min(r.candidate_level, r.required_level), 0);
  const score = Math.round((totalHit / totalReq) * 100);
  return { company, skillset_gap: rows, readiness_score: score };
}

export function runSkillMatch(profile: Profile, jd: ParsedSource): SkillMatchResult {
  const profileCats = new Set(profile.skills.map((s) => s.category_code));
  const matched: Skill[] = [];
  const missing: Skill[] = [];
  for (const req of jd.skills) {
    if (profileCats.has(req.category_code)) matched.push(req);
    else missing.push(req);
  }
  const score = Math.round((matched.length / Math.max(1, jd.skills.length)) * 100);
  return {
    jd_source_file: jd.source_file,
    match_score: score,
    matched_skills: matched,
    missing_skills: missing,
  };
}

export function readinessLabel(score: number): string {
  if (score >= 80) return "On track";
  if (score >= 60) return "Close";
  return "Early stage";
}