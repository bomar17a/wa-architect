import React, { useRef, useState } from 'react';
import { DEMO, DemoTabId, SAMPLE_CAPTION } from './landingData';
import { SectionHeader } from './SectionHeader';
import { ScorePanel } from './panels/ScorePanel';
import { RewritePanel } from './panels/RewritePanel';
import { ThemesPanel } from './panels/ThemesPanel';
import { MissionFitPanel } from './panels/MissionFitPanel';

const PANELS: Record<DemoTabId, React.FC> = {
    score: ScorePanel,
    rewrite: RewritePanel,
    themes: ThemesPanel,
    fit: MissionFitPanel,
};

export const ProductFrame: React.FC = () => {
    const [active, setActive] = useState<DemoTabId>('score');
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const onKeyDown = (e: React.KeyboardEvent) => {
        const ids = DEMO.tabs.map((t) => t.id);
        const i = ids.indexOf(active);
        let next: DemoTabId | null = null;

        if (e.key === 'ArrowRight') next = ids[(i + 1) % ids.length];
        else if (e.key === 'ArrowLeft') next = ids[(i - 1 + ids.length) % ids.length];
        else if (e.key === 'Home') next = ids[0];
        else if (e.key === 'End') next = ids[ids.length - 1];

        if (next) {
            e.preventDefault();
            setActive(next);
            tabRefs.current[next]?.focus();
        }
    };

    return (
        <section id="demo" className="relative z-10 py-20 sm:py-28 bg-white border-y border-brand-rule">
            <div className="max-w-6xl mx-auto px-6">
                <SectionHeader
                    eyebrow={DEMO.eyebrow}
                    heading={DEMO.heading}
                    intro={DEMO.sub}
                    className="mb-12"
                />

                <div className="bg-brand-paper border border-brand-rule rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden">
                    <div
                        role="tablist"
                        aria-label="Product demonstrations"
                        onKeyDown={onKeyDown}
                        className="flex gap-1 p-2 border-b border-brand-rule bg-white overflow-x-auto scrollbar-hide"
                    >
                        {DEMO.tabs.map((tab) => (
                            <button
                                key={tab.id}
                                ref={(el) => { tabRefs.current[tab.id] = el; }}
                                role="tab"
                                id={`demo-tab-${tab.id}`}
                                aria-selected={active === tab.id}
                                aria-controls={`demo-panel-${tab.id}`}
                                tabIndex={active === tab.id ? 0 : -1}
                                onClick={() => setActive(tab.id)}
                                className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-[0.14em] transition-colors ${
                                    active === tab.id
                                        ? 'bg-brand-teal text-white'
                                        : 'text-slate-500 hover:text-brand-dark hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        {DEMO.tabs.map((tab) => {
                            const Panel = PANELS[tab.id];
                            return (
                                <div
                                    key={tab.id}
                                    role="tabpanel"
                                    id={`demo-panel-${tab.id}`}
                                    aria-labelledby={`demo-tab-${tab.id}`}
                                    hidden={active !== tab.id}
                                >
                                    <Panel />
                                </div>
                            );
                        })}
                    </div>

                    <p className="px-6 sm:px-8 lg:px-10 py-4 border-t border-brand-rule text-[11px] text-slate-500">
                        {SAMPLE_CAPTION}
                    </p>
                </div>
            </div>
        </section>
    );
};
