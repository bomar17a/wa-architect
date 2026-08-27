/**
 * Every user-facing string on the landing page lives here.
 *
 * Two rules for anything added to this file:
 *   1. Claims must be traceable to code. See IMPROVEMENT_NOTES.md for the ground-truth table.
 *      No admissions-outcome claims, no benchmark claims, no school endorsements.
 *   2. Sample numbers are illustrative and must stay captioned as a sample wherever rendered.
 */

export const HERO = {
    eyebrow: 'AMCAS Work & Activities',
    headline: {
        lead: 'Your GPA and MCAT get you past the filter.',
        emphasis: 'Your activities get you the interview.',
    },
    sub: 'Screens cut the pile by the numbers. Then a person reads your Work & Activities — 15 entries, 700 characters each — and decides whether to meet you.',
    primaryCta: 'Start free',
    primaryCtaNote: 'No card. 15 slots, ready when you are.',
    secondaryCta: 'See how it reads a file',
    capabilities: ['Free', '175 MD programs', 'AMCAS & TMDSAS', 'No card'],
} as const;

export const SAMPLE_CAPTION = 'Sample portfolio. Yours will look different.';

/** Hero + score panel. Mirrors the shape of utils/scoring.tsx output. */
export const SAMPLE_SCORE = {
    score: 72,
    level: 'Competitive',
    pillars: [
        { name: 'Clinical', hours: 180, target: 300 },
        { name: 'Inquiry', hours: 450, target: 100 },
        { name: 'Service', hours: 210, target: 100 },
        { name: 'Teamwork', hours: 120, target: 100 },
    ],
    topGap: 'Shadowing sits at 40 of 50 hours and clinical at 180 of 300. That is the gap to close first.',
} as const;

export const STAKES = {
    heading: 'Where the decision actually gets made',
    beats: [
        {
            title: 'Numbers open the door.',
            body: 'A screen sorts applications by GPA and MCAT before anyone reads a word. Clear it and you are in the pile. Everyone else in that pile cleared it too.',
        },
        {
            title: 'People decide the interview.',
            body: 'Work & Activities is most of what a reader has. Fifteen entries, 700 characters apiece, plus up to three Most Meaningful essays at 1,325 characters. That is the whole picture before you are in the room.',
        },
        {
            title: 'Schools judge against their own mission.',
            body: 'Every school publishes what it says it wants. A record built for a research powerhouse reads differently at a primary-care school. Same activities, different verdict.',
        },
    ],
} as const;

export const SEQUENCE = {
    heading: 'Write this before your personal statement',
    body: [
        'Most applicants draft the statement first, then fit the activities around it. Try the other order.',
        'Your 15 entries are the raw evidence: where the hours actually went, who you kept going back to, what you picked when nobody assigned it. Fill them in and the pattern shows up on its own.',
        'At five entries the tool reads all of them together and tells you what they add up to — the kind of applicant you read as, the strengths carrying the file, and the chapter you have not written. That is the material a personal statement gets built from. Writing it is still your job.',
    ],
    flow: ['15 entries', 'what repeats', 'what you are actually arguing'],
} as const;

export const DEMO = {
    heading: 'See it read a file',
    sub: 'One sample portfolio, four views. Your numbers will be different.',
    tabs: [
        { id: 'score', label: 'Score & gaps' },
        { id: 'rewrite', label: 'Rewrite' },
        { id: 'themes', label: 'Themes' },
        { id: 'fit', label: 'Mission fit' },
    ],
} as const;

export type DemoTabId = (typeof DEMO.tabs)[number]['id'];

export const SCORE_PANEL = {
    intro: 'Readiness runs 0–100 across four pillars: Inquiry, Service, Teamwork, Clinical. Hours and depth drive most of it, plus how much of the AAMC competency list your entries actually evidence. Where it is thin matters more than the number.',
    disclosure: 'These thresholds are our heuristics, not published admissions data. Treat them as a target, not a cutoff.',
} as const;

export const REWRITE_PANEL = {
    intro: 'Four scores per entry: how specific it is, whether there are numbers in it, whether you reflected or only reported, and how much of it is weak verbs and stock phrases.',
    draft: {
        label: 'Draft',
        text: 'I helped patients at the front desk and made sure they were comfortable. I also watched the doctors and nurses work during my shifts.',
        scores: { Specificity: 6, Quantification: 0, Reflection: 4, Voice: 11 },
    },
    revised: {
        label: 'Revised',
        text: 'Ran intake triage for 40–60 patients a shift. Cut average wait from 22 minutes to 19 by taking vitals before registration instead of after. Handed off to three nursing teams at shift change.',
        scores: { Specificity: 21, Quantification: 23, Reflection: 9, Voice: 22 },
    },
    remaining: 'Reflection is still low. The entry says what happened, not what it changed in you. That is the next fix.',
    badgeNote: 'Scored by pattern-matching, instantly. Ask for an AI read and the badge switches from est to AI.',
} as const;

export const THEMES_PANEL = {
    readsAs: 'The Community Healer',
    coreNarrative:
        'Your hours cluster in under-resourced settings, and you keep returning to the same population rather than sampling widely. The file reads as someone who has already chosen where they want to practice.',
    working: [
        '340 hours at one free clinic over two years',
        'Spanish-language intake, used daily rather than listed as a skill',
    ],
    missingChapter:
        'Nothing here shows you working inside a system you did not build. Every entry is direct service. Committee work, quality improvement, or research would show you can change the conditions, not only work within them.',
    disclaimer: 'One advisor’s read, not a verdict.',
} as const;

export const FIT_PANEL = {
    archetype: 'The Advocate',
    archetypeDesc:
        'Social-justice focused schools valuing distance traveled, community service, and health equity.',
    body: '175 MD programs, each with the mission statement the school publishes. Star up to five and every entry you write gets rated against those five.',
    radarNote: 'The dashed line is the archetype target, not an admitted-student average.',
    /** Matches SCHOOL_ARCHETYPES['The Advocate'] targets in MissionFitRadar.tsx. */
    radar: [
        { subject: 'Inquiry', student: 8.2, target: 4 },
        { subject: 'Service', student: 7.4, target: 10 },
        { subject: 'Teamwork', student: 5.1, target: 7 },
        { subject: 'Clinical', student: 6.0, target: 7 },
    ],
} as const;

export const COMPETENCIES = {
    heading: 'The 15 things they are looking for',
    body: 'The AAMC publishes a list of core competencies medical schools screen for. Your entries either give evidence for them or they do not. The matrix shows which are covered and which activity is doing the covering — so you find out that eight entries prove Teamwork and nothing proves Cultural Competence before a reader does.',
    note: 'Tags come from you, with AI suggestions on each draft. Nothing gets inferred behind your back.',
    /** Illustrative coverage for the sample portfolio. */
    covered: [
        'Service Orientation',
        'Social Skills',
        'Cultural Competence',
        'Teamwork',
        'Reliability and Dependability',
        'Critical Thinking',
        'Scientific Inquiry',
        'Living Systems',
        'Human Behavior',
    ],
} as const;

export const RED_FLAGS = {
    heading: 'What quietly sinks a file',
    intro: 'Six checks run on your portfolio as you write. No model, no scoring — rules, applied the same way every time.',
    items: [
        { title: 'Impossible hours', body: 'Your logged hours exceed what the calendar allows. Readers do this math.' },
        { title: 'Shadowing-heavy, no patient care', body: '200+ hours watching, none doing.' },
        { title: 'Short-term pattern', body: 'Three or more commitments under three months reads as box-checking.' },
        { title: 'Clinical gap', body: 'Eight entries in and nothing clinical.' },
        { title: 'Most Meaningful selection', body: 'All three went to the prestigious entries rather than the formative ones.' },
        { title: 'AI-sounding prose', body: 'Flags 15 phrases common in unedited model output. It is a word list, not a detector.' },
    ],
} as const;

export const FEATURES = {
    heading: 'What you get',
    items: [
        { title: 'Four-step writer', body: 'Context, impact, reflection, recognition. Four prompts instead of a blank box.' },
        { title: 'Most Meaningful coach', body: 'Three questions to test whether an entry belongs in your top three, then a builder for the 1,325-character essay.' },
        { title: 'School recommender', body: '175 MD programs ranked against your profile. Filter by state, degree, application system.' },
        { title: 'Export', body: 'AMCAS-safe plain text with smart quotes and markdown stripped. Also .csv, .doc, and print.' },
        { title: 'Interview prep', body: 'Five questions an interviewer could ask about any entry, and why they would ask. Notes are not saved.' },
        { title: 'Resume import', body: 'Upload a PDF or Word file and it drafts the entries. Hours and supervisors you fill in yourself.' },
        { title: 'Red flag audit', body: 'Six checks, running as you write.' },
        { title: 'Countdown', body: 'Days until AMCAS opens, on the cycle you set.' },
    ],
} as const;

export const FAQ = {
    heading: 'Questions',
    items: [
        {
            q: 'How many activities should I list?',
            a: 'Fifteen is the cap. You do not have to fill all fifteen — empty slots beat filler, and a reader spots padding faster than a gap.',
        },
        {
            q: 'What counts as clinical experience?',
            a: 'Direct patient contact — scribing, EMT, CNA, medical assisting. Shadowing is separate and counts for less; this tool weights it at a quarter.',
        },
        {
            q: 'What is a Most Meaningful Experience?',
            a: 'Up to three entries get an extra 1,325 characters. Spend them on what changed you, not on what looks best.',
        },
        {
            q: 'Is it free?',
            a: 'Yes. No card, no trial clock, no locked features. Every AI tool in it works on a free account.',
        },
        {
            q: 'Does it write my essays for me?',
            a: 'No. It scores drafts, rewrites a sentence you select, and builds a Most Meaningful essay from answers you type in. The words stay yours to approve — and interviewers will ask you about them.',
        },
        {
            q: 'Will schools know I used AI?',
            a: 'Nobody can promise you either way; there is no reliable detector. What is true is that AdComs interview on these entries, so a description that does not sound like you surfaces in the room. The tool flags 15 phrases common in unedited model output so you can take them out.',
        },
    ],
} as const;

export const FINAL_CTA = {
    heading: 'Start with one entry.',
    body: 'Put in the activity you are least sure about. See what it scores and why. Five minutes, and it tells you more than another forum thread will.',
    cta: 'Start free',
    note: 'No card. 15 slots, ready when you are.',
} as const;

export const FOOTER = {
    disclaimer: 'Not affiliated with the AAMC, AMCAS, or any medical school.',
    copyright: `© ${new Date().getFullYear()} W&A Architect`,
} as const;
