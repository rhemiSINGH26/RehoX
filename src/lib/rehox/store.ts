import { useSyncExternalStore } from "react";
import type { ParsedSource, Profile, TalentCheckResult, SkillMatchResult } from "./types";

interface State {
  jd: ParsedSource | null;
  resume: ParsedSource | null;
  profile: Profile | null;
  talentCheck: TalentCheckResult | null;
  skillMatch: SkillMatchResult | null;
  profileSavedAt: number | null;
}

let state: State = {
  jd: null, resume: null, profile: null, talentCheck: null, skillMatch: null,
  profileSavedAt: null,
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
};

const serverSnap: State = state;

export function useRehox<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    rehoxStore.subscribe,
    () => selector(state),
    () => selector(serverSnap),
  );
}