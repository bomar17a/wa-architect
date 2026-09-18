-- Where each school fact comes from, and the first fact that needs it: how much a
-- school's seats go to its own state's residents.
--
-- data_sources        one row per downloaded file, with its licence notice verbatim.
--                     Every fact row points at one, so a source can be audited, gated,
--                     or pulled out of the product without touching the scoring code.
-- school_aliases      every spelling a dataset uses for a school. AAMC writes
--                     "Alabama-Heersink"; this table holds the full name. Matching on
--                     names was already failing: utils/schoolStates.ts showed three
--                     schools as "Unknown".
-- school_residency_stats
--                     AAMC FACTS Table A-1, per school and cycle, as published:
--                     applications and matriculants with their in-state shares. The
--                     app derives seats-per-application from these; nothing derived is
--                     stored, so a change to the formula never needs a data migration.
--
-- AAMC publishes A-1 "for educational, noncommercial purposes only". Those source rows
-- are marked commercial_use = 'restricted' so paid features can exclude them. The
-- numbers themselves are seeded by scripts/db/seed-residency.mjs from files kept out of
-- this public repo, not by a migration.
--
-- medical_schools also gains its identity (slug, state, country) and residency policy.
-- Policy stays 'unknown' unless the school's own admissions page was checked, and a
-- known policy must carry that page's URL.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.data_sources (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    publisher TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    data_year INTEGER,
    retrieved_at DATE NOT NULL,
    file_sha256 TEXT,
    license_note TEXT NOT NULL,
    commercial_use TEXT NOT NULL CHECK (commercial_use IN ('allowed', 'restricted', 'unknown'))
);

ALTER TABLE public.medical_schools
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US',
    ADD COLUMN IF NOT EXISTS residency_policy TEXT NOT NULL DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS regional_states TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS accepts_international TEXT NOT NULL DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS policy_note TEXT,
    ADD COLUMN IF NOT EXISTS policy_source_url TEXT;

ALTER TABLE public.medical_schools DROP CONSTRAINT IF EXISTS medical_schools_state_format;
ALTER TABLE public.medical_schools ADD CONSTRAINT medical_schools_state_format
    CHECK (state IS NULL OR state ~ '^[A-Z]{2}$');

ALTER TABLE public.medical_schools DROP CONSTRAINT IF EXISTS medical_schools_residency_policy_values;
ALTER TABLE public.medical_schools ADD CONSTRAINT medical_schools_residency_policy_values
    CHECK (residency_policy IN ('unknown', 'open', 'prefers_in_state', 'in_state_only'));

ALTER TABLE public.medical_schools DROP CONSTRAINT IF EXISTS medical_schools_accepts_international_values;
ALTER TABLE public.medical_schools ADD CONSTRAINT medical_schools_accepts_international_values
    CHECK (accepts_international IN ('unknown', 'yes', 'no'));

-- A policy the app acts on has to be traceable to the page that states it.
ALTER TABLE public.medical_schools DROP CONSTRAINT IF EXISTS medical_schools_policy_sourced;
ALTER TABLE public.medical_schools ADD CONSTRAINT medical_schools_policy_sourced
    CHECK (
        (residency_policy = 'unknown' AND accepts_international = 'unknown' AND regional_states = '{}')
        OR policy_source_url IS NOT NULL
    );

CREATE TABLE IF NOT EXISTS public.school_aliases (
    school_id UUID NOT NULL REFERENCES public.medical_schools(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    source_slug TEXT NOT NULL,
    PRIMARY KEY (school_id, alias)
);
-- One spelling per dataset can only mean one school.
CREATE UNIQUE INDEX IF NOT EXISTS school_aliases_source_alias_key
    ON public.school_aliases (source_slug, lower(alias));

CREATE TABLE IF NOT EXISTS public.school_residency_stats (
    school_id UUID NOT NULL REFERENCES public.medical_schools(id) ON DELETE CASCADE,
    cycle_year INTEGER NOT NULL,
    applications INTEGER NOT NULL CHECK (applications >= 0),
    apps_in_state_pct NUMERIC(4,1) NOT NULL CHECK (apps_in_state_pct BETWEEN 0 AND 100),
    matriculants INTEGER NOT NULL CHECK (matriculants >= 0),
    mat_in_state_pct NUMERIC(4,1) NOT NULL CHECK (mat_in_state_pct BETWEEN 0 AND 100),
    source_id BIGINT NOT NULL REFERENCES public.data_sources(id),
    PRIMARY KEY (school_id, cycle_year)
);

-- Signed-in users read; nobody writes through the API. medical_schools is readable
-- anonymously for historical reasons; these are not, since nothing logged-out needs
-- them and the A-1 numbers are licensed for noncommercial use.
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_residency_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can read data sources" ON public.data_sources;
CREATE POLICY "Signed-in users can read data sources"
ON public.data_sources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Signed-in users can read school aliases" ON public.school_aliases;
CREATE POLICY "Signed-in users can read school aliases"
ON public.school_aliases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Signed-in users can read residency stats" ON public.school_residency_stats;
CREATE POLICY "Signed-in users can read residency stats"
ON public.school_residency_stats FOR SELECT TO authenticated USING (true);
