import { type Activity, ActivityStatus } from '../types.ts';
import { DESC_LIMITS } from '../constants.ts';
import { mmeOverlapRatio } from './narrativeQualityService.ts';
import { calcDurationMonths } from '../utils/missionFit.ts';

export interface RedFlag {
    id: string;
    title: string;
    message: string;
}

// An MME below this reads as a slot spent on access rather than on meaning. The two
// six-hour single-day MMEs in the exemplar corpus are the reference case.
const MIN_CREDIBLE_MME_HOURS = 25;

// Shared content-word fraction above which the MME is substantially its description
// retold. Calibrated on the corpus: genuine MMEs sit at 3-7%, the clearest rehash at 17%.
const MME_OVERLAP_FLAG = 0.15;

// Matches MissionFitRadar's client-side "Impossible Hours Guard" cap (~80 hrs/week).
const MAX_HOURS_PER_MONTH = 340;

const HANDS_ON_CLINICAL_TYPES = [
    'Paid Employment - Medical/Clinical',
    'Healthcare Experience',
    'Community Service/Volunteer - Medical/Clinical',
];

const CLINICAL_OR_SHADOWING_TYPES = [
    ...HANDS_ON_CLINICAL_TYPES,
    'Physician Shadowing/Clinical Observation',
];

const HIGH_STATUS_TYPES = [
    'Research/Lab', 'Research', 'Publications', 'Presentations/Posters',
    'Honors/Awards/Recognitions', 'Achievements',
];

// Categories that carry no hours on the application. Hours entered against them read as
// padding, and they are easy to leave behind when an entry gets recategorised.
const ZERO_HOUR_TYPES = [
    'Publications',
    'Presentations/Posters',
    'Honors/Awards/Recognitions',
    'Conferences Attended',
    'Achievements',
];

// Hands-on work described inside an entry filed as observation. Deliberately multi-word:
// single verbs like "performed" or "assisted" appear in perfectly honest shadowing entries.
const HANDS_ON_MARKERS = [
    'took vitals', 'taking vitals', 'drew blood', 'drawing blood', 'phlebotomy',
    'started an iv', 'placed an iv', 'administered medication', 'administered vaccines',
    'assisted in surgery', 'assisted with surgery', 'performed cpr', 'ran intake',
    'triaged patients', 'transported patients', 'bathed patients', 'fed patients',
    'i scribed', 'as a scribe', 'charted for', 'sutured',
];

// An entry this far under the limit is usually an entry that ran out of things to say.
const THIN_DESCRIPTION_RATIO = 0.6;

// How many entries must share an opening, or a phrase, before it reads as a pattern.
const REPEAT_THRESHOLD = 3;
// Stock phrases only mean something in company; see the AI Prose rule for why.
const MIN_AI_TELLS = 2;

// Length of the shared content-word run that counts as recycled language. Five content
// words in common across three separate entries is copy-paste, not coincidence.
const SHINGLE_LEN = 5;

// Shadowing is conventionally one entry grouped by type of care. Two is defensible
// (domestic and international, say); three or more is spending slots on one thing.
const MAX_SHADOWING_ENTRIES = 2;

const STOPWORDS = new Set(('a an the and or but if of to in on at for with by from as is are was were be been '
    + 'been being i me my we our you your it its this that these those there here have has had do does did '
    + 'not no so than then when while which who whom what how their they them he she his her also very more '
    + 'most much many some any each other into over under about after before during through').split(' '));

// Common tells of unedited AI-generated prose in personal statements / activity descriptions.
const AI_TELL_PHRASES = [
    'furthermore', 'moreover', 'it is important to note', 'in conclusion',
    "in today's society", 'delve into', 'tapestry', 'testament to',
    'plays a pivotal role', 'plays a crucial role', 'underscores the',
    'in the realm of', 'navigate the complexities', 'a myriad of', 'boasts a',
];

const getActivityHours = (a: Activity): number =>
    a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);

const activityLabel = (a: Activity) => a.title || 'Untitled activity';

const normalisedWords = (text: string): string[] =>
    (text.toLowerCase().match(/[a-z][a-z'-]*/g) || []);

/** First two words of a description, which is where a repeated opening shows itself. */
const openingKey = (text: string): string | null => {
    const w = normalisedWords(text);
    return w.length >= 2 ? `${w[0]} ${w[1]}` : null;
};

/**
 * Runs of SHINGLE_LEN content words, used to spot language moved between entries.
 *
 * Returns match key -> quotable phrase. The key drops stopwords so a lightly
 * reworded sentence still matches; the value is the original contiguous span,
 * stopwords and all, because the message quotes it back at the applicant and a
 * stripped key ("working patients taught empathy matters") is a string they
 * cannot find anywhere in their own writing.
 */
const contentShingles = (text: string): Map<string, string> => {
    const words = normalisedWords(text);
    const contentAt: number[] = [];
    words.forEach((w, i) => {
        if (!STOPWORDS.has(w) && w.length > 2) contentAt.push(i);
    });

    const out = new Map<string, string>();
    for (let i = 0; i + SHINGLE_LEN <= contentAt.length; i++) {
        const window = contentAt.slice(i, i + SHINGLE_LEN);
        const key = window.map(j => words[j]).join(' ');
        if (!out.has(key)) {
            out.set(key, words.slice(window[0], window[SHINGLE_LEN - 1] + 1).join(' '));
        }
    }
    return out;
};

/**
 * Client-side, non-blocking audit of common AdCom red flags.
 * Runs against a full activity list (Dashboard) or a single activity (Editor).
 *
 * Several checks only mean anything across the whole list — a repeated opening, recycled
 * phrasing, shadowing spread over four slots. Called with one activity from the editor
 * they simply do not fire, which is the right answer rather than a missing one.
 */
export function runRedFlagAudit(
    activities: Activity[],
    descLimit: number = DESC_LIMITS.AMCAS,
): RedFlag[] {
    const flags: RedFlag[] = [];
    const filled = activities.filter(a => a.status !== ActivityStatus.EMPTY && a.experienceType);

    // 1. Impossible Hours Guard — surfaced as an actual message, not just a silent score cap.
    filled.forEach(a => {
        const hours = getActivityHours(a);
        const months = Math.max(1, calcDurationMonths(a.dateRanges));
        if (hours > months * MAX_HOURS_PER_MONTH) {
            const perMonth = Math.round(hours / months);
            flags.push({
                id: `hours-${a.id}`,
                title: 'Hours may look implausible',
                message: `"${activityLabel(a)}" reports ${hours} hours over ~${months} month${months === 1 ? '' : 's'} (~${perMonth}/month, well past a full-time course load). AdComs notice entries like this — double-check the total before submitting.`,
            });
        }
    });

    // 2. Shadowing Overload — heavy observation with no hands-on / direct patient care.
    const shadowingHours = filled
        .filter(a => a.experienceType === 'Physician Shadowing/Clinical Observation')
        .reduce((sum, a) => sum + getActivityHours(a), 0);
    const hasHandsOnClinical = filled.some(a => HANDS_ON_CLINICAL_TYPES.includes(a.experienceType));
    if (shadowingHours > 200 && !hasHandsOnClinical) {
        flags.push({
            id: 'shadowing-overload',
            title: 'Shadowing-heavy, no direct patient care',
            message: `You've logged ${shadowingHours} hours of shadowing but no hands-on clinical or medical-volunteering entry. AdComs weight direct patient interaction far more than observation — consider adding a scribing, CNA, EMT, or clinical volunteering role.`,
        });
    }

    // 3. Short-term Pattern — several commitments under 3 months.
    const shortTerm = filled.filter(a => {
        const months = calcDurationMonths(a.dateRanges);
        return months > 0 && months < 3;
    });
    if (shortTerm.length >= 3) {
        flags.push({
            id: 'short-term-pattern',
            title: 'Several very short commitments',
            message: `${shortTerm.length} activities (${shortTerm.map(activityLabel).join(', ')}) each span under 3 months. A pattern of short stints can read as difficulty sustaining long-term responsibility — consider consolidating, extending, or trimming one.`,
        });
    }

    // 4. Clinical Gap — a substantial activity list with no clinical exposure at all.
    const hasClinical = filled.some(a => CLINICAL_OR_SHADOWING_TYPES.includes(a.experienceType));
    if (filled.length >= 8 && !hasClinical) {
        flags.push({
            id: 'clinical-gap',
            title: 'No clinical exposure yet',
            message: `You've filled ${filled.length} activity slots with no clinical, shadowing, or healthcare entry. Every competitive application shows sustained direct or observed patient contact — worth prioritizing before you submit.`,
        });
    }

    // 5. MME Selection Quality — every MME is a prestige/status entry, not a "moment" entry.
    const mmeActivities = filled.filter(a => a.isMostMeaningful);
    const highStatusMmes = mmeActivities.filter(a => HIGH_STATUS_TYPES.includes(a.experienceType));
    if (mmeActivities.length >= 2 && highStatusMmes.length === mmeActivities.length) {
        flags.push({
            id: 'mme-status-bias',
            title: 'MMEs skew toward prestige over meaning',
            message: `All of your Most Meaningful Experiences (${mmeActivities.map(activityLabel).join(', ')}) are research, publication, or award-type entries. MME should mark the moments that changed your perspective, not just your most impressive lines — make sure at least one reflects a genuine personal turning point.`,
        });
    }

    // 6. AI Prose Detector — common unedited-LLM phrases in description / MME essay.
    filled.forEach(a => {
        const text = [a.description, a.mmeEssay].filter(Boolean).join(' ').toLowerCase();
        const hits = AI_TELL_PHRASES.filter(p => text.includes(p));
        // Two, not one. Every phrase on this list is also ordinary English that people
        // write by hand, so a single hit says nothing — "furthermore" alone was enough
        // to tell someone their own lab-bench account looked machine-written. The other
        // cross-entry rules all wait for three occurrences before they say anything.
        //
        // The wording stops short of calling it AI too: the tool cannot tell authorship,
        // only that the phrasing is stock, and being wrongly accused of not writing your
        // own application is a worse outcome than leaving a cliche in.
        if (hits.length >= MIN_AI_TELLS) {
            flags.push({
                id: `ai-prose-${a.id}`,
                title: 'Stock admissions phrasing',
                message: `"${activityLabel(a)}" leans on ${hits.length} phrases that turn up in almost every application (${hits.map(h => `"${h}"`).join(', ')}). They read as filler whoever wrote them — the space is better spent on something only you could say.`,
            });
        }
    });

    // 7. Zero-hour categories carrying hours. Publications, posters, honours and conferences
    // are logged at zero; hours against them are usually a leftover from an earlier category.
    filled.forEach(a => {
        const hours = getActivityHours(a);
        if (hours > 0 && ZERO_HOUR_TYPES.includes(a.experienceType)) {
            flags.push({
                id: `zero-hour-${a.id}`,
                title: 'Hours logged on a zero-hour category',
                message: `"${activityLabel(a)}" is filed as ${a.experienceType} with ${hours} hour${hours === 1 ? '' : 's'}. Publications, presentations, awards and conferences are normally submitted at zero hours — the work behind them belongs in the research or leadership entry it came from. Check this one before you submit.`,
            });
        }
    });

    // 8. Shadowing spread across slots. You get fifteen; one grouped entry covers it.
    const shadowingEntries = filled.filter(a => a.experienceType === 'Physician Shadowing/Clinical Observation');
    if (shadowingEntries.length > MAX_SHADOWING_ENTRIES) {
        flags.push({
            id: 'shadowing-split',
            title: 'Shadowing is spread across several slots',
            message: `${shadowingEntries.length} separate shadowing entries (${shadowingEntries.map(activityLabel).join(', ')}) are using ${shadowingEntries.length} of your 15 slots on one kind of experience. Combining them into a single entry — grouped by primary care, specialty care, and underserved care, each with the physician and setting named — frees ${shadowingEntries.length - 1} slot${shadowingEntries.length - 1 === 1 ? '' : 's'} for something a reader has not seen yet.`,
        });
    }

    // 9. Category mismatch. Hands-on work described inside an observation entry.
    shadowingEntries.forEach(a => {
        const text = (a.description || '').toLowerCase();
        const hits = HANDS_ON_MARKERS.filter(m => text.includes(m));
        if (hits.length > 0) {
            flags.push({
                id: `category-mismatch-${a.id}`,
                title: 'Filed as shadowing, described as hands-on',
                message: `"${activityLabel(a)}" is categorised as Physician Shadowing but describes hands-on work (${hits.map(h => `"${h}"`).join(', ')}). If you did the work, file it as clinical employment or medical volunteering — the hours count for far more there, and a category that does not match the description is the kind of thing a reader stops on.`,
            });
        }
    });

    // 10. Repeated openings. Only visible across the list, never inside one box.
    const openings = new Map<string, Activity[]>();
    filled.forEach(a => {
        const key = a.description ? openingKey(a.description) : null;
        if (!key) return;
        const group = openings.get(key) || [];
        group.push(a);
        openings.set(key, group);
    });
    openings.forEach((group, key) => {
        if (group.length >= REPEAT_THRESHOLD) {
            flags.push({
                id: `repeated-opening-${key.replace(/\s+/g, '-')}`,
                title: 'Several entries open the same way',
                message: `${group.length} entries (${group.map(activityLabel).join(', ')}) start with "${key}...". Read together they blur into one. Lead with the setting, the population, or the problem instead — a different first move in each box is most of what makes fifteen entries feel like fifteen.`,
            });
        }
    });

    // 11. Recycled language. The same reflection, moved between entries.
    const shingleOwners = new Map<string, Set<number>>();
    const shinglePhrase = new Map<string, string>();
    filled.forEach(a => {
        if (!a.description) return;
        contentShingles(a.description).forEach((phrase, key) => {
            const owners = shingleOwners.get(key) || new Set<number>();
            owners.add(a.id);
            shingleOwners.set(key, owners);
            // Quote the first entry's wording; the others are near-identical by
            // definition, and one of them is verbatim what the reader will search for.
            if (!shinglePhrase.has(key)) shinglePhrase.set(key, phrase);
        });
    });
    const recycled = [...shingleOwners.entries()].find(([, owners]) => owners.size >= REPEAT_THRESHOLD);
    if (recycled) {
        const [key, owners] = recycled;
        const phrase = shinglePhrase.get(key) || key;
        const titles = filled.filter(a => owners.has(a.id)).map(activityLabel);
        flags.push({
            id: 'recycled-language',
            title: 'The same phrasing in several entries',
            message: `"${phrase}" runs through ${owners.size} entries (${titles.join(', ')}). Repeating a growth sentence across entries reads as one lesson learned rather than several — different experiences should have taught you different things, in different words.`,
        });
    }

    // 12. Unused characters. The space is free and a thin entry spends it on nothing.
    const thinFloor = Math.round(descLimit * THIN_DESCRIPTION_RATIO);
    // Aggregated into one flag rather than one per entry. Early on, most entries are
    // short drafts, so a per-entry flag put fifteen near-identical warnings in front of
    // the applicant and buried the findings that were actually specific to them.
    const thin = filled
        .map(a => ({ a, len: (a.description || '').trim().length }))
        .filter(({ len }) => len > 0 && len < thinFloor)
        .sort((x, y) => x.len - y.len);

    if (thin.length === 1) {
        const { a, len } = thin[0];
        flags.push({
            id: `thin-description-${a.id}`,
            title: 'Most of the box is still empty',
            message: `"${activityLabel(a)}" uses ${len} of ${descLimit} characters. A reader who was willing to read ${descLimit} reads ${len} as an experience you did not get much from. The room is usually in what changed and what you took from it, not in more duties.`,
        });
    } else if (thin.length > 1) {
        const named = thin.slice(0, 3).map(({ a, len }) => `"${activityLabel(a)}" (${len})`).join(', ');
        const rest = thin.length > 3 ? `, and ${thin.length - 3} more` : '';
        flags.push({
            id: 'thin-description',
            title: `${thin.length} entries are using under ${thinFloor} of ${descLimit} characters`,
            message: `Shortest first: ${named}${rest}. A reader who was willing to read ${descLimit} reads a half-empty box as an experience you did not get much from. The room is usually in what changed and what you took from it, not in more duties.`,
        });
    }

    // 13. MME depth — an MME that mostly re-tells its own description, or that marks a
    // handful of hours as one of only three most meaningful experiences.
    //
    // Both come straight from the exemplar corpus. `clinical-research-internship-neuro`
    // spends most of its 1,325 characters restating the ODI-score story its 700 already
    // told; `vibrant-health-shadowing` and `lawrence-memorial-shadowing` each designate a
    // single six-hour day as Most Meaningful. Neither is detectable inside one text —
    // the first needs both fields compared, the second needs the hours.
    mmeActivities.forEach(a => {
        const hours = getActivityHours(a);
        if (hours > 0 && hours < MIN_CREDIBLE_MME_HOURS) {
            flags.push({
                id: `mme-thin-hours-${a.id}`,
                title: 'A Most Meaningful Experience with very few hours',
                message: `"${activityLabel(a)}" is marked Most Meaningful on ${hours} hour${hours === 1 ? '' : 's'}. You only get three of these, and a reader will ask what it displaced. Keep it if the hours genuinely are not the point — otherwise spend the slot on something you can talk about for ten minutes.`,
            });
        }

        if (a.mmeEssay && a.description) {
            const overlap = mmeOverlapRatio(a.mmeEssay, a.description);
            if (overlap >= MME_OVERLAP_FLAG) {
                flags.push({
                    id: `mme-overlap-${a.id}`,
                    title: 'MME essay repeats its own entry',
                    message: `About ${Math.round(overlap * 100)}% of the MME essay for "${activityLabel(a)}" covers ground its 700-character entry already covers. The extra 1,325 characters are the only place to say what the experience meant — reclaim them for what the entry could not fit.`,
                });
            }
        }
    });

    return flags;
}
