import React from 'react';
import { Hero } from './Landing/Hero';
import { TheStakes } from './Landing/TheStakes';
import { WriteThisFirst } from './Landing/WriteThisFirst';
import { ProductFrame } from './Landing/ProductFrame';
import { CompetencyGrid } from './Landing/CompetencyGrid';
import { RedFlagSection } from './Landing/RedFlagSection';
import { FeatureGrid } from './Landing/FeatureGrid';
import { FAQ } from './Landing/FAQ';
import { FinalCTA } from './Landing/FinalCTA';
import { LandingFooter } from './Landing/LandingFooter';

interface LandingPageProps {
    onLogin: () => void;
    onSignup: () => void;
}

const NAV_LINKS = [
    { href: '#method', label: 'Method' },
    { href: '#demo', label: 'See it work' },
    { href: '#faq', label: 'Questions' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => (
    <div className="min-h-screen bg-brand-light font-sans selection:bg-brand-teal selection:text-white text-brand-dark overflow-x-hidden">
        <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] [mask-image:radial-gradient(ellipse_at_top,white,transparent_75%)]" />
        </div>

        <nav className="relative z-50 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="w-7 h-7 shrink-0 text-brand-teal"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="font-bold text-base sm:text-lg tracking-tight text-brand-dark whitespace-nowrap">
                    W&amp;A Architect
                </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-teal transition-colors"
                    >
                        {link.label}
                    </a>
                ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                <button
                    onClick={onLogin}
                    className="px-3 sm:px-5 py-2.5 text-slate-600 hover:text-brand-dark rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors"
                >
                    Log in
                </button>
                <button
                    onClick={onSignup}
                    className="px-4 sm:px-5 py-2.5 bg-brand-dark text-white rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all hover:bg-brand-teal active:scale-95"
                >
                    Start free
                </button>
            </div>
        </nav>

        <Hero onSignup={onSignup} />
        <TheStakes />
        <WriteThisFirst />
        <ProductFrame />
        <CompetencyGrid />
        <RedFlagSection />
        <FeatureGrid />
        <FAQ />
        <FinalCTA onSignup={onSignup} />
        <LandingFooter />
    </div>
);
