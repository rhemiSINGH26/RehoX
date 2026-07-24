import { useSyncExternalStore } from "react";
import type { ParsedSource, Profile, TalentCheckResult, SkillMatchResult, SavedAnalysis, UserSession } from "./types";

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

const DEFAULT_GUEST_USER: UserSession = {
  user_id: "guest-user",
  email: "candidate@rehox.local",
  name: "Candidate Session",
  is_guest: true,
};

let state: State = {
  jd: null,
  resume: null,
  profile: null,
  talentCheck: null,
  skillMatch: null,
  profileSavedAt: null,
  userSession: DEFAULT_GUEST_USER,
  savedAnalyses: [],
  activeAnalysisId: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const rehoxStore = {
  get: () => state,
  set: (patch: Partial<State>) => {
    state = { ...state, ...patch };
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  saveCurrentAnalysis: (customTitle?: string) => {
    const s = state;
    const title = customTitle || (s.jd ? `${s.jd.company} — ${s.jd.role}` : s.profile ? `${s.profile.name}'s Profile` : "Untitled Analysis");
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
};

const serverSnap: State = state;

export function useRehox<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    rehoxStore.subscribe,
    () => selector(state),
    () => selector(serverSnap),
  );
}