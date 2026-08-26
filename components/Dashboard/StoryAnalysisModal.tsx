import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2, AlertTriangle, Sparkles, Copy as CopyIcon, TrendingUp } from 'lucide-react';
import { Activity, StoryAnalysis } from '../../types';
import * as geminiService from '../../services/geminiService';

interface StoryAnalysisModalProps {
    activities: Activity[];
    onClose: () => void;
}

export const StoryAnalysisModal: React.FC<StoryAnalysisModalProps> = ({ activities, onClose }) => {
    const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const result = await geminiService.getStoryAnalysis(activities);
                if (!cancelled) setAnalysis(result);
            } catch (e: any) {
                if (!cancelled) {
                    setError(e.message === 'AUTH_REQUIRED'
                        ? 'You must be logged in to use AI features.'
                        : (e.message || 'Failed to analyze your application story.'));
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [activities]);

    const titleFor = (id: number) => activities.find(a => a.id === id)?.title || `Activity ${id}`;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-teal/10 p-2 rounded-xl">
                            <BookOpen className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h2 className="text-lg font-serif font-bold text-brand-dark leading-none">Your Application Story</h2>
                            <p className="text-slate-500 font-medium text-[10px] mt-1 uppercase tracking-wide">Portfolio-level narrative analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
                            <p className="text-slate-500 text-sm font-medium animate-pulse">Reading all {activities.length} entries as one story...</p>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-rose-50 text-brand-danger flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <p className="text-slate-700 font-bold text-sm">Couldn't analyze your story</p>
                            <p className="text-slate-500 text-xs max-w-sm">{error}</p>
                        </div>
                    )}

                    {analysis && !isLoading && (
                        <div className="space-y-5">
                            {/* Archetype + core narrative */}
                            <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal/20 blur-[60px] rounded-full pointer-events-none" />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-2">You read as</p>
                                    <h3 className="text-2xl font-serif font-bold text-white mb-3">{analysis.applicationArchetype}</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">{analysis.coreNarrative}</p>
                                </div>
                            </div>

                            {/* Strengths */}
                            {analysis.strengths?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> What's Working
                                    </h4>
                                    <div className="space-y-4">
                                        {analysis.strengths.map((s, i) => (
                                            <div key={i}>
                                                <p className="font-bold text-slate-800 text-sm mb-1">{s.title}</p>
                                                <p className="text-slate-600 text-xs leading-relaxed mb-1.5">{s.explanation}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {s.activityIds?.map(id => (
                                                        <span key={id} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{titleFor(id)}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing chapter */}
                            <div className="bg-white rounded-2xl border border-amber-200 p-5">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                                    <Sparkles className="w-3.5 h-3.5 text-brand-gold" /> Your Missing Chapter
                                </h4>
                                <p className="text-slate-700 text-sm leading-relaxed">{analysis.missingChapter}</p>
                            </div>

                            {/* Redundancies */}
                            {analysis.redundancies?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                        <CopyIcon className="w-3.5 h-3.5 text-slate-400" /> Overlapping Entries
                                    </h4>
                                    <div className="space-y-4">
                                        {analysis.redundancies.map((r, i) => (
                                            <div key={i}>
                                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                                    {r.activityIds?.map(id => (
                                                        <span key={id} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{titleFor(id)}</span>
                                                    ))}
                                                </div>
                                                <p className="text-slate-600 text-xs leading-relaxed">{r.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 border-t border-slate-100 bg-white">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        AI-generated strategic feedback. Treat it as one advisor's read, not a verdict — you know your story best.
                    </p>
                </div>
            </div>
        </div>
    );
};
