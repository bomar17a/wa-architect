import React from 'react';
import { FAQ as FAQ_DATA } from './landingData';

export const FAQ: React.FC = () => (
    <section id="faq" className="relative z-10 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-12">{FAQ_DATA.heading}</h2>

            <dl className="space-y-9">
                {FAQ_DATA.items.map((item) => (
                    <div key={item.q}>
                        <dt className="text-lg font-bold text-brand-dark mb-2">{item.q}</dt>
                        <dd className="text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">{item.a}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </section>
);
