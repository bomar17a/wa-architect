import React from 'react';

interface FocusCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    onClick: () => void;
    textColor?: string;
    subtitleColor?: string;
}

export const FocusCard: React.FC<FocusCardProps> = ({ icon, title, subtitle, color, onClick, textColor = "text-white", subtitleColor = "text-white/80" }) => (
    <div onClick={onClick} className={`p-6 rounded-[2rem] ${color} shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group`}>
        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-sm">
                {icon}
            </div>
            <div>
                <h3 className={`text-lg font-bold ${textColor} leading-tight mb-1`}>{title}</h3>
                <p className={`text-xs font-bold ${subtitleColor} uppercase tracking-wider`}>{subtitle}</p>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition-colors"></div>
    </div>
);
