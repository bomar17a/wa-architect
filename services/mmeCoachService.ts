import { type Activity, type MmeBeat, type MmeWorkshop, ApplicationType } from '../types.ts';
import { MME_LIMIT } from '../constants.ts';
import {
    mmeOverlapRatio, MME_OVERLAP_NOTICE, MEANING_ASSERTIONS, SCENE_MARKERS, REFLECTION_CATEGORIES,
    BOILERPLATE, countPhrases, sentences, distinctProperNouns, quantifyingNumbers, contentWords,
} from './narrativeQualityService.ts';
import {
    AI_TELL_PHRASES, MIN_CREDIBLE_MME_HOURS, HIGH_STATUS_TYPES, getActivityHours, contentShingles,
} from './redFlagService.ts';
import { analyzeText } from './staticAnalysisService.ts';
import { sanitizeForAmcas } from './exportService.ts';
import { calcDurationMonths } from '../utils/missionFit.ts';
import { MME_BEATS, BEAT_BY_ID, SELF_CHECKS, SOURCES, type CoachSource } from './mmeQuestionBank.ts';

/**
 * Rule-based coaching for Most Meaningful Experiences.
 *
 * Everything here returns advice about the applicant's own writing: what was noticed,
 * why a reader cares, and a question to act on. Nothing returns replacement text, and
 * nothing here calls a model. It runs on every keystroke, so it has to stay cheap.
 *
 * The draft checks are tuned against the published MMEs in data/amcas-exemplars.json.
 * `node --experimental-transform-types scripts/audit-mme-coach.ts` is the acceptance
 * test; run it after changing a list or a threshold.
 */

export type CoachLevel = 'block' | 'caution' | 'note';

export interface CoachNote {
    id: string;
    level: CoachLevel;
    title: string;
    body: string;
    question?: string;
    /** Exact text from the applicant's writing the note is about, for highlighting. */
    quote?: string;
    source?: CoachSource;
}

const LEVEL_ORDER: Record<CoachLevel, number> = { block: 0, caution: 1, note: 2 };
const byLevel = (a: CoachNote, b: CoachNote) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];

// ── Thresholds ──────────────────────────────────────────────────────────────

/** Below this an expansion is leaving a third of its space unused. */
export const MME_SHORT_FLOOR = 900;

/** Shorter than this, an experience is hard to present as one of three that changed you. */
const SHORT_DURATION_MONTHS = 3;

/** Where reflection first appears, as a fraction of the essay, before it reads as a moral tacked on. */
const LATE_REFLECTION_AT = 0.8;

const SHADOWING = 'Physician Shadowing/Clinical Observation';

const MEDICINE_TYPES = [
    'Paid Employment - Medical/Clinical',
    'Community Service/Volunteer - Medical/Clinical',
    SHADOWING,
    'Research/Lab',
    'Healthcare Experience',
    'Research',
];

const CLINICAL_TYPES = [
    'Paid Employment - Medical/Clinical',
    'Community Service/Volunteer - Medical/Clinical',
    SHADOWING,
    'Healthcare Experience',
];

// ── Lexicons ────────────────────────────────────────────────────────────────

/**
 * Closing lines that announce a commitment to medicine instead of showing one. Several
 * overlap BOILERPLATE on purpose: here they are the finding, not a voice deduction.
 */
const LOVE_LETTER = [
    'passion for medicine', 'my passion for', 'my calling', 'calling to medicine',
    'solidified my desire', 'solidified my decision', 'solidified my passion',
    'cemented my desire', 'cemented my passion', 'reaffirmed my desire', 'reaffirmed my passion',
    'reaffirmed my decision', 'confirmed my desire', 'confirmed my passion', 'confirmed my decision',
    'fueled my passion', 'ignited my passion', 'sparked my passion', 'deepened my passion',
    'strengthened my desire', 'strengthened my passion', 'strengthened my resolve',
    'only strengthened my', 'further solidified', 'i knew i wanted to be a doctor',
    'i knew i wanted to become a doctor', 'i knew i wanted to become a physician',
    'why i want to become a physician', 'why i want to become a doctor',
    'dream of becoming a doctor', 'dream of becoming a physician', 'the right path for me',
];

/**
 * Qualities applicants list in place of showing them. "Patient" is deliberately absent:
 * it is the most common noun in clinical writing. "Professional" and "responsibility"
 * are left out for the same reason ("healthcare professionals", "my responsibilities").
 */
const TRAIT_TERMS = [
    'compassion', 'compassionate', 'empathy', 'empathetic', 'empathic', 'patience', 'resilience',
    'resilient', 'adaptability', 'adaptable', 'humility', 'humble', 'professionalism', 'maturity',
    'leadership', 'teamwork', 'communication skills', 'dedication', 'perseverance', 'integrity',
    'confidence', 'independence', 'accountability', 'flexibility', 'open-mindedness', 'open-minded',
    'cultural competence', 'cultural humility', 'time management', 'work ethic', 'collaboration',
    'kindness', 'selflessness', 'altruism', 'gratitude', 'determination', 'curiosity',
    'critical thinking', 'problem-solving', 'problem solving',
];

/** Reflection that says something changed. Forward links alone do not count. */
const REFLECTION_TERMS = [
    ...REFLECTION_CATEGORIES.learning,
    ...REFLECTION_CATEGORIES.change,
    ...REFLECTION_CATEGORIES.revision,
    ...REFLECTION_CATEGORIES.transfer,
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const phraseRe = (phrase: string, flags = 'i') => new RegExp(`\\b${escapeRe(phrase)}\\b`, flags);

/** The first phrase from `terms` present in `text`, in the applicant's own casing. */
function firstPhrase(text: string, terms: string[]): string | undefined {
    let best: { index: number; match: string } | undefined;
    for (const t of terms) {
        const m = phraseRe(t).exec(text);
        if (m && (!best || m.index < best.index)) best = { index: m.index, match: m[0] };
    }
    return best?.match;
}

/** Earliest character offset at which any of `terms` appears, or -1. */
function earliestIndex(text: string, terms: string[]): number {
    let earliest = -1;
    for (const t of terms) {
        const m = phraseRe(t).exec(text);
        if (m && (earliest === -1 || m.index < earliest)) earliest = m.index;
    }
    return earliest;
}

const trimmed = (s?: string) => (s || '').trim();

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Concrete detail: a named person or place, a number, a line of speech, or a scene marker. */
function hasConcreteDetail(text: string): boolean {
    if (!text.trim()) return false;
    if (distinctProperNouns(text) > 0) return true;
    if (quantifyingNumbers(text) > 0) return true;
    if (/["“”]/.test(text)) return true;
    return countPhrases(text.toLowerCase(), SCENE_MARKERS) > 0;
}

/** A sentence that lists qualities instead of showing one. */
function traitListSentence(text: string): string | undefined {
    for (const s of sentences(text)) {
        const lower = s.toLowerCase();
        const traits = TRAIT_TERMS.filter(t => phraseRe(t).test(lower));
        const announcesLearning = /\b(learned|learnt|taught me|became more|grew in|developed my|gained)\b/.test(lower);
        const isList = traits.length >= 3 || (traits.length >= 2 && announcesLearning);
        if (isList && quantifyingNumbers(s) === 0 && distinctProperNouns(s) === 0) return s;
    }
    return undefined;
}

/** Share of `probe`'s content words that also appear in `text`. */
function contentCoverage(probe: string, text: string): { share: number; size: number } {
    const p = contentWords(probe);
    if (p.size === 0) return { share: 0, size: 0 };
    const t = contentWords(text);
    let hit = 0;
    for (const w of p) if (t.has(w)) hit++;
    return { share: hit / p.size, size: p.size };
}

const activityLabel = (a: Activity) => a.title?.trim() || 'Untitled activity';

// ── Eligibility ─────────────────────────────────────────────────────────────

/** An experience with only anticipated dates. AMCAS does not allow these as MMEs. */
export function isAnticipatedOnly(activity: Activity): boolean {
    const ranges = activity.dateRanges || [];
    const hasAnticipated = ranges.some(r => r.isAnticipated);
    const hasCompleted = ranges.some(r => !r.isAnticipated && (trimmed(r.startDateYear) || trimmed(r.hours)));
    return hasAnticipated && !hasCompleted;
}

export interface MarkDecision {
    ok: boolean;
    reason?: string;
}

/**
 * Whether `activity` may be marked Most Meaningful. Unmarking is always allowed; the UI
 * is responsible for warning that AMCAS deletes the essay when the designation goes.
 */
export function canMarkMostMeaningful(
    activity: Activity,
    activities: Activity[],
    appType: ApplicationType,
): MarkDecision {
    if (activity.isMostMeaningful) return { ok: true };
    if (appType === ApplicationType.AACOMAS) {
        return { ok: false, reason: 'Most Meaningful is an AMCAS designation. AACOMAS has no equivalent.' };
    }
    if (isAnticipatedOnly(activity)) {
        return { ok: false, reason: 'AMCAS does not allow an anticipated experience to be Most Meaningful. Mark it once you have completed hours.' };
    }
    const others = activities.filter(a => a.id !== activity.id && a.isMostMeaningful).length;
    if (others >= 3) {
        return { ok: false, reason: 'You already have three, which is the AMCAS limit. Unmark one first.' };
    }
    return { ok: true };
}

/** Per-entry notes on whether an experience is a strong Most Meaningful pick. */
export function candidateNotes(activity: Activity): CoachNote[] {
    const notes: CoachNote[] = [];

    if (isAnticipatedOnly(activity)) {
        notes.push({
            id: 'anticipated-only',
            level: 'block',
            title: 'Not eligible yet',
            body: 'AMCAS does not allow an anticipated experience to be Most Meaningful.',
            source: SOURCES.aamcWaGuide,
        });
    }

    if (!trimmed(activity.description)) {
        notes.push({
            id: 'no-description',
            level: 'note',
            title: 'Write the entry first',
            body: 'The expansion is read right after your 700-character description and has to add to it. Draft the description so you know what it already covers.',
        });
    }

    const hours = getActivityHours(activity);
    if (hours > 0 && hours < MIN_CREDIBLE_MME_HOURS) {
        notes.push({
            id: 'thin-hours',
            level: 'caution',
            title: `${plural(hours, 'hour')} behind it`,
            body: 'You get three of these. A reader will ask what a short experience displaced, so it needs a reason the hours do not show.',
            question: 'Is there a longer commitment that changed you as much?',
        });
    }

    if (activity.experienceType === SHADOWING) {
        notes.push({
            id: 'observing-role',
            level: 'caution',
            title: 'An observing role',
            body: 'Advisors steer Most Meaningful picks toward roles where you acted and were responsible for something. Shadowing can still work, but the essay has to be about what you did with what you saw.',
            source: SOURCES.stanford,
        });
    }

    const hasDates = (activity.dateRanges || []).some(r => trimmed(r.startDateYear));
    if (hasDates && !isAnticipatedOnly(activity)) {
        const months = calcDurationMonths(activity.dateRanges.filter(r => !r.isAnticipated));
        if (months < SHORT_DURATION_MONTHS) {
            notes.push({
                id: 'short-duration',
                level: 'caution',
                title: 'A short experience',
                body: 'Admissions readers value commitment sustained over time. Under three months is hard to present as one of your three most meaningful unless something unusual happened in it.',
                source: SOURCES.northwestern,
            });
        }
    }

    return notes.sort(byLevel);
}

// ── Across the three ────────────────────────────────────────────────────────

const isFilled = (a: Activity) => Boolean(trimmed(a.title) || trimmed(a.description));

/** Checks that only mean something across the chosen Most Meaningful entries. */
export function setNotes(activities: Activity[], psSummary?: string | null): CoachNote[] {
    const notes: CoachNote[] = [];
    const filled = activities.filter(isFilled);
    const chosen = filled.filter(a => a.isMostMeaningful);
    const n = chosen.length;

    if (n > 3) {
        notes.push({
            id: 'more-than-three',
            level: 'block',
            title: `${n} marked, three allowed`,
            body: `AMCAS allows up to three Most Meaningful experiences. Unmark ${plural(n - 3, 'entry', 'entries')} before you submit.`,
            source: SOURCES.aamcMme,
        });
    }

    if (n === 0 && filled.length >= 2) {
        notes.push({
            id: 'none-chosen',
            level: 'caution',
            title: 'None chosen yet',
            body: 'AMCAS requires at least one Most Meaningful designation once you have two or more entries.',
            source: SOURCES.aamcMme,
        });
    }

    if (n > 0 && n < 3 && filled.length >= 3) {
        notes.push({
            id: 'room-for-more',
            level: 'note',
            title: `${n} of 3 chosen`,
            body: 'The AAMC’s own applicant guide describes fifteen experiences, "three of which should be listed as your most meaningful." Each slot you leave empty is 1,325 characters you are not using.',
            source: SOURCES.aamcAnatomy,
        });
    }

    if (n >= 2 && !chosen.some(a => MEDICINE_TYPES.includes(a.experienceType))) {
        notes.push({
            id: 'none-medical',
            level: 'caution',
            title: 'None of them is tied to medicine',
            body: 'Most advisors suggest at least one pick from clinical work, research, or patient-facing service. Without one, these essays leave the question of why medicine to the rest of your application.',
            source: SOURCES.shemmassian,
        });
    }

    if (n >= 2 && chosen[0].experienceType && chosen.every(a => a.experienceType === chosen[0].experienceType)) {
        notes.push({
            id: 'same-category',
            level: 'note',
            title: 'All from one category',
            body: `Every pick is filed as ${chosen[0].experienceType}. Essays about the same kind of work tend to show the reader the same side of you.`,
            source: SOURCES.bemo,
        });
    }

    if (n >= 2 && chosen.every(a => HIGH_STATUS_TYPES.includes(a.experienceType))) {
        notes.push({
            id: 'prestige-picks',
            level: 'caution',
            title: 'Picked for prestige?',
            body: 'Every pick is research, an award, a publication, or a presentation. The designation asks what changed you, and that is often a different entry from the most impressive one.',
            source: SOURCES.acceptmed,
        });
    }

    if (n >= 2 && chosen.every(a => (a.competencies || []).length >= 2)) {
        const [first, ...rest] = chosen.map(a => new Set(a.competencies));
        const shared = [...first].filter(c => rest.every(s => s.has(c)));
        if (shared.length >= 2) {
            notes.push({
                id: 'same-competencies',
                level: 'note',
                title: 'The same strengths in each',
                body: `Each pick is tagged ${shared.join(' and ')}. Picks that show different competencies give a reader more of you to go on.`,
                source: SOURCES.msuLbc,
            });
        }
    }

    // Recycled phrasing between the essays themselves.
    const drafted = chosen.filter(a => trimmed(a.mmeEssay).length >= 200);
    if (drafted.length >= 2) {
        const owners = new Map<string, { phrase: string; ids: Set<number> }>();
        for (const a of drafted) {
            contentShingles(a.mmeEssay).forEach((phrase, key) => {
                const entry = owners.get(key) || { phrase, ids: new Set<number>() };
                entry.ids.add(a.id);
                owners.set(key, entry);
            });
        }
        const repeated = [...owners.values()].find(o => o.ids.size >= 2);
        if (repeated) {
            const titles = drafted.filter(a => repeated.ids.has(a.id)).map(activityLabel);
            notes.push({
                id: 'shared-phrasing',
                level: 'caution',
                title: 'The same phrasing in two essays',
                body: `This phrasing appears in the essays for ${titles.join(' and ')}. Different experiences should have taught you different things, in different words.`,
                quote: repeated.phrase,
            });
        }
    }

    // Two throughlines landing on the same lesson.
    const withThroughline = chosen.filter(a => trimmed(a.mmeWorkshop?.throughline).length >= 15);
    outer: for (let i = 0; i < withThroughline.length; i++) {
        for (let j = i + 1; j < withThroughline.length; j++) {
            const a = withThroughline[i];
            const b = withThroughline[j];
            const ta = a.mmeWorkshop!.throughline!;
            const tb = b.mmeWorkshop!.throughline!;
            const shorter = contentWords(ta).size <= contentWords(tb).size ? [ta, tb] : [tb, ta];
            const { share, size } = contentCoverage(shorter[0], shorter[1]);
            if (size >= 4 && share >= 0.6) {
                notes.push({
                    id: 'same-throughline',
                    level: 'note',
                    title: 'Two essays arguing the same thing',
                    body: `The throughlines for ${activityLabel(a)} and ${activityLabel(b)} say nearly the same thing. If both land on one lesson, one of them could show a different side of you.`,
                });
                break outer;
            }
        }
    }

    if (trimmed(psSummary)) {
        for (const a of chosen) {
            const text = `${a.mmeWorkshop?.throughline || ''} ${a.mmeEssay || ''}`;
            const { share, size } = contentCoverage(psSummary!, text);
            if (size >= 4 && share >= 0.6) {
                notes.push({
                    id: `repeats-ps-${a.id}`,
                    level: 'caution',
                    title: 'Close to your personal statement',
                    body: `${activityLabel(a)} covers much of what you said your personal statement is about. Writing about the same activity is fine. Retelling the same scene or lesson gives the reader the same page twice.`,
                    source: SOURCES.medSchoolInsiders,
                });
            }
        }
    }

    return notes.sort(byLevel);
}

// ── Notes and plan ──────────────────────────────────────────────────────────

/** The workshop with notes seeded from the two fields the old panel used. */
export function withLegacyNotes(activity: Activity): MmeWorkshop {
    const workshop = activity.mmeWorkshop || {};
    const notes = { ...(workshop.notes || {}) };
    if (!trimmed(notes.action) && trimmed(activity.mmeAction)) notes.action = activity.mmeAction;
    if (!trimmed(notes.change) && trimmed(activity.mmeResult)) notes.change = activity.mmeResult;
    return { ...workshop, notes };
}

/**
 * The legacy fields, kept in step with the notes. The readiness score and mission-fit
 * keyword scan still read `mmeAction` and `mmeResult`.
 */
export function legacyFieldsFrom(workshop: MmeWorkshop): { mmeAction: string; mmeResult: string } {
    return {
        mmeAction: workshop.notes?.action || '',
        mmeResult: workshop.notes?.change || '',
    };
}

/** Gaps in the brainstorm notes and throughline, before any drafting. */
export function planNotes(workshop: MmeWorkshop): CoachNote[] {
    const notes: CoachNote[] = [];
    const n = workshop.notes || {};

    if (trimmed(workshop.throughline).length < 15) {
        notes.push({
            id: 'no-throughline',
            level: 'note',
            title: 'No throughline yet',
            body: 'Write the one sentence first. It decides which details from your notes belong in the essay and which can stay in your notes.',
        });
    }

    for (const guide of MME_BEATS) {
        if (!trimmed(n[guide.beat])) {
            notes.push({
                id: `empty-${guide.beat}`,
                level: 'note',
                title: `${guide.label}: nothing yet`,
                body: guide.purpose,
                question: guide.questions[0].text,
            });
        }
    }

    const moment = trimmed(n.moment);
    if (moment.length >= 30 && !hasConcreteDetail(moment)) {
        notes.push({
            id: 'moment-no-detail',
            level: 'note',
            title: 'The moment has no detail yet',
            body: 'Nothing in these notes names a person or place, gives a number, or records something someone said. Details like those are what make a scene believable.',
            question: 'Who was there, and what did they say?',
        });
    }

    const traitSentence = traitListSentence(trimmed(n.change));
    if (traitSentence) {
        notes.push({
            id: 'change-trait-list',
            level: 'note',
            title: 'A list of qualities',
            body: 'These notes name qualities you gained. A reader believes each one when a specific moment shows it.',
            question: 'Which moment first showed that quality?',
            quote: traitSentence,
        });
    }

    const loveLetter = firstPhrase(trimmed(n.forward), LOVE_LETTER);
    if (loveLetter) {
        notes.push({
            id: 'forward-stock-line',
            level: 'note',
            title: 'A stock line',
            body: 'Advisors single this line out as a cliché. What would you actually do differently, in a situation you can name?',
            quote: loveLetter,
            source: SOURCES.diprospero,
        });
    }

    return notes;
}

/** Character budget per beat, from the suggested shares. */
export function beatBudgets(limit = MME_LIMIT): Record<MmeBeat, number> {
    return Object.fromEntries(
        MME_BEATS.map(b => [b.beat, Math.round(b.share * limit)]),
    ) as Record<MmeBeat, number>;
}

// ── Draft checks ────────────────────────────────────────────────────────────

export interface DraftContext {
    description?: string;
    experienceType?: string;
    psSummary?: string | null;
}

/**
 * Checks on the essay itself, each tied to a failure advisors and admissions readers
 * name. Returns notes ordered block, caution, note.
 */
export function draftNotes(essay: string, ctx: DraftContext = {}): CoachNote[] {
    const notes: CoachNote[] = [];
    const text = essay || '';
    const clean = text.trim();
    const len = clean.length;
    if (len === 0) return notes;
    const lower = clean.toLowerCase();

    if (len > MME_LIMIT) {
        notes.push({
            id: 'over-limit',
            level: 'block',
            title: 'Over the limit',
            body: `${len.toLocaleString('en-US')} of ${MME_LIMIT.toLocaleString('en-US')} characters. AMCAS will not take the extra ${len - MME_LIMIT}.`,
            question: 'Which sentence tells the reader something they already know?',
        });
    }

    // Everything below needs enough text to say something fair about.
    if (len < 200) return notes.sort(byLevel);

    if (trimmed(ctx.description)) {
        const overlap = mmeOverlapRatio(clean, ctx.description!);
        if (overlap >= MME_OVERLAP_NOTICE) {
            notes.push({
                id: 'retells-entry',
                level: 'caution',
                title: 'Retells your entry',
                body: `About ${Math.round(overlap * 100)}% of this covers ground your 700-character description already covers, and the reader has just read that.`,
                question: 'What happened that the description had no room for?',
                source: SOURCES.diprospero,
            });
        }
    }

    const ss = sentences(clean);
    const opener = ss[0] || '';
    const openerLower = opener.toLowerCase();
    const assertsMeaning = countPhrases(openerLower, MEANING_ASSERTIONS) > 0
        || /\b(this|that) (experience|opportunity) (was|has been|is) (so |truly |extremely |incredibly |very )?(meaningful|special|important|formative|impactful|valuable|memorable|rewarding)\b/.test(openerLower);
    if (assertsMeaning) {
        notes.push({
            id: 'announces-meaning',
            level: 'caution',
            title: 'Opens by announcing the meaning',
            body: 'The first sentence tells the reader this mattered before showing why. Starting inside the moment makes the same point and leaves more room for it.',
            question: 'What was happening in the first minute of the story?',
            quote: opener,
        });
    }

    const traitSentence = traitListSentence(clean);
    if (traitSentence) {
        notes.push({
            id: 'trait-list',
            level: 'caution',
            title: 'Qualities listed, not shown',
            body: 'This sentence names qualities with nothing beside it that shows them. A reader discounts a list of virtues and remembers the scene that proves one.',
            question: 'Which one quality matters most here, and when did you first see it in yourself?',
            quote: traitSentence,
            source: SOURCES.bemo,
        });
    }

    const loveLetter = firstPhrase(clean, LOVE_LETTER);
    if (loveLetter) {
        notes.push({
            id: 'stock-closing',
            level: 'caution',
            title: 'A line readers see constantly',
            body: 'Advisors single this line out as one to cut. It hands the reader a conclusion instead of letting them reach it.',
            question: 'What will you do differently in medicine because of this? Name a situation.',
            quote: loveLetter,
            source: SOURCES.diprospero,
        });
    }

    if (len >= 600) {
        const firstReflection = earliestIndex(clean, REFLECTION_TERMS);
        if (firstReflection === -1) {
            notes.push({
                id: 'no-reflection',
                level: 'caution',
                title: 'No reflection yet',
                body: 'Nothing here says what you understood or do differently now. AMCAS asks specifically about the personal growth you experienced.',
                question: BEAT_BY_ID.change.questions[0].text,
                source: SOURCES.aamcMme,
            });
        } else if (firstReflection / len > LATE_REFLECTION_AT) {
            notes.push({
                id: 'late-reflection',
                level: 'caution',
                title: 'Reflection only at the end',
                body: 'What you took from this arrives in the last lines, which reads like a moral added after the story. Advisors ask for reflection that is part of the account.',
                question: 'Where in the story did your thinking start to change?',
                source: SOURCES.sdnAdvisors,
            });
        }
    }

    if (len >= 400) {
        const firstThird = clean.slice(0, Math.ceil(len / 3));
        if (!hasConcreteDetail(firstThird)) {
            notes.push({
                id: 'slow-start',
                level: 'note',
                title: 'A slow start',
                body: 'The first third names no person or place, has no number, and quotes no one. That is usually setup your 700-character entry already did.',
                question: BEAT_BY_ID.moment.questions[0].text,
                source: SOURCES.cuBoulder,
            });
        }
    }

    if (ss.length >= 4) {
        const iOpeners = ss.filter(s => /^I\b/.test(s)).length;
        if (iOpeners / ss.length >= 0.5) {
            notes.push({
                id: 'i-openers',
                level: 'note',
                title: 'Most sentences start with "I"',
                body: `${iOpeners} of ${ss.length} sentences open with "I". Varying how sentences begin keeps the essay from reading like a list of things you did.`,
                source: SOURCES.diprospero,
            });
        }
    }

    const passive = analyzeText(clean).filter(i => i.type === 'PASSIVE');
    if (passive.length >= 3) {
        notes.push({
            id: 'passive-voice',
            level: 'note',
            title: 'Passive voice',
            body: `${passive.length} phrases like "${passive[0].text}" leave out who acted. In an essay about what you did, you can be the subject.`,
            quote: passive[0].text,
        });
    }

    const stock = [...AI_TELL_PHRASES, ...BOILERPLATE]
        .filter(p => !LOVE_LETTER.some(l => l.includes(p) || p.includes(l)))
        .map(p => {
            const m = phraseRe(p).exec(clean);
            return m ? m[0] : undefined;
        })
        .filter((m): m is string => Boolean(m));
    if (stock.length >= 2) {
        notes.push({
            id: 'stock-phrasing',
            level: 'note',
            title: 'Template phrasing',
            body: `${stock.slice(0, 3).map(s => `"${s}"`).join(', ')} read as stock application language. Plain words you would say out loud sound more like you.`,
            quote: stock[0],
            source: SOURCES.medSchoolInsiders,
        });
    }

    if (ctx.experienceType && CLINICAL_TYPES.includes(ctx.experienceType)) {
        const clinicians = (lower.match(/\b(dr\.?|doctors?|physicians?|surgeons?|attendings?|residents?)\b/g) || []).length;
        const patients = (lower.match(/\b(patients?|famil(y|ies)|caregivers?)\b/g) || []).length;
        if (clinicians >= 3 && clinicians >= 2 * Math.max(patients, 1)) {
            notes.push({
                id: 'clinician-centered',
                level: 'note',
                title: 'More about the doctors than the patients',
                body: 'Most of the people in this essay are clinicians. Advising offices suggest putting what you learned about patients at the center, with observations of doctors secondary.',
                source: SOURCES.cuBoulder,
            });
        }
    }

    if (len < MME_SHORT_FLOOR) {
        notes.push({
            id: 'room-left',
            level: 'note',
            title: `${(MME_LIMIT - len).toLocaleString('en-US')} characters left`,
            body: 'Advisors call writing too little one of the most common ways applicants sell themselves short. The extra space is usually best spent on what changed in you.',
            source: SOURCES.mededits,
        });
    }

    if (trimmed(ctx.psSummary)) {
        const { share, size } = contentCoverage(ctx.psSummary!, clean);
        if (size >= 4 && share >= 0.6) {
            notes.push({
                id: 'repeats-ps',
                level: 'caution',
                title: 'Close to your personal statement',
                body: 'This covers much of what you said your personal statement is about. Writing about the same activity is fine. Retelling the same scene or lesson gives the reader the same page twice.',
                source: SOURCES.medSchoolInsiders,
            });
        }
    }

    return notes.sort(byLevel);
}

// ── Final check ─────────────────────────────────────────────────────────────

export type FinalStatus = 'pass' | 'warn' | 'fail' | 'confirm';

export interface FinalItem {
    id: string;
    label: string;
    status: FinalStatus;
    detail?: string;
}

export interface FinalCheck {
    items: FinalItem[];
    ready: boolean;
    plainText: string;
}

export function finalCheck(activity: Activity, workshop: MmeWorkshop, psSummary?: string | null): FinalCheck {
    const essay = trimmed(activity.mmeEssay);
    const len = essay.length;
    const items: FinalItem[] = [];

    items.push(
        len === 0
            ? { id: 'length', label: 'Essay written', status: 'fail', detail: 'Nothing written yet.' }
            : len > MME_LIMIT
                ? { id: 'length', label: 'Within 1,325 characters', status: 'fail', detail: `${len - MME_LIMIT} over.` }
                : len < MME_SHORT_FLOOR
                    ? { id: 'length', label: 'Within 1,325 characters', status: 'warn', detail: `${len} used. There is room for more.` }
                    : { id: 'length', label: 'Within 1,325 characters', status: 'pass', detail: `${len} used.` },
    );

    const plainText = sanitizeForAmcas(essay);
    items.push(
        plainText !== essay
            ? { id: 'plain-text', label: 'Plain text', status: 'warn', detail: 'Some characters will change when pasted into AMCAS, such as curly quotes or dashes. Check the plain-text version below.' }
            : { id: 'plain-text', label: 'Plain text', status: 'pass' },
    );

    items.push(
        isAnticipatedOnly(activity)
            ? { id: 'eligible', label: 'Eligible to be Most Meaningful', status: 'fail', detail: 'Anticipated experiences cannot be designated.' }
            : { id: 'eligible', label: 'Eligible to be Most Meaningful', status: 'pass' },
    );

    const hours = getActivityHours(activity);
    items.push(
        hours === 0
            ? { id: 'hours', label: 'Hours logged', status: 'warn', detail: 'No hours on this entry yet.' }
            : hours < MIN_CREDIBLE_MME_HOURS
                ? { id: 'hours', label: 'Hours logged', status: 'warn', detail: `${plural(hours, 'hour')}. Be ready to explain why it counts as one of three.` }
                : { id: 'hours', label: 'Hours logged', status: 'pass', detail: `${hours} hours.` },
    );

    const open = draftNotes(essay, { description: activity.description, experienceType: activity.experienceType, psSummary })
        .filter(n => n.level !== 'note');
    items.push(
        open.length > 0
            ? { id: 'open-notes', label: 'Draft notes addressed', status: 'warn', detail: `${plural(open.length, 'note')} still open: ${open.map(o => o.title).join('; ')}.` }
            : { id: 'open-notes', label: 'Draft notes addressed', status: 'pass' },
    );

    items.push({
        id: 'read-aloud',
        label: 'I read it out loud once',
        status: workshop.final?.readAloud ? 'pass' : 'confirm',
    });
    items.push({
        id: 'ten-minutes',
        label: 'I could talk about this for ten minutes in an interview',
        status: workshop.final?.tenMinutes ? 'pass' : 'confirm',
    });

    const ready = !items.some(i => i.status === 'fail' || i.status === 'confirm');
    return { items, ready, plainText };
}

// ── Progress ────────────────────────────────────────────────────────────────

export type WorkshopStep = 'choose' | 'moment' | 'plan' | 'write' | 'final';
export type StepState = 'done' | 'started' | 'todo';

export function workshopProgress(
    activity: Activity,
    workshop: MmeWorkshop,
    psSummary?: string | null,
): Record<WorkshopStep, StepState> {
    const answered = SELF_CHECKS.filter(q => workshop.selfCheck?.[q.key]).length;
    const beatsWithNotes = MME_BEATS.filter(b => trimmed(workshop.notes?.[b.beat]).length >= 15).length;
    const essayLen = trimmed(activity.mmeEssay).length;
    const final = finalCheck(activity, workshop, psSummary);

    return {
        choose: answered === SELF_CHECKS.length ? 'done' : answered > 0 ? 'started' : 'todo',
        moment: beatsWithNotes >= 4 ? 'done' : beatsWithNotes > 0 ? 'started' : 'todo',
        plan: trimmed(workshop.throughline).length >= 15 ? 'done' : 'todo',
        write: essayLen >= MME_SHORT_FLOOR && essayLen <= MME_LIMIT ? 'done' : essayLen > 0 ? 'started' : 'todo',
        final: final.ready ? 'done' : (workshop.final?.readAloud || workshop.final?.tenMinutes) ? 'started' : 'todo',
    };
}
