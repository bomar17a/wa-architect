import React from 'react';
import { FOOTER } from './landingData';

export const LandingFooter: React.FC = () => (
    <footer className="relative z-10 border-t border-brand-rule bg-brand-paper">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
                <p className="font-serif text-lg text-brand-ink mb-1.5">W&amp;A Architect</p>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">{FOOTER.disclaimer}</p>
            </div>
            <nav className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <a href="/privacy.html" className="hover:text-brand-teal transition-colors">Privacy</a>
                <a href="/terms.html" className="hover:text-brand-teal transition-colors">Terms</a>
                <span className="text-slate-400 normal-case tracking-normal font-normal">{FOOTER.copyright}</span>
            </nav>
        </div>
    </footer>
);
