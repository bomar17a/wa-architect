import type { Activity } from '../types';

// --- The Mission Math Engine (v3) ---
//
// Each pillar is scored 0–10 against published competitive-applicant hour
// benchmarks. The curves run to a genuine top-decile figure, so a 10 means
// "top few percent of applicants", not "cleared the competitive band".
//
// Benchmarks behind the breakpoints (advising aggregates over AAMC data —
// the AAMC does not publish hour distributions by experience type, so these
// are competitive-applicant benchmarks, not AAMC statistics):
//
//   Research:  0–150 below par · 200–500 typical · 400–800 competitive · 1,500+ top decile
//   Clinical:  <150 below par · 150–300 typical · 300–500 competitive · 1,000–2,000 top decile
//              (hands-on only; shadowing enters at 0.25x and saturates near 100h)
//   Service:   <60 below par · 100–150 median · 150–300 competitive · 500–700+ top decile
//
//   https://residencyadvisor.com/resources/premed-guidance/research-experience-and-acceptance-odds-what-aamc-data-reveals
//   https://residencyadvisor.com/resources/clinical-volunteering/volunteer-hours-distribution-among-matriculants-where-you-fit-in
//   https://medicalaid.org/blog/how-many-clinical-hours-make-you-a-competitive-applicant-in-2026-a-data-driven-look/
//
// Hours alone cannot max a pillar. Logged hours are self-reported and
// unverified, so an evidence gate caps each pillar by how many distinct
// activities support it (see EVIDENCE_CEILINGS) — three sustained roles
// outrank one enormous claimed number.

export const PILLARS = ['Inquiry', 'Service', 'Teamwork', 'Clinical'] as const;
export type Pillar = (typeof PILLARS)[number];

export type PillarScores = Record<Pillar, number>;

export interface PillarEvidence {
  /** Distinct filled activities feeding this pillar. */
  activityCount: number;
  /** MME, publication/poster, leadership title, 12+ month span, or Final status. */
  hasDistinction: boolean;
}

export interface CompetencyResult {
  scores: PillarScores;
  /** Weighted hour totals, after the anticipated discount and the hours guard. */
  hours: PillarScores;
  evidence: Record<Pillar, PillarEvidence>;
}

type Breakpoints = [number, number][];

/** Hours → 0–10. Interpolates between breakpoints and flatlines past the last. */
export function milestone(hours: number, breaks: Breakpoints): number {
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (hours >= breaks[i][0]) {
      if (i === breaks.length - 1) return breaks[i][1];
      const lo = breaks[i], hi = breaks[i + 1];
      const frac = (hours - lo[0]) / (hi[0] - lo[0]);
      return lo[1] + frac * (hi[1] - lo[1]);
    }
  }
  return 0;
}

export const PILLAR_CURVES: Record<Pillar, Breakpoints> = {
  Inquiry:  [[0, 0], [75, 1.5], [150, 3], [300, 4.5], [500, 6], [800, 7.5], [1200, 9], [2000, 10]],
  Clinical: [[0, 0], [50, 1.5], [150, 3.5], [300, 5.5], [500, 7], [800, 8.5], [1200, 9.5], [1800, 10]],
  Service:  [[0, 0], [40, 1.5], [100, 3.5], [175, 5], [300, 6.5], [500, 8], [750, 9], [1100, 10]],
  // Teamwork is a catch-all bucket (leadership, teaching, athletics, non-medical
  // employment, hobbies), so it accumulates fastest and needs the highest ceiling.
  Teamwork: [[0, 0], [75, 1.5], [150, 3], [300, 4.5], [500, 6], [800, 7.5], [1200, 9], [1800, 10]],
};

/** Score ceiling by how many distinct activities support the pillar. */
const EVIDENCE_CEILINGS = [0, 6.5, 8.5, 10];
/** Above this, a pillar also needs a distinction signal, not just volume. */
const DISTINCTION_THRESHOLD = 9;
/**
 * Ceiling on the soft signals (MME, competency tags, longitudinal span, keywords)
 * that layer on top of the hours curve. Held well below the old 2.0: at 20% of the
 * scale, bonuses were pushing merely-solid profiles to a flat 10.0 on three pillars,
 * which collapsed the difference between a good applicant and an outstanding one.
 */
const MAX_BONUS = 1.25;

/** Inverse of `milestone`: hours needed to reach a target score on a pillar. */
export function hoursToReach(pillar: Pillar, targetScore: number): number {
  const breaks = PILLAR_CURVES[pillar];
  for (let i = 0; i < breaks.length; i++) {
    if (breaks[i][1] >= targetScore) {
      if (i === 0) return breaks[0][0];
      const lo = breaks[i - 1], hi = breaks[i];
      const frac = (targetScore - lo[1]) / (hi[1] - lo[1]);
      return Math.round(lo[0] + frac * (hi[0] - lo[0]));
    }
  }
  return breaks[breaks.length - 1][0];
}

export function calcDurationMonths(dateRanges: Activity['dateRanges']): number {
  const MONTH_MAP: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };
  let earliest = Infinity;
  let latest = -Infinity;
  dateRanges.forEach(r => {
    const startM = MONTH_MAP[r.startDateMonth] ?? 0;
    const startY = parseInt(r.startDateYear) || 0;
    let endM = MONTH_MAP[r.endDateMonth] ?? 0;
    let endY = parseInt(r.endDateYear) || 0;

    // For ongoing activities, default to current month/year
    if (endY === 0) {
      const now = new Date();
      endY = now.getFullYear();
      endM = now.getMonth();
    }

    if (startY > 0) earliest = Math.min(earliest, startY * 12 + startM);
    if (endY > 0) latest = Math.max(latest, endY * 12 + endM);
  });
  if (earliest === Infinity || latest === -Infinity) return 0;
  return Math.max(0, latest - earliest);
}

export function computeCompetency(activities: Activity[]): CompetencyResult {
  const hours: PillarScores = { Inquiry: 0, Service: 0, Teamwork: 0, Clinical: 0 };
  const bonus: PillarScores = { Inquiry: 0, Service: 0, Teamwork: 0, Clinical: 0 };
  const counted: Record<Pillar, Set<number>> = {
    Inquiry: new Set(), Service: new Set(), Teamwork: new Set(), Clinical: new Set(),
  };
  const distinction: Record<Pillar, boolean> = {
    Inquiry: false, Service: false, Teamwork: false, Clinical: false,
  };

  let mmeProcessed = 0; // MME Spam Guard

  // Set-based guards for per-type bonuses (fire once per pillar)
  const researchTypeBonuses = new Set<string>();
  const teamworkTypeBonuses = new Set<string>();

  const filledActivities = activities.filter(a => a.status !== 'Empty' && a.experienceType);

  filledActivities.forEach((act) => {
    let actHours = act.dateRanges.reduce((sum, r) => {
      let rHours = Math.max(parseInt(r.hours) || 0, 0);
      if (r.isAnticipated) {
        rHours *= 0.25; // Apply 0.25x discount to future anticipated hours
      }
      return sum + rHours;
    }, 0);
    const durationMonths = calcDurationMonths(act.dateRanges);

    // Impossible Hours Guard: Max 80 hours/week (approx 340 hours/month)
    actHours = Math.min(actHours, Math.max(1, durationMonths) * 340);

    const type = act.experienceType;
    const desc = [act.description, act.mmeEssay, act.mmeAction, act.mmeResult].filter(Boolean).join(' ').toLowerCase();
    const comps = act.competencies || [];

    // MME Spam Guard: Enforce AMCAS limit of 3 MMEs for bonuses
    let isActMME = false;
    if (act.isMostMeaningful) {
      if (mmeProcessed < 3) {
        isActMME = true;
        mmeProcessed++;
      }
    }

    const isFinal = act.status === 'Final';
    const isLongitudinal = durationMonths >= 12;

    /** Register this activity against a pillar, tracking evidence alongside hours. */
    const credit = (pillar: Pillar, weightedHours: number, isDistinct = false) => {
      hours[pillar] += weightedHours;
      counted[pillar].add(act.id);
      if (isDistinct || isActMME || isLongitudinal || isFinal) distinction[pillar] = true;
    };

    // ── SHADOWING (separate from hands-on clinical) ──────────────
    const isShadowing = type === 'Physician Shadowing/Clinical Observation';

    // ── CLINICAL pillar ──────────────────────────────────────────
    const isHandsOnClinical =
      type === 'Paid Employment - Medical/Clinical' ||
      type === 'Healthcare Experience';              // AACOMAS

    // Medical volunteering: full hours → Clinical, 0.5x → Service (fixes double-count)
    const isMedicalVolunteer = type === 'Community Service/Volunteer - Medical/Clinical';

    if (isHandsOnClinical) {
      credit('Clinical', actHours);
      if (type === 'Paid Employment - Medical/Clinical') bonus.Clinical += 0.5;
      if (isActMME) bonus.Clinical += 0.5;
      if (comps.some(c => c.includes('Reliability') || c.includes('Service'))) bonus.Clinical += 0.25;
      if (isLongitudinal) bonus.Clinical += 0.25; // longitudinal signal
    }

    if (isMedicalVolunteer) {
      credit('Clinical', actHours);            // full credit to Clinical
      credit('Service', actHours * 0.5);       // half credit to Service (volunteering component)
      if (isActMME) { bonus.Clinical += 0.5; bonus.Service += 0.5; }
      if (comps.some(c => c.includes('Reliability') || c.includes('Service'))) bonus.Clinical += 0.25;
      if (comps.some(c => c.includes('Cultural') || c.includes('Service'))) bonus.Service += 0.25;
      if (isLongitudinal) { bonus.Clinical += 0.25; bonus.Service += 0.25; }
    }

    if (isShadowing) {
      // Shadowing Diminishing Returns: Cap raw hours at 150 per activity
      const cappedShadowing = Math.min(actHours, 150);
      credit('Clinical', cappedShadowing * 0.25);   // shadowing at 0.25x weight
      bonus.Clinical += 0.5;           // flat bonus: having shadowing at all matters
      if (isActMME) bonus.Clinical += 0.25;
    }

    // Depth signal from description keywords
    if ((isHandsOnClinical || isMedicalVolunteer) &&
        (desc.includes('patient') || desc.includes('clinic') || desc.includes('hospital'))) {
      bonus.Clinical += 0.25;
    }

    if ((isHandsOnClinical || isMedicalVolunteer || isShadowing) && isFinal) bonus.Clinical += 0.1;

    // ── INQUIRY pillar ───────────────────────────────────────────
    const isResearch = type === 'Research/Lab' || type === 'Research';

    if (isResearch) {
      credit('Inquiry', actHours);
      if (isActMME) bonus.Inquiry += 0.5;
      if (comps.some(c => c.includes('Scientific') || c.includes('Critical'))) bonus.Inquiry += 0.25;
      if (isLongitudinal) bonus.Inquiry += 0.25;
      if (isFinal) bonus.Inquiry += 0.1;
    }

    // Publications / Posters / Presentations: SET-GUARDED (fire once per type).
    // These carry no hours but are the strongest research signal an applicant has,
    // so they count as distinct evidence toward the Inquiry ceiling.
    if (type === 'Publications' && !researchTypeBonuses.has('publication')) {
      bonus.Inquiry += 1.0; researchTypeBonuses.add('publication');
      credit('Inquiry', 0, true);
    }
    if (type === 'Presentations/Posters' && !researchTypeBonuses.has('poster')) {
      bonus.Inquiry += 1.0; researchTypeBonuses.add('poster');
      credit('Inquiry', 0, true);
    }
    // Description-based publication signal (once)
    if (!researchTypeBonuses.has('desc_pub') &&
        (desc.includes('publication') || desc.includes('published') ||
         desc.includes('first author') || desc.includes('co-author'))) {
      bonus.Inquiry += 0.75; researchTypeBonuses.add('desc_pub');
      if (isResearch) distinction.Inquiry = true;
    }
    if (!researchTypeBonuses.has('desc_poster') && desc.includes('poster') && type !== 'Presentations/Posters') {
      bonus.Inquiry += 0.5; researchTypeBonuses.add('desc_poster');
    }
    if (type === 'Conferences Attended' && !researchTypeBonuses.has('conference')) {
      bonus.Inquiry += 0.25; researchTypeBonuses.add('conference');
      credit('Inquiry', 0);
    }

    // ── SERVICE pillar ───────────────────────────────────────────
    // Non-medical volunteering (medical volunteering handled above with split)
    const isNonMedService =
      type === 'Community Service/Volunteer - Not Medical/Clinical' ||
      type === 'Non-Healthcare Volunteer';

    if (isNonMedService) {
      const led = desc.includes('director') || desc.includes('led') || desc.includes('founded') || desc.includes('president');
      credit('Service', actHours, led);
      if (isActMME) bonus.Service += 0.75;
      if (comps.some(c => c.includes('Cultural') || c.includes('Service'))) bonus.Service += 0.25;
      if (led) bonus.Service += 0.5;
      if (isLongitudinal) bonus.Service += 0.25;
      if (isFinal) bonus.Service += 0.1;
    }

    // ── TEAMWORK pillar ──────────────────────────────────────────
    const isTeamwork =
      type === 'Leadership - Not Listed Elsewhere' ||
      type === 'Leadership Experience' ||
      type === 'Military Service' ||
      type === 'Intercollegiate Athletics' ||
      type === 'Extracurricular Activities' ||
      type === 'Teaching/Tutoring/Teaching Assistant' ||
      type === 'Teaching Experience';

    if (isTeamwork) {
      const isLeadershipType = type === 'Leadership - Not Listed Elsewhere' || type === 'Leadership Experience';
      const titled = desc.includes('captain') || desc.includes('president') || desc.includes('chair') ||
                     desc.includes('founded') || desc.includes('managed');
      credit('Teamwork', actHours, isLeadershipType || type === 'Military Service' || titled);

      // Per-type bonuses: SET-GUARDED (fire once)
      if (isLeadershipType && !teamworkTypeBonuses.has('leadership')) {
        bonus.Teamwork += 1.0; teamworkTypeBonuses.add('leadership');
      }
      if (type === 'Military Service' && !teamworkTypeBonuses.has('military')) {
        bonus.Teamwork += 1.0; teamworkTypeBonuses.add('military');
      }
      if (type === 'Intercollegiate Athletics' && !teamworkTypeBonuses.has('athletics')) {
        bonus.Teamwork += 0.75; teamworkTypeBonuses.add('athletics');
      }
      // Per-activity bonuses (these CAN fire per activity)
      if (isActMME) bonus.Teamwork += 0.5;
      if (comps.some(c => c.includes('Teamwork') || c.includes('Oral') || c.includes('Social'))) bonus.Teamwork += 0.25;
      if (titled) bonus.Teamwork += 0.25;
      if (isLongitudinal) bonus.Teamwork += 0.25;
      if (isFinal) bonus.Teamwork += 0.1;
    }

    // ── NON-MEDICAL EMPLOYMENT → Teamwork credit ─────────────────
    const isNonMedEmployment =
      type === 'Paid Employment - Not Medical/Clinical' ||
      type === 'Non-Healthcare Employment';

    if (isNonMedEmployment) {
      credit('Teamwork', actHours);
      if (isLongitudinal) bonus.Teamwork += 0.25;
      if (isFinal) bonus.Teamwork += 0.1;
    }

    // ── HOBBIES & ARTISTIC ENDEAVORS → small Teamwork credit ─────
    const isHobbyArt = type === 'Hobbies' || type === 'Artistic Endeavors';
    if (isHobbyArt) {
      credit('Teamwork', actHours * 0.25);   // 0.25x weight
      if (!teamworkTypeBonuses.has('hobby_art')) {
        bonus.Teamwork += 0.25;              // flat bonus for having humanistic interests
        teamworkTypeBonuses.add('hobby_art');
      }
    }
  });

  const scores = {} as PillarScores;
  const evidence = {} as Record<Pillar, PillarEvidence>;

  PILLARS.forEach(p => {
    const activityCount = counted[p].size;
    const hasDistinction = distinction[p];
    const base = milestone(hours[p], PILLAR_CURVES[p]);
    const raw = base + Math.min(bonus[p], MAX_BONUS);

    // Evidence gate: volume alone cannot carry a pillar to the top of the scale.
    let ceiling = EVIDENCE_CEILINGS[Math.min(activityCount, 3)];
    if (!hasDistinction) ceiling = Math.min(ceiling, DISTINCTION_THRESHOLD);

    scores[p] = Math.min(Math.round(raw * 10) / 10, ceiling, 10);
    evidence[p] = { activityCount, hasDistinction };
  });

  return { scores, hours, evidence };
}

/** Back-compat wrapper: the pillar scores alone. */
export function computeCompetencyScores(activities: Activity[]): PillarScores {
  return computeCompetency(activities).scores;
}

// --- Archetypes ---
//
// Targets are on the same 0–10 scale as the pillar curves above and describe a
// STRONG applicant for that archetype, not a median one. On the v3 curves an
// Inquiry target of 9 is roughly 1,200 research hours; a Clinical target of 9
// is roughly 1,000 hands-on hours.

export interface SchoolArchetype {
  id: string;
  name: string;
  dbCategory: string;
  description: string;
  color: string;
  activeColor: string;
  targets: PillarScores;
}

export const SCHOOL_ARCHETYPES: SchoolArchetype[] = [
  {
    id: 'Investigator',
    name: 'The Investigator',
    dbCategory: 'The Investigator',
    description: 'Top-tier academic centers valuing innovation, publications, and basic science.',
    color: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    activeColor: 'bg-indigo-600 text-white',
    targets: { Inquiry: 9, Service: 5.5, Teamwork: 6, Clinical: 7 },
  },
  {
    id: 'Advocate',
    name: 'The Advocate',
    dbCategory: 'The Advocate',
    description: 'Social-justice focused schools valuing distance traveled, community service, and health equity.',
    color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    activeColor: 'bg-emerald-600 text-white',
    targets: { Inquiry: 4.5, Service: 9, Teamwork: 7, Clinical: 7 },
  },
  {
    id: 'Practitioner',
    name: 'The Practitioner',
    dbCategory: 'The Practitioner',
    description: 'Primary care & regional focused; values hands-on clinical reliability.',
    color: 'bg-amber-50 border-amber-100 text-amber-700',
    activeColor: 'bg-amber-500 text-white',
    targets: { Inquiry: 3.5, Service: 7, Teamwork: 7.5, Clinical: 9 },
  },
  {
    id: 'Innovator',
    name: 'The Innovator',
    dbCategory: 'The Innovator',
    description: 'Focuses on systems-level changes, tech, healthcare administration, and entrepreneurship.',
    color: 'bg-sky-50 border-sky-100 text-sky-700',
    activeColor: 'bg-sky-500 text-white',
    targets: { Inquiry: 7, Service: 6, Teamwork: 8.5, Clinical: 7 },
  },
  {
    id: 'Leader',
    name: 'The Leader',
    dbCategory: 'The Leader',
    description: 'Focuses on public policy, advocacy at the structural level, and organized medicine.',
    color: 'bg-rose-50 border-rose-100 text-rose-700',
    activeColor: 'bg-rose-500 text-white',
    targets: { Inquiry: 5.5, Service: 7.5, Teamwork: 9, Clinical: 7.5 },
  },
  {
    id: 'Balanced',
    name: 'The Balanced',
    dbCategory: 'The Balanced',
    description: 'Well-rounded programs valuing equal depth across all four pillars with no single dominant emphasis.',
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    activeColor: 'bg-slate-700 text-white',
    targets: { Inquiry: 6.5, Service: 6.5, Teamwork: 6.5, Clinical: 7 },
  },
];

// --- Matching ---

export interface Completeness {
  /** 0–1 multiplier applied to the archetype fit. */
  factor: number;
  activityCount: number;
  mmeCount: number;
  /** True once the profile is substantial enough to stop discounting the match. */
  isComplete: boolean;
}

const RECOMMENDED_ACTIVITIES = 15;

/**
 * How much of the applicant's story is actually on the page yet. A thin profile
 * cannot produce a confident match, so the fit is discounted until it fills out —
 * and the UI shows this alongside the number rather than burying it.
 */
export function computeCompleteness(activities: Activity[]): Completeness {
  const filled = activities.filter(a => a.status !== 'Empty' && a.experienceType);
  const activityCount = filled.length;
  const mmeCount = filled.filter(a => a.isMostMeaningful).length;

  let countFactor = 1.0;
  if (activityCount < 5) countFactor = 0.55;
  else if (activityCount < 8) countFactor = 0.70;
  else if (activityCount < 10) countFactor = 0.85;
  else if (activityCount < 12) countFactor = 0.95;

  // AMCAS allows three Most Meaningful designations; not using them leaves the
  // strongest signal an applicant has on the table.
  const mmeFactor = [0.93, 0.96, 0.98, 1.0][Math.min(mmeCount, 3)];

  const factor = Math.round(countFactor * mmeFactor * 1000) / 1000;
  return {
    factor,
    activityCount,
    mmeCount,
    isComplete: factor >= 1.0,
  };
}

export interface MatchResult {
  /** 0–100, the headline number. */
  match: number;
  /** 0–100 before the completeness discount. */
  fit: number;
  /** Weighted share of the archetype's targets the profile covers. */
  coverage: number;
  /** Drag from the weakest pillar. */
  balance: number;
  /** How closely the profile's emphasis tracks the archetype's, 0–100. */
  shape: number;
  completeness: number;
  /** The pillar holding the match back most. */
  limitingPillar: Pillar;
}

/** No model should claim a perfect read on mission fit. */
const MATCH_CEILING = 95;

export function computeMatch(
  scores: PillarScores,
  targets: PillarScores,
  completeness = 1,
): MatchResult {
  const ratios = {} as PillarScores;
  PILLARS.forEach(p => {
    ratios[p] = targets[p] > 0 ? Math.min(scores[p] / targets[p], 1) : 1;
  });

  // Weight each pillar by the archetype's own target: missing Clinical costs a
  // Practitioner far more than it costs an Investigator.
  const weightSum = PILLARS.reduce((sum, p) => sum + targets[p], 0);
  const coverage = weightSum > 0
    ? PILLARS.reduce((sum, p) => sum + targets[p] * ratios[p], 0) / weightSum
    : 0;

  // An empty pillar is disqualifying in a way that a weighted average alone
  // never captures — three strong pillars must not carry a fourth that is zero.
  const minRatio = Math.min(...PILLARS.map(p => ratios[p]));
  const balance = 0.65 + 0.35 * minRatio;

  const limitingPillar = PILLARS.reduce((worst, p) => (ratios[p] < ratios[worst] ? p : worst), PILLARS[0]);

  // Coverage measures whether the applicant has done enough; it cannot tell where
  // their weight sits, because clearing a target pays the same whether you match it
  // or triple it. Comparing the two profiles normalized to their own totals asks the
  // separate question a mission-fit tool exists to answer: is this applicant's
  // emphasis where this school actually looks? Without it, every archetype reports
  // the same number for any strong applicant.
  const scoreSum = PILLARS.reduce((sum, p) => sum + scores[p], 0);
  let shape = 1;
  if (scoreSum > 0 && weightSum > 0) {
    shape = PILLARS.reduce(
      (sum, p) => sum + Math.min(scores[p] / scoreSum, targets[p] / weightSum),
      0,
    );
  }
  // Overlap between two four-pillar profiles is compressed into roughly 0.8–1.0,
  // so cube it to make real differences in emphasis legible, then apply it as a
  // modest modulation rather than letting it dominate the level signal.
  const shapeAdj = 0.75 + 0.25 * Math.pow(shape, 3);

  const fit = coverage * balance * shapeAdj;
  const match = Math.min(fit * completeness * 100, MATCH_CEILING);

  return {
    match: Math.round(match),
    fit: Math.round(Math.min(fit * 100, MATCH_CEILING)),
    coverage: Math.round(coverage * 100),
    balance: Math.round(balance * 100),
    shape: Math.round(shape * 100),
    completeness: Math.round(completeness * 100),
    limitingPillar,
  };
}

/** The archetype this profile fits best, by the same formula the UI displays. */
export function bestFitArchetype(scores: PillarScores): SchoolArchetype {
  return SCHOOL_ARCHETYPES.reduce((best, arch) => {
    const a = computeMatch(scores, arch.targets).fit;
    const b = computeMatch(scores, best.targets).fit;
    return a > b ? arch : best;
  }, SCHOOL_ARCHETYPES[0]);
}
