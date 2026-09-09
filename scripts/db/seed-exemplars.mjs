/**
 * Seeds public.wa_exemplars from data/amcas-exemplars.json.
 *
 *   node --experimental-transform-types scripts/audit-exemplars.ts   # must pass first
 *   node scripts/db/seed-exemplars.mjs [--dry-run]
 *
 * Requires SUPABASE_DB_PASSWORD, same as scripts/db/apply-migration.mjs. Idempotent:
 * upserts on slug, so re-running after editing the JSON re-syncs rather than duplicating.
 *
 * The audit is not a suggestion. The source PDFs contain an entry filed under a
 * non-existent AMCAS experience type and another whose title belongs to a different
 * activity entirely; seeding those unaudited is how a grounding corpus quietly
 * teaches the classifier the wrong taxonomy.
 */
import { readFileSync } from 'node:fs';

const dryRun = process.argv.includes('--dry-run');

if (!dryRun && !process.env.SUPABASE_DB_PASSWORD) {
  console.error('SUPABASE_DB_PASSWORD is not set in the environment.');
  process.exit(1);
}

const corpus = JSON.parse(readFileSync(new URL('../../data/amcas-exemplars.json', import.meta.url), 'utf8'));
const entries = corpus.entries;

// ── The field manifest ──────────────────────────────────────────────────────
//
// One entry per persisted column: the column name, the JSON key(s) it reads, and
// how to read them. The INSERT list, the placeholders, the ON CONFLICT clause and
// the parameter array are all generated from this, so they cannot disagree.
//
// They used to be four hand-maintained lists that had to stay in lockstep, which
// failed in two ways. anchor_set was added to the JSON and to none of the lists,
// so it silently never reached the table and the tune/holdout split stopped
// existing at runtime. The sharper one never fired but was always available:
// inserting a column into the middle of the name list while appending its value
// to the parameter array shifts every later value one column left, and where the
// neighbours are both text — title and organization, say — Postgres accepts it
// without complaint and the corpus is quietly wrong.
//
// Adding a field now means adding one line here, or declaring it AUDIT_ONLY below.
// Doing neither fails the run.
const FIELDS = [
  { col: 'slug', json: 'slug', get: e => e.slug },
  { col: 'source', json: 'source', get: e => e.source },
  { col: 'experience_type', json: 'experience_type', get: e => e.experience_type },
  { col: 'experience_type_as_published', json: 'experience_type_as_published', get: e => e.experience_type_as_published ?? null },
  { col: 'title', json: 'title', get: e => e.title },
  { col: 'title_as_published', json: 'title_as_published', get: e => e.title_as_published ?? null },
  { col: 'organization', json: 'organization', get: e => e.organization ?? null },
  { col: 'total_hours', json: 'total_hours', get: e => e.total_hours ?? null },
  { col: 'hours_as_published', json: 'hours_as_published', get: e => e.hours_as_published ?? null },
  { col: 'is_most_meaningful', json: 'is_most_meaningful', get: e => e.is_most_meaningful },
  { col: 'description', json: 'description', get: e => e.description },
  { col: 'mme_remarks', json: 'mme_remarks', get: e => e.mme_remarks ?? null },
  { col: 'quality_band', json: 'quality_band', get: e => e.quality_band },
  { col: 'pillars', json: 'pillars', get: e => e.pillars ?? [] },
  { col: 'competencies', json: 'competencies', get: e => e.competencies ?? [] },
  { col: 'techniques', json: 'techniques', get: e => e.techniques ?? [] },
  { col: 'defects', json: 'defects', get: e => e.defects ?? [] },
  { col: 'curator_note', json: 'curator_note', get: e => e.curator_note },
  { col: 'anchor_specificity', json: 'anchor_scores', get: e => e.anchor_scores?.specificity ?? null },
  { col: 'anchor_quantification', json: 'anchor_scores', get: e => e.anchor_scores?.quantification ?? null },
  { col: 'anchor_reflection', json: 'anchor_scores', get: e => e.anchor_scores?.reflection ?? null },
  { col: 'anchor_voice', json: 'anchor_scores', get: e => e.anchor_scores?.voiceAuthenticity ?? null },
  // Without this the retrieval cannot keep holdout entries out of prompts, and
  // reporting the two sets against each other stops measuring what
  // _meta.anchor_sets says it measures.
  { col: 'anchor_set', json: 'anchor_set', get: e => e.anchor_set ?? null },
];

// JSON keys deliberately not persisted. Every one needs a reason, because "it is
// not in the table" is exactly what the anchor_set bug looked like from here.
const AUDIT_ONLY = {
  mme_anchor_scores: 'consumed only by scripts/audit-exemplars.ts; the MME scorer is deterministic and runs offline, so nothing at runtime retrieves these',
  mme_anchor_set: 'the tune/holdout split for the MME anchors above, same offline-only reason',
};

// Columns the table manages itself.
const NOT_SEEDED = new Set(['created_at', 'updated_at']);

const cols = FIELDS.map(f => f.col);
const UPSERT = `
  INSERT INTO public.wa_exemplars (
    ${cols.join(', ')}
  ) VALUES (
    ${FIELDS.map((_, i) => `$${i + 1}`).join(',')}
  )
  ON CONFLICT (slug) DO UPDATE SET
    ${cols.filter(c => c !== 'slug').map(c => `${c} = EXCLUDED.${c}`).join(',\n    ')},
    updated_at = NOW()
`;

const params = (e) => FIELDS.map(f => f.get(e));

/**
 * Fails when the corpus grows a field this script does not know about. Needs no
 * database, so it runs under --dry-run and therefore in CI.
 */
function checkJsonDrift() {
  const claimed = new Set(FIELDS.flatMap(f => [f.json].flat()));
  const seen = new Set();
  for (const e of entries) for (const k of Object.keys(e)) seen.add(k);

  const unknown = [...seen].filter(k => !claimed.has(k) && !(k in AUDIT_ONLY)).sort();
  if (unknown.length) {
    console.error('Corpus fields this seed does not handle:\n');
    for (const k of unknown) {
      const n = entries.filter(e => e[k] != null).length;
      console.error(`  ${k}  (set on ${n} of ${entries.length} entries)`);
    }
    console.error('\nAdd each one to FIELDS so it reaches the table, or to AUDIT_ONLY with the');
    console.error('reason it should not. A field in neither list is silently dropped, which is');
    console.error('how anchor_set went missing.');
    process.exit(1);
  }
}

/** Fails when the table grows a column this script never writes. Needs the database. */
async function checkTableDrift(client) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'wa_exemplars'`,
  );
  const known = new Set(cols);
  const unwritten = rows
    .map(r => r.column_name)
    .filter(c => !known.has(c) && !NOT_SEEDED.has(c))
    .sort();

  if (unwritten.length) {
    console.error(`Table columns this seed never writes: ${unwritten.join(', ')}`);
    console.error('They will hold whatever the migration left and never track the corpus.');
    console.error('Add them to FIELDS, or to NOT_SEEDED if the table maintains them itself.');
    process.exit(1);
  }
}

checkJsonDrift();

if (dryRun) {
  console.log(`${entries.length} rows would be upserted across ${FIELDS.length} columns.`);
  console.log(`field manifest matches the corpus; ${Object.keys(AUDIT_ONLY).length} key(s) held back as audit-only.`);
  console.log('anchors:', entries.filter(e => e.anchor_scores).map(e => e.slug).join(', '));
  process.exit(0);
}

// Imported here rather than at the top so --dry-run stays usable — and therefore
// runnable in CI — without a database driver being present.
const { default: pg } = await import('pg');

const client = new pg.Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.jitzwwxsnpylaistotgq',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await checkTableDrift(client);
try {
  await client.query('BEGIN');
  for (const e of entries) await client.query(UPSERT, params(e));

  // Rows deleted from the JSON should disappear from the table too, otherwise a
  // retired exemplar keeps being retrieved.
  const stale = await client.query(
    'DELETE FROM public.wa_exemplars WHERE slug <> ALL($1::text[]) RETURNING slug',
    [entries.map(e => e.slug)],
  );
  await client.query('COMMIT');

  const counts = await client.query(
    'SELECT quality_band, count(*)::int FROM public.wa_exemplars GROUP BY 1 ORDER BY 1',
  );
  console.log(`upserted ${entries.length} rows`);
  if (stale.rowCount) console.log(`removed ${stale.rowCount} stale:`, stale.rows.map(r => r.slug).join(', '));
  console.log('bands:', counts.rows.map(r => `${r.quality_band} ${r.count}`).join(' | '));
} catch (err) {
  await client.query('ROLLBACK');
  console.error('seed failed, rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
