import React from 'react';
import { Activity, ApplicationType, ActivityStatus } from '../types.ts';
import { AMCAS_EXPERIENCE_TYPES, AACOMAS_EXPERIENCE_TYPES, DESC_LIMITS, MONTHS, getYears, AAMC_CORE_COMPETENCIES } from '../constants.ts';
import { useActivityForm } from '../hooks/useActivityForm.ts';
import { getDateError } from '../utils/validation.ts';
import { FourStepWriter } from './FourStepWriter.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';
import { StarIconFilled } from './icons/StarIconFilled.tsx';
import { StarIconOutline } from './icons/StarIconOutline.tsx';
import {
    Wand2, X, ArrowLeft,
    MapPin, Building, User, Clock,
    PenLine, AlertCircle, Sparkles, Plus, Trash2, Target, ChevronDown
} from 'lucide-react';
import { CharacterCounter } from './Activity/CharacterCounter.tsx';
import { CoPilotEditor } from './Activity/CoPilotEditor.tsx';
import { DateSelect } from './Activity/DateSelect.tsx';

type SaveStatus = 'UNSAVED' | 'SAVING' | 'SAVED';

const YEARS = getYears();

interface ActivityEditorProps {
    activity: Activity;
    onSave: (activity: Activity) => void;
    onBack: () => void;
    appType: ApplicationType;
}

// --- Main Component ---

export const ActivityEditor: React.FC<ActivityEditorProps> = ({ activity, onSave, onBack, appType }) => {
    const {
        localActivity,
        handleChange,
        saveStatus,
        isWizardMode,
        setIsWizardMode,
        isAnalyzeOpen,
        setIsAnalyzeOpen,
        analysis,
        isAnalyzing,
        completedRanges,
        anticipatedRange,
        isRepeated,
        updateRange,
        toggleRepeated,
        addRepeatedRange,
        removeRange,
        handleSaveAndClose,
        handleAnalyzeDraft
    } = useActivityForm(activity, onSave, onBack, appType);

    const experienceTypes = appType === ApplicationType.AMCAS ? AMCAS_EXPERIENCE_TYPES : AACOMAS_EXPERIENCE_TYPES;

    if (isWizardMode) {
        return (
            <div className="fixed inset-0 bg-brand-light z-50 overflow-y-auto animate-fade-in">
                <div className="max-w-4xl mx-auto py-10 px-4">
                    <FourStepWriter
                        charLimit={DESC_LIMITS[appType]}
                        onApply={(text) => { handleChange('description', text); setIsWizardMode(false); }}
                        onCancel={() => setIsWizardMode(false)}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-brand-light flex flex-col z-20 overflow-y-auto scroll-smooth overscroll-contain">
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
                    <button onClick={onBack} className="group flex items-center gap-2 text-slate-500 hover:text-brand-dark transition-colors p-3 md:p-0 -ml-3 md:ml-0">
                        <div className="p-1.5 rounded-full bg-slate-100 group-hover:bg-slate-200">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Return to Hub</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={localActivity.status === ActivityStatus.EMPTY ? ActivityStatus.DRAFT : localActivity.status}
                                onChange={(e) => handleChange('status', e.target.value as ActivityStatus)}
                                className={`
                            appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer outline-none border transition-all shadow-sm
                            ${localActivity.status === ActivityStatus.FINAL ? 'bg-emerald-100 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20' :
                                        localActivity.status === ActivityStatus.REFINED ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20' :
                                            'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 focus:ring-slate-200'}
                        `}
                            >
                                <option value={ActivityStatus.DRAFT}>Draft</option>
                                <option value={ActivityStatus.REFINED}>Polished</option>
                                <option value={ActivityStatus.FINAL}>Final</option>
                            </select>
                            <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${localActivity.status === ActivityStatus.FINAL ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>

                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            {saveStatus === 'SAVING' && <span className="flex items-center gap-2 text-xs text-slate-400"><div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-pulse" />Saving...</span>}
                            {saveStatus === 'SAVED' && <span className="flex items-center gap-2 text-xs text-brand-teal font-medium"><CheckIcon className="w-3 h-3" />Saved</span>}
                        </div>
                        <button onClick={handleSaveAndClose} className="bg-brand-dark text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-black shadow-sm transition-all">
                            Done
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pb-16">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                Activity Details
                                {localActivity.isMostMeaningful && <StarIconFilled className="w-5 h-5 text-brand-gold" />}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Refine core logistics and competencies.</p>
                        </div>
                        {appType === ApplicationType.AMCAS && (
                            <label className={`cursor-pointer group flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${localActivity.isMostMeaningful ? 'bg-amber-50 border-brand-gold/30 ring-1 ring-brand-gold/20' : 'bg-white border-slate-200'}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${localActivity.isMostMeaningful ? 'text-brand-gold' : 'text-slate-300'}`}>
                                    {localActivity.isMostMeaningful ? <StarIconFilled className="w-5 h-5" /> : <StarIconOutline className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className={`text-xs font-bold uppercase tracking-wide ${localActivity.isMostMeaningful ? 'text-amber-800' : 'text-slate-600'}`}>Most Meaningful</span>
                                </div>
                                <input type="checkbox" className="hidden" checked={localActivity.isMostMeaningful} onChange={(e) => handleChange('isMostMeaningful', e.target.checked)} />
                            </label>
                        )}
                    </div>

                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Experience Type</label>
                                <div className="relative">
                                    <select value={localActivity.experienceType} onChange={(e) => handleChange('experienceType', e.target.value)} className="w-full bg-slate-50 border border-transparent focus:border-brand-teal/30 text-slate-700 text-base md:text-sm rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all appearance-none font-medium">
                                        <option value="">Select a category...</option>
                                        {experienceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Experience Name</label>
                                <input type="text" value={localActivity.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full bg-slate-50 border border-transparent focus:border-brand-teal/30 text-slate-800 text-base md:text-sm font-semibold rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all" placeholder="e.g. Clinical Volunteer" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Building className="w-3 h-3" /> Organization</label>
                                <input type="text" value={localActivity.organization} onChange={(e) => handleChange('organization', e.target.value)} className="w-full bg-slate-50 border border-transparent focus:border-brand-teal/30 text-slate-800 text-base md:text-sm font-medium rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all" placeholder="e.g. St. Mary's Medical Center" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand-teal uppercase flex items-center gap-2"><Target className="w-3 h-3" /> Target Finish Date</label>
                                <input type="date" value={localActivity.dueDate || ''} onChange={(e) => handleChange('dueDate', e.target.value)} className="w-full bg-brand-light border border-transparent focus:border-brand-teal/30 text-slate-800 text-base md:text-sm font-medium rounded-lg p-3 outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all" />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-teal" /> Location</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={localActivity.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full bg-slate-50 border-none rounded-md text-base md:text-sm p-2 focus:ring-2 focus:ring-brand-teal/20" placeholder="City" />
                                    <input value={localActivity.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full bg-slate-50 border-none rounded-md text-base md:text-sm p-2 focus:ring-2 focus:ring-brand-teal/20" placeholder="Country" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-brand-teal" /> Point of Contact</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input value={localActivity.contactName} onChange={(e) => handleChange('contactName', e.target.value)} className="w-full bg-slate-50 border-none rounded-md text-base md:text-sm p-2 focus:ring-2 focus:ring-brand-teal/20" placeholder="Name" />
                                        <input value={localActivity.contactTitle} onChange={(e) => handleChange('contactTitle', e.target.value)} className="w-full bg-slate-50 border-none rounded-md text-base md:text-sm p-2 focus:ring-2 focus:ring-brand-teal/20" placeholder="Title" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full"></div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-brand-teal" /> Completed Hours</h3>
                            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-4">
                                {completedRanges.map((range, index) => {
                                    const error = getDateError(range);
                                    return (
                                        <div key={range.id} className="flex flex-col gap-1">
                                            <div className={`relative grid grid-cols-2 md:grid-cols-[1fr_auto_1fr_auto_100px_auto] gap-4 md:gap-2 items-center p-3 rounded-lg border shadow-sm transition-colors ${error ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                                                <div className="col-span-1 md:col-span-1">
                                                    <DateSelect month={range.startDateMonth} year={range.startDateYear} onChange={(m, y) => updateRange(range.id, 'startDateMonth', m)} onYearChange={(y) => updateRange(range.id, 'startDateYear', y)} label="Start" />
                                                </div>
                                                <span className="hidden md:block text-slate-300 text-xs mt-4">to</span>
                                                <div className="col-span-1 md:col-span-1">
                                                    <DateSelect month={range.endDateMonth} year={range.endDateYear} onChange={(m, y) => updateRange(range.id, 'endDateMonth', m)} onYearChange={(y) => updateRange(range.id, 'endDateYear', y)} label="End" />
                                                </div>
                                                <div className="hidden md:block h-8 w-px bg-slate-100 mx-2"></div>
                                                <div className="relative col-span-1 md:col-span-1">
                                                    <label className="absolute -top-3 left-0 text-[9px] font-bold text-slate-400 uppercase">Hours</label>
                                                    <input type="number" value={range.hours || ''} onChange={(e) => updateRange(range.id, 'hours', e.target.value)} className="w-full bg-slate-50 hover:bg-white border border-transparent rounded-md text-base md:text-sm p-1.5 focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all font-medium text-right" placeholder="0" />
                                                </div>
                                                {index > 0 && (
                                                    <button onClick={() => removeRange(range.id)} className="col-span-1 md:col-span-1 justify-self-end md:justify-self-auto p-1.5 text-slate-400 hover:text-rose-500 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                            {error && <span className="text-xs text-rose-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</span>}
                                        </div>
                                    )
                                })}
                                <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">Repeated?</span>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={isRepeated} onChange={() => toggleRepeated(true)} className="text-brand-teal" /><span className="text-sm text-slate-600">Yes</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!isRepeated} onChange={() => toggleRepeated(false)} className="text-brand-teal" /><span className="text-sm text-slate-600">No</span></label>
                                    </div>
                                    {isRepeated && completedRanges.length < 4 && (
                                        <button onClick={addRepeatedRange} className="ml-auto text-xs font-bold text-brand-teal hover:bg-brand-light px-2 py-1 rounded transition-colors"><Plus className="w-3 h-3" /> Add Range</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-serif font-bold text-slate-800 flex items-center gap-2"><PenLine className="w-5 h-5 text-brand-teal" /> Narrative Studio</h3>
                        <CharacterCounter text={localActivity.description} limit={DESC_LIMITS[appType]} />
                    </div>
                    <div className="relative group">
                        <div className="w-full relative bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col">
                            <div className="absolute -top-3 right-4 flex gap-2 z-20">
                                <button onClick={() => setIsWizardMode(true)} className="flex items-center gap-1.5 bg-brand-teal hover:bg-brand-teal-hover text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md"><Wand2 className="w-3.5 h-3.5" /> Wizard</button>
                                <button onClick={handleAnalyzeDraft} disabled={isAnalyzing} className="flex items-center gap-1.5 bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                    {isAnalyzing ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-brand-gold" />} Analyze
                                </button>
                            </div>
                            {analysis && isAnalyzeOpen && (
                                <div className="bg-amber-50/50 border-b border-amber-100 p-5 animate-slide-up relative z-10">
                                    <button onClick={() => setIsAnalyzeOpen(false)} className="absolute top-3 right-3 text-amber-400"><X className="w-4 h-4" /></button>
                                    <p className="text-sm font-serif text-slate-700 italic leading-relaxed mb-4">"{analysis.generalFeedback}"</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/60 p-3 rounded-lg border border-amber-100">
                                            <h5 className="font-bold text-emerald-700 text-xs uppercase mb-2 flex items-center gap-1"><CheckIcon className="w-3 h-3" /> Keepers</h5>
                                            <ul className="space-y-1">{analysis.keepers.map((k, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">• {k}</li>)}</ul>
                                        </div>
                                    </div>
                                    {analysis.frameworkAlignment && (
                                        <div className="mt-4 bg-white/60 p-4 rounded-lg border border-indigo-100">
                                            <h5 className="font-bold text-indigo-700 text-xs uppercase mb-3 flex items-center gap-1"><Wand2 className="w-3 h-3" /> Framework Alignment</h5>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700">Context: </span>
                                                    <span className="text-xs text-slate-600">{analysis.frameworkAlignment.context}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700">Impact: </span>
                                                    <span className="text-xs text-slate-600">{analysis.frameworkAlignment.impact}</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700">Reflection: </span>
                                                    <span className="text-xs text-slate-600">{analysis.frameworkAlignment.reflection}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex-1 relative rounded-xl overflow-hidden">
                                <CoPilotEditor text={localActivity.description} onTextChange={(val) => handleChange('description', val)} className="w-full p-8 text-lg font-serif text-slate-800 leading-relaxed min-h-[400px]" placeholder="Draft your story here..." />
                            </div>
                        </div>
                    </div>

                    {/* Competency Map Indicator */}
                    <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-4 flex items-center justify-between border-b border-slate-200/50 bg-white/50">
                            <div className="flex items-center gap-4">
                                <Target className="w-4 h-4 text-brand-teal" />
                                <h4 className="font-bold text-slate-800 text-sm">Competency Map</h4>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-brand-gold" /> Theme Detection Active
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {AAMC_CORE_COMPETENCIES.map((competency, i) => {
                                    const isDetected = localActivity.competencies?.includes(competency);
                                    return (
                                        <div
                                            key={i}
                                            className={`relative flex items-center p-3 rounded-lg border text-xs font-medium transition-all duration-500 cursor-default select-none ${isDetected ? 'bg-brand-teal border-brand-teal text-white shadow-md scale-105 z-10' : 'bg-slate-100 border-slate-200 text-slate-300 opacity-60'}`}
                                        >
                                            <span className="leading-snug">{competency}</span>
                                            {isDetected && (
                                                <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 text-white/50 animate-pulse" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="mt-6 text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                                Detected themes automatically populate from your Narrative Studio writing
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
