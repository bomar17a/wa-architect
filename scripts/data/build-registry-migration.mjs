/**
 * Writes the migration that gives every medical_schools row its identity and, where
 * one has been verified, its residency policy.
 *
 *   node scripts/data/build-registry-migration.mjs [--out supabase/migrations/<new>.sql]
 *
 * 20260919000500 is already applied to production. The script will not overwrite it
 * with different SQL: after editing the registry or the policies, pass --out with a new
 * migration file. Every statement is idempotent, so the new file can simply restate all
 * of it.
 *
 * Reads data/school-registry.json (slug, state, country, dataset spellings) and
 * data/school-policies.json (policies checked on the school's own page). Regenerate
 * rather than hand-editing the SQL.
 *
 * Contains no AAMC numbers, only names, so it is safe in this public repo. The A-1
 * figures are seeded separately by scripts/db/seed-residency.mjs.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const APPLIED = 'supabase/migrations/20260919000500_school_registry_backfill.sql';
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : APPLIED;
const registry = JSON.parse(readFileSync('data/school-registry.json', 'utf8'));
const { policies } = JSON.parse(readFileSync('data/school-policies.json', 'utf8'));

const esc = s => String(s).replace(/'/g, "''");
const textArray = xs => (xs.length ? `ARRAY[${xs.map(x => `'${esc(x)}'`).join(', ')}]::text[]` : `'{}'::text[]`);

const bySlug = new Map(registry.schools.map(s => [s.slug, s]));
for (const slug of Object.keys(policies)) {
  if (!bySlug.has(slug)) throw new Error(`school-policies.json names unknown slug "${slug}"`);
  if (!policies[slug].source_url) throw new Error(`policy for "${slug}" has no source_url`);
}

const lines = [
  '-- Identity and verified residency policy for every medical_schools row.',
  '--',
  `-- Generated ${new Date().toISOString().slice(0, 10)} from data/school-registry.json and`,
  '-- data/school-policies.json by scripts/data/build-registry-migration.mjs. Regenerate rather',
  '-- than hand-editing.',
  '--',
  '-- Keys on school_name, like 20260908000000_add_school_target_vectors.sql. The check at the',
  '-- end fails the migration if any row was missed, so a renamed school cannot slip through',
  '-- with no slug.',
  '--',
  '-- Idempotent: re-running is a no-op.',
  '',
];

for (const s of registry.schools) {
  lines.push(
    `UPDATE medical_schools SET slug = '${esc(s.slug)}', state = '${s.state}', country = '${s.country}'`,
    `WHERE school_name = '${esc(s.school_name)}';`,
  );
  for (const [source, aliases] of Object.entries(s.aliases)) {
    for (const alias of aliases) {
      lines.push(
        `INSERT INTO school_aliases (school_id, alias, source_slug)`,
        `SELECT id, '${esc(alias)}', '${esc(source)}' FROM medical_schools WHERE slug = '${esc(s.slug)}'`,
        `ON CONFLICT DO NOTHING;`,
      );
    }
  }
  lines.push('');
}

for (const [slug, p] of Object.entries(policies)) {
  lines.push(
    `-- ${slug}: verified ${p.verified}. ${p.verified_how ?? ''}`.trimEnd(),
    `UPDATE medical_schools SET`,
    `  residency_policy = '${esc(p.residency_policy)}',`,
    `  regional_states = ${textArray(p.regional_states ?? [])},`,
    `  accepts_international = '${esc(p.accepts_international ?? 'unknown')}',`,
    `  policy_note = '${esc(p.policy_note)}',`,
    `  policy_source_url = '${esc(p.source_url)}'`,
    `WHERE slug = '${esc(slug)}';`,
    '',
  );
}

lines.push(
  'DO $$',
  'BEGIN',
  '  IF EXISTS (SELECT 1 FROM medical_schools WHERE slug IS NULL OR state IS NULL) THEN',
  "    RAISE EXCEPTION 'medical_schools rows left without slug/state: %',",
  "      (SELECT string_agg(school_name, '; ') FROM medical_schools WHERE slug IS NULL OR state IS NULL);",
  '  END IF;',
  'END $$;',
  '',
);

// Everything but the date line has to match what production already ran.
const body = s => s.replace(/^-- Generated .*$/m, '');
if (OUT === APPLIED && existsSync(APPLIED) && body(readFileSync(APPLIED, 'utf8')) !== body(lines.join('\n'))) {
  console.error(`${APPLIED} is applied and this would change it.`);
  console.error('Write the new state to a new migration instead: --out supabase/migrations/<timestamp>_school_registry_update.sql');
  process.exit(1);
}

writeFileSync(OUT, lines.join('\n'));
const aliasCount = registry.schools.reduce((n, s) => n + Object.values(s.aliases).flat().length, 0);
console.log(`wrote ${OUT}: ${registry.schools.length} schools, ${aliasCount} aliases, ${Object.keys(policies).length} verified policies`);
