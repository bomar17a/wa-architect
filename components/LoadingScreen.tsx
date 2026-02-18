import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => (
    <div className="h-screen w-full flex items-center justify-center bg-brand-light flex-col gap-4">
        <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your workspace...</p>
    </div>
);
