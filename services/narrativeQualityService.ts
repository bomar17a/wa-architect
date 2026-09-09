import { analyzeText } from './staticAnalysisService.ts';

export interface NarrativeQualityScore {
    total: number;             // 0-100
    specificity: number;       // 0-25 — names concrete people/places/roles vs. vague filler
    quantification: number;    // 0-25 — hours, counts, percentages, measurable outcomes
    reflection: number;        // 0-25 — personal growth / perspective-shift language
    voiceAuthenticity: number; // 0-25 — inverse of padding/boilerplate/monotony density
}

// Deterministic, client-side heuristic. Recomputed on every keystroke, so it must
// stay cheap and explainable — every point it gives or takes has to trace to a word
// or a structure someone can point at.
//
// REWRITTEN in session 10 after the exemplar corpus showed the previous version was
// measuring length and little else. What it used to do, all reproducible:
//   - 20 sentences of contentless filler scored 25/25 specificity, 25/25 voice, 59/100
//     total — beating every real entry in the corpus.
//   - "I saw 1 patient, 2 patients, 3 patients, and 4 patients" scored 25/25
//     quantification, while "a risk well above the established threshold" scored 0.
//   - Error grew as entries got worse: the two weakest anchors were +25 and +31 too high.
//
// It is fitted against 8 hand-scored anchors in data/amcas-exemplars.json and checked
// against 8 more that were scored before this rewrite and withheld during it.
// `node --experimental-transform-types scripts/audit-exemplars.ts` is the acceptance
// test. If you change a weight or a list, run it.
//
// Known and accepted: this is a lexicon, not a model. It cannot tell a true specific
// from a fabricated one, and an applicant who writes to the lexicon can game it. It
// exists to give an honest instant read before the AI score resolves, not to be the
// final word — which is why the UI labels it "est" until the user clicks AI Score.

const EMPTY_SCORE: NarrativeQualityScore = {
    total: 0, specificity: 0, quantification: 0, reflection: 0, voiceAuthenticity: 0,
};

// ── Lexicons ────────────────────────────────────────────────────────────────

/** Hedges and non-answers. Cost specificity directly. */
const VAGUE_PHRASES = [
    'a lot', 'various', 'many things', 'a variety of', 'lots of', 'stuff', 'several',
    'some people', 'a number of', 'in general', 'many aspects', 'numerous', 'multiple',
    'different kinds', 'among others', 'and more', 'etc', 'many other', 'a range of',
    'countless', 'miscellaneous', 'some of the', 'certain',
];

/**
 * Abstraction nouns. Not wrong in themselves — every entry needs a few — but a draft
 * built mostly out of these is describing the shape of an experience rather than the
 * experience. This is the signal that separates `maple-grove-hospital-volunteer`
 * ("wonderful environment", "abilities", "added depth to my experience") from
 * `custom-sneakers`, which has no proper nouns at all and is still concrete.
 */
const ABSTRACTION_NOUNS = [
    'experience', 'experiences', 'skills', 'skillset', 'abilities', 'ability', 'aspects',
    'environment', 'opportunity', 'opportunities', 'knowledge', 'insight', 'insights',
    'growth', 'understanding', 'perspective', 'responsibilities', 'duties', 'tasks',
    'qualities', 'values', 'lessons', 'impact', 'importance', 'process', 'processes',
    'individuals', 'settings', 'situations', 'efforts', 'success', 'efficiency',
];

/**
 * Language that reports a measurement without necessarily printing a numeral.
 *
 * Matched on WORD BOUNDARIES, not substrings. Before that fix "ratio" scored a point
 * inside "collaboration", "weekly" scored a second point inside "biweekly", and
 * "sample"/"samples" both fired on one word — which is how an entry with no numbers
 * at all reached 12/25.
 *
 * Bare frequency adverbs (daily, weekly, monthly) are deliberately absent: "assisted
 * with daily tasks" reports a rhythm, not a measurement.
 */
const MEASUREMENT_TERMS = [
    'statistically significant', 'threshold', 'prevalence', 'distribution', 'baseline',
    'average', 'median', 'rate', 'ratio', 'percentage', 'percent', 'score', 'index',
    'measured', 'measuring', 'increase', 'increased', 'decrease', 'decreased', 'reduced',
    'doubled', 'tripled', 'raised over', 'grew to', 'per week', 'per month', 'per year',
    'metrics', 'survey', 'surveyed', 'sample', 'dataset', 'significant',
];

/**
 * Reflection is scored by BREADTH across categories, not by keyword count. The old
 * version paid 9 points per hit from one flat list, so three uses of "learned" maxed
 * it out and genuine reflection phrased differently scored zero.
 */
const REFLECTION_CATEGORIES: Record<string, string[]> = {
    // Named an actual lesson.
    learning: [
        'i learned', 'i realized', 'i understood', 'i discovered', 'taught me', 'showed me',
        'made me realize', 'i now know', 'i came to see', 'i recognized', 'reminded me',
        'i have learned', 'i noticed', 'i saw that', 'i saw how', 'i could see',
        'illustrated', 'evident to me', 'cemented', 'reinforced', 'opened my eyes',
        'highlights', 'highlighted', 'this taught', 'what i found',
        'instilled in me', 'i have realized', 'i realized how', 'made me appreciate',
        'i appreciated', 'i understand that', 'showed me that', 'i learned from',
    ],
    // Something is different afterwards.
    change: [
        'changed', 'shifted', 'i grew', 'no longer', 'now i', 'became more', 'became less',
        'developed', 'strengthened', 'redefined', 'evolved', 'reaffirmed', 'i began to',
        'grown', 'refined', 'improved my', 'more comfortable', 'pushed me',
        'never wasted', 'i emulated', 'set the standard', 'has taught me', 'teaches me',
        'i have grown', 'formative in',
    ],
    // Stated a prior belief and revised it. The most credible reflection move there is.
    revision: [
        'i thought', 'i assumed', 'i expected', 'initially', 'at first', 'preconception',
        'preconceptions', 'wrong impression', 'i had believed', 'my intent was', 'yet i',
        'i did not understand', 'i could not help', 'surely would', 'rather than wanting',
        'very much the opposite', 'i did not even think', "didn't even think",
        'and yet', 'are also human', 'but it is',
    ],
    // Connected the activity forward to practising medicine.
    forwardLink: [
        'as a physician', 'as a future physician', 'as a doctor', 'future doctor', 'my patients',
        'in medicine', 'practice medicine', 'patient care', 'as a future medical', 'doctors must',
        'physicians must', 'i will strive', 'i hope to', 'i aspire', 'strong physicians',
        'to be a better doctor', 'my own practice', 'i am confident', 'will help me',
        'i will apply', 'lead healthcare', 'in my career', 'guide my career',
    ],
    // Admitted an interior state. Costs the writer something, so it reads as real.
    interiority: [
        'i felt', 'i was uneasy', 'i worried', 'i struggled', 'stunned me', 'i was overwhelmed',
        'i was initially', 'i was nervous', 'i was afraid', 'i was lost', 'my heart',
        'i could only admire', 'i was blown away', 'i doubted', 'i have always wanted',
        'not get emotional', 'i had to struggle', 'control my own', 'i knew that my',
        'considered not pursuing', 'never more evident',
    ],
    // Carried the lesson somewhere the activity itself does not reach. Added after the
    // first rewrite scored `in-house-mechanic` ("other facets of my life") and
    // `x-house-orphanage` ("a person is not their illness") at 4 and 0 against a human
    // 14 and 15 — both generalise, neither uses a learning verb.
    transfer: [
        'facets of my life', 'other areas of', 'beyond the', 'in my own life', 'a person is not',
        'life is not', 'we must', 'the adage', 'more broadly', 'the same way', 'this connects',
        'is essential', 'there can be no', 'not only', 'as well as in',
        'the rest of us', 'best gift', 'until their very last',
    ],
};

/** Stock admissions phrasing. Heaviest voice penalty — it is the sound of a template. */
const BOILERPLATE = [
    'i had the pleasure', 'i had the opportunity', 'i had the wonderful opportunity',
    'i was fortunate', 'i was lucky enough', 'invaluable experience', 'rewarding experience',
    'eye-opening', 'life-changing', 'passion for medicine', 'aspiring physician',
    'well-rounded', 'make a difference', 'give back', 'reaffirmed my', 'solidified my',
    'rewarding in itself', 'added depth', 'this experience taught me a lot',
    'prepared me for medical school', 'set the stage for', 'invigorated my',
    'was able to see', 'allowed me to develop', 'served as an invaluable',
    'resilience of the human spirit', 'first official opportunity', 'wonderful way to',
    'the best start to', 'permanent mark on my heart', 'left a mark on',
    'i really loved', 'was a privilege', 'unique opportunity',
];

/** Intensifiers and evaluation adjectives doing no descriptive work. */
const PADDING = [
    'wonderful', 'amazing', 'incredible', 'incredibly', 'tremendous', 'truly', 'really',
    'very', 'extremely', 'deeply', 'greatly', 'remarkable', 'fantastic', 'awesome',
    'profound', 'immensely', 'so much', 'a great deal', 'absolutely', 'perfect',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Distinct terms present, matched on word boundaries.
 *
 * The boundaries are the whole point. A plain `includes()` scored "ratio" inside
 * "collaboration", "weekly" inside "biweekly", and both "sample" and "samples" on the
 * single word "samples" — three separate false positives that pushed entries with no
 * numbers in them to 12/25 on quantification.
 */
const countPhrases = (lower: string, terms: string[]): number =>
    terms.reduce((n, t) => n + (new RegExp(`\\b${escapeRe(t)}\\b`).test(lower) ? 1 : 0), 0);

/** Total occurrences, not just presence — repetition is the point for padding. */
const countOccurrences = (lower: string, terms: string[]): number =>
    terms.reduce((n, t) => n + (lower.match(new RegExp(`\\b${escapeRe(t)}\\b`, 'g')) || []).length, 0);

const sentences = (text: string): string[] =>
    text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 0);

const words = (text: string): string[] => text.match(/[A-Za-z][A-Za-z'-]*/g) || [];

/**
 * Proper nouns, counted DISTINCTLY and excluding sentence-initial words. The old
 * regex matched every sentence boundary, which is why any multi-sentence draft
 * collected full marks. Distinct also stops an entry that repeats one doctor's name
 * six times from reading as six specifics.
 */
function distinctProperNouns(text: string): number {
    const found = new Set<string>();
    for (const s of sentences(text)) {
        const toks = s.match(/\b[A-Z][a-zA-Z'-]+/g) || [];
        // Drop the first token of the sentence — capitalisation there is grammar, not a name.
        const firstWord = (s.match(/\b[A-Za-z][a-zA-Z'-]*/) || [''])[0];
        for (const t of toks) {
            if (t === firstWord) { continue; }
            if (t === 'I') continue;
            found.add(t.toLowerCase());
        }
    }
    return found.size;
}

/** Acronyms (EKG, CPR, ODI, DNA, IHC, AIDS). Dense, unfakeable domain specificity. */
const distinctAcronyms = (text: string): number =>
    new Set(text.match(/\b[A-Z]{2,6}s?\b/g) || []).size;

/**
 * Numerals that quantify something, with years excluded — "In 2015 I became a CMA"
 * is a date, not a measured outcome. Comma-grouped figures collapse to one number so
 * "$20,000" counts once rather than twice.
 */
function quantifyingNumbers(text: string): number {
    const raw = text.match(/\$?\d[\d,]*(?:\.\d+)?%?/g) || [];
    const kept = new Set<string>();
    for (const r of raw) {
        const bare = r.replace(/[$,%]/g, '');
        const n = Number(bare);
        if (!Number.isFinite(n)) continue;
        // Bare 4-digit years carry no impact information.
        if (!r.includes('%') && !r.includes('$') && Number.isInteger(n) && n >= 1900 && n <= 2099) continue;
        kept.add(bare);
    }
    return kept.size;
}

/**
 * Structural monotony. Uniform sentence length and a stack of sentences all opening
 * "I <verb>" is what separates a competent duty list (`ed-technician`, human 17/25 on
 * voice) from writing with a person audible in it (`custom-sneakers`, 23/25).
 */
/** Coefficient of variation of sentence length. Low means machine-even pacing. */
function sentenceLengthCv(ss: string[]): number {
    const lens = ss.map(s => words(s).length);
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    if (mean <= 0) return 0;
    const sd = Math.sqrt(lens.reduce((a, l) => a + (l - mean) ** 2, 0) / lens.length);
    return sd / mean;
}

function monotonyPenalty(text: string): number {
    const ss = sentences(text);
    if (ss.length < 3) return 0;

    const evenness = sentenceLengthCv(ss) < 0.35 ? 2 : 0;

    const openerShare = ss.filter(s => /^I\b/.test(s)).length / ss.length;
    const repetitive = openerShare >= 0.5 ? 3 : openerShare >= 0.34 ? 1.5 : 0;

    // A 60-word sentence is where `lawrence-memorial-shadowing` buries its content and
    // where `zeta-beta-tau` hides a $75,000 outcome inside a subordinate clause.
    const runOns = ss.filter(s => words(s).length > 45).length;

    return evenness + repetitive + Math.min(4, runOns * 2);
}

/**
 * Positive voice evidence. Without this, any grammatical entry with no detectable
 * tells scored a flat 25/25 — which is how `psychiatric-ward-volunteer` (clean,
 * institutional, human 16) tied with the most distinctive prose in the corpus.
 * A clean-but-plain entry should land near the base and leave the top of the scale
 * for writing with a person audible in it.
 */
function voiceCredit(text: string, lower: string): number {
    const ss = sentences(text);
    let credit = 0;

    // Opens on something other than "I <verb>" — a question, a scene, a claim.
    if (ss.length > 0 && !/^I\b/.test(ss[0])) credit += 1.5;
    if (/\?/.test(text)) credit += 1.5;

    // Admitted an interior state. Hard to fake and rare in weak drafts.
    if (countPhrases(lower, REFLECTION_CATEGORIES.interiority) > 0) credit += 2;

    // Genuinely varied pacing, as opposed to merely not-monotonous.
    if (ss.length >= 4 && sentenceLengthCv(ss) > 0.55) credit += 1.5;

    return Math.min(6, credit);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ── Scoring ─────────────────────────────────────────────────────────────────

export function scoreNarrativeQuality(text: string): NarrativeQualityScore {
    if (!text || text.trim().length === 0) return { ...EMPTY_SCORE };

    const lower = text.toLowerCase();
    const wordCount = words(text).length;
    // Density measures below are per-100-words so a 200-character draft and a
    // 700-character one are judged on the same terms.
    const per100 = (n: number) => (wordCount > 0 ? (n / wordCount) * 100 : 0);

    // — Specificity ————————————————————————————————————————————————
    // A floor that any real attempt clears, then concrete signals up and abstraction
    // down. The floor is deliberately low enough that filler cannot coast on it: the
    // old version handed out 12 of 25 for merely being 250 characters long.
    const lengthFloor = clamp((wordCount / 60) * 7, 0, 7);
    const properCredit = clamp(distinctProperNouns(text) * 1.4, 0, 9);
    const acronymCredit = clamp(distinctAcronyms(text) * 1.6, 0, 4);
    const numeralCredit = clamp(quantifyingNumbers(text) * 1.5, 0, 3);
    // Baseline concreteness every competent sentence earns; abstraction eats into it.
    const proseCredit = 8;
    const abstractionPenalty = clamp(per100(countOccurrences(lower, ABSTRACTION_NOUNS)) * 1.3, 0, 10);
    const vaguePenalty = clamp(countPhrases(lower, VAGUE_PHRASES) * 2.2, 0, 7);

    const specificity = clamp(
        lengthFloor + properCredit + acronymCredit + numeralCredit + proseCredit
        - abstractionPenalty - vaguePenalty,
        0, 25,
    );

    // — Quantification ————————————————————————————————————————————
    // Numerals still count most, but measurement language counts too: "a risk well
    // above the established threshold" is a reported result and used to score zero.
    const numberScore = clamp(quantifyingNumbers(text) * 6, 0, 18);
    const measurementScore = clamp(countPhrases(lower, MEASUREMENT_TERMS) * 3, 0, 14);
    const quantification = clamp(numberScore + measurementScore, 0, 25);

    // — Reflection ————————————————————————————————————————————————
    // Breadth across five categories, with diminishing credit inside each, so one
    // category hammered repeatedly cannot reach the top of the scale.
    let reflection = 0;
    for (const terms of Object.values(REFLECTION_CATEGORIES)) {
        const hits = countPhrases(lower, terms);
        if (hits === 0) continue;
        // 4 for the first hit in a category, 1.5 for each further one, capped at 6.
        reflection += Math.min(6, 4 + (hits - 1) * 1.5);
    }
    reflection = clamp(reflection, 0, 25);

    // — Voice authenticity ————————————————————————————————————————
    // Start clean and subtract what makes prose read as generated or templated.
    const issues = analyzeText(text);
    const weakVerbCount = issues.filter(i => i.type === 'WEAK_VERB').length;
    const clicheCount = issues.filter(i => i.type === 'CLICHE').length;
    const passiveCount = issues.filter(i => i.type === 'PASSIVE').length;

    const boilerplatePenalty = clamp(countPhrases(lower, BOILERPLATE) * 3.5, 0, 12);
    const paddingPenalty = clamp(countOccurrences(lower, PADDING) * 2.2, 0, 9);
    const listPenalty = clamp(weakVerbCount * 1.2 + clicheCount * 2.5 + passiveCount * 1.5, 0, 8);

    // Base 19, not 25. Competent and unremarkable is a 19; the last six points are
    // earned by voiceCredit(), not granted for the absence of mistakes.
    const voiceAuthenticity = clamp(
        19 + voiceCredit(text, lower)
        - boilerplatePenalty - paddingPenalty - listPenalty - monotonyPenalty(text),
        0, 25,
    );

    const round = (n: number) => Math.round(n);
    const parts = {
        specificity: round(specificity),
        quantification: round(quantification),
        reflection: round(reflection),
        voiceAuthenticity: round(voiceAuthenticity),
    };

    return {
        ...parts,
        // Sum the rounded parts so the header total always equals the four bars
        // beneath it. Rounding the sum separately let them disagree by a point.
        total: parts.specificity + parts.quantification + parts.reflection + parts.voiceAuthenticity,
    };
}

export function narrativeQualityTier(total: number): 'green' | 'amber' | 'red' {
    if (total >= 70) return 'green';
    if (total >= 40) return 'amber';
    return 'red';
}

// ── Most Meaningful Experience ──────────────────────────────────────────────
//
// The MME remark gets 1,325 characters, there are only three per application, and
// until now nothing scored it at all — `scoreNarrativeQuality()` was only ever called
// on `description`.
//
// It needs its own rubric rather than the description's. AMCAS asks two things of this
// box: what you learned, and how it prepared you to practise medicine. Quantification
// barely matters. What matters instead, and what the description rubric cannot see:
//
//   DISTINCTNESS. The characteristic MME failure is re-telling the 700-character
//   description in 1,325 characters. `clinical-research-internship-neuro` spends most
//   of its MME restating ODI scores and statistical significance that its description
//   already covered — and both texts look fine in isolation. Only comparing them
//   catches it, which is why this scorer takes the description as a second argument.

export interface MmeQualityScore {
    total: number;         // 0-100
    insight: number;       // 0-25 — a named shift, a revised belief, a link to practising medicine
    evidence: number;      // 0-25 — the scene or detail the insight actually rests on
    distinctness: number;  // 0-25 — new material rather than the description retold
    voice: number;         // 0-25 — same machinery as the description scorer
}

const EMPTY_MME: MmeQualityScore = { total: 0, insight: 0, evidence: 0, distinctness: 0, voice: 0 };

/** Markers that a writer is about to narrate something specific rather than summarise. */
const SCENE_MARKERS = [
    'i remember', 'one instance', 'one such', 'for example', 'for instance', 'that day',
    'one afternoon', 'one morning', 'one night', 'there was a', 'i recall', 'the moment',
    'once, ', 'on one occasion', 'i met', 'a patient named', 'she told me', 'he told me',
    'asked me', 'excerpt from', 'the first time', 'i watched', 'i sat', 'i saw tears',
];

/**
 * Frames that announce meaning instead of demonstrating it. An MME opening "This
 * experience was meaningful because I was able to..." has spent its first sentence
 * on nothing, and it is the single most common MME opener in the corpus.
 */
const MEANING_ASSERTIONS = [
    'this experience was meaningful because', 'this experience was extremely special',
    'was an incredibly gratifying experience', 'has been formative in shaping',
    'this experience taught me', 'was truly memorable', 'this really was a lesson',
    'it was a wonderful look', 'served as an invaluable', 'was invaluable',
];

const normaliseWords = (text: string): string[] =>
    (text.toLowerCase().match(/[a-z0-9']+/g) || []);

const STOPWORDS = new Set(('a an the and or but if of to in on at for with by from as is are was ' +
    'were be been being i my me mine we our us they them their he she his her him it its this that ' +
    'these those not no nor so than then there here what which who whom when where why how all any ' +
    'both each few more most other some such only own same too very can will just should now have ' +
    'has had do does did doing would could may might must about into over under again further once ' +
    'because while during before after above below up down out off also am been').split(' '));

/**
 * Words every entry about a clinical activity will share regardless of what it says.
 * Counting these as overlap would mark every medical MME as a retelling of its own
 * description, which is the metric failing rather than the writing.
 */
const DOMAIN_COMMON = new Set(('patient patients medical medicine physician physicians doctor doctors ' +
    'hospital clinic clinical care experience experiences work working time people person ' +
    'health healthcare students student').split(' '));

const contentWords = (text: string): Set<string> =>
    new Set(normaliseWords(text).filter(w => w.length >= 3 && !STOPWORDS.has(w) && !DOMAIN_COMMON.has(w)));

/**
 * Fraction of the MME's distinctive content words that already appear in the description.
 *
 * The first version of this measured 4-gram containment, on the theory that shared
 * phrasing is the failure. It measured 0-2% for every entry in the corpus — including
 * `clinical-research-internship-neuro`, which a reader scores 7/25 on distinctness
 * because its MME re-tells the ODI-score story the description already told. The
 * retelling is a PARAPHRASE, so no n-gram survives it.
 *
 * Content-word overlap tracks the reader's judgement closely: 17% for that entry,
 * against 3-7% for the MMEs that genuinely open new material. Stopwords and the
 * unavoidable clinical vocabulary are excluded so the signal is topic, not grammar.
 */
function contentOverlap(mme: string, description: string): number {
    const m = contentWords(mme);
    const d = contentWords(description);
    if (m.size === 0 || d.size === 0) return 0;
    let shared = 0;
    for (const w of m) if (d.has(w)) shared++;
    return shared / m.size;
}

/**
 * Fraction of the MME's 4-grams appearing verbatim in the description. Near zero for
 * ordinary paraphrase, so it stays as a separate check for literal copy-paste — a
 * different and worse failure than retelling.
 */
function ngramContainment(mme: string, description: string, n = 4): number {
    const a = normaliseWords(mme);
    const b = normaliseWords(description);
    if (a.length < n || b.length < n) return 0;

    const grams = (ws: string[]) => {
        const s = new Set<string>();
        for (let i = 0; i + n <= ws.length; i++) s.add(ws.slice(i, i + n).join(' '));
        return s;
    };
    const mmeGrams = grams(a);
    const descGrams = grams(b);
    if (mmeGrams.size === 0) return 0;

    let shared = 0;
    for (const g of mmeGrams) if (descGrams.has(g)) shared++;
    return shared / mmeGrams.size;
}

/**
 * Long words that are abstractions rather than specifics. Excluded from the evidence
 * signal: "cerebrospinal" is evidence, "preconceptions" is not, and both are long.
 * Without this list `midland-care-hospice` — which reaches a real conclusion about its
 * caregivers without ever naming one — scored as though it were full of detail.
 */
const ABSTRACT_LONG = new Set(('individuals individual environment environments professional ' +
    'professionals preconceptions preconception understanding importance opportunity opportunities ' +
    'responsibility responsibilities relationship relationships appreciation dedication commitment ' +
    'perspective perspectives information communication communications interaction interactions ' +
    'participation implementation development organization organizations situation situations ' +
    'education knowledge community communities everything something incredibly extremely ' +
    'tremendously significantly successfully effectively continuously immediately additionally ' +
    'furthermore experiences challenging rewarding meaningful memorable wonderful').split(' '));

/**
 * Distinct precise vocabulary — long words that are not abstractions. In this domain
 * that reliably picks up the clinical and technical nouns an applicant only writes if
 * they were actually present: kyphoplasties, cerebrospinal, monocytes, tachycardia.
 */
function technicalVocabulary(text: string): number {
    const seen = new Set<string>();
    for (const w of normaliseWords(text)) {
        if (w.length < 9) continue;
        if (ABSTRACT_LONG.has(w) || ABSTRACTION_NOUNS.includes(w)) continue;
        seen.add(w);
    }
    return seen.size;
}

/**
 * Scores one Most Meaningful Experience remark.
 *
 * `description` is the same activity's 700-character entry. Pass it whenever it exists
 * — without it `distinctness` cannot be measured and is reported at its neutral value,
 * which is the honest answer rather than a guess.
 */
export function scoreMmeQuality(mme: string, description = ''): MmeQualityScore {
    if (!mme || mme.trim().length === 0) return { ...EMPTY_MME };

    const lower = mme.toLowerCase();
    const wordCount = words(mme).length;
    const per100 = (n: number) => (wordCount > 0 ? (n / wordCount) * 100 : 0);

    // — Insight ————————————————————————————————————————————————————
    // Same category-breadth idea as the description scorer, awarded more per category:
    // 1,325 characters of reflection that touches only one category is thin, and the
    // ceiling should be reachable by an essay that genuinely does the work.
    // Diminishing returns on breadth. Flat per-category credit got it wrong at both
    // ends: remarks touching five or six categories saturated at 25 where a reader
    // gives 20, and a narrow but deep one was scored as shallow — `patient-navigator-
    // interpreter` lands its whole insight ("doctors are also human beings, afraid of
    // failures like the rest of us") inside two categories and reads 21/25.
    const CATEGORY_LADDER = [4.5, 3.5, 2.8, 2.2, 1.6, 1.2];
    let categoriesHit = 0;
    let totalHits = 0;
    for (const terms of Object.values(REFLECTION_CATEGORIES)) {
        const hits = countPhrases(lower, terms);
        if (hits === 0) continue;
        categoriesHit++;
        totalHits += hits;
    }
    // Any remark that reflects at all starts above zero; the question is how far it goes.
    let earned = 5;
    for (let i = 0; i < categoriesHit; i++) earned += CATEGORY_LADDER[i] ?? 1;
    earned += Math.min(4, (totalHits - categoriesHit) * 0.8);

    // Asserting meaning is not showing it, and it crowds out the characters that would.
    // Capped at half of what was earned, because a stock frame dilutes real reflection
    // sitting next to it rather than deleting it. At a flat 3 points a hit this scored
    // `clinical-research-internship-neuro` 1/25 against a reader's 9, purely for opening
    // "This experience was meaningful because".
    const assertionPenalty = Math.min(countPhrases(lower, MEANING_ASSERTIONS) * 2, earned * 0.5, 6);
    const insight = clamp(earned - assertionPenalty, 0, 25);

    // — Evidence ———————————————————————————————————————————————————
    // What the insight rests on. A remark can be full of realisations and still have
    // nothing underneath them — `midland-care-hospice` reaches a genuine conclusion
    // about its caregivers without ever naming one of them.
    // Proper nouns carry far less of this than they do in a description: the most
    // concrete passage in the corpus — a pineal tumour obstructing the circulation of
    // cerebrospinal fluid — contains none at all. Precise vocabulary does the work.
    const sceneCredit = clamp(countPhrases(lower, SCENE_MARKERS) * 3.2, 0, 9);
    const technicalCredit = clamp(technicalVocabulary(mme) * 0.9, 0, 9);
    const properCredit = clamp(distinctProperNouns(mme) * 0.8, 0, 5);
    const acronymCredit = clamp(distinctAcronyms(mme) * 1.2, 0, 3);
    const numeralCredit = clamp(quantifyingNumbers(mme) * 1.3, 0, 3);
    const abstractionPenalty = clamp(per100(countOccurrences(lower, ABSTRACTION_NOUNS)) * 1.4, 0, 9);
    const evidence = clamp(
        8 + sceneCredit + technicalCredit + properCredit + acronymCredit + numeralCredit
        - abstractionPenalty,
        0, 25,
    );

    // — Distinctness ———————————————————————————————————————————————
    // Neutral 18 when there is no description to compare against: reporting a
    // confident 25 for an unmeasurable dimension would be a lie in the user's favour.
    let distinctness: number;
    if (!description || description.trim().length === 0) {
        distinctness = 18;
    } else {
        // Below 5% shared content vocabulary is normal for two texts about one
        // activity. At ~18% the remark is substantially a retelling — that is where
        // the corpus's clearest rehash sits, against 3-7% for the ones that open new
        // material.
        const excess = clamp((contentOverlap(mme, description) - 0.05) / 0.13, 0, 1);
        // Verbatim reuse on top of that is a separate, worse failure.
        const copied = ngramContainment(mme, description) > 0.10 ? 4 : 0;
        distinctness = clamp(25 - excess * 18 - copied, 0, 25);
    }

    // — Voice ——————————————————————————————————————————————————————
    // Identical machinery to the description scorer. The tells do not change because
    // the box is bigger.
    const issues = analyzeText(mme);
    const weakVerbCount = issues.filter(i => i.type === 'WEAK_VERB').length;
    const clicheCount = issues.filter(i => i.type === 'CLICHE').length;
    const passiveCount = issues.filter(i => i.type === 'PASSIVE').length;

    const boilerplatePenalty = clamp(countPhrases(lower, BOILERPLATE) * 3.2, 0, 13);
    const paddingPenalty = clamp(countOccurrences(lower, PADDING) * 1.9, 0, 10);
    const listPenalty = clamp(weakVerbCount * 0.9 + clicheCount * 2.2 + passiveCount * 1.1, 0, 8);

    const voice = clamp(
        19 + voiceCredit(mme, lower)
        - boilerplatePenalty - paddingPenalty - listPenalty - monotonyPenalty(mme),
        0, 25,
    );

    const round = (n: number) => Math.round(n);
    const parts = {
        insight: round(insight),
        evidence: round(evidence),
        distinctness: round(distinctness),
        voice: round(voice),
    };
    return { ...parts, total: parts.insight + parts.evidence + parts.distinctness + parts.voice };
}

/**
 * How much of the MME is the description retold, 0-1. Exported so the UI can say
 * "38% of this repeats your description" rather than only showing a lowered bar —
 * the number is the actionable part.
 */
export function mmeOverlapRatio(mme: string, description: string): number {
    if (!mme || !description) return 0;
    return contentOverlap(mme, description);
}
