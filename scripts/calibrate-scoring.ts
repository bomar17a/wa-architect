// Calibration harness for the mission-fit scoring engine.
//
//   node scripts/calibrate-scoring.ts
//
// This file, not any number written in a design doc, is the definition of
// "calibrated". Each reference profile below is a synthetic applicant whose
// real-world standing we know from published matriculant benchmarks; the engine
// has to place each one in the band that standing implies, and the ladder
// between them has to stay monotonic.
//
// If you change a curve, a bonus, or a match constant, run this. Node 24 strips
// the types natively, so there is no build step and no test dependency.

import type { Activity } from '../types.ts';
import {
    computeCompetency,
    computeCompleteness,
    computeMatch,
    bestFitArchetype,
    SCHOOL_ARCHETYPES,
    PILLARS,
} from '../utils/missionFit.ts';
import { calculateAdComScore } from '../utils/adcomScore.ts';

// ── Fixtures ────────────────────────────────────────────────────────────────

interface Spec {
    type: string;
    hours: number;
    months?: number;
    mme?: boolean;
    status?: Activity['status'];
    comps?: string[];
    desc?: string;
}

let nextId = 1;

function activity(spec: Spec): Activity {
    const months = spec.months ?? 12;
    const startYear = 2023;
    const endYear = startYear + Math.floor(months / 12);
    const endMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'][months % 12];

    return {
        id: nextId++,
        title: `${spec.type} role`,
        organization: 'Test Org',
        experienceType: spec.type,
        city: 'Testville',
        country: 'USA',
        dateRanges: [{
            id: `dr-${nextId}`,
            startDateMonth: 'January',
            startDateYear: String(startYear),
            endDateMonth: endMonth,
            endDateYear: String(endYear),
            hours: String(spec.hours),
        }],
        contactName: '', contactTitle: '', contactEmail: '', contactPhone: '',
        status: spec.status ?? 'Draft' as Activity['status'],
        isMostMeaningful: spec.mme ?? false,
        description: spec.desc ?? 'Did the work described here over a sustained period.',
        mmeAction: '', mmeResult: '', mmeEssay: '',
        competencies: spec.comps ?? ['Teamwork', 'Reliability and Dependability'],
    };
}

function profile(specs: Spec[]): Activity[] {
    nextId = 1;
    return specs.map(activity);
}

const RESEARCH = 'Research/Lab';
const CLINICAL = 'Paid Employment - Medical/Clinical';
const MED_VOL = 'Community Service/Volunteer - Medical/Clinical';
const SERVICE = 'Community Service/Volunteer - Not Medical/Clinical';
const SHADOW = 'Physician Shadowing/Clinical Observation';
const LEADERSHIP = 'Leadership - Not Listed Elsewhere';
const TEACHING = 'Teaching/Tutoring/Teaching Assistant';
const PUBLICATION = 'Publications';
const POSTER = 'Presentations/Posters';
const EXTRACURRICULAR = 'Extracurricular Activities';

// ── Reference profiles ──────────────────────────────────────────────────────

interface Reference {
    name: string;
    why: string;
    activities: Activity[];
    adcom: [number, number];
    level: string;
    match: [number, number];
    /** Pillars that must not reach the top of the scale on this profile. */
    capped?: { pillar: typeof PILLARS[number]; max: number }[];
}

const REFERENCES: Reference[] = [
    {
        name: 'Reported profile',
        why: '5 activities, one 500h research role, no clinical hours, no MME. The case that started this.',
        activities: profile([
            { type: SERVICE, hours: 100 },
            { type: LEADERSHIP, hours: 300 },
            { type: RESEARCH, hours: 500, status: 'Polished' as Activity['status'], comps: ['Scientific Inquiry', 'Critical Thinking'] },
            { type: SERVICE, hours: 150 },
            { type: TEACHING, hours: 100 },
        ]),
        adcom: [20, 38],
        level: 'Foundation',
        match: [22, 40],
        capped: [{ pillar: 'Inquiry', max: 6.5 }],
    },
    {
        name: 'Median matriculant',
        why: '11 activities at published median hours. Someone who got in, without standing out.',
        activities: profile([
            { type: RESEARCH, hours: 250, comps: ['Scientific Inquiry'] },
            { type: CLINICAL, hours: 250, mme: true, desc: 'Direct patient care in a busy clinic.' },
            { type: MED_VOL, hours: 120, desc: 'Hospital volunteer supporting patient transport.' },
            { type: SERVICE, hours: 150, mme: true },
            { type: SHADOW, hours: 50 },
            { type: LEADERSHIP, hours: 150, desc: 'Chaired the student outreach committee.' },
            { type: TEACHING, hours: 120 },
            { type: EXTRACURRICULAR, hours: 100 },
            { type: SERVICE, hours: 60, status: 'Polished' as Activity['status'] },
            { type: EXTRACURRICULAR, hours: 80, status: 'Polished' as Activity['status'] },
            { type: TEACHING, hours: 90, status: 'Polished' as Activity['status'] },
        ]),
        adcom: [52, 70],
        level: 'Building',
        // Someone who was admitted should read as a good fit for the archetype they
        // suit best. What they should not read as is outstanding.
        match: [65, 85],
    },
    {
        name: 'Strong applicant',
        why: '14 activities, 800 research hours with a poster, 500 clinical hours, 3 MMEs.',
        activities: profile([
            { type: RESEARCH, hours: 800, months: 24, mme: true, comps: ['Scientific Inquiry', 'Critical Thinking'], status: 'Final' as Activity['status'] },
            { type: POSTER, hours: 0 },
            { type: CLINICAL, hours: 400, months: 18, mme: true, desc: 'Scribe in the emergency department, direct patient contact.' },
            { type: MED_VOL, hours: 200, months: 18, desc: 'Free clinic intake and patient navigation.' },
            { type: SERVICE, hours: 300, months: 24, mme: true, desc: 'Founded the tutoring outreach program.' },
            { type: SHADOW, hours: 80 },
            { type: LEADERSHIP, hours: 250, months: 18, desc: 'President of the pre-health society.' },
            { type: TEACHING, hours: 200, months: 18 },
            { type: EXTRACURRICULAR, hours: 150 },
            { type: SERVICE, hours: 120, status: 'Final' as Activity['status'] },
            { type: TEACHING, hours: 100, status: 'Polished' as Activity['status'] },
            { type: EXTRACURRICULAR, hours: 90, status: 'Polished' as Activity['status'] },
            { type: 'Hobbies', hours: 200 },
            { type: 'Paid Employment - Not Medical/Clinical', hours: 300, months: 24 },
        ]),
        adcom: [70, 88],
        level: 'Competitive',
        match: [85, 95],
    },
    {
        name: 'Exceptional applicant',
        why: '15 activities, 1,800 research hours with a publication, 1,200 clinical hours, 3 MMEs.',
        activities: profile([
            { type: RESEARCH, hours: 1200, months: 30, mme: true, comps: ['Scientific Inquiry', 'Critical Thinking'], status: 'Final' as Activity['status'] },
            { type: RESEARCH, hours: 600, months: 18, comps: ['Scientific Inquiry'], status: 'Final' as Activity['status'] },
            { type: PUBLICATION, hours: 0 },
            { type: POSTER, hours: 0 },
            { type: CLINICAL, hours: 900, months: 24, mme: true, desc: 'Full-time medical assistant, direct patient care in clinic.' },
            { type: MED_VOL, hours: 300, months: 24, desc: 'Free clinic patient navigator.' },
            { type: SERVICE, hours: 400, months: 30, mme: true, desc: 'Founded and led a community food program.' },
            { type: SERVICE, hours: 250, months: 18 },
            { type: SHADOW, hours: 120 },
            { type: LEADERSHIP, hours: 400, months: 24, desc: 'President of the student council.' },
            { type: TEACHING, hours: 300, months: 24 },
            { type: EXTRACURRICULAR, hours: 250, months: 18, status: 'Final' as Activity['status'] },
            { type: 'Intercollegiate Athletics', hours: 400, months: 24, desc: 'Team captain.' },
            { type: 'Paid Employment - Not Medical/Clinical', hours: 300, months: 24, status: 'Final' as Activity['status'] },
            { type: 'Hobbies', hours: 200, status: 'Polished' as Activity['status'] },
        ]),
        adcom: [88, 100],
        level: 'Exceptional',
        match: [88, 95],
    },
    {
        name: 'Hours-stuffed single activity',
        why: 'One research entry claiming 3,000 hours. The regression guard: volume alone must not max a pillar.',
        activities: profile([
            { type: RESEARCH, hours: 3000, months: 24 },
        ]),
        adcom: [0, 20],
        level: 'Foundation',
        match: [0, 25],
        capped: [{ pillar: 'Inquiry', max: 6.5 }],
    },
];

// ── Run ─────────────────────────────────────────────────────────────────────

let failures = 0;

function check(label: string, ok: boolean, detail: string) {
    if (!ok) failures++;
    console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(22)} ${detail}`);
}

const ladder: { name: string; adcom: number; match: number }[] = [];

for (const ref of REFERENCES) {
    const { scores, hours, evidence } = computeCompetency(ref.activities);
    const completeness = computeCompleteness(ref.activities);
    const adcom = calculateAdComScore(ref.activities);
    const arch = bestFitArchetype(scores);
    const result = computeMatch(scores, arch.targets, completeness.factor);

    console.log(`\n${ref.name}`);
    console.log(`   ${ref.why}`);
    console.log('   pillars ' + PILLARS.map(p =>
        `${p} ${scores[p].toFixed(1)} (${Math.round(hours[p])}h, ${evidence[p].activityCount} act${evidence[p].hasDistinction ? ', distinct' : ''})`
    ).join(' | '));
    console.log(`   best fit ${arch.name} — coverage ${result.coverage}% x balance ${result.balance}% x shape ${result.shape}% x completeness ${result.completeness}% = ${result.match}% (limiting: ${result.limitingPillar})`);

    check('AdCom score', adcom.score >= ref.adcom[0] && adcom.score <= ref.adcom[1],
        `${adcom.score} (want ${ref.adcom[0]}-${ref.adcom[1]})`);
    check('AdCom tier', adcom.level === ref.level, `${adcom.level} (want ${ref.level})`);
    check('Best-fit match', result.match >= ref.match[0] && result.match <= ref.match[1],
        `${result.match}% (want ${ref.match[0]}-${ref.match[1]}%)`);

    for (const cap of ref.capped ?? []) {
        check(`${cap.pillar} ceiling`, scores[cap.pillar] <= cap.max,
            `${scores[cap.pillar].toFixed(1)} (must be <= ${cap.max})`);
    }

    ladder.push({ name: ref.name, adcom: adcom.score, match: result.match });
}

// The ladder must stay monotonic: a strictly better applicant must never score
// lower than a weaker one, whatever the individual bands allow.
//
// The two numbers answer different questions, so they are held to different rules.
// The AdCom score measures how strong the application is, and must rise strictly.
// The match measures fit to one archetype, which saturates by design — once an
// applicant clears every target a school looks for, being stronger still cannot
// make them a better fit. So match is only required not to fall.
console.log('\nMonotonicity');
const ordered = ['Hours-stuffed single activity', 'Reported profile', 'Median matriculant', 'Strong applicant', 'Exceptional applicant']
    .map(n => ladder.find(l => l.name === n)!);
for (let i = 1; i < ordered.length; i++) {
    check('AdCom rises', ordered[i].adcom > ordered[i - 1].adcom,
        `${ordered[i - 1].name} ${ordered[i - 1].adcom} -> ${ordered[i].name} ${ordered[i].adcom}`);
    check('Match holds', ordered[i].match >= ordered[i - 1].match,
        `${ordered[i - 1].name} ${ordered[i - 1].match}% -> ${ordered[i].name} ${ordered[i].match}%`);
}

// Every archetype must be reachable: if no realistic profile can match one, the
// targets are wrong and that archetype's schools would never surface.
console.log('\nArchetype reachability');
const strong = computeCompetency(REFERENCES[2].activities).scores;
for (const arch of SCHOOL_ARCHETYPES) {
    const m = computeMatch(strong, arch.targets, 1).fit;
    check(arch.name, m >= 60, `strong applicant fits at ${m}%`);
}

console.log(`\n${failures === 0 ? 'Calibrated. All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
