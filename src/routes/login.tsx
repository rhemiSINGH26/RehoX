import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { rehoxStore } from "@/lib/rehox/store";
import { supabase } from "@/lib/rehox/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login & Auth · RehoX" },
      { name: "description", content: "Authenticate to persist candidate analysis sessions and ATS resumes." },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Account created successfully! Session activated.",
        });

        rehoxStore.set({
          userSession: {
            user_id: data.user?.id || `user-${Date.now()}`,
            email: data.user?.email || email,
            name: name || email.split("@")[0],
            is_guest: false,
          },
        });

        setTimeout(() => nav({ to: "/jd" }), 800);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({ type: "success", text: "Welcome back! Session loaded." });

        rehoxStore.set({
          userSession: {
            user_id: data.user?.id || `user-${Date.now()}`,
            email: data.user?.email || email,
            name: data.user?.user_metadata?.full_name || email.split("@")[0],
            is_guest: false,
          },
        });

        setTimeout(() => nav({ to: "/jd" }), 800);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  function handleGuestSession() {
    rehoxStore.set({
      userSession: {
        user_id: `guest-${Date.now()}`,
        email: "candidate@rehox.local",
        name: "Guest Candidate",
        is_guest: true,
      },
    });
    nav({ to: "/jd" });
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-line/60 bg-panel/60 p-8 shadow-2xl backdrop-blur-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brass/40 bg-brass/10 shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brass">
                <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-text">
            {mode === "signin" ? "Welcome Back to RehoX" : "Create RehoX Account"}
          </h1>
          <p className="text-xs text-muted-text">
            Save analysis history, evaluate readiness, and build ATS resumes.
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink p-1 border border-line/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`py-2 rounded-lg transition-colors ${mode === "signin" ? "bg-brass text-primary-foreground shadow" : "text-muted-text hover:text-ink-text"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-2 rounded-lg transition-colors ${mode === "signup" ? "bg-brass text-primary-foreground shadow" : "text-muted-text hover:text-ink-text"}`}
          >
            Sign Up
          </button>
        </div>

        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs font-medium ${
              message.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/40 bg-rose-500/10 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "signup" && (
            <div>
              <label className="block text-muted-text font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-xs text-ink-text focus:border-brass focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-muted-text font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@company.com"
              className="w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-xs text-ink-text focus:border-brass focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-muted-text font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-xs text-ink-text focus:border-brass focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brass py-3 text-xs font-bold text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "signin" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <div className="relative border-t border-line/40 pt-4 text-center">
          <button
            type="button"
            onClick={handleGuestSession}
            className="w-full rounded-xl border border-line/60 bg-ink/50 py-2.5 text-xs font-semibold text-muted-text hover:text-ink-text hover:border-line transition-colors"
          >
            ⚡ Continue as Guest Candidate
          </button>
        </div>
      </div>
    </div>
  );
}
