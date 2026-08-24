import React from 'react';
import { Gauge } from 'lucide-react';
import { scoreNarrativeQuality, narrativeQualityTier } from '../../services/narrativeQualityService';

interface NarrativeQualityBreakdownProps {
    text: string;
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

export const NarrativeQualityBreakdown: React.FC<NarrativeQualityBreakdownProps> = ({ text }) => {
    const score = scoreNarrativeQuality(text);
    const tier = narrativeQualityTier(score.total);

    if (!text || text.trim().length === 0) return null;

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tierClasses[tier]}`} title="Narrative Quality — heuristic estimate, not AI-scored">
                <Gauge className="w-3 h-3" /> NQ {score.total}
            </div>
            <div className="flex items-center gap-2.5">
                {SUB_SCORES.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1.5" title={`${label}: ${score[key]}/25`}>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                        <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barClasses[tier]}`} style={{ width: `${(score[key] / 25) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
