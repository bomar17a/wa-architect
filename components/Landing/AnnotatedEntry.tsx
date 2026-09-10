import React from 'react';
import { ANNOTATED_ENTRY } from './landingData';
import { DESC_LIMITS } from '../../constants';

/**
 * The hero's centrepiece: one AMCAS entry with its three blocks separated and measured.
 *
 * Every number on it is derived from the strings in landingData.ts — the character counts,
 * the segment widths, the total against the 700 limit. Nothing here can drift out of step
 * with the text it is describing.
 */

const LIMIT = DESC_LIMITS.AMCAS;

const BLOCK_TONE: Record<string, { rule: string; fill: string; label: string }> = {
    context: { rule: 'bg-slate-300', fill: 'bg-slate-300', label: 'text-slate-500' },
    impact: { rule: 'bg-brand-teal', fill: 'bg-brand-teal', label: 'text-brand-teal' },
    reflection: { rule: 'bg-brand-gold', fill: 'bg-brand-gold', label: 'text-brand-gold-hover' },
};

export const AnnotatedEntry: React.FC = () => {
    const blocks = ANNOTATED_ENTRY.blocks.map((b) => ({ ...b, chars: b.text.length }));
    const total = blocks.reduce((sum, b) => sum + b.chars, 0) + (blocks.length - 1);

    return (
        <figure className="bg-white rounded-[1.5rem] border border-brand-rule shadow-[0_20px_50px_-24px_rgba(28,28,28,0.35)] overflow-hidden">
            <figcaption className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-brand-rule bg-brand-paper">
                <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-teal mb-1">
                        {ANNOTATED_ENTRY.label}
                    </p>
                    <p className="text-sm font-semibold text-brand-ink truncate">{ANNOTATED_ENTRY.activity}</p>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">
                    {total}
                    <span className="text-slate-400">/{LIMIT}</span>
                </span>
            </figcaption>

            {/* Character budget. Widths are the real proportions of the text below. */}
            <div className="px-5 sm:px-7 pt-5">
                <div
                    className="flex h-2 rounded-full overflow-hidden bg-slate-100"
                    role="img"
                    aria-label={blocks
                        .map((b) => `${b.role} ${Math.round((b.chars / total) * 100)} percent`)
                        .join(', ')}
                >
                    {blocks.map((b) => (
                        <div
                            key={b.id}
                            className={BLOCK_TONE[b.id].fill}
                            style={{ width: `${(b.chars / total) * 100}%` }}
                        />
                    ))}
                </div>
            </div>

            <div className="px-5 sm:px-7 py-6 space-y-5">
                {blocks.map((b) => {
                    const tone = BLOCK_TONE[b.id];
                    return (
                        <div key={b.id} className="flex gap-4">
                            <span aria-hidden="true" className={`w-[3px] rounded-full shrink-0 ${tone.rule}`} />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
                                    <span
                                        className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${tone.label}`}
                                    >
                                        {b.role}
                                    </span>
                                    <span className="text-[11px] text-slate-400">{b.sentences}</span>
                                    <span className="text-[11px] tabular-nums text-slate-400">{b.chars} chars</span>
                                </div>
                                <p className="font-serif text-[15px] leading-[1.6] text-slate-700">{b.text}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="px-5 sm:px-7 py-4 border-t border-brand-rule bg-brand-paper text-[12px] leading-relaxed text-slate-500">
                {ANNOTATED_ENTRY.footnote}
            </p>
        </figure>
    );
};
