export type CategoryCode =
  | "DSA" | "COD" | "OOD" | "APTI" | "COMM" | "AI"
  | "CLOUD" | "SQL" | "SWE" | "SYSD" | "NETW" | "OS" | "OTHER";

export const CATEGORY_ORDER: CategoryCode[] = [
  "COD","DSA","OOD","APTI","COMM","AI","CLOUD","SQL","SWE","SYSD","NETW","OS",
];

export const CATEGORY_LABEL: Record<CategoryCode, string> = {
  COD: "Coding", DSA: "DSA", OOD: "OOD", APTI: "Aptitude", COMM: "Communication",
  AI: "AI", CLOUD: "Cloud", SQL: "SQL", SWE: "SWE", SYSD: "System Design",
  NETW: "Networking", OS: "OS", OTHER: "Other",
};

export interface Skill {
  skill_name: string;
  category_code: CategoryCode;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

export interface ParsedSource {
  source_type: "jd" | "resume";
  source_file: string;
  company: string;
  role: string;
  skills: Skill[];
  // resume-only extras
  education?: string;
  projects?: string[];
  experience?: string[];
}

export interface Profile {
  name: string;
  email: string;
  education: string;
  skills: Skill[];
  hackathons: string[];
  internships: string[];
  certifications: string[];
  preferred_roles: string[];
  cv_file: string;
}

export interface SkillsetGapRow {
  category_code: CategoryCode;
  required_level: number;
  candidate_level: number;
  gap: boolean;
}

export interface TalentCheckResult {
  company: string;
  skillset_gap: SkillsetGapRow[];
  readiness_score: number;
}

export interface SkillMatchCategoryScore {
  category: string;
  score: number;
}

export interface SkillMatchResult {
  jd_source_file: string;
  match_score: number;
  matched_skills: Skill[];
  missing_skills: Skill[];
  summary?: string;
  category_scores?: SkillMatchCategoryScore[];
}