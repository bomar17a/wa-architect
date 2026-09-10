import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FINAL_CTA } from './landingData';

export const FinalCTA: React.FC<{ onSignup: () => void }> = ({ onSignup }) => (
    <section className="relative z-10 bg-white pt-4 pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-6">
            <div className="relative overflow-hidden bg-brand-dark rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-16 text-center">
                <div
                    aria-hidden="true"
                    className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-brand-teal/25 blur-[90px]"
                />
                <div
                    aria-hidden="true"
                    className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-brand-gold/10 blur-[90px]"
                />
                <div className="relative z-10">
                    <h2 className="font-serif text-[1.9rem] sm:text-[2.6rem] leading-[1.15] tracking-[-0.015em] text-white mb-5 max-w-2xl mx-auto">
                        {FINAL_CTA.heading}
                    </h2>
                    <p className="text-slate-300 text-[17px] leading-relaxed max-w-xl mx-auto mb-9">
                        {FINAL_CTA.body}
                    </p>
                    <button
                        onClick={onSignup}
                        className="group inline-flex items-center justify-center gap-3 px-9 py-4 bg-brand-teal text-white rounded-full font-extrabold text-xs uppercase tracking-[0.15em] shadow-[0_14px_30px_-12px_rgba(46,107,107,0.9)] transition-all hover:bg-brand-teal-hover hover:-translate-y-0.5 active:scale-95"
                    >
                        {FINAL_CTA.cta}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-4 text-xs text-slate-400">{FINAL_CTA.note}</p>
                </div>
            </div>
        </div>
    </section>
);
