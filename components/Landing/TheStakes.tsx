import React from 'react';
import { SectionHeader } from './SectionHeader';
import { STAKES } from './landingData';

// No scroll-triggered reveals on this page: marketing copy must be present and readable
// without waiting on an IntersectionObserver. The hero's mount animation is enough motion.

export const TheStakes: React.FC = () => (
    <section id="method" className="relative z-10 py-20 sm:py-28 bg-white border-y border-brand-rule">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                <div className="lg:col-span-5">
                    <SectionHeader
                        eyebrow={STAKES.eyebrow}
                        heading={STAKES.heading}
                        intro={STAKES.intro}
                    />
                </div>

                <ul className="lg:col-span-7 space-y-px bg-brand-rule rounded-2xl overflow-hidden border border-brand-rule">
                    {STAKES.questions.map((q) => (
                        <li key={q} className="bg-white px-5 sm:px-7 py-5 flex items-start gap-4">
                            <span aria-hidden="true" className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-teal shrink-0" />
                            <p className="font-serif italic text-[17px] sm:text-lg text-brand-ink leading-snug">
                                {q}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>

            <ol className="mt-16 sm:mt-20 grid md:grid-cols-3 gap-10 md:gap-8">
                {STAKES.beats.map((beat, i) => (
                    <li key={beat.title} className="border-t-2 border-brand-teal pt-5">
                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-3 tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-serif text-xl text-brand-ink mb-3">{beat.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{beat.body}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);
