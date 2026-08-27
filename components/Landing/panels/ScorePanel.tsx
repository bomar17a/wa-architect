import React from 'react';
import { ScoreDial } from '../../Dashboard/ScoreDial';
import { SAMPLE_SCORE, SCORE_PANEL } from '../landingData';

export const ScorePanel: React.FC = () => (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
            <p className="text-slate-600 leading-relaxed mb-6">{SCORE_PANEL.intro}</p>
            <div className="flex items-center gap-5 mb-6">
                <ScoreDial score={SAMPLE_SCORE.score} level={SAMPLE_SCORE.level} size={104} />
                <p className="text-sm text-slate-600 leading-relaxed">{SAMPLE_SCORE.topGap}</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-4">
                {SCORE_PANEL.disclosure}
            </p>
        </div>

        <ul className="space-y-5">
            {SAMPLE_SCORE.pillars.map((p) => {
                const pct = Math.min(100, Math.round((p.hours / p.target) * 100));
                const met = p.hours >= p.target;
                return (
                    <li key={p.name}>
                        <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.name}</span>
                            <span className={`text-xs font-bold tabular-nums ${met ? 'text-brand-success' : 'text-slate-500'}`}>
                                {p.hours} / {p.target}h
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${met ? 'bg-brand-success' : 'bg-brand-gold'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    </div>
);
