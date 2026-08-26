import React, { useState, useEffect } from 'react';
import { Building, Loader2, Sparkles, Copy, Check, Info } from 'lucide-react';
import { Activity, SchoolAlignment } from '../../types';
import { supabase } from '../../services/supabase';
import * as geminiService from '../../services/geminiService';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';

interface SchoolTargetingPanelProps {
    activity: Activity;
}

interface TargetSchool {
    id: string;
    school_name: string;
    mission_statement: string;
    primary_category: string;
}

const FIT_STYLES: Record<string, string> = {
    strong: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    moderate: 'text-amber-700 bg-amber-50 border-amber-200',
    weak: 'text-rose-700 bg-rose-50 border-rose-200',
};

export const SchoolTargetingPanel: React.FC<SchoolTargetingPanelProps> = ({ activity }) => {
    const { profile } = useProfile();
    const { addToast } = useToast();
    const targetIds = profile?.targetSchoolIds ?? [];

    const [schools, setSchools] = useState<TargetSchool[]>([]);
    const [alignments, setAlignments] = useState<SchoolAlignment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const targetKey = targetIds.join(',');

    useEffect(() => {
        let cancelled = false;
        if (targetIds.length === 0) {
            setSchools([]);
            return;
        }
        supabase
            .from('medical_schools')
            .select('id, school_name, mission_statement, primary_category')
            .in('id', targetIds)
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error) {
                    console.error('Failed to load target schools:', error);
                    return;
                }
                setSchools((data as TargetSchool[]) || []);
            });
        return () => { cancelled = true; };
    }, [targetKey]);

    const handleAnalyze = async () => {
        if (!activity.description || activity.description.trim().length < 40) {
            addToast('Write a bit more of your description first — the analysis reads from it.', 'info');
            return;
        }
        setIsLoading(true);
        try {
            const result = await geminiService.getSchoolAlignment(activity, schools);
            setAlignments(result);
        } catch (e: any) {
            const msg = e.message === 'AUTH_REQUIRED'
                ? 'You must be logged in to use AI features.'
                : (e.message || 'Failed to analyze alignment.');
            addToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const copySentence = async (text: string, idx: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 1800);
        } catch {
            // clipboard unavailable — not worth interrupting the user over
        }
    };

    return (
        <div className="mt-8 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm">School Targeting</h4>
                        <p className="text-[11px] text-slate-500">How this entry reads against the schools you are aiming for.</p>
                    </div>
                </div>
                {schools.length > 0 && (
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-60 shrink-0"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-brand-gold" />}
                        {isLoading ? 'Analyzing...' : alignments.length ? 'Re-analyze' : 'Analyze Fit'}
                    </button>
                )}
            </div>

            <div className="p-6">
                {schools.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                        No target schools yet. Star up to 5 in the <span className="font-bold text-slate-500">Recommender</span> to see how each activity lands with them.
                    </p>
                ) : alignments.length === 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {schools.map(s => (
                            <span key={s.id} className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                                {s.school_name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alignments.map((a, i) => (
                            <div key={i} className="border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <h5 className="font-bold text-slate-800 text-sm min-w-0 truncate">{a.schoolName}</h5>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${FIT_STYLES[a.fit] || FIT_STYLES.moderate}`}>
                                        {a.fit} fit
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">{a.rationale}</p>
                                {a.suggestedSentence ? (
                                    <div className="bg-brand-light/50 border border-brand-teal/20 rounded-lg p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-xs text-slate-700 font-serif italic leading-relaxed">{a.suggestedSentence}</p>
                                            <button
                                                onClick={() => copySentence(a.suggestedSentence, i)}
                                                className="p-1.5 text-slate-400 hover:text-brand-teal rounded shrink-0"
                                                title="Copy sentence"
                                            >
                                                {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic">No honest alignment sentence available for this one.</p>
                                )}
                            </div>
                        ))}
                        <p className="text-[10px] text-slate-400 leading-relaxed flex items-start gap-1.5 pt-1 border-t border-slate-100">
                            <Info className="w-3 h-3 shrink-0 mt-0.5" />
                            Suggestions are starting points, not copy-paste text. Only claim what you actually did — AdComs interview on these entries.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
