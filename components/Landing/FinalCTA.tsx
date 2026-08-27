import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FINAL_CTA } from './landingData';

export const FinalCTA: React.FC<{ onSignup: () => void }> = ({ onSignup }) => (
    <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20 sm:pb-24">
        <div className="relative overflow-hidden bg-brand-dark rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-14 text-center">
            <div aria-hidden="true" className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-teal/20 blur-[80px]" />
            <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{FINAL_CTA.heading}</h2>
                <p className="text-slate-300 leading-relaxed max-w-xl mx-auto mb-8">{FINAL_CTA.body}</p>
                <button
                    onClick={onSignup}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-teal text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-teal/20 transition-all hover:bg-brand-teal-hover hover:-translate-y-0.5 active:scale-95"
                >
                    {FINAL_CTA.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="mt-4 text-xs text-slate-400">{FINAL_CTA.note}</p>
            </div>
        </div>
    </section>
);
