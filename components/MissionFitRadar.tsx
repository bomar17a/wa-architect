import React, { useMemo, useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Info, Building, ArrowRight, Search, Zap } from 'lucide-react';
import { Activity } from '../types';
import { supabase } from '../services/supabase';

interface MissionFitRadarProps {
  activities: Activity[];
  variant?: 'default' | 'hero';
  onNavigateToRecommender?: () => void;
}

// --- 1. The Mission Math Engine (v2) ---
//
// Each pillar is scored 0–10 against AAMC-researched hour milestones
// for a competitive applicant cycle. Bonus signals layer on top.
//
// Milestones (hours → points):
//   Clinical:  50→2  100→4  200→6  300→8  500+→10  (shadowing at 0.25× weight)
//   Research:  50→2  100→4  200→6  350→8  500+→10
//   Service:   30→2   75→4  150→6  250→8  400+→10  (med volunteering at 0.5× weight)
//   Teamwork:  50→2  100→4  200→6  300→8  400+→10  (non-med employment at 0.5×)
//
// Bonuses (capped at 2pts per pillar):
//   - Per-type bonuses fire ONCE per pillar (Set-guarded)
//   - Per-activity bonuses (MME, competency tags) fire per activity
//   - Longitudinal bonus: +0.25 for activities spanning 12+ months
//   - Narrative quality: +0.1 per "Final" status activity

export function milestone(hours: number, breaks: [number, number][]): number {
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

// Helper: calculate duration in months from date ranges
function calcDurationMonths(dateRanges: Activity['dateRanges']): number {
  const MONTH_MAP: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  };
  let earliest = Infinity;
  let latest = -Infinity;
  dateRanges.forEach(r => {
    const startM = MONTH_MAP[r.startDateMonth] ?? 0;
    const startY = parseInt(r.startDateYear) || 0;
    const endM = MONTH_MAP[r.endDateMonth] ?? 0;
    const endY = parseInt(r.endDateYear) || 0;
    if (startY > 0) earliest = Math.min(earliest, startY * 12 + startM);
    if (endY > 0) latest = Math.max(latest, endY * 12 + endM);
  });
  if (earliest === Infinity || latest === -Infinity) return 0;
  return Math.max(0, latest - earliest);
}

export interface PillarScores {
  Inquiry: number;
  Service: number;
  Teamwork: number;
  Clinical: number;
}

// ── Extracted pure function: usable by both hooks and plain functions ──
export function computeCompetencyScores(activities: Activity[]): PillarScores {
  let clinicalHours = 0;
  let researchHours = 0;
  let serviceHours = 0;
  let teamworkHours = 0;
  let clinicalBonus = 0;
  let researchBonus = 0;
  let serviceBonus = 0;
  let teamworkBonus = 0;

  // Set-based guards for per-type bonuses (fire once per pillar)
  const researchTypeBonuses = new Set<string>();
  const teamworkTypeBonuses = new Set<string>();

  const filledActivities = activities.filter(a => a.status !== 'Empty' && a.experienceType);

  filledActivities.forEach((act) => {
    const hours = act.dateRanges.reduce((sum, r) => sum + (Math.max(parseInt(r.hours) || 0, 0)), 0);
    const type = act.experienceType;
    const desc = (act.description + ' ' + act.mmeEssay + ' ' + act.mmeAction).toLowerCase();
    const comps = act.competencies || [];
    const durationMonths = calcDurationMonths(act.dateRanges);

    // ── SHADOWING (separate from hands-on clinical) ──────────────
    const isShadowing = type === 'Physician Shadowing/Clinical Observation';

    // ── CLINICAL pillar ──────────────────────────────────────────
    const isHandsOnClinical =
      type === 'Paid Employment - Medical/Clinical' ||
      type === 'Healthcare Experience';              // AACOMAS

    // Medical volunteering: full hours → Clinical, 0.5× → Service (fixes double-count)
    const isMedicalVolunteer = type === 'Community Service/Volunteer - Medical/Clinical';

    if (isHandsOnClinical) {
      clinicalHours += hours;
      if (type === 'Paid Employment - Medical/Clinical') clinicalBonus += 0.5;
      if (act.isMostMeaningful) clinicalBonus += 0.5;
      if (comps.some(c => c.includes('Reliability') || c.includes('Service'))) clinicalBonus += 0.25;
      if (durationMonths >= 12) clinicalBonus += 0.25; // longitudinal signal
    }

    if (isMedicalVolunteer) {
      clinicalHours += hours;          // full credit to Clinical
      serviceHours += hours * 0.5;     // half credit to Service (volunteering component)
      if (act.isMostMeaningful) { clinicalBonus += 0.5; serviceBonus += 0.5; }
      if (comps.some(c => c.includes('Reliability') || c.includes('Service'))) clinicalBonus += 0.25;
      if (comps.some(c => c.includes('Cultural') || c.includes('Service'))) serviceBonus += 0.25;
      if (durationMonths >= 12) { clinicalBonus += 0.25; serviceBonus += 0.25; }
    }

    if (isShadowing) {
      clinicalHours += hours * 0.25;   // shadowing at 0.25× weight
      clinicalBonus += 0.5;            // flat bonus: having shadowing at all matters
      if (act.isMostMeaningful) clinicalBonus += 0.25;
    }

    // Depth signal from description keywords
    if ((isHandsOnClinical || isMedicalVolunteer) &&
        (desc.includes('patient') || desc.includes('clinic') || desc.includes('hospital'))) {
      clinicalBonus += 0.25;
    }

    // Narrative quality: Final status activities boost their pillar
    const isFinal = act.status === 'Final';

    if ((isHandsOnClinical || isMedicalVolunteer || isShadowing) && isFinal) clinicalBonus += 0.1;

    // ── RESEARCH pillar ──────────────────────────────────────────
    const isResearch = type === 'Research/Lab' || type === 'Research';

    if (isResearch) {
      researchHours += hours;
      if (act.isMostMeaningful) researchBonus += 0.5;
      if (comps.some(c => c.includes('Scientific') || c.includes('Critical'))) researchBonus += 0.25;
      if (durationMonths >= 12) researchBonus += 0.25;
      if (isFinal) researchBonus += 0.1;
    }

    // Publications / Posters / Presentations: SET-GUARDED (fire once per type)
    if (type === 'Publications' && !researchTypeBonuses.has('publication')) {
      researchBonus += 1.0; researchTypeBonuses.add('publication');
    }
    if (type === 'Presentations/Posters' && !researchTypeBonuses.has('poster')) {
      researchBonus += 1.0; researchTypeBonuses.add('poster');
    }
    // Description-based publication signal (once)
    if (!researchTypeBonuses.has('desc_pub') &&
        (desc.includes('publication') || desc.includes('published') ||
         desc.includes('first author') || desc.includes('co-author'))) {
      researchBonus += 0.75; researchTypeBonuses.add('desc_pub');
    }
    if (!researchTypeBonuses.has('desc_poster') && desc.includes('poster') && type !== 'Presentations/Posters') {
      researchBonus += 0.5; researchTypeBonuses.add('desc_poster');
    }
    if (type === 'Conferences Attended' && !researchTypeBonuses.has('conference')) {
      researchBonus += 0.25; researchTypeBonuses.add('conference');
    }

    // ── SERVICE pillar ───────────────────────────────────────────
    // Non-medical volunteering (medical volunteering handled above with split)
    const isNonMedService =
      type === 'Community Service/Volunteer - Not Medical/Clinical' ||
      type === 'Non-Healthcare Volunteer';

    if (isNonMedService) {
      serviceHours += hours;
      if (act.isMostMeaningful) serviceBonus += 0.75;
      if (comps.some(c => c.includes('Cultural') || c.includes('Service'))) serviceBonus += 0.25;
      if (desc.includes('director') || desc.includes('led') || desc.includes('founded') || desc.includes('president')) serviceBonus += 0.5;
      if (durationMonths >= 12) serviceBonus += 0.25;
      if (isFinal) serviceBonus += 0.1;
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
      teamworkHours += hours;
      // Per-type bonuses: SET-GUARDED (fire once)
      if ((type === 'Leadership - Not Listed Elsewhere' || type === 'Leadership Experience') && !teamworkTypeBonuses.has('leadership')) {
        teamworkBonus += 1.0; teamworkTypeBonuses.add('leadership');
      }
      if (type === 'Military Service' && !teamworkTypeBonuses.has('military')) {
        teamworkBonus += 1.0; teamworkTypeBonuses.add('military');
      }
      if (type === 'Intercollegiate Athletics' && !teamworkTypeBonuses.has('athletics')) {
        teamworkBonus += 0.75; teamworkTypeBonuses.add('athletics');
      }
      // Per-activity bonuses (these CAN fire per activity)
      if (act.isMostMeaningful) teamworkBonus += 0.5;
      if (comps.some(c => c.includes('Teamwork') || c.includes('Oral') || c.includes('Social'))) teamworkBonus += 0.25;
      if (desc.includes('captain') || desc.includes('president') || desc.includes('chair') || desc.includes('founded') || desc.includes('managed')) teamworkBonus += 0.25;
      if (durationMonths >= 12) teamworkBonus += 0.25;
      if (isFinal) teamworkBonus += 0.1;
    }

    // ── NON-MEDICAL EMPLOYMENT → partial Teamwork credit ─────────
    const isNonMedEmployment =
      type === 'Paid Employment - Not Medical/Clinical' ||
      type === 'Non-Healthcare Employment';

    if (isNonMedEmployment) {
      teamworkHours += hours * 0.5;    // 0.5× weight
      if (durationMonths >= 12) teamworkBonus += 0.25;
      if (isFinal) teamworkBonus += 0.1;
    }

    // ── HOBBIES & ARTISTIC ENDEAVORS → small Teamwork credit ─────
    const isHobbyArt = type === 'Hobbies' || type === 'Artistic Endeavors';
    if (isHobbyArt) {
      teamworkHours += hours * 0.25;   // 0.25× weight
      if (!teamworkTypeBonuses.has('hobby_art')) {
        teamworkBonus += 0.25;         // flat bonus for having humanistic interests
        teamworkTypeBonuses.add('hobby_art');
      }
    }
  });

  // ── Convert hours → 0–10 via milestone curves ─────────────────
  const clinicalBase  = milestone(clinicalHours,  [[0,0],[50,2],[100,4],[200,6],[300,8],[500,10]]);
  const researchBase  = milestone(researchHours,  [[0,0],[50,2],[100,4],[200,6],[350,8],[500,10]]);
  const serviceBase   = milestone(serviceHours,   [[0,0],[30,2],[75,4],[150,6],[250,8],[400,10]]);
  const teamworkBase  = milestone(teamworkHours,  [[0,0],[50,2],[100,4],[200,6],[300,8],[400,10]]);

  const clampB = (b: number) => Math.min(b, 2);

  return {
    Inquiry:  Math.min(Math.round((researchBase  + clampB(researchBonus))  * 10) / 10, 10),
    Service:  Math.min(Math.round((serviceBase   + clampB(serviceBonus))   * 10) / 10, 10),
    Teamwork: Math.min(Math.round((teamworkBase  + clampB(teamworkBonus))  * 10) / 10, 10),
    Clinical: Math.min(Math.round((clinicalBase  + clampB(clinicalBonus))  * 10) / 10, 10),
  };
}

// Hook wrapper for React components
export const useCompetencyScores = (activities: Activity[]) => {
  return useMemo(() => computeCompetencyScores(activities), [activities]);
};

// --- 2. The Archetype Data ---
export const SCHOOL_ARCHETYPES = [
  {
    id: 'Investigator',
    name: 'The Investigator',
    dbCategory: 'The Investigator',
    description: 'Top-tier academic centers valuing innovation, publications, and basic science.',
    color: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    activeColor: 'bg-indigo-600 text-white',
    targets: { Inquiry: 10, Service: 5, Teamwork: 6, Clinical: 7 },
  },
  {
    id: 'Advocate',
    name: 'The Advocate',
    dbCategory: 'The Advocate',
    description: 'Social-justice focused schools valuing distance traveled, community service, and health equity.',
    color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    activeColor: 'bg-emerald-600 text-white',
    targets: { Inquiry: 4, Service: 10, Teamwork: 7, Clinical: 7 },
  },
  {
    id: 'Practitioner',
    name: 'The Practitioner',
    dbCategory: 'The Practitioner',
    description: 'Primary care & regional focused; values hands-on clinical reliability.',
    color: 'bg-amber-50 border-amber-100 text-amber-700',
    activeColor: 'bg-amber-500 text-white',
    targets: { Inquiry: 3, Service: 8, Teamwork: 10, Clinical: 10 },
  },
  {
    id: 'Innovator',
    name: 'The Innovator',
    dbCategory: 'The Innovator',
    description: 'Focuses on systems-level changes, tech, healthcare administration, and entrepreneurship.',
    color: 'bg-sky-50 border-sky-100 text-sky-700',
    activeColor: 'bg-sky-500 text-white',
    targets: { Inquiry: 7, Service: 6, Teamwork: 9, Clinical: 7 },
  },
  {
    id: 'Leader',
    name: 'The Leader',
    dbCategory: 'The Leader',
    description: 'Focuses on public policy, advocacy at the structural level, and organized medicine.',
    color: 'bg-rose-50 border-rose-100 text-rose-700',
    activeColor: 'bg-rose-500 text-white',
    targets: { Inquiry: 5, Service: 8, Teamwork: 10, Clinical: 8 },
  },
  {
    id: 'Balanced',
    name: 'The Balanced',
    dbCategory: 'The Balanced',
    description: 'Well-rounded programs valuing equal depth across all four pillars with no single dominant emphasis.',
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    activeColor: 'bg-slate-700 text-white',
    targets: { Inquiry: 7, Service: 7, Teamwork: 7, Clinical: 7 },
  }
];

const HERO_TARGET = {
  name: 'Competitive Benchmark',
  targets: { Inquiry: 7, Service: 8, Teamwork: 7, Clinical: 8 }
};

// --- 3. The Component ---
export const MissionFitRadar: React.FC<MissionFitRadarProps> = ({ activities, variant = 'default', onNavigateToRecommender }) => {
  const studentScores = useCompetencyScores(activities);

  const [activeArchetypeId, setActiveArchetypeId] = useState<string>('');
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Auto-detect best fit on mount or when scores change
  useEffect(() => {
    let bestMatchId = SCHOOL_ARCHETYPES[0].id;
    let smallestDeficit = Infinity;

    SCHOOL_ARCHETYPES.forEach(arch => {
      let deficit = 0;
      if (studentScores.Inquiry < arch.targets.Inquiry) deficit += arch.targets.Inquiry - studentScores.Inquiry;
      if (studentScores.Service < arch.targets.Service) deficit += arch.targets.Service - studentScores.Service;
      if (studentScores.Teamwork < arch.targets.Teamwork) deficit += arch.targets.Teamwork - studentScores.Teamwork;
      if (studentScores.Clinical < arch.targets.Clinical) deficit += arch.targets.Clinical - studentScores.Clinical;

      if (deficit < smallestDeficit) {
        smallestDeficit = deficit;
        bestMatchId = arch.id;
      }
    });

    if (!activeArchetypeId) {
      setActiveArchetypeId(bestMatchId);
    }
  }, [studentScores, activeArchetypeId]);

  const activeArchetype = useMemo(() => {
    return SCHOOL_ARCHETYPES.find(a => a.id === activeArchetypeId) || SCHOOL_ARCHETYPES[0];
  }, [activeArchetypeId]);

  // Fetch top 5 schools for active archetype
  useEffect(() => {
    if (!activeArchetype) return;

    const fetchSchools = async () => {
      setLoadingSchools(true);
      const { data, error } = await supabase
        .from('medical_schools')
        .select('*')
        .eq('primary_category', activeArchetype.dbCategory)
        .limit(5);

      if (!error && data) {
        setSchools(data);
      }
      setLoadingSchools(false);
    };

    fetchSchools();
  }, [activeArchetype]);

  if (variant === 'hero') {
    const data = [
      { subject: 'Inquiry', student: studentScores.Inquiry, target: HERO_TARGET.targets.Inquiry, fullMark: 10 },
      { subject: 'Service', student: studentScores.Service, target: HERO_TARGET.targets.Service, fullMark: 10 },
      { subject: 'Teamwork', student: studentScores.Teamwork, target: HERO_TARGET.targets.Teamwork, fullMark: 10 },
      { subject: 'Clinical', student: studentScores.Clinical, target: HERO_TARGET.targets.Clinical, fullMark: 10 },
    ];

    return (
      <div className="w-full flex flex-col items-center justify-center p-0">
        <div className="w-full h-[300px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, dy: 4 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />

              <Radar
                name="Admitted Student Avg."
                dataKey="target"
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="#cbd5e1"
                fillOpacity={0.2}
              />

              <Radar
                name="Your Profile"
                dataKey="student"
                stroke="#2E6B6B"
                strokeWidth={3}
                fill="#2E6B6B"
                fillOpacity={0.5}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-in-out"
                dot={{ r: 3, fill: "#2E6B6B", strokeWidth: 2, stroke: "#fff" }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ bottom: 0, fontSize: '10px', fontWeight: '600', color: '#64748b' }}
              />
              <RechartsTooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                itemStyle={{ color: '#1e293b' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center px-4">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Visualize your pillar strength against competitive applicant benchmarks.
          </p>
        </div>
      </div>
    );
  }

  const data = [
    { subject: 'Inquiry', student: studentScores.Inquiry, school: activeArchetype.targets.Inquiry, fullMark: 10 },
    { subject: 'Service', student: studentScores.Service, school: activeArchetype.targets.Service, fullMark: 10 },
    { subject: 'Teamwork', student: studentScores.Teamwork, school: activeArchetype.targets.Teamwork, fullMark: 10 },
    { subject: 'Clinical', student: studentScores.Clinical, school: activeArchetype.targets.Clinical, fullMark: 10 },
  ];

  const gaps = [
    { subject: 'Inquiry', need: activeArchetype.targets.Inquiry - studentScores.Inquiry, tip: 'log more research entries, lab hours, or aim for a publication.' },
    { subject: 'Service', need: activeArchetype.targets.Service - studentScores.Service, tip: 'increase your community service and volunteering hours.' },
    { subject: 'Teamwork', need: activeArchetype.targets.Teamwork - studentScores.Teamwork, tip: 'take on leadership roles, sports, or military experiences.' },
    { subject: 'Clinical', need: activeArchetype.targets.Clinical - studentScores.Clinical, tip: 'seek more shadowing, scribing, or direct patient care exposure.' }
  ].filter(g => g.need > 0);

  const maxPossibleScore = activeArchetype.targets.Inquiry + activeArchetype.targets.Service + activeArchetype.targets.Teamwork + activeArchetype.targets.Clinical;

  // Weighted cosine-style match:
  // Each archetype target acts as the "weight" of that pillar.
  // We credit (student / target) per pillar, capped at 1.0 (no bonus for exceeding target).
  // Then weight each pillar by how much the archetype actually cares about it (its target score).
  // This means a 1-point gap in Clinical (target=10) is penalized more than a gap in Inquiry (target=3)
  // when evaluating a Practitioner archetype that highly values clinical.
  const pillars = ['Inquiry','Service','Teamwork','Clinical'] as const;
  const weightedScore = pillars.reduce((acc, p) => {
    const target = activeArchetype.targets[p];
    const student = studentScores[p];
    const ratio = target > 0 ? Math.min(student / target, 1.0) : 1.0;
    return acc + ratio * target;   // weight = target, contribution = ratio × weight
  }, 0);
  const matchPercentage = Math.round((weightedScore / maxPossibleScore) * 100);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-serif">Mission Fit Radar</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Compare your profile against our 5 major medical school archetypes.</p>
        </div>
        {onNavigateToRecommender && (
          <button onClick={onNavigateToRecommender} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-brand-dark text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2 self-start sm:self-auto">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Full School Recommender</span>
            <span className="sm:hidden">Schools</span>
          </button>
        )}
      </div>

      {/* Archetype Toggles */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {SCHOOL_ARCHETYPES.map(arch => {
          const isActive = arch.id === activeArchetypeId;
          return (
            <button
              key={arch.id}
              onClick={() => setActiveArchetypeId(arch.id)}
              className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 border ${isActive ? arch.activeColor + ' shadow-md scale-105 border-transparent' : arch.color + ' opacity-70 hover:opacity-100 hover:scale-105'}`}
            >
              {arch.name}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Radar Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col">
          <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">{activeArchetype.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md">{activeArchetype.description}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-black tracking-tight border border-emerald-100 self-start sm:self-auto shrink-0">
              {matchPercentage}% Match
            </div>
          </div>

          <div className="w-full h-[280px] sm:h-[350px] relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar name={activeArchetype.name} dataKey="school" stroke="none" fill="#94a3b8" fillOpacity={0.2} />
                <Radar name="You" dataKey="student" stroke="#2E6B6B" strokeWidth={3} fill="#2E6B6B" fillOpacity={0.3} isAnimationActive={true} dot={{ r: 4, fill: "#2E6B6B" }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontSize: '13px', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Gap Analysis & Schools */}
        <div className="flex flex-col gap-6">
          {/* Gap Analysis */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              Gap Analysis
            </h3>
            {gaps.length === 0 ? (
              <div className="text-emerald-600 bg-emerald-50 p-4 rounded-xl text-sm font-medium border border-emerald-100">
                Your profile fully covers the primary targets for this archetype!
              </div>
            ) : (
              <div className="space-y-3">
                {gaps.map(g => (
                  <div key={g.subject} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 text-sm">{g.subject} Deficit</span>
                      <span className="text-rose-500 text-xs font-black">-{g.need} pts</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">To improve, {g.tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Schools Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-brand-teal" />
              Top Matches
            </h3>
            {loadingSchools ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {schools.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No schools found for this archetype.</p>
                ) : (
                  schools.map((school, idx) => (
                    <div key={school.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-teal/30 transition-colors">
                      <h4 className="text-sm font-bold text-slate-700 line-clamp-1" title={school.school_name}>{school.school_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">{school.degree_type}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">{school.application_system}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {onNavigateToRecommender && schools.length > 0 && (
              <button onClick={onNavigateToRecommender} className="w-full mt-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-brand-dark transition-colors flex items-center justify-center gap-2">
                View All Matches <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
