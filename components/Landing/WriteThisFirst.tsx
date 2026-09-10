import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { SEQUENCE } from './landingData';

export const WriteThisFirst: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-6">
            <SectionHeader eyebrow={SEQUENCE.eyebrow} heading={SEQUENCE.heading} />

            <div className="mt-8 space-y-5 text-[17px] text-slate-600 leading-relaxed">
                {SEQUENCE.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                ))}
            </div>

            <ol className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                {SEQUENCE.flow.map((step, i) => (
                    <React.Fragment key={step}>
                        <li className="flex-1 bg-white border border-brand-rule rounded-2xl px-5 py-5 text-center">
                            <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-teal mb-2">
                                Step {i + 1}
                            </span>
                            <span className="font-serif text-lg text-brand-ink">{step}</span>
                        </li>
                        {i < SEQUENCE.flow.length - 1 && (
                            <ArrowRight
                                aria-hidden="true"
                                className="w-5 h-5 text-brand-rule shrink-0 self-center rotate-90 sm:rotate-0"
                            />
                        )}
                    </React.Fragment>
                ))}
            </ol>
        </div>
    </section>
);
