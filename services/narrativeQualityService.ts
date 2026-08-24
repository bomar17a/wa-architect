import { analyzeText } from './staticAnalysisService';

export interface NarrativeQualityScore {
    total: number;             // 0-100
    specificity: number;       // 0-25 — names concrete people/places/roles vs. vague filler
    quantification: number;    // 0-25 — hours, counts, percentages, measurable outcomes
    reflection: number;        // 0-25 — personal growth / perspective-shift language
    voiceAuthenticity: number; // 0-25 — inverse of weak-verb/cliché/passive-voice/AI-tell density
}

const EMPTY_SCORE: NarrativeQualityScore = { total: 0, specificity: 0, quantification: 0, reflection: 0, voiceAuthenticity: 0 };

const VAGUE_PHRASES = [
    'a lot', 'various', 'many things', 'a variety of', 'lots of', 'stuff',
    'several', 'some people', 'a number of', 'in general', 'things',
];

const REFLECTION_KEYWORDS = [
    'learned', 'realized', 'taught me', 'shaped', 'changed how', 'perspective',
    'grew', 'growth', 'reflect', 'reminded me', 'reinforced', 'understand',
    'understood', 'meant to me', 'inspired', 'motivated me', 'opened my eyes',
];

const countMatches = (text: string, terms: string[]): number => {
    const lower = text.toLowerCase();
    return terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
};

/**
 * Deterministic, client-side heuristic — NOT the AI-scored version the improvement doc
 * describes (that needs a new Gemini edge function action; see IMPROVEMENT_NOTES.md).
 * This is deliberately transparent and cheap enough to recompute on every keystroke.
 */
export function scoreNarrativeQuality(text: string): NarrativeQualityScore {
    if (!text || text.trim().length === 0) return { ...EMPTY_SCORE };

    // Specificity: enough length to say something concrete, capitalized-mid-sentence
    // words as a rough "named person/place/role" proxy, penalized for vague filler.
    const lengthScore = Math.min(12, Math.round((text.length / 250) * 12));
    const namedEntityMatches = (text.match(/[a-z][.,!?]?\s+[A-Z][a-zA-Z]+/g) || []).length;
    const concreteBonus = Math.min(13, namedEntityMatches * 3);
    const vaguePenalty = Math.min(10, countMatches(text, VAGUE_PHRASES) * 4);
    const specificity = Math.max(0, Math.min(25, lengthScore + concreteBonus - vaguePenalty));

    // Quantification: hours, patient counts, percentages, or other measured outcomes.
    const numberMatches = (text.match(/\b\d+(\.\d+)?%?\b/g) || []).length;
    const quantification = Math.min(25, numberMatches * 8);

    // Reflection: personal growth / perspective-shift language.
    const reflectionHits = countMatches(text, REFLECTION_KEYWORDS);
    const reflection = Math.min(25, reflectionHits * 9);

    // Voice Authenticity: reuse the existing weak-verb/cliché/passive-voice detector —
    // more issues detected means the draft leans on generic phrasing over a genuine voice.
    const issues = analyzeText(text);
    const weakVerbCount = issues.filter(i => i.type === 'WEAK_VERB').length;
    const clicheCount = issues.filter(i => i.type === 'CLICHE').length;
    const passiveCount = issues.filter(i => i.type === 'PASSIVE').length;
    const voicePenalty = weakVerbCount * 2 + clicheCount * 3 + passiveCount * 2;
    const voiceAuthenticity = Math.max(0, 25 - voicePenalty);

    const total = Math.round(specificity + quantification + reflection + voiceAuthenticity);

    return {
        total: Math.min(100, total),
        specificity: Math.round(specificity),
        quantification: Math.round(quantification),
        reflection: Math.round(reflection),
        voiceAuthenticity: Math.round(voiceAuthenticity),
    };
}

export function narrativeQualityTier(total: number): 'green' | 'amber' | 'red' {
    if (total >= 70) return 'green';
    if (total >= 40) return 'amber';
    return 'red';
}
