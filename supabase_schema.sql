-- ==========================================
-- RehoX Talent Navigator — Supabase SQL Schema
-- Paste and execute this in the Supabase SQL Editor
-- ==========================================

-- 1. Candidate Profiles Table
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    education TEXT DEFAULT '',
    skills JSONB DEFAULT '[]'::jsonb,
    competency_levels JSONB DEFAULT '{}'::jsonb,
    hackathons JSONB DEFAULT '[]'::jsonb,
    internships JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    preferred_roles JSONB DEFAULT '[]'::jsonb,
    cv_file TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Job Descriptions Table
CREATE TABLE IF NOT EXISTS public.job_descriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    source_file TEXT DEFAULT 'manual-text',
    skills JSONB DEFAULT '[]'::jsonb,
    raw_text TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Parsed Resumes Table
CREATE TABLE IF NOT EXISTS public.parsed_resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_file TEXT NOT NULL,
    candidate_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    education TEXT DEFAULT '',
    skills JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    cgpa TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Saved Evaluation Flow Analyses Table
CREATE TABLE IF NOT EXISTS public.saved_analyses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT DEFAULT 'Target Role',
    role TEXT DEFAULT 'Software Engineer',
    profile JSONB DEFAULT '{}'::jsonb,
    jd JSONB DEFAULT '{}'::jsonb,
    resume JSONB DEFAULT '{}'::jsonb,
    talent_check JSONB DEFAULT '{}'::jsonb,
    skill_match JSONB DEFAULT '{}'::jsonb,
    user_id TEXT DEFAULT 'guest',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ATS Resumes Table
CREATE TABLE IF NOT EXISTS public.ats_resumes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    summary TEXT DEFAULT '',
    skills JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    ats_score INT DEFAULT 85,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Public Policies (Allows anonymous access for dev demo)
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read candidate_profiles" ON public.candidate_profiles FOR SELECT USING (true);
CREATE POLICY "Public write candidate_profiles" ON public.candidate_profiles FOR ALL USING (true);

CREATE POLICY "Public read job_descriptions" ON public.job_descriptions FOR SELECT USING (true);
CREATE POLICY "Public write job_descriptions" ON public.job_descriptions FOR ALL USING (true);

CREATE POLICY "Public read parsed_resumes" ON public.parsed_resumes FOR SELECT USING (true);
CREATE POLICY "Public write parsed_resumes" ON public.parsed_resumes FOR ALL USING (true);

CREATE POLICY "Public read saved_analyses" ON public.saved_analyses FOR SELECT USING (true);
CREATE POLICY "Public write saved_analyses" ON public.saved_analyses FOR ALL USING (true);

CREATE POLICY "Public read ats_resumes" ON public.ats_resumes FOR SELECT USING (true);
CREATE POLICY "Public write ats_resumes" ON public.ats_resumes FOR ALL USING (true);
