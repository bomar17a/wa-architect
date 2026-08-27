import React from 'react';
import { Check } from 'lucide-react';
import { AAMC_CORE_COMPETENCIES } from '../../constants';
import { COMPETENCIES, SAMPLE_CAPTION } from './landingData';

export const CompetencyGrid: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6 leading-tight">
                    {COMPETENCIES.heading}
                </h2>
                <p className="text-slate-600 leading-relaxed mb-5">{COMPETENCIES.body}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{COMPETENCIES.note}</p>
            </div>

            <div className="lg:col-span-7">
                <ul className="grid sm:grid-cols-2 gap-2">
                    {AAMC_CORE_COMPETENCIES.map((comp) => {
                        const covered = (COMPETENCIES.covered as readonly string[]).includes(comp);
                        return (
                            <li
                                key={comp}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                                    covered
                                        ? 'bg-white border-brand-teal/30 text-brand-dark'
                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                        covered ? 'bg-brand-teal text-white' : 'bg-slate-200'
                                    }`}
                                >
                                    {covered && <Check className="w-3 h-3" strokeWidth={3} />}
                                </span>
                                {comp}
                                <span className="sr-only">{covered ? ' — covered' : ' — no evidence yet'}</span>
                            </li>
                        );
                    })}
                </ul>
                <p className="mt-4 text-[11px] text-slate-500">{SAMPLE_CAPTION}</p>
            </div>
        </div>
    </section>
);
