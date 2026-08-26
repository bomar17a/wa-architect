import React, { useState } from 'react';
import { MessageSquareQuote, RefreshCw, Loader2, Lightbulb } from 'lucide-react';
import { Activity, InterviewQuestion } from '../../types';
import * as geminiService from '../../services/geminiService';
import { useToast } from '../../contexts/ToastContext';

interface InterviewPrepPanelProps {
    activity: Activity;
}

export const InterviewPrepPanel: React.FC<InterviewPrepPanelProps> = ({ activity }) => {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const { addToast } = useToast();

    const handleGenerate = async () => {
        if (!activity.description || activity.description.trim().length < 40) {
            addToast('Write a bit more of your description first — the questions are drawn from it.', 'info');
            return;
        }
        setIsLoading(true);
        try {
            const result = await geminiService.getInterviewQuestions(activity);
            setQuestions(result);
            setAnswers({});
            setHasGenerated(true);
        } catch (e: any) {
            const msg = e.message === 'AUTH_REQUIRED'
                ? 'You must be logged in to use AI features.'
                : (e.message || 'Failed to generate interview questions.');
            addToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-8 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-highlight/10 text-brand-highlight flex items-center justify-center shrink-0">
                        <MessageSquareQuote className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm">Interview Prep</h4>
                        <p className="text-[11px] text-slate-500">Anything you list is fair game in an interview. Practice before it counts.</p>
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-60 shrink-0"
                >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {isLoading ? 'Generating...' : hasGenerated ? 'New Questions' : 'Generate Questions'}
                </button>
            </div>

            <div className="p-6">
                {questions.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                        Generate 5 interview questions grounded in what you actually wrote for this activity.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {questions.map((q, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-brand-dark text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 leading-relaxed">{q.question}</p>
                                        <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1.5">
                                            <Lightbulb className="w-3 h-3 text-brand-gold shrink-0 mt-0.5" />
                                            <span>{q.whyAsked}</span>
                                        </p>
                                    </div>
                                </div>
                                <textarea
                                    value={answers[i] || ''}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                                    rows={3}
                                    className="w-full ml-9 bg-slate-50 border border-transparent focus:border-brand-teal/30 text-slate-700 text-sm rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all resize-none"
                                    style={{ width: 'calc(100% - 2.25rem)' }}
                                    placeholder="Practice your answer out loud, then jot the key beats here..."
                                />
                            </div>
                        ))}
                        <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
                            Practice notes aren't saved — they're a scratchpad for rehearsing.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
