-- Recovered from the remote migration history on 2026-08-26.
-- Applied to production 2026-05-12 via the dashboard, but never committed —
-- which is what broke `supabase db push` (remote version with no local file).
--
-- Data migration, not schema: corrects medical_schools.primary_category, which
-- drives archetype match scores in SchoolRecommender / MissionFitRadar.
-- Idempotent: re-running these UPDATEs is a no-op.

-- Fix #7b: Reclassify overloaded Advocate schools to The Balanced
-- These are well-rounded programs without a single dominant advocacy emphasis
UPDATE medical_schools SET primary_category = 'The Balanced'
WHERE school_name IN (
  'Georgetown University School of Medicine',
  'Indiana University School of Medicine',
  'Tufts University School of Medicine',
  'University of Iowa Roy J. and Lucille A. Carver College of Medicine',
  'University of Maryland School of Medicine',
  'University of Minnesota Medical School',
  'University of Wisconsin School of Medicine and Public Health',
  'Saint Louis University School of Medicine',
  'Drexel University College of Medicine',
  'New York Medical College',
  'Oakland University William Beaumont School of Medicine',
  'Oregon Health & Science University School of Medicine',
  'Boston University Aram V. Chobanian & Edward Avedisian School of Medicine',
  'Wayne State University School of Medicine',
  'Creighton University School of Medicine',
  'Lewis Katz School of Medicine at Temple University'
);

-- Fix Harvard: Investigator, not Leader (#1 NIH funding)
UPDATE medical_schools SET primary_category = 'The Investigator'
WHERE school_name = 'Harvard Medical School';

-- Fix UChicago Pritzker: Investigator (top-10 research institution)
UPDATE medical_schools SET primary_category = 'The Investigator'
WHERE school_name = 'University of Chicago Division of the Biological Sciences The Pritzker School of Medicine';

-- Fix WashU: Investigator (top-10 NIH funded)
UPDATE medical_schools SET primary_category = 'The Investigator'
WHERE school_name = 'Washington University in St. Louis School of Medicine';