import React from 'react';

/**
 * The one heading motif the page uses: a hairline, a small-caps eyebrow, then a serif
 * heading. Sections differ by background, not by inventing new header treatments.
 */
export const SectionHeader: React.FC<{
    eyebrow: string;
    heading: string;
    intro?: string;
    tone?: 'light' | 'dark';
    align?: 'left' | 'center';
    className?: string;
}> = ({ eyebrow, heading, intro, tone = 'light', align = 'left', className = '' }) => {
    const dark = tone === 'dark';
    return (
        <div
            className={`${align === 'center' ? 'mx-auto text-center max-w-3xl' : 'max-w-3xl'} ${className}`}
        >
            <div className={`flex items-center gap-3 mb-5 ${align === 'center' ? 'justify-center' : ''}`}>
                <span
                    aria-hidden="true"
                    className={`h-px w-8 ${dark ? 'bg-brand-gold' : 'bg-brand-teal'}`}
                />
                <span
                    className={`text-[10px] font-extrabold uppercase tracking-[0.22em] ${
                        dark ? 'text-brand-gold' : 'text-brand-teal'
                    }`}
                >
                    {eyebrow}
                </span>
            </div>

            <h2
                className={`font-serif text-[1.85rem] sm:text-[2.35rem] lg:text-[2.6rem] leading-[1.15] tracking-[-0.015em] ${
                    dark ? 'text-white' : 'text-brand-ink'
                }`}
            >
                {heading}
            </h2>

            {intro && (
                <p className={`mt-5 text-[17px] leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {intro}
                </p>
            )}
        </div>
    );
};
