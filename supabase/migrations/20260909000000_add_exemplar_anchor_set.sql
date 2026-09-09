-- Carries the tune/holdout split into the database.
--
-- The corpus in data/amcas-exemplars.json labels every scored exemplar with an
-- anchor_set, and _meta.anchor_sets states what the labels are for:
--
--   "tune = the 8 anchors the deterministic scorer was fitted against.
--    holdout = 8 more scored before the rewrite and not consulted during it.
--    Report both; a large gap between them means the scorer was fitted to the
--    anchors rather than to the rubric."
--
-- The original seed did not carry this column across, so the table held all 16
-- scored rows with no way to tell them apart. fetchExemplars(anchorsOnly) selects
-- on anchor_specificity IS NOT NULL, which meant the narrative-quality prompt could
-- be handed holdout entries together with their human scores. A holdout the model
-- has already been shown measures recall, not calibration, so reporting the two
-- sets against each other would no longer mean what the note above says it means.
--
-- Nullable and additive: rows without a label (the 31 unscored entries) keep NULL,
-- and the retrieval treats an absent label as "not an anchor".

ALTER TABLE public.wa_exemplars
  ADD COLUMN IF NOT EXISTS anchor_set text
  CHECK (anchor_set IN ('tune', 'holdout'));

-- Only anchors carry a set, and every anchor must carry one — otherwise a scored
-- row with no label would silently drop out of the tune-only retrieval.
COMMENT ON COLUMN public.wa_exemplars.anchor_set IS
  'tune = fitted against; holdout = reserved for evaluation, never shown to a model. NULL for unscored entries.';

-- Backfill from the corpus. scripts/db/seed-exemplars.mjs now carries this column,
-- so re-seeding keeps it in sync; this exists so the column is correct the moment
-- the migration lands, without depending on a separate seed run.
UPDATE public.wa_exemplars SET anchor_set = 'tune' WHERE slug IN (
  'ed-assistant',
  'ed-technician',
  'lyme-disease-research',
  'maple-grove-hospital-volunteer',
  'patient-navigator-interpreter',
  'lawrence-memorial-shadowing',
  'custom-sneakers',
  'sorority-philanthropy-coordinator'
);

UPDATE public.wa_exemplars SET anchor_set = 'holdout' WHERE slug IN (
  'hiv-research-internship',
  'psychiatric-ward-volunteer',
  'binghamton-student-ambassador',
  'x-house-orphanage',
  'perrigo-internship',
  'in-house-mechanic',
  'workbook-shelter-food-director',
  'workbook-emra-coordinator'
);
