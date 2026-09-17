import React, { useMemo } from 'react';
import { Award, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { Activity } from '../../../types';
import { MME_LIMIT } from '../../../constants';
import { draftNotes, withLegacyNotes, workshopProgress, type WorkshopStep } from '../../../services/mmeCoachService';
import { useProfile } from '../../../contexts/ProfileContext';
import { MmeQualityBreakdown } from '../MmeQualityBreakdown';
import { nextStep } from './MmeWorkshop';
import { STEP_LABELS, STEP_ORDER } from './stepTypes';

interface MmeCardProps {
    activity: Activity;
    onOpen: (step: WorkshopStep) => void;
}

/** The Most Meaningful summary shown inline in the editor. The work happens in the workshop. */
export const MmeCard: React.FC<MmeCardProps> = ({ activity, onOpen }) => {
    const { profile } = useProfile();
    const psSummary = profile?.psSummary ?? null;
    const workshop = useMemo(() => withLegacyNotes(activity), [activity]);
    const progress = useMemo(() => workshopProgress(activity, workshop, psSummary), [activity, workshop, psSummary]);
    const essay = activity.mmeEssay?.trim() || '';
    const openNotes = useMemo(
        () => draftNotes(essay, { description: activity.description, experienceType: activity.experienceType, psSummary })
            .filter(n => n.level !== 'note').length,
        [essay, activity.description, activity.experienceType, psSummary],
    );
    const resume = nextStep(progress);

    return (
        <section aria-labelledby="mme-card-title" className="mt-8 rounded-xl bg-white border border-brand-gold/40 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 bg-amber-50/40">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/15 text-amber-700 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                        <h4 id="mme-card-title" className="font-sans font-semibold text-slate-900">Most Meaningful Experience</h4>
                        <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                            1,325 more characters on what this experience changed in you. You write it; the workshop asks the questions an advisor would.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onOpen(resume)}
                    className="shrink-0 bg-brand-teal hover:bg-brand-teal-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
                >
                    {progress.choose === 'todo' && !essay ? 'Start the workshop' : 'Open the workshop'}
                </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
                <ol className="flex flex-wrap gap-2">
                    {STEP_ORDER.map(s => {
                        const state = progress[s];
                        const Icon = state === 'done' ? CheckCircle2 : state === 'started' ? CircleDot : Circle;
                        const tone = state === 'done' ? 'text-emerald-600' : state === 'started' ? 'text-amber-500' : 'text-slate-300';
                        return (
                            <li key={s}>
                                <button
                                    type="button"
                                    onClick={() => onOpen(s)}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1"
                                >
                                    <Icon className={`w-3.5 h-3.5 ${tone}`} aria-hidden="true" />
                                    {STEP_LABELS[s]}
                                </button>
                            </li>
                        );
                    })}
                </ol>

                {workshop.throughline?.trim() && (
                    <p className="text-sm text-slate-700 leading-relaxed">
                        <span className="font-semibold text-slate-900">Throughline: </span>
                        <span className="font-serif">{workshop.throughline.trim()}</span>
                    </p>
                )}

                {essay ? (
                    <>
                        <p className="text-sm font-serif text-slate-700 leading-relaxed line-clamp-4 whitespace-pre-wrap">{essay}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className={`tabular-nums ${essay.length > MME_LIMIT ? 'text-rose-600 font-semibold' : ''}`}>
                                {essay.length.toLocaleString('en-US')} / {MME_LIMIT.toLocaleString('en-US')} characters
                            </span>
                            {openNotes > 0 && (
                                <button type="button" onClick={() => onOpen('write')} className="font-semibold text-amber-700 hover:underline">
                                    {openNotes} {openNotes === 1 ? 'note' : 'notes'} worth fixing
                                </button>
                            )}
                        </div>
                        <MmeQualityBreakdown mmeEssay={essay} description={activity.description} />
                    </>
                ) : (
                    <p className="text-sm text-slate-500 leading-relaxed">
                        No essay yet. Start by checking whether this belongs in your three, or go straight to writing if you already have a draft.
                    </p>
                )}
            </div>
        </section>
    );
};
