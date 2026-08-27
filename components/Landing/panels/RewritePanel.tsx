import React, { useState } from 'react';
import { REWRITE_PANEL } from '../landingData';

type Version = 'draft' | 'revised';

const SubScores: React.FC<{ scores: Record<string, number> }> = ({ scores }) => (
    <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(scores).map(([name, value]) => {
            const pct = (value / 25) * 100;
            const tone = value >= 18 ? 'bg-brand-success' : value >= 10 ? 'bg-brand-gold' : 'bg-brand-danger';
            return (
                <li key={name}>
                    <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{name}</span>
                        <span className="text-[10px] font-bold tabular-nums text-slate-600">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
                    </div>
                </li>
            );
        })}
    </ul>
);

export const RewritePanel: React.FC = () => {
    const [version, setVersion] = useState<Version>('draft');
    const active = version === 'draft' ? REWRITE_PANEL.draft : REWRITE_PANEL.revised;

    return (
        <div>
            <p className="text-slate-600 leading-relaxed mb-6 max-w-2xl">{REWRITE_PANEL.intro}</p>

            <div role="group" aria-label="Entry version" className="inline-flex p-1 bg-slate-100 rounded-full mb-6">
                {(['draft', 'revised'] as const).map((v) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => setVersion(v)}
                        aria-pressed={version === v}
                        className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                            version === v ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {v === 'draft' ? REWRITE_PANEL.draft.label : REWRITE_PANEL.revised.label}
                    </button>
                ))}
            </div>

            <blockquote
                aria-live="polite"
                className={`rounded-2xl p-5 sm:p-6 mb-6 border text-lg leading-relaxed ${
                    version === 'draft'
                        ? 'bg-slate-50 border-slate-200 text-slate-600'
                        : 'bg-brand-light/60 border-brand-teal/30 text-brand-dark'
                }`}
            >
                {active.text}
            </blockquote>

            <SubScores scores={active.scores} />

            {version === 'revised' && (
                <p className="mt-6 text-sm text-slate-600 leading-relaxed border-l-2 border-brand-gold pl-4">
                    {REWRITE_PANEL.remaining}
                </p>
            )}

            <p className="mt-6 text-xs text-slate-500">{REWRITE_PANEL.badgeNote}</p>
        </div>
    );
};
