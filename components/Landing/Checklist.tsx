import React from 'react';
import { SectionHeader } from './SectionHeader';
import { CHECKLIST } from './landingData';

/**
 * Editorial, not a product feature — nothing in the app tracks these boxes. It is here
 * because it is the most useful page a visitor can leave with, and it is honest about
 * which half the tool actually does.
 */
export const Checklist: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-6">
            <SectionHeader eyebrow={CHECKLIST.eyebrow} heading={CHECKLIST.heading} intro={CHECKLIST.intro} />

            <ol className="mt-12 grid sm:grid-cols-2 gap-x-10 gap-y-px sm:gap-y-0">
                {CHECKLIST.items.map((item, i) => (
                    <li
                        key={item}
                        className="flex items-start gap-4 py-4 border-b border-brand-rule"
                    >
                        <span className="mt-0.5 w-6 h-6 shrink-0 rounded-md border border-brand-rule bg-white text-[11px] font-bold tabular-nums text-slate-400 flex items-center justify-center">
                            {i + 1}
                        </span>
                        <p className="text-slate-700 leading-relaxed">{item}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);
