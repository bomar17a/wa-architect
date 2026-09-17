import type { MmeBeat, MmeSelfCheckKey } from '../types.ts';

/**
 * The advice behind the Most Meaningful workshop: the brainstorming questions, the
 * self-check, and the sources each piece of guidance comes from.
 *
 * Rules for this file:
 *   1. Nothing here is text an applicant could paste into an essay. Questions and
 *      guidance only.
 *   2. Only AAMC wording checked against the live page appears in quotation marks.
 *      Advice from consultants and advising offices is paraphrased and credited, so a
 *      source line never puts words in someone's mouth.
 *   3. Sources were checked in September 2026. If a link moves, fix the link rather than
 *      dropping the credit.
 */

export interface CoachSource {
    label: string;
    url: string;
}

export const SOURCES = {
    aamcMme: {
        label: 'AAMC, AMCAS Applicant Guide: Most Meaningful Experiences',
        url: 'https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/most-meaningful-experiences-summary',
    },
    aamcWaGuide: {
        label: 'AAMC, 2027 Work and Activities Guide for Applicants',
        url: 'https://students-residents.aamc.org/media/13376/download',
    },
    aamcAnatomy: {
        label: 'AAMC, Anatomy of an Applicant',
        url: 'https://students-residents.aamc.org/media/10606/download',
    },
    cuBoulder: {
        label: 'CU Boulder Career Services, pre-health advising',
        url: 'https://www.colorado.edu/ceprehealth/media/165',
    },
    northwestern: {
        label: 'Northwestern University Health Professions Advising',
        url: 'https://www.northwestern.edu/health-professions-advising/advising-tools/application/amcas-work-and-activities-secondary-prompts.pdf',
    },
    stanford: {
        label: 'Stanford pre-professional advising, podcast episode 31',
        url: 'https://advising.stanford.edu/beyond-undergrad/graduate-considerations/pre-prof-podcast/episode-31-all-about-amcas-work-and',
    },
    msuLbc: {
        label: 'Michigan State University, Lyman Briggs College advising',
        url: 'https://lbc.msu.edu/sites/default/files/2026-02/Med%20School%20Activities.pdf',
    },
    mededits: {
        label: 'MedEdits (Dr. Jessica Freedman)',
        url: 'https://mededits.com/mededits-blog/blog/amcas-work-and-activities',
    },
    shemmassian: {
        label: 'Shemmassian Academic Consulting',
        url: 'https://www.shemmassianconsulting.com/blog/amcas-work-and-activities',
    },
    bemo: {
        label: 'BeMo Academic Consulting',
        url: 'https://bemoacademicconsulting.com/blog/amcas-most-meaningful-experiences',
    },
    acceptmed: {
        label: 'AcceptMed',
        url: 'https://www.acceptmed.com/blog/why-most-meaningful-activities-shouldnt-just-be-your-most-impressive-ones',
    },
    diprospero: {
        label: 'Lauren DiProspero, former admissions director at Columbia, via College Coach',
        url: 'https://blog.getintocollege.com/blogs/how-to-approach-the-amcas-experiences-section',
    },
    medSchoolInsiders: {
        label: 'Med School Insiders',
        url: 'https://medschoolinsiders.com/pre-med/common-activities-mistakes/',
    },
    sdnAdvisors: {
        label: 'Student Doctor Network, advisors discussing activity stories',
        url: 'https://forums.studentdoctor.net/threads/should-i-include-stories-in-my-activities.1479308/',
    },
} satisfies Record<string, CoachSource>;

/** AMCAS's own guidance for this box, verbatim. */
export const AAMC_MME_GUIDANCE = {
    text: 'When writing your summary, you may want to consider the transformative nature of the experience, the impact you made while engaging in the activity, and the personal growth you experienced because of your participation.',
    source: SOURCES.aamcMme,
};

export interface CoachQuestion {
    text: string;
    source?: CoachSource;
}

export interface BeatGuide {
    beat: MmeBeat;
    label: string;
    purpose: string;
    /** Suggested share of the 1,325 characters. A starting split, not a rule. */
    share: number;
    questions: CoachQuestion[];
}

export const MME_BEATS: BeatGuide[] = [
    {
        beat: 'moment',
        label: 'The moment',
        purpose: 'One scene a reader can picture. Keep it short; your entry already set the scene.',
        share: 0.15,
        questions: [
            { text: 'Pick one day from this experience. Where were you, who was there, and what did someone say?' },
            { text: 'What happened that would have looked ordinary to someone watching, but stayed with you?', source: SOURCES.cuBoulder },
            { text: 'If a friend asked what this was really like, which story would you tell first?' },
        ],
    },
    {
        beat: 'challenge',
        label: 'What made it hard',
        purpose: 'The tension. It gives the reader a reason to care about what you did next.',
        share: 0.15,
        questions: [
            { text: 'What did that moment test in you? A belief you held, a skill you lacked, your patience?' },
            { text: 'What were you unsure how to handle, or worried about getting wrong?' },
            { text: 'Did it push against something you believed? What pulled you the other way?' },
        ],
    },
    {
        beat: 'action',
        label: 'What you did',
        purpose: 'Your part, specifically. Who you talked to and what you changed.',
        share: 0.2,
        questions: [
            { text: 'What did you do next? Be specific about who you spoke to and what you tried.' },
            { text: 'What did you do that someone else in your role might have skipped?' },
            { text: 'Were you trusted with more over time? What could you do at the end that you could not do at the start?' },
        ],
    },
    {
        beat: 'change',
        label: 'What changed in you',
        purpose: 'The largest part. What you understand or do differently now, tied to the moment above.',
        share: 0.4,
        questions: [
            { text: 'Finish the sentence: before this I thought ___. After it, I understood ___.' },
            { text: 'What do you do differently now because of it? Give one example from after it ended.' },
            { text: 'Leave aside what you accomplished. How did the experience change you?', source: SOURCES.acceptmed },
            { text: 'What did you learn about what patients, or the people you served, actually needed?', source: SOURCES.cuBoulder },
        ],
    },
    {
        beat: 'forward',
        label: 'Where it leads',
        purpose: 'A sentence or two on how it carries into medicine. Imply it where you can.',
        share: 0.1,
        questions: [
            { text: 'Where will this show up in the kind of doctor you want to be? Name a situation instead of a trait.' },
            { text: 'Is the link to medicine real here? If it would be a stretch, say what it taught you that matters anyway.', source: SOURCES.sdnAdvisors },
            { text: 'What would an interviewer learn about you from this that nothing else in your application shows?' },
        ],
    },
];

export const BEAT_BY_ID: Record<MmeBeat, BeatGuide> = Object.fromEntries(
    MME_BEATS.map(b => [b.beat, b]),
) as Record<MmeBeat, BeatGuide>;

export interface SelfCheckQuestion {
    key: MmeSelfCheckKey;
    text: string;
    source?: CoachSource;
}

export const SELF_CHECKS: SelfCheckQuestion[] = [
    { key: 'notJustImpressive', text: 'Would this still be on your list if nobody found it impressive?', source: SOURCES.acceptmed },
    { key: 'specificMoment', text: 'Can you name one specific moment from it?' },
    { key: 'changedYou', text: 'Did it change what you believe or how you act?', source: SOURCES.aamcMme },
    { key: 'tenMinutes', text: 'Could you talk about it for ten minutes in an interview?' },
];

export const THROUGHLINE = {
    label: 'Your throughline',
    prompt: 'In one sentence, what should a reader understand about you after this essay that your 700-character entry could not show?',
    hint: 'This stays private. Use it to decide which details from your notes belong in the essay.',
};
