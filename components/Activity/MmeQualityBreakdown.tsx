import React from 'react';
import { Gauge, Copy } from 'lucide-react';
import { scoreMmeQuality, mmeOverlapRatio, narrativeQualityTier } from '../../services/narrativeQualityService';

interface MmeQualityBreakdownProps {
    /** The 1,325-character MME remark. */
    mmeEssay: string;
    /** The same activity's 700-character description — distinctness is measured against it. */
    description: string;
}

const SUB_SCORES: { key: 'insight' | 'evidence' | 'distinctness' | 'voice'; label: string; hint: string }[] = [
    { key: 'insight', label: 'Insight', hint: 'A named shift, a revised belief, or a real link to practising medicine — not a summary of what you did.' },
    { key: 'evidence', label: 'Evidence', hint: 'The specific scene, person, or detail the insight rests on.' },
    { key: 'distinctness', label: 'New Ground', hint: 'How much of this is new material rather than your description retold.' },
    { key: 'voice', label: 'Voice', hint: 'Reads like a specific person wrote it, rather than a template.' },
];

const tierClasses: Record<'green' | 'amber' | 'red', string> = {
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    red: 'text-rose-600 bg-rose-50 border-rose-100',
};

const barClasses: Record<'green' | 'amber' | 'red', string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-rose-400',
};

// Below this the two texts just share the vocabulary of one activity, which is normal —
// genuinely distinct MMEs in the exemplar corpus sit at 3-7%. Set above the corpus's
// most distinct-but-wordy entry so the notice stays rare enough to mean something.
// redFlagService uses a higher bar (0.15) for the dashboard-level flag.
const OVERLAP_NOTICE = 0.12;

export const MmeQualityBreakdown: React.FC<MmeQualityBreakdownProps> = ({ mmeEssay, description }) => {
    // Too short to say anything useful about, and a red score on two sentences would
    // just be discouraging noise while someone is still typing.
    if (!mmeEssay || mmeEssay.trim().length < 200) return null;

    const score = scoreMmeQuality(mmeEssay, description);
    const tier = narrativeQualityTier(score.total);
    const overlap = description ? mmeOverlapRatio(mmeEssay, description) : 0;

    return (
        <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
                <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tierClasses[tier]}`}
                    title="MME quality — heuristic estimate, scored against a different rubric than the 700-character entry."
                >
                    <Gauge className="w-3 h-3" /> MME {score.total}
                    <span className="font-black uppercase tracking-wider text-[8px] opacity-70">est</span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                    {SUB_SCORES.map(({ key, label, hint }) => (
                        <div key={key} className="flex items-center gap-1.5" title={`${label} — ${score[key]}/25. ${hint}`}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                            <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barClasses[tier]}`} style={{ width: `${(score[key] / 25) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* The overlap number is the actionable part — a lowered bar alone does not
                tell anyone what to cut. */}
            {overlap >= OVERLAP_NOTICE && (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 leading-relaxed">
                    <Copy className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    <span>
                        Roughly <strong>{Math.round(overlap * 100)}%</strong> of this covers ground your
                        700-character entry already covers. These 1,325 characters are the only place you get
                        to say what the experience <em>meant</em> — spend them on what the entry above cannot fit.
                    </span>
                </p>
            )}
        </div>
    );
};
