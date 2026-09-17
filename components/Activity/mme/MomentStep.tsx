import React from 'react';
import type { MmeBeat } from '../../../types';
import { MME_BEATS } from '../../../services/mmeQuestionBank';
import { SourceLink } from './CoachNoteList';
import { StepShell } from './StepShell';
import type { StepProps } from './stepTypes';

export const MomentStep: React.FC<StepProps> = ({ workshop, updateWorkshop, goTo }) => {
    const notes = workshop.notes || {};
    const setNote = (beat: MmeBeat, value: string) =>
        updateWorkshop({ notes: { ...notes, [beat]: value } });

    return (
        <StepShell
            title="Find the moment"
            intro="Answer in fragments and in your own words; nobody reads these notes but you, and they are never exported. Pick whichever questions help. You will write the essay from these notes in the next steps."
            next={{ label: 'Next: plan', onClick: () => goTo('plan') }}
        >
            <ol className="space-y-5">
                {MME_BEATS.map(guide => (
                    <li key={guide.beat} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
                        <h3 className="font-serif text-lg text-slate-900">{guide.label}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{guide.purpose}</p>

                        <ul className="mt-3 space-y-2">
                            {guide.questions.map(q => (
                                <li key={q.text} className="text-sm text-slate-700 leading-relaxed pl-3 border-l-2 border-slate-200">
                                    {q.text}
                                    {q.source && (
                                        <span className="block">
                                            <SourceLink source={q.source} />
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <label htmlFor={`notes-${guide.beat}`} className="sr-only">Your notes: {guide.label}</label>
                        <textarea
                            id={`notes-${guide.beat}`}
                            value={notes[guide.beat] || ''}
                            onChange={e => setNote(guide.beat, e.target.value)}
                            rows={4}
                            placeholder="Your notes"
                            className="mt-3 w-full bg-slate-50 border border-slate-200 focus:border-brand-teal/40 text-slate-800 text-sm leading-relaxed rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 resize-y"
                        />
                    </li>
                ))}
            </ol>
        </StepShell>
    );
};
