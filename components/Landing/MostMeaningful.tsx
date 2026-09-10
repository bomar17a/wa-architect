import React from 'react';
import { SectionHeader } from './SectionHeader';
import { MOST_MEANINGFUL, MME_LIMIT_LABEL } from './landingData';

export const MostMeaningful: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-28 bg-brand-light border-y border-brand-teal/15">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
                <SectionHeader
                    eyebrow={MOST_MEANINGFUL.eyebrow}
                    heading={MOST_MEANINGFUL.heading}
                    intro={MOST_MEANINGFUL.intro}
                />

                <div className="mt-8 space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed bg-white/70 border border-brand-teal/20 rounded-2xl p-5">
                        {MOST_MEANINGFUL.scorerNote}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-brand-gold">
                        {MOST_MEANINGFUL.unusedNote}
                    </p>
                </div>
            </div>

            <ol className="lg:col-span-7 relative">
                <span
                    aria-hidden="true"
                    className="absolute left-[19px] top-4 bottom-4 w-px bg-brand-teal/25"
                />
                {MOST_MEANINGFUL.beats.map((b) => (
                    <li key={b.letter} className="relative flex gap-5 pb-7 last:pb-0">
                        <span className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-white border border-brand-teal/30 text-brand-teal font-serif text-lg flex items-center justify-center">
                            {b.letter}
                        </span>
                        <div className="pt-1.5">
                            <h3 className="font-bold text-brand-ink mb-1.5">{b.role}</h3>
                            <p className="text-slate-600 leading-relaxed">{b.body}</p>
                        </div>
                    </li>
                ))}
                <li className="mt-2 pl-[60px] text-[11px] uppercase tracking-[0.16em] font-extrabold text-brand-teal/70">
                    {MME_LIMIT_LABEL}
                </li>
            </ol>
        </div>
    </section>
);
