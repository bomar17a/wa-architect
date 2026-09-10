/**
 * Every user-facing string on the landing page lives here.
 *
 * Two rules for anything added to this file:
 *   1. Claims must be traceable to code. See IMPROVEMENT_NOTES.md for the ground-truth table.
 *      No admissions-outcome claims, no benchmark claims, no school endorsements.
 *   2. Sample numbers are illustrative and must stay captioned as a sample wherever rendered.
 *
 * Structural facts about the application itself — 15 entries, 700 characters, three Most
 * Meaningful expansions at 1,325, 600 characters for AACOMAS — are rules of the form and
 * are encoded in constants.ts. Those are safe to state.
 */

import { MME_LIMIT, MAX_ACTIVITIES } from '../../constants';

/** Derived from constants.ts so the marketing numbers cannot drift from the editor's. */
export const MME_LIMIT_LABEL = `${MME_LIMIT.toLocaleString('en-US')} characters, three times, out of ${MAX_ACTIVITIES} slots`;

export const HERO = {
    eyebrow: 'AMCAS Work & Activities',
    headline: {
        lead: 'Nobody is asking for your resume.',
        emphasis: 'They are asking for evidence.',
    },
    sub: 'Fifteen entries, 700 characters each. Your numbers clear the screen — these are what a person reads before deciding whether to meet you.',
    primaryCta: 'Start free',
    primaryCtaNote: 'No card. 15 slots, ready when you are.',
    secondaryCta: 'See it read an entry',
    capabilities: ['Free', '175 MD programs', 'AMCAS & AACOMAS', 'No card'],
} as const;

export const SAMPLE_CAPTION = 'Sample portfolio. Yours will look different.';

/**
 * The hero's annotated entry. Character counts are computed from these strings at render
 * time rather than hardcoded, so they cannot drift from the text they describe.
 */
export const ANNOTATED_ENTRY = {
    label: 'One entry, marked up',
    activity: 'Intake Volunteer · Eastside Free Clinic',
    blocks: [
        {
            id: 'context',
            role: 'Context',
            sentences: '2 sentences',
            text: 'Saturday clinic on the east side, uninsured patients, no appointments. I ran intake — vitals, history, and the paperwork nobody else had time for.',
        },
        {
            id: 'impact',
            role: 'Impact',
            sentences: '3 sentences',
            text: 'Waits ran past two hours because vitals happened after registration rather than before it. I flipped the order, trained four volunteers on the new sequence, and the average wait fell from 84 minutes to 61 over the spring. Two of them run the shift now without me there.',
        },
        {
            id: 'reflection',
            role: 'Reflection',
            sentences: '3 sentences',
            text: 'I had assumed the bottleneck was staffing. It was sequence. Watching a woman give up and leave before she was seen taught me that access is not only whether a clinic is open on a Saturday, but whether a person can afford to wait for it.',
        },
    ],
    footnote: 'The version most people write gives four fifths of the box to the first block. The reader already knows what intake is.',
} as const;

export const STAKES = {
    eyebrow: 'What is actually being decided',
    heading: 'The questions a reader is asking while they skim',
    intro: 'No rubric, no scorecard. Someone reads fifteen boxes and forms an impression, and these are the questions running underneath it.',
    questions: [
        'Can I trust this person around patients?',
        'Is the service real, or assembled for this application?',
        'Do they take feedback, and lead when it matters?',
        'Do they reflect, or only report?',
        'Does the same reason keep showing up across four years?',
        'Would I want them on my team in July?',
    ],
    beats: [
        {
            title: 'Numbers open the door.',
            body: 'A screen sorts by GPA and MCAT before anyone reads a word. Clear it and you are in the pile. Everyone else in that pile cleared it too.',
        },
        {
            title: 'People decide the interview.',
            body: 'Fifteen entries at 700 characters, plus up to three Most Meaningful expansions at 1,325. That is the whole picture before you are in the room.',
        },
        {
            title: 'Each school reads against its own mission.',
            body: 'A record built for a research powerhouse reads differently at a primary-care school. Same activities, different verdict.',
        },
    ],
} as const;

export const SEQUENCE = {
    eyebrow: 'Order of operations',
    heading: 'Write this before your personal statement',
    body: [
        'Most applicants draft the statement first, then fit the activities around it. Try the other order.',
        'Your 15 entries are the raw evidence: where the hours actually went, who you kept going back to, what you picked when nobody assigned it. Fill them in and the pattern shows up on its own.',
        'At five entries the tool reads all of them together and tells you what they add up to — the kind of applicant you read as, the strengths carrying the file, and the chapter you have not written. That is the material a personal statement gets built from. Writing it is still your job.',
    ],
    flow: ['15 entries', 'what repeats', 'what you are actually arguing'],
} as const;

export const ANATOMY = {
    eyebrow: 'The shape of a good entry',
    heading: 'Most drafts spend their characters in the wrong place',
    intro: 'The usual entry gives four fifths of the box to duties — the title, the responsibilities, the shift. A reader already knows what a medical assistant does. What they cannot guess is what changed because you were the one doing it.',
    model: [
        {
            role: 'Context',
            budget: '2 sentences',
            body: 'The setting, your position, who you served. Name the place first, so the reader knows where they are standing.',
        },
        {
            role: 'Impact',
            budget: '3 sentences',
            body: 'A problem you noticed, what you did about it, what moved. This is where the numbers go.',
        },
        {
            role: 'Reflection',
            budget: '3 sentences',
            body: 'What you understood afterward that you did not before. One honest line only you could have written beats a paragraph of competency vocabulary.',
        },
    ],
    notes: [
        {
            title: 'A 400-character entry is not concise.',
            body: 'It usually means there was not much to say. Fill the box, then cut until every line earns its space.',
        },
        {
            title: 'Fifteen entries that open the same way read as one.',
            body: 'If every box starts with "As a" or "I worked as," the repetition flattens all of them — and it is only visible from above, which is where the audit looks.',
        },
    ],
    appNote: 'The wizard writes to this shape one block at a time and shows you the split as you type.',
} as const;

export const DEMO = {
    eyebrow: 'The product',
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
    /** Matches SCHOOL_ARCHETYPES['The Advocate'] targets in utils/missionFit.ts. */
    radar: [
        { subject: 'Inquiry', student: 6.1, target: 4.5 },
        { subject: 'Service', student: 7.4, target: 9 },
        { subject: 'Teamwork', student: 5.1, target: 7 },
        { subject: 'Clinical', student: 6.0, target: 7 },
    ],
} as const;

export const MOST_MEANINGFUL = {
    eyebrow: 'The three that carry the most',
    heading: 'The 1,325 characters most applicants hand back',
    intro: 'Three of your entries can carry an expansion. The common mistake is retelling the description in longer sentences — the committee read that paragraph thirty seconds ago. The expansion is new ground.',
    beats: [
        { letter: 'H', role: 'Hook', body: 'Open inside a moment. A patient, a failed run, a sentence someone said that you are still carrying.' },
        { letter: 'C', role: 'Challenge', body: 'What made it hard. The tension is the reason this entry is worth 1,325 characters.' },
        { letter: 'A', role: 'Action', body: 'What you did, specifically. Who you called, what you built, what you changed.' },
        { letter: 'R', role: 'Reflection', body: 'What you understood afterward that you could not have learned another way.' },
        { letter: 'T', role: 'Tie forward', body: 'How it shows up in the doctor you are becoming. The strongest ones imply it rather than announce it.' },
    ],
    scorerNote: 'The scorer reads your expansion against its own entry and rates what is new in it. Retelling the description comes back as a low distinctness score, which is the point.',
    unusedNote: 'Use all three. An empty slot is 1,325 characters of argument you decided not to make.',
} as const;

export const COMPETENCIES = {
    eyebrow: 'Coverage',
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
    eyebrow: 'The audit',
    heading: 'What quietly sinks a file',
    intro: 'Fourteen checks run against your portfolio as you write. No model, no scoring — rules, applied the same way every time. Most of them are only visible across entries, which is why proofreading one box at a time never catches them.',
    items: [
        { title: 'Impossible hours', body: 'The hours logged exceed what the calendar allows. Readers do this math.' },
        { title: 'Hours on a zero-hour category', body: 'Publications, presentations, and honors are normally logged at zero. Hours there read as padding.' },
        { title: 'Shadowing-heavy, no patient care', body: '200+ hours watching, none doing.' },
        { title: 'Shadowing split across slots', body: 'Four shadowing entries spend four of your fifteen slots on one thing. It belongs in a single entry, grouped by type of care.' },
        { title: 'Category mismatch', body: 'A shadowing entry that describes hands-on work. Miscategorising costs more trust than a thin activity does.' },
        { title: 'Short-term pattern', body: 'Three or more commitments under three months reads as box-checking.' },
        { title: 'Clinical gap', body: 'Eight entries in and nothing clinical.' },
        { title: 'Every entry opens the same way', body: 'Four boxes starting "As a" is a pattern you can only see from above.' },
        { title: 'Recycled reflection', body: 'The same growth sentence, near enough word for word, sitting in three separate entries.' },
        { title: 'Unused characters', body: 'An entry at 380 of 700, in front of a reader who was willing to read more.' },
        { title: 'Most Meaningful selection', body: 'All three went to the prestigious entries rather than the formative ones.' },
        { title: 'A Most Meaningful with no hours behind it', body: 'A single six-hour day marked as one of three. A reader will ask what it displaced.' },
        { title: 'An expansion that repeats its entry', body: 'The 1,325 characters spent restating the 700.' },
        { title: 'AI-sounding prose', body: 'Flags 15 phrases common in unedited model output. It is a word list, not a detector.' },
    ],
} as const;

export const FEATURES = {
    eyebrow: 'What you get',
    heading: 'All of it free, including the AI',
    items: [
        { title: 'Description wizard', body: 'Context, impact, reflection, recognition — one block at a time, with the character split shown as you type.' },
        { title: 'Most Meaningful coach', body: 'Three questions to test whether an entry belongs in your top three, then a builder for the 1,325-character expansion.' },
        { title: 'School recommender', body: '175 MD programs ranked against your profile. Filter by state, degree, application system.' },
        { title: 'Export', body: 'AMCAS-safe plain text with smart quotes and markdown stripped. Also .csv, .doc, and print.' },
        { title: 'Interview prep', body: 'Five questions an interviewer could ask about any entry, and why they would ask. Notes are not saved.' },
        { title: 'Resume import', body: 'Upload a PDF or Word file and it drafts the entries. Hours and supervisors you fill in yourself.' },
        { title: 'Portfolio audit', body: 'Fourteen checks, running as you write.' },
        { title: 'Countdown', body: 'Days until AMCAS opens, on the cycle you set.' },
    ],
} as const;

export const CHECKLIST = {
    eyebrow: 'Before you submit',
    heading: 'The last pass',
    intro: 'Run every entry through this once you have stopped writing and before you paste anything into AMCAS. The tool catches about half of it. The rest is you, reading out loud.',
    items: [
        'The first line says what this was and where you were.',
        'Active voice, and present tense if you are still doing it.',
        'Specific actions, not a list of responsibilities.',
        'Someone is affected, and you say who.',
        'A non-specialist gets it on one read.',
        'The reflection is yours, not a competency restated.',
        'The expansion adds something the description did not.',
        'Dates, hours, and categories match across the whole application.',
        'AMCAS strips formatting — check it in plain text.',
        'You can talk about it for ten minutes in an interview.',
    ],
} as const;

export const FAQ = {
    eyebrow: 'Questions',
    heading: 'Questions',
    items: [
        {
            q: 'How many activities should I list?',
            a: 'Fifteen is the cap, not a target. Ten to thirteen strong entries beat fifteen with filler in them — a reader spots padding faster than a gap.',
        },
        {
            q: 'How long should an entry be?',
            a: 'Close to all 700 characters. An entry that stops at 400 tends to read as one you did not get much from, and the space costs you nothing.',
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
            q: 'Does it handle AACOMAS too?',
            a: 'Yes. Switch application type and the limit drops to 600 characters with the DO categories. Write at 700 first and trim down — it is easier in that direction.',
        },
        {
            q: 'Is it free?',
            a: 'Yes. No card, no trial clock, no locked features. Every AI tool in it works on a free account.',
        },
        {
            q: 'Does it write my essays for me?',
            a: 'No. It scores drafts, rewrites a sentence you select, and builds a Most Meaningful expansion from answers you type in. The words stay yours to approve — and interviewers will ask you about them.',
        },
        {
            q: 'Will schools know I used AI?',
            a: 'Nobody can promise you either way; there is no reliable detector. What is true is that AdComs interview on these entries, so a description that does not sound like you surfaces in the room. The tool flags 15 phrases common in unedited model output so you can take them out.',
        },
    ],
} as const;

export const FINAL_CTA = {
    heading: 'Your file probably does not need more hours.',
    body: 'It needs the entries to prove what the hours were for. Start with the activity you are least sure about — put it in, see what it scores and why. Five minutes, and it tells you more than another forum thread will.',
    cta: 'Start free',
    note: 'No card. 15 slots, ready when you are.',
} as const;

export const FOOTER = {
    disclaimer: 'Not affiliated with the AAMC, AMCAS, or any medical school.',
    copyright: `© ${new Date().getFullYear()} W&A Architect`,
} as const;
