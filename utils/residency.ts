import { stateName } from './schoolStates.ts';

// --- Residency: how much a school's seats go to its own state's residents ---
//
// Source: AAMC FACTS Table A-1, which reports each school's applications and
// matriculants and the in-state share of each. From those this derives seats per
// application for in-state and out-of-state applicants.
//
// What the numbers are not: acceptance rates. A-1 has no acceptee or interview
// counts, so a "seat" here is a matriculant, which folds in yield. The pools also
// select themselves: few non-Texans apply to Texas public schools, which is why their
// out-of-state rate looks ordinary even though Texas law caps non-residents at 10%.
// That is why the UI shows the share of seats that went to residents alongside the
// per-application rates, and never calls any of this "your chances".

export type TieType = 'grew_up' | 'undergrad' | 'family' | 'work' | 'other';
export type ResidencyStatus = 'us_citizen_or_pr' | 'daca' | 'international';

export const TIE_TYPES: { id: TieType; label: string }[] = [
  { id: 'grew_up', label: 'Grew up there' },
  { id: 'undergrad', label: 'College there' },
  { id: 'family', label: 'Family there' },
  { id: 'work', label: 'Worked there' },
  { id: 'other', label: 'Other tie' },
];

export interface ResidencyRow {
  cycle_year: number;
  applications: number | string;
  /** Postgres numeric arrives from PostgREST as a string. */
  apps_in_state_pct: number | string;
  matriculants: number | string;
  mat_in_state_pct: number | string;
}

export interface SchoolResidencyInfo {
  state?: string | null;
  residency_policy?: string | null;
  regional_states?: string[] | null;
  accepts_international?: string | null;
  policy_note?: string | null;
  policy_source_url?: string | null;
}

export interface ApplicantTie {
  state: string;
  tieType: TieType;
}

export interface ApplicantResidency {
  legalState: string | null;
  status: ResidencyStatus | null;
  ties: ApplicantTie[];
  /** Filled activities that record a US state: where the application itself shows a tie. */
  activityStates: { activityId: number; state: string }[];
}

export interface PooledResidency {
  cycles: number[];
  applications: number;
  matriculants: number;
  appsIn: number;
  appsOut: number;
  matIn: number;
  matOut: number;
  /** Seats per application, smoothed so a handful of applications cannot read as 0% or 100%. */
  rateIn: number;
  rateOut: number;
  rateAll: number;
  /** rateIn / rateOut. How many times likelier an in-state application was to become a seat. */
  advantage: number;
  /** Share of seats that went to residents, 0–1. */
  seatShareIn: number;
}

/** Recent cycles pooled together, because one year of a small school is noise. */
export const POOLED_CYCLES = 3;

const smoothedRate = (seats: number, apps: number) => (seats + 0.5) / (apps + 1);

export function poolResidency(rows: ResidencyRow[]): PooledResidency | null {
  const recent = [...rows].sort((a, b) => b.cycle_year - a.cycle_year).slice(0, POOLED_CYCLES);
  let applications = 0, matriculants = 0, appsIn = 0, matIn = 0;
  for (const r of recent) {
    const apps = Number(r.applications), mats = Number(r.matriculants);
    applications += apps;
    matriculants += mats;
    appsIn += apps * Number(r.apps_in_state_pct) / 100;
    matIn += mats * Number(r.mat_in_state_pct) / 100;
  }
  if (!recent.length || applications <= 0) return null;

  const appsOut = applications - appsIn;
  const matOut = matriculants - matIn;
  const rateIn = smoothedRate(matIn, appsIn);
  const rateOut = smoothedRate(matOut, appsOut);
  return {
    cycles: recent.map(r => r.cycle_year).sort(),
    applications, matriculants, appsIn, appsOut, matIn, matOut,
    rateIn, rateOut,
    rateAll: smoothedRate(matriculants, applications),
    advantage: rateIn / rateOut,
    seatShareIn: matriculants > 0 ? matIn / matriculants : 0,
  };
}

export type PreferenceBand = 'strong' | 'moderate' | 'neutral' | 'no_data';

export interface PreferenceCutoffs {
  moderate: number;
  strong: number;
}

/**
 * Bands are terciles of the in-state advantage across every school with data, so
 * "strong" means "in the top third of schools", which holds up as schools change.
 * The raw rates are always shown next to the band.
 */
export function preferenceCutoffs(pooled: (PooledResidency | null)[]): PreferenceCutoffs {
  const adv = pooled.filter((p): p is PooledResidency => !!p).map(p => p.advantage).sort((a, b) => a - b);
  if (adv.length < 3) return { moderate: 3, strong: 10 };
  const at = (q: number) => adv[Math.floor(q * (adv.length - 1))];
  return { moderate: at(1 / 3), strong: at(2 / 3) };
}

export function preferenceBand(pooled: PooledResidency | null, cutoffs: PreferenceCutoffs): PreferenceBand {
  if (!pooled) return 'no_data';
  if (pooled.advantage >= cutoffs.strong) return 'strong';
  if (pooled.advantage >= cutoffs.moderate) return 'moderate';
  return 'neutral';
}

/** Dampening on the out-of-state penalty, and the least it can leave. See ACCESS below. */
export const ACCESS_EXPONENT = 0.25;
export const ACCESS_FLOOR = 0.35;

export type ResidencyGroup = 'in_state' | 'regional' | 'out_of_state' | 'unknown';

export interface ResidencyWarning {
  kind: 'no_tie' | 'tie_not_shown';
  /** The states this school counts as its own: its state plus any compact states. */
  schoolStates: string[];
}

export interface ResidencyAccess {
  group: ResidencyGroup;
  pooled: PooledResidency | null;
  band: PreferenceBand;
  /** 0.35–1. Multiplies the priority score; 1 means residency costs this applicant nothing here. */
  multiplier: number;
  /** What the multiplier would be for an out-of-state applicant, to show what being in-state is worth. */
  outOfStateMultiplier: number;
  /** Set only when a verified school policy rules the applicant out. */
  excluded: { reason: string } | null;
  /** The applicant's ties to this school's state(s). */
  ties: ApplicantTie[];
  /** Activities located in this school's state(s). */
  tieActivityIds: number[];
  warning: ResidencyWarning | null;
}

const accessFor = (rate: number, rateAll: number) =>
  Math.max(ACCESS_FLOOR, Math.min(1, Math.pow(rate / rateAll, ACCESS_EXPONENT)));

/**
 * ACCESS
 *
 *   A = clamp((rate for the applicant's group / the school's overall rate) ^ 0.25, 0.35, 1)
 *
 * In-state and regional-compact applicants get 1. So does anyone at a school with no
 * data, or an applicant who has not said where they live: missing data is never a
 * penalty. The exponent keeps a school where out-of-state applications became seats
 * at a fiftieth of the in-state rate on the list, lower down, rather than burying it;
 * the reasons still show the full gap in plain numbers.
 */
export function residencyAccess(
  school: SchoolResidencyInfo,
  rows: ResidencyRow[],
  applicant: ApplicantResidency,
  cutoffs: PreferenceCutoffs,
): ResidencyAccess {
  const pooled = poolResidency(rows);
  const band = preferenceBand(pooled, cutoffs);
  const regional = school.regional_states ?? [];
  const schoolStates = [school.state, ...regional].filter((s): s is string => !!s);

  let group: ResidencyGroup = 'unknown';
  if (applicant.legalState && school.state) {
    if (applicant.legalState === school.state) group = 'in_state';
    else if (regional.includes(applicant.legalState)) group = 'regional';
    else group = 'out_of_state';
  }

  const outOfStateMultiplier = pooled ? accessFor(pooled.rateOut, pooled.rateAll) : 1;
  const multiplier = group === 'out_of_state' ? outOfStateMultiplier : 1;

  let excluded: ResidencyAccess['excluded'] = null;
  if (school.residency_policy === 'in_state_only' && group === 'out_of_state') {
    const where = schoolStates.map(stateName).join(', ');
    excluded = { reason: `Considers residents of ${where} only.` };
  } else if (school.accepts_international === 'no' && applicant.status === 'international') {
    excluded = { reason: 'Does not consider international applicants.' };
  }

  const ties = applicant.ties.filter(t => schoolStates.includes(t.state));
  const tieActivityIds = applicant.activityStates.filter(a => schoolStates.includes(a.state)).map(a => a.activityId);

  // A verified policy of preferring residents counts as much as the numbers do. UW's
  // shows why: AAMC counts its four compact states as out-of-state, so its own figures
  // look moderate, while the school considers out-of-region applicants only with ties.
  const prefersResidents = band === 'strong' || school.residency_policy === 'prefers_in_state';

  let warning: ResidencyWarning | null = null;
  if (group === 'out_of_state' && !excluded) {
    if (prefersResidents && ties.length === 0) {
      warning = { kind: 'no_tie', schoolStates };
    } else if ((prefersResidents || band === 'moderate') && ties.length > 0 && tieActivityIds.length === 0) {
      warning = { kind: 'tie_not_shown', schoolStates };
    }
  }

  return { group, pooled, band, multiplier, outOfStateMultiplier, excluded, ties, tieActivityIds, warning };
}

/** "1 in 8". Rates at or above one in two read as "1 in 2" rather than "1 in 1". */
export function oneIn(rate: number): string {
  return `1 in ${Math.max(2, Math.round(1 / rate))}`;
}

/** "2023–25 cycles", or "2025 cycle". */
export function cycleLabel(cycles: number[]): string {
  if (!cycles.length) return '';
  const first = cycles[0], last = cycles[cycles.length - 1];
  return first === last ? `${first} cycle` : `${first}–${String(last).slice(2)} cycles`;
}
