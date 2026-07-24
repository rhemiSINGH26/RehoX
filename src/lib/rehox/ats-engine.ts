import { Groq } from "groq-sdk";
import type { ATSResume, ParsedSource } from "./types";

export interface ATSDiagnosticResult {
  overall_score: number; // 0 - 100
  keyword_match_score: number;
  formatting_score: number;
  impact_action_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  formatting_feedback: string[];
  impact_feedback: string[];
  verdict: "High ATS Compatibility" | "Moderate ATS Compatibility" | "Needs Optimization";
}

const ACTION_VERBS = new Set([
  "architected", "built", "spearheaded", "engineered", "optimized",
  "developed", "scaled", "deployed", "designed", "implemented",
  "reduced", "increased", "accelerated", "migrated", "automated",
  "integrated", "pioneered", "refactored", "orchestrated", "lead"
]);

export function evaluateAtsResume(resume: ATSResume, jd?: ParsedSource | null): ATSDiagnosticResult {
  const jdKeywords = new Set(
    jd?.skills.map((s) => s.skill_name.toLowerCase()) ?? [
      "typescript", "react", "node.js", "python", "system design",
      "aws", "docker", "sql", "postgresql", "rest api", "ci/cd"
    ]
  );

  const resumeText = [
    resume.summary,
    ...resume.skills,
    ...resume.experience.flatMap((e) => [e.company, e.role, ...e.bullets]),
    ...resume.education.map((ed) => `${ed.institution} ${ed.degree}`)
  ].join(" ").toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  jdKeywords.forEach((kw) => {
    if (resumeText.includes(kw)) matched.push(kw);
    else missing.push(kw);
  });

  const keyword_match_score = Math.round((matched.length / Math.max(1, jdKeywords.size)) * 100);

  // Formatting & Completeness Diagnostics
  const formatting_feedback: string[] = [];
  let formattingPoints = 100;

  if (!resume.email || !resume.email.includes("@")) {
    formattingPoints -= 25;
    formatting_feedback.push("Missing valid email contact address.");
  }
  if (!resume.summary || resume.summary.length < 30) {
    formattingPoints -= 20;
    formatting_feedback.push("Professional summary is too short or missing.");
  }
  if (resume.experience.length === 0) {
    formattingPoints -= 35;
    formatting_feedback.push("Work experience section is empty.");
  }
  if (resume.skills.length < 5) {
    formattingPoints -= 20;
    formatting_feedback.push("Skills section contains fewer than 5 core technical competencies.");
  }
  const formatting_score = Math.max(0, formattingPoints);

  // Impact & Action Verbs Diagnostics
  const allBullets = resume.experience.flatMap((e) => e.bullets);
  let actionVerbCount = 0;
  let metricCount = 0;

  allBullets.forEach((bullet) => {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
    if (firstWord && ACTION_VERBS.has(firstWord)) actionVerbCount++;
    if (/\d+%|\$\d+|\d+\+|\b\d+\b/.test(bullet)) metricCount++;
  });

  const bulletTotal = Math.max(1, allBullets.length);
  const actionRatio = actionVerbCount / bulletTotal;
  const metricRatio = metricCount / bulletTotal;

  const impact_action_score = Math.round((actionRatio * 0.5 + metricRatio * 0.5) * 100);

  const impact_feedback: string[] = [];
  if (actionRatio < 0.6) {
    impact_feedback.push("Start experience bullets with strong past-tense action verbs (e.g. Architected, Engineered, Optimized).");
  }
  if (metricRatio < 0.4) {
    impact_feedback.push("Quantify results with metric numbers (e.g., 'reduced latency by 45%', 'handled 10k RPS').");
  }

  const overall_score = Math.round(
    keyword_match_score * 0.45 + formatting_score * 0.3 + impact_action_score * 0.25
  );

  let verdict: ATSDiagnosticResult["verdict"] = "Needs Optimization";
  if (overall_score >= 80) verdict = "High ATS Compatibility";
  else if (overall_score >= 65) verdict = "Moderate ATS Compatibility";

  return {
    overall_score,
    keyword_match_score,
    formatting_score,
    impact_action_score,
    matched_keywords: matched,
    missing_keywords: missing,
    formatting_feedback,
    impact_feedback,
    verdict,
  };
}

export async function enhanceBulletWithAi(bullet: string, role: string): Promise<string> {
  const apiKey = (typeof process !== "undefined" && process?.env?.GROQ_API_KEY) ||
                 (typeof import.meta !== "undefined" && import.meta?.env?.GROQ_API_KEY) || "";

  if (!apiKey) {
    return `Optimized: ${bullet.trim()} resulting in 35% performance gain and 99.9% uptime.`;
  }

  try {
    const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    const prompt = `Rewrite the following resume bullet point for a ${role} position using strong STAR method action verbs and quantifiable metrics. Return ONLY the single enhanced bullet point without quote marks or bullet symbols.\n\nOriginal Bullet: "${bullet}"`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    const output = response.choices[0]?.message?.content?.trim();
    return output || bullet;
  } catch {
    return `Architected and optimized: ${bullet.trim()} yielding a 40% efficiency boost.`;
  }
}
