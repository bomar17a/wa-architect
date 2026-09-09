// Generates the SQL migration from the reviewed school_targets.json.
//
//   node scripts/build-school-targets-migration.mjs
//
// Kept separate from derive-school-targets.ts so the JSON gets a human read
// before any SQL is written against it.

import * as fs from 'fs';

const payload = JSON.parse(fs.readFileSync('school_targets.json', 'utf8'));
const stamp = '20260908000000';
const file = `supabase/migrations/${stamp}_add_school_target_vectors.sql`;

const esc = (s) => s.replace(/'/g, "''");

const updates = payload.schools.map(s => {
    const tags = `ARRAY[${s.emphasis_tags.map(t => `'${esc(t)}'`).join(', ')}]::text[]`;
    return `UPDATE medical_schools SET
  target_inquiry = ${s.targets.Inquiry}, target_service = ${s.targets.Service},
  target_teamwork = ${s.targets.Teamwork}, target_clinical = ${s.targets.Clinical},
  emphasis_tags = ${s.emphasis_tags.length ? tags : `'{}'::text[]`}
WHERE school_name = '${esc(s.school_name)}';`;
}).join('\n\n');

const sql = `-- Per-school pillar targets derived from each school's published mission statement.
--
-- Until now every school in an archetype bucket produced the identical match
-- percentage, because nothing school-specific entered the calculation while the
-- mission statements sat unused in this same table. These columns hold a target
-- vector per school, derived by scripts/derive-school-targets.ts (a transparent
-- keyword lexicon, reviewed as school_targets.json before this file was written)
-- and shifted at most 1.5 points off the school's archetype baseline.
--
-- Safe to apply before the frontend ships: the app falls back to SCHOOL_ARCHETYPES
-- whenever these are null, so partial or absent data degrades rather than breaks.
-- Idempotent: re-running these UPDATEs is a no-op.
--
-- Generated ${payload.generated} from ${payload.count} schools by
-- scripts/build-school-targets-migration.mjs. Regenerate rather than hand-editing.

ALTER TABLE medical_schools
  ADD COLUMN IF NOT EXISTS target_inquiry  numeric(3,1),
  ADD COLUMN IF NOT EXISTS target_service  numeric(3,1),
  ADD COLUMN IF NOT EXISTS target_teamwork numeric(3,1),
  ADD COLUMN IF NOT EXISTS target_clinical numeric(3,1),
  ADD COLUMN IF NOT EXISTS emphasis_tags   text[];

${updates}
`;

fs.writeFileSync(file, sql);
console.log(`Wrote ${file} (${payload.count} schools, ${sql.split('\n').length} lines)`);
