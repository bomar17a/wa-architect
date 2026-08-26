import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles, PenTool, Target, Loader2 } from 'lucide-react';
import { Activity, ApplicationType } from '../../types';
import { SCHOOL_ARCHETYPES } from '../MissionFitRadar';
import { useResumeProcessor } from '../../hooks/useResumeProcessor';
import { useToast } from '../../contexts/ToastContext';

interface OnboardingWizardProps {
    appType: ApplicationType;
    onAppTypeChange: (appType: ApplicationType) => void;
    onImportActivities: (activities: Activity[]) => void;
    onComplete: () => void;
}

const SCHOOL_TIERS = ['Community/Regional', 'MD Mid-tier', 'MD Top 50', 'Research-focused'];
const CYCLE_STORAGE_KEY = 'wa-architect-cycleYear';
const TIER_STORAGE_KEY = 'wa-architect-schoolTier';
const GPA_STORAGE_KEY = 'wa-architect-gpaRange';
const MCAT_STORAGE_KEY = 'wa-architect-mcatRange';
const NORTHSTAR_STORAGE_KEY = 'wa-architect-northstarArchetypes';

const currentYear = new Date().getFullYear();
const GPA_RANGES = ['< 3.0', '3.0 - 3.4', '3.5 - 3.7', '3.8 - 4.0'];
const MCAT_RANGES = ['< 494', '494 - 503', '504 - 511', '512+'];

const StepDots: React.FC<{ step: number }> = ({ step }) => (
    <div className="flex items-center gap-2 justify-center mb-8">
        {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 rounded-full transition-all ${n === step ? 'w-8 bg-brand-teal' : n < step ? 'w-4 bg-brand-teal/40' : 'w-4 bg-slate-200'}`} />
        ))}
    </div>
);

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ appType, onAppTypeChange, onImportActivities, onComplete }) => {
    const [step, setStep] = useState(1);
    const [cycleYear, setCycleYear] = useState<number>(currentYear + 1);
    const [schoolTier, setSchoolTier] = useState<string>('');
    const [gpaRange, setGpaRange] = useState<string>('');
    const [mcatRange, setMcatRange] = useState<string>('');

    const [resumeText, setResumeText] = useState('');
    const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);

    const { addToast } = useToast();
    const { isProcessing, parsedActivities, processResumeText, error } = useResumeProcessor();
    const [importedCount, setImportedCount] = useState<number | null>(null);

    const finish = () => {
        localStorage.setItem(CYCLE_STORAGE_KEY, String(cycleYear));
        if (schoolTier) localStorage.setItem(TIER_STORAGE_KEY, schoolTier);
        if (gpaRange) localStorage.setItem(GPA_STORAGE_KEY, gpaRange);
        if (mcatRange) localStorage.setItem(MCAT_STORAGE_KEY, mcatRange);
        if (selectedArchetypes.length > 0) localStorage.setItem(NORTHSTAR_STORAGE_KEY, JSON.stringify(selectedArchetypes));
        onComplete();
    };

    const handleParseResume = async () => {
        if (!resumeText.trim()) {
            addToast('Paste something first — even a rough list works.', 'info');
            return;
        }
        await processResumeText(resumeText);
    };

    const handleImportParsed = () => {
        onImportActivities(parsedActivities);
        setImportedCount(parsedActivities.length);
        addToast(`Imported ${parsedActivities.length} activities — you can refine them anytime.`, 'success');
    };

    const toggleArchetype = (id: string) => {
        setSelectedArchetypes(prev => {
            if (prev.includes(id)) return prev.filter(a => a !== id);
            if (prev.length >= 2) return [prev[1], id];
            return [...prev, id];
        });
    };

    return (
        <div className="fixed inset-0 bg-brand-light z-[200] overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 min-h-screen flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center text-white"><PenTool className="w-4 h-4" /></div>
                        <span className="font-bold text-slate-800 tracking-tight">W&A Architect</span>
                    </div>
                    <button onClick={finish} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Skip setup</button>
                </div>

                <StepDots step={step} />

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-10 flex-1">
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1">Let's set up your profile</h2>
                                <p className="text-slate-500 text-sm">Two minutes — this calibrates the dashboard to your actual cycle.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Application System</label>
                                <div className="flex gap-2">
                                    <button onClick={() => onAppTypeChange(ApplicationType.AMCAS)} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${appType === ApplicationType.AMCAS ? 'bg-brand-dark text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>AMCAS</button>
                                    <button onClick={() => onAppTypeChange(ApplicationType.AACOMAS)} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${appType === ApplicationType.AACOMAS ? 'bg-brand-dark text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>AACOMAS</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Target Application Cycle</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[currentYear, currentYear + 1, currentYear + 2].map(y => (
                                        <button key={y} onClick={() => setCycleYear(y)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${cycleYear === y ? 'bg-brand-teal text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>{y}</button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Target School Tier</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SCHOOL_TIERS.map(tier => (
                                        <button key={tier} onClick={() => setSchoolTier(tier)} className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${schoolTier === tier ? 'bg-brand-teal text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>{tier}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">GPA Range <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                                    <select value={gpaRange} onChange={e => setGpaRange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-teal/20">
                                        <option value="">Prefer not to say</option>
                                        {GPA_RANGES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">MCAT Range <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                                    <select value={mcatRange} onChange={e => setMcatRange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-teal/20">
                                        <option value="">Prefer not to say</option>
                                        {MCAT_RANGES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1">Quick activity inventory</h2>
                                <p className="text-slate-500 text-sm">List everything you've done — paste your resume or just a rough list. We'll organize it into slots you can refine later.</p>
                            </div>
                            <textarea
                                value={resumeText}
                                onChange={e => setResumeText(e.target.value)}
                                rows={8}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none"
                                placeholder={"Example:\nED Volunteer, City General Hospital, Jun 2023 - May 2024, 180 hrs\nUndergraduate Researcher, Biology Dept, Aug 2022 - present..."}
                            />
                            <button
                                onClick={handleParseResume}
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {isProcessing ? 'Parsing...' : 'Parse with AI'}
                            </button>

                            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

                            {parsedActivities.length > 0 && importedCount === null && (
                                <div className="bg-brand-light/60 border border-brand-teal/20 rounded-xl p-4">
                                    <p className="text-sm font-bold text-slate-800 mb-2">Found {parsedActivities.length} activities</p>
                                    <ul className="text-xs text-slate-500 space-y-1 mb-3 max-h-32 overflow-y-auto">
                                        {parsedActivities.map(a => <li key={a.id}>• {a.title}</li>)}
                                    </ul>
                                    <button onClick={handleImportParsed} className="flex items-center gap-1.5 px-4 py-2 bg-brand-dark text-white text-xs font-bold rounded-lg">
                                        <Check className="w-3.5 h-3.5" /> Import All &amp; Continue
                                    </button>
                                </div>
                            )}

                            {importedCount !== null && (
                                <p className="text-sm text-emerald-600 font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> {importedCount} activities imported — you're set for now.</p>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1">What kind of doctor do you want to be?</h2>
                                <p className="text-slate-500 text-sm">Pick 1-2 archetypes. This sets your default comparison in Mission Fit Radar and biases school recommendations.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {SCHOOL_ARCHETYPES.map(arch => {
                                    const isSelected = selectedArchetypes.includes(arch.id);
                                    return (
                                        <button
                                            key={arch.id}
                                            onClick={() => toggleArchetype(arch.id)}
                                            className={`text-left p-4 rounded-xl border transition-all ${isSelected ? arch.activeColor + ' shadow-md' : arch.color + ' opacity-80 hover:opacity-100'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm">{arch.name}</span>
                                                {isSelected && <Check className="w-4 h-4" />}
                                            </div>
                                            <p className={`text-xs ${isSelected ? 'opacity-90' : 'opacity-70'}`}>{arch.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        className={`flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors ${step === 1 ? 'invisible' : ''}`}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-teal-hover text-white text-sm font-bold rounded-xl shadow-md transition-all"
                        >
                            Continue <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={finish}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-dark hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all"
                        >
                            <Target className="w-4 h-4" /> Finish Setup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
