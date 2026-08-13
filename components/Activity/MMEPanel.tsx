import React, { useState } from 'react';
import { Trophy, HelpCircle, Sparkles, Wand2 } from 'lucide-react';
import { CharacterCounter } from './CharacterCounter';
import { MME_LIMIT } from '../../constants';
import * as geminiService from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';

interface MMEPanelProps {
    description: string;
    descLimit: number;
    mmeAction: string;
    mmeResult: string;
    mmeEssay: string;
    onChange: (field: 'mmeAction' | 'mmeResult' | 'mmeEssay', value: string) => void;
}

const ADVISOR_QUESTIONS = [
    'Was this a formative moment — not just your most impressive activity?',
    'Did it change how you see medicine, patients, or yourself?',
    'Could you talk about it for 10 minutes in an interview without running out of things to say?',
];

export const MMEPanel: React.FC<MMEPanelProps> = ({ description, descLimit, mmeAction, mmeResult, mmeEssay, onChange }) => {
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const { addToast } = useToast();

    const essayCount = mmeEssay?.length || 0;
    const essayPct = Math.min((essayCount / MME_LIMIT) * 100, 100);
    const budgetColor = essayCount > MME_LIMIT ? 'bg-rose-500' : essayPct > 90 ? 'bg-amber-400' : 'bg-emerald-500';

    const handleSynthesize = async () => {
        if (!description || description.trim().length < 20) {
            addToast('Add a bit more to your main description first — the essay is built from it.', 'info');
            return;
        }
        if (!mmeAction || !mmeResult) {
            addToast('Fill in the Pivotal Action and Result fields so the AI has something to work with.', 'info');
            return;
        }
        setIsSynthesizing(true);
        try {
            const essay = await geminiService.synthesizeMmeEssay(description, mmeAction, mmeResult);
            onChange('mmeEssay', essay);
        } catch (e: any) {
            const msg = e.message === 'AUTH_REQUIRED'
                ? 'You must be logged in to use AI synthesis.'
                : (e.message || 'Failed to synthesize essay.');
            addToast(msg, 'error');
        } finally {
            setIsSynthesizing(false);
        }
    };

    return (
        <div className="mt-8 rounded-xl bg-white border border-brand-gold/30 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-amber-50/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">Most Meaningful Experience</h4>
                        <p className="text-[11px] text-slate-500">1,325 characters to explain <span className="italic">why</span> this mattered — not just what happened.</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Selection Advisor */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                        <HelpCircle className="w-3.5 h-3.5 text-brand-teal" /> Before you commit to this as an MME, ask:
                    </h5>
                    <ul className="space-y-1">
                        {ADVISOR_QUESTIONS.map((q, i) => (
                            <li key={i} className="text-xs text-slate-500 leading-relaxed flex gap-2">
                                <span className="text-brand-teal font-bold">{i + 1}.</span> {q}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* STAR inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">The Pivotal Action</label>
                        <p className="text-[11px] text-slate-400">What specific action did you take in the moment that stuck with you?</p>
                        <textarea
                            value={mmeAction}
                            onChange={(e) => onChange('mmeAction', e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 border border-transparent focus:border-brand-teal/30 text-slate-700 text-sm rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all resize-none"
                            placeholder="e.g. I stayed after my shift to sit with a patient whose family couldn't be reached..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">The Result &amp; Growth</label>
                        <p className="text-[11px] text-slate-400">What changed, and how did it shape your understanding of medicine?</p>
                        <textarea
                            value={mmeResult}
                            onChange={(e) => onChange('mmeResult', e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 border border-transparent focus:border-brand-teal/30 text-slate-700 text-sm rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all resize-none"
                            placeholder="e.g. It taught me that presence is sometimes the only intervention that matters..."
                        />
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleSynthesize}
                        disabled={isSynthesizing}
                        className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-brand-dark text-xs font-bold px-4 py-2.5 rounded-full shadow-sm transition-all disabled:opacity-60"
                    >
                        {isSynthesizing ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-dark/40 border-t-transparent animate-spin" />
                        ) : (
                            <Wand2 className="w-3.5 h-3.5" />
                        )}
                        {isSynthesizing ? 'Synthesizing...' : mmeEssay ? 'Re-synthesize Essay with AI' : 'Synthesize Essay with AI'}
                    </button>
                </div>

                {/* Final Essay */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-brand-gold" /> Final MME Essay
                        </label>
                        <CharacterCounter text={mmeEssay} limit={MME_LIMIT} />
                    </div>
                    <textarea
                        value={mmeEssay}
                        onChange={(e) => onChange('mmeEssay', e.target.value)}
                        rows={6}
                        className="w-full bg-white border border-slate-200 focus:border-brand-gold/40 text-slate-800 text-sm font-serif leading-relaxed rounded-lg p-4 outline-none focus:ring-4 focus:ring-brand-gold/10 transition-all resize-none"
                        placeholder="Generate a first draft with AI above, or write your own — this is the essay AdComs will actually read."
                    />
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${budgetColor}`} style={{ width: `${essayPct}%` }}></div>
                    </div>
                </div>

                {/* Regular vs MME comparison */}
                <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                    <span>Regular Entry: <strong className="text-slate-600">{description?.length || 0}/{descLimit}</strong></span>
                    <span className="text-slate-200">|</span>
                    <span>Most Meaningful: <strong className="text-slate-600">{essayCount}/{MME_LIMIT}</strong></span>
                </div>
            </div>
        </div>
    );
};
