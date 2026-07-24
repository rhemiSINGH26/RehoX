import { createClient } from "@supabase/supabase-js";
import type { ParsedSource, Profile, SavedAnalysis, ATSResume } from "./types";

const getEnv = (key: string) => {
  if (typeof import.meta !== "undefined" && import.meta?.env?.[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process?.env?.[key]) {
    return process.env[key];
  }
  return "";
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL") || "https://placeholder.supabase.co";
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY") || "placeholder_key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CandidateProfileRecord {
  id?: string;
  name: string;
  email: string;
  education: string;
  skills: Profile["skills"];
  hackathons: string[];
  internships: string[];
  certifications: string[];
  preferred_roles: string[];
  cv_file: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save or update Candidate Profile in Supabase DB table `candidate_profiles`
 */
export async function saveProfileToSupabase(
  profile: Profile,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const payload: Record<string, unknown> = {
      name: profile.name,
      email: profile.email || `${profile.name.toLowerCase().replace(/\s+/g, "")}@rehox.local`,
      education: profile.education,
      skills: profile.skills,
      competency_levels: profile.competency_levels,
      hackathons: profile.hackathons,
      internships: profile.internships,
      certifications: profile.certifications,
      preferred_roles: profile.preferred_roles,
      cv_file: profile.cv_file,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from("candidate_profiles")
      .upsert([payload], { onConflict: "email" })
      .select();

    // Schema fallback if candidate_profiles table doesn't have competency_levels column yet
    if (error && error.message.includes("competency_levels")) {
      delete payload.competency_levels;
      const retry = await supabase
        .from("candidate_profiles")
        .upsert([payload], { onConflict: "email" })
        .select();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn("Supabase profile sync info:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    console.warn("Supabase profile sync warning:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Fetch candidate profiles from Supabase DB
 */
export async function fetchProfilesFromSupabase(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase.from("candidate_profiles").select("*");
    if (error || !data) return [];
    return data.map((record) => ({
      name: record.name || "",
      email: record.email || "",
      education: record.education || "",
      skills: Array.isArray(record.skills) ? record.skills : [],
      competency_levels: record.competency_levels || {},
      hackathons: record.hackathons || [],
      internships: record.internships || [],
      certifications: record.certifications || [],
      preferred_roles: record.preferred_roles || [],
      cv_file: record.cv_file || "",
    }));
  } catch {
    return [];
  }
}

/**
 * Save Job Description (JD) to Supabase DB table `job_descriptions`
 */
export async function saveJdToSupabase(
  jd: ParsedSource,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const payload = {
      company: jd.company,
      role: jd.role,
      source_file: jd.source_file,
      skills: jd.skills,
      raw_text: jd.text,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("job_descriptions").insert([payload]).select();

    if (error) {
      console.warn("Supabase JD sync info:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    return { success: false, error: msg };
  }
}

/**
 * Save Parsed Resume to Supabase DB table `parsed_resumes`
 */
export async function saveResumeToSupabase(
  resume: ParsedSource,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const payload = {
      source_file: resume.source_file,
      candidate_name: resume.name || resume.displayName || "Parsed Candidate",
      email: resume.email || "",
      education: resume.education || "",
      skills: resume.skills,
      experience: resume.experience || [],
      projects: resume.projects || [],
      cgpa: resume.cgpa || "",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("parsed_resumes").insert([payload]).select();

    if (error) {
      console.warn("Supabase Resume sync info:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    return { success: false, error: msg };
  }
}

/**
 * Save Saved Evaluation Analysis Flow to Supabase DB table `saved_analyses`
 */
export async function saveAnalysisToSupabase(
  analysis: SavedAnalysis,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const payload = {
      id: analysis.id,
      title: analysis.title,
      company: analysis.company,
      role: analysis.role,
      profile: analysis.profile,
      jd: analysis.jd,
      resume: analysis.resume,
      talent_check: analysis.talentCheck,
      skill_match: analysis.skillMatch,
      created_at: analysis.created_at,
    };

    const { data, error } = await supabase
      .from("saved_analyses")
      .upsert([payload], { onConflict: "id" })
      .select();

    if (error) {
      console.warn("Supabase Analysis sync info:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    return { success: false, error: msg };
  }
}

/**
 * Fetch Saved Analyses from Supabase DB
 */
export async function fetchAnalysesFromSupabase(): Promise<SavedAnalysis[]> {
  try {
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((rec) => ({
      id: rec.id,
      title: rec.title,
      company: rec.company,
      role: rec.role,
      created_at: rec.created_at,
      profile: rec.profile,
      jd: rec.jd,
      resume: rec.resume,
      talentCheck: rec.talent_check,
      skillMatch: rec.skill_match,
    }));
  } catch {
    return [];
  }
}

/**
 * Save ATS Resume to Supabase DB table `ats_resumes`
 */
export async function saveAtsResumeToSupabase(
  ats: ATSResume,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const payload = {
      id: ats.id,
      title: ats.title,
      candidate_name: ats.candidate_name,
      email: ats.email,
      phone: ats.phone,
      summary: ats.summary,
      skills: ats.skills,
      experience: ats.experience,
      education: ats.education,
      ats_score: ats.ats_score || 85,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("ats_resumes")
      .upsert([payload], { onConflict: "id" })
      .select();

    if (error) {
      console.warn("Supabase ATS Resume sync info:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    return { success: false, error: msg };
  }
}
