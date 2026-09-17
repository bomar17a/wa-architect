import React, { useMemo } from 'react';
import { candidateNotes, setNotes } from '../../../services/mmeCoachService';
import { SELF_CHECKS } from '../../../services/mmeQuestionBank';
import { CoachNoteList } from './CoachNoteList';
import { PsSummaryField } from './PsSummaryField';
import { SelfCheckList } from './SelfCheckList';
import { StepShell, SectionTitle } from './StepShell';
import type { StepProps } from './stepTypes';

export const ChooseStep: React.FC<StepProps> = ({ activity, workshop, updateWorkshop, activities, psSummary, goTo }) => {
    const entryNotes = useMemo(() => candidateNotes(activity), [activity]);
    const acrossNotes = useMemo(() => setNotes(activities, psSummary), [activities, psSummary]);
    const chosen = activities.filter(a => a.isMostMeaningful && (a.title?.trim() || a.description?.trim()));
    const answers = workshop.selfCheck || {};
    const anyNo = SELF_CHECKS.some(q => answers[q.key] === 'no');

    return (
        <StepShell
            title="Is this one of your three?"
            intro="Most Meaningful is a choice about your whole application, so this step checks the entry against the AMCAS rules and against your other picks. The decision stays yours."
            next={{ label: 'Next: find the moment', onClick: () => goTo('moment') }}
        >
            <div>
                <SectionTitle>This entry</SectionTitle>
                <CoachNoteList notes={entryNotes} empty="Nothing about this entry rules it out." />
            </div>

            <div>
                <SectionTitle hint="Advisors ask versions of these before an applicant commits to a pick.">Ask yourself</SectionTitle>
                <SelfCheckList
                    idPrefix="self-check"
                    answers={answers}
                    onAnswer={(key, value) => updateWorkshop({ selfCheck: { ...answers, [key]: value } })}
                />
                {anyNo && (
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        A &ldquo;no&rdquo; doesn&rsquo;t rule this out. It is a reason to compare it against your other entries before you spend one of three slots on it.
                    </p>
                )}
            </div>

            <div>
                <SectionTitle hint="Some problems only show up when you look at the picks together.">
                    Your picks ({chosen.length} of 3)
                </SectionTitle>
                {chosen.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mb-3">
                        {chosen.map(a => (
                            <li key={a.id} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${a.id === activity.id ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal' : 'bg-white border-slate-200 text-slate-600'}`}>
                                {a.title?.trim() || 'Untitled activity'}
                            </li>
                        ))}
                    </ul>
                )}
                <div className="space-y-3">
                    <CoachNoteList notes={acrossNotes} empty="Nothing flags across your picks so far." />
                    <PsSummaryField />
                </div>
            </div>
        </StepShell>
    );
};
