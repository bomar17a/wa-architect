import React, { useState, useMemo, useEffect } from 'react';
import { Activity, ActivityStatus } from '../types';
import { AMCAS_EXPERIENCE_TYPES } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { Check, AlertTriangle, X, Save, Edit3 } from 'lucide-react';

interface ResumeReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    parsedActivities: Activity[];
    onImport: (activities: Activity[]) => void;
}

export const ResumeReviewModal: React.FC<ResumeReviewModalProps> = ({
    isOpen,
    onClose,
    parsedActivities,
    onImport,
}) => {
    const [activities, setActivities] = useState<Activity[]>(parsedActivities);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(parsedActivities.map(a => a.id)));
    const [editingId, setEditingId] = useState<number | null>(null);
    const { addToast } = useToast();

    // Sync internal state when a new batch of parsed activities arrives (e.g. second upload)
    useEffect(() => {
        setActivities(parsedActivities);
        setSelectedIds(new Set(parsedActivities.map(a => a.id)));
    }, [parsedActivities]);

    const unclassifiedCount = useMemo(() =>
        activities.filter(a => a.experienceType === 'Unclassified').length,
        [activities]);

    if (!isOpen) return null;

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleTypeChange = (id: number, newType: string) => {
        setActivities(prev => prev.map(a =>
            a.id === id ? { ...a, experienceType: newType } : a
        ));
        setEditingId(null);
    };

    const handleImport = () => {
        const toImport = activities.filter(a => selectedIds.has(a.id));
        if (toImport.some(a => a.experienceType === 'Unclassified')) {
            addToast("Please classify all selected activities before importing.", "error");
            return;
        }
        onImport(toImport);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl sm:rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Review Activities</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Found {activities.length} activities.
                            {unclassifiedCount > 0 && <span className="text-amber-600 font-semibold ml-1"> {unclassifiedCount} need review.</span>}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className={`bg-white border rounded-lg p-4 transition-all ${selectedIds.has(activity.id) ? 'border-brand-teal shadow-sm' : 'border-slate-200 opacity-60'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(activity.id)}
                                        onChange={() => toggleSelection(activity.id)}
                                        className="w-5 h-5 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 text-base sm:text-lg">{activity.title}</h3>
                                            <p className="text-slate-500 font-medium text-sm">{activity.organization}</p>
                                        </div>

                                        {/* Classification Audit */}
                                        <div className="relative">
                                            {editingId === activity.id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        autoFocus
                                                        className="text-sm border-brand-teal ring-2 ring-brand-teal/20 rounded-md p-1 bg-white"
                                                        value={activity.experienceType === 'Unclassified' ? '' : activity.experienceType}
                                                        onChange={(e) => handleTypeChange(activity.id, e.target.value)}
                                                        onBlur={() => setEditingId(null)}
                                                    >
                                                        <option value="" disabled>Select Type...</option>
                                                        {AMCAS_EXPERIENCE_TYPES.map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingId(activity.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${activity.experienceType === 'Unclassified'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {activity.experienceType === 'Unclassified' && <AlertTriangle className="w-3 h-3" />}
                                                    {activity.experienceType}
                                                    <Edit3 className="w-3 h-3 opacity-50 ml-1" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{activity.description}</p>

                                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium uppercase tracking-wider">
                                        <span>{activity.dateRanges[0]?.startDateMonth} {activity.dateRanges[0]?.startDateYear} - {activity.dateRanges[0]?.endDateMonth} {activity.dateRanges[0]?.endDateYear}</span>
                                        {activity.dateRanges[0]?.hours && <span>• {activity.dateRanges[0]?.hours} Hours</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-100 bg-white rounded-b-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sticky bottom-0 z-10">
                    <div className="text-sm text-slate-500">
                        {selectedIds.size} activities selected
                    </div>
                    <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1 text-center">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.size === 0}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-teal hover:bg-brand-dark text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-brand-teal/30 disabled:opacity-50 disabled:shadow-none order-1 sm:order-2"
                        >
                            <Save className="w-4 h-4" />
                            Import Selected
                        </button>
                </div>
            </div>
        </div>
    );
};
