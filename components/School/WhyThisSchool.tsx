import React from 'react';
import { AlertTriangle, CheckCircle2, MinusCircle, Info, ExternalLink } from 'lucide-react';
import type { Completeness } from '../../utils/missionFit';
import { orderedReasons, warningText, type FitReason, type SchoolFit } from '../../utils/schoolFit';

interface WhyThisSchoolProps {
    fit: SchoolFit;
    completeness: Completeness;
    activityTitle: (id: number) => string;
}

const TONE = {
    plus: { Icon: CheckCircle2, icon: 'text-emerald-600' },
    minus: { Icon: MinusCircle, icon: 'text-amber-600' },
    info: { Icon: Info, icon: 'text-slate-400' },
} as const;

const Reason: React.FC<{ reason: FitReason; activityTitle: (id: number) => string }> = ({ reason, activityTitle }) => {
    const { Icon, icon } = TONE[reason.tone];
    return (
        <li className="flex gap-2.5">
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${icon}`} aria-hidden="true" />
            <div className="min-w-0 text-xs leading-relaxed">
                <p className="text-slate-700 font-medium">{reason.headline}</p>
                {reason.detail && <p className="text-slate-500 mt-0.5">{reason.detail}</p>}
                {reason.activityIds && reason.activityIds.length > 0 && (
                    <p className="text-slate-500 mt-0.5">From: {reason.activityIds.map(activityTitle).join('; ')}</p>
                )}
                {reason.source && (
                    <p className="text-[10px] text-slate-400 mt-1">
                        {reason.source.url ? (
                            <a href={reason.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-teal underline decoration-slate-200 underline-offset-2">
                                {reason.source.label} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        ) : reason.source.label}
                    </p>
                )}
            </div>
        </li>
    );
};

const Section: React.FC<{ title: string; aside?: string; children: React.ReactNode }> = ({ title, aside, children }) => (
    <section className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4">
        <div className="flex items-baseline justify-between gap-3 mb-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h4>
            {aside && <span className="text-sm font-black text-slate-800">{aside}</span>}
        </div>
        {children}
    </section>
);

/**
 * The drawer's "why this school" breakdown. Every line comes from the score's own terms
 * in utils/schoolFit.ts and cites either the applicant's entries or a dataset and year.
 */
export const WhyThisSchool: React.FC<WhyThisSchoolProps> = ({ fit, completeness, activityTitle }) => {
    const reasons = orderedReasons(fit.reasons);
    const byAxis = (axis: FitReason['axis']) => reasons.filter(r => r.axis === axis);
    const warning = warningText(fit.access);
    const missingNote = byAxis('theme').find(r => r.id === 'theme-missing')?.detail;
    const m = fit.fit;

    return (
        <div className="space-y-4">
            {warning && (
                <div role="note" className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs leading-relaxed text-amber-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
                    <p>{warning}</p>
                </div>
            )}

            <Section title="Mission fit" aside={`${m.match}%`}>
                <ul className="space-y-3 mb-4">
                    {byAxis('mission').map(r => <Reason key={r.id} reason={r} activityTitle={activityTitle} />)}
                </ul>
                <dl className="space-y-1.5 text-xs border-t border-slate-200/70 pt-3">
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Targets you cover</dt>
                        <dd className="font-bold text-slate-700">{m.coverage}%</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Emphasis alignment</dt>
                        <dd className="font-bold text-slate-700">{m.shape}%</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Weakest pillar drag</dt>
                        <dd className="font-bold text-slate-700">{m.balance}% <span className="font-medium text-slate-400">({m.limitingPillar})</span></dd>
                    </div>
                    {!completeness.isComplete && (
                        <div className="flex justify-between gap-3">
                            <dt className="text-amber-700">Profile completeness</dt>
                            <dd className="font-bold text-amber-700">{m.completeness}%</dd>
                        </div>
                    )}
                </dl>
                {!completeness.isComplete && (
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-3">
                        With {completeness.activityCount} activities logged, this is a provisional read. Filling out your list will move it more than any single entry will.
                    </p>
                )}
            </Section>

            <Section title="Themes its mission names">
                {fit.theme.score === null ? (
                    <ul className="space-y-3">
                        {byAxis('theme').map(r => <Reason key={r.id} reason={r} activityTitle={activityTitle} />)}
                    </ul>
                ) : (
                    <>
                        <ul className="space-y-2.5">
                            {fit.theme.tags.map(tag => (
                                <li key={tag.label} className="flex gap-2.5 text-xs leading-relaxed">
                                    {tag.hits.length > 0
                                        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
                                        : <MinusCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-300" aria-hidden="true" />}
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-700 capitalize">{tag.label}</p>
                                        <p className="text-slate-500">
                                            {tag.hits.length > 0
                                                ? tag.hits.map(h => h.via === 'type'
                                                    ? `${activityTitle(h.activityId)} (logged as ${h.matched})`
                                                    : `${activityTitle(h.activityId)} (“${h.matched}”)`).join('; ')
                                                : 'Not in your entries.'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {missingNote && (
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-200/70">{missingNote}</p>
                        )}
                    </>
                )}
            </Section>

            <Section title="Residency">
                <ul className="space-y-3">
                    {byAxis('residency').map(r => <Reason key={r.id} reason={r} activityTitle={activityTitle} />)}
                </ul>
            </Section>
        </div>
    );
};
