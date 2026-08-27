import React from 'react';
import { STAKES } from './landingData';

// No scroll-triggered reveals on this page: marketing copy must be present and readable
// without waiting on an IntersectionObserver. The hero's mount animation is enough motion.

export const TheStakes: React.FC = () => (
    <section id="method" className="relative z-10 py-20 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-14 max-w-2xl">
                {STAKES.heading}
            </h2>

            <ol className="grid md:grid-cols-3 gap-10 md:gap-8">
                {STAKES.beats.map((beat, i) => (
                    <li key={beat.title} className="border-t-2 border-brand-teal pt-5">
                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-bold text-brand-dark mb-3">{beat.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{beat.body}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);
