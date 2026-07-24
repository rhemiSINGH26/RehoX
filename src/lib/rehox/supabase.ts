import { createClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

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
  skills: any;
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
export async function saveProfileToSupabase(profile: Profile): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const payload = {
      name: profile.name,
      email: profile.email,
      education: profile.education,
      skills: profile.skills,
      hackathons: profile.hackathons,
      internships: profile.internships,
      certifications: profile.certifications,
      preferred_roles: profile.preferred_roles,
      cv_file: profile.cv_file,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("candidate_profiles")
      .upsert([payload], { onConflict: "email" })
      .select();

    if (error) {
      console.warn("Supabase sync info (or mock mode):", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    console.warn("Supabase sync warning:", msg);
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
