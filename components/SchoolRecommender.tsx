import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Building, Target, Award, ArrowLeft, Loader2, ChevronDown, CheckCircle2, ChevronRight, X, BarChart3, Info } from 'lucide-react';
import { Activity } from '../types';
import { supabase } from '../services/supabase';
import { useCompetencyScores, SCHOOL_ARCHETYPES } from './MissionFitRadar';

interface SchoolRecommenderProps {
    activities: Activity[];
}

interface MedicalSchool {
    id: string;
    school_name: string;
    degree_type: string;
    application_system: string;
    mission_statement: string;
    primary_category: string;
    matchScore?: number;
}

export const SchoolRecommender: React.FC<SchoolRecommenderProps> = ({ activities }) => {
    const studentScores = useCompetencyScores(activities);

    const [schools, setSchools] = useState<MedicalSchool[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchTerm, setSearchQuery] = useState('');

    // State for Side Drawer
    const [selectedSchool, setSelectedSchool] = useState<MedicalSchool | null>(null);

    // Filters
    const [degreeFilter, setDegreeFilter] = useState<string>('All');
    const [systemFilter, setSystemFilter] = useState<string>('All');

    // Load all schools from Supabase
    useEffect(() => {
        const fetchSchools = async () => {
            setLoading(true);
            setErrorMsg(null);
            const { data, error } = await supabase.from('medical_schools').select('*');

            if (error) {
                console.error("Error fetching medical schools:", error);
                setErrorMsg("Unable to fetch school data. Please ensure the medical_schools table exists and Row Level Security (RLS) is configured correctly.");
                setLoading(false);
                return;
            }

            if (data) {
                // Calculate match scores post-fetch
                const processedSchools = data.map((school: MedicalSchool) => {
                    const arch = SCHOOL_ARCHETYPES.find(a => a.dbCategory === school.primary_category);
                    let matchPercentage = 0;
                    if (arch) {
                        const maxPossibleScore = arch.targets.Inquiry + arch.targets.Service + arch.targets.Teamwork + arch.targets.Clinical;
                        const actualScore = Math.min(studentScores.Inquiry, arch.targets.Inquiry) +
                            Math.min(studentScores.Service, arch.targets.Service) +
                            Math.min(studentScores.Teamwork, arch.targets.Teamwork) +
                            Math.min(studentScores.Clinical, arch.targets.Clinical);
                        matchPercentage = Math.round((actualScore / maxPossibleScore) * 100);
                    }
                    return { ...school, matchScore: matchPercentage };
                });

                // Sort by match score descending
                processedSchools.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
                setSchools(processedSchools);
            }
            setLoading(false);
        };

        fetchSchools();
    }, [studentScores]);

    // Derived state for filtering
    const filteredSchools = useMemo(() => {
        return schools.filter(school => {
            const matchesSearch = school.school_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDegree = degreeFilter === 'All' || school.degree_type === degreeFilter;
            const matchesSystem = systemFilter === 'All' || school.application_system === systemFilter;
            return matchesSearch && matchesDegree && matchesSystem;
        });
    }, [schools, searchTerm, degreeFilter, systemFilter]);

    const hasData = studentScores.Inquiry > 0 || studentScores.Service > 0 || studentScores.Teamwork > 0 || studentScores.Clinical > 0;
    const topMatch = schools.length > 0 && hasData ? schools[0] : null;

    // Helper for personalized string
    const generateInsightLine = () => {
        if (!topMatch || !hasData) return null;
        
        const highestCategory = Object.entries(studentScores).reduce((a, b) => a[1] > b[1] ? a : b);
        const catName = highestCategory[0];
        const hours = highestCategory[1];

        const descriptions: Record<string, string> = {
            Inquiry: "focus on research and structured inquiry",
            Service: "dedication to community engagement and service",
            Teamwork: "strong collaborative leadership",
            Clinical: "patient-centered clinical experience"
        };

        return (
            <span>
                Your exceptional {descriptions[catName]} <strong className="text-brand-dark">({hours} hours)</strong> naturally aligns you with <strong className="text-brand-teal">{topMatch.primary_category}</strong> programs.
            </span>
        );
    };

    return (
        <div className="w-full h-full flex pt-4 overflow-hidden relative">
            <div className={`flex-1 flex flex-col h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${selectedSchool ? 'mr-0 lg:mr-[400px] opacity-20 lg:opacity-100 scale-[0.98] lg:scale-100 pointer-events-none lg:pointer-events-auto' : ''}`}>
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
                                Your <span className="text-brand-dark">#{schools.indexOf(topMatch) + 1} best fit</span> is <span className="underline decoration-slate-200 underline-offset-4">{topMatch.school_name}</span> at a {topMatch.matchScore}% potential match.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="bg-white/80 backdrop-blur-xl p-4 md:p-6 rounded-[2.5rem] shadow-[0_4px_25px_rgb(0,0,0,0.02)] border border-slate-100/50 flex-1 flex flex-col overflow-hidden relative border-t-white/80">
                    
                    {/* Glassmorphic Toolbar */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6 pb-2 sticky top-0 bg-white/70 backdrop-blur-lg z-10 p-2 rounded-xl border border-white">
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
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-1/2 lg:w-36 group">
                                <Filter className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                                <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
                                <select
                                    value={degreeFilter}
                                    onChange={(e) => setDegreeFilter(e.target.value)}
                                    className="w-full appearance-none bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl pl-9 pr-8 py-2.5 text-sm font-bold text-slate-600 outline-none cursor-pointer focus:border-brand-teal transition-all shadow-inner"
                                >
                                    <option value="All">All Degrees</option>
                                    <option value="MD">MD</option>
                                    <option value="DO">DO</option>
                                </select>
                            </div>
                            <div className="relative w-1/2 lg:w-40 group">
                                <Filter className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                                <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-slate-400 z-10 pointer-events-none" />
                                <select
                                    value={systemFilter}
                                    onChange={(e) => setSystemFilter(e.target.value)}
                                    className="w-full appearance-none bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl pl-9 pr-8 py-2.5 text-sm font-bold text-slate-600 outline-none cursor-pointer focus:border-brand-teal transition-all shadow-inner"
                                >
                                    <option value="All">All Systems</option>
                                    <option value="AMCAS">AMCAS</option>
                                    <option value="AACOMAS">AACOMAS</option>
                                    <option value="TMDSAS">TMDSAS</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* List of Schools */}
                    <div className="flex-1 overflow-y-auto px-2 pb-10 scrollbar-hide">
                        {loading ? (
                            <div className="w-full h-40 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
                            </div>
                        ) : filteredSchools.length === 0 ? (
                            <div className="w-full py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                <Search className="w-8 h-8 text-slate-300 mb-3" />
                                <p className="text-slate-500 font-medium">No schools matched your current criteria.</p>
                                <button onClick={() => {setSearchQuery(''); setDegreeFilter('All'); setSystemFilter('All')}} className="mt-3 text-sm text-brand-teal font-bold hover:underline">Clear all filters</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-8">
                                {filteredSchools.map((school) => {
                                    const archData = SCHOOL_ARCHETYPES.find(a => a.dbCategory === school.primary_category);
                                    // Generate a very soft background color class if needed, or stick to subtle shadow
                                    const isSelected = selectedSchool?.id === school.id;

                                    return (
                                        <div 
                                            key={school.id} 
                                            onClick={() => setSelectedSchool(school)}
                                            className={`group rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden cursor-pointer bg-white 
                                                ${isSelected ? 'border-brand-teal/50 shadow-[0_10px_40px_rgb(26,115,232,0.12)] ring-2 ring-brand-teal/10 scale-[1.01]' : 'border border-slate-200/80 shadow-sm hover:border-brand-teal/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}
                                            `}
                                        >
                                            {/* Match Score Indicator */}
                                            {school.matchScore !== undefined && school.matchScore >= 80 && (
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
                                                <div className="flex-1 min-w-0 pr-16 lg:pr-0">
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
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto relative z-10 border-t border-slate-100/80 pt-4">
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Archetype Expectation</span>
                                                        <div className="font-bold text-brand-dark flex items-center gap-1.5 text-sm">
                                                            <div className={`w-2 h-2 rounded-full ${archData?.color.replace('border-', 'bg-').replace('text-', 'bg-') || 'bg-slate-300'}`}></div>
                                                            {school.primary_category}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Match Potential</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-brand-teal to-[#1A61C2] rounded-full relative"
                                                                    style={{ width: `${school.matchScore}%` }}
                                                                >
                                                                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                                                </div>
                                                            </div>
                                                            <span className="text-base font-black text-slate-800 w-10 text-right">{school.matchScore}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Expand Icon Hint */}
                                            <div className={`absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 ${isSelected ? 'opacity-100 translate-x-0 bg-brand-teal/10 text-brand-teal' : 'bg-slate-50 text-slate-400'}`}>
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
                        onClick={() => setSelectedSchool(null)}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {selectedSchool && (
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
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
                             <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                                This program operates as a <strong className="text-brand-dark">{selectedSchool.primary_category}</strong> archetype. Below is how your logged hours compare to this school's expected baseline tagets.
                             </p>

                             <div className="space-y-5">
                                 {['Inquiry', 'Service', 'Teamwork', 'Clinical'].map((category) => {
                                     // Calculate comparison
                                     const archData = SCHOOL_ARCHETYPES.find(a => a.dbCategory === selectedSchool.primary_category);
                                     if (!archData) return null;
                                     
                                     const targetScore = archData.targets[category as keyof typeof archData.targets];
                                     const myScore = studentScores[category as keyof typeof studentScores];
                                     
                                     // We cap the fill percentage at 100% just for UI rendering so it doesn't break limits
                                     const myPercentage = targetScore > 0 ? Math.min(100, Math.round((myScore / targetScore) * 100)) : (myScore > 0 ? 100 : 0);
                                     
                                     return (
                                         <div key={category}>
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-xs font-bold text-slate-700">{category}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                    <span className={myScore >= targetScore ? 'text-brand-teal' : 'text-slate-500'}>
                                                        You: {myScore}h
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-slate-400">Target: {targetScore}h</span>
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

                        {/* Future AI Button Hint Placeholder */}
                         <div className="p-4 rounded-xl border border-brand-teal/20 bg-brand-teal/[0.03] flex items-start gap-3 mt-auto">
                            <Info className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                Keep logging activities! Highly matched schools prioritize applicants whose narrative themes align perfectly with their stated mission.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile overlay backdrop when drawer is open */}
            {selectedSchool && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden opacity-100 transition-opacity duration-500"
                    onClick={() => setSelectedSchool(null)}
                ></div>
            )}
        </div>
    );
};
