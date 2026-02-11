import React, { useMemo } from 'react';
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
import { Info } from 'lucide-react';
import { Activity } from '../types';

interface MissionFitRadarProps {
  activities: Activity[];
  variant?: 'default' | 'hero';
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
      if (type.includes('research') || type.includes('lab')) {
        inquiry += Math.floor(hours / 100);
      }
      if (description.includes('publication') || description.includes('published') || description.includes('poster')) {
        inquiry += 2;
      }

      // Service Orientation
      if (type.includes('community service') || type.includes('volunteer')) {
        service += Math.floor(hours / 50);
      }
      if (act.isMostMeaningful && (type.includes('service') || type.includes('volunteer'))) {
        service += 2;
      }

      // Teamwork
      if (
        type.includes('leadership') ||
        type.includes('military') ||
        type.includes('athletics') ||
        type.includes('sports') ||
        type.includes('extracurricular')
      ) {
        teamwork += Math.floor(hours / 100);
      }

      // Clinical Reliability
      if (
        type.includes('shadowing') ||
        type.includes('clinical') ||
        type.includes('healthcare') ||
        type.includes('scribe')
      ) {
        clinical += Math.floor(hours / 100);
      }
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
const SCHOOL_ARCHETYPES = [
  {
    id: 'investigator',
    name: 'The Investigator',
    description: 'Top-tier academic centers valuing innovation, publications, and basic science.',
    color: 'bg-indigo-50 border-indigo-100', // Kept for reference, logic handled in map
    targets: { Inquiry: 10, Service: 5, Teamwork: 6, Clinical: 7 },
  },
  {
    id: 'advocate',
    name: 'The Advocate',
    description: 'Social-justice focused schools valuing distance traveled, community service, and health equity.',
    color: 'bg-emerald-50 border-emerald-100',
    targets: { Inquiry: 4, Service: 10, Teamwork: 7, Clinical: 7 },
  },
  {
    id: 'practitioner',
    name: 'The Practitioner',
    description: 'Primary care & regional focused; values hands-on clinical reliability.',
    color: 'bg-amber-50 border-amber-100',
    targets: { Inquiry: 3, Service: 8, Teamwork: 10, Clinical: 10 },
  },
];

const HERO_TARGET = {
  name: 'Competitive Avg.',
  targets: { Inquiry: 7, Service: 8, Teamwork: 7, Clinical: 8 }
};

// --- 3. The Component ---
export const MissionFitRadar: React.FC<MissionFitRadarProps> = ({ activities, variant = 'default' }) => {
  const studentScores = useCompetencyScores(activities);

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
    )
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-serif">Mission Fit Radar</h2>
          <p className="text-sm text-slate-500">Compare your profile against common medical school archetypes.</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SCHOOL_ARCHETYPES.map((archetype) => {
          const data = [
            { subject: 'Inquiry', student: studentScores.Inquiry, school: archetype.targets.Inquiry, fullMark: 10 },
            { subject: 'Service', student: studentScores.Service, school: archetype.targets.Service, fullMark: 10 },
            { subject: 'Teamwork', student: studentScores.Teamwork, school: archetype.targets.Teamwork, fullMark: 10 },
            { subject: 'Clinical', student: studentScores.Clinical, school: archetype.targets.Clinical, fullMark: 10 },
          ];

          return (
            <div
              key={archetype.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 hover:border-brand-teal/30"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-700 text-sm tracking-tight">{archetype.name}</h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                  <div className="absolute right-0 top-6 w-48 p-3 bg-brand-dark text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    {archetype.description}
                  </div>
                </div>
              </div>

              {/* Card Content (Chart) */}
              <div className="p-4 flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />

                    {/* Layer 1: Target School (Gray Fill) */}
                    <Radar
                      name={archetype.name}
                      dataKey="school"
                      stroke="none"
                      fill="#94a3b8"
                      fillOpacity={0.2}
                    />

                    {/* Layer 2: Student (Brand Teal Outline) */}
                    <Radar
                      name="You"
                      dataKey="student"
                      stroke="#2E6B6B"
                      strokeWidth={3}
                      fill="#2E6B6B"
                      fillOpacity={0.2}
                      isAnimationActive={true}
                      dot={{ r: 3, fill: "#2E6B6B" }}
                    />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gap Analysis Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-300"></div>
          <span>School Benchmark</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-brand-teal bg-brand-teal/10"></div>
          <span>Your Profile</span>
        </div>
        <div className="h-4 w-px bg-slate-300 hidden md:block"></div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Inside Gray =</span>
            <span className="font-bold text-rose-500">Deficit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Matches Gray =</span>
            <span className="font-bold text-brand-teal">Fit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Outside Gray =</span>
            <span className="font-bold text-brand-gold">Spike</span>
          </div>
        </div>
      </div>
    </div>
  );
};