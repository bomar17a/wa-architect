import React from 'react';
import { X, Mail, Calendar, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApplicationType } from '../../types';

interface SettingsModalProps {
    appType: ApplicationType;
    onAppTypeChange: (appType: ApplicationType) => void;
    cycleYear?: number | 'auto';
    onCycleYearChange?: (year: number | 'auto') => void;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ appType, onAppTypeChange, cycleYear, onCycleYearChange, onClose }) => {
    const { user, signOut } = useAuth();
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : null;
    const initial = (user?.user_metadata?.full_name || user?.email || '?').charAt(0).toUpperCase();

    const currentYear = new Date().getFullYear();
    const cycleOptions = [currentYear, currentYear + 1, currentYear + 2];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-teal/10 p-2 rounded-xl">
                            <SettingsIcon className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h2 className="text-lg font-serif font-bold text-brand-dark leading-none">Settings</h2>
                            <p className="text-slate-500 font-medium text-[10px] mt-1 uppercase tracking-wide">Account &amp; Preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {/* Account */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-brand-dark text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                                {initial}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">{user?.user_metadata?.full_name || 'Future Doctor'}</p>
                                <p className="text-slate-500 text-xs truncate flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 flex-shrink-0" />{user?.email}</p>
                                {memberSince && (
                                    <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0" />Member since {memberSince}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Application Type */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Application System</h3>
                        <p className="text-xs text-slate-500 mb-4">Determines character limits, experience categories, and Most Meaningful Experience availability.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onAppTypeChange(ApplicationType.AMCAS)}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${appType === ApplicationType.AMCAS ? 'bg-brand-dark text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                            >
                                AMCAS
                            </button>
                            <button
                                onClick={() => onAppTypeChange(ApplicationType.AACOMAS)}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${appType === ApplicationType.AACOMAS ? 'bg-brand-dark text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                            >
                                AACOMAS
                            </button>
                        </div>
                    </div>

                    {/* Application Cycle */}
                    {onCycleYearChange && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Application Cycle</h3>
                            <p className="text-xs text-slate-500 mb-4">Which AMCAS portal opening (early May, historically the 1st at ~9:30 AM ET — when you can log in, enter coursework, and upload your personal statement) the dashboard countdown targets. "Auto" always tracks the nearest upcoming one.</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => onCycleYearChange('auto')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cycleYear === 'auto' ? 'bg-brand-dark text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                >
                                    Auto
                                </button>
                                {cycleOptions.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => onCycleYearChange(year)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cycleYear === year ? 'bg-brand-dark text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">AMCAS typically certifies applications ~4 weeks after submission.</p>
                        </div>
                    )}

                    {/* Sign out */}
                    <button
                        onClick={() => { onClose(); signOut(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};
