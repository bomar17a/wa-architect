import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Building, Target, Award, Loader2, ChevronDown, ChevronRight, X, BarChart3, Info, Star, MapPin } from 'lucide-react';
import { Activity } from '../types';
import { supabase } from '../services/supabase';
import {
    computeCompetency,
    computeCompleteness,
    SCHOOL_ARCHETYPES,
} from '../utils/missionFit';
import { applicantThemes, tagWeights } from '../utils/themes';
import {
    cycleLabel,
    oneIn,
    poolResidency,
    preferenceCutoffs,
    type ApplicantResidency,
    type ResidencyAccess,
    type ResidencyRow,
} from '../utils/residency';
import { scoreSchool, warningText, A1_SOURCE_URL, type FitSchool, type SchoolFit } from '../utils/schoolFit';
import { schoolStateOf, isUsCountry, US_STATES, CA_PROVINCES } from '../utils/schoolStates';
import { WhyThisSchool } from './School/WhyThisSchool';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';

export const MAX_TARGET_SCHOOLS = 5;

interface SchoolRecommenderProps {
    activities: Activity[];
    /** Opens Settings at the residency section. */
    onOpenResidencySettings?: () => void;
}

interface MedicalSchool extends FitSchool {
    degree_type: string;
    application_system: string;
    mission_statement: string;
    primary_category: string;
    slug?: string | null;
}

interface ScoredSchool extends MedicalSchool {
    result: SchoolFit;
}

type SortMode = 'priority' | 'mission';

interface ResidencyStatRow extends ResidencyRow {
    school_id: string;
}

/** The short label on a school card. Null when residency says nothing worth a chip. */
function accessChip(access: ResidencyAccess): { text: string; title?: string; className: string } | null {
    const p = access.pooled;
    const source = p ? ` (AAMC FACTS Table A-1, ${cycleLabel(p.cycles)})` : '';
    if (access.excluded) {
        return { text: 'Not eligible', title: access.excluded.reason, className: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (access.group === 'regional') {
        return { text: 'In region', title: 'This school treats your state as part of its home region.', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (!p) return null;
    const seats = `${Math.round(p.seatShareIn * 100)}% of seats went to residents${source}.`;
    if (access.group === 'in_state' && access.band !== 'neutral') {
        return { text: 'In-state', title: seats, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    // Only where it is the story: the top third of schools by in-state edge, or a warning.
    // Chipping every moderate school put an out-of-state label on two cards in three.
    if (access.group === 'out_of_state' && (access.warning || access.band === 'strong')) {
        return {
            text: `Out of state · ${oneIn(p.rateOut)}`,
            title: `Out-of-state applications became seats at ${oneIn(p.rateOut)}; in-state at ${oneIn(p.rateIn)}. ${seats}`,
            className: access.warning ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-50 border-slate-200',
        };
    }
    return null;
}

export const SchoolRecommender: React.FC<SchoolRecommenderProps> = ({ activities, onOpenResidencySettings }) => {
    const { scores: studentScores, hours: pillarHours } = useMemo(() => computeCompetency(activities), [activities]);
    const completeness = useMemo(() => computeCompleteness(activities), [activities]);
    const themes = useMemo(() => applicantThemes(activities), [activities]);
    const { profile, updateProfile, ties } = useProfile();
    const { addToast } = useToast();
    const targetIds = profile?.targetSchoolIds ?? [];

    const [rawSchools, setRawSchools] = useState<MedicalSchool[]>([]);
    const [residencyRows, setResidencyRows] = useState<ResidencyStatRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchTerm, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('priority');

    // Side drawer, by id so it follows the scores as they change.
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // A school whose star was clicked but needs the out-of-state confirm first.
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Filters
    const [degreeFilter, setDegreeFilter] = useState<string>('All');
    const [systemFilter, setSystemFilter] = useState<string>('All');
    // 'US' by default: Canadian schools run their own admissions systems and residency
    // rules, and with no AAMC figures they would otherwise rank as if residency cost nothing.
    const [stateFilter, setStateFilter] = useState<string>('US');

    // Schools and residency figures load once; scoring below reruns as activities change.
    // (This used to refetch every school whenever a pillar score moved.)
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setErrorMsg(null);
            const [schoolsRes, statsRes] = await Promise.all([
                supabase.from('medical_schools').select('*'),
                supabase.from('school_residency_stats')
                    .select('school_id, cycle_year, applications, apps_in_state_pct, matriculants, mat_in_state_pct'),
            ]);
            if (cancelled) return;

            if (schoolsRes.error) {
                console.error('Error fetching medical schools:', schoolsRes.error);
                setErrorMsg('Unable to fetch school data. Please ensure the medical_schools table exists and Row Level Security (RLS) is configured correctly.');
                setLoading(false);
                return;
            }
            // Residency figures are readable only when signed in, and absent before the
            // migration. Either way every school still scores, with residency left neutral.
            if (statsRes.error) console.warn('Residency figures unavailable:', statsRes.error.message);

            setRawSchools((schoolsRes.data as MedicalSchool[]) || []);
            setResidencyRows(statsRes.error ? [] : ((statsRes.data as ResidencyStatRow[]) || []));
            setLoading(false);
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const rowsBySchool = useMemo(() => {
        const map: Record<string, ResidencyRow[]> = {};
        for (const r of residencyRows) (map[r.school_id] ??= []).push(r);
        return map;
    }, [residencyRows]);

    const cutoffs = useMemo(
        () => preferenceCutoffs(rawSchools.map(s => poolResidency(rowsBySchool[s.id] ?? []))),
        [rawSchools, rowsBySchool],
    );
    const weights = useMemo(() => tagWeights(rawSchools), [rawSchools]);

    const applicant: ApplicantResidency = useMemo(() => ({
        legalState: profile?.legalResidenceState ?? null,
        status: profile?.residencyStatus ?? null,
        ties,
        activityStates: activities
            .filter(a => a.status !== 'Empty' && a.state && isUsCountry(a.country))
            .map(a => ({ activityId: a.id, state: a.state! })),
    }), [profile?.legalResidenceState, profile?.residencyStatus, ties, activities]);

    // One shared mission-fit formula with the Mission Fit Radar; see utils/schoolFit.ts
    // for how residency and themes sit on top of it.
    const schools: ScoredSchool[] = useMemo(() => {
        const ctx = { scores: studentScores, completeness: completeness.factor, applicant, themes, tagWeights: weights, cutoffs };
        const scored = rawSchools.map(s => ({ ...s, result: scoreSchool(s, rowsBySchool[s.id] ?? [], ctx) }));
        return scored.sort((a, b) => sortMode === 'priority'
            ? b.result.priority - a.result.priority || b.result.fit.match - a.result.fit.match
            : b.result.fit.match - a.result.fit.match || b.result.priority - a.result.priority);
    }, [rawSchools, rowsBySchool, studentScores, completeness.factor, applicant, themes, weights, cutoffs, sortMode]);

    const selectedSchool = schools.find(s => s.id === selectedId) ?? null;

    const activityTitle = useMemo(() => {
        const titles = new Map(activities.map(a => [a.id, a.title || a.organization || 'Untitled entry']));
        return (id: number) => titles.get(id) ?? 'An entry';
    }, [activities]);

    const toggleTarget = (school: ScoredSchool, confirmed = false) => {
        const isTargeted = targetIds.includes(school.id);
        if (!isTargeted && targetIds.length >= MAX_TARGET_SCHOOLS) {
            addToast(`You can target up to ${MAX_TARGET_SCHOOLS} schools. Remove one first.`, 'info');
            return;
        }
        if (!isTargeted && !confirmed && school.result.access.warning?.kind === 'no_tie') {
            setConfirmingId(school.id);
            return;
        }
        setConfirmingId(null);
        const next = isTargeted ? targetIds.filter(id => id !== school.id) : [...targetIds, school.id];
        updateProfile({ targetSchoolIds: next })
            .then(() => addToast(isTargeted ? `Removed ${school.school_name} from targets.` : `Targeting ${school.school_name}.`, 'success'))
            .catch(() => addToast('Could not save your target schools.', 'error'));
    };

    const matchesPlace = (school: ScoredSchool) => {
        const state = schoolStateOf(school);
        const isCanadian = school.country ? school.country === 'CA' : CA_PROVINCES.includes(state);
        return stateFilter === 'All'
            || (stateFilter === 'US' && !isCanadian)
            || (stateFilter === 'CANADA' && isCanadian)
            || state === stateFilter;
    };

    // Derived state for filtering
    const filteredSchools = useMemo(() => {
        return schools.filter(school => {
            const matchesSearch = school.school_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDegree = degreeFilter === 'All' || school.degree_type === degreeFilter;
            const matchesSystem = systemFilter === 'All' || school.application_system === systemFilter;
            return matchesSearch && matchesDegree && matchesSystem && matchesPlace(school);
        });
    }, [schools, searchTerm, degreeFilter, systemFilter, stateFilter]);

    const hasData = studentScores.Inquiry > 0 || studentScores.Service > 0 || studentScores.Teamwork > 0 || studentScores.Clinical > 0;
    // The top of the list as filtered by place, but not by the search box.
    const topMatch = hasData ? (schools.find(matchesPlace) ?? null) : null;

    // Helper for personalized string
    const generateInsightLine = () => {
        if (!topMatch || !hasData) return null;

        const [catName, score] = Object.entries(studentScores).reduce((a, b) => a[1] > b[1] ? a : b);
        // The hours the applicant actually logged, not the 0-10 pillar score. Printing
        // the score here read as "(10 hours)" for a 500-hour research role.
        const hours = Math.round(pillarHours[catName as keyof typeof pillarHours]);

        const descriptions: Record<string, string> = {
            Inquiry: "work in research and structured inquiry",
            Service: "commitment to community engagement and service",
            Teamwork: "collaborative and leadership experience",
            Clinical: "patient-centered clinical experience"
        };

        // Earn the adjective. This used to read "exceptional" at any score at all.
        const strength = score >= 8.5 ? 'exceptional' : score >= 6.5 ? 'strong' : score >= 4 ? 'developing' : 'early';

        return (
            <span>
                Your {strength} {descriptions[catName]} <strong className="text-brand-dark">({hours.toLocaleString()} hours)</strong> points you toward <strong className="text-brand-teal">{topMatch.primary_category}</strong> programs.
            </span>
        );
    };

    const clearFilters = () => { setSearchQuery(''); setDegreeFilter('All'); setSystemFilter('All'); setStateFilter('US'); };

    return (
        <div className="w-full sm:h-full flex pt-4 sm:overflow-hidden relative">
            <div className={`flex-1 flex flex-col sm:h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedSchool ? 'mr-0 lg:mr-[400px] opacity-20 lg:opacity-100 scale-[0.98] lg:scale-100 pointer-events-none lg:pointer-events-auto' : ''}`}>
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-dark font-serif">School Recommender</h1>
                        <p className="text-slate-400 text-sm mt-1">Data-driven med school recommendations based on your activity profile.</p>
                    </div>
                </header>

                {errorMsg && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm shrink-0">
                        <p className="text-red-600 font-medium">{errorMsg}</p>
                    </div>
                )}

                {!hasData && !loading && !errorMsg && schools.length > 0 && (
                     <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm shrink-0">
                        <p className="text-amber-800 font-medium">Add activities to the Narrative Studio to generate personalized match scores for each school.</p>
                     </div>
                )}

                {profile && !profile.legalResidenceState && onOpenResidencySettings && !loading && !errorMsg && (
                    <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm shrink-0">
                        <p className="text-sm text-slate-600 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                            Add your state of residence to see where public schools' in-state preference helps or hurts you.
                        </p>
                        <button onClick={onOpenResidencySettings} className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-brand-dark text-white">
                            Add residency
                        </button>
                    </div>
                )}

                {/* Personalized Hero Banner */}
                {topMatch && !loading && !errorMsg && (
                    <div className="mb-8 bg-gradient-to-br from-brand-teal/[0.04] to-slate-50 border border-brand-teal/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] shrink-0 overflow-hidden relative z-0">
                         {/* Abstract background shapes */}
                         <div className="absolute -top-24 -right-12 w-64 h-64 bg-brand-teal/[0.03] rounded-full blur-3xl -z-10"></div>
                         <div className="absolute -bottom-24 left-12 w-48 h-48 bg-brand-gold/[0.03] rounded-full blur-3xl -z-10"></div>

                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl border border-brand-teal/10 shadow-sm flex items-center justify-center shrink-0">
                            <Target className="w-8 h-8 md:w-10 md:h-10 text-brand-teal drop-shadow-sm" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-[11px] font-black text-brand-teal tracking-[0.2em] uppercase mb-2 flex items-center justify-center md:justify-start gap-1">
                                <Award className="w-3 h-3" /> Personalized Insight
                            </h3>
                            <p className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed font-serif">
                                {generateInsightLine()}
                            </p>
                            <p className="text-sm font-semibold text-slate-500 mt-2">
                                First on your list: <span className="underline decoration-slate-200 underline-offset-4">{topMatch.school_name}</span>, at a {topMatch.result.fit.match}% mission fit.
                            </p>
                            {!completeness.isComplete && (
                                <div className="mt-3 inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    <Info className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                        Provisional: {completeness.activityCount} of 15 activities
                                        {completeness.mmeCount < 3 && `, ${completeness.mmeCount} of 3 Most Meaningful`}.
                                        Match scores are held back until your list fills out.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="bg-white/80 backdrop-blur-xl p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100/50 flex-1 flex flex-col sm:overflow-hidden relative border-t-white/80">

                    {/* Glassmorphic Toolbar */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6 pb-2 sticky top-0 bg-white/90 backdrop-blur-xl z-30 p-2 rounded-xl border border-white shadow-sm">
                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-brand-teal transition-colors" />
                            <input
                                type="text"
                                placeholder="Search universities..."
                                value={searchTerm}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50/50 backdrop-blur-sm pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200/60 focus:bg-white focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                            <div role="group" aria-label="Sort schools by" className="flex rounded-xl border border-slate-200/60 bg-slate-50/50 p-1 shrink-0">
                                {([['priority', 'Priority'], ['mission', 'Mission fit']] as [SortMode, string][]).map(([mode, label]) => (
                                    <button
                                        key={mode}
                                        onClick={() => setSortMode(mode)}
                                        aria-pressed={sortMode === mode}
                                        title={mode === 'priority' ? 'Mission fit, adjusted for residency and for the themes your entries show.' : 'Mission fit alone.'}
                                        className={`flex-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${sortMode === mode ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                <div className="relative w-1/3 lg:w-40 group">
                                    <Filter className="absolute left-2 lg:left-3 top-3 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                                    <ChevronDown className="absolute right-2 lg:right-3 top-3.5 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
                                    <select
                                        aria-label="Where"
                                        value={stateFilter}
                                        onChange={(e) => setStateFilter(e.target.value)}
                                        className="w-full appearance-none bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl pl-7 lg:pl-9 pr-6 lg:pr-8 py-2.5 text-[12px] lg:text-sm font-bold text-slate-600 outline-none cursor-pointer focus:border-brand-teal transition-all shadow-inner"
                                    >
                                        <option value="US">U.S.</option>
                                        <option value="All">U.S. + Canada</option>
                                        <option value="CANADA">Canada</option>
                                        <optgroup label="US States">
                                            {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                                        </optgroup>
                                        <optgroup label="Canada">
                                            {CA_PROVINCES.map(st => <option key={st} value={st}>{st}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="relative w-1/3 lg:w-32 group">
                                    <Filter className="absolute left-2 lg:left-3 top-3 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                                    <ChevronDown className="absolute right-2 lg:right-3 top-3.5 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
                                    <select
                                        value={degreeFilter}
                                        onChange={(e) => setDegreeFilter(e.target.value)}
                                        className="w-full appearance-none bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl pl-7 lg:pl-9 pr-6 lg:pr-8 py-2.5 text-[12px] lg:text-sm font-bold text-slate-600 outline-none cursor-pointer focus:border-brand-teal transition-all shadow-inner"
                                    >
                                        <option value="All">Degree</option>
                                        <option value="MD">MD</option>
                                        <option value="DO">DO</option>
                                    </select>
                                </div>
                                <div className="relative w-1/3 lg:w-36 group">
                                    <Filter className="absolute left-2 lg:left-3 top-3 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                                    <ChevronDown className="absolute right-2 lg:right-3 top-3.5 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
                                    <select
                                        value={systemFilter}
                                        onChange={(e) => setSystemFilter(e.target.value)}
                                        className="w-full appearance-none bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl pl-7 lg:pl-9 pr-6 lg:pr-8 py-2.5 text-[12px] lg:text-sm font-bold text-slate-600 outline-none cursor-pointer focus:border-brand-teal transition-all shadow-inner"
                                    >
                                        <option value="All">System</option>
                                        <option value="AMCAS">AMCAS</option>
                                        <option value="AACOMAS">AACOMAS</option>
                                        <option value="TMDSAS">TMDSAS</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* List of Schools */}
                    <div className="flex-1 sm:overflow-y-auto px-2 pb-24 sm:pb-10 scrollbar-hide">
                        {loading ? (
                            <div className="w-full h-40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
                            </div>
                        ) : filteredSchools.length === 0 ? (
                            <div className="w-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                <Search className="w-8 h-8 text-slate-300 mb-3" />
                                <p className="text-slate-500 font-medium">No schools matched your current criteria.</p>
                                <button onClick={clearFilters} className="mt-3 text-sm text-brand-teal font-bold hover:underline">Clear all filters</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-8">
                                {filteredSchools.map((school) => {
                                    const archData = SCHOOL_ARCHETYPES.find(a => a.dbCategory === school.primary_category);
                                    const isSelected = selectedSchool?.id === school.id;
                                    const isTargeted = targetIds.includes(school.id);
                                    const match = school.result.fit.match;
                                    const chip = accessChip(school.result.access);
                                    const isConfirming = confirmingId === school.id;

                                    return (
                                        <div
                                            key={school.id}
                                            onClick={() => setSelectedId(school.id)}
                                            className={`group rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer bg-white
                                                ${isSelected ? 'border-brand-teal/50 shadow-[0_10px_40px_rgb(26,115,232,0.12)] ring-2 ring-brand-teal/10 scale-[1.01]' : 'border border-slate-200/80 shadow-sm hover:border-brand-teal/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}
                                            `}
                                        >
                                            {/* Match Score Indicator */}
                                            {match >= 80 && (
                                                <div className="absolute top-0 right-0 bg-brand-gold text-brand-dark text-[10px] font-black tracking-widest px-3 py-1.5 rounded-bl-[1.25rem] shadow-sm z-10 flex items-center gap-1.5">
                                                    <Award className="w-3.5 h-3.5" /> HIGH MATCH
                                                </div>
                                            )}

                                            <div className="flex items-start gap-5 mb-5 relative z-10 w-full">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 shrink-0
                                                    ${isSelected ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/20' : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-brand-teal/5 group-hover:text-brand-teal group-hover:border-brand-teal/10'}
                                                `}>
                                                    <Building className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4 sm:pr-16 lg:pr-0">
                                                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-brand-teal transition-colors break-words">
                                                        {school.school_name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-[11px] font-black tracking-wide text-slate-500 bg-slate-100/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200/50">
                                                            {school.degree_type}
                                                        </span>
                                                        <span className="text-[11px] font-black tracking-wide text-slate-500 bg-slate-100/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200/50">
                                                            {school.application_system}
                                                        </span>
                                                        {chip && (
                                                            <span title={chip.title} className={`text-[11px] font-black tracking-wide px-2.5 py-1 rounded-md border ${chip.className}`}>
                                                                {chip.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto relative z-10 border-t border-slate-100/80 pt-4">
                                                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                                                    <div className="min-w-0">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Archetype Expectation</span>
                                                        <div className="font-bold text-brand-dark flex items-center gap-1.5 text-sm">
                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${archData?.color.replace('border-', 'bg-').replace('text-', 'bg-') || 'bg-slate-300'}`}></div>
                                                            {school.primary_category}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end gap-3 shrink-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleTarget(school); }}
                                                            title={isTargeted ? 'Remove from target schools' : 'Add to target schools'}
                                                            aria-label={isTargeted ? `Remove ${school.school_name} from target schools` : `Add ${school.school_name} to target schools`}
                                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${isTargeted ? 'bg-brand-gold/20 text-amber-700 border border-brand-gold/40' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:text-brand-gold hover:border-brand-gold/40'}`}
                                                        >
                                                            <Star className={`w-3 h-3 ${isTargeted ? 'fill-current' : ''}`} />
                                                            {isTargeted ? 'Targeted' : 'Target'}
                                                        </button>

                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mission fit</span>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-20 sm:w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-brand-teal to-[#1A61C2] rounded-full relative"
                                                                        style={{ width: `${match}%` }}
                                                                    >
                                                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-base font-black text-slate-800 w-10 text-right">{match}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {isConfirming && (
                                                    <div role="alertdialog" aria-label="Out-of-state school" onClick={e => e.stopPropagation()} className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed cursor-default">
                                                        <p>{warningText(school.result.access)}</p>
                                                        <div className="flex gap-2 mt-3">
                                                            <button onClick={() => toggleTarget(school, true)} className="px-3 py-1.5 rounded-lg font-bold bg-brand-dark text-white">Target anyway</button>
                                                            <button onClick={() => setConfirmingId(null)} className="px-3 py-1.5 rounded-lg font-bold bg-white border border-amber-200 text-amber-900">Cancel</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expand hint. Sits in the header gutter, not over the match figure. */}
                                            <div className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 ${match >= 80 ? 'hidden' : ''} ${isSelected ? 'opacity-100 translate-x-0 bg-brand-teal/10 text-brand-teal' : 'bg-slate-50 text-slate-400'}`}>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sliding Side Panel (Drawer) for Selected School */}
            <div className={`fixed lg:absolute top-0 right-0 h-full w-full lg:w-[400px] z-50 bg-white shadow-[-10px_0_40px_rgb(0,0,0,0.08)] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col border-l border-slate-100 ${selectedSchool ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Drawer Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-md shrink-0">
                    <h2 className="text-sm font-black text-slate-400 tracking-widest uppercase">School Details</h2>
                    <button
                        onClick={() => setSelectedId(null)}
                        aria-label="Close school details"
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {selectedSchool && (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6 scrollbar-hide">
                        {/* School Basic Info */}
                        <div className="mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal to-[#1A61C2] shadow-md shadow-brand-teal/20 flex items-center justify-center text-white mb-4">
                                <Building className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold font-serif text-brand-dark mb-2 leading-tight">{selectedSchool.school_name}</h2>
                            <div className="flex gap-2">
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                    {selectedSchool.degree_type}
                                </span>
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                    {selectedSchool.application_system}
                                </span>
                            </div>
                        </div>

                        {/* Why this school: first, since the mission statement below can run long */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-brand-teal" /> Why this school
                            </h3>
                            <WhyThisSchool fit={selectedSchool.result} completeness={completeness} activityTitle={activityTitle} />
                        </div>

                        {/* Mission Statement */}
                        <div className="mb-8 bg-slate-50 rounded-2xl p-5 border border-slate-200/60 relative">
                             <div className="absolute -top-3 left-5 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-brand-teal">
                                Mission Statement
                             </div>
                             <p className="text-slate-600 font-serif leading-relaxed text-sm italic">
                                "{selectedSchool.mission_statement}"
                             </p>
                        </div>

                        {/* Visual Breakdown vs Archetype */}
                        <div className="mb-8">
                             <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-brand-teal" /> Competency Breakdown
                             </h3>
                             <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                This program operates as a <strong className="text-brand-dark">{selectedSchool.primary_category}</strong> archetype.
                                {selectedSchool.emphasis_tags && selectedSchool.emphasis_tags.length > 0 ? (
                                    <> Its mission statement emphasizes <strong className="text-brand-dark">{selectedSchool.emphasis_tags.slice(0, 3).join(', ')}</strong>, which shifts the targets below away from the archetype baseline.</>
                                ) : (
                                    <> Below is how your pillar scores (0–10) compare to this school's expected targets.</>
                                )}
                             </p>

                             <div className="space-y-5">
                                 {(['Inquiry', 'Service', 'Teamwork', 'Clinical'] as const).map((category) => {
                                     const targetScore = selectedSchool.result.targets[category];
                                     const myScore = studentScores[category];

                                     // We cap the fill percentage at 100% just for UI rendering so it doesn't break limits
                                     const myPercentage = targetScore > 0 ? Math.min(100, Math.round((myScore / targetScore) * 100)) : (myScore > 0 ? 100 : 0);

                                     return (
                                         <div key={category}>
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-xs font-bold text-slate-700">{category}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                    <span className={myScore >= targetScore ? 'text-brand-teal' : 'text-slate-500'}>
                                                        You: {myScore}/10
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-slate-400">Target: {targetScore}/10</span>
                                                </div>
                                            </div>

                                            {/* Custom stacked progress bar */}
                                            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 shadow-inner relative">
                                                {/* Target marker */}
                                                <div className="absolute top-0 bottom-0 left-0 border-r-2 border-slate-300 z-10" style={{ width: targetScore > 0 ? '50%' : '5%', display: targetScore > 0 ? 'block' : 'none' }}></div>

                                                {/* Fill bar */}
                                                <div
                                                    className={`h-full relative z-20 ${myScore >= targetScore ? 'bg-brand-teal' : 'bg-slate-300'}`}
                                                    style={{ width: `${myPercentage}%` }}
                                                ></div>
                                            </div>
                                         </div>
                                     );
                                 })}
                             </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed">
                            Residency figures: <a href={A1_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-200 underline-offset-2 hover:text-brand-teal">AAMC FACTS Table A-1</a>, used with attribution. A seat here means a matriculant, so these are not acceptance rates.
                        </p>
                    </div>
                )}
            </div>

            {/* Mobile overlay backdrop when drawer is open */}
            {selectedSchool && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden opacity-100 transition-opacity duration-500"
                    onClick={() => setSelectedId(null)}
                ></div>
            )}
        </div>
    );
};
