import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AnnotatedEntry } from './AnnotatedEntry';
import { HERO } from './landingData';

const container: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
};

export const Hero: React.FC<{ onSignup: () => void }> = ({ onSignup }) => (
    <main className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-20 lg:pt-14 lg:pb-28 grid lg:grid-cols-12 gap-14 lg:gap-16 items-center">
        <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 xl:col-span-5"
        >
            <motion.p
                variants={item}
                className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand-teal mb-6"
            >
                {HERO.eyebrow}
            </motion.p>

            <motion.h1
                variants={item}
                className="font-serif text-[2.6rem] sm:text-[3.2rem] lg:text-[3.4rem] text-brand-ink leading-[1.06] tracking-[-0.02em] mb-7"
            >
                {HERO.headline.lead}
                <span className="block text-brand-teal">{HERO.headline.emphasis}</span>
            </motion.h1>

            <motion.p variants={item} className="text-[17px] sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-9">
                {HERO.sub}
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                    onClick={onSignup}
                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-brand-teal text-white rounded-full font-extrabold text-xs uppercase tracking-[0.15em] shadow-[0_14px_30px_-12px_rgba(46,107,107,0.8)] transition-all hover:bg-brand-teal-hover hover:-translate-y-0.5 active:scale-95"
                >
                    {HERO.primaryCta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                    href="#demo"
                    className="text-center px-8 py-4 border border-brand-rule bg-white/60 text-slate-700 rounded-full font-bold text-xs uppercase tracking-[0.15em] transition-all hover:bg-white hover:border-slate-400 active:scale-95"
                >
                    {HERO.secondaryCta}
                </a>
            </motion.div>

            <motion.p variants={item} className="mt-4 text-xs text-slate-500">
                {HERO.primaryCtaNote}
            </motion.p>

            <motion.ul
                variants={item}
                className="mt-10 pt-6 border-t border-brand-rule flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500"
            >
                {/* A leading dot on every item rather than separators between them, so a
                    wrapped row never starts with an orphaned divider. */}
                {HERO.capabilities.map((c) => (
                    <li key={c} className="flex items-center gap-2">
                        <span aria-hidden="true" className="w-1 h-1 rounded-full bg-brand-teal/50" />
                        {c}
                    </li>
                ))}
            </motion.ul>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 xl:col-span-7"
        >
            <AnnotatedEntry />
        </motion.div>
    </main>
);
