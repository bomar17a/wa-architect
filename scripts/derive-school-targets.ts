// Derives per-school pillar targets from each school's published mission statement.
//
//   node scripts/derive-school-targets.ts          # writes school_targets.json
//   node scripts/derive-school-targets.ts --audit  # also prints the matched terms
//
// Why this exists: every school in an archetype bucket used to show the identical
// match percentage, because nothing school-specific entered the calculation. The
// mission statements were sitting in the table unused. This reads them.
//
// The method is a transparent keyword lexicon, not a model. That is deliberate:
// the output is a number shown to applicants making expensive decisions, so it
// has to be auditable — every adjustment here can be traced to the words that
// caused it, and the JSON records them. A model pass could refine this later
// (see README note in the output file), but it would need review, not trust.
//
// Output is written to school_targets.json for human review BEFORE it reaches the
// database. Nothing here writes to Supabase.

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { SCHOOL_ARCHETYPES, PILLARS, type Pillar, type PillarScores } from '../utils/missionFit.ts';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

// ── Lexicon ─────────────────────────────────────────────────────────────────
// Weighted terms per pillar. Multi-word phrases are the strong signals; single
// words are weaker because they turn up in boilerplate.

const LEXICON: Record<Pillar, [string, number][]> = {
    Inquiry: [
        ['physician-scientist', 3], ['physician scientist', 3], ['md-phd', 3],
        ['biomedical research', 3], ['translational', 2.5], ['scientific discovery', 2.5],
        ['basic science', 2.5], ['research', 1.5], ['discovery', 1.5], ['scholarship', 1.5],
        ['scientific', 1.5], ['investigator', 1.5], ['laboratory', 1.5], ['inquiry', 1],
        ['innovation', 1], ['knowledge', 0.5], ['academic medicine', 2],
    ],
    Clinical: [
        ['primary care', 3], ['patient care', 2.5], ['patient-centered', 2.5],
        ['clinical care', 2.5], ['clinical excellence', 2.5], ['bedside', 2],
        ['physician workforce', 2], ['generalist', 2], ['clinical practice', 2],
        ['compassionate care', 2], ['healing', 1.5], ['clinicians', 1.5],
        ['clinical', 1], ['practice', 0.5], ['whole health', 1.5],
    ],
    Service: [
        ['underserved', 3], ['health equity', 3], ['health disparities', 3],
        ['social justice', 3], ['medically underserved', 3], ['vulnerable populations', 2.5],
        ['community health', 2.5], ['public health', 2], ['rural', 2], ['access to care', 2],
        ['equity', 1.5], ['disparities', 1.5], ['community', 1.5], ['diversity', 1],
        ['inclusion', 1], ['service', 1], ['advocacy', 1.5], ['humanism', 1],
    ],
    Teamwork: [
        ['interprofessional', 3], ['health policy', 2.5], ['systems of care', 2.5],
        ['entrepreneurial', 2.5], ['entrepreneurialism', 2.5], ['health care leaders', 2.5],
        ['leadership', 2], ['collaborative', 2], ['partnership', 2], ['teamwork', 2],
        ['administration', 1.5], ['transform', 1.5], ['team', 1], ['leaders', 1.5],
        ['collaboration', 1.5], ['organizations', 1],
    ],
};

/** Human-readable tags for the school drawer, strongest first. */
const TAG_TERMS: [string, string][] = [
    ['physician-scientist', 'physician-scientist training'],
    ['md-phd', 'physician-scientist training'],
    ['primary care', 'primary care'],
    ['rural', 'rural health'],
    ['underserved', 'underserved communities'],
    ['health equity', 'health equity'],
    ['health disparities', 'health disparities'],
    ['social justice', 'social justice'],
    ['public health', 'public health'],
    ['community health', 'community health'],
    ['health policy', 'health policy'],
    ['interprofessional', 'interprofessional care'],
    ['entrepreneur', 'entrepreneurship'],
    ['innovation', 'innovation'],
    ['translational', 'translational research'],
    ['basic science', 'basic science'],
    ['research', 'research'],
    ['leadership', 'leadership'],
    ['global health', 'global health'],
    ['whole health', 'whole-person care'],
];

/** How far a mission statement may pull a pillar off its archetype baseline. */
const MAX_SHIFT = 1.5;
const MIN_TARGET = 3;
const MAX_TARGET = 10;

interface Derived {
    school_name: string;
    primary_category: string;
    targets: PillarScores;
    emphasis_tags: string[];
    /** Recorded so a reviewer can see what drove each number. */
    matched: Record<Pillar, string[]>;
    mission_chars: number;
}

function derive(schoolName: string, category: string, mission: string): Derived | null {
    const arch = SCHOOL_ARCHETYPES.find(a => a.dbCategory === category);
    if (!arch) return null;

    const text = (mission || '').toLowerCase();
    const raw = {} as Record<Pillar, number>;
    const matched = {} as Record<Pillar, string[]>;

    PILLARS.forEach(p => {
        let sum = 0;
        const hits: string[] = [];
        for (const [term, weight] of LEXICON[p]) {
            if (text.includes(term)) {
                sum += weight;
                hits.push(term);
            }
        }
        raw[p] = sum;
        matched[p] = hits;
    });

    const total = PILLARS.reduce((s, p) => s + raw[p], 0);
    const targets = {} as PillarScores;

    PILLARS.forEach(p => {
        // Compare this pillar's share of the mission's emphasis against an even
        // split. A school that talks about nothing but research pulls Inquiry up
        // and the rest down; a mission with no usable signal keeps the archetype
        // baseline untouched.
        const share = total > 0 ? raw[p] / total : 0.25;
        const shift = total > 0 ? (share - 0.25) / 0.75 * MAX_SHIFT : 0;
        const value = arch.targets[p] + shift;
        targets[p] = Math.round(Math.max(MIN_TARGET, Math.min(MAX_TARGET, value)) * 10) / 10;
    });

    const tags: string[] = [];
    for (const [term, label] of TAG_TERMS) {
        if (text.includes(term) && !tags.includes(label)) tags.push(label);
        if (tags.length >= 5) break;
    }

    return {
        school_name: schoolName,
        primary_category: category,
        targets,
        emphasis_tags: tags,
        matched,
        mission_chars: (mission || '').length,
    };
}

// ── Run ─────────────────────────────────────────────────────────────────────

if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
    console.error('Run with: node --env-file=.env.local scripts/derive-school-targets.ts');
    process.exit(1);
}

const audit = process.argv.includes('--audit');
const supabase = createClient(url, key);

const { data, error } = await supabase
    .from('medical_schools')
    .select('school_name, primary_category, mission_statement')
    .order('school_name');

if (error) {
    console.error('Could not read medical_schools:', error.message);
    process.exit(1);
}

const results: Derived[] = [];
const skipped: string[] = [];
let noSignal = 0;

for (const row of data ?? []) {
    const d = derive(row.school_name, row.primary_category, row.mission_statement);
    if (!d) { skipped.push(`${row.school_name} (unknown category ${row.primary_category})`); continue; }
    if (PILLARS.every(p => d.matched[p].length === 0)) noSignal++;
    results.push(d);
}

fs.writeFileSync('school_targets.json', JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    method: 'keyword lexicon over published mission statements; see scripts/derive-school-targets.ts',
    note: 'Review before applying. Targets shift each archetype baseline by at most ' +
          `${MAX_SHIFT} points. "matched" records the terms that caused each shift.`,
    count: results.length,
    schools: results,
}, null, 2));

console.log(`Derived targets for ${results.length} schools -> school_targets.json`);
if (skipped.length) console.log(`Skipped ${skipped.length}: ${skipped.join(', ')}`);
console.log(`${noSignal} school(s) had no lexicon hits and keep their archetype baseline unchanged.`);

// Spread check: if this barely moves anything, the lexicon is not earning its keep.
console.log('\nSpread within each archetype (min..max per pillar):');
for (const arch of SCHOOL_ARCHETYPES) {
    const rows = results.filter(r => r.primary_category === arch.dbCategory);
    if (!rows.length) { console.log(`  ${arch.name.padEnd(18)} no schools`); continue; }
    const parts = PILLARS.map(p => {
        const vals = rows.map(r => r.targets[p]);
        return `${p} ${Math.min(...vals).toFixed(1)}-${Math.max(...vals).toFixed(1)}`;
    });
    console.log(`  ${arch.name.padEnd(18)} n=${String(rows.length).padStart(3)}  ${parts.join('  ')}`);
}

if (audit) {
    console.log('\nSample (first 5):');
    for (const r of results.slice(0, 5)) {
        console.log(`\n  ${r.school_name} [${r.primary_category}]`);
        console.log(`    targets: ${PILLARS.map(p => `${p} ${r.targets[p]}`).join(', ')}`);
        console.log(`    tags:    ${r.emphasis_tags.join(', ') || '(none)'}`);
        PILLARS.forEach(p => {
            if (r.matched[p].length) console.log(`    ${p}: ${r.matched[p].join(', ')}`);
        });
    }
}
