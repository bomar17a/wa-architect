import {
  computeMatch,
  hoursToReach,
  schoolTargets,
  PILLARS,
  PILLAR_HOURS_LABEL,
  type MatchResult,
  type PillarScores,
} from './missionFit.ts';
import { themeOverlap, type ApplicantThemes, type ThemeOverlap } from './themes.ts';
import {
  cycleLabel,
  oneIn,
  residencyAccess,
  type ApplicantResidency,
  type PreferenceCutoffs,
  type ResidencyAccess,
  type ResidencyRow,
  type SchoolResidencyInfo,
} from './residency.ts';
import { stateName } from './schoolStates.ts';

// --- School fit: one school, three separate questions ---
//
//   Mission fit (M)   does your experience cover what this school's mission weighs?
//                     computeMatch, unchanged. Still the headline percentage.
//   Themes (Θ)        do your entries show the themes its mission names?
//   Residency (A)     how much do its seats go to its own state's residents, and are
//                     you one of them?
//
//   priority = E · M · (0.9 + 0.1·Θ) · A
//
// E is 0 only when a verified school policy rules the applicant out. Priority is the
// default sort; it is not shown as a percentage, because it is not a probability of
// anything. Every reason attached to a school cites either the applicant's own
// entries or a dataset and year. None of it is written by a model.

/** How far themes can move a school: ±5% around a neutral 0.5. */
export const THEME_WEIGHT = 0.1;
const NEUTRAL_THEME = 0.5;

export interface FitSchool extends SchoolResidencyInfo {
  id: string;
  school_name: string;
  primary_category?: string | null;
  emphasis_tags?: string[] | null;
  target_inquiry?: number | string | null;
  target_service?: number | string | null;
  target_teamwork?: number | string | null;
  target_clinical?: number | string | null;
}

export interface FitReason {
  id: string;
  axis: 'mission' | 'theme' | 'residency';
  tone: 'plus' | 'minus' | 'info';
  headline: string;
  detail?: string;
  activityIds?: number[];
  source?: { label: string; url?: string };
  /** Priority points this factor moves, signed. Orders the reasons; never displayed as a score. */
  points: number;
}

export interface SchoolFit {
  /** 0–100 sort key. */
  priority: number;
  fit: MatchResult;
  targets: PillarScores;
  isSchoolSpecific: boolean;
  theme: ThemeOverlap;
  access: ResidencyAccess;
  reasons: FitReason[];
}

export interface FitContext {
  scores: PillarScores;
  completeness: number;
  applicant: ApplicantResidency;
  themes: ApplicantThemes;
  tagWeights: Record<string, number>;
  cutoffs: PreferenceCutoffs;
}

export const A1_SOURCE_URL = 'https://www.aamc.org/data-reports/students-residents/data/facts-applicants-and-matriculants';

const themeFactor = (theta: number | null) => 1 - THEME_WEIGHT + THEME_WEIGHT * (theta ?? NEUTRAL_THEME);
const toPoints = (p: number) => Math.round(p * 1000) / 10;
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const pct = (share: number) => `${Math.round(share * 100)}%`;
const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export function scoreSchool(school: FitSchool, residencyRows: ResidencyRow[], ctx: FitContext): SchoolFit {
  const { targets, isSchoolSpecific } = schoolTargets(school);
  const fit = computeMatch(ctx.scores, targets, ctx.completeness);
  const theme = themeOverlap(school.emphasis_tags, ctx.themes, ctx.tagWeights);
  const access = residencyAccess(school, residencyRows, ctx.applicant, ctx.cutoffs);

  const M = fit.match / 100;
  const E = access.excluded ? 0 : 1;
  const priorityWith = (o: { M?: number; theta?: number | null; A?: number; E?: number } = {}) =>
    (o.E ?? E) * (o.M ?? M) * themeFactor(o.theta === undefined ? theme.score : o.theta) * (o.A ?? access.multiplier);
  const priority = priorityWith();

  const reasons: FitReason[] = [
    ...missionReasons(ctx.scores, targets, fit, ctx.completeness, priority, priorityWith),
    ...themeReasons(theme, priority, priorityWith),
    ...residencyReasons(school, access, priority, priorityWith),
  ];

  return { priority: toPoints(priority), fit, targets, isSchoolSpecific, theme, access, reasons };
}

type PriorityWith = (o?: { M?: number; theta?: number | null; A?: number; E?: number }) => number;

function missionReasons(
  scores: PillarScores,
  targets: PillarScores,
  fit: MatchResult,
  completeness: number,
  priority: number,
  priorityWith: PriorityWith,
): FitReason[] {
  const out: FitReason[] = [];
  const gap = fit.limitingPillar;

  if (scores[gap] < targets[gap]) {
    const raised = computeMatch({ ...scores, [gap]: targets[gap] }, targets, completeness).match / 100;
    const hours = hoursToReach(gap, targets[gap]);
    // Mirrors the evidence gate in missionFit.ts: one activity caps a pillar at 6.5, two at 8.5.
    const spread = targets[gap] > 8.5 ? ', across at least three activities' : targets[gap] > 6.5 ? ', across at least two activities' : '';
    out.push({
      id: 'mission-gap',
      axis: 'mission',
      tone: 'minus',
      headline: `${gap} is the gap: ${fmt(scores[gap])} against their target of ${fmt(targets[gap])}.`,
      detail: `Reaching ${fmt(targets[gap])} takes about ${hours.toLocaleString()} logged ${PILLAR_HOURS_LABEL[gap]} on this app's scale${spread}.`,
      points: -toPoints(priorityWith({ M: raised }) - priority),
    });
  }

  // The pillar this school weighs most, if the applicant already clears it.
  const heaviest = PILLARS.reduce((a, b) => (targets[b] > targets[a] ? b : a), PILLARS[0]);
  if (scores[heaviest] >= targets[heaviest]) {
    out.push({
      id: 'mission-strength',
      axis: 'mission',
      tone: 'plus',
      headline: `${heaviest} is what this school weighs most, and you clear it: ${fmt(scores[heaviest])} against a target of ${fmt(targets[heaviest])}.`,
      points: 0,
    });
  }
  return out;
}

function themeReasons(theme: ThemeOverlap, priority: number, priorityWith: PriorityWith): FitReason[] {
  if (theme.score === null) {
    return [{
      id: 'theme-none',
      axis: 'theme',
      tone: 'info',
      headline: 'Its mission statement does not single out a theme, so this part counts as neutral.',
      points: 0,
    }];
  }

  const shown = theme.tags.filter(t => t.hits.length > 0);
  const missing = theme.tags.filter(t => t.hits.length === 0);
  const points = toPoints(priority - priorityWith({ theta: NEUTRAL_THEME }));
  const out: FitReason[] = [];

  if (shown.length) {
    const n = theme.tags.length;
    const howMany = shown.length < n ? `${shown.length} of the ${n} themes`
      : n === 1 ? 'the theme' : n === 2 ? 'both themes' : `all ${n} themes`;
    out.push({
      id: 'theme-shown',
      axis: 'theme',
      tone: 'plus',
      headline: `Your entries show ${howMany} its mission names: ${joinList(shown.map(t => t.label))}.`,
      activityIds: [...new Set(shown.flatMap(t => t.hits.map(h => h.activityId)))],
      points: Math.max(points, 0),
    });
  }
  if (missing.length) {
    out.push({
      id: 'theme-missing',
      axis: 'theme',
      tone: shown.length ? 'info' : 'minus',
      headline: `No entry mentions ${joinList(missing.map(t => t.label))}, which its mission names.`,
      detail: 'Only worth addressing if you have done it. An entry that stretches to fit a mission reads as a stretch.',
      points: Math.min(points, 0),
    });
  }
  return out;
}

function residencyReasons(
  school: FitSchool,
  access: ResidencyAccess,
  priority: number,
  priorityWith: PriorityWith,
): FitReason[] {
  const out: FitReason[] = [];
  const p = access.pooled;
  const home = school.state ? stateName(school.state) : 'this state';
  const source = p ? { label: `AAMC FACTS Table A-1, ${cycleLabel(p.cycles)}`, url: A1_SOURCE_URL } : undefined;

  if (access.excluded) {
    out.push({
      id: 'residency-excluded',
      axis: 'residency',
      tone: 'minus',
      headline: access.excluded.reason,
      detail: school.policy_note ?? undefined,
      source: school.policy_source_url ? { label: "School's admissions page", url: school.policy_source_url } : undefined,
      points: -toPoints(priorityWith({ E: 1 }) - priority),
    });
    return out;
  }

  if (!p) {
    out.push({
      id: 'residency-no-data',
      axis: 'residency',
      tone: 'info',
      headline: 'No AAMC residency figures for this school. The table covers U.S. MD schools, and new schools appear once they enroll a class.',
      points: 0,
    });
  } else {
    const rates = `In-state applications became seats at ${oneIn(p.rateIn)}; out-of-state at ${oneIn(p.rateOut)}.`;
    const share = `${pct(p.seatShareIn)} of seats went to ${home} residents.`;

    if (access.group === 'unknown') {
      out.push({
        id: 'residency-unknown',
        axis: 'residency',
        tone: 'info',
        headline: `${share} Add your state of residence to see where you stand.`,
        detail: rates,
        source,
        points: 0,
      });
    } else if (access.group === 'regional') {
      out.push({
        id: 'residency-regional',
        axis: 'residency',
        tone: 'plus',
        headline: 'This school treats your state as part of its home region.',
        detail: `${share} AAMC counts regional applicants as out-of-state, so these rates understate your position. ${rates}`,
        source,
        points: 0,
      });
    } else if (access.group === 'in_state') {
      const gain = toPoints(priority - priorityWith({ A: access.outOfStateMultiplier }));
      out.push(access.band === 'neutral'
        ? {
            id: 'residency-in-state-neutral',
            axis: 'residency',
            tone: 'info',
            headline: `You're a resident of ${home}, and residency makes less difference here than at most schools.`,
            detail: `${rates} ${share}`,
            source,
            points: 0,
          }
        : {
            id: 'residency-in-state',
            axis: 'residency',
            tone: 'plus',
            headline: `You're a resident of ${home}. ${share}`,
            detail: rates,
            source,
            points: gain,
          });
    } else {
      const cost = toPoints(priorityWith({ A: 1 }) - priority);
      out.push(access.band === 'neutral'
        ? {
            id: 'residency-out-of-state-neutral',
            axis: 'residency',
            tone: 'info',
            headline: `Out of state costs less here than at most schools: ${oneIn(p.rateOut)} out-of-state applications became seats, against ${oneIn(p.rateIn)} in-state.`,
            detail: share,
            source,
            points: -cost,
          }
        : {
            id: 'residency-out-of-state',
            axis: 'residency',
            tone: 'minus',
            headline: `Out of state: ${oneIn(p.rateOut)} applications became a seat, against ${oneIn(p.rateIn)} for ${home} residents.`,
            detail: share,
            source,
            points: -cost,
          });
    }
  }

  if (school.policy_note) {
    out.push({
      id: 'residency-policy',
      axis: 'residency',
      tone: 'info',
      headline: school.policy_note,
      source: school.policy_source_url ? { label: "School's admissions page", url: school.policy_source_url } : undefined,
      points: 0,
    });
  }
  return out;
}

/** The ties warning, as the Recommender shows it on the card, in the drawer and when starring. */
export function warningText(access: ResidencyAccess): string | null {
  const w = access.warning;
  if (!w) return null;
  const states = joinList(w.schoolStates.map(stateName));
  const p = access.pooled;
  if (w.kind === 'no_tie') {
    const seats = p ? ` ${pct(p.seatShareIn)} of its seats went to residents (${cycleLabel(p.cycles)}), and out-of-state applications became seats at ${oneIn(p.rateOut)}.` : '';
    return `You're out of state and haven't listed a tie to ${states}.${seats}`;
  }
  return `You listed a tie to ${states}, but none of your entries is located there. A school that weighs ties can only count the ones your application shows, in your entries or its secondary.`;
}

/** Reasons ordered for display: what costs the most first, then what helps, then context. */
export function orderedReasons(reasons: FitReason[]): FitReason[] {
  const rank = (r: FitReason) => (r.tone === 'minus' ? 0 : r.tone === 'plus' ? 1 : 2);
  return [...reasons].sort((a, b) => rank(a) - rank(b) || Math.abs(b.points) - Math.abs(a.points));
}
