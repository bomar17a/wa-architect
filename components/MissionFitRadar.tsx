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

// --- 1. The Mission Math Engine ---
const useCompetencyScores = (activities: Activity[]) => {
  return useMemo(() => {
    let inquiry = 1;
    let service = 1;
    let teamwork = 1;
    let clinical = 1;

    activities.forEach((act) => {
      // Helper to sum hours safely
      const hours = act.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
      const type = act.experienceType.toLowerCase();
      const description = act.description ? act.description.toLowerCase() : '';

      // Scientific Inquiry
      if (type.includes('research') || type.includes('lab')) inquiry += Math.floor(hours / 100);
      if (description.includes('publication') || description.includes('published') || description.includes('poster')) inquiry += 2;

      // Service Orientation
      if (type.includes('community service') || type.includes('volunteer')) service += Math.floor(hours / 50);
      if (act.isMostMeaningful && (type.includes('service') || type.includes('volunteer'))) service += 2;

      // Teamwork
      if (type.includes('leadership') || type.includes('military') || type.includes('athletics') || type.includes('sports') || type.includes('extracurricular')) teamwork += Math.floor(hours / 100);

      // Clinical Reliability
      if (type.includes('shadowing') || type.includes('clinical') || type.includes('healthcare') || type.includes('scribe')) clinical += Math.floor(hours / 100);
    });

    return {
      Inquiry: Math.min(inquiry, 10),
      Service: Math.min(service, 10),
      Teamwork: Math.min(teamwork, 10),
      Clinical: Math.min(clinical, 10),
    };
  }, [activities]);
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
  }
];

const HERO_TARGET = {
  name: 'Competitive Avg.',
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
            Visualize your pillar strength vs. 10,000+ accepted profiles.
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
  const actualScore = Math.min(studentScores.Inquiry, activeArchetype.targets.Inquiry) +
    Math.min(studentScores.Service, activeArchetype.targets.Service) +
    Math.min(studentScores.Teamwork, activeArchetype.targets.Teamwork) +
    Math.min(studentScores.Clinical, activeArchetype.targets.Clinical);
  const matchPercentage = Math.round((actualScore / maxPossibleScore) * 100);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-serif">Mission Fit Radar</h2>
          <p className="text-sm text-slate-500 mt-1">Compare your profile against our 5 major medical school archetypes.</p>
        </div>
        {onNavigateToRecommender && (
          <button onClick={onNavigateToRecommender} className="px-5 py-2.5 bg-brand-dark text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" />
            Full School Recommender
          </button>
        )}
      </div>

      {/* Archetype Toggles */}
      <div className="flex flex-wrap gap-2">
        {SCHOOL_ARCHETYPES.map(arch => {
          const isActive = arch.id === activeArchetypeId;
          return (
            <button
              key={arch.id}
              onClick={() => setActiveArchetypeId(arch.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${isActive ? arch.activeColor + ' shadow-md scale-105 border-transparent' : arch.color + ' opacity-70 hover:opacity-100 hover:scale-105'}`}
            >
              {arch.name}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Radar Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="w-full flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{activeArchetype.name}</h3>
              <p className="text-sm text-slate-500 max-w-md">{activeArchetype.description}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-black tracking-tight border border-emerald-100">
              {matchPercentage}% Match
            </div>
          </div>

          <div className="w-full h-[350px] relative mt-4">
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