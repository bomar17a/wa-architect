/**
 * Seeds public.data_sources and public.school_residency_stats from the AAMC FACTS A-1
 * files listed in data/source-manifest.json.
 *
 *   node scripts/db/seed-residency.mjs --dry-run   # parse, check, map; no database
 *   node scripts/db/seed-residency.mjs             # needs SUPABASE_DB_PASSWORD
 *
 * Needs migrations 20260919000000 and 20260919000500 applied first (tables, slugs,
 * aliases). Idempotent: upserts on (school_id, cycle_year).
 *
 * The numbers are seeded from local files rather than written into a migration because
 * migrations are committed and this repo is public, while AAMC licenses A-1 for
 * noncommercial use only. The files are gitignored; the manifest records where each
 * came from and its sha256, and this script refuses a file that does not match.
 *
 * Nothing is inferred. A school name that is neither in data/school-registry.json nor
 * listed there as unmatched fails the run, because a silently dropped row would show
 * an applicant "no data" for a school that has it.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { readA1, checkA1 } from '../data/read-aamc-a1.mjs';

const dryRun = process.argv.includes('--dry-run');
if (!dryRun && !process.env.SUPABASE_DB_PASSWORD) {
  console.error('SUPABASE_DB_PASSWORD is not set in the environment.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync('data/source-manifest.json', 'utf8'));
const registry = JSON.parse(readFileSync('data/school-registry.json', 'utf8'));

const SOURCE = 'aamc-facts-a1';
const slugByAlias = new Map();
for (const s of registry.schools) for (const a of s.aliases[SOURCE] ?? []) slugByAlias.set(a, s.slug);
const knownUnmatched = registry.unmatched?.[SOURCE] ?? {};

const problems = [];
const sources = [];
const stats = [];

for (const src of manifest.sources.filter(s => s.reader === 'aamc-a1')) {
  if (!existsSync(src.file)) {
    problems.push(`${src.slug}: ${src.file} is missing. Download it from ${src.url}`);
    continue;
  }
  const sha = createHash('sha256').update(readFileSync(src.file)).digest('hex');
  if (sha !== src.sha256) {
    problems.push(`${src.slug}: sha256 ${sha} does not match the manifest. AAMC may have republished the table; review it before updating the manifest.`);
    continue;
  }

  const table = readA1(src.file);
  for (const p of checkA1(table)) problems.push(`${src.slug}: ${p}`);
  if (table.cycleYear !== src.data_year) problems.push(`${src.slug}: file says ${table.cycleYear}, manifest says ${src.data_year}`);
  if (!table.notice) problems.push(`${src.slug}: no licence notice found in the file`);

  sources.push({ ...src, license_note: table.notice });

  for (const r of table.rows) {
    const slug = slugByAlias.get(r.name);
    if (!slug) {
      if (!(r.name in knownUnmatched)) problems.push(`${src.slug}: "${r.name}" (${r.state}) is not in data/school-registry.json`);
      continue;
    }
    stats.push({
      slug,
      source: src.slug,
      cycle_year: table.cycleYear,
      applications: r.applications,
      apps_in_state_pct: r.appsInStatePct,
      matriculants: r.matriculants,
      mat_in_state_pct: r.matInStatePct,
    });
  }
}

// Two spellings of one school in the same cycle would silently overwrite each other.
const seen = new Set();
for (const s of stats) {
  const key = `${s.slug}:${s.cycle_year}`;
  if (seen.has(key)) problems.push(`${s.source}: two A-1 rows map to ${s.slug}`);
  seen.add(key);
}

if (problems.length) {
  console.error('Not seeding:\n' + problems.map(p => `  - ${p}`).join('\n'));
  process.exit(1);
}

const byCycle = stats.reduce((m, s) => ({ ...m, [s.cycle_year]: (m[s.cycle_year] ?? 0) + 1 }), {});
console.log(`${sources.length} sources, ${stats.length} school-cycle rows:`, byCycle);
console.log('left unmatched on purpose:', Object.keys(knownUnmatched).join(', ') || 'none');

if (dryRun) {
  const sample = stats.filter(s => s.slug === 'arkansas');
  console.log('sample (arkansas):', sample.map(s => `${s.cycle_year} apps ${s.applications} (${s.apps_in_state_pct}% in-state), mat ${s.matriculants} (${s.mat_in_state_pct}% in-state)`).join(' | '));
  process.exit(0);
}

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

  const sourceIds = new Map();
  for (const s of sources) {
    const { rows } = await client.query(
      `INSERT INTO public.data_sources (slug, publisher, title, url, data_year, retrieved_at, file_sha256, license_note, commercial_use)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET
         publisher = EXCLUDED.publisher, title = EXCLUDED.title, url = EXCLUDED.url,
         data_year = EXCLUDED.data_year, retrieved_at = EXCLUDED.retrieved_at,
         file_sha256 = EXCLUDED.file_sha256, license_note = EXCLUDED.license_note,
         commercial_use = EXCLUDED.commercial_use
       RETURNING id`,
      [s.slug, s.publisher, s.title, s.url, s.data_year, s.retrieved_at, s.sha256, s.license_note, s.commercial_use],
    );
    sourceIds.set(s.slug, rows[0].id);
  }

  const { rows: schoolRows } = await client.query(
    'SELECT id, slug FROM public.medical_schools WHERE slug = ANY($1::text[])',
    [[...new Set(stats.map(s => s.slug))]],
  );
  const schoolId = new Map(schoolRows.map(r => [r.slug, r.id]));
  const missing = [...new Set(stats.map(s => s.slug))].filter(s => !schoolId.has(s));
  if (missing.length) throw new Error(`medical_schools has no row with slug ${missing.join(', ')}. Apply 20260919000500 first.`);

  for (const s of stats) {
    await client.query(
      `INSERT INTO public.school_residency_stats
         (school_id, cycle_year, applications, apps_in_state_pct, matriculants, mat_in_state_pct, source_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (school_id, cycle_year) DO UPDATE SET
         applications = EXCLUDED.applications, apps_in_state_pct = EXCLUDED.apps_in_state_pct,
         matriculants = EXCLUDED.matriculants, mat_in_state_pct = EXCLUDED.mat_in_state_pct,
         source_id = EXCLUDED.source_id`,
      [schoolId.get(s.slug), s.cycle_year, s.applications, s.apps_in_state_pct, s.matriculants, s.mat_in_state_pct, sourceIds.get(s.source)],
    );
  }
  await client.query('COMMIT');

  const { rows: counts } = await client.query(
    'SELECT cycle_year, count(*)::int AS n FROM public.school_residency_stats GROUP BY 1 ORDER BY 1',
  );
  console.log('seeded. rows per cycle:', counts.map(c => `${c.cycle_year}: ${c.n}`).join(', '));
} catch (err) {
  await client.query('ROLLBACK');
  console.error('seed failed, rolled back:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
