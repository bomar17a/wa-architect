import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { CoachNote, CoachLevel } from '../../../services/mmeCoachService';
import type { CoachSource } from '../../../services/mmeQuestionBank';

const LEVEL: Record<CoachLevel, { box: string; icon: string; Icon: typeof Info; label: string }> = {
    block: { box: 'border-rose-200 bg-rose-50/70', icon: 'text-rose-600', Icon: AlertCircle, label: 'Must fix' },
    caution: { box: 'border-amber-200 bg-amber-50/60', icon: 'text-amber-600', Icon: AlertTriangle, label: 'Worth fixing' },
    note: { box: 'border-slate-200 bg-white', icon: 'text-slate-400', Icon: Info, label: 'Consider' },
};

export const SourceLink: React.FC<{ source: CoachSource; className?: string }> = ({ source, className = '' }) => (
    <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-[11px] text-slate-400 underline decoration-slate-300 underline-offset-2 hover:text-brand-teal hover:decoration-brand-teal ${className}`}
    >
        {source.label}
    </a>
);

interface CoachNoteListProps {
    notes: CoachNote[];
    empty?: string;
    /** When given, notes with a quote get a button that selects the quoted text in the draft. */
    onShowQuote?: (quote: string) => void;
}

export const CoachNoteList: React.FC<CoachNoteListProps> = ({ notes, empty, onShowQuote }) => {
    if (notes.length === 0) {
        return empty ? <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-3">{empty}</p> : null;
    }

    return (
        <ul className="space-y-2.5">
            {notes.map(note => {
                const style = LEVEL[note.level];
                return (
                    <li key={note.id} className={`rounded-xl border px-4 py-3.5 ${style.box}`}>
                        <div className="flex items-start gap-3">
                            <style.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${style.icon}`} aria-hidden="true" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <p className="text-sm font-semibold text-slate-800">
                                    <span className="sr-only">{style.label}: </span>
                                    {note.title}
                                </p>
                                {note.quote && (
                                    <p className="text-sm text-slate-600">
                                        <mark className="bg-brand-gold/25 text-slate-800 rounded px-1 py-0.5 font-serif">{note.quote}</mark>
                                        {onShowQuote && (
                                            <button
                                                type="button"
                                                onClick={() => onShowQuote(note.quote!)}
                                                className="ml-2 text-xs font-semibold text-brand-teal hover:underline"
                                            >
                                                Show in draft
                                            </button>
                                        )}
                                    </p>
                                )}
                                <p className="text-sm text-slate-600 leading-relaxed">{note.body}</p>
                                {note.question && (
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        <span className="font-semibold">Ask yourself: </span>{note.question}
                                    </p>
                                )}
                                {note.source && <SourceLink source={note.source} />}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
