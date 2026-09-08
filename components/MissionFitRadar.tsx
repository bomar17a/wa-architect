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
import { Building, ArrowRight, Search, Zap } from 'lucide-react';
import { Activity } from '../types';
import { supabase } from '../services/supabase';
import { useProfile } from '../contexts/ProfileContext';
import {
  computeCompetency,
  computeCompleteness,
  computeMatch,
  bestFitArchetype,
  hoursToReach,
  SCHOOL_ARCHETYPES,
  type Pillar,
} from '../utils/missionFit';

// The scoring engine lives in utils/missionFit.ts so the recommender, the readiness
// score, and the calibration harness all read from one source. Re-exported here
// because several components already import it from this path.
export {
  milestone,
  calcDurationMonths,
  computeCompetency,
  computeCompetencyScores,
  computeCompleteness,
  computeMatch,
  bestFitArchetype,
  hoursToReach,
  SCHOOL_ARCHETYPES,
  PILLARS,
} from '../utils/missionFit';
export type { PillarScores, Pillar, CompetencyResult, MatchResult, Completeness } from '../utils/missionFit';

interface MissionFitRadarProps {
  activities: Activity[];
  variant?: 'default' | 'hero';
  onNavigateToRecommender?: () => void;
}

export const useCompetencyScores = (activities: Activity[]) => {
  return useMemo(() => computeCompetency(activities).scores, [activities]);
};

const HERO_TARGET = {
  name: 'Competitive Benchmark',
  targets: { Inquiry: 6.5, Service: 6.5, Teamwork: 6.5, Clinical: 7 },
};

const GAP_TIPS: Record<Pillar, string> = {
  Inquiry: 'research or lab hours',
  Service: 'community service hours',
  Teamwork: 'leadership, teaching, or team hours',
  Clinical: 'hands-on clinical hours',
};

// --- 3. The Component ---
export const MissionFitRadar: React.FC<MissionFitRadarProps> = ({ activities, variant = 'default', onNavigateToRecommender }) => {
  const { profile } = useProfile();
  const { scores: studentScores, hours: pillarHours } = useMemo(() => computeCompetency(activities), [activities]);
  const completeness = useMemo(() => computeCompleteness(activities), [activities]);

  const [activeArchetypeId, setActiveArchetypeId] = useState<string>('');
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Pick the starting archetype once, from the onboarding "North Star" if the user
  // set one. Deliberately not re-run when scores change: the toggles are the user's
  // to drive, and yanking the selected archetype out from under them mid-edit would
  // be worse than leaving a stale pick they can change themselves.
  useEffect(() => {
    if (activeArchetypeId) return;
    const northStar = profile?.northStarArchetypes?.[0];
    const initialId = northStar && SCHOOL_ARCHETYPES.some(a => a.id === northStar)
      ? northStar
      : bestFitArchetype(studentScores).id;
    setActiveArchetypeId(initialId);
  }, [studentScores, activeArchetypeId, profile]);

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
                name="Archetype Target"
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

  // Deficits are reported in hours rather than points, because "you are 7.0 points
  // short on Clinical" is not something anyone can act on.
  const gaps = (['Inquiry', 'Service', 'Teamwork', 'Clinical'] as Pillar[])
    .map(p => {
      const need = activeArchetype.targets[p] - studentScores[p];
      const hoursNeeded = Math.max(0, hoursToReach(p, activeArchetype.targets[p]) - Math.round(pillarHours[p]));
      return { subject: p, need, hoursNeeded, tip: GAP_TIPS[p] };
    })
    .filter(g => g.need > 0)
    .sort((a, b) => b.need - a.need);

  const match = computeMatch(studentScores, activeArchetype.targets, completeness.factor);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-serif">Mission Fit Radar</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Compare your profile against our 6 major medical school archetypes.</p>
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
            <div className="flex flex-col items-start sm:items-end gap-1 self-start sm:self-auto shrink-0">
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-black tracking-tight border border-emerald-100">
                {match.match}% Match
              </div>
              {!completeness.isComplete && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {completeness.activityCount} of 15 activities — provisional
                </span>
              )}
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
                      <span className="font-bold text-slate-700 text-sm">{g.subject}</span>
                      <span className="text-rose-500 text-xs font-black">
                        {g.hoursNeeded > 0 ? `~${g.hoursNeeded.toLocaleString()}h short` : `-${g.need.toFixed(1)} pts`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {g.hoursNeeded > 0
                        ? `About ${g.hoursNeeded.toLocaleString()} more ${g.tip} would reach this archetype's target.`
                        : `Add depth here: ${g.tip}.`}
                    </p>
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
