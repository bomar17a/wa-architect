import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { THEMES_PANEL } from '../landingData';

export const ThemesPanel: React.FC = () => (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="relative overflow-hidden bg-slate-900 rounded-[1.75rem] p-6 sm:p-8">
            <div aria-hidden="true" className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-brand-teal/20 blur-[60px]" />
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">You read as</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-5">{THEMES_PANEL.readsAs}</p>
                <p className="text-slate-300 leading-relaxed">{THEMES_PANEL.coreNarrative}</p>
                <p className="mt-6 pt-5 border-t border-slate-700/60 text-[11px] text-slate-500">
                    {THEMES_PANEL.disclaimer}
                </p>
            </div>
        </div>

        <div className="space-y-7">
            <div>
                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-success mb-3">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Working
                </h4>
                <ul className="space-y-2">
                    {THEMES_PANEL.working.map((w) => (
                        <li key={w} className="text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">
                            {w}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-gold-hover mb-3">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    Missing chapter
                </h4>
                <p className="text-slate-600 leading-relaxed pl-4 border-l-2 border-brand-gold">
                    {THEMES_PANEL.missingChapter}
                </p>
            </div>
        </div>
    </div>
);
