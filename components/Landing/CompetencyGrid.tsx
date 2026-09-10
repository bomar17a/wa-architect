import React from 'react';
import { Check } from 'lucide-react';
import { AAMC_CORE_COMPETENCIES } from '../../constants';
import { SectionHeader } from './SectionHeader';
import { COMPETENCIES, SAMPLE_CAPTION } from './landingData';

export const CompetencyGrid: React.FC = () => {
    const covered = COMPETENCIES.covered as readonly string[];

    return (
        <section className="relative z-10 py-20 sm:py-28">
            <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                <div className="lg:col-span-5">
                    <SectionHeader
                        eyebrow={COMPETENCIES.eyebrow}
                        heading={COMPETENCIES.heading}
                        intro={COMPETENCIES.body}
                    />
                    <p className="mt-5 text-sm text-slate-500 leading-relaxed">{COMPETENCIES.note}</p>
                    <p className="mt-6 text-xs font-bold tabular-nums uppercase tracking-[0.16em] text-brand-teal">
                        {covered.length} of {AAMC_CORE_COMPETENCIES.length} covered in this sample
                    </p>
                </div>

                <div className="lg:col-span-7">
                    <ul className="grid sm:grid-cols-2 gap-2">
                        {AAMC_CORE_COMPETENCIES.map((comp) => {
                            const isCovered = covered.includes(comp);
                            return (
                                <li
                                    key={comp}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                                        isCovered
                                            ? 'bg-white border-brand-teal/30 text-brand-ink'
                                            : 'bg-brand-paper-deep/50 border-brand-rule text-slate-400'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                            isCovered ? 'bg-brand-teal text-white' : 'bg-brand-rule'
                                        }`}
                                    >
                                        {isCovered && <Check className="w-3 h-3" strokeWidth={3} />}
                                    </span>
                                    {comp}
                                    <span className="sr-only">{isCovered ? ' — covered' : ' — no evidence yet'}</span>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="mt-4 text-[11px] text-slate-500">{SAMPLE_CAPTION}</p>
                </div>
            </div>
        </section>
    );
};
