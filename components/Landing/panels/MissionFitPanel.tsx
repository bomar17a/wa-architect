import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { FIT_PANEL } from '../landingData';

/**
 * Deliberately not the app's <MissionFitRadar>. That component reads profile context and
 * fetches schools from Supabase on mount, which has no business firing on a logged-out
 * marketing page. Same four pillars, same visual language, static sample data.
 */
export const MissionFitPanel: React.FC = () => (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Closest archetype</p>
            <p className="text-2xl font-bold text-brand-dark mb-2">{FIT_PANEL.archetype}</p>
            <p className="text-slate-600 leading-relaxed mb-6">{FIT_PANEL.archetypeDesc}</p>
            <p className="text-slate-600 leading-relaxed mb-6">{FIT_PANEL.body}</p>
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                {FIT_PANEL.radarNote}
            </p>
        </div>

        <div className="w-full h-[320px]" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={FIT_PANEL.radar as unknown as Record<string, unknown>[]}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                        name="Archetype target"
                        dataKey="target"
                        stroke="#cbd5e1"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        fill="#cbd5e1"
                        fillOpacity={0.2}
                    />
                    <Radar
                        name="Sample profile"
                        dataKey="student"
                        stroke="#2E6B6B"
                        strokeWidth={3}
                        fill="#2E6B6B"
                        fillOpacity={0.45}
                        dot={{ r: 3, fill: '#2E6B6B', strokeWidth: 2, stroke: '#fff' }}
                    />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{ bottom: 0, fontSize: '11px', fontWeight: 600, color: '#64748b' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    </div>
);
