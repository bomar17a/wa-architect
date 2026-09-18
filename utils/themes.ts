import type { Activity } from '../types.ts';

// --- Themes: what a mission statement names, and whether the application shows it ---
//
// scripts/derive-school-targets.ts reads each school's mission statement for these
// themes and stores the hits as medical_schools.emphasis_tags. This file reads the
// applicant's entries for the same themes, so the two sides share one set of labels.
//
// The applicant side needs its own terms. Missions say "health equity"; applicants
// write "uninsured patients at a free clinic". Every hit records the term that matched
// and the activity it matched in, so any claim the UI makes about "your entries"
// points at the entries.

export interface Theme {
  /** The label stored in emphasis_tags. Never rename one without regenerating those. */
  label: string;
  /** Matched against mission statements by derive-school-targets.ts, in this order. */
  missionTerms: string[];
  /** Matched against the applicant's title, organization, description and MME essay. */
  applicantTerms: string[];
  /** Experience types that evidence the theme by themselves. */
  experienceTypes?: string[];
}

export const THEMES: Theme[] = [
  {
    label: 'physician-scientist training',
    missionTerms: ['physician-scientist', 'md-phd'],
    applicantTerms: ['physician-scientist', 'physician scientist', 'md-phd', 'md/phd', 'mstp'],
  },
  {
    label: 'primary care',
    missionTerms: ['primary care'],
    applicantTerms: ['primary care', 'family medicine', 'family physician', 'family practice'],
  },
  {
    label: 'rural health',
    missionTerms: ['rural'],
    applicantTerms: ['rural'],
  },
  {
    label: 'underserved communities',
    missionTerms: ['underserved'],
    applicantTerms: ['underserved', 'uninsured', 'underinsured', 'low-income', 'free clinic', 'safety-net',
      'homeless', 'unhoused', 'food insecurity', 'food bank', 'refugee', 'medicaid'],
  },
  {
    label: 'health equity',
    missionTerms: ['health equity'],
    applicantTerms: ['health equity', 'equity', 'inequity', 'inequities'],
  },
  {
    label: 'health disparities',
    missionTerms: ['health disparities'],
    applicantTerms: ['disparities', 'disparity'],
  },
  {
    label: 'social justice',
    missionTerms: ['social justice'],
    applicantTerms: ['social justice', 'justice'],
  },
  {
    label: 'public health',
    missionTerms: ['public health'],
    applicantTerms: ['public health', 'epidemiology', 'epidemiological', 'health department'],
  },
  {
    label: 'community health',
    missionTerms: ['community health'],
    applicantTerms: ['community health', 'health fair', 'community health worker', 'health outreach'],
  },
  {
    label: 'health policy',
    missionTerms: ['health policy'],
    applicantTerms: ['health policy', 'policy', 'legislation', 'legislative'],
  },
  {
    label: 'interprofessional care',
    missionTerms: ['interprofessional'],
    applicantTerms: ['interprofessional', 'interdisciplinary', 'multidisciplinary'],
  },
  {
    label: 'entrepreneurship',
    missionTerms: ['entrepreneur'],
    applicantTerms: ['entrepreneur', 'entrepreneurial', 'startup', 'start-up'],
  },
  {
    label: 'innovation',
    missionTerms: ['innovation'],
    applicantTerms: ['innovation', 'innovative', 'invented', 'prototype', 'patent'],
  },
  {
    label: 'translational research',
    missionTerms: ['translational'],
    applicantTerms: ['translational', 'clinical trial', 'clinical trials', 'bench-to-bedside'],
  },
  {
    label: 'basic science',
    missionTerms: ['basic science'],
    applicantTerms: ['basic science', 'molecular', 'biochemistry', 'cell biology', 'bench research'],
  },
  {
    label: 'research',
    missionTerms: ['research'],
    applicantTerms: ['research', 'researcher', 'hypothesis', 'experiment', 'experiments'],
    experienceTypes: ['Research/Lab', 'Research', 'Publications', 'Presentations/Posters'],
  },
  {
    label: 'leadership',
    missionTerms: ['leadership'],
    applicantTerms: ['leadership', 'president', 'founded', 'co-founded', 'captain', 'chair', 'director'],
    experienceTypes: ['Leadership - Not Listed Elsewhere', 'Leadership Experience'],
  },
  {
    label: 'global health',
    missionTerms: ['global health'],
    applicantTerms: ['global health'],
  },
  {
    label: 'whole-person care',
    missionTerms: ['whole health'],
    applicantTerms: ['whole health', 'whole-person', 'whole person', 'holistic'],
  },
];

/**
 * The [term, label] pairs derive-school-targets.ts matches against mission statements,
 * in the order it has always used (the first five hits become the school's tags).
 */
export const TAG_TERMS: [string, string][] = THEMES.flatMap(t => t.missionTerms.map(term => [term, t.label] as [string, string]));

export interface ThemeHit {
  activityId: number;
  /** The term that matched, or the experience type that evidences the theme. */
  matched: string;
  via: 'term' | 'type';
}

/** label → the activities that show it. Only labels with at least one hit appear. */
export type ApplicantThemes = Record<string, ThemeHit[]>;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word boundaries on both sides. Substring matching found "ratio" inside
// "collaboration" in the narrative scorer (session 10b); here it would find "rural"
// inside "intramural".
const TERM_PATTERNS = new Map(
  THEMES.flatMap(t => t.applicantTerms).map(term => [term, new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}([^a-z0-9]|$)`)]),
);

/**
 * Which themes each filled activity shows. An activity counts once per theme however
 * many times it repeats a term, so writing a word five times in one entry does not
 * evidence anything more than writing it once.
 */
export function applicantThemes(activities: Activity[]): ApplicantThemes {
  const out: ApplicantThemes = {};
  for (const act of activities) {
    if (act.status === 'Empty' || !act.experienceType) continue;
    const text = [act.title, act.organization, act.description, act.mmeEssay]
      .filter(Boolean).join(' \n ').toLowerCase();

    for (const theme of THEMES) {
      let hit: ThemeHit | null = null;
      if (theme.experienceTypes?.includes(act.experienceType)) {
        hit = { activityId: act.id, matched: act.experienceType, via: 'type' };
      } else {
        const term = theme.applicantTerms.find(t => TERM_PATTERNS.get(t)!.test(text));
        if (term) hit = { activityId: act.id, matched: term, via: 'term' };
      }
      if (hit) (out[theme.label] ??= []).push(hit);
    }
  }
  return out;
}

/**
 * How distinctive each tag is across the schools loaded, as inverse document frequency.
 * "research" is on most schools and says little about any one of them; "rural health"
 * is on a handful and says a lot.
 */
export function tagWeights(schools: { emphasis_tags?: string[] | null }[]): Record<string, number> {
  const n = schools.length;
  const df: Record<string, number> = {};
  for (const s of schools) for (const tag of new Set(s.emphasis_tags ?? [])) df[tag] = (df[tag] ?? 0) + 1;
  const weights: Record<string, number> = {};
  for (const [tag, count] of Object.entries(df)) weights[tag] = Math.log((n + 1) / (count + 1)) + 1;
  return weights;
}

export interface ThemeOverlap {
  /** 0–1, or null when the mission names no themes this lexicon knows. */
  score: number | null;
  /** The school's tags, each with the activities that show it (empty when none do). */
  tags: { label: string; weight: number; hits: ThemeHit[] }[];
}

/**
 * One activity shows a theme halfway; two or more show it fully. A single entry cannot
 * carry a theme on its own, however it is worded.
 */
const EVIDENCE_FOR_FULL_CREDIT = 2;

export function themeOverlap(
  schoolTags: string[] | null | undefined,
  themes: ApplicantThemes,
  weights: Record<string, number>,
): ThemeOverlap {
  const tags = (schoolTags ?? []).map(label => ({
    label,
    weight: weights[label] ?? 1,
    hits: themes[label] ?? [],
  }));
  if (tags.length === 0) return { score: null, tags };

  const total = tags.reduce((s, t) => s + t.weight, 0);
  const shown = tags.reduce((s, t) => s + t.weight * Math.min(1, t.hits.length / EVIDENCE_FOR_FULL_CREDIT), 0);
  return { score: total > 0 ? shown / total : null, tags };
}
