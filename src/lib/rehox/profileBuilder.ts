import type { CategoryCode, Profile, Skill } from "./types";

export interface RawResumeInput {
  name?: string;
  email?: string;
  education?: string;
  skills?: (Skill | string)[];
  projects?: string[];
  experience?: string[];
  hackathons?: string[];
  internships?: string[];
  certifications?: string[];
  preferred_roles?: string[];
  cv_file?: string;
  role?: string;
  displayName?: string;
}

// Category Taxonomy Map & Canonical Names
const SKILL_TAXONOMY: {
  pattern: RegExp;
  canonical: string;
  category: CategoryCode;
}[] = [
  { pattern: /^(python|python3|py|python programming|python\s*\(pandas\))$/i, canonical: "Python", category: "COD" },
  { pattern: /^(c\+\+|cpp|c\+\+11|c\+\+17|c\+\+20)$/i, canonical: "C++", category: "COD" },
  { pattern: /^(java|java\s*8|java\s*11|java programming|java basics)$/i, canonical: "Java", category: "COD" },
  { pattern: /^(c#|c#\/\.net|\.net|dotnet|c-sharp)$/i, canonical: "C#/.NET", category: "COD" },
  { pattern: /^(golang|go|go language)$/i, canonical: "Go", category: "COD" },
  { pattern: /^(javascript|typescript|js|ts|node|node\.js|react|vue|angular)$/i, canonical: "JavaScript / TypeScript", category: "COD" },
  
  { pattern: /(data structures|dsa|algorithms|data structures & algorithms|problem solving)/i, canonical: "Data Structures & Algorithms", category: "DSA" },
  { pattern: /(object-oriented|object oriented|ood|oops|oop)/i, canonical: "Object-Oriented Design", category: "OOD" },
  { pattern: /(aptitude|quantitative|statistics|statistical|math|numerical reasoning|excel \/ aptitude)/i, canonical: "Quantitative Aptitude & Stats", category: "APTI" },
  { pattern: /(communication|client communication|stakeholder|presentation|technical writing)/i, canonical: "Communication", category: "COMM" },
  { pattern: /(machine learning|ml|ai|artificial intelligence|deep learning|power bi|pandas|scikit-learn|sklearn|tensorflow|pytorch|recommender)/i, canonical: "Machine Learning / AI", category: "AI" },
  { pattern: /(cloud|aws|gcp|azure|amazon web services|google cloud|azure data|synapse|cloud platforms)/i, canonical: "Cloud Infrastructure", category: "CLOUD" },
  { pattern: /(sql|oracle sql|pl-sql|pl\/sql|postgres|postgresql|mysql|sql server|database)/i, canonical: "SQL & Databases", category: "SQL" },
  { pattern: /(software engineering|swe|agile|sdlc|ci\/cd|git|code review|swe practices)/i, canonical: "Software Engineering Practices", category: "SWE" },
  { pattern: /(system design|distributed systems|microservices|scalable architecture|raft|distributed)/i, canonical: "System Design & Distributed Systems", category: "SYSD" },
  { pattern: /(networking|tcp\/ip|http|socket|network topology|computer networks)/i, canonical: "Computer Networking", category: "NETW" },
  { pattern: /(operating systems|os|linux|unix|linux shell|bash|shell scripting|os internals|syscall tracer)/i, canonical: "Operating Systems & Linux", category: "OS" },
];

/**
 * Clean text noise (remove leading/trailing bullets, quotes, extra space)
 */
export function cleanText(str: string): string {
  if (!str) return "";
  return str
    .replace(/^[\s•\-\*"'`]+|[\s"'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Shorten evidence to keep it clean, short and meaningful
 */
export function cleanEvidence(evidence: string): string {
  let cleaned = cleanText(evidence);
  if (!cleaned) return "Explicitly mentioned in resume";
  // Remove wrapping quotes if any
  cleaned = cleaned.replace(/^["']|["']$/g, "");
  if (cleaned.length > 75) {
    cleaned = cleaned.substring(0, 72).trim() + "...";
  }
  return cleaned;
}

/**
 * Categorize and normalize a skill input string or object
 */
export function normalizeSkill(input: Skill | string): Skill {
  let name = "";
  let evidence = "";
  let confidence: Skill["confidence"] = "high";
  let userCat: CategoryCode | undefined;

  if (typeof input === "string") {
    name = cleanText(input);
    evidence = `Mentioned: ${name}`;
  } else {
    name = cleanText(input.skill_name);
    evidence = cleanEvidence(input.evidence);
    confidence = input.confidence || "high";
    userCat = input.category_code;
  }

  // Find match in taxonomy
  let matchedCanonical = name;
  let matchedCategory: CategoryCode = userCat && userCat !== "OTHER" ? userCat : "OTHER";

  for (const entry of SKILL_TAXONOMY) {
    if (entry.pattern.test(name)) {
      matchedCanonical = entry.canonical;
      if (!userCat || userCat === "OTHER") {
        matchedCategory = entry.category;
      }
      break;
    }
  }

  // Fallback category heuristics if still OTHER
  if (matchedCategory === "OTHER") {
    const lower = name.toLowerCase();
    if (lower.includes("sql") || lower.includes("db")) matchedCategory = "SQL";
    else if (lower.includes("cloud") || lower.includes("aws") || lower.includes("azure") || lower.includes("gcp")) matchedCategory = "CLOUD";
    else if (lower.includes("design") || lower.includes("system") || lower.includes("microservice")) matchedCategory = "SYSD";
    else if (lower.includes("ml") || lower.includes("ai") || lower.includes("model")) matchedCategory = "AI";
    else if (lower.includes("test") || lower.includes("ci") || lower.includes("cd") || lower.includes("git")) matchedCategory = "SWE";
    else if (lower.includes("net") || lower.includes("ip") || lower.includes("web")) matchedCategory = "NETW";
    else if (lower.includes("linux") || lower.includes("unix") || lower.includes("shell") || lower.includes("kernel")) matchedCategory = "OS";
    else if (lower.includes("alg") || lower.includes("tree") || lower.includes("graph")) matchedCategory = "DSA";
    else if (lower.includes("code") || lower.includes("script") || lower.includes("dev")) matchedCategory = "COD";
  }

  return {
    skill_name: matchedCanonical,
    category_code: matchedCategory,
    evidence,
    confidence,
  };
}

/**
 * Merge duplicate skills, keeping highest confidence and best evidence
 */
export function mergeDuplicateSkills(skills: Skill[]): Skill[] {
  const map = new Map<string, Skill>();
  const confRank: Record<Skill["confidence"], number> = { high: 3, medium: 2, low: 1 };

  for (const sk of skills) {
    const key = sk.skill_name.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...sk });
    } else {
      // Merge confidence (keep highest)
      const bestConf = confRank[sk.confidence] > confRank[existing.confidence] ? sk.confidence : existing.confidence;
      // Combine or pick best evidence
      const bestEvidence = existing.evidence.length >= sk.evidence.length ? existing.evidence : sk.evidence;
      // Prefer non-OTHER category code
      const bestCategory = existing.category_code !== "OTHER" ? existing.category_code : sk.category_code;

      map.set(key, {
        skill_name: existing.skill_name, // keep canonical casing
        category_code: bestCategory,
        evidence: bestEvidence,
        confidence: bestConf,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Detect Hackathons from projects and experience
 */
export function detectHackathons(input: RawResumeInput): string[] {
  if (input.hackathons && input.hackathons.length > 0) {
    return input.hackathons.map(cleanText).filter(Boolean);
  }

  const detected: string[] = [];
  const combinedText = [...(input.projects || []), ...(input.experience || [])];

  const hackathonRegex = /(hackathon|hackmit|hackath|codefest|devfest|ideathon|marathon|contest|1st place|finalist|winner)/i;

  for (const item of combinedText) {
    const cleaned = cleanText(item);
    if (hackathonRegex.test(cleaned)) {
      detected.push(cleaned);
    }
  }

  // Return deduplicated array or [] if nothing present (NO HALLUCINATION)
  return Array.from(new Set(detected));
}

/**
 * Detect Internships from experience
 */
export function detectInternships(input: RawResumeInput): string[] {
  if (input.internships && input.internships.length > 0) {
    return input.internships.map(cleanText).filter(Boolean);
  }

  const detected: string[] = [];
  const combinedText = [...(input.experience || []), ...(input.projects || [])];

  const internRegex = /\b(intern|internship|trainee|co-op|coop)\b/i;

  for (const item of combinedText) {
    const cleaned = cleanText(item);
    if (internRegex.test(cleaned)) {
      detected.push(cleaned);
    }
  }

  // Return deduplicated array or [] if nothing present (NO HALLUCINATION)
  return Array.from(new Set(detected));
}

/**
 * Detect Certifications from all raw text fields
 */
export function detectCertifications(input: RawResumeInput): string[] {
  if (input.certifications && input.certifications.length > 0) {
    return input.certifications.map(cleanText).filter(Boolean);
  }

  const detected: string[] = [];
  const allFields = [
    input.education || "",
    ...(input.projects || []),
    ...(input.experience || []),
    ...(input.skills || []).map((s) => (typeof s === "string" ? s : `${s.skill_name} ${s.evidence}`)),
  ];

  const certRegex = /(certified|certification|certificate|aws cert|azure cert|gcp cert|coursera|udemy|nptel|cka|ckad|cks|pmp|ccna)/i;

  for (const item of allFields) {
    const cleaned = cleanText(item);
    if (certRegex.test(cleaned)) {
      // If full text is too long, extract key cert phrase
      if (cleaned.length > 80) {
        const match = cleaned.match(/([^,.!?:;]+\b(?:certified|certification|certificate|aws|azure|gcp|coursera|udemy|cka|pmp)\b[^,.!?:;]+)/i);
        if (match) detected.push(cleanText(match[0]));
      } else {
        detected.push(cleaned);
      }
    }
  }

  // Return deduplicated array or [] if nothing present (NO HALLUCINATION)
  return Array.from(new Set(detected));
}

/**
 * Build COMPLETE and CLEAN Candidate Profile from raw resume parsing output
 */
export function buildCandidateProfile(input: RawResumeInput): Profile {
  // 1. Normalize and deduplicate skills
  const rawSkills = input.skills || [];
  const normalizedSkills = rawSkills.map(normalizeSkill);
  const cleanSkills = mergeDuplicateSkills(normalizedSkills);

  // 2. Infer additional skills from projects/experience if confidence medium/low
  if (input.projects) {
    for (const proj of input.projects) {
      const lower = proj.toLowerCase();
      if ((lower.includes("raft") || lower.includes("distributed")) && !cleanSkills.some((s) => s.category_code === "SYSD")) {
        cleanSkills.push({
          skill_name: "Distributed Systems",
          category_code: "SYSD",
          evidence: cleanEvidence(`Inferred from project: ${proj}`),
          confidence: "medium",
        });
      }
      if (lower.includes("linux") && !cleanSkills.some((s) => s.category_code === "OS")) {
        cleanSkills.push({
          skill_name: "Linux internals",
          category_code: "OS",
          evidence: cleanEvidence(`Inferred from project: ${proj}`),
          confidence: "medium",
        });
      }
      if ((lower.includes("sklearn") || lower.includes("churn")) && !cleanSkills.some((s) => s.category_code === "AI")) {
        cleanSkills.push({
          skill_name: "Machine Learning",
          category_code: "AI",
          evidence: cleanEvidence(`Inferred from project: ${proj}`),
          confidence: "medium",
        });
      }
    }
  }

  // Re-deduplicate
  const finalSkills = mergeDuplicateSkills(cleanSkills);

  // 3. Extract sections
  let hackathons = detectHackathons(input);
  let internships = input.internships && input.internships.length > 0 ? input.internships.map(cleanText).filter(Boolean) : detectInternships(input);
  if (internships.length === 0 && input.experience && input.experience.length > 0) {
    internships = input.experience.map(cleanText).filter(Boolean);
  }
  let certifications = detectCertifications(input);

  // 4. Preferred roles
  let preferred_roles: string[] = [];
  if (input.preferred_roles && input.preferred_roles.length > 0) {
    preferred_roles = input.preferred_roles.map(cleanText).filter(Boolean);
  } else if (input.role) {
    preferred_roles = [cleanText(input.role)];
  }

  // 5. Basic info (NO HALLUCINATION)
  let name = cleanText(input.name || "");
  if (!name && input.displayName) {
    name = cleanText(input.displayName.split("—")[0].split("-")[0]);
  }
  const email = cleanText(input.email || "");
  const education = cleanText(input.education || "");
  const cv_file = cleanText(input.cv_file || "");

  return {
    name,
    email,
    education,
    skills: finalSkills,
    hackathons,
    internships,
    certifications,
    preferred_roles,
    cv_file,
  };
}
