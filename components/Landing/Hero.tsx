import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ScoreDial } from '../Dashboard/ScoreDial';
import { HERO, SAMPLE_SCORE, SAMPLE_CAPTION } from './landingData';

const container: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

const PillarBar: React.FC<{ name: string; hours: number; target: number }> = ({ name, hours, target }) => {
    const pct = Math.min(100, Math.round((hours / target) * 100));
    const met = hours >= target;
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{name}</span>
                <span className={`text-[11px] font-bold tabular-nums ${met ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {hours} / {target}h
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                <div
                    className={`h-full rounded-full ${met ? 'bg-emerald-400' : 'bg-brand-gold'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

export const Hero: React.FC<{ onSignup: () => void }> = ({ onSignup }) => (
    <main className="relative z-10 max-w-7xl mx-auto px-6 pt-4 pb-16 lg:pt-10 lg:pb-24 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-center lg:text-left"
        >
            <motion.p
                variants={item}
                className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-teal mb-5"
            >
                {HERO.eyebrow}
            </motion.p>

            <motion.h1
                variants={item}
                className="text-[2.5rem] sm:text-5xl lg:text-[3.75rem] font-medium text-brand-dark leading-[1.08] tracking-tight mb-6"
            >
                {HERO.headline.lead}{' '}
                <span className="text-brand-teal">{HERO.headline.emphasis}</span>
            </motion.h1>

            <motion.p variants={item} className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                {HERO.sub}
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                    onClick={onSignup}
                    className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-brand-teal text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-teal/20 transition-all hover:bg-brand-teal-hover hover:-translate-y-0.5 active:scale-95"
                >
                    {HERO.primaryCta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                    href="#demo"
                    className="w-full sm:w-auto text-center px-8 py-4 border border-slate-300 text-slate-600 rounded-full font-bold text-xs uppercase tracking-widest transition-all hover:bg-white hover:border-slate-400 active:scale-95"
                >
                    {HERO.secondaryCta}
                </a>
            </motion.div>

            <motion.p variants={item} className="mt-3 text-xs text-slate-500 text-center lg:text-left">
                {HERO.primaryCtaNote}
            </motion.p>

            <motion.ul
                variants={item}
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"
            >
                {HERO.capabilities.map((c, i) => (
                    <li key={c} className="flex items-center gap-3">
                        {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-slate-300" />}
                        {c}
                    </li>
                ))}
            </motion.ul>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="lg:col-span-5"
        >
            <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
                <div aria-hidden="true" className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-teal/20 blur-[70px]" />
                <div aria-hidden="true" className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-brand-gold/10 blur-[70px]" />

                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                        Application readiness
                    </p>

                    <div className="flex items-center gap-6 mb-8">
                        <ScoreDial
                            score={SAMPLE_SCORE.score}
                            level={SAMPLE_SCORE.level}
                            size={116}
                            radius={42}
                            strokeWidth={7}
                            variant="dark"
                        />
                        <p className="text-sm text-slate-300 leading-relaxed">{SAMPLE_SCORE.topGap}</p>
                    </div>

                    <div className="space-y-4">
                        {SAMPLE_SCORE.pillars.map((p) => (
                            <PillarBar key={p.name} {...p} />
                        ))}
                    </div>

                    <p className="mt-7 pt-5 border-t border-slate-700/60 text-[11px] text-slate-500">
                        {SAMPLE_CAPTION}
                    </p>
                </div>
            </div>
        </motion.div>
    </main>
);
