export type CategoryCode =
  | "DSA"
  | "COD"
  | "OOD"
  | "APTI"
  | "COMM"
  | "AI"
  | "CLOUD"
  | "SQL"
  | "SWE"
  | "SYSD"
  | "NETW"
  | "OS"
  | "OTHER";

export type TalentCheckCategoryCode = Exclude<CategoryCode, "OTHER">;
export type GapSeverity = "met" | "minor" | "moderate" | "critical";
export type ReadinessBand =
  "Interview Ready" | "Nearly Ready" | "Developing" | "Significant Skill Gaps";

export type CompetencyLevels = Record<TalentCheckCategoryCode, number>;

export const CATEGORY_ORDER: TalentCheckCategoryCode[] = [
  "COD",
  "DSA",
  "OOD",
  "APTI",
  "COMM",
  "AI",
  "CLOUD",
  "SQL",
  "SWE",
  "SYSD",
  "NETW",
  "OS",
];

export const CATEGORY_LABEL: Record<CategoryCode, string> = {
  COD: "Coding",
  DSA: "DSA",
  OOD: "OOD",
  APTI: "Aptitude",
  COMM: "Communication",
  AI: "AI",
  CLOUD: "Cloud",
  SQL: "SQL",
  SWE: "SWE",
  SYSD: "System Design",
  NETW: "Networking",
  OS: "OS",
  OTHER: "Other",
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
  name?: string;
  email?: string;
  education?: string;
  cgpa?: string;
  projects?: string[];
  experience?: string[];
  internships?: string[];
  certifications?: string[];
  hackathons?: string[];
  preferred_roles?: string[];
  displayName?: string;
}

export interface Profile {
  name: string;
  email: string;
  education: string;
  cgpa?: string;
  competency_levels?: Partial<Record<TalentCheckCategoryCode, number>>;
  skills: Skill[];
  hackathons: string[];
  internships: string[];
  certifications: string[];
  preferred_roles: string[];
  cv_file: string;
}

export interface SkillsetGapRow {
  category_code: TalentCheckCategoryCode;
  required_level: number;
  candidate_level: number;
  gap: boolean;
  severity?: GapSeverity;
  importance_weight?: number;
  gap_size?: number;
  priority?: number;
}

export interface TalentCheckPriorityItem {
  category_code: TalentCheckCategoryCode;
  priority: number;
  gap_size: number;
  severity: GapSeverity;
}

export interface TalentCheckResult {
  company: string;
  skillset_gap: SkillsetGapRow[];
  readiness_score: number;
  readiness_band?: ReadinessBand;
  explanation?: string;
  top_priorities?: TalentCheckPriorityItem[];
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

export interface SavedAnalysis {
  id: string;
  title: string;
  company: string;
  role: string;
  created_at: string;
  jd: ParsedSource | null;
  resume: ParsedSource | null;
  profile: Profile | null;
  talentCheck: TalentCheckResult | null;
  skillMatch: SkillMatchResult | null;
}

export interface ATSResume {
  id: string;
  title: string;
  candidate_name: string;
  email: string;
  phone?: string;
  summary: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
    gpa?: string;
  }[];
  ats_score?: number;
  updated_at?: string;
}

export interface UserSession {
  user_id: string;
  email: string;
  name: string;
  is_guest: boolean;
}
