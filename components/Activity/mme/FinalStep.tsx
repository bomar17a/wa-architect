import React, { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Circle, Copy, Check } from 'lucide-react';
import { finalCheck, type FinalStatus } from '../../../services/mmeCoachService';
import { SOURCES } from '../../../services/mmeQuestionBank';
import { useToast } from '../../../contexts/ToastContext';
import { SourceLink } from './CoachNoteList';
import { StepShell, SectionTitle } from './StepShell';
import type { StepProps } from './stepTypes';

const STATUS: Record<Exclude<FinalStatus, 'confirm'>, { Icon: typeof Circle; tone: string; label: string }> = {
    pass: { Icon: CheckCircle2, tone: 'text-emerald-600', label: 'Done' },
    warn: { Icon: AlertTriangle, tone: 'text-amber-600', label: 'Check' },
    fail: { Icon: AlertCircle, tone: 'text-rose-600', label: 'Not ready' },
};

type ConfirmKey = 'readAloud' | 'tenMinutes';
const CONFIRM_KEY: Record<string, ConfirmKey> = { 'read-aloud': 'readAloud', 'ten-minutes': 'tenMinutes' };

export const FinalStep: React.FC<StepProps> = ({ activity, workshop, updateWorkshop, psSummary, goTo }) => {
    const check = useMemo(() => finalCheck(activity, workshop, psSummary), [activity, workshop, psSummary]);
    const [copied, setCopied] = useState(false);
    const { addToast } = useToast();

    const toggle = (key: ConfirmKey, value: boolean) =>
        updateWorkshop({ final: { ...workshop.final, [key]: value } });

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(check.plainText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            addToast('Could not copy. Select the text and copy it by hand.', 'error');
        }
    };

    return (
        <StepShell
            title="Final check"
            intro="The last pass before this goes into AMCAS. Warnings can stand if you have a reason; the two confirmations are yours to make."
        >
            {check.ready ? (
                <p className="flex items-start gap-2.5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    Ready to paste into AMCAS.
                </p>
            ) : null}

            <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {check.items.map(item => {
                    if (item.id in CONFIRM_KEY) {
                        const key = CONFIRM_KEY[item.id];
                        const checked = Boolean(workshop.final?.[key]);
                        return (
                            <li key={item.id} className="px-4 py-3.5">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={e => toggle(key, e.target.checked)}
                                        className="mt-0.5 w-4 h-4 accent-brand-teal"
                                    />
                                    <span className="text-sm text-slate-800">{item.label}</span>
                                </label>
                            </li>
                        );
                    }
                    const s = STATUS[item.status as Exclude<FinalStatus, 'confirm'>];
                    return (
                        <li key={item.id} className="px-4 py-3.5 flex items-start gap-3">
                            <s.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${s.tone}`} aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-sm text-slate-800"><span className="sr-only">{s.label}: </span>{item.label}</p>
                                {item.detail && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>}
                                {item.id === 'open-notes' && item.status === 'warn' && (
                                    <button type="button" onClick={() => goTo('write')} className="mt-1 text-xs font-semibold text-brand-teal hover:underline">
                                        Back to the draft
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div>
                <SectionTitle hint="What AMCAS will receive: formatting stripped, curly quotes and dashes flattened.">Plain-text version</SectionTitle>
                <textarea
                    readOnly
                    value={check.plainText}
                    rows={8}
                    aria-label="Plain-text version of the essay"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed rounded-lg p-3 outline-none resize-y"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                        In AMCAS, removing the Most Meaningful designation deletes this essay, so keep a copy.{' '}
                        <SourceLink source={SOURCES.aamcMme} />
                    </p>
                    <button
                        type="button"
                        onClick={copy}
                        disabled={!check.plainText}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-40"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                        {copied ? 'Copied' : 'Copy plain text'}
                    </button>
                </div>
            </div>
        </StepShell>
    );
};
