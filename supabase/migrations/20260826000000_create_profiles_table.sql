-- User profile / application-setup state.
-- Previously these lived in localStorage, which meant onboarding re-ran on every
-- new device and the "North Star" archetype pick didn't follow the user around.
--
-- Written to be idempotent: this project's migration history drifted from the
-- remote database, so this file may be re-run against a DB that already has parts
-- of it. Every statement is safe to execute twice.

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Onboarding
    onboarded BOOLEAN NOT NULL DEFAULT FALSE,

    -- Step 1: profile setup
    application_type TEXT,          -- 'AMCAS' | 'AACOMAS'
    cycle_year INTEGER,             -- NULL = "auto" (track nearest upcoming opening)
    school_tier TEXT,
    gpa_range TEXT,
    mcat_range TEXT,

    -- Step 3: "North Star" archetype picks (SCHOOL_ARCHETYPES ids, max 2)
    north_star_archetypes TEXT[] DEFAULT '{}',

    -- Reserved for School Targeting Mode: medical_schools.id references
    target_school_ids TEXT[] DEFAULT '{}'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user may only ever see or touch their own profile row.
-- Dropped first so re-running this migration doesn't fail on existing policies.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- Defined defensively rather than assuming the activities migration ran here:
-- CREATE OR REPLACE is a no-op if it already exists with this body.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
