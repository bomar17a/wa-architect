// Fixture harness for services/mmeCoachService.ts.
//
//   node --experimental-transform-types scripts/audit-mme-coach.ts
//
// Every check is pinned to a case that must trip it and a case that must not. The
// negative cases matter more: a wrong note on an honest essay costs an applicant time
// and trust, and these notes are the product's stand-in for an advisor's comments.
//
// The second half runs the draft checks over the published MMEs in
// data/amcas-exemplars.json and asserts what a reader would expect: the counter-examples
// trip what they are known for, and strong essays stay mostly quiet.

import { readFileSync } from 'node:fs';
import {
    canMarkMostMeaningful, candidateNotes, setNotes, planNotes, draftNotes, finalCheck,
    withLegacyNotes, legacyFieldsFrom, workshopProgress, appendReview, latestReview, isReviewStale,
    openReviewNotes, MAX_MME_REVIEWS, type CoachNote,
} from '../services/mmeCoachService.ts';
import { sanitizeReview, REVIEW_CAPS } from '../services/mmeReviewFilter.ts';
import { ActivityStatus, ApplicationType, type Activity, type MmeWorkshop, type MmeReview } from '../types.ts';

let failures = 0;
const ok = (label: string, pass: boolean, detail = '') => {
    if (!pass) failures++;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${!pass && detail ? `\n        ${detail}` : ''}`);
};

const fires = (notes: CoachNote[], id: string) => notes.some(n => n.id === id || n.id.startsWith(`${id}-`));
const expectNote = (label: string, notes: CoachNote[], id: string, shouldFire: boolean) =>
    ok(label, fires(notes, id) === shouldFire,
        `expected ${id} ${shouldFire ? 'to fire' : 'not to fire'}; got [${notes.map(n => n.id).join(', ') || 'none'}]`);

const activity = (over: Partial<Activity> & { id: number }): Activity => ({
    title: `Activity ${over.id}`,
    organization: 'Org',
    experienceType: 'Community Service/Volunteer - Medical/Clinical',
    city: '', country: '',
    dateRanges: [{
        id: `dr-${over.id}`,
        startDateMonth: 'January', startDateYear: '2023',
        endDateMonth: 'December', endDateYear: '2024',
        hours: '200',
    }],
    contactName: '', contactTitle: '', contactEmail: '', contactPhone: '',
    status: ActivityStatus.DRAFT,
    isMostMeaningful: false,
    description: 'A description long enough to count as written.',
    mmeAction: '', mmeResult: '', mmeEssay: '',
    competencies: [],
    ...over,
});

// Filler that trips nothing: lowercase, alphabetic, distinct per call. Numbers or
// repeated tokens would read as quantities or recycled phrasing.
let seed = 0;
const base26 = (n: number): string => {
    let s = '';
    do { s += String.fromCharCode(97 + (n % 26)); n = Math.floor(n / 26); } while (n > 0);
    return s;
};
const filler = (chars: number): string => {
    seed++;
    const out: string[] = [];
    let i = 0;
    while (out.join(' ').length < chars) out.push(`zz${base26(seed)}yy${base26(i++)}`);
    return out.join(' ').slice(0, chars).trim();
};

// ── Marking ─────────────────────────────────────────────────────────────────
console.log('\n— canMarkMostMeaningful ————————————————————————');
{
    const three = [1, 2, 3].map(id => activity({ id, isMostMeaningful: true }));
    const fourth = activity({ id: 4 });
    ok('a fourth MME is refused', !canMarkMostMeaningful(fourth, [...three, fourth], ApplicationType.AMCAS).ok);
    ok('a third MME is allowed', canMarkMostMeaningful(fourth, [three[0], three[1], fourth], ApplicationType.AMCAS).ok);
    ok('unmarking is always allowed', canMarkMostMeaningful(three[0], [...three, fourth], ApplicationType.AMCAS).ok);
    ok('AACOMAS has no MME designation', !canMarkMostMeaningful(fourth, [fourth], ApplicationType.AACOMAS).ok);
    const anticipated = activity({
        id: 5,
        dateRanges: [{ id: 'a', startDateMonth: 'June', startDateYear: '2027', endDateMonth: 'August', endDateYear: '2027', hours: '100', isAnticipated: true }],
    });
    ok('an anticipated-only experience is refused', !canMarkMostMeaningful(anticipated, [anticipated], ApplicationType.AMCAS).ok);
    const mixed = activity({
        id: 6,
        dateRanges: [
            { id: 'c', startDateMonth: 'January', startDateYear: '2025', endDateMonth: 'May', endDateYear: '2026', hours: '300' },
            { id: 'a', startDateMonth: 'June', startDateYear: '2026', endDateMonth: 'August', endDateYear: '2027', hours: '100', isAnticipated: true },
        ],
    });
    ok('completed hours plus anticipated hours is allowed', canMarkMostMeaningful(mixed, [mixed], ApplicationType.AMCAS).ok);
}

// ── Candidates ──────────────────────────────────────────────────────────────
console.log('\n— candidateNotes ——————————————————————————————');
expectNote('six hours', candidateNotes(activity({ id: 1, dateRanges: [{ id: 'a', startDateMonth: 'March', startDateYear: '2024', endDateMonth: 'October', endDateYear: '2024', hours: '6' }] })), 'thin-hours', true);
expectNote('two hundred hours', candidateNotes(activity({ id: 1 })), 'thin-hours', false);
expectNote('shadowing', candidateNotes(activity({ id: 1, experienceType: 'Physician Shadowing/Clinical Observation' })), 'observing-role', true);
expectNote('clinical volunteering', candidateNotes(activity({ id: 1 })), 'observing-role', false);
expectNote('one month', candidateNotes(activity({ id: 1, dateRanges: [{ id: 'a', startDateMonth: 'June', startDateYear: '2024', endDateMonth: 'July', endDateYear: '2024', hours: '60' }] })), 'short-duration', true);
expectNote('two years', candidateNotes(activity({ id: 1 })), 'short-duration', false);
expectNote('no dates yet', candidateNotes(activity({ id: 1, dateRanges: [{ id: 'a', startDateMonth: '', startDateYear: '', endDateMonth: '', endDateYear: '', hours: '' }] })), 'short-duration', false);
expectNote('no description', candidateNotes(activity({ id: 1, description: '' })), 'no-description', true);

// ── Across the three ────────────────────────────────────────────────────────
console.log('\n— setNotes ————————————————————————————————————');
{
    const four = [1, 2, 3, 4].map(id => activity({ id, isMostMeaningful: true }));
    expectNote('four marked', setNotes(four), 'more-than-three', true);
    expectNote('three marked', setNotes(four.slice(0, 3)), 'more-than-three', false);

    expectNote('none marked across five entries', setNotes([1, 2, 3, 4, 5].map(id => activity({ id }))), 'none-chosen', true);
    expectNote('a single entry needs no MME', setNotes([activity({ id: 1 })]), 'none-chosen', false);

    expectNote('one of three chosen', setNotes([activity({ id: 1, isMostMeaningful: true }), activity({ id: 2 }), activity({ id: 3 })]), 'room-for-more', true);
    expectNote('three chosen', setNotes(four.slice(0, 3)), 'room-for-more', false);

    const nonMedical = (id: number, type: string) => activity({ id, isMostMeaningful: true, experienceType: type });
    expectNote('athletics and hobbies only', setNotes([nonMedical(1, 'Intercollegiate Athletics'), nonMedical(2, 'Hobbies')]), 'none-medical', true);
    expectNote('athletics and clinical', setNotes([nonMedical(1, 'Intercollegiate Athletics'), nonMedical(2, 'Paid Employment - Medical/Clinical')]), 'none-medical', false);

    expectNote('three research entries', setNotes([1, 2, 3].map(id => nonMedical(id, 'Research/Lab'))), 'same-category', true);
    expectNote('research, clinical, teaching', setNotes([nonMedical(1, 'Research/Lab'), nonMedical(2, 'Paid Employment - Medical/Clinical'), nonMedical(3, 'Teaching/Tutoring/Teaching Assistant')]), 'same-category', false);

    expectNote('research, an award and a publication', setNotes([nonMedical(1, 'Research/Lab'), nonMedical(2, 'Honors/Awards/Recognitions'), nonMedical(3, 'Publications')]), 'prestige-picks', true);
    expectNote('research and clinical', setNotes([nonMedical(1, 'Research/Lab'), nonMedical(2, 'Paid Employment - Medical/Clinical')]), 'prestige-picks', false);

    const tagged = (id: number, competencies: string[]) => activity({ id, isMostMeaningful: true, competencies });
    expectNote('same two tags on both', setNotes([tagged(1, ['Teamwork', 'Service Orientation', 'Oral Communication']), tagged(2, ['Teamwork', 'Service Orientation'])]), 'same-competencies', true);
    expectNote('one tag in common', setNotes([tagged(1, ['Teamwork', 'Critical Thinking']), tagged(2, ['Teamwork', 'Service Orientation'])]), 'same-competencies', false);

    const reused = 'watching the translator explain the discharge instructions slowly changed how I listen to families';
    const essayA = `${filler(250)} ${reused} ${filler(200)}`;
    const essayB = `${filler(300)} ${reused} ${filler(150)}`;
    expectNote('a sentence reused across two essays', setNotes([activity({ id: 1, isMostMeaningful: true, mmeEssay: essayA }), activity({ id: 2, isMostMeaningful: true, mmeEssay: essayB })]), 'shared-phrasing', true);
    expectNote('two distinct essays', setNotes([activity({ id: 1, isMostMeaningful: true, mmeEssay: filler(500) }), activity({ id: 2, isMostMeaningful: true, mmeEssay: filler(500) })]), 'shared-phrasing', false);

    const withThroughline = (id: number, throughline: string) => activity({ id, isMostMeaningful: true, mmeWorkshop: { throughline } });
    expectNote('two throughlines about listening to families', setNotes([
        withThroughline(1, 'Listening to frightened families matters more than having answers'),
        withThroughline(2, 'Having answers matters less than listening to frightened families'),
    ]), 'same-throughline', true);
    expectNote('two different throughlines', setNotes([
        withThroughline(1, 'Listening to frightened families matters more than having answers'),
        withThroughline(2, 'A failed assay taught me to document every variable before trusting a result'),
    ]), 'same-throughline', false);

    const ps = "My grandmother's stroke and translating Spanish for her neurologist";
    expectNote('MME retelling the personal statement', setNotes([activity({ id: 1, isMostMeaningful: true, mmeEssay: `When my grandmother had her stroke I spent weeks translating Spanish for her neurologist. ${filler(300)}` })], ps), 'repeats-ps', true);
    expectNote('MME on something else', setNotes([activity({ id: 1, isMostMeaningful: true, mmeEssay: `The assay failed four times before I found the contaminated buffer. ${filler(300)}` })], ps), 'repeats-ps', false);
}

// ── Plan ────────────────────────────────────────────────────────────────────
console.log('\n— planNotes ———————————————————————————————————');
{
    const full: MmeWorkshop = {
        throughline: 'Access depends on whether people can afford to wait',
        notes: {
            moment: 'Saturday at Eastside, a woman named Rosa left after 84 minutes',
            challenge: 'I thought the problem was staffing and I was wrong',
            action: 'Moved vitals before registration and trained four volunteers',
            change: 'I stopped assuming the obvious explanation and watched the line instead',
            forward: 'I will ask what waiting costs a patient before I judge a missed appointment',
        },
    };
    const clean = planNotes(full);
    ok('a complete plan has no gaps', clean.length === 0, `got [${clean.map(n => n.id).join(', ')}]`);
    expectNote('missing throughline', planNotes({ ...full, throughline: '' }), 'no-throughline', true);
    expectNote('empty challenge notes', planNotes({ ...full, notes: { ...full.notes, challenge: '' } }), 'empty-challenge', true);
    expectNote('a moment with no detail', planNotes({ ...full, notes: { ...full.notes, moment: 'it was a hard day at the clinic and it meant a lot to me' } }), 'moment-no-detail', true);
    expectNote('trait list in change notes', planNotes({ ...full, notes: { ...full.notes, change: 'I learned compassion, patience, and resilience' } }), 'change-trait-list', true);
    expectNote('stock line in forward notes', planNotes({ ...full, notes: { ...full.notes, forward: 'it solidified my desire to become a physician' } }), 'forward-stock-line', true);
}

// ── Draft ───────────────────────────────────────────────────────────────────
console.log('\n— draftNotes ——————————————————————————————————');
{
    const scene = 'Rosa waited 84 minutes at Eastside before she left without being seen.';
    const reflect = 'I realized the wait itself was the barrier.';

    expectNote('1,400 characters', draftNotes(`${scene} ${reflect} ${filler(1330)}`), 'over-limit', true);
    expectNote('1,325 characters', draftNotes(`${scene} ${reflect} ${filler(1200)}`.slice(0, 1325)), 'over-limit', false);

    const description = 'Ran Saturday intake at the Eastside free clinic for uninsured patients: vitals, medication history, Spanish interpretation, triage paperwork, and training new volunteers on registration.';
    const retold = 'At the Eastside free clinic I ran Saturday intake for uninsured patients. I took vitals and medication history, handled Spanish interpretation and triage paperwork, and trained new volunteers on registration. ' + filler(300);
    expectNote('essay retelling its description', draftNotes(retold, { description }), 'retells-entry', true);
    expectNote('essay on new ground', draftNotes(`${scene} ${reflect} ${filler(400)}`, { description }), 'retells-entry', false);

    expectNote('"This experience was meaningful because"', draftNotes(`This experience was meaningful because I grew. ${scene} ${filler(300)}`), 'announces-meaning', true);
    expectNote('opens on a scene', draftNotes(`${scene} ${filler(300)}`), 'announces-meaning', false);

    expectNote('a list of virtues', draftNotes(`${scene} Volunteering taught me compassion, patience, and resilience. ${filler(300)}`), 'trait-list', true);
    // Two qualities after "taught me" would be a list, but the sentence names who and where.
    expectNote('qualities tied to a named person and place', draftNotes(`${scene} At Eastside, Rosa taught me patience and humility while she waited. ${filler(300)}`), 'trait-list', false);

    expectNote('"solidified my desire"', draftNotes(`${scene} ${filler(300)} It solidified my desire to become a physician.`), 'stock-closing', true);
    expectNote('a specific closing', draftNotes(`${scene} ${filler(300)} I still ask how long someone waited before I ask why they left.`), 'stock-closing', false);

    expectNote('650 characters with no reflection', draftNotes(`${scene} ${filler(650)}`), 'no-reflection', true);
    expectNote('reflection early', draftNotes(`${scene} ${reflect} ${filler(650)}`), 'no-reflection', false);
    expectNote('reflection only in the last line', draftNotes(`${scene} ${filler(900)} ${reflect}`), 'late-reflection', true);
    expectNote('reflection in the middle', draftNotes(`${scene} ${filler(400)} ${reflect} ${filler(400)}`), 'late-reflection', false);

    expectNote('a first third with nothing concrete', draftNotes(`${filler(500)} ${reflect}`), 'slow-start', true);
    expectNote('a first third with a named person', draftNotes(`${scene} ${filler(500)}`), 'slow-start', false);

    const iHeavy = 'I arrived early. I set up the room. I checked the list. I called the first family in. ' + filler(300);
    expectNote('four of four sentences start with I', draftNotes(iHeavy), 'i-openers', true);
    expectNote('varied openers', draftNotes(`${scene} ${reflect} The list was long. Nobody complained. ${filler(300)}`), 'i-openers', false);

    const passive = `${scene} The forms were completed, the rooms were cleaned, and the families were contacted. ${filler(300)}`;
    expectNote('three passive constructions', draftNotes(passive), 'passive-voice', true);
    expectNote('one passive construction', draftNotes(`${scene} The forms were completed quickly. ${filler(300)}`), 'passive-voice', false);

    expectNote('two stock phrases', draftNotes(`${scene} I had the opportunity to help, which was an invaluable experience. ${filler(300)}`), 'stock-phrasing', true);
    expectNote('one stock phrase', draftNotes(`${scene} I had the opportunity to help. ${filler(300)}`), 'stock-phrasing', false);

    const doctors = 'Dr. Patel explained the scan. The attending asked the residents questions. Another physician joined, and the doctors debated the plan. ' + filler(300);
    expectNote('shadowing essay about the doctors', draftNotes(doctors, { experienceType: 'Physician Shadowing/Clinical Observation' }), 'clinician-centered', true);
    expectNote('same text filed as research', draftNotes(doctors, { experienceType: 'Research/Lab' }), 'clinician-centered', false);
    expectNote('doctors and patients both present', draftNotes(`${doctors} The patient and her family asked about recovery, and the patient's daughter translated.`, { experienceType: 'Physician Shadowing/Clinical Observation' }), 'clinician-centered', false);

    expectNote('500 characters', draftNotes(`${scene} ${reflect} ${filler(400)}`), 'room-left', true);
    expectNote('1,000 characters', draftNotes(`${scene} ${reflect} ${filler(900)}`), 'room-left', false);

    expectNote('under 200 characters says nothing but the limit', draftNotes('This experience was meaningful because I grew.'), 'announces-meaning', false);
}

// ── Final check, legacy fields, progress ───────────────────────────────────
console.log('\n— finalCheck and progress ——————————————————————');
{
    const essay = `Rosa waited 84 minutes at Eastside before she left. I realized the wait itself was the barrier. ${filler(1000)}`;
    const a = activity({ id: 1, isMostMeaningful: true, mmeEssay: essay });
    ok('not ready before the two confirmations', !finalCheck(a, {}).ready);
    ok('ready once confirmed', finalCheck(a, { final: { readAloud: true, tenMinutes: true } }).ready,
        JSON.stringify(finalCheck(a, { final: { readAloud: true, tenMinutes: true } }).items.filter(i => i.status === 'fail' || i.status === 'confirm')));
    ok('never ready over the limit', !finalCheck(activity({ id: 2, mmeEssay: `${essay} ${filler(400)}` }), { final: { readAloud: true, tenMinutes: true } }).ready);
    ok('curly quotes flagged for plain text', finalCheck(activity({ id: 3, mmeEssay: `She said “wait here.” ${filler(1000)}` }), {}).items.some(i => i.id === 'plain-text' && i.status === 'warn'));

    const legacy = withLegacyNotes(activity({ id: 4, mmeAction: 'Stayed after my shift', mmeResult: 'Presence mattered' }));
    ok('legacy action seeds the action notes', legacy.notes?.action === 'Stayed after my shift');
    ok('legacy result seeds the change notes', legacy.notes?.change === 'Presence mattered');
    ok('existing notes are not overwritten', withLegacyNotes(activity({ id: 5, mmeAction: 'old', mmeWorkshop: { notes: { action: 'new' } } })).notes?.action === 'new');
    const mirrored = legacyFieldsFrom({ notes: { action: 'A', change: 'C' } });
    ok('notes mirror back into the legacy fields', mirrored.mmeAction === 'A' && mirrored.mmeResult === 'C');

    const progress = workshopProgress(a, { selfCheck: { notJustImpressive: 'yes' }, throughline: 'Access depends on whether people can afford to wait' });
    ok('progress: choose started, plan done, write done', progress.choose === 'started' && progress.plan === 'done' && progress.write === 'done', JSON.stringify(progress));
}

// ── Corpus ──────────────────────────────────────────────────────────────────
console.log('\n— published MMEs ——————————————————————————————');
{
    const corpus = JSON.parse(readFileSync(new URL('../data/amcas-exemplars.json', import.meta.url), 'utf8'));
    const mmes = corpus.entries.filter((e: any) => e.mme_remarks);
    let strongCautions = 0;
    let strongCount = 0;

    for (const e of mmes) {
        const notes = draftNotes(e.mme_remarks, { description: e.description, experienceType: e.experience_type });
        const loud = notes.filter(n => n.level !== 'note');
        console.log(`        ${e.slug.padEnd(36)} ${e.quality_band.padEnd(15)} ${notes.map(n => `${n.level[0]}:${n.id}`).join(' ') || '-'}`);
        if (e.quality_band === 'exemplar' || e.quality_band === 'solid') {
            strongCount++;
            strongCautions += loud.length;
            ok(`${e.slug}: no blocking note on a strong essay`, !notes.some(n => n.level === 'block'));
        }
    }

    const mean = strongCautions / strongCount;
    ok(`strong essays average at most one caution (got ${mean.toFixed(2)})`, mean <= 1);

    const bySlug = (slug: string) => mmes.find((e: any) => e.slug === slug);
    const neuro = bySlug('clinical-research-internship-neuro');
    const neuroNotes = draftNotes(neuro.mme_remarks, { description: neuro.description, experienceType: neuro.experience_type });
    // A reader scores this one 7/25 on distinctness: it re-tells the ODI-score story its
    // description already told, and it opens "This experience was meaningful because".
    expectNote('neuro internship retells its entry', neuroNotes, 'retells-entry', true);
    expectNote('neuro internship announces its meaning', neuroNotes, 'announces-meaning', true);

    const patientNav = bySlug('patient-navigator-interpreter');
    const navNotes = draftNotes(patientNav.mme_remarks, { description: patientNav.description, experienceType: patientNav.experience_type });
    ok('patient navigator (reader 90/100) gets no caution', navNotes.every(n => n.level === 'note'), `got [${navNotes.map(n => n.id).join(', ')}]`);

    for (const slug of ['vibrant-health-shadowing', 'lawrence-memorial-shadowing']) {
        const e = bySlug(slug);
        const a = activity({
            id: 1, title: e.title, experienceType: e.experience_type, isMostMeaningful: true,
            description: e.description, mmeEssay: e.mme_remarks,
            dateRanges: [{ id: 'r', startDateMonth: '', startDateYear: '', endDateMonth: '', endDateYear: '', hours: String(e.total_hours) }],
        });
        expectNote(`${slug}: six hours as an MME`, candidateNotes(a), 'thin-hours', true);
        expectNote(`${slug}: over 1,325 characters`, draftNotes(e.mme_remarks, { description: e.description }), 'over-limit', true);
    }
}

// ── Review rounds ───────────────────────────────────────────────────────────
console.log('\n— review rounds ———————————————————————————————');
{
    const essay = `Rosa waited 84 minutes at Eastside before she left. I realized the wait itself was the barrier. ${filler(1000)}`;
    const a = activity({ id: 1, isMostMeaningful: true, mmeEssay: essay });
    const round = (over: Partial<MmeReview> = {}): MmeReview => ({
        id: `review-${Math.random()}`,
        createdAt: new Date().toISOString(),
        draft: essay,
        scores: { insight: 15, evidence: 15, distinctness: 20, voice: 18, total: 68 },
        strongest: 'The wait time is concrete.',
        biggestIssue: 'The reflection stops at one line.',
        contentNotes: [{ id: 'content-0', category: 'generic', note: 'Say more about what changed.', question: 'What do you do differently now?' }],
        lineNotes: [{ id: 'line-0', quote: 'Rosa waited 84 minutes at Eastside before she left.', category: 'vague', note: 'Waiting for what?' }],
        throughline: null,
        fromYourNotes: [],
        interviewQuestions: [],
        statuses: {},
        ...over,
    });

    ok('a fresh round leaves both notes open', openReviewNotes(round(), essay).length === 2);
    ok('a note marked done stops counting',
        openReviewNotes(round({ statuses: { 'content-0': 'done' } }), essay).length === 1);
    ok('a note marked disagreed stops counting',
        openReviewNotes(round({ statuses: { 'content-0': 'disagree', 'line-0': 'disagree' } }), essay).length === 0);

    const rewritten = essay.replace('Rosa waited 84 minutes at Eastside before she left.', 'Rosa gave up after an hour and twenty minutes of waiting for a room.');
    ok('a line note whose sentence is gone stops counting', openReviewNotes(round(), rewritten).length === 1);
    ok('a round is stale once the draft changes', isReviewStale(round(), rewritten) && !isReviewStale(round(), essay));

    const six = Array.from({ length: 6 }, (_, i) => round({ id: `r${i}` }));
    let workshop: MmeWorkshop = {};
    for (const r of six) workshop = { ...workshop, reviews: appendReview(workshop, r) };
    ok(`only the last ${MAX_MME_REVIEWS} rounds are kept`,
        workshop.reviews!.length === MAX_MME_REVIEWS && workshop.reviews![MAX_MME_REVIEWS - 1].id === 'r5');
    ok('latestReview returns the most recent', latestReview(workshop)?.id === 'r5');

    const progress = (w: MmeWorkshop) => workshopProgress(a, w, null).review;
    ok('review step is todo with no rounds', progress({}) === 'todo');
    ok('review step is started while notes are open', progress({ reviews: [round()] }) === 'started');
    ok('review step is done when every note is settled',
        progress({ reviews: [round({ statuses: { 'content-0': 'done', 'line-0': 'done' } })] }) === 'done');
    ok('review step is started again after an edit',
        workshopProgress(activity({ id: 2, mmeEssay: rewritten }), { reviews: [round({ statuses: { 'content-0': 'done' } })] }, null).review === 'started');

    const noReview = finalCheck(a, {}).items.find(i => i.id === 'review-notes');
    ok('final check flags a draft that has never been read', noReview?.status === 'warn');
    const settled = finalCheck(a, { reviews: [round({ statuses: { 'content-0': 'done', 'line-0': 'done' } })] }).items.find(i => i.id === 'review-notes');
    ok('final check passes once the round is settled', settled?.status === 'pass', JSON.stringify(settled));
    ok('an unread draft can still be ready, because the read is optional',
        finalCheck(a, { final: { readAloud: true, tenMinutes: true } }).ready);
}

// ── The review filter ───────────────────────────────────────────────────────
console.log('\n— review filter ———————————————————————————————');
{
    const draft = 'Rosa waited 84 minutes at Eastside before she left without being seen. I had run intake for eight months and knew the forms by heart. I realized the wait itself was the barrier.';
    const ownNotes = 'my notes: the woman in bed four kept asking for her daughter';
    const run = (raw: any, ownWriting = ownNotes) => sanitizeReview(raw, { draft, ownWriting });

    const exact = run({ lineNotes: [{ quote: 'knew the forms by heart', category: 'vague', note: 'What did that let you do faster?' }] });
    ok('a quote from the draft is kept', exact.review.lineNotes.length === 1 && exact.review.lineNotes[0].quote === 'knew the forms by heart');

    const loose = run({ lineNotes: [{ quote: 'Rosa   WAITED 84 minutes', category: 'vague', note: 'Say what she was waiting for.' }] });
    ok('a quote matches through case and spacing, and comes back as the draft has it',
        loose.review.lineNotes[0]?.quote === 'Rosa waited 84 minutes', JSON.stringify(loose.review.lineNotes));

    const invented = run({ lineNotes: [{ quote: 'the fluorescent lights hummed above the waiting room', category: 'vague', note: 'Nice scene.' }] });
    ok('a quote that is not in the draft is dropped',
        invented.review.lineNotes.length === 0 && invented.dropped.lineNotesNotInDraft === 1);

    const smuggled = run({
        contentNotes: [{ category: 'no-moment', note: 'Try opening with "The morning I met Rosa I was already behind on vitals" instead.', question: 'Which moment?' }],
    });
    ok('a note carrying wording the applicant never wrote is dropped',
        smuggled.review.contentNotes.length === 0 && smuggled.dropped.suppliedWording === 1,
        JSON.stringify(smuggled.review.contentNotes));

    const quotesDraft = run({
        contentNotes: [{ category: 'no-moment', note: 'You wrote "I had run intake for eight months and knew the forms by heart" and then left it.', question: 'What did that change?' }],
    });
    ok('a note quoting the applicant\'s own draft is kept', quotesDraft.review.contentNotes.length === 1);

    const quotesNotes = run({
        contentNotes: [{ category: 'no-moment', note: 'Your notes say "the woman in bed four kept asking for her daughter" but the draft leaves her out.', question: 'Where did she go?' }],
    });
    ok('a note quoting the applicant\'s own brainstorm notes is kept', quotesNotes.review.contentNotes.length === 1);

    const shortQuote = run({ contentNotes: [{ category: 'cliche', note: 'The phrase "access matters" is doing no work.', question: 'What would you say instead?' }] });
    ok('a short quoted phrase is not treated as supplied wording', shortQuote.review.contentNotes.length === 1);

    const long = run({ strongest: 'x'.repeat(400) });
    ok('long fields are capped', long.review.strongest.length <= REVIEW_CAPS.verdict + 1, String(long.review.strongest.length));

    const many = run({
        contentNotes: Array.from({ length: 9 }, () => ({ category: 'generic', note: 'A note.', question: 'A question?' })),
        interviewQuestions: Array.from({ length: 9 }, (_, i) => `Question ${i}?`),
    });
    ok('lists are capped', many.review.contentNotes.length === REVIEW_CAPS.contentNotes && many.review.interviewQuestions.length === REVIEW_CAPS.interviewQuestions);

    const odd = run({ contentNotes: [{ category: 'nonsense-category', note: 'A note.', question: 'A question?' }], throughline: { lands: 'maybe', note: 'Unclear.' } });
    ok('an unknown category becomes "other"', odd.review.contentNotes[0]?.category === 'other');
    ok('an unknown throughline verdict is dropped', odd.review.throughline === null);

    const junk = sanitizeReview({ strongest: 42, contentNotes: 'nope', lineNotes: [null, 7] } as any, { draft });
    ok('malformed output does not throw and yields nothing usable',
        junk.review.strongest === '' && junk.review.contentNotes.length === 0 && junk.review.lineNotes.length === 0);

    ok('no field in the sanitized review can hold replacement prose',
        !('suggestion' in (junk.review as any)) && !('rewrite' in (junk.review as any)));
}

console.log(failures === 0 ? '\nAll MME coach checks pass.' : `\n${failures} failing check${failures === 1 ? '' : 's'}.`);
process.exit(failures === 0 ? 0 : 1);
