import React, { useState, useMemo } from 'react';
import { Activity, ApplicationType, ActivityStatus, ThemeAnalysis } from '../types.ts';
import { AAMC_CORE_COMPETENCIES, DESC_LIMITS } from '../constants.ts';
import { MissionFitRadar } from './MissionFitRadar.tsx';
import { SchoolRecommender } from './SchoolRecommender.tsx';
import { StarIconFilled } from './icons/StarIconFilled.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import {
    LayoutDashboard, BookOpen, BarChart2, Calendar, Settings,
    Search, Bell, ChevronRight, CheckCircle2, Clock, Map as MapIcon, Code, Image as ImageIcon,
    PenTool, FileText, ChevronLeft, Sparkles, X, ShieldCheck, ChevronDown,
    Rocket, HelpCircle, GraduationCap, Info, Building,
    Activity as ActivityIcon, Brain, Trophy, Plus, LogOut,
    Briefcase, AlertTriangle, Heart, Users, Target, Award, Zap, FileDown, ChevronUp
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
    onReorderActivities: (orderedIds: number[]) => void;
    onImportActivities: (activities: Activity[]) => void;
}

const STATUS_CONFIG: { [key in ActivityStatus]: { badgeClass: string; barColor: string; icon: React.ReactNode; label: string } } = {
    [ActivityStatus.EMPTY]: { badgeClass: 'text-slate-400 bg-slate-100', barColor: 'bg-slate-200', icon: <Clock className="w-2.5 h-2.5" />, label: 'Empty' },
    [ActivityStatus.DRAFT]: { badgeClass: 'text-brand-teal bg-brand-light', barColor: 'bg-brand-teal', icon: <PenTool className="w-2.5 h-2.5" />, label: 'Draft' },
    [ActivityStatus.REFINED]: { badgeClass: 'text-amber-700 bg-amber-50', barColor: 'bg-amber-400', icon: <Sparkles className="w-2.5 h-2.5" />, label: 'Polished' },
    [ActivityStatus.FINAL]: { badgeClass: 'text-emerald-600 bg-emerald-50', barColor: 'bg-emerald-500', icon: <CheckCircle2 className="w-2.5 h-2.5" />, label: 'Final' },
};

const getTierBadgeClass = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
    if (score >= 70) return 'bg-brand-teal/20 text-teal-300 border border-brand-teal/30';
    if (score >= 40) return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
    return 'bg-slate-500/15 text-slate-300 border border-slate-500/20';
};



// --- Helper Components ---
import { LoadingScreen } from './LoadingScreen';
import { NavItem } from './Dashboard/NavItem.tsx';
import { FocusCard } from './Dashboard/FocusCard.tsx';
import { CompetencyAuditModal } from './Dashboard/CompetencyAuditModal.tsx';
import { ResumeUploader } from './ResumeUploader.tsx';
import { ResumeReviewModal } from './ResumeReviewModal.tsx';
import { SettingsModal } from './Dashboard/SettingsModal.tsx';
import { ExportModal } from './Dashboard/ExportModal.tsx';
import { StoryAnalysisModal } from './Dashboard/StoryAnalysisModal.tsx';
import { ScoreDial } from './Dashboard/ScoreDial.tsx';
import { motion } from 'framer-motion';
import { runRedFlagAudit } from '../services/redFlagService.ts';
import { scoreNarrativeQuality, narrativeQualityTier } from '../services/narrativeQualityService.ts';

// --- Main Dashboard Component ---

export const Dashboard: React.FC<DashboardProps> = ({ activities, onSelectActivity, appType, onAppTypeChange, onToggleMME, onDeleteActivity, onImportActivities, onReorderActivities }) => {
    const { user, signOut } = useAuth();
    const {
        activeTab,
        setActiveTab,
        isCompetencyModalOpen,
        setIsCompetencyModalOpen,
        isReadinessModalOpen,
        setIsReadinessModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        searchQuery,
        setSearchQuery,
        cycleYear,
        setCycleYear,
        amcasInfo,
        activitiesRef,
        scrollToActivities,
        handleOpenCompetencyAudit,
        filledActivities,
        filteredActivities,
        readiness,
        upcomingDeadlines
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
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());
    const redFlags = useMemo(() => runRedFlagAudit(activities), [activities]);
    const visibleFlags = useMemo(() => redFlags.filter(f => !dismissedFlags.has(f.id)), [redFlags, dismissedFlags]);
    const dismissFlag = (id: string) => setDismissedFlags(prev => new Set(prev).add(id));

    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Reordering acts on the full filled list, not the filtered view — otherwise
    // dropping while a search is active would silently reshuffle hidden entries.
    const isReorderable = !searchQuery;

    const moveActivity = (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || to >= filledActivities.length) return;
        const next = [...filledActivities];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onReorderActivities(next.map(a => a.id));
    };

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

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || "Scholar";

    const primaryGap = readiness.feedback.length > 0 ? readiness.feedback[0] : null;
    const amcasUrgencyClass = amcasInfo.urgency === 'red' ? 'text-brand-danger' : amcasInfo.urgency === 'amber' ? 'text-amber-500' : 'text-brand-teal';

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
                    <div
                        onClick={() => setActiveTab('mission-fit')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${activeTab === 'mission-fit' ? 'bg-brand-teal text-white shadow-lg' : 'text-brand-teal hover:bg-brand-light hover:text-brand-teal-hover'}`}
                    >
                        <Target size={20} />
                        <span className="font-bold text-sm tracking-tight">Mission Fit Radar</span>
                    </div>
                    <div
                        onClick={() => setActiveTab('school-recommender')}
                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${activeTab === 'school-recommender' ? 'bg-brand-dark text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Building size={20} />
                        <span className="font-bold text-sm tracking-tight">Recommender</span>
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
                        <ScoreDial score={readiness.score} level={readiness.level} size={112} className="mb-4" />
                        <div className="w-full mt-2">
                            <div className="flex justify-between items-center mb-1 px-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                                <span className="text-[9px] font-black text-brand-teal">{readiness.score}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-teal transition-all duration-700" style={{ width: `${readiness.score}%` }}></div>
                            </div>
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
                    <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => setIsSettingsModalOpen(true)} />
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
                            <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pt-4 gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800 font-serif">Welcome, Future Doctor {userName}</h1>
                                    <p className="text-slate-500 text-sm mt-1">
                                        {amcasInfo.isOpen ? (
                                            <>AMCAS is <span className={`font-bold ${amcasUrgencyClass}`}>open now</span> — the clock is ticking.</>
                                        ) : (
                                            <>You are <span className={`font-bold ${amcasUrgencyClass}`}>{amcasInfo.daysToOpening} days</span> from the AMCAS opening.</>
                                        )}{' '}Let's polish your narrative.
                                    </p>
                                </div>
                                <div className="relative hidden lg:block">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search activities..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-white pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-100 focus:ring-2 focus:ring-brand-teal/20 outline-none w-64 shadow-sm text-slate-600 placeholder:text-slate-300"
                                    />
                                </div>
                            </header>

                            {/* Hero: AdCom Readiness Score */}
                            <div className="mb-8 bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-900/10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 blur-[70px] rounded-full pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 blur-[70px] rounded-full pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                                    <ScoreDial score={readiness.score} level={readiness.level} size={128} radius={42} strokeWidth={6} variant="dark" />
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getTierBadgeClass(readiness.score)}`}>{readiness.level}</span>
                                            <button
                                                onClick={() => setIsReadinessModalOpen(true)}
                                                className="text-slate-500 hover:text-slate-300 transition-colors"
                                                title="What does this score mean?"
                                            >
                                                <HelpCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1">AdCom Readiness Score</h2>
                                        <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                                            {primaryGap ? primaryGap.text : "You've met all primary volume and competency benchmarks — focus now on refining your narrative voice."}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex flex-col gap-2">
                                        <button
                                            onClick={() => setIsReadinessModalOpen(true)}
                                            className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 transition-colors"
                                        >
                                            View Full Audit <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                        {filledActivities.length >= 5 && (
                                            <button
                                                onClick={() => setIsStoryModalOpen(true)}
                                                className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-gold hover:bg-brand-gold-hover text-brand-dark text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" /> Analyze My Story
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Red Flag Audit */}
                            {visibleFlags.length > 0 && (
                                <div className="mb-8 space-y-2.5">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-brand-danger" /> Red Flag Audit ({visibleFlags.length})
                                    </h3>
                                    {visibleFlags.map(flag => (
                                        <div key={flag.id} className="relative overflow-hidden bg-white pl-5 pr-3 py-3.5 rounded-2xl border border-rose-100 shadow-sm flex items-start gap-3">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-danger" />
                                            <div className="p-2 rounded-lg bg-rose-50 text-brand-danger shrink-0">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm mb-0.5">{flag.title}</h4>
                                                <p className="text-slate-600 text-xs leading-relaxed">{flag.message}</p>
                                            </div>
                                            <button onClick={() => dismissFlag(flag.id)} className="p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg transition-colors shrink-0" title="Dismiss">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div onClick={handleOpenCompetencyAudit} className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-300 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                        <Brain className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-blue-500/70 transition-colors">Competencies</h4>
                                        <p className="text-sm font-bold text-slate-800">{readiness.competencyCount} / 15 <span className="text-slate-400 text-xs font-normal">Saturated</span></p>
                                    </div>
                                </div>

                                <div onClick={scrollToActivities} className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50/80 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-emerald-500/70 transition-colors">Activity Hub</h4>
                                        <p className="text-sm font-bold text-slate-800">{filledActivities.length} <span className="text-slate-400 text-xs font-normal">Active Slots</span></p>
                                    </div>
                                </div>
                            </div>

                            {upcomingDeadlines.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                                        <Calendar className="w-3.5 h-3.5 text-brand-teal" /> Upcoming Deadlines
                                    </h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {upcomingDeadlines.slice(0, 6).map(({ activity, daysLeft }) => {
                                            const isOverdue = daysLeft < 0;
                                            const isSoon = !isOverdue && daysLeft <= 7;
                                            const borderClass = isOverdue ? 'border-rose-200 bg-rose-50/60' : isSoon ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-white';
                                            const labelClass = isOverdue ? 'text-brand-danger' : isSoon ? 'text-amber-600' : 'text-slate-400';
                                            const label = isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`;
                                            return (
                                                <button
                                                    key={activity.id}
                                                    onClick={() => onSelectActivity(activity.id)}
                                                    className={`shrink-0 w-48 text-left p-3.5 rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${borderClass}`}
                                                >
                                                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${labelClass}`}>{label}</p>
                                                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{activity.title || 'Untitled Slot'}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(activity.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6" ref={activitiesRef}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Your Activity List</h2>
                                    <div className="flex gap-2 items-center">
                                        {/* The ResumeUploader was moved from here to the header */}
                                        <button onClick={() => onAppTypeChange(ApplicationType.AMCAS)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${appType === ApplicationType.AMCAS ? 'bg-brand-dark text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100'}`}>AMCAS</button>
                                        <button onClick={() => onAppTypeChange(ApplicationType.AACOMAS)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${appType === ApplicationType.AACOMAS ? 'bg-brand-dark text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100'}`}>AACOMAS</button>
                                        <button
                                            onClick={() => setIsExportModalOpen(true)}
                                            disabled={filledActivities.length === 0}
                                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white text-slate-500 border border-slate-100 hover:border-brand-teal/30 hover:text-brand-teal transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                        >
                                            <FileDown className="w-3.5 h-3.5" /> Export
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3 pb-10">
                                    {filteredActivities.length === 0 ? (
                                        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100 border-dashed text-slate-400 text-sm flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center text-brand-teal">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-600 text-base mb-1">No activities yet</p>
                                                <p className="text-slate-400 text-sm max-w-sm mx-auto">Start listing your experiences early — even a rough draft helps us audit gaps in your application.</p>
                                            </div>
                                            <button onClick={() => onSelectActivity(activities.length + 1)} className="mt-1 flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-teal-hover text-white font-bold text-sm rounded-2xl shadow-lg shadow-brand-teal/20 transition-all hover:-translate-y-0.5">
                                                <Plus className="w-4 h-4" /> Add Your First Activity
                                            </button>
                                        </div>
                                    ) : (
                                        filteredActivities.map((activity, idx) => {
                                            const statusCfg = STATUS_CONFIG[activity.status];
                                            const totalHours = activity.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);
                                            const descLen = activity.description?.length || 0;
                                            const descLimit = DESC_LIMITS[appType];
                                            const nq = descLen > 0 ? scoreNarrativeQuality(activity.description) : null;
                                            const nqTier = nq ? narrativeQualityTier(nq.total) : null;
                                            const nqClass = nqTier === 'green' ? 'text-emerald-600 bg-emerald-50' : nqTier === 'amber' ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
                                            return (
                                                <motion.div
                                                    key={activity.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
                                                    onClick={() => onSelectActivity(activity.id)}
                                                    draggable={isReorderable}
                                                    onDragStart={() => isReorderable && setDragIndex(idx)}
                                                    onDragOver={(e) => { if (isReorderable && dragIndex !== null) { e.preventDefault(); setDragOverIndex(idx); } }}
                                                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        if (isReorderable && dragIndex !== null) moveActivity(dragIndex, idx);
                                                        setDragIndex(null);
                                                        setDragOverIndex(null);
                                                    }}
                                                    className={`group relative overflow-hidden bg-white pl-5 pr-3 py-3 sm:py-3.5 sm:pr-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer shadow-sm border transition-all hover:border-brand-teal/30 hover:shadow-md ${dragIndex === idx ? 'opacity-40' : 'hover:-translate-y-0.5'} ${dragOverIndex === idx && dragIndex !== idx ? 'border-brand-teal ring-2 ring-brand-teal/20' : 'border-slate-100'}`}
                                                >
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${statusCfg.barColor}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-brand-teal transition-colors line-clamp-1">{activity.title || "Untitled Slot"}</h4>
                                                            {activity.isMostMeaningful && <Award className="w-3.5 h-3.5 text-brand-gold flex-shrink-0" />}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activity.experienceType || 'General Entry'}</span>
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${statusCfg.badgeClass}`}>
                                                                {statusCfg.icon} {statusCfg.label}
                                                            </span>
                                                            {totalHours > 0 && (
                                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{totalHours} hrs</span>
                                                            )}
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${descLen > descLimit ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'}`}>{descLen}/{descLimit} chars</span>
                                                            {nq && (
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${nqClass}`} title="Narrative Quality — heuristic estimate">NQ {nq.total}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center flex-shrink-0">
                                                        {isReorderable && (
                                                            <div className="flex flex-col mr-1">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); moveActivity(idx, idx - 1); }}
                                                                    disabled={idx === 0}
                                                                    aria-label={`Move ${activity.title || 'activity'} up`}
                                                                    className="p-0.5 text-slate-300 hover:text-brand-teal disabled:opacity-25 disabled:hover:text-slate-300 transition-colors"
                                                                ><ChevronUp className="w-3.5 h-3.5" /></button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); moveActivity(idx, idx + 1); }}
                                                                    disabled={idx === filteredActivities.length - 1}
                                                                    aria-label={`Move ${activity.title || 'activity'} down`}
                                                                    className="p-0.5 text-slate-300 hover:text-brand-teal disabled:opacity-25 disabled:hover:text-slate-300 transition-colors"
                                                                ><ChevronDown className="w-3.5 h-3.5" /></button>
                                                            </div>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); onDeleteActivity(activity.id); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                    <button onClick={() => onSelectActivity(activities.length + 1)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-sm hover:border-brand-teal hover:text-brand-teal hover:bg-brand-light/50 transition-all group flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                        Add Activity Slot
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'mission-fit' ? (
                        <div className="animate-fade-in pt-4 h-full flex flex-col">
                            <header className="flex justify-between items-center mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-brand-dark font-serif">Mission Fit Radar</h1>
                                    <p className="text-slate-400 text-sm mt-1">Strategic alignment with medical school archetypes.</p>
                                </div>
                            </header>
                            <div className="bg-white p-4 md:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 overflow-y-auto pb-24 md:pb-8">
                                <MissionFitRadar activities={activities} onNavigateToRecommender={() => setActiveTab('school-recommender')} />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in pt-4 sm:h-full flex flex-col">
                            <SchoolRecommender activities={activities} />
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

            {isSettingsModalOpen && (
                <SettingsModal
                    appType={appType}
                    onAppTypeChange={onAppTypeChange}
                    cycleYear={cycleYear}
                    onCycleYearChange={setCycleYear}
                    onClose={() => setIsSettingsModalOpen(false)}
                />
            )}

            {isExportModalOpen && (
                <ExportModal
                    activities={activities}
                    appType={appType}
                    onClose={() => setIsExportModalOpen(false)}
                />
            )}

            {isStoryModalOpen && (
                <StoryAnalysisModal
                    activities={filledActivities}
                    onClose={() => setIsStoryModalOpen(false)}
                />
            )}

            {showResumeModal && (
                <ResumeReviewModal
                    isOpen={showResumeModal}
                    onClose={handleCloseResumeModal}
                    parsedActivities={parsedResumeActivities}
                    onImport={handleImportActivities}
                />
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2.5 flex justify-around items-center z-50 pb-safe">
                <div onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'overview' ? 'text-brand-teal' : 'text-slate-400'}`}>
                    <LayoutDashboard size={22} />
                    <span className="text-[9px] font-bold">Dash</span>
                </div>
                <div onClick={() => setActiveTab('mission-fit')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'mission-fit' ? 'text-brand-teal' : 'text-slate-400'}`}>
                    <Target size={22} />
                    <span className="text-[9px] font-bold">Radar</span>
                </div>
                <div onClick={() => setActiveTab('school-recommender')} className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'school-recommender' ? 'text-brand-teal' : 'text-slate-400'}`}>
                    <Building size={22} />
                    <span className="text-[9px] font-bold">Schools</span>
                </div>
                <div onClick={() => setIsSettingsModalOpen(true)} className="flex flex-col items-center gap-0.5 cursor-pointer text-slate-400">
                    <Settings size={22} />
                    <span className="text-[9px] font-bold">Settings</span>
                </div>
                <div onClick={signOut} className={`flex flex-col items-center gap-0.5 cursor-pointer text-rose-400`}>
                    <LogOut size={22} />
                    <span className="text-[9px] font-bold">Exit</span>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            <div className="bg-white rounded-xl sm:rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-teal/10 p-2 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-xl font-serif font-bold text-brand-dark leading-tight">Not All Activities Are Created Equal</h2>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">

                            {/* Left: Score Card */}
                            <div className="w-full lg:w-[360px] flex-shrink-0 lg:sticky lg:top-0">
                                <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 ring-1 ring-black/5 flex flex-col items-center">
                                    {/* Effects */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 blur-[50px] rounded-full pointer-events-none opacity-50"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-gold/10 blur-[50px] rounded-full pointer-events-none opacity-30"></div>

                                    {/* Ring */}
                                    <div className="relative w-36 h-36 sm:w-48 sm:h-48 mb-6 mt-4">
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
                                            <span className="text-4xl sm:text-6xl font-black tracking-tighter text-white drop-shadow-lg leading-none">{score}</span>
                                            <span className={`text-[10px] sm:text-sm font-bold uppercase tracking-widest mt-0.5 sm:mt-2 ${tierColor}`}>{level}</span>
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
                    <button onClick={onClose} className="w-full sm:w-auto px-8 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl shadow-slate-900/10 text-sm flex items-center justify-center gap-2">
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