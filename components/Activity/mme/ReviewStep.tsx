import React, { useState } from 'react';
import { AlertTriangle, Check, CircleDot, Loader2, MessageSquareQuote, RefreshCw, Sparkles, ThumbsDown } from 'lucide-react';
import type { MmeNoteStatus, MmeReview } from '../../../types';
import { MME_LIMIT } from '../../../constants';
import { appendReview, isReviewStale, latestReview, openReviewNotes } from '../../../services/mmeCoachService';
import * as geminiService from '../../../services/geminiService';
import { useToast } from '../../../contexts/ToastContext';
import { StepShell, SectionTitle } from './StepShell';
import type { StepProps } from './stepTypes';

const STATUS_LABEL: Record<MmeNoteStatus, string> = { open: 'Open', done: 'Done', disagree: 'Disagreed' };

const relative = (iso: string): string => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StatusButtons: React.FC<{
    status: MmeNoteStatus;
    onChange: (status: MmeNoteStatus) => void;
}> = ({ status, onChange }) => (
    <div className="flex items-center gap-1.5 shrink-0">
        <button
            type="button"
            onClick={() => onChange(status === 'done' ? 'open' : 'done')}
            aria-pressed={status === 'done'}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${status === 'done' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
            <Check className="w-3.5 h-3.5" aria-hidden="true" /> Done
        </button>
        <button
            type="button"
            onClick={() => onChange(status === 'disagree' ? 'open' : 'disagree')}
            aria-pressed={status === 'disagree'}
            title="Keep it as it is"
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${status === 'disagree' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
            <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" /> Disagree
        </button>
    </div>
);

export const ReviewStep: React.FC<StepProps> = ({ activity, workshop, updateWorkshop, psSummary, goTo, focusInDraft }) => {
    const [isReading, setIsReading] = useState(false);
    const { addToast } = useToast();

    const essay = (activity.mmeEssay || '').trim();
    const rounds = workshop.reviews || [];
    const review = latestReview(workshop);
    const stale = review ? isReviewStale(review, essay) : false;
    const open = openReviewNotes(review, essay);

    const setStatus = (reviewId: string, noteId: string, status: MmeNoteStatus) => {
        updateWorkshop({
            reviews: rounds.map(r => (r.id === reviewId ? { ...r, statuses: { ...r.statuses, [noteId]: status } } : r)),
        });
    };

    const askForRead = async (force = false) => {
        if (essay.length < 200) {
            addToast('Write a few more sentences first. A read on two lines says little.', 'info');
            return;
        }
        setIsReading(true);
        try {
            const next = await geminiService.getMmeReview(activity, workshop, { psSummary, force });
            updateWorkshop({ reviews: appendReview(workshop, next) });
        } catch (e: any) {
            const message = e?.message === 'AUTH_REQUIRED'
                ? 'You must be logged in to ask for a read.'
                : (e?.message || 'The read failed. Try again in a moment.');
            addToast(message, 'error');
        } finally {
            setIsReading(false);
        }
    };

    const renderRound = (r: MmeReview) => {
        const roundNumber = rounds.indexOf(r) + 1;
        return (
            <div key={r.id} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Round {roundNumber}</span>
                        <span className="text-slate-400"> · {relative(r.createdAt)} · MME {r.scores.total} at the time</span>
                    </p>
                    {open.length > 0 && (
                        <span className="text-xs font-semibold text-amber-700">{open.length} open</span>
                    )}
                </div>

                {stale && (
                    <p className="flex items-start gap-2.5 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        You have edited the draft since this read, so parts of it may be out of date.
                    </p>
                )}

                {r.roundChange && (
                    <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-3 leading-relaxed">
                        <span className="font-semibold">Since the last round: </span>{r.roundChange}
                    </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-700 mb-1.5">Strongest thing here</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{r.strongest || 'Nothing named.'}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-amber-700 mb-1.5">Biggest problem</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{r.biggestIssue || 'Nothing named.'}</p>
                    </div>
                </div>

                {r.throughline && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">
                            Does it land your throughline? <span className="text-slate-800">{r.throughline.lands}</span>
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{r.throughline.note}</p>
                    </div>
                )}

                {r.contentNotes.length > 0 && (
                    <div>
                        <SectionTitle hint="The story-level problems, biggest first.">What to work on</SectionTitle>
                        <ul className="space-y-2.5">
                            {r.contentNotes.map(note => {
                                const status = r.statuses[note.id] ?? 'open';
                                return (
                                    <li key={note.id} className={`rounded-xl border px-4 py-3.5 ${status === 'open' ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                <p className={`text-sm leading-relaxed ${status === 'open' ? 'text-slate-800' : 'text-slate-500 line-through decoration-slate-300'}`}>{note.note}</p>
                                                {note.question && (
                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                        <span className="font-semibold">Ask yourself: </span>{note.question}
                                                    </p>
                                                )}
                                                <p className="text-[11px] text-slate-400">{STATUS_LABEL[status]}</p>
                                            </div>
                                            <StatusButtons status={status} onChange={s => setStatus(r.id, note.id, s)} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {r.lineNotes.length > 0 && (
                    <div>
                        <SectionTitle hint="Each one quotes your draft as it stood when you asked.">Line by line</SectionTitle>
                        <ul className="space-y-2.5">
                            {r.lineNotes.map(note => {
                                const status = r.statuses[note.id] ?? 'open';
                                const gone = !essay.includes(note.quote);
                                return (
                                    <li key={note.id} className={`rounded-xl border px-4 py-3.5 ${gone || status !== 'open' ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                <p className="text-sm text-slate-600">
                                                    <mark className="bg-brand-gold/25 text-slate-800 rounded px-1 py-0.5 font-serif">{note.quote}</mark>
                                                    {gone ? (
                                                        <span className="ml-2 text-xs font-semibold text-emerald-700">Changed since this read</span>
                                                    ) : (
                                                        <button type="button" onClick={() => focusInDraft(note.quote)} className="ml-2 text-xs font-semibold text-brand-teal hover:underline">
                                                            Find in draft
                                                        </button>
                                                    )}
                                                </p>
                                                <p className={`text-sm leading-relaxed ${status === 'open' && !gone ? 'text-slate-700' : 'text-slate-500'}`}>{note.note}</p>
                                            </div>
                                            {!gone && <StatusButtons status={status} onChange={s => setStatus(r.id, note.id, s)} />}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {r.fromYourNotes.length > 0 && (
                    <div>
                        <SectionTitle hint="Material you gathered that the draft leaves out.">In your notes, missing from the draft</SectionTitle>
                        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                            {r.fromYourNotes.map(item => (
                                <li key={item} className="px-4 py-3 text-sm text-slate-700 leading-relaxed">{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {r.interviewQuestions.length > 0 && (
                    <div>
                        <SectionTitle hint="Anything you submit is fair game in an interview.">What an interviewer could ask</SectionTitle>
                        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                            {r.interviewQuestions.map(q => (
                                <li key={q} className="px-4 py-3 flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                                    <MessageSquareQuote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                                    {q}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <StepShell
            title="Get a read"
            intro="An AI reader goes through the draft the way an advisor would: the biggest problem first, then notes on your own sentences. It asks questions and never suggests wording, so the essay stays in your words."
            next={{ label: 'Next: final check', onClick: () => goTo('final') }}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Sparkles className="w-4 h-4 text-brand-highlight" aria-hidden="true" />
                        AI read
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Sends this draft, your notes and your 700-character entry to Google&rsquo;s Gemini model. Nothing is sent until you ask.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => askForRead(review ? !stale : false)}
                    disabled={isReading || essay.length === 0}
                    className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50"
                >
                    {isReading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />}
                    {isReading ? 'Reading…' : review ? 'Ask for another read' : 'Ask for a read'}
                </button>
            </div>

            {rounds.length === 0 ? (
                <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-6 text-center leading-relaxed">
                    {essay.length === 0
                        ? <>Write a draft first. <button type="button" onClick={() => goTo('write')} className="font-semibold text-brand-teal hover:underline">Go to Write</button></>
                        : `No read yet. Your draft is ${essay.length.toLocaleString('en-US')} of ${MME_LIMIT.toLocaleString('en-US')} characters.`}
                </p>
            ) : (
                renderRound(rounds[rounds.length - 1])
            )}

            {rounds.length > 1 && (
                <div>
                    <SectionTitle>Earlier rounds</SectionTitle>
                    <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {rounds.slice(0, -1).reverse().map(r => (
                            <li key={r.id} className="px-4 py-3 flex items-start gap-3">
                                <CircleDot className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="text-sm text-slate-700">
                                        <span className="font-semibold">Round {rounds.indexOf(r) + 1}</span>
                                        <span className="text-slate-400"> · {relative(r.createdAt)} · MME {r.scores.total}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{r.biggestIssue}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </StepShell>
    );
};
