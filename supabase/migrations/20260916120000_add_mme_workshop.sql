-- Most Meaningful workshop state, and a one-line summary of the personal statement.
--
-- activities.mme_workshop holds the applicant's private working notes for one Most
-- Meaningful essay: self-check answers, a throughline, brainstorm notes per beat, and the
-- final-check confirmations. It is never exported and never sent to AMCAS.
--
-- profiles.ps_summary is one optional line describing the personal statement's main
-- story. It is used only to warn when a Most Meaningful essay retells the same scene.
--
-- Additive, with defaults. The existing row-level security policies on both tables are
-- per-row, so they already cover the new columns.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.activities
    ADD COLUMN IF NOT EXISTS mme_workshop JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS ps_summary TEXT;
