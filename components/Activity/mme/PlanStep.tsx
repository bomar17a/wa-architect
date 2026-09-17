import React, { useMemo } from 'react';
import { MME_LIMIT } from '../../../constants';
import { planNotes, beatBudgets } from '../../../services/mmeCoachService';
import { MME_BEATS, THROUGHLINE } from '../../../services/mmeQuestionBank';
import { CoachNoteList } from './CoachNoteList';
import { StepShell, SectionTitle } from './StepShell';
import type { StepProps } from './stepTypes';

export const BEAT_TONES = ['bg-slate-400', 'bg-amber-400', 'bg-brand-teal', 'bg-brand-gold', 'bg-indigo-400'];

export const PlanStep: React.FC<StepProps> = ({ workshop, updateWorkshop, goTo }) => {
    const notes = workshop.notes || {};
    const gaps = useMemo(() => planNotes(workshop), [workshop]);
    const budgets = beatBudgets(MME_LIMIT);

    return (
        <StepShell
            title="Plan"
            intro="Decide what the essay argues before you write it. Your notes are laid out in reading order below, with a rough share of the 1,325 characters for each part."
            next={{ label: 'Next: write', onClick: () => goTo('write') }}
        >
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
                <label htmlFor="mme-throughline" className="block text-sm font-semibold text-slate-900">{THROUGHLINE.label}</label>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{THROUGHLINE.prompt}</p>
                <textarea
                    id="mme-throughline"
                    value={workshop.throughline || ''}
                    onChange={e => updateWorkshop({ throughline: e.target.value })}
                    rows={2}
                    maxLength={300}
                    className="mt-3 w-full bg-slate-50 border border-slate-200 focus:border-brand-teal/40 text-slate-800 text-[15px] font-serif leading-relaxed rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 resize-y"
                />
                <p className="text-xs text-slate-500 mt-1.5">{THROUGHLINE.hint}</p>
            </div>

            <div>
                <SectionTitle hint="A starting split, weighted toward what changed in you because AMCAS asks about personal growth. Move it around to fit your story.">
                    Where the characters go
                </SectionTitle>
                <div
                    className="flex h-2.5 rounded-full overflow-hidden bg-slate-100"
                    role="img"
                    aria-label={MME_BEATS.map(b => `${b.label} about ${Math.round(b.share * 100)} percent`).join(', ')}
                >
                    {MME_BEATS.map((b, i) => (
                        <div key={b.beat} className={BEAT_TONES[i]} style={{ width: `${b.share * 100}%` }} />
                    ))}
                </div>
            </div>

            <ol className="space-y-3">
                {MME_BEATS.map((guide, i) => {
                    const text = (notes[guide.beat] || '').trim();
                    return (
                        <li key={guide.beat} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
                            <span aria-hidden="true" className={`w-1 rounded-full shrink-0 ${BEAT_TONES[i]}`} />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                    <h3 className="font-sans text-sm font-semibold text-slate-900">{guide.label}</h3>
                                    <span className="text-xs tabular-nums text-slate-400">about {(Math.round(budgets[guide.beat] / 25) * 25).toLocaleString('en-US')} characters</span>
                                </div>
                                {text ? (
                                    <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
                                ) : (
                                    <p className="mt-1.5 text-sm text-slate-400">
                                        Nothing yet.{' '}
                                        <button type="button" onClick={() => goTo('moment')} className="font-semibold text-brand-teal hover:underline">
                                            Add notes
                                        </button>
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div>
                <SectionTitle>Gaps in the plan</SectionTitle>
                <CoachNoteList notes={gaps} empty="Every part has notes and you have a throughline. Time to write." />
            </div>
        </StepShell>
    );
};
