import React from 'react';
import { ChevronRight } from 'lucide-react';

/** Heading, intro and a "next step" button, shared by every workshop step. */
export const StepShell: React.FC<{
    title: string;
    intro: string;
    next?: { label: string; onClick: () => void };
    children: React.ReactNode;
}> = ({ title, intro, next, children }) => (
    <section aria-labelledby="mme-step-title" className="space-y-8">
        <header className="max-w-2xl">
            <h2 id="mme-step-title" className="font-serif text-2xl sm:text-[1.75rem] text-slate-900 leading-tight">{title}</h2>
            <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{intro}</p>
        </header>

        {children}

        {next && (
            <div className="pt-2 flex justify-end">
                <button
                    type="button"
                    onClick={next.onClick}
                    className="inline-flex items-center gap-1.5 bg-brand-dark hover:bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
                >
                    {next.label}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>
        )}
    </section>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
    <div className="mb-3">
        <h3 className="font-sans text-sm font-semibold text-slate-900">{children}</h3>
        {hint && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p>}
    </div>
);
