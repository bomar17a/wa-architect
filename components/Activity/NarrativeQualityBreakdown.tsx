import React, { useState, useEffect } from 'react';
import { Gauge, Sparkles, Loader2 } from 'lucide-react';
import { scoreNarrativeQuality, narrativeQualityTier } from '../../services/narrativeQualityService';
import { Activity, AiNarrativeQuality } from '../../types';
import * as geminiService from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';

interface NarrativeQualityBreakdownProps {
    activity: Activity;
    limit: number;
}

const SUB_SCORES: { key: 'specificity' | 'quantification' | 'reflection' | 'voiceAuthenticity'; label: string }[] = [
    { key: 'specificity', label: 'Specificity' },
    { key: 'quantification', label: 'Quantification' },
    { key: 'reflection', label: 'Reflection' },
    { key: 'voiceAuthenticity', label: 'Voice' },
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

const clamp25 = (n: number) => Math.max(0, Math.min(25, Math.round(Number(n) || 0)));

export const NarrativeQualityBreakdown: React.FC<NarrativeQualityBreakdownProps> = ({ activity, limit }) => {
    const text = activity.description;
    const [ai, setAi] = useState<AiNarrativeQuality | null>(null);
    const [isScoring, setIsScoring] = useState(false);
    const { addToast } = useToast();

    // The AI score describes the text it was run against. Once the user edits,
    // it's stale — drop it rather than showing a score for text that no longer exists.
    useEffect(() => { setAi(null); }, [text]);

    if (!text || text.trim().length === 0) return null;

    const heuristic = scoreNarrativeQuality(text);
    const sub = ai
        ? {
            specificity: clamp25(ai.specificity),
            quantification: clamp25(ai.quantification),
            reflection: clamp25(ai.reflection),
            voiceAuthenticity: clamp25(ai.voiceAuthenticity),
        }
        : heuristic;
    const total = ai
        ? sub.specificity + sub.quantification + sub.reflection + sub.voiceAuthenticity
        : heuristic.total;
    const tier = narrativeQualityTier(total);

    const handleAiScore = async () => {
        if (text.trim().length < 40) {
            addToast('Write a bit more before scoring — there is not much to judge yet.', 'info');
            return;
        }
        setIsScoring(true);
        try {
            const result = await geminiService.getAiNarrativeQuality(activity, limit);
            setAi(result);
        } catch (e: any) {
            const msg = e.message === 'AUTH_REQUIRED'
                ? 'You must be logged in to use AI features.'
                : (e.message || 'Failed to score this entry.');
            addToast(msg, 'error');
        } finally {
            setIsScoring(false);
        }
    };

    return (
        <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-3 flex-wrap">
                <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tierClasses[tier]}`}
                    title={ai ? 'Narrative Quality — AI-scored' : 'Narrative Quality — heuristic estimate. Use "AI Score" for a real read.'}
                >
                    <Gauge className="w-3 h-3" /> NQ {total}
                    <span className="font-black uppercase tracking-wider text-[8px] opacity-70">{ai ? 'AI' : 'est'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    {SUB_SCORES.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5" title={`${label}: ${sub[key]}/25`}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                            <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barClasses[tier]}`} style={{ width: `${(sub[key] / 25) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleAiScore}
                    disabled={isScoring}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-brand-teal border border-slate-200 hover:border-brand-teal/40 rounded-full px-2 py-1 transition-colors disabled:opacity-60"
                >
                    {isScoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-brand-gold" />}
                    {isScoring ? 'Scoring' : ai ? 'Rescore' : 'AI Score'}
                </button>
            </div>

            {ai && (
                <div className="max-w-md text-left sm:text-right space-y-1">
                    <p className="text-[11px] text-slate-500 leading-relaxed">{ai.summary}</p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                        <span className="font-bold text-brand-teal">Next: </span>{ai.topFix}
                    </p>
                </div>
            )}
        </div>
    );
};
