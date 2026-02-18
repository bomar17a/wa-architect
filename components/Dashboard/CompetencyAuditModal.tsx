import React from 'react';
import { Activity } from '../../types';
import { AAMC_CORE_COMPETENCIES } from '../../constants';
import { Brain, X, CheckCircle2 } from 'lucide-react';

interface CompetencyAuditModalProps {
    activities: Activity[];
    onClose: () => void;
}

export const CompetencyAuditModal: React.FC<CompetencyAuditModalProps> = ({ activities, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-teal/10 p-2 rounded-xl">
                        <Brain className="w-5 h-5 text-brand-teal" />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-brand-dark leading-none">Competency Matrix</h2>
                        <p className="text-slate-500 font-medium text-[10px] mt-1 uppercase tracking-wide">AAMC Core Competencies Coverage</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {AAMC_CORE_COMPETENCIES.map((comp, i) => {
                        const related = activities.filter(a => a.competencies?.includes(comp));
                        const isMet = related.length > 0;
                        return (
                            <div key={i} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${isMet ? 'bg-white border-brand-teal/30 shadow-sm' : 'bg-slate-100/50 border-slate-200 opacity-60 grayscale'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className={`text-xs font-black uppercase tracking-wider leading-relaxed pr-4 ${isMet ? 'text-brand-dark' : 'text-slate-400'}`}>{comp}</h4>
                                    {isMet ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0"></div>}
                                </div>
                                {isMet ? (
                                    <div className="space-y-1.5">
                                        {related.map(a => (
                                            <div key={a.id} className="flex items-center gap-2 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                                <div className="w-1 h-1 rounded-full bg-brand-teal flex-shrink-0"></div>
                                                <span className="truncate">{a.title || "Untitled Activity"}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic">No evidence detected yet.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    </div>
);
