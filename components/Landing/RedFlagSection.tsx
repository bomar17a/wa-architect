import React from 'react';
import { RED_FLAGS } from './landingData';

export const RedFlagSection: React.FC = () => (
    <section className="relative z-10 py-20 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{RED_FLAGS.heading}</h2>
            <p className="text-slate-400 max-w-2xl mb-12 leading-relaxed">{RED_FLAGS.intro}</p>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-9">
                {RED_FLAGS.items.map((item) => (
                    <li key={item.title} className="border-t border-slate-700 pt-4">
                        <h3 className="font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    </section>
);
