import React from 'react';
import { SectionHeader } from './SectionHeader';
import { RED_FLAGS } from './landingData';

export const RedFlagSection: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-28 bg-brand-dark text-white">
        <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
                eyebrow={RED_FLAGS.eyebrow}
                heading={RED_FLAGS.heading}
                intro={RED_FLAGS.intro}
                tone="dark"
            />

            <ul className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                {RED_FLAGS.items.map((item, i) => (
                    <li key={item.title} className="border-t border-white/15 pt-4">
                        <span className="block text-[10px] font-extrabold tabular-nums text-brand-gold/70 mb-2">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-bold text-white mb-2 leading-snug">{item.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    </section>
);
