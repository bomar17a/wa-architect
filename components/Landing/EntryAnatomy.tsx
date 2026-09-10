import React from 'react';
import { AlertTriangle, Wand2 } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ANATOMY, ANNOTATED_ENTRY } from './landingData';

/**
 * The 2-3-3 shape, shown as a budget rather than described as advice. The left column
 * contrasts how a typical draft spends its 700 characters against how a good one does.
 */

const TYPICAL = [
    { role: 'Duties', pct: 78, tone: 'bg-slate-400' },
    { role: 'Impact', pct: 15, tone: 'bg-slate-300' },
    { role: 'Reflection', pct: 7, tone: 'bg-slate-200' },
];

// Derived from the hero's entry so the two visuals cannot disagree about the same text.
const ENTRY_TONES: Record<string, string> = {
    context: 'bg-slate-300',
    impact: 'bg-brand-teal',
    reflection: 'bg-brand-gold',
};
const ENTRY_TOTAL = ANNOTATED_ENTRY.blocks.reduce((sum, b) => sum + b.text.length, 0);
const BETTER = ANNOTATED_ENTRY.blocks.map((b) => ({
    role: b.role,
    pct: Math.round((b.text.length / ENTRY_TOTAL) * 100),
    tone: ENTRY_TONES[b.id],
}));

const BudgetBar: React.FC<{ label: string; segments: typeof TYPICAL; muted?: boolean }> = ({
    label,
    segments,
    muted,
}) => (
    <div>
        <p
            className={`text-[10px] font-extrabold uppercase tracking-[0.18em] mb-2.5 ${
                muted ? 'text-slate-400' : 'text-brand-ink'
            }`}
        >
            {label}
        </p>
        <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-2.5">
            {segments.map((s) => (
                <div key={s.role} className={s.tone} style={{ width: `${s.pct}%` }} />
            ))}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((s) => (
                <li key={s.role} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span aria-hidden="true" className={`w-2 h-2 rounded-sm ${s.tone}`} />
                    {s.role}
                    <span className="tabular-nums text-slate-400">{s.pct}%</span>
                </li>
            ))}
        </ul>
    </div>
);

export const EntryAnatomy: React.FC = () => (
    <section id="anatomy" className="relative z-10 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
            <SectionHeader eyebrow={ANATOMY.eyebrow} heading={ANATOMY.heading} intro={ANATOMY.intro} />

            <div className="mt-14 grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <div className="lg:col-span-5 bg-white rounded-2xl border border-brand-rule p-6 sm:p-8 space-y-8">
                    <BudgetBar label="What most drafts do" segments={TYPICAL} muted />
                    <div className="border-t border-dashed border-brand-rule" />
                    <BudgetBar label="What the box is for" segments={BETTER} />
                    <p className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed pt-1">
                        <Wand2 className="w-3.5 h-3.5 text-brand-teal shrink-0 mt-0.5" aria-hidden="true" />
                        {ANATOMY.appNote}
                    </p>
                </div>

                <ol className="lg:col-span-7 space-y-5">
                    {ANATOMY.model.map((m, i) => (
                        <li
                            key={m.role}
                            className="bg-white rounded-2xl border border-brand-rule p-6 sm:p-7 flex gap-5"
                        >
                            <span
                                aria-hidden="true"
                                className="font-serif text-2xl text-brand-rule leading-none shrink-0 tabular-nums"
                            >
                                {i + 1}
                            </span>
                            <div>
                                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                                    <h3 className="font-serif text-xl text-brand-ink">{m.role}</h3>
                                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-teal bg-brand-light px-2 py-1 rounded">
                                        {m.budget}
                                    </span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">{m.body}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 gap-5">
                {ANATOMY.notes.map((n) => (
                    <div
                        key={n.title}
                        className="bg-brand-paper-deep/60 border border-brand-rule rounded-2xl p-6 flex gap-4"
                    >
                        <AlertTriangle
                            className="w-4 h-4 text-brand-gold-hover shrink-0 mt-1"
                            aria-hidden="true"
                        />
                        <div>
                            <h3 className="font-bold text-brand-ink mb-1.5">{n.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{n.body}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);
