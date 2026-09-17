import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, CircleDot } from 'lucide-react';
import type { Activity, MmeWorkshop as Workshop } from '../../../types';
import {
    withLegacyNotes, legacyFieldsFrom, workshopProgress, type StepState, type WorkshopStep,
} from '../../../services/mmeCoachService';
import { AAMC_MME_GUIDANCE } from '../../../services/mmeQuestionBank';
import { useProfile } from '../../../contexts/ProfileContext';
import { SourceLink } from './CoachNoteList';
import { ChooseStep } from './ChooseStep';
import { MomentStep } from './MomentStep';
import { PlanStep } from './PlanStep';
import { WriteStep } from './WriteStep';
import { FinalStep } from './FinalStep';
import { STEP_LABELS, STEP_ORDER, type StepProps } from './stepTypes';

type SaveStatus = 'UNSAVED' | 'SAVING' | 'SAVED';

interface MmeWorkshopProps {
    activity: Activity;
    activities: Activity[];
    saveStatus: SaveStatus;
    onChanges: (patch: Partial<Activity>) => void;
    onClose: () => void;
    initialStep?: WorkshopStep;
}

const StateIcon: React.FC<{ state: StepState; active: boolean }> = ({ state, active }) => {
    if (state === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />;
    if (state === 'started') return <CircleDot className={`w-4 h-4 ${active ? 'text-white' : 'text-amber-500'}`} aria-hidden="true" />;
    return <Circle className={`w-4 h-4 ${active ? 'text-white/70' : 'text-slate-300'}`} aria-hidden="true" />;
};

const STATE_TEXT: Record<StepState, string> = { done: 'done', started: 'in progress', todo: 'not started' };

/** The first step that isn't finished, so reopening the workshop lands where work is left. */
export const nextStep = (progress: Record<WorkshopStep, StepState>): WorkshopStep =>
    STEP_ORDER.find(s => progress[s] !== 'done') ?? 'final';

export const MmeWorkshop: React.FC<MmeWorkshopProps> = ({ activity, activities, saveStatus, onChanges, onClose, initialStep }) => {
    const { profile } = useProfile();
    const psSummary = profile?.psSummary ?? null;

    const workshop = useMemo(() => withLegacyNotes(activity), [activity]);
    const portfolio = useMemo(() => {
        const others = activities.filter(a => a.id !== activity.id);
        return [...others, activity];
    }, [activities, activity]);
    const progress = useMemo(() => workshopProgress(activity, workshop, psSummary), [activity, workshop, psSummary]);

    const [step, setStep] = useState<WorkshopStep>(() => initialStep ?? nextStep(progress));
    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Escape closes the workshop, but not from inside a text box, where it is too easy
        // to press by accident mid-sentence.
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (e.key === 'Escape' && tag !== 'TEXTAREA' && tag !== 'INPUT') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const goTo = (next: WorkshopStep) => {
        setStep(next);
        mainRef.current?.scrollIntoView({ block: 'start' });
    };

    const updateWorkshop = (patch: Partial<Workshop>) => {
        const next = { ...workshop, ...patch };
        // The readiness score and mission-fit scan still read the two legacy fields.
        onChanges({ mmeWorkshop: next, ...('notes' in patch ? legacyFieldsFrom(next) : {}) });
    };

    const stepProps: StepProps = { activity, workshop, updateWorkshop, activities: portfolio, psSummary, goTo };
    const title = activity.title?.trim() || 'Untitled activity';

    return (
        <div className="fixed inset-0 bg-brand-light z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Most Meaningful workshop: ${title}`}>
            <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
                    <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 shrink-0">
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Back to entry</span>
                        <span className="sm:hidden">Back</span>
                    </button>
                    <p className="min-w-0 text-sm text-slate-500 truncate text-center">
                        Most Meaningful <span className="text-slate-300" aria-hidden="true">·</span> <span className="font-semibold text-slate-800">{title}</span>
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline text-xs text-slate-400" aria-live="polite">
                            {saveStatus === 'SAVING' ? 'Saving…' : saveStatus === 'SAVED' ? 'Saved' : ''}
                        </span>
                        <button type="button" onClick={onClose} className="bg-brand-dark hover:bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg">
                            Done
                        </button>
                    </div>
                </div>
            </header>

            {/* minmax(0,1fr) on mobile: an implicit auto column grows to fit the nowrap step
                tabs and pushes the whole workshop sideways. */}
            <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 grid gap-6 lg:gap-10 grid-cols-[minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
                <nav aria-label="Workshop steps" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                    <ol className="flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                        {STEP_ORDER.map(s => {
                            const active = s === step;
                            return (
                                <li key={s} className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => goTo(s)}
                                        aria-current={active ? 'step' : undefined}
                                        className={`relative w-full flex items-center gap-2.5 text-left text-sm px-3 py-2 rounded-lg transition-colors ${active ? 'bg-brand-teal text-white font-semibold' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                                    >
                                        <StateIcon state={progress[s]} active={active} />
                                        <span className="whitespace-nowrap">{STEP_LABELS[s]}</span>
                                        <span className="sr-only">({STATE_TEXT[progress[s]]})</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>

                    <div className="hidden lg:block mt-8 pt-6 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 mb-2">What AMCAS asks for</p>
                        <blockquote className="text-sm font-serif text-slate-700 leading-relaxed">
                            &ldquo;{AAMC_MME_GUIDANCE.text}&rdquo;
                        </blockquote>
                        <SourceLink source={AAMC_MME_GUIDANCE.source} className="mt-2 inline-block" />
                    </div>
                </nav>

                <main ref={mainRef} className="min-w-0 scroll-mt-24">
                    {step === 'choose' && <ChooseStep {...stepProps} />}
                    {step === 'moment' && <MomentStep {...stepProps} />}
                    {step === 'plan' && <PlanStep {...stepProps} />}
                    {step === 'write' && <WriteStep {...stepProps} onEssayChange={text => onChanges({ mmeEssay: text })} />}
                    {step === 'final' && <FinalStep {...stepProps} />}
                </main>
            </div>
        </div>
    );
};
