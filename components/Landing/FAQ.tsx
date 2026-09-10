import React from 'react';
import { SectionHeader } from './SectionHeader';
import { FAQ as FAQ_DATA } from './landingData';

export const FAQ: React.FC = () => (
    <section id="faq" className="relative z-10 py-20 sm:py-28 bg-white border-t border-brand-rule">
        <div className="max-w-3xl mx-auto px-6">
            <SectionHeader eyebrow={FAQ_DATA.eyebrow} heading={FAQ_DATA.heading} />

            <dl className="mt-12 divide-y divide-brand-rule border-t border-brand-rule">
                {FAQ_DATA.items.map((item) => (
                    <div key={item.q} className="py-7">
                        <dt className="font-serif text-xl text-brand-ink mb-3">{item.q}</dt>
                        <dd className="text-slate-600 leading-relaxed">{item.a}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </section>
);
