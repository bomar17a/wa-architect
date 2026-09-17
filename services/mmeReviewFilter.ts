import type { MmeContentNote, MmeLineNote, MmeReview } from '../types.ts';

/**
 * Everything a model returns for an MME read passes through here before it is shown or
 * stored.
 *
 * The product promise is that the applicant writes every word of the essay. A model asked
 * for feedback will still drift into supplying wording — "try opening with 'The morning I
 * met Rosa…'" — and one pasted sentence breaks the promise. So:
 *
 *   1. A line note must quote the applicant's own draft. The quote is replaced with the
 *      exact span from the draft, so the UI can find and select it.
 *   2. Any note carrying a quoted run of six or more words that appears in neither the
 *      draft nor the applicant's own notes is dropped. That is what a smuggled sentence
 *      looks like; a quote of their own writing is fine.
 *   3. Lengths are capped, so a note cannot become a paragraph of prose to copy.
 *
 * The edge function repeats rule 1 before returning. This module is the one that decides,
 * and `scripts/audit-mme-coach.ts` is what proves it.
 */

export const REVIEW_CAPS = {
    verdict: 240,
    note: 240,
    question: 200,
    line: 200,
    contentNotes: 3,
    lineNotes: 6,
    fromYourNotes: 2,
    interviewQuestions: 2,
} as const;

/** Six words is long enough to be a usable sentence fragment and short enough to catch one. */
const SMUGGLED_RUN_WORDS = 6;

export const CONTENT_CATEGORIES = [
    'retells-entry', 'lists-traits', 'no-moment', 'generic', 'cliche', 'melodrama',
    'story-over-substance', 'tacked-on-moral', 'forced-link', 'missing-link', 'impact-without-why',
    'too-thin', 'repeats-personal-statement', 'other',
] as const;

export const LINE_CATEGORIES = [
    'vague', 'telling-not-showing', 'cliche', 'passive', 'overstated', 'jargon',
    'clinician-centered', 'repeats-entry', 'cut-to-save-space', 'other',
] as const;

export interface RawReview {
    strongest?: unknown;
    biggestIssue?: unknown;
    contentNotes?: unknown;
    lineNotes?: unknown;
    throughline?: unknown;
    fromYourNotes?: unknown;
    interviewQuestions?: unknown;
    roundChange?: unknown;
}

export interface SanitizeContext {
    /** The draft the read was asked for. */
    draft: string;
    /** The applicant's own brainstorm notes and throughline, which they may be quoted back. */
    ownWriting?: string;
}

export interface SanitizeResult {
    review: Omit<MmeReview, 'id' | 'createdAt' | 'draft' | 'scores' | 'statuses'>;
    /** How many items were dropped, and why. Surfaced in the console, not the UI. */
    dropped: { lineNotesNotInDraft: number; suppliedWording: number };
}

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const normalise = (s: string): string =>
    s.toLowerCase()
        .replace(/[‘’‚‛′]/g, "'")
        .replace(/[“”„‟″]/g, '"')
        .replace(/[–—−]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();

/** Cuts at a word boundary rather than mid-word, and only when actually over. */
const cap = (s: string, limit: number): string => {
    if (s.length <= limit) return s;
    const cut = s.slice(0, limit);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

/**
 * The span of `haystack` matching `quote`, ignoring case, curly quotes and run-together
 * whitespace. Returns the original text so highlighting lands on the real characters.
 */
export function findInDraft(haystack: string, quote: string): string | null {
    const q = normalise(quote);
    if (!q) return null;
    if (haystack.includes(quote.trim())) return quote.trim();

    // Walk the draft once, comparing normalised windows, so "  the   clinic" matches.
    const words = [...haystack.matchAll(/\S+/g)];
    const qWordCount = q.split(' ').length;
    for (let i = 0; i + qWordCount <= words.length; i++) {
        const start = words[i].index!;
        const endWord = words[i + qWordCount - 1];
        const end = endWord.index! + endWord[0].length;
        const span = haystack.slice(start, end);
        if (normalise(span) === q) return span;
    }
    return null;
}

/** Quoted runs of six or more words that appear nowhere in the applicant's own writing. */
function suppliesWording(value: string, ownWriting: string): boolean {
    const quoted = value.match(/[“"']([^“”"']{10,})[”"']/g) || [];
    for (const raw of quoted) {
        const inner = raw.slice(1, -1);
        if (inner.trim().split(/\s+/).length < SMUGGLED_RUN_WORDS) continue;
        if (!normalise(ownWriting).includes(normalise(inner))) return true;
    }
    return false;
}

const pickCategory = (value: unknown, allowed: readonly string[]): string => {
    const v = text(value).toLowerCase();
    return allowed.includes(v) ? v : 'other';
};

/**
 * Turns whatever the model returned into the review the app stores, dropping anything
 * that breaks the rules above. Never throws: a malformed field becomes an empty one.
 */
export function sanitizeReview(raw: RawReview, ctx: SanitizeContext): SanitizeResult {
    const draft = ctx.draft || '';
    const own = `${draft}\n${ctx.ownWriting || ''}`;
    const dropped = { lineNotesNotInDraft: 0, suppliedWording: 0 };

    const clean = (value: unknown, limit: number): string => {
        const v = text(value);
        if (!v) return '';
        if (suppliesWording(v, own)) { dropped.suppliedWording++; return ''; }
        return cap(v, limit);
    };

    const contentNotes: MmeContentNote[] = (Array.isArray(raw.contentNotes) ? raw.contentNotes : [])
        .slice(0, REVIEW_CAPS.contentNotes)
        .map((n: any, i: number) => ({
            id: `content-${i}`,
            category: pickCategory(n?.category, CONTENT_CATEGORIES),
            note: clean(n?.note, REVIEW_CAPS.note),
            question: clean(n?.question, REVIEW_CAPS.question),
        }))
        .filter(n => n.note.length > 0);

    const lineNotes: MmeLineNote[] = (Array.isArray(raw.lineNotes) ? raw.lineNotes : [])
        .slice(0, REVIEW_CAPS.lineNotes)
        .map((n: any, i: number) => {
            const quote = findInDraft(draft, text(n?.quote));
            if (!quote) { dropped.lineNotesNotInDraft++; return null; }
            const note = clean(n?.note, REVIEW_CAPS.line);
            if (!note) return null;
            return {
                id: `line-${i}`,
                quote,
                category: pickCategory(n?.category, LINE_CATEGORIES),
                note,
            };
        })
        .filter((n): n is MmeLineNote => n !== null);

    const landsRaw = text((raw.throughline as any)?.lands).toLowerCase();
    const lands = landsRaw === 'yes' || landsRaw === 'partly' || landsRaw === 'no' ? landsRaw : null;
    const throughlineNote = clean((raw.throughline as any)?.note, REVIEW_CAPS.note);

    const list = (value: unknown, max: number, limit: number): string[] =>
        (Array.isArray(value) ? value : [])
            .slice(0, max)
            .map(v => clean(v, limit))
            .filter(v => v.length > 0);

    return {
        review: {
            strongest: clean(raw.strongest, REVIEW_CAPS.verdict),
            biggestIssue: clean(raw.biggestIssue, REVIEW_CAPS.verdict),
            contentNotes,
            lineNotes,
            throughline: lands ? { lands, note: throughlineNote } : null,
            fromYourNotes: list(raw.fromYourNotes, REVIEW_CAPS.fromYourNotes, REVIEW_CAPS.line),
            interviewQuestions: list(raw.interviewQuestions, REVIEW_CAPS.interviewQuestions, REVIEW_CAPS.line),
            roundChange: clean(raw.roundChange, REVIEW_CAPS.note) || undefined,
        },
        dropped,
    };
}
