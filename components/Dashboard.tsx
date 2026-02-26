import React, { useState } from 'react';
import { Activity, ApplicationType, ActivityStatus, ThemeAnalysis } from '../types.ts';
import { ACTIVITY_WEIGHTS, AAMC_CORE_COMPETENCIES } from '../constants.ts';
import { MissionFitRadar } from './MissionFitRadar.tsx';
import { StarIconFilled } from './icons/StarIconFilled.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import {
    LayoutDashboard, BookOpen, BarChart2, Calendar, Settings,
    Search, Bell, ChevronRight, CheckCircle2, Clock, Map as MapIcon, Code, Image as ImageIcon,
    PenTool, FileText, ChevronLeft, Sparkles, X, ShieldCheck, ChevronDown,
    Rocket, HelpCircle, GraduationCap, Info,
    Activity as ActivityIcon, Brain, Trophy, Plus, LogOut,
    Briefcase, AlertTriangle, Heart, Users, Target, Award, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useDashboardState } from '../hooks/useDashboardState.ts';
import { useResumeProcessor } from '../hooks/useResumeProcessor.ts';
import { useToast } from '../contexts/ToastContext.tsx';

interface DashboardProps {
    activities: Activity[];
    onSelectActivity: (activityId: number) => void;
    appType: ApplicationType;
    onAppTypeChange: (appType: ApplicationType) => void;
    onToggleMME: (activityId: number) => void;
    onDeleteActivity: (activityId: number) => void;
    onImportActivities: (activities: Activity[]) => void;
}

const STATUS_CONFIG: { [key in ActivityStatus]: { color: string; icon: React.ReactNode } } = {
    [ActivityStatus.EMPTY]: { color: 'text-slate-400 bg-slate-100', icon: <Clock className="w-3 h-3" /> },
    [ActivityStatus.DRAFT]: { color: 'text-brand-teal bg-brand-light border-brand-teal/20', icon: <PenTool className="w-3 h-3" /> },
    [ActivityStatus.REFINED]: { color: 'text-brand-gold bg-amber-50 border-brand-gold/20', icon: <Sparkles className="w-3 h-3" /> },
    [ActivityStatus.FINAL]: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 className="w-3 h-3" /> },
};



// --- Helper Components ---
import { LoadingScreen } from './LoadingScreen';
import { NavItem } from './Dashboard/NavItem.tsx';
import { FocusCard } from './Dashboard/FocusCard.tsx';
import { CompetencyAuditModal } from './Dashboard/CompetencyAuditModal.tsx';
import { ResumeUploader } from './ResumeUploader.tsx';
import { ResumeReviewModal } from './ResumeReviewModal.tsx';

// --- Main Dashboard Component ---

export const Dashboard: React.FC<DashboardProps> = ({ activities, onSelectActivity, appType, onAppTypeChange, onToggleMME, onDeleteActivity, onImportActivities }) => {
    const { signOut } = useAuth();
    const {
        activeTab,
        setActiveTab,
        isCompetencyModalOpen,
        setIsCompetencyModalOpen,
        isReadinessModalOpen,
        setIsReadinessModalOpen,
        searchQuery,
        setSearchQuery,
        activitiesRef,
        scrollToActivities,
        handleOpenCompetencyAudit,
        filledActivities,
        filteredActivities,
        readiness
    } = useDashboardState(activities);

    const { addToast } = useToast();

    const {
        isProcessing: isResumeProcessing,
        error: resumeError,
        parsedActivities: parsedResumeActivities,
        processResumeText,
        reset: resetResumeProcessor
    } = useResumeProcessor();

    const [showResumeModal, setShowResumeModal] = useState(false);

    // Effect to show modal when activities are parsed
    React.useEffect(() => {
        if (parsedResumeActivities.length > 0) {
            setShowResumeModal(true);
            addToast("Resume parsed successfully!", "success");
        }
    }, [parsedResumeActivities, addToast]);

    // Effect to show error if any
    React.useEffect(() => {
        if (resumeError) {
            addToast(resumeError, "error");
        }
    }, [resumeError, addToast]);

    const handleResumeTextExtracted = (text: string) => {
        processResumeText(text);
    };

    const handleCloseResumeModal = () => {
        setShowResumeModal(false);
        resetResumeProcessor();
    };

    const handleImportActivities = (newActivities: Activity[]) => {
        // Here we would typically call a service to save to DB
        // For now, we update local state (which might be lost on refresh if not using a real DB hook sync)
        // Assuming 'onActivityUpdate' or similar exists, but useDashboardState consumes activities.
        // We probably need to "inject" these into the parent or call a save function.
        // Since DashboardProps has 'onActivitySelect', it doesn't seem to have 'onActivitiesAdded'.
        // Wait, Dashboard is a display component. 'activities' come from App.tsx or useActivityData hook?
        // Let's assume we need to pass a prop 'onImportActivities'.
        // For now, I'll log it or try to update if possible. 
        // Actually, looking at prompts, I should probably ask the user or just assume I need to add `onImportActivities` to props.
        // But let's check DashboardProps first.
        // It has `activities`, `onActivitySelect`, `onToggleMostMeaningful`.
        // I need to add `onImportActivities` to DashboardProps.
        // For this step, I'll add the logic assuming the prop exists or I'll add it.
        if (onImportActivities) {
            onImportActivities(newActivities);
            addToast(`Imported ${newActivities.length} activities.`, "success");
        } else {
            console.warn("onImportActivities prop missing");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-brand-light font-sans overflow-hidden">
            <aside className="w-64 bg-white m-4 rounded-[2rem] flex flex-col py-8 px-6 shadow-sm hidden md:flex z-10 overflow-y-auto scrollbar-hide">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center text-white"><PenTool className="w-5 h-5" /></div>
                    <span className="font-bold text-lg text-slate-800 tracking-tight">W&A Architect</span>
                </div>
                <nav className="space-y-2 mb-8">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        onClick={() => setActiveTab('overview')}
                        active={activeTab === 'overview'}
                    />
                    <NavItem
                        icon={<BookOpen size={20} />}
                        label="Activities"
                        onClick={scrollToActivities}
                        active={false}
                    />
                    <NavItem
                        icon={<BarChart2 size={20} />}
                        label="Analytics"
                        onClick={handleOpenCompetencyAudit}
                        active={false}
                    />
                    <div
                        onClick={() => setActiveTab('mission-fit')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${activeTab === 'mission-fit' ? 'bg-brand-teal text-white shadow-lg' : 'text-brand-teal hover:bg-brand-light hover:text-brand-teal-hover'}`}
                    >
                        <Target size={20} />
                        <span className="font-bold text-sm tracking-tight">Mission Fit Radar</span>
                    </div>
                </nav>

                {/* Sidebar Score Widget - Fixed UI */}
                <div
                    onClick={() => setIsReadinessModalOpen(true)}
                    className="bg-white border border-slate-100 rounded-3xl p-5 mb-6 shadow-sm cursor-pointer hover:border-brand-teal/30 transition-all group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">AdCom Readiness</h4>
                        <ShieldCheck className="w-4 h-4 text-brand-teal" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 mb-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="44" stroke="#F1F5F9" strokeWidth="8" fill="none" />
                                <circle
                                    cx="50" cy="50" r="44"
                                    stroke="#2E6B6B"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray="276.46"
                                    strokeDashoffset={276.46 - (276.46 * readiness.score) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-brand-dark leading-none">{readiness.score}</span>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">{readiness.level}</span>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-brand-teal transition-all duration-700" style={{ width: `${readiness.score}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="px-2">
                        <ResumeUploader
                            onTextExtracted={handleResumeTextExtracted}
                            isProcessing={isResumeProcessing}
                            compact={true}
                        />
                    </div>
                    <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => { }} />
                    <div onClick={signOut} className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                        <LogOut size={20} />
                        <span className="font-bold text-sm tracking-tight">Sign Out</span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col py-4 pr-4 overflow-hidden relative">
                <div className="flex-1 flex flex-col overflow-y-auto pl-4 md:pl-0 pr-2 scrollbar-hide">

                    {activeTab === 'overview' ? (
                        <div className="animate-fade-in">
                            <header className="flex justify-between items-center mb-8 pt-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-brand-dark font-serif">Dashboard</h1>
                                    <p className="text-slate-400 text-sm mt-1">Refine your narrative, track your readiness.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative hidden lg:block">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search activities..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-white pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-100 focus:ring-2 focus:ring-brand-teal/20 outline-none w-64 shadow-sm text-slate-600 placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                                <FocusCard onClick={handleOpenCompetencyAudit} icon={<Brain className="w-6 h-6 text-white" />} title="Competencies Saturation" subtitle={`${readiness.competencyCount}/15 Competencies`} color="bg-brand-teal" />
                                <FocusCard onClick={scrollToActivities} icon={<FileText className="w-6 h-6 text-white" />} title="Activity Hub" subtitle={`${filledActivities.length} Active Slots`} color="bg-brand-dark" />
                                <FocusCard onClick={() => setIsReadinessModalOpen(true)} icon={<Target className="w-6 h-6 text-brand-dark" />} title="AdCom Score" subtitle={`Level: ${readiness.level}`} color="bg-brand-gold" textColor="text-brand-dark" subtitleColor="text-brand-dark/80" />
                            </div>

                            <div className="mb-6" ref={activitiesRef}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Your Activity List</h2>
                                    <div className="flex gap-2 items-center">
                                        {/* The ResumeUploader was moved from here to the header */}
                                        <button onClick={() => onAppTypeChange(ApplicationType.AMCAS)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${appType === ApplicationType.AMCAS ? 'bg-brand-dark text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100'}`}>AMCAS</button>
                                        <button onClick={() => onAppTypeChange(ApplicationType.AACOMAS)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${appType === ApplicationType.AACOMAS ? 'bg-brand-dark text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100'}`}>AACOMAS</button>
                                    </div>
                                </div>
                                <div className="space-y-3 pb-10">
                                    {filteredActivities.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 border-dashed text-slate-400 text-sm">
                                            No activities found. Start listing your experiences early to audit gaps.<br />
                                            <button onClick={() => onSelectActivity(activities.length + 1)} className="text-brand-teal font-bold mt-2">Add Your First Activity</button>
                                        </div>
                                    ) : (
                                        filteredActivities.map(activity => (
                                            <div key={activity.id} onClick={() => onSelectActivity(activity.id)} className="group bg-white p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-sm transition-all border border-slate-100 hover:border-brand-teal/30">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.isMostMeaningful ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' : 'bg-slate-50 text-slate-400'}`}>
                                                        {activity.isMostMeaningful ? <Award className="w-5 h-5" /> : <ActivityIcon className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-teal transition-colors">{activity.title || "Untilled Slot"}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activity.experienceType || 'General Entry'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${STATUS_CONFIG[activity.status].color}`}>
                                                        {STATUS_CONFIG[activity.status].icon}
                                                        <span className="uppercase tracking-widest">{activity.status}</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); onDeleteActivity(activity.id); }} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <button onClick={() => onSelectActivity(activities.length + 1)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-sm hover:border-brand-teal hover:text-brand-teal hover:bg-brand-light/50 transition-all group flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                        Add Activity Slot
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in pt-4 h-full flex flex-col">
                            <header className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-brand-dark font-serif">Mission Fit Radar</h1>
                                    <p className="text-slate-400 text-sm mt-1">Strategic alignment with medical school archetypes.</p>
                                </div>
                            </header>
                            <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-y-auto pb-24 md:pb-8">
                                <MissionFitRadar activities={activities} onNavigateToRecommender={() => setActiveTab('school-recommender')} />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isReadinessModalOpen && (
                <ReadinessDetailModal
                    score={readiness.score}
                    level={readiness.level}
                    stats={readiness.stats}
                    feedback={readiness.feedback}
                    onClose={() => setIsReadinessModalOpen(false)}
                />
            )}
            {isCompetencyModalOpen && <CompetencyAuditModal activities={filledActivities} onClose={() => setIsCompetencyModalOpen(false)} />}

            {showResumeModal && (
                <ResumeReviewModal
                    isOpen={showResumeModal}
                    onClose={handleCloseResumeModal}
                    parsedActivities={parsedResumeActivities}
                    onImport={handleImportActivities}
                />
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 pb-safe">
                <div onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-brand-teal' : 'text-slate-400'}`}>
                    <LayoutDashboard size={24} />
                    <span className="text-[10px] font-bold">Dash</span>
                </div>
                <div onClick={scrollToActivities} className={`flex flex-col items-center gap-1 text-slate-400`}>
                    <BookOpen size={24} />
                    <span className="text-[10px] font-bold">List</span>
                </div>
                <div onClick={() => setActiveTab('mission-fit')} className={`flex flex-col items-center gap-1 ${activeTab === 'mission-fit' ? 'text-brand-teal' : 'text-slate-400'}`}>
                    <Target size={24} />
                    <span className="text-[10px] font-bold">Radar</span>
                </div>
                <div onClick={signOut} className={`flex flex-col items-center gap-1 text-rose-400`}>
                    <LogOut size={24} />
                    <span className="text-[10px] font-bold">Exit</span>
                </div>
            </nav>
        </div>
    );
};

const ReadinessDetailModal = ({ score, level, stats, feedback, onClose }: any) => {
    // Calculate Next Milestone
    let nextGoal = 40;
    let nextLabel = "Building";
    let tierColor = "text-slate-400";
    let nextTierColorBg = "bg-amber-100";
    let nextTierColorText = "text-amber-700";

    if (score >= 40) {
        nextGoal = 70;
        nextLabel = "Competitive";
        tierColor = "text-amber-400";
        nextTierColorBg = "bg-teal-100";
        nextTierColorText = "text-teal-800";
    }
    if (score >= 70) {
        nextGoal = 90;
        nextLabel = "Exceptional";
        tierColor = "text-brand-teal";
        nextTierColorBg = "bg-purple-100";
        nextTierColorText = "text-purple-800";
    }
    if (score >= 90) {
        nextGoal = 100;
        nextLabel = "Max Score";
        tierColor = "text-emerald-400";
        nextTierColorBg = "bg-emerald-100";
        nextTierColorText = "text-emerald-800";
    }

    const pointsToNext = Math.max(0, nextGoal - score);
    const progressToNext = Math.min(100, (score / nextGoal) * 100);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-teal/10 p-2 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-brand-dark leading-none">Not All Activities Are Created Equal</h2>
                            <p className="text-slate-500 font-medium text-[10px] mt-1 uppercase tracking-wide">Application Readiness Audit</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    <div className="max-w-6xl mx-auto p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">

                            {/* Left: Score Card */}
                            <div className="w-full lg:w-[360px] flex-shrink-0 sticky top-0">
                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 ring-1 ring-black/5 flex flex-col items-center">
                                    {/* Effects */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 blur-[50px] rounded-full pointer-events-none opacity-50"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-gold/10 blur-[50px] rounded-full pointer-events-none opacity-30"></div>

                                    {/* Ring */}
                                    <div className="relative w-48 h-48 mb-6 mt-4">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <defs>
                                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#2E6B6B" />
                                                    <stop offset="50%" stopColor="#34d399" />
                                                    <stop offset="100%" stopColor="#FFC82C" />
                                                </linearGradient>
                                            </defs>
                                            {/* Background Track */}
                                            <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="6" fill="none" strokeLinecap="round" />

                                            {/* Active Progress */}
                                            <circle cx="50" cy="50" r="42" stroke="url(#scoreGradient)" strokeWidth="6" fill="none" strokeDasharray="263.89" strokeDashoffset={263.89 - (263.89 * score) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                                            <span className="text-6xl font-black tracking-tighter text-white drop-shadow-lg leading-none">{score}</span>
                                            <span className={`text-sm font-bold uppercase tracking-widest mt-2 ${tierColor}`}>{level}</span>
                                        </div>
                                    </div>

                                    {/* "Next Milestone" Box Integrated at Bottom */}
                                    {score < 100 && (
                                        <div className="w-full bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Milestone</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${nextTierColorBg} ${nextTierColorText}`}>{nextLabel}</span>
                                            </div>

                                            <div className="flex items-baseline justify-between mb-2">
                                                <span className="text-sm text-slate-300 font-medium">Points to Level Up</span>
                                                <span className="text-2xl font-bold text-white">{pointsToNext}</span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-gold shadow-[0_0_10px_rgba(255,200,44,0.5)] transition-all duration-1000"
                                                    style={{ width: `${progressToNext}%` }}
                                                ></div>
                                            </div>

                                            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
                                                Your score is calculated based on hours, role weighting, and competency saturation.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Data */}
                            <div className="flex-1 w-full space-y-8 pb-10">

                                {/* Benchmarks Grid */}
                                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                                    <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                                        <div className="p-1 bg-brand-light rounded-md"><Target className="w-3 h-3 text-brand-teal" /></div>
                                        Core Benchmarks
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                        {Object.values(stats).map((stat: any, i) => {
                                            const percent = Math.min((stat.val / stat.target) * 100, 100);
                                            const isMet = stat.val >= stat.target;
                                            return (
                                                <div key={i} className="group">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2 group-hover:text-brand-teal transition-colors">
                                                            {isMet ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>}
                                                            {stat.label}
                                                        </span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-sm font-black font-mono ${isMet ? 'text-emerald-600' : 'text-slate-800'}`}>{stat.val}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">/ {stat.target}{stat.label.includes('Depth') ? '' : 'h'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 relative ${isMet ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                            style={{ width: `${percent}%` }}
                                                        >
                                                            {isMet && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Actionable Strategy */}
                                {feedback.length > 0 && (
                                    <div>
                                        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mb-4 px-2">
                                            <div className="p-1 bg-amber-50 rounded-md"><Zap className="w-3 h-3 text-amber-500" /></div>
                                            Priority Actions ({feedback.length})
                                        </h3>
                                        <div className="flex flex-col gap-3">
                                            {feedback.map((item: any, i: number) => (
                                                <div key={i} className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl bg-white border ${item.borderColor} shadow-sm hover:shadow-md transition-all`}>
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.color} bg-slate-50 border border-slate-100`}>
                                                        {React.cloneElement(item.icon, { className: "w-5 h-5" })}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</div>
                                                        </div>
                                                        <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{item.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {feedback.length === 0 && (
                                    <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm mb-4">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-emerald-900 text-lg">Application Ready!</h4>
                                        <p className="text-emerald-700 text-sm mt-1 max-w-md">You have met all primary volume and competency benchmarks. Focus now on refining your narrative voice in the Editor.</p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white z-20 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 text-sm flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Return to Studio
                    </button>
                </div>

            </div>
        </div>
    );
};

const ArrowLeft = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);