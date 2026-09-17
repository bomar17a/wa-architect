import React from 'react';
import type { MmeSelfCheckAnswer, MmeSelfCheckKey, MmeWorkshop } from '../../../types';
import { SELF_CHECKS } from '../../../services/mmeQuestionBank';
import { SourceLink } from './CoachNoteList';

const ANSWERS: { value: MmeSelfCheckAnswer; label: string; selected: string }[] = [
    { value: 'yes', label: 'Yes', selected: 'text-brand-teal' },
    { value: 'unsure', label: 'Not sure', selected: 'text-amber-700' },
    { value: 'no', label: 'No', selected: 'text-rose-700' },
];

interface SelfCheckListProps {
    /** Distinguishes the question ids when several lists are on screen. */
    idPrefix: string;
    answers: MmeWorkshop['selfCheck'];
    onAnswer: (key: MmeSelfCheckKey, value: MmeSelfCheckAnswer) => void;
}

export const SelfCheckList: React.FC<SelfCheckListProps> = ({ idPrefix, answers = {}, onAnswer }) => (
    <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {SELF_CHECKS.map(q => {
            const labelId = `${idPrefix}-${q.key}`;
            return (
                <li key={q.key} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p id={labelId} className="text-sm text-slate-800 leading-relaxed">{q.text}</p>
                        {q.source && <SourceLink source={q.source} />}
                    </div>
                    <div role="radiogroup" aria-labelledby={labelId} className="inline-flex self-start sm:self-auto shrink-0 p-0.5 bg-slate-100 rounded-lg">
                        {ANSWERS.map(a => {
                            const selected = answers[q.key] === a.value;
                            return (
                                <button
                                    key={a.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => onAnswer(q.key, a.value)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${selected ? `bg-white shadow-sm ${a.selected}` : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>
                </li>
            );
        })}
    </ul>
);
