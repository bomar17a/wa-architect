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

const UPSERT = `
  INSERT INTO public.wa_exemplars (
    slug, source, experience_type, experience_type_as_published,
    title, title_as_published, organization,
    total_hours, hours_as_published, is_most_meaningful,
    description, mme_remarks, quality_band,
    pillars, competencies, techniques, defects, curator_note,
    anchor_specificity, anchor_quantification, anchor_reflection, anchor_voice
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
  )
  ON CONFLICT (slug) DO UPDATE SET
    source = EXCLUDED.source,
    experience_type = EXCLUDED.experience_type,
    experience_type_as_published = EXCLUDED.experience_type_as_published,
    title = EXCLUDED.title,
    title_as_published = EXCLUDED.title_as_published,
    organization = EXCLUDED.organization,
    total_hours = EXCLUDED.total_hours,
    hours_as_published = EXCLUDED.hours_as_published,
    is_most_meaningful = EXCLUDED.is_most_meaningful,
    description = EXCLUDED.description,
    mme_remarks = EXCLUDED.mme_remarks,
    quality_band = EXCLUDED.quality_band,
    pillars = EXCLUDED.pillars,
    competencies = EXCLUDED.competencies,
    techniques = EXCLUDED.techniques,
    defects = EXCLUDED.defects,
    curator_note = EXCLUDED.curator_note,
    anchor_specificity = EXCLUDED.anchor_specificity,
    anchor_quantification = EXCLUDED.anchor_quantification,
    anchor_reflection = EXCLUDED.anchor_reflection,
    anchor_voice = EXCLUDED.anchor_voice,
    updated_at = NOW()
`;

const params = (e) => [
  e.slug, e.source, e.experience_type, e.experience_type_as_published ?? null,
  e.title, e.title_as_published ?? null, e.organization ?? null,
  e.total_hours ?? null, e.hours_as_published ?? null, e.is_most_meaningful,
  e.description, e.mme_remarks ?? null, e.quality_band,
  e.pillars ?? [], e.competencies ?? [], e.techniques ?? [], e.defects ?? [], e.curator_note,
  e.anchor_scores?.specificity ?? null,
  e.anchor_scores?.quantification ?? null,
  e.anchor_scores?.reflection ?? null,
  e.anchor_scores?.voiceAuthenticity ?? null,
];

if (dryRun) {
  console.log(`${entries.length} rows would be upserted.`);
  console.log('anchors:', entries.filter(e => e.anchor_scores).map(e => e.slug).join(', '));
  process.exit(0);
}

// Imported here rather than at the top so --dry-run works without it. `pg` is not
// in package.json — scripts/db/apply-migration.mjs has the same unlisted dependency.
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
