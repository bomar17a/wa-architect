// Audit harness for the exemplar corpus.
//
//   node scripts/audit-exemplars.ts
//
// Two jobs, and the second one is the point.
//
// 1. INTEGRITY — the corpus is transcribed from third-party PDFs that contain real
//    defects (invalid experience types, a mislabelled title, non-numeric hours,
//    entries that exceed the AMCAS character limits). Loading it unaudited would
//    teach the classifier wrong taxonomy and teach the scorer that over-limit
//    entries are fine. This half fails the run on anything structural.
//
// 2. CALIBRATION — the eight hand-scored anchors are a held-out test set for
//    `scoreNarrativeQuality()`. The heuristic runs on every keystroke and is what
//    users see before any AI call resolves; if it disagrees with a human reading of
//    a known-good entry, the number in the header bar is lying. This half reports
//    per-dimension error and fails on a mean absolute error above the threshold.
//
// Node 24 strips the types natively — no build step, same as scripts/calibrate-scoring.ts.

import { readFileSync } from 'node:fs';
import { scoreNarrativeQuality, scoreMmeQuality, mmeOverlapRatio } from '../services/narrativeQualityService.ts';
import { AMCAS_EXPERIENCE_TYPES, AAMC_CORE_COMPETENCIES, DESC_LIMITS, MME_LIMIT } from '../constants.ts';

interface Entry {
    slug: string;
    source: string;
    experience_type: string;
    experience_type_as_published: string;
    title: string;
    title_as_published?: string;
    organization: string | null;
    total_hours: number | null;
    hours_as_published: string;
    is_most_meaningful: boolean;
    description: string;
    mme_remarks: string | null;
    quality_band: 'exemplar' | 'solid' | 'weak' | 'counter_example';
    pillars: string[];
    competencies: string[];
    techniques: string[];
    defects: string[];
    curator_note: string;
    anchor_scores: null | {
        specificity: number;
        quantification: number;
        reflection: number;
        voiceAuthenticity: number;
    };
}

const corpus = JSON.parse(readFileSync(new URL('../data/amcas-exemplars.json', import.meta.url), 'utf8'));
const entries: Entry[] = corpus.entries;

const BANDS = ['exemplar', 'solid', 'weak', 'counter_example'] as const;
// Mean absolute error per dimension, in points on the 0-25 scale. 5.0 is one fifth
// of a dimension: enough slack for a heuristic, tight enough that a broken
// dimension cannot hide behind the other three.
const MAE_THRESHOLD = 5.0;

let failures = 0;
const fail = (msg: string) => { console.error(`  FAIL  ${msg}`); failures++; };
const warn = (msg: string) => console.warn(`  warn  ${msg}`);

// ── 1. Integrity ────────────────────────────────────────────────────────────

console.log(`\nEXEMPLAR CORPUS AUDIT — ${entries.length} entries\n`);
console.log('Integrity');

const seen = new Set<string>();
for (const e of entries) {
    if (seen.has(e.slug)) fail(`duplicate slug: ${e.slug}`);
    seen.add(e.slug);

    if (!AMCAS_EXPERIENCE_TYPES.includes(e.experience_type)) {
        fail(`${e.slug}: experience_type "${e.experience_type}" is not one of the 18 AMCAS types`);
    }
    if (!BANDS.includes(e.quality_band)) fail(`${e.slug}: unknown quality_band "${e.quality_band}"`);

    for (const c of e.competencies) {
        if (!AAMC_CORE_COMPETENCIES.includes(c)) fail(`${e.slug}: unknown competency "${c}"`);
    }
    if (!e.description?.trim()) fail(`${e.slug}: empty description`);
    if (!e.curator_note?.trim()) fail(`${e.slug}: missing curator_note — every entry must say why it is here`);
    if (e.is_most_meaningful && !e.mme_remarks) {
        warn(`${e.slug}: flagged most-meaningful but carries no mme_remarks`);
    }
}

// Every entry whose published type differs from the normalised one must say so in
// its defects, otherwise a silent remap looks like a transcription error later.
for (const e of entries) {
    const remapped = e.experience_type !== e.experience_type_as_published;
    const declared = e.defects.includes('invalid_experience_type_in_source');
    if (remapped && !declared && !e.experience_type_as_published.startsWith(e.experience_type.split(' - ')[0])) {
        warn(`${e.slug}: type remapped (${e.experience_type_as_published} -> ${e.experience_type}) without declaring it`);
    }
}

console.log(failures === 0 ? '  ok — taxonomy, competencies and provenance clean' : '');

// ── 2. Character budgets ────────────────────────────────────────────────────

console.log('\nCharacter budgets (AMCAS: description ' + DESC_LIMITS.AMCAS + ', MME ' + MME_LIMIT + ')');

const overDesc = entries.filter(e => e.description.length > DESC_LIMITS.AMCAS);
const overMme = entries.filter(e => e.mme_remarks && e.mme_remarks.length > MME_LIMIT);
const underDesc = entries.filter(e => e.description.length < DESC_LIMITS.AMCAS * 0.75);

for (const e of overDesc) {
    const flagged = e.defects.some(d => d.includes('over_limit') || d === 'cv_dump');
    const note = flagged ? '' : '  <- NOT flagged in defects';
    console.log(`  over  ${e.slug.padEnd(38)} ${e.description.length} chars (+${e.description.length - DESC_LIMITS.AMCAS})${note}`);
    if (!flagged) fail(`${e.slug}: exceeds the description limit but does not declare it in defects`);
}
for (const e of overMme) {
    console.log(`  over  ${e.slug.padEnd(38)} MME ${e.mme_remarks!.length} chars (+${e.mme_remarks!.length - MME_LIMIT})`);
}
console.log(`  ${overDesc.length}/${entries.length} descriptions over limit, ${overMme.length} MMEs over limit, ` +
    `${underDesc.length} descriptions using under 75% of the budget`);

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
console.log(`  median description ${median(entries.map(e => e.description.length))} chars; ` +
    `median MME ${median(entries.filter(e => e.mme_remarks).map(e => e.mme_remarks!.length))} chars`);

// ── 3. Coverage ─────────────────────────────────────────────────────────────

console.log('\nCoverage');
const byBand = Object.fromEntries(BANDS.map(b => [b, entries.filter(e => e.quality_band === b).length]));
console.log('  bands:', BANDS.map(b => `${b} ${byBand[b]}`).join(' | '));

const byType = new Map<string, number>();
for (const e of entries) byType.set(e.experience_type, (byType.get(e.experience_type) ?? 0) + 1);
const missing = AMCAS_EXPERIENCE_TYPES.filter(t => !byType.has(t));
console.log(`  types covered: ${byType.size}/${AMCAS_EXPERIENCE_TYPES.length}`);
console.log(`  uncovered: ${missing.join(', ') || 'none'}`);

// Retrieval degrades to same-pillar neighbours when a type is thin, so thin is a
// warning rather than a failure — but an uncovered type must never silently
// retrieve an unrelated exemplar.
for (const [t, n] of [...byType].sort((a, b) => a[1] - b[1])) {
    if (n < 2) warn(`only ${n} exemplar for "${t}" — retrieval will fall back to pillar neighbours`);
}

const covered = new Set(entries.flatMap(e => e.competencies));
const uncoveredComps = AAMC_CORE_COMPETENCIES.filter(c => !covered.has(c));
console.log(`  competencies evidenced: ${covered.size}/${AAMC_CORE_COMPETENCIES.length}` +
    (uncoveredComps.length ? ` (missing: ${uncoveredComps.join(', ')})` : ''));

// ── 4. Calibration against the deterministic scorer ─────────────────────────

console.log('\nCalibration — hand-scored anchors vs scoreNarrativeQuality()');

const DIMS = ['specificity', 'quantification', 'reflection', 'voiceAuthenticity'] as const;
const mae = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Scores one anchor set and returns per-dimension MAE. `tune` is what the scorer was
 * fitted against; `holdout` was scored before the rewrite and withheld during it. A
 * scorer that fits tune and misses holdout was fitted to eight rows, not to the rubric,
 * so both are reported and both are gated.
 */
function evaluate(label: string, rows: Entry[]) {
    const errs: Record<typeof DIMS[number], number[]> = {
        specificity: [], quantification: [], reflection: [], voiceAuthenticity: [],
    };
    const totalErrs: number[] = [];
    const biases: number[] = [];

    console.log(`\n  ${label} set (${rows.length})`);
    console.log('  entry                                  human  heuristic   delta   per-dimension (human->heuristic)');

    const byTotal = (x: Entry) => DIMS.reduce((s, d) => s + x.anchor_scores![d], 0);
    for (const e of [...rows].sort((a, b) => byTotal(b) - byTotal(a))) {
        const human = e.anchor_scores!;
        const got = scoreNarrativeQuality(e.description);
        const humanTotal = byTotal(e);
        const delta = got.total - humanTotal;
        totalErrs.push(Math.abs(delta));
        biases.push(delta);

        const per = DIMS.map(d => {
            errs[d].push(Math.abs(got[d] - human[d]));
            return `${d.slice(0, 4)} ${String(human[d]).padStart(2)}->${String(got[d]).padStart(2)}`;
        }).join('  ');

        const sign = delta > 0 ? `+${delta}` : `${delta}`;
        console.log(`  ${e.slug.padEnd(38)} ${String(humanTotal).padStart(3)}   ${String(got.total).padStart(7)}   ${sign.padStart(5)}   ${per}`);
    }

    console.log('');
    for (const d of DIMS) {
        const m = mae(errs[d]);
        const flag = m > MAE_THRESHOLD ? '  <- over threshold' : '';
        console.log(`  MAE ${d.padEnd(18)} ${m.toFixed(2)} / 25${flag}`);
        if (m > MAE_THRESHOLD) {
            fail(`[${label}] "${d}" is off by ${m.toFixed(2)} points on average (threshold ${MAE_THRESHOLD}).`);
        }
    }
    const meanBias = biases.reduce((a, b) => a + b, 0) / biases.length;
    console.log(`  MAE total${' '.repeat(14)}${mae(totalErrs).toFixed(2)} / 100   (mean signed bias ${meanBias > 0 ? '+' : ''}${meanBias.toFixed(1)})`);

    // Direction matters more than magnitude for a coaching tool. The old scorer was
    // most wrong on the weakest entries, telling users their worst work was fine.
    if (Math.abs(meanBias) > 8) {
        fail(`[${label}] systematically ${meanBias > 0 ? 'generous' : 'harsh'} by ${meanBias.toFixed(1)} points.`);
    }
    return mae(totalErrs);
}

const tuneRows = entries.filter(e => e.anchor_scores && e.anchor_set !== 'holdout');
const holdRows = entries.filter(e => e.anchor_scores && e.anchor_set === 'holdout');

const tuneMae = evaluate('tuning', tuneRows);
const holdMae = holdRows.length ? evaluate('held-out', holdRows) : 0;

if (holdRows.length) {
    const gap = holdMae - tuneMae;
    console.log(`\n  generalisation gap: ${gap > 0 ? '+' : ''}${gap.toFixed(2)} points of total MAE (held-out minus tuning)`);
    if (gap > 6) {
        fail(`held-out error exceeds tuning error by ${gap.toFixed(2)} — the weights are fitted to the tuning anchors, not to the rubric.`);
    }
}

// ── 5. MME calibration ──────────────────────────────────────────────────────

console.log('\nMME calibration — hand-scored anchors vs scoreMmeQuality()');

const MME_DIMS = ['insight', 'evidence', 'distinctness', 'voice'] as const;

function evaluateMme(label: string, rows: Entry[]) {
    const errs: Record<typeof MME_DIMS[number], number[]> = {
        insight: [], evidence: [], distinctness: [], voice: [],
    };
    const totalErrs: number[] = [];
    const biases: number[] = [];

    console.log(`\n  ${label} set (${rows.length})`);
    console.log('  entry                                  human  scorer   delta  overlap   per-dimension (human->scorer)');

    const byTotal = (x: Entry) => MME_DIMS.reduce((s, d) => s + x.mme_anchor_scores![d], 0);
    for (const e of [...rows].sort((a, b) => byTotal(b) - byTotal(a))) {
        const human = e.mme_anchor_scores!;
        const got = scoreMmeQuality(e.mme_remarks!, e.description);
        const humanTotal = byTotal(e);
        const delta = got.total - humanTotal;
        totalErrs.push(Math.abs(delta));
        biases.push(delta);

        const per = MME_DIMS.map(d => {
            errs[d].push(Math.abs(got[d] - human[d]));
            return `${d.slice(0, 4)} ${String(human[d]).padStart(2)}->${String(got[d]).padStart(2)}`;
        }).join('  ');

        const overlap = `${(mmeOverlapRatio(e.mme_remarks!, e.description) * 100).toFixed(0)}%`;
        const sign = delta > 0 ? `+${delta}` : `${delta}`;
        console.log(`  ${e.slug.padEnd(38)} ${String(humanTotal).padStart(3)}  ${String(got.total).padStart(6)}  ${sign.padStart(6)}  ${overlap.padStart(6)}   ${per}`);
    }

    console.log('');
    for (const d of MME_DIMS) {
        const m = mae(errs[d]);
        const flag = m > MAE_THRESHOLD ? '  <- over threshold' : '';
        console.log(`  MAE ${d.padEnd(18)} ${m.toFixed(2)} / 25${flag}`);
        if (m > MAE_THRESHOLD) fail(`[MME ${label}] "${d}" is off by ${m.toFixed(2)} points on average.`);
    }
    const meanBias = biases.reduce((a, b) => a + b, 0) / biases.length;
    console.log(`  MAE total${' '.repeat(14)}${mae(totalErrs).toFixed(2)} / 100   (mean signed bias ${meanBias > 0 ? '+' : ''}${meanBias.toFixed(1)})`);
    if (Math.abs(meanBias) > 8) {
        fail(`[MME ${label}] systematically ${meanBias > 0 ? 'generous' : 'harsh'} by ${meanBias.toFixed(1)} points.`);
    }
    return mae(totalErrs);
}

const mmeTune = entries.filter(e => e.mme_anchor_scores && e.mme_anchor_set !== 'holdout');
const mmeHold = entries.filter(e => e.mme_anchor_scores && e.mme_anchor_set === 'holdout');

if (mmeTune.length) {
    const t = evaluateMme('tuning', mmeTune);
    if (mmeHold.length) {
        const h = evaluateMme('held-out', mmeHold);
        const gap = h - t;
        console.log(`\n  generalisation gap: ${gap > 0 ? '+' : ''}${gap.toFixed(2)} points of total MAE (held-out minus tuning)`);
        if (gap > 6) fail(`[MME] held-out error exceeds tuning error by ${gap.toFixed(2)} — fitted to the anchors, not the rubric.`);
    }

    // Every MME entry should carry a description to compare against; a missing one
    // silently sends distinctness to its neutral value.
    for (const e of entries) {
        if (e.mme_remarks && !e.description?.trim()) fail(`${e.slug}: has mme_remarks but no description to measure distinctness against`);
    }
}

// ── Result ──────────────────────────────────────────────────────────────────

console.log('');
if (failures > 0) {
    console.error(`${failures} failure(s).\n`);
    process.exit(1);
}
console.log('All checks passed.\n');
