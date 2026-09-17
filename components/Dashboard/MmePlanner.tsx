import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronDown, Info, X } from 'lucide-react';
import { type Activity, ApplicationType } from '../../types';
import { MME_LIMIT } from '../../constants';
import { getActivityHours } from '../../services/redFlagService';
import {
    canMarkMostMeaningful, candidateNotes, setNotes, withLegacyNotes, workshopProgress, type CoachNote,
} from '../../services/mmeCoachService';
import { SELF_CHECKS } from '../../services/mmeQuestionBank';
import { useProfile } from '../../contexts/ProfileContext';
import { CoachNoteList } from '../Activity/mme/CoachNoteList';
import { PsSummaryField } from '../Activity/mme/PsSummaryField';
import { SelfCheckList } from '../Activity/mme/SelfCheckList';
import { STEP_ORDER } from '../Activity/mme/stepTypes';

interface MmePlannerProps {
    activities: Activity[];
    appType: ApplicationType;
    onToggleMME: (activityId: number) => void;
    onOpenActivity: (activityId: number) => void;
    /** Saves self-check answers on entries that are not marked yet. */
    onSaveActivity: (activity: Activity) => void;
    onClose: () => void;
}

const NOTE_ICON = { block: AlertCircle, caution: AlertTriangle, note: Info } as const;
const NOTE_TONE = { block: 'text-rose-600', caution: 'text-amber-600', note: 'text-slate-400' } as const;

const CompactNotes: React.FC<{ notes: CoachNote[] }> = ({ notes }) =>
    notes.length === 0 ? null : (
        <ul className="mt-1.5 space-y-0.5">
            {notes.map(n => {
                const Icon = NOTE_ICON[n.level];
                return (
                    <li key={n.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${NOTE_TONE[n.level]}`} aria-hidden="true" />
                        {n.title}
                    </li>
                );
            })}
        </ul>
    );

const selfCheckSummary = (a: Activity): string | null => {
    const answers = a.mmeWorkshop?.selfCheck || {};
    const given = SELF_CHECKS.map(q => answers[q.key]).filter(Boolean);
    if (given.length === 0) return null;
    const count = (v: string) => given.filter(g => g === v).length;
    return [
        count('yes') && `${count('yes')} yes`,
        count('unsure') && `${count('unsure')} not sure`,
        count('no') && `${count('no')} no`,
    ].filter(Boolean).join(', ');
};

export const MmePlanner: React.FC<MmePlannerProps> = ({ activities, appType, onToggleMME, onOpenActivity, onSaveActivity, onClose }) => {
    const { profile } = useProfile();
    const psSummary = profile?.psSummary ?? null;
    const [checkingId, setCheckingId] = useState<number | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (e.key === 'Escape' && tag !== 'INPUT') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const filled = useMemo(
        () => activities.filter(a => a.title?.trim() || a.description?.trim()),
        [activities],
    );
    const chosen = filled.filter(a => a.isMostMeaningful);
    const others = filled
        .filter(a => !a.isMostMeaningful)
        .sort((a, b) => getActivityHours(b) - getActivityHours(a));
    const acrossNotes = useMemo(() => setNotes(activities, psSummary), [activities, psSummary]);

    const row = (a: Activity) => {
        const hours = getActivityHours(a);
        const decision = canMarkMostMeaningful(a, activities, appType);
        const workshop = withLegacyNotes(a);
        const progress = workshopProgress(a, workshop, psSummary);
        const stepsDone = STEP_ORDER.filter(s => progress[s] === 'done').length;
        const summary = selfCheckSummary(a);
        const essayLen = a.mmeEssay?.trim().length || 0;
        const checking = checkingId === a.id;

        return (
            <li key={a.id} className="px-4 py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{a.title?.trim() || 'Untitled activity'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {[a.experienceType || 'No category', hours > 0 ? `${hours} hours` : 'No hours yet'].join(' · ')}
                        </p>
                        {a.isMostMeaningful ? (
                            <p className="text-xs text-slate-600 mt-1.5">
                                {stepsDone} of {STEP_ORDER.length} workshop steps done
                                {essayLen > 0 && <> · <span className="tabular-nums">{essayLen.toLocaleString('en-US')} / {MME_LIMIT.toLocaleString('en-US')}</span> characters</>}
                            </p>
                        ) : summary ? (
                            <p className="text-xs text-slate-600 mt-1.5">Self-check: {summary}</p>
                        ) : null}
                        <CompactNotes notes={candidateNotes(a)} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!a.isMostMeaningful && (
                            <button
                                type="button"
                                onClick={() => setCheckingId(checking ? null : a.id)}
                                aria-expanded={checking}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg"
                            >
                                Self-check
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${checking ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => onOpenActivity(a.id)}
                            className="text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg"
                        >
                            Open
                        </button>
                        <button
                            type="button"
                            onClick={() => onToggleMME(a.id)}
                            disabled={!decision.ok}
                            title={decision.ok ? undefined : decision.reason}
                            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed ${a.isMostMeaningful
                                ? 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                                : 'text-white bg-brand-teal border-brand-teal hover:bg-brand-teal-hover'}`}
                        >
                            {a.isMostMeaningful ? 'Unmark' : 'Mark'}
                        </button>
                    </div>
                </div>
                {!decision.ok && !a.isMostMeaningful && chosen.length < 3 && (
                    <p className="mt-2 text-xs text-slate-500">{decision.reason}</p>
                )}
                {checking && (
                    <div className="mt-3">
                        <SelfCheckList
                            idPrefix={`planner-${a.id}`}
                            answers={workshop.selfCheck}
                            onAnswer={(key, value) => onSaveActivity({
                                ...a,
                                mmeWorkshop: { ...workshop, selfCheck: { ...workshop.selfCheck, [key]: value } },
                            })}
                        />
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 overflow-y-auto" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="mme-planner-title"
                onClick={e => e.stopPropagation()}
                className="relative max-w-3xl mx-auto my-6 sm:my-12 bg-brand-light rounded-2xl shadow-xl"
            >
                <header className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-200">
                    <div>
                        <h2 id="mme-planner-title" className="font-serif text-2xl text-slate-900">Your Most Meaningful three</h2>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-xl">
                            AMCAS lets you mark up to three experiences, each with 1,325 more characters. Pick for what changed you, then check the picks against each other.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="px-5 sm:px-6 py-5 space-y-6">
                    {appType === ApplicationType.AACOMAS ? (
                        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-3">
                            Most Meaningful is an AMCAS designation. Switch the application type to AMCAS to plan your three.
                        </p>
                    ) : (
                        <>
                            <div>
                                <h3 className="font-sans text-sm font-semibold text-slate-900 mb-3">Across your picks</h3>
                                <div className="space-y-3">
                                    <CoachNoteList notes={acrossNotes} empty="Nothing flags across your picks so far." />
                                    <PsSummaryField />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-sans text-sm font-semibold text-slate-900 mb-3">Chosen ({chosen.length} of 3)</h3>
                                {chosen.length > 0 ? (
                                    <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">{chosen.map(row)}</ul>
                                ) : (
                                    <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3">None yet. Mark one from the list below.</p>
                                )}
                            </div>

                            {others.length > 0 && (
                                <div>
                                    <h3 className="font-sans text-sm font-semibold text-slate-900">Other entries</h3>
                                    <p className="text-xs text-slate-500 mt-0.5 mb-3">
                                        Most hours first. Run the self-check on any of them before you decide.
                                        {chosen.length >= 3 && ' You have three chosen, so unmark one to swap another in.'}
                                    </p>
                                    <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">{others.map(row)}</ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
