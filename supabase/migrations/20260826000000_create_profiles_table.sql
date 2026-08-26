-- User profile / application-setup state.
-- Previously these lived in localStorage, which meant onboarding re-ran on every
-- new device and the "North Star" archetype pick didn't follow the user around.

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
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- Reuses update_updated_at_column(), created in 20240211_create_activities_table.sql.
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
