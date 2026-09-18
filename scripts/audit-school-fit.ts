// Harness for school fit: residency access, the ties warning, theme overlap, and the
// priority that combines them with mission fit.
//
//   node scripts/audit-school-fit.ts
//
// Fixtures are synthetic schools shaped like real ones (a public that fills nearly
// every seat with residents, a private that barely distinguishes, a regional compact),
// so CI needs neither the database nor the AAMC files, which are not in this repo.
// When data/sources/ is present locally, a second section runs the same engine over
// the real A-1 tables and checks a few schools whose shape is well known.

import { existsSync, readFileSync } from 'node:fs';
import type { Activity } from '../types.ts';
import { computeMatch, type PillarScores } from '../utils/missionFit.ts';
import { applicantThemes, themeOverlap, tagWeights } from '../utils/themes.ts';
import {
  poolResidency,
  preferenceCutoffs,
  residencyAccess,
  oneIn,
  cycleLabel,
  ACCESS_FLOOR,
  type ApplicantResidency,
  type ResidencyRow,
  type SchoolResidencyInfo,
} from '../utils/residency.ts';
import { scoreSchool, warningText, type FitContext, type FitSchool } from '../utils/schoolFit.ts';

let failures = 0;
function check(label: string, ok: boolean, detail = '') {
  if (!ok) failures++;
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(52)} ${detail}`);
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const cycles = (apps: number, appsIn: number, mats: number, matsIn: number): ResidencyRow[] =>
  [2023, 2024, 2025].map(cycle_year => ({
    cycle_year, applications: apps, apps_in_state_pct: appsIn, matriculants: mats, mat_in_state_pct: matsIn,
  }));

// ~2,500 applications, 12% from residents; 95% of 175 seats to residents.
const STRONG_PUBLIC = cycles(2500, 12, 175, 95);
// ~6,400 applications, 3.6% from residents; 6.7% of seats to residents.
const OPEN_PRIVATE = cycles(6400, 3.6, 105, 6.7);
// A regional school: its own state gets most seats, compact states are counted out-of-state by AAMC.
const REGIONAL = cycles(10000, 10, 270, 60);
// Numbers given as strings, as PostgREST returns numeric columns.
const STRINGLY: ResidencyRow[] = STRONG_PUBLIC.map(r => ({ ...r, apps_in_state_pct: String(r.apps_in_state_pct), mat_in_state_pct: String(r.mat_in_state_pct) }));

// A spread of advantages so the terciles land between the fixtures above.
const spread = [1, 1.3, 1.6, 2, 2.5, 3, 4, 5, 6, 8, 12, 20, 40, 80]
  .map(adv => poolResidency(cycles(5000, 20, 150, (100 * 0.2 * adv) / (0.2 * adv + 0.8))));
const cutoffs = preferenceCutoffs(spread);

const applicant = (over: Partial<ApplicantResidency> = {}): ApplicantResidency =>
  ({ legalState: 'OH', status: null, ties: [], activityStates: [], ...over });

const AR: SchoolResidencyInfo = { state: 'AR' };
const CT: SchoolResidencyInfo = { state: 'CT' };
const WA: SchoolResidencyInfo = { state: 'WA', residency_policy: 'prefers_in_state', regional_states: ['WA', 'WY', 'AK', 'MT', 'ID'], policy_source_url: 'https://example.edu' };

let nextId = 1;
function activity(over: Partial<Activity>): Activity {
  return {
    id: nextId++, title: 'Volunteer', organization: 'Org', experienceType: 'Community Service/Volunteer - Not Medical/Clinical',
    city: '', country: 'USA', dateRanges: [], contactName: '', contactTitle: '', contactEmail: '', contactPhone: '',
    status: 'Draft' as Activity['status'], isMostMeaningful: false, description: '', mmeAction: '', mmeResult: '', mmeEssay: '',
    competencies: [], ...over,
  };
}

// ── Residency access ────────────────────────────────────────────────────────

console.log(`\nCutoffs  moderate ${cutoffs.moderate.toFixed(2)}x  strong ${cutoffs.strong.toFixed(2)}x`);
check('cutoffs are ordered', cutoffs.moderate < cutoffs.strong);

console.log('\nResidency access');
{
  const oos = residencyAccess(AR, STRONG_PUBLIC, applicant(), cutoffs);
  check('strong public, out of state: band strong', oos.band === 'strong', `advantage ${oos.pooled!.advantage.toFixed(0)}x`);
  check('strong public, out of state: multiplier well below 1', oos.multiplier < 0.8 && oos.multiplier >= ACCESS_FLOOR, oos.multiplier.toFixed(2));
  check('strong public, out of state, no tie: warns', oos.warning?.kind === 'no_tie', String(warningText(oos)));

  const res = residencyAccess(AR, STRONG_PUBLIC, applicant({ legalState: 'AR' }), cutoffs);
  check('strong public, resident: multiplier 1, no warning', res.multiplier === 1 && !res.warning && res.group === 'in_state');

  const priv = residencyAccess(CT, OPEN_PRIVATE, applicant(), cutoffs);
  check('open private, out of state: multiplier >= 0.95', priv.multiplier >= 0.95, priv.multiplier.toFixed(3));
  check('open private, out of state: no warning', !priv.warning, priv.band);

  const idaho = residencyAccess(WA, REGIONAL, applicant({ legalState: 'ID' }), cutoffs);
  check('compact state resident: regional, multiplier 1', idaho.group === 'regional' && idaho.multiplier === 1 && !idaho.warning);

  const tieNotShown = residencyAccess(WA, REGIONAL, applicant({ ties: [{ state: 'WA', tieType: 'undergrad' }] }), cutoffs);
  check('tie listed but no entry there: says so', tieNotShown.warning?.kind === 'tie_not_shown', tieNotShown.band);
  const tieShown = residencyAccess(WA, REGIONAL, applicant({ ties: [{ state: 'MT', tieType: 'family' }], activityStates: [{ activityId: 7, state: 'MT' }] }), cutoffs);
  check('tie to a compact state, shown in an entry: no warning', !tieShown.warning && tieShown.tieActivityIds[0] === 7);
  const policyOnly = residencyAccess(WA, OPEN_PRIVATE, applicant(), cutoffs);
  check('verified prefers-residents policy warns even on neutral numbers', policyOnly.band === 'neutral' && policyOnly.warning?.kind === 'no_tie');

  const none = residencyAccess(AR, [], applicant(), cutoffs);
  check('no data: multiplier 1, band no_data, no warning', none.multiplier === 1 && none.band === 'no_data' && !none.warning);

  const unknown = residencyAccess(AR, STRONG_PUBLIC, applicant({ legalState: null }), cutoffs);
  check('applicant state not given: no penalty, no warning', unknown.multiplier === 1 && unknown.group === 'unknown' && !unknown.warning);

  const zeroOut = residencyAccess(AR, cycles(3000, 10, 100, 100), applicant(), cutoffs);
  check('zero out-of-state seats: finite, at or above floor', Number.isFinite(zeroOut.multiplier) && zeroOut.multiplier >= ACCESS_FLOOR, zeroOut.multiplier.toFixed(2));

  const str = residencyAccess(AR, STRINGLY, applicant(), cutoffs);
  check('numeric-as-string rows give the same result', Math.abs(str.multiplier - oos.multiplier) < 1e-9);

  let prev = 0, monotone = true;
  for (const matIn of [99, 95, 90, 80, 60, 40, 20]) {
    const m = residencyAccess(AR, cycles(2500, 12, 175, matIn), applicant(), cutoffs).multiplier;
    if (m < prev - 1e-9) monotone = false;
    prev = m;
  }
  check('more out-of-state seats never lowers the multiplier', monotone);

  const onlyIn: SchoolResidencyInfo = { state: 'ND', residency_policy: 'in_state_only', policy_source_url: 'https://example.edu' };
  check('in-state-only policy excludes out-of-state', !!residencyAccess(onlyIn, STRONG_PUBLIC, applicant(), cutoffs).excluded);
  check('in-state-only policy admits residents', !residencyAccess(onlyIn, STRONG_PUBLIC, applicant({ legalState: 'ND' }), cutoffs).excluded);
  check('international exclusion needs a verified "no"',
    !!residencyAccess({ state: 'AR', accepts_international: 'no', policy_source_url: 'x' }, STRONG_PUBLIC, applicant({ status: 'international' }), cutoffs).excluded
    && !residencyAccess(AR, STRONG_PUBLIC, applicant({ status: 'international' }), cutoffs).excluded);

  check('oneIn never says "1 in 1"', oneIn(0.9) === '1 in 2' && oneIn(0.0125) === '1 in 80', `${oneIn(0.9)}, ${oneIn(0.0125)}`);
  check('cycle label', cycleLabel([2023, 2024, 2025]) === '2023–25 cycles' && cycleLabel([2025]) === '2025 cycle');
}

// ── Themes ──────────────────────────────────────────────────────────────────

console.log('\nThemes');
{
  const stuffed = [activity({ description: 'Rural rural rural. I love rural health and rural communities in rural towns.' })];
  const three = [1, 2, 3].map(() => activity({ description: 'Weekly shifts at a rural clinic.' }));
  const weights = { 'rural health': 2 };
  const a = themeOverlap(['rural health'], applicantThemes(stuffed), weights).score!;
  const b = themeOverlap(['rural health'], applicantThemes(three), weights).score!;
  check('one keyword-stuffed entry scores below three real ones', a < b, `${a} vs ${b}`);

  const intramural = applicantThemes([activity({ description: 'Captain of the intramural soccer team.' })]);
  check('"intramural" does not read as rural', !intramural['rural health']);
  const org = applicantThemes([activity({ organization: 'Delta Rural Health Clinic', description: 'Front desk.' })]);
  check('organization name counts', !!org['rural health']);
  const type = applicantThemes([activity({ experienceType: 'Research/Lab', description: 'Ran PCR.' })]);
  check('experience type counts as evidence', type.research?.[0].matched === 'Research/Lab');
  const empty = applicantThemes([activity({ status: 'Empty' as Activity['status'], description: 'rural' })]);
  check('empty slots are ignored', !empty['rural health']);

  const w = tagWeights([{ emphasis_tags: ['research'] }, { emphasis_tags: ['research', 'rural health'] }, { emphasis_tags: ['research'] }]);
  check('rarer tags weigh more', w['rural health'] > w.research, `rural ${w['rural health'].toFixed(2)}, research ${w.research.toFixed(2)}`);
  check('no tags: overlap is null (neutral)', themeOverlap([], {}, {}).score === null);
}

// ── Priority and reasons ────────────────────────────────────────────────────

console.log('\nPriority and reasons');
{
  const scores: PillarScores = { Inquiry: 6, Service: 7, Teamwork: 6.5, Clinical: 5 };
  const school: FitSchool = { id: 's', school_name: 'Fixture', primary_category: 'The Practitioner', emphasis_tags: ['rural health', 'primary care'], state: 'AR' };
  const base: FitContext = { scores, completeness: 1, applicant: applicant({ legalState: 'AR' }), themes: {}, tagWeights: {}, cutoffs };

  const s = scoreSchool(school, STRONG_PUBLIC, base);
  check('mission fit is computeMatch, unchanged', s.fit.match === computeMatch(scores, s.targets, 1).match);

  const withThemes = scoreSchool(school, STRONG_PUBLIC, {
    ...base,
    themes: applicantThemes([1, 2].map(() => activity({ description: 'Rural primary care clinic shifts.' }))),
  });
  const neutral = scoreSchool({ ...school, emphasis_tags: [] }, STRONG_PUBLIC, base);
  const ratioUp = withThemes.priority / neutral.priority;
  const ratioDown = s.priority / neutral.priority;
  check('themes move priority by at most 5% either way', ratioUp <= 1.0527 && ratioDown >= 0.947, `up ${ratioUp.toFixed(3)}, down ${ratioDown.toFixed(3)}`);

  const theme = withThemes.reasons.find(r => r.id === 'theme-shown');
  check('theme reason points at the entries', !!theme && (theme.activityIds?.length ?? 0) === 2, theme?.headline ?? '');

  const oos = scoreSchool(school, STRONG_PUBLIC, { ...base, applicant: applicant() });
  check('out of state ranks below in state at a strong public', oos.priority < s.priority, `${oos.priority} < ${s.priority}`);
  const cost = oos.reasons.find(r => r.id === 'residency-out-of-state');
  check('out-of-state reason cites A-1 and costs points', !!cost?.source?.label.startsWith('AAMC FACTS Table A-1') && cost.points < 0, cost?.headline ?? '');

  // An in-state applicant at a school where residency barely matters gets context, not credit.
  const privIn = scoreSchool({ ...school, state: 'CT' }, OPEN_PRIVATE, { ...base, applicant: applicant({ legalState: 'CT' }) });
  const rr = privIn.reasons.filter(r => r.axis === 'residency');
  check('resident at a school with little in-state edge: info, not a plus', rr.every(r => r.tone !== 'plus'), rr.map(r => r.id).join(','));

  const excluded = scoreSchool({ ...school, residency_policy: 'in_state_only', policy_source_url: 'https://example.edu' }, STRONG_PUBLIC, { ...base, applicant: applicant() });
  check('verified exclusion zeroes priority', excluded.priority === 0 && excluded.reasons.some(r => r.id === 'residency-excluded'));

  const gap = s.reasons.find(r => r.id === 'mission-gap');
  check('gap reason names the limiting pillar', !!gap && gap.headline.startsWith(s.fit.limitingPillar), gap?.headline ?? '');
}

// ── Real A-1 data, when the files are present ───────────────────────────────

if (existsSync('data/sources/aamc/facts-a1-2025.xlsx') && existsSync('data/school-registry.json')) {
  console.log('\nReal A-1 tables (local only)');
  const { readA1 } = await import('./data/read-aamc-a1.mjs');
  const registry = JSON.parse(readFileSync('data/school-registry.json', 'utf8'));
  const slugOf = new Map<string, string>();
  for (const s of registry.schools) for (const a of s.aliases['aamc-facts-a1'] ?? []) slugOf.set(a, s.slug);
  const rowsBySlug: Record<string, ResidencyRow[]> = {};
  for (const y of [2023, 2024, 2025]) {
    for (const r of readA1(`data/sources/aamc/facts-a1-${y}.xlsx`).rows) {
      const slug = slugOf.get(r.name);
      if (!slug) continue;
      (rowsBySlug[slug] ??= []).push({ cycle_year: y, applications: r.applications, apps_in_state_pct: r.appsInStatePct, matriculants: r.matriculants, mat_in_state_pct: r.matInStatePct });
    }
  }
  const realCutoffs = preferenceCutoffs(Object.values(rowsBySlug).map(poolResidency));
  console.log(`   terciles: moderate ${realCutoffs.moderate.toFixed(2)}x, strong ${realCutoffs.strong.toFixed(2)}x`);
  const show = (slug: string, info: SchoolResidencyInfo, who: ApplicantResidency) => {
    const a = residencyAccess(info, rowsBySlug[slug] ?? [], who, realCutoffs);
    const p = a.pooled!;
    console.log(`   ${slug.padEnd(20)} ${who.legalState} ${a.group.padEnd(12)} band ${a.band.padEnd(8)} A ${a.multiplier.toFixed(2)}  in ${oneIn(p.rateIn)}, out ${oneIn(p.rateOut)}, ${Math.round(p.seatShareIn * 100)}% of seats to residents`);
    return a;
  };
  const ark = show('arkansas', { state: 'AR' }, applicant());
  check('Arkansas, out of state: strong band, warning', ark.band === 'strong' && ark.warning?.kind === 'no_tie');
  const yale = show('yale', { state: 'CT' }, applicant());
  check('Yale, out of state: A >= 0.95, no warning', yale.multiplier >= 0.95 && !yale.warning);
  const uwId = show('u-washington', WA, applicant({ legalState: 'ID' }));
  check('UW, Idaho resident: regional, A = 1', uwId.group === 'regional' && uwId.multiplier === 1);
  const uwOh = show('u-washington', WA, applicant());
  check('UW, out of region, no tie: warns on the verified policy', uwOh.warning?.kind === 'no_tie', uwOh.band);
  show('texas-a-and-m-vashisht', { state: 'TX' }, applicant());
} else {
  console.log('\nReal A-1 tables: skipped (data/sources/ is not present; it is gitignored).');
}

console.log(`\n${failures === 0 ? 'All school-fit checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
