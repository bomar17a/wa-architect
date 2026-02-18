import React from 'react';

interface CharacterCounterProps {
    text: string;
    limit: number;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({ text, limit }) => {
    const count = text?.length || 0;
    const isOver = count > limit;
    return (
        <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-red-500' : 'bg-brand-teal'}`} style={{ width: `${Math.min((count / limit) * 100, 100)}%` }}></div>
            </div>
            <div className={`text-[10px] font-mono font-medium ${isOver ? 'text-red-600' : 'text-slate-400'}`}>{count} / {limit}</div>
        </div>
    );
};
