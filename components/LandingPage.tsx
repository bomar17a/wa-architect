import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    ArrowRight, ShieldCheck, CheckCircle2,
    LineChart, Microscope, Target, Zap,
    LogIn, MoveHorizontal, Brain, HelpCircle,
    BookOpen, Lightbulb, Trophy
} from 'lucide-react';
import { MissionFitRadar } from './MissionFitRadar';
import { DEMO_ACTIVITIES } from '../constants';
import { Activity } from '../types';

interface LandingPageProps {
    onLogin: () => void;
    onSignup: () => void;
}

// --- Mock Data for Animation ---
const DRAFT_STATE: Activity[] = [
    {
        ...DEMO_ACTIVITIES[0],
        id: 999,
        experienceType: 'Community Service/Volunteer - Not Medical/Clinical',
        description: 'Volunteered at local shelter.',
        dateRanges: [{ ...DEMO_ACTIVITIES[0].dateRanges[0], hours: '20' }],
        isMostMeaningful: false
    }
];

const FINAL_STATE: Activity[] = [
    { ...DEMO_ACTIVITIES[0], id: 1001, experienceType: 'Research/Lab', description: 'Published author in Nature.', dateRanges: [{ ...DEMO_ACTIVITIES[0].dateRanges[0], hours: '800' }] },
    { ...DEMO_ACTIVITIES[0], id: 1002, experienceType: 'Community Service/Volunteer - Medical/Clinical', isMostMeaningful: true, description: 'Led initiative.', dateRanges: [{ ...DEMO_ACTIVITIES[0].dateRanges[0], hours: '400' }] },
    { ...DEMO_ACTIVITIES[0], id: 1003, experienceType: 'Leadership - Not Listed Elsewhere', description: 'President of club.', dateRanges: [{ ...DEMO_ACTIVITIES[0].dateRanges[0], hours: '500' }] },
    { ...DEMO_ACTIVITIES[0], id: 1004, experienceType: 'Physician Shadowing/Clinical Observation', description: 'Shadowing', dateRanges: [{ ...DEMO_ACTIVITIES[0].dateRanges[0], hours: '200' }] },
];

const ComparisonSlider = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    const handleMove = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const position = ((x - rect.left) / rect.width) * 100;
        setSliderPosition(Math.min(100, Math.max(0, position)));
    };

    return (
        <div className="w-full max-w-6xl mx-auto my-24 select-none px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-dark mb-4">See the Transformation</h2>
                <p className="text-slate-500 text-lg">Drag the slider to compare a standard draft vs. an architected narrative.</p>
            </div>

            <div
                className="relative w-full h-[500px] rounded-3xl overflow-hidden cursor-ew-resize shadow-2xl ring-1 ring-slate-900/5 bg-slate-100"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMove}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onTouchMove={handleMove}
            >
                {/* RIGHT SIDE (AFTER) */}
                <div className="absolute inset-0 bg-brand-dark flex items-center justify-center p-8 md:p-16">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
                    <div className="relative max-w-2xl text-left z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-brand-teal text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg shadow-brand-teal/20">Architected Narrative</span>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>)}
                            </div>
                        </div>
                        <p className="font-serif text-2xl md:text-4xl text-white leading-relaxed tracking-wide">
                            "Spearheaded patient triage protocols, <span className="text-emerald-300 bg-emerald-900/30 px-1 rounded">reducing wait times by 15%</span> during peak trauma hours. Coordinated across 3 nursing teams to ensure seamless hand-offs."
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <span className="text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">✓ Leadership Pillar</span>
                            <span className="text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">✓ Quantifiable Impact</span>
                        </div>
                    </div>
                </div>

                {/* LEFT SIDE (BEFORE) */}
                <div
                    className="absolute inset-0 bg-white flex items-center justify-center p-8 md:p-16 border-r border-slate-200 z-10"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`, backgroundColor: '#ffffff' }}
                >
                    <div className="relative max-w-2xl text-left">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-md">Standard Draft</span>
                        </div>
                        <p className="font-serif text-2xl md:text-4xl text-slate-600 leading-relaxed font-medium">
                            "I helped patients at the front desk and made sure they were comfortable. I also watched the doctors and nurses work during my shifts."
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">⚠ Passive Voice</span>
                            <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">⚠ Vague Description</span>
                        </div>
                    </div>
                </div>

                {/* SLIDER HANDLE */}
                <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white cursor-ew-resize z-30 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                    style={{ left: `${sliderPosition}%` }}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 -left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl text-brand-dark ring-4 ring-black/5">
                        <MoveHorizontal className="w-6 h-6 text-brand-teal" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const WritingTemplateShowcase = () => (
    <section id="methodology" className="py-12 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-4">The Architect Method</h2>
                <p className="text-slate-600 font-medium max-w-2xl mx-auto">Stop staring at a blank page. Our 4-step wizard guides you from basic facts to a compelling narrative aligned with AAMC core competencies.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                {[
                    {
                        step: 1,
                        title: "Context & Role",
                        icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
                        desc: "Define the 'What'. Establish your specific responsibilities clearly.",
                        example: "\"Scribed for Dr. Smith in the ED.\""
                    },
                    {
                        step: 2,
                        title: "Impact & Outcomes",
                        icon: <Target className="w-5 h-5 text-emerald-500" />,
                        desc: "Define the 'Show'. Use numbers and active verbs to prove value.",
                        example: "\"Reduced documentation lag by 20%.\""
                    },
                    {
                        step: 3,
                        title: "Reflection & Growth",
                        icon: <Brain className="w-5 h-5 text-purple-500" />,
                        desc: "Define the 'Tell'. Connect the activity to your future as a physician.",
                        example: "\"Learned the vital role of efficiency.\""
                    },
                    {
                        step: 4,
                        title: "Strengthen",
                        icon: <Trophy className="w-5 h-5 text-amber-500" />,
                        desc: "Add accolades. Mention awards or specific recognition received.",
                        example: "\"Recognized as Scribe of the Month.\""
                    }
                ].map((item, i) => (
                    <div key={i} className="relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute -top-4 left-6 w-8 h-8 bg-brand-dark text-white rounded-lg flex items-center justify-center font-bold font-serif shadow-lg">
                            {item.step}
                        </div>
                        <div className="mt-4 mb-3 p-3 bg-slate-50 rounded-xl w-fit group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100 dark-icon-bg">
                            {item.icon}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4 min-h-[60px]">{item.desc}</p>
                        <div className="bg-brand-light/40 p-3 rounded-lg border border-brand-teal/20">
                            <span className="text-[10px] font-black text-brand-dark/60 uppercase tracking-widest block mb-1">Example Input</span>
                            <p className="text-xs text-slate-800 font-bold italic">{item.example}</p>
                        </div>
                        {i < 3 && (
                            <div className="hidden md:block absolute top-1/2 -right-3 z-10 text-slate-300 translate-x-1/2">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
    const [radarMode, setRadarMode] = useState<'DRAFT' | 'FINAL'>('DRAFT');

    useEffect(() => {
        // Animate the radar chart between draft and final states
        const interval = setInterval(() => {
            setRadarMode(prev => prev === 'DRAFT' ? 'FINAL' : 'DRAFT');
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const radarActivities = radarMode === 'DRAFT' ? DRAFT_STATE : FINAL_STATE;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
            }
        }
    };

    return (
        <div className="min-h-screen bg-brand-light font-sans selection:bg-brand-teal selection:text-white text-brand-dark overflow-x-hidden">

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-white blur-[140px] rounded-full opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-teal/10 blur-[140px] rounded-full opacity-40"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-brand-teal" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <span className="font-bold text-xl tracking-tight font-serif text-brand-dark">W&A Architect</span>
                </div>

                <div className="hidden md:flex items-center gap-8 bg-white/40 backdrop-blur-md px-10 py-2.5 rounded-full border border-white/60 shadow-sm">
                    <a href="#methodology" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-teal transition-colors">Methodology</a>
                    <a href="#benchmarks" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-teal transition-colors">Benchmarks</a>
                    <a href="#faq" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-teal transition-colors">FAQ</a>
                </div>

                <button
                    onClick={onLogin}
                    className="group flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-brand-dark border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                    Member Login
                    <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <LogIn className="w-3 h-3" />
                    </div>
                </button>
            </nav>

            {/* Hero Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-0 lg:pt-8 pb-12 grid lg:grid-cols-12 gap-12">

                {/* Left Side: Hero Text - SEO Optimized */}
                <div className="lg:col-span-7 flex flex-col justify-start text-center lg:text-left pt-6 lg:pt-0">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <motion.div variants={itemVariants} className="mb-6 flex items-center justify-center lg:justify-start gap-4">
                            <div className="px-3 py-1 rounded-full border border-slate-900 text-slate-900 text-[9px] font-black uppercase tracking-widest bg-transparent">v2.5 Release</div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">The Admissions Standard</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-[3.5rem] md:text-[4.5rem] lg:text-[5rem] font-serif font-medium text-brand-dark leading-[1] tracking-tight mb-4">
                            Architect Your <span className="italic text-slate-500">AMCAS Work & Activities</span> Narrative.
                        </motion.h1>

                        <motion.h2 variants={itemVariants} className="text-2xl md:text-3xl text-brand-dark font-medium leading-snug mb-4 max-w-2xl">
                            It is not just a list—it's a narrative of your journey, values, and personal growth.
                        </motion.h2>

                        <motion.div variants={itemVariants} className="flex flex-col gap-8 mb-8">
                            <p className="text-lg text-slate-600 font-normal max-w-xl leading-relaxed">
                                A well-crafted Work & Activities section is a powerful tool in your journey toward medical school to showcase your unique story and commitment to becoming an exceptional physician.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex flex-col items-center lg:items-start gap-6">
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button
                                    onClick={onSignup}
                                    className="group flex items-center justify-center gap-4 px-8 py-4 bg-brand-teal text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-brand-teal/20 transition-all hover:bg-brand-teal-hover hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                                >
                                    Start Your Narrative
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <a
                                    href="#methodology"
                                    className="group flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-slate-200 text-slate-600 rounded-full font-bold text-xs uppercase tracking-widest transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 whitespace-nowrap"
                                >
                                    How It Works
                                </a>
                            </div>

                            {/* Trust Bar - E-E-A-T Signal */}
                            <div className="flex flex-col items-center lg:items-start gap-3 mt-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Methodology aligned with core competencies from:</span>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                    <span className="font-serif text-lg font-bold text-slate-700">AAMC</span>
                                    <span className="h-6 w-px bg-slate-300"></span>
                                    <span className="font-serif text-lg font-bold text-slate-700">Harvard Medical School</span>
                                    <span className="h-6 w-px bg-slate-300"></span>
                                    <span className="font-serif text-lg font-bold text-slate-700">Stanford Medicine</span>
                                    <span className="h-6 w-px bg-slate-300"></span>
                                    <span className="font-serif text-lg font-bold text-slate-700">Johns Hopkins</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Right Side: LIVE Visuals - Replaced Static Cards */}
                {/* Mobile: Horizontal Scroll Snap | Desktop: Vertical Grid */}
                <div className="lg:col-span-5 flex lg:flex-col gap-6 lg:gap-8 overflow-x-auto lg:overflow-visible pb-8 lg:pb-0 snap-x snap-mandatory lg:snap-none -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide">

                    {/* AdCom Score Card (Detailed Preview) - Moved to Top */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="bg-white rounded-[2.5rem] relative overflow-hidden group hover:shadow-2xl hover:shadow-brand-dark/10 transition-all border border-slate-200 flex flex-col shadow-xl"
                    >
                        {/* Header Section */}
                        <div className="bg-white px-8 py-6 border-b border-slate-100 relative z-20">
                            <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                                Not All Activities <br /> Are Created Equal
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-brand-teal" />
                                Application Readiness Audit
                            </p>
                        </div>

                        {/* Split Content: Score (Dark) & Benchmarks (Light) */}
                        <div className="flex flex-col">

                            {/* Top: Score Visualization (Dark Theme) */}
                            <div className="bg-slate-900 p-8 relative overflow-hidden">
                                {/* Background FX */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 blur-[60px] rounded-full pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 blur-[60px] rounded-full pointer-events-none"></div>

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                                            <defs>
                                                <linearGradient id="gaugePreviewGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#2E6B6B" />
                                                    <stop offset="50%" stopColor="#34d399" />
                                                    <stop offset="100%" stopColor="#FFC82C" />
                                                </linearGradient>
                                            </defs>
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gaugePreviewGradient)" strokeWidth="6" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="40.2" className="transition-all duration-1000 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AdCom Score</span>
                                            <span className="text-6xl font-serif font-black text-white leading-none tracking-tighter drop-shadow-md">84</span>
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2">Excellent</span>
                                        </div>
                                    </div>

                                    {/* Next Milestone Bar */}
                                    <div className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Milestone</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Max Score</span>
                                        </div>
                                        <div className="flex items-baseline justify-between mb-2">
                                            <span className="text-xs text-slate-300 font-medium">Points to Level Up</span>
                                            <span className="text-xl font-bold text-white">16</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-gold w-[84%] shadow-[0_0_10px_rgba(255,200,44,0.5)]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Benchmarks & Actions (Light Theme) */}
                            <div className="bg-slate-50 p-6 border-t border-slate-200">

                                {/* Core Benchmarks */}
                                <div className="mb-6">
                                    <h4 className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                        <Target className="w-3 h-3 text-brand-dark" /> Core Benchmarks
                                    </h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Clinical (Total)', val: '180', target: '150h', met: true },
                                            { label: 'Research', val: '450', target: '100h', met: true },
                                            { label: 'Shadowing', val: '40', target: '100h', met: false },
                                        ].map((stat, i) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <span className="flex items-center gap-1.5">
                                                        {stat.met ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-400 bg-rose-50"></div>
                                                        )}
                                                        {stat.label}
                                                    </span>
                                                    <span className={stat.met ? 'text-emerald-600' : 'text-rose-500'}>
                                                        {stat.val} <span className="text-[9px] text-slate-400 font-medium">/ {stat.target}</span>
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${stat.met ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-[40%]'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority Actions */}
                                <div>
                                    <h4 className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                                        <Zap className="w-3 h-3 text-brand-gold" /> Priority Actions (1)
                                    </h4>
                                    <div className="p-4 bg-white rounded-xl border border-brand-gold/30 shadow-sm flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Shadowing Gap</div>
                                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                                You only have 40 hours. We recommend reaching out to more specialists to hit the 50–100+ hours to stand out as a competitive applicant.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </motion.div>

                    {/* Live Radar Chart - Visualizing "Saturation" */}
                    {/* Activity Hub Preview - Strategic Management */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-brand-teal/10 transition-all border border-white/50 ring-1 ring-slate-200/60 min-h-[440px] flex flex-col min-w-[85vw] lg:min-w-0 snap-center"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4 bg-slate-100 -mx-8 -mt-8 p-8 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-serif text-slate-800 font-bold mb-1 uppercase tracking-tight">Activity Hub</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Strategic Narrative Planning
                                </p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-teal/5 rounded-full border border-brand-teal/10">
                                <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">12/15 Slots Used</span>
                            </div>
                        </div>

                        {/* Activity List Visuals */}
                        <div className="flex-1 space-y-3 relative z-10">
                            {/* Item 1: MME / Clinical */}
                            <div className="bg-white p-4 rounded-2xl border border-brand-gold/30 shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all group/item relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold"></div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center border border-brand-gold/20">
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight">Emergency Dept Scribe</h4>
                                            <span className="text-[10px] font-medium text-slate-400">Most Meaningful Experience</span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded">Final</span>
                                </div>
                                <div className="flex items-center gap-4 pl-11">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">450 Hours</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-gold"></div>)}
                                    </div>
                                </div>
                            </div>

                            {/* Item 2: Research */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group/item opacity-90">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
                                            <Microscope className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight">Cardiology Research Asst.</h4>
                                            <span className="text-[10px] font-medium text-slate-400">Research Lab</span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black uppercase tracking-widest rounded">Draft v2</span>
                                </div>
                                <div className="flex items-center gap-4 pl-11">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">200 Hours</span>
                                </div>
                            </div>

                            {/* Item 3: Service */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group/item opacity-80">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 leading-tight">Literacy Tutor</h4>
                                            <span className="text-[10px] font-medium text-slate-400">Community Service</span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest rounded">Final</span>
                                </div>
                                <div className="flex items-center gap-4 pl-11">
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">120 Hours</span>
                                </div>
                            </div>

                            {/* Item 4: Shadowing (Gap) */}
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group/item opacity-60">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-400 leading-tight">Shadowing: Dr. Smith</h4>
                                            <span className="text-[10px] font-medium text-slate-400">Shadowing</span>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 text-[9px] font-black uppercase tracking-widest rounded">Empty</span>
                                </div>
                                <div className="flex items-center gap-4 pl-11">
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">-- Hours</span>
                                </div>
                            </div>
                        </div>

                        {/* Subtle Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-light/20 blur-[80px] rounded-full pointer-events-none"></div>
                    </motion.div>
                </div>
            </main>

            {/* Writing Template Showcase (New Section) */}
            <div className="bg-slate-100 py-12 border-y border-slate-200">
                <WritingTemplateShowcase />
            </div>

            {/* Comparison Slider Section */}
            <section id="benchmarks" className="relative z-20 py-12 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <ComparisonSlider />
                </div>
            </section>

            {/* Trust & Meta-Data Banner */}
            <section className="relative z-10 py-12 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12 items-center">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <Target className="w-6 h-6 text-brand-dark" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Candidacy Goal</div>
                            <div className="text-sm font-bold text-white">Identify Strategic Gaps</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 border-l border-brand-teal/10 pl-8">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-brand-teal">
                            <Brain className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Analysis Engine</div>
                            <div className="text-sm font-bold text-white">AAMC Pillar Saturation</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 border-l border-brand-teal/10 pl-8">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-brand-gold">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Dataset Sample</div>
                            <div className="text-sm font-bold text-white">+10k Verified Profiles</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fact-Dense FAQ Section (SEO) */}
            <section id="faq" className="relative z-10 py-16 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-4">Common Questions</h2>
                        <p className="text-slate-500">Expert answers to the most common Work & Activities inquiries.</p>
                    </div>

                    <div className="grid gap-8">
                        <div className="group">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center text-xs font-black">Q</span>
                                How many activities should be on AMCAS?
                            </h3>
                            <p className="text-slate-600 leading-relaxed pl-9 border-l-2 border-slate-100 group-hover:border-brand-teal/30 transition-colors">
                                <span className="font-bold text-slate-800">Applicants have 15 slots for work and activities on the AMCAS application.</span> While 15 is the maximum, successful matriculants average 12-13 high-quality entries. Quality over quantity is preferred; empty slots are better than "fluff" fillers.
                            </p>
                        </div>

                        <div className="group">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center text-xs font-black">Q</span>
                                What counts as clinical experience for medical school?
                            </h3>
                            <p className="text-slate-600 leading-relaxed pl-9 border-l-2 border-slate-100 group-hover:border-brand-teal/30 transition-colors">
                                <span className="font-bold text-slate-800">Clinical experience is defined by direct patient interaction.</span> Active roles (EMT, Scribe, CNA) are weighted significantly higher than passive roles (Hospital Greeter). Competitive applicants often target 150+ hours of clinical exposure plus separate shadowing hours.
                            </p>
                        </div>

                        <div className="group">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center text-xs font-black">Q</span>
                                How do I write a Most Meaningful Experience (MME) essay?
                            </h3>
                            <p className="text-slate-600 leading-relaxed pl-9 border-l-2 border-slate-100 group-hover:border-brand-teal/30 transition-colors">
                                <span className="font-bold text-slate-800">A Most Meaningful Experience (MME) essay is a 1,325-character reflection designated for your top 3 activities.</span> Unlike standard descriptions which focus on duties, MME essays must articulate <i>why</i> the experience mattered and how it prepared you for a career in medicine.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Area */}
            <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
                <div className="bg-brand-dark rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff0a_1.5px,transparent_1.5px)] [background-size:40px_40px]"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-serif font-medium mb-8 leading-tight">Architect your medical narrative <br /> with absolute certainty.</h2>
                        <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-medium">
                            The most successful applications are built on <span className="text-white">strategic positioning</span>, not just volume.
                        </p>
                        <button
                            onClick={onSignup}
                            className="group flex items-center gap-4 px-12 py-5 bg-brand-teal hover:bg-brand-teal-hover text-white rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all mx-auto shadow-xl shadow-brand-teal/20"
                        >
                            Start Your Draft
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-16 border-t border-brand-teal/10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 text-slate-800">
                        <div className="w-6 h-6 flex items-center justify-center text-brand-teal">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                        </div>
                        <span className="font-bold font-serif text-lg text-brand-dark">W&A Architect</span>
                    </div>

                    <div className="flex gap-12 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        <a href="#" className="hover:text-brand-teal transition-colors">Methodology</a>
                        <a href="#" className="hover:text-brand-teal transition-colors">Ethics</a>
                        <a href="#" className="hover:text-brand-teal transition-colors">Contact</a>
                    </div>

                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © 2025 W&A Architect Studio.
                    </div>
                </div>
            </footer>
        </div>
    );
};