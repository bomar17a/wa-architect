import React, { useId } from 'react';

interface ScoreDialProps {
    score: number;
    level: string;
    size?: number;
    radius?: number;
    strokeWidth?: number;
    variant?: 'light' | 'dark';
    className?: string;
}

export const ScoreDial: React.FC<ScoreDialProps> = ({
    score,
    level,
    size = 112,
    radius = 44,
    strokeWidth = 8,
    variant = 'light',
    className = '',
}) => {
    const gradientId = useId();
    const isDark = variant === 'dark';
    const circumference = 2 * Math.PI * radius;
    const clampedScore = Math.min(Math.max(score, 0), 100);
    const offset = circumference - (circumference * clampedScore) / 100;

    return (
        <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {isDark && (
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2E6B6B" />
                            <stop offset="50%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#FFC82C" />
                        </linearGradient>
                    </defs>
                )}
                <circle cx="50" cy="50" r={radius} stroke={isDark ? '#1e293b' : '#F1F5F9'} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
                <circle
                    cx="50" cy="50" r={radius}
                    stroke={isDark ? `url(#${gradientId})` : '#2E6B6B'}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-[2%]">
                <span
                    className={`font-black leading-none ${isDark ? 'text-white drop-shadow-lg' : 'text-brand-dark'}`}
                    style={{ fontSize: size * 0.26 }}
                >
                    {score}
                </span>
                <span
                    className={`font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-emerald-400' : 'text-slate-400'}`}
                    style={{ fontSize: Math.max(8, size * 0.075) }}
                >
                    {level}
                </span>
            </div>
        </div>
    );
};
