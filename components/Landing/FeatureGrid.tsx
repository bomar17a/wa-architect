import React from 'react';
import { FEATURES } from './landingData';

export const FeatureGrid: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-12">{FEATURES.heading}</h2>

            <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
                {FEATURES.items.map((f) => (
                    <div key={f.title}>
                        <dt className="font-bold text-brand-dark mb-2">{f.title}</dt>
                        <dd className="text-sm text-slate-600 leading-relaxed">{f.body}</dd>
                    </div>
                ))}
            </dl>
        </div>
    </section>
);
