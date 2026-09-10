import React from 'react';
import { SectionHeader } from './SectionHeader';
import { FEATURES } from './landingData';

export const FeatureGrid: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-28 bg-white border-y border-brand-rule">
        <div className="max-w-6xl mx-auto px-6">
            <SectionHeader eyebrow={FEATURES.eyebrow} heading={FEATURES.heading} />

            <dl className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                {FEATURES.items.map((f) => (
                    <div key={f.title} className="border-t border-brand-rule pt-4">
                        <dt className="font-bold text-brand-ink mb-2">{f.title}</dt>
                        <dd className="text-sm text-slate-600 leading-relaxed">{f.body}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </section>
);
