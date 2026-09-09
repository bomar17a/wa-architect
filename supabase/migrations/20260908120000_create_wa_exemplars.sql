-- Reference corpus of published AMCAS Work & Activities entries.
--
-- WHAT THIS IS FOR
-- Grounding, not answers. The edge function retrieves a handful of these rows to
-- give the model an absolute reference for what a 700-character entry at a given
-- quality level actually looks like, in place of the verbal hand-waving the
-- prompts use today ("a mediocre entry should score in the 40s, not the 80s" —
-- with nothing behind it). The model still does the judging.
--
-- WHY THERE IS NO SELECT POLICY
-- RLS is enabled and NO policy is created. That is deliberate and it is the whole
-- security design: with RLS on and no policy, every anon and authenticated client
-- reads exactly zero rows, while `service_role` bypasses RLS entirely. The only
-- reader is the gemini-ai edge function, which already holds SUPABASE_SERVICE_ROLE_KEY.
--
-- Two reasons the corpus must not reach the browser:
--   1. It is third-party published material (Cracking Med School Admissions). Holding
--      it for internal prompt grounding is one thing; serving it to users is
--      redistribution.
--   2. Applicants who read exemplars write like exemplars, and text recurring
--      across many applications is what similarity screening is built to catch.
--      The person carrying that risk is the applicant, not us.
--
-- If a future feature wants to show users examples, that needs its own table of
-- originally written entries — not a policy loosened on this one.
--
-- Populate with:  node scripts/db/seed-exemplars.mjs   (reads data/amcas-exemplars.json)
-- Audit before seeding:  node --experimental-transform-types scripts/audit-exemplars.ts

CREATE TABLE IF NOT EXISTS public.wa_exemplars (
    slug                          TEXT PRIMARY KEY,
    created_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Provenance. Kept per row so a bad source can be retired in one statement.
    source                        TEXT NOT NULL,

    -- Normalised to the 18 AMCAS types in constants.ts. The audit harness fails
    -- the build on anything outside that list — two rows in the source PDFs are
    -- published under "Community Health Advocacy", which is not an AMCAS type.
    experience_type               TEXT NOT NULL,
    experience_type_as_published  TEXT,

    title                         TEXT NOT NULL,
    -- Set only where the source PDF's title is wrong; one row is published under
    -- "Clinical Shadowing at Vibrant Health Clinic" with a tutoring description.
    title_as_published            TEXT,
    organization                  TEXT,

    total_hours                   INTEGER,
    hours_as_published            TEXT,
    is_most_meaningful            BOOLEAN NOT NULL DEFAULT FALSE,

    -- The 700-character slot and the 1,325-character slot, stored separately
    -- because they are scored against different limits and retrieved for
    -- different prompts. The source PDFs run them together.
    description                   TEXT NOT NULL,
    mme_remarks                   TEXT,

    quality_band                  TEXT NOT NULL
        CHECK (quality_band IN ('exemplar', 'solid', 'weak', 'counter_example')),

    pillars                       TEXT[] NOT NULL DEFAULT '{}',
    competencies                  TEXT[] NOT NULL DEFAULT '{}',
    techniques                    TEXT[] NOT NULL DEFAULT '{}',
    defects                       TEXT[] NOT NULL DEFAULT '{}',

    -- Why this row is in the corpus. Required — an exemplar nobody can explain is
    -- not a teaching case, and the retrieval prompt passes this to the model as
    -- the reason the entry works or fails.
    curator_note                  TEXT NOT NULL,

    -- Hand-scored 0-25 per dimension for the calibration subset; NULL otherwise.
    -- Scored against `description` ONLY, because that is the sole input
    -- scoreNarrativeQuality() receives in the app.
    anchor_specificity            SMALLINT CHECK (anchor_specificity      BETWEEN 0 AND 25),
    anchor_quantification         SMALLINT CHECK (anchor_quantification   BETWEEN 0 AND 25),
    anchor_reflection             SMALLINT CHECK (anchor_reflection       BETWEEN 0 AND 25),
    anchor_voice                  SMALLINT CHECK (anchor_voice           BETWEEN 0 AND 25),

    -- Either all four anchor scores or none. A partially scored anchor would skew
    -- the calibration harness silently.
    CONSTRAINT anchor_scores_all_or_none CHECK (
        num_nulls(anchor_specificity, anchor_quantification, anchor_reflection, anchor_voice) IN (0, 4)
    )
);

COMMENT ON TABLE public.wa_exemplars IS
    'Reference corpus for prompt grounding. Service-role only by design — see the migration header.';

-- Retrieval is "same experience type, best band first", with pillar overlap as the
-- fallback for the six AMCAS types the corpus does not yet cover.
CREATE INDEX IF NOT EXISTS wa_exemplars_type_band_idx
    ON public.wa_exemplars (experience_type, quality_band);
CREATE INDEX IF NOT EXISTS wa_exemplars_pillars_idx
    ON public.wa_exemplars USING GIN (pillars);
CREATE INDEX IF NOT EXISTS wa_exemplars_techniques_idx
    ON public.wa_exemplars USING GIN (techniques);

-- Partial index: the anchor set is 8 rows out of 47 and is read on every
-- narrative-quality call.
CREATE INDEX IF NOT EXISTS wa_exemplars_anchors_idx
    ON public.wa_exemplars (experience_type)
    WHERE anchor_specificity IS NOT NULL;

-- RLS on, no policy: clients read nothing, service_role bypasses. See header.
ALTER TABLE public.wa_exemplars ENABLE ROW LEVEL SECURITY;

-- Reuses the trigger function created by 20260211204310_create_activities_table.sql.
DROP TRIGGER IF EXISTS update_wa_exemplars_updated_at ON public.wa_exemplars;
CREATE TRIGGER update_wa_exemplars_updated_at
BEFORE UPDATE ON public.wa_exemplars
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
