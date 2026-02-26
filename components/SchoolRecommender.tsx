import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Building, Target, Award, ArrowLeft, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
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
    const [searchTerm, setSearchQuery] = useState('');

    // Filters
    const [degreeFilter, setDegreeFilter] = useState<string>('All');
    const [systemFilter, setSystemFilter] = useState<string>('All');

    // Load all schools from Supabase
    useEffect(() => {
        const fetchSchools = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('medical_schools').select('*');

            if (!error && data) {
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

    const topMatch = schools.length > 0 ? schools[0] : null;

    return (
        <div className="w-full h-full flex flex-col pt-4 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-brand-dark font-serif">School Recommender</h1>
                    <p className="text-slate-400 text-sm mt-1">Data-driven med school recommendations based on your activity profile.</p>
                </div>
            </header>

            {/* Highlights / Stats */}
            {topMatch && !loading && (
                <div className="mb-6 bg-gradient-to-r from-brand-teal/10 to-brand-dark/5 border border-brand-teal/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full shadow-sm text-brand-teal">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Highest Scoring Archetype</h3>
                            <p className="font-bold text-brand-dark text-lg">{topMatch.primary_category}</p>
                        </div>
                    </div>
                    <div className="flex text-sm font-bold text-slate-700 bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white">
                        Based on your hours, you are a {topMatch.matchScore}% fit for these programs.
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden mb-8 md:mb-0">

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-6 px-2">
                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search universities..."
                            value={searchTerm}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 w-1/2 lg:w-auto">
                            <Filter className="w-3 h-3 text-slate-400 ml-1" />
                            <select
                                value={degreeFilter}
                                onChange={(e) => setDegreeFilter(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer w-full"
                            >
                                <option value="All">All Degrees</option>
                                <option value="MD">MD</option>
                                <option value="DO">DO</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 w-1/2 lg:w-auto">
                            <Filter className="w-3 h-3 text-slate-400 ml-1" />
                            <select
                                value={systemFilter}
                                onChange={(e) => setSystemFilter(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer w-full"
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
                        <div className="w-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                            No schools matched your criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredSchools.map((school) => {

                                // Get styling for the archetype tag
                                const archData = SCHOOL_ARCHETYPES.find(a => a.dbCategory === school.primary_category);
                                const badgeColor = archData ? archData.color.replace('border-', 'border border-') : 'bg-slate-100 text-slate-600';

                                return (
                                    <div key={school.id} className="group border border-slate-200 rounded-2xl p-5 hover:border-brand-teal/40 hover:shadow-md transition-all flex flex-col justify-between bg-white relative overflow-hidden">
                                        {/* Match Score Indicator */}
                                        {school.matchScore !== undefined && school.matchScore >= 80 && (
                                            <div className="absolute top-0 right-0 bg-brand-gold text-brand-dark text-[10px] font-black tracking-widest px-3 py-1 rounded-bl-xl shadow-sm z-10 flex items-center gap-1">
                                                <Award className="w-3 h-3" /> BEST FIT
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 group-hover:bg-brand-teal group-hover:text-white transition-colors flex-shrink-0">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-16 lg:pr-0">
                                                <h3 className="font-bold text-slate-800 text-base md:text-lg leading-tight group-hover:text-brand-teal transition-colors break-words">
                                                    {school.school_name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {school.degree_type}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {school.application_system}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${badgeColor} mb-3`}>
                                                {school.primary_category}
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                <span className="text-xs font-medium text-slate-400">Match Potential</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-brand-teal rounded-full"
                                                            style={{ width: `${school.matchScore}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700 w-9 text-right">{school.matchScore}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
