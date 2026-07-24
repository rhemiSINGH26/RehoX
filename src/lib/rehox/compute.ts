import {
  COMPANIES,
  getCompanyExpectation,
  getMandatoryCompetencies,
  getCompanyWeights,
  resolveCompanyName,
} from "./company-expectations";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  type CategoryCode,
  type CompetencyLevels,
  type GapSeverity,
  type ParsedSource,
  type Profile,
  type Skill,
  type SkillMatchResult,
  type SkillsetGapRow,
  type TalentCheckCategoryCode,
  type TalentCheckPriorityItem,
  type TalentCheckResult,
} from "./types";

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
    if (arr.length === 0) {
      out[c] = 0;
      continue;
    }
    const w = arr.reduce(
      (sum, s) => sum + (s.confidence === "high" ? 3 : s.confidence === "medium" ? 2 : 1),
      0,
    );
    // 1 signal ~ 4, 2 ~ 6, 3+ ~ 7-9 depending on confidence
    const base = 3 + Math.min(6, w);
    out[c] = Math.max(1, Math.min(10, base));
  }
  out.OTHER = 0;
  return out;
}

export function validateCompetencyLevels(
  levels: Partial<Record<TalentCheckCategoryCode, unknown>> | undefined,
): CompetencyLevels {
  if (!levels) {
    throw new Error("Candidate profile is missing competency_levels for Talent Check.");
  }

  const validatedLevels = {} as CompetencyLevels;
  for (const category of CATEGORY_ORDER) {
    const level = levels[category];
    if (!Number.isInteger(level) || level < 1 || level > 10) {
      throw new Error(
        `Candidate competency level for ${category} must be an integer from 1 to 10.`,
      );
    }
    validatedLevels[category] = level;
  }

  return validatedLevels;
}

function getGapSeverity(required_level: number, candidate_level: number): GapSeverity {
  const gap_size = Math.max(0, required_level - candidate_level);
  if (gap_size === 0) return "met";
  if (gap_size === 1) return "minor";
  if (gap_size <= 3) return "moderate";
  return "critical";
}

function getReadinessBand(score: number, mandatoryShortfalls: number): TalentCheckResult["readiness_band"] {
  if (score >= 80 && mandatoryShortfalls === 0) return "Interview Ready";
  if (score >= 65) return "Nearly Ready";
  if (score >= 45) return "Developing";
  return "Significant Skill Gaps";
}

function buildExplanation(
  score: number,
  gapCount: number,
  mandatoryShortfalls: number,
  topPriority: TalentCheckPriorityItem | undefined,
): string {
  const topPriorityLabel = topPriority ? CATEGORY_LABEL[topPriority.category_code] : "none";
  const mandatoryText =
    mandatoryShortfalls === 0
      ? "No mandatory competency fell below target."
      : `${mandatoryShortfalls} mandatory competency${mandatoryShortfalls === 1 ? "" : "ies"} remain below target.`;
  return `Weighted score ${score}/100 uses company-specific weights, with Coding and DSA treated as mandatory competencies. ${gapCount} gap${gapCount === 1 ? "" : "s"} remain, and ${mandatoryText} The top priority is ${topPriorityLabel}.`;
}

/**
 * Talent Check uses a transparent, deterministic algorithm:
 * 1. Read the company's required competency bar from the local JSON snapshot.
 * 2. Apply company-specific weights so higher-value skills influence the score more.
 * 3. Compare candidate levels against the required levels to compute a weighted readiness score.
 * 4. Mark each gap as met/minor/moderate/critical based on the size of the gap.
 * 5. Apply a soft penalty when a mandatory competency (Coding or DSA by default) remains below target.
 * 6. Rank improvement priorities using priority = weight × gap_size.
 */
export function runTalentCheck(
  profile: Pick<Profile, "competency_levels">,
  company: string,
): TalentCheckResult {
  const resolvedCompany = resolveCompanyName(company);
  if (!resolvedCompany) {
    throw new Error(`Unknown company "${company}". Available companies: ${COMPANIES.join(", ")}.`);
  }

  const expectation = getCompanyExpectation(resolvedCompany);
  if (!expectation) {
    throw new Error(`No expectations found for company "${resolvedCompany}".`);
  }

  const levels = validateCompetencyLevels(profile.competency_levels);
  const weights = getCompanyWeights(resolvedCompany);
  const mandatoryCompetencies = new Set(getMandatoryCompetencies(resolvedCompany));

  const rows: SkillsetGapRow[] = CATEGORY_ORDER.map((category) => {
    const required_level = expectation.required_levels[category];
    const candidate_level = levels[category];
    const gap_size = Math.max(0, required_level - candidate_level);
    const gap = gap_size > 0;
    const severity = getGapSeverity(required_level, candidate_level);
    const importance_weight = weights[category] ?? 1;
    const priority = gap ? importance_weight * gap_size : 0;

    return {
      category_code: category,
      required_level,
      candidate_level,
      gap,
      severity,
      importance_weight,
      gap_size,
      priority,
    };
  });

  const totalWeight = rows.reduce((sum, row) => sum + (row.importance_weight ?? 1), 0);
  const weightedCoverage = rows.reduce(
    (sum, row) => sum + Math.min(row.candidate_level / row.required_level, 1) * (row.importance_weight ?? 1),
    0,
  );

  let score = Math.round((weightedCoverage / totalWeight) * 100);
  let mandatoryShortfalls = rows.filter(
    (row) => mandatoryCompetencies.has(row.category_code) && row.gap,
  ).length;

  if (mandatoryShortfalls > 0) {
    const mandatoryPenalty = Math.min(12, mandatoryShortfalls * 4);
    score = Math.max(0, score - mandatoryPenalty);
  }

  const readiness_band = getReadinessBand(score, mandatoryShortfalls);
  const topPriorities = rows
    .filter((row) => row.gap)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.gap_size! - a.gap_size!)
    .slice(0, 3)
    .map((row) => ({
      category_code: row.category_code,
      priority: row.priority ?? 0,
      gap_size: row.gap_size ?? 0,
      severity: row.severity ?? "critical",
    }));

  return {
    company: resolvedCompany,
    skillset_gap: rows,
    readiness_score: score,
    readiness_band,
    explanation: buildExplanation(score, rows.filter((row) => row.gap).length, mandatoryShortfalls, topPriorities[0]),
    top_priorities: topPriorities,
  };
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
  if (score >= 80) return "Interview Ready";
  if (score >= 65) return "Nearly Ready";
  if (score >= 45) return "Developing";
  return "Significant Skill Gaps";
}
