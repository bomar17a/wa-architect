import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MME_LIMIT } from '../../../constants';
import { draftNotes } from '../../../services/mmeCoachService';
import { MME_BEATS } from '../../../services/mmeQuestionBank';
import { CharacterCounter } from '../CharacterCounter';
import { MmeQualityBreakdown } from '../MmeQualityBreakdown';
import { CoachNoteList } from './CoachNoteList';
import { StepShell, SectionTitle } from './StepShell';
import type { StepProps } from './stepTypes';

interface WriteStepProps extends StepProps {
    onEssayChange: (text: string) => void;
    /** A sentence a review note pointed at, to select on arrival. */
    focusQuote?: string | null;
    onQuoteFocused?: () => void;
}

const Disclosure: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen, children }) => {
    const [open, setOpen] = useState(Boolean(defaultOpen));
    return (
        <div className="bg-white border border-slate-200 rounded-xl">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-900"
            >
                {title}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
};

export const WriteStep: React.FC<WriteStepProps> = ({ activity, workshop, psSummary, goTo, onEssayChange, focusQuote, onQuoteFocused }) => {
    const essay = activity.mmeEssay || '';
    const deferred = useDeferredValue(essay);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const notes = useMemo(
        () => draftNotes(deferred, { description: activity.description, experienceType: activity.experienceType, psSummary }),
        [deferred, activity.description, activity.experienceType, psSummary],
    );

    const showQuote = (quote: string) => {
        const el = textareaRef.current;
        if (!el) return;
        let start = essay.indexOf(quote);
        if (start === -1) start = essay.toLowerCase().indexOf(quote.toLowerCase());
        if (start === -1) return;
        el.focus();
        el.setSelectionRange(start, start + quote.length);
    };

    useEffect(() => {
        if (!focusQuote) return;
        showQuote(focusQuote);
        onQuoteFocused?.();
        // showQuote reads the current essay through a ref, so it does not belong in the deps.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusQuote]);

    const plan = workshop.notes || {};

    return (
        <StepShell
            title="Write"
            intro="Write the essay yourself, from your plan. The notes under the draft update as you type. They point at your own sentences and ask questions; they never suggest wording."
            next={{ label: 'Next: final check', onClick: () => goTo('final') }}
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
                <div className="space-y-4 min-w-0">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <label htmlFor="mme-essay" className="text-sm font-semibold text-slate-900">Most Meaningful essay</label>
                            <CharacterCounter text={essay} limit={MME_LIMIT} />
                        </div>
                        <textarea
                            id="mme-essay"
                            ref={textareaRef}
                            value={essay}
                            onChange={e => onEssayChange(e.target.value)}
                            rows={14}
                            className="w-full bg-white border border-slate-200 focus:border-brand-teal/40 text-slate-800 text-base font-serif leading-relaxed rounded-lg p-4 outline-none focus:ring-4 focus:ring-brand-teal/10 resize-y"
                            placeholder="Start inside the moment from your plan."
                        />
                        <MmeQualityBreakdown mmeEssay={essay} description={activity.description} showOverlapNotice={false} />
                    </div>

                    <div>
                        <SectionTitle hint="Ordered by how much they matter. Each one ties to a problem admissions readers and advisors name.">
                            Notes on this draft
                        </SectionTitle>
                        <CoachNoteList
                            notes={notes}
                            onShowQuote={showQuote}
                            empty={essay.trim().length < 200 ? 'Notes start once the draft is a few sentences long.' : 'Nothing flags on this draft. Read it out loud before you call it done.'}
                        />
                    </div>
                </div>

                <aside className="space-y-3 lg:sticky lg:top-24">
                    <Disclosure title="Your plan" defaultOpen>
                        {workshop.throughline?.trim() && (
                            <p className="text-sm font-serif text-slate-800 leading-relaxed mb-3 pb-3 border-b border-slate-100">
                                {workshop.throughline.trim()}
                            </p>
                        )}
                        <dl className="space-y-2.5">
                            {MME_BEATS.map(b => (
                                <div key={b.beat}>
                                    <dt className="text-xs font-semibold text-slate-500">{b.label}</dt>
                                    <dd className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {plan[b.beat]?.trim() || <span className="text-slate-400">Nothing yet</span>}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Disclosure>
                    <Disclosure title="Your 700-character entry">
                        <p className="text-xs text-slate-500 mb-2">The reader sees this right before your essay. Avoid telling it again.</p>
                        <p className="text-sm font-serif text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {activity.description?.trim() || 'No description written yet.'}
                        </p>
                    </Disclosure>
                </aside>
            </div>
        </StepShell>
    );
};
