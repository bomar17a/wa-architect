import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SEQUENCE } from './landingData';

export const WriteThisFirst: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-8 leading-tight">
                {SEQUENCE.heading}
            </h2>

            <div className="space-y-5 text-lg text-slate-600 leading-relaxed">
                {SEQUENCE.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                ))}
            </div>

            <ol className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                {SEQUENCE.flow.map((step, i) => (
                    <React.Fragment key={step}>
                        <li className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-center shadow-sm">
                            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal mb-1.5">
                                Step {i + 1}
                            </span>
                            <span className="text-sm font-bold text-brand-dark">{step}</span>
                        </li>
                        {i < SEQUENCE.flow.length - 1 && (
                            <ArrowRight
                                aria-hidden="true"
                                className="w-5 h-5 text-slate-300 shrink-0 self-center rotate-90 sm:rotate-0"
                            />
                        )}
                    </React.Fragment>
                ))}
            </ol>
        </div>
    </section>
);
