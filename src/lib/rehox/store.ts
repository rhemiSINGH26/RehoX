import { useSyncExternalStore } from "react";
import { buildCandidateProfile } from "./profileBuilder";
import { runSkillMatch, runTalentCheck } from "./compute";
import {
  saveProfileToSupabase,
  saveJdToSupabase,
  saveResumeToSupabase,
  saveAnalysisToSupabase,
} from "./supabase";
import type {
  ParsedSource,
  Profile,
  TalentCheckResult,
  SkillMatchResult,
  SavedAnalysis,
  UserSession,
} from "./types";

interface State {
  jd: ParsedSource | null;
  resume: ParsedSource | null;
  profile: Profile | null;
  talentCheck: TalentCheckResult | null;
  skillMatch: SkillMatchResult | null;
  profileSavedAt: number | null;
  userSession: UserSession | null;
  savedAnalyses: SavedAnalysis[];
  activeAnalysisId: string | null;
}

let state: State = {
  jd: null,
  resume: null,
  profile: null,
  talentCheck: null,
  skillMatch: null,
  profileSavedAt: null,
  userSession: null, // Initially null — user must login or choose session first
  savedAnalyses: [],
  activeAnalysisId: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const rehoxStore = {
  get: () => state,
  set: (patch: Partial<State>) => {
    const nextState = { ...state, ...patch };

    // Auto-infer profile from resume if resume exists and profile is unpopulated
    if (
      nextState.resume &&
      (!nextState.profile || (!nextState.profile.name && nextState.profile.skills.length === 0))
    ) {
      nextState.profile = buildCandidateProfile(nextState.resume);
    }

    // Auto-compute talentCheck if profile exists and talentCheck wasn't explicitly patched
    if (nextState.profile && !("talentCheck" in patch)) {
      nextState.talentCheck = runTalentCheck(
        {
          competency_levels: nextState.profile.competency_levels,
          skills: nextState.profile.skills,
        },
        nextState.jd?.company,
      );
    }

    // Auto-compute skillMatch if profile & JD exist and skillMatch wasn't explicitly patched
    if (nextState.profile && nextState.jd && !("skillMatch" in patch)) {
      nextState.skillMatch = runSkillMatch(nextState.profile, nextState.jd);
    }

    state = nextState;
    emit();

    // Auto-sync entity updates to Supabase in background
    if (patch.profile && nextState.profile) {
      saveProfileToSupabase(nextState.profile).catch(() => {});
    }
    if (patch.jd && nextState.jd) {
      saveJdToSupabase(nextState.jd).catch(() => {});
    }
    if (patch.resume && nextState.resume) {
      saveResumeToSupabase(nextState.resume).catch(() => {});
    }
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  saveCurrentAnalysis: (customTitle?: string) => {
    const s = state;
    const title =
      customTitle ||
      (s.jd
        ? `${s.jd.company} — ${s.jd.role}`
        : s.profile
          ? `${s.profile.name}'s Profile`
          : "Untitled Analysis");
    const id = s.activeAnalysisId || `analysis-${Date.now()}`;
    const newEntry: SavedAnalysis = {
      id,
      title,
      company: s.jd?.company || "Target Role",
      role: s.jd?.role || "Software Engineer",
      created_at: new Date().toISOString(),
      jd: s.jd,
      resume: s.resume,
      profile: s.profile,
      talentCheck: s.talentCheck,
      skillMatch: s.skillMatch,
    };

    const existingIndex = s.savedAnalyses.findIndex((a) => a.id === id);
    let updatedList: SavedAnalysis[];
    if (existingIndex >= 0) {
      updatedList = [...s.savedAnalyses];
      updatedList[existingIndex] = newEntry;
    } else {
      updatedList = [newEntry, ...s.savedAnalyses];
    }

    state = {
      ...state,
      savedAnalyses: updatedList,
      activeAnalysisId: id,
    };
    emit();

    // Auto-sync Saved Analysis to Supabase in background
    saveAnalysisToSupabase(newEntry).catch(() => {});

    return newEntry;
  },
  loadAnalysis: (id: string) => {
    const found = state.savedAnalyses.find((a) => a.id === id);
    if (found) {
      state = {
        ...state,
        jd: found.jd,
        resume: found.resume,
        profile: found.profile,
        talentCheck: found.talentCheck,
        skillMatch: found.skillMatch,
        activeAnalysisId: found.id,
      };
      emit();
    }
  },
  createNewAnalysis: () => {
    state = {
      ...state,
      jd: null,
      resume: null,
      profile: null,
      talentCheck: null,
      skillMatch: null,
      activeAnalysisId: null,
    };
    emit();
  },
  logout: () => {
    state = {
      ...state,
      userSession: null,
      jd: null,
      resume: null,
      profile: null,
      talentCheck: null,
      skillMatch: null,
      activeAnalysisId: null,
    };
    emit();
  },
};

const serverSnap: State = state;

export function useRehox<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    rehoxStore.subscribe,
    () => selector(state),
    () => selector(serverSnap),
  );
}
