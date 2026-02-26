import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Activity, ActivityStatus, DateRange, ApplicationType, ArchitectAnalysis } from '../types';
import { DESC_LIMITS } from '../constants';
import * as geminiService from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

type SaveStatus = 'UNSAVED' | 'SAVING' | 'SAVED';

function useDebouncedSave(onSave: (activity: Activity) => void, delay: number) {
    const onSaveRef = useRef(onSave);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    return useMemo(() => {
        let timeout: ReturnType<typeof setTimeout>;
        return (activity: Activity, setStatus: (s: SaveStatus) => void) => {
            setStatus('SAVING');
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const finalStatus = activity.status === ActivityStatus.EMPTY ? ActivityStatus.DRAFT : activity.status;
                onSaveRef.current({ ...activity, status: finalStatus });
                setStatus('SAVED');
            }, delay);
        };
    }, [delay]);
}

export const useActivityForm = (activity: Activity, onSave: (activity: Activity) => void, onBack: () => void, appType: ApplicationType) => {
    const [localActivity, setLocalActivity] = useState<Activity>(activity);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('SAVED');
    const [isWizardMode, setIsWizardMode] = useState(false);
    const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
    const [analysis, setAnalysis] = useState<ArchitectAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { addToast } = useToast();

    const triggerSave = useDebouncedSave(onSave, 1500);

    useEffect(() => {
        if (activity.id !== localActivity.id) setLocalActivity(activity);
    }, [activity.id]);

    const handleChange = useCallback(<K extends keyof Activity>(field: K, value: Activity[K]) => {
        setLocalActivity(prev => {
            let newStatus = prev.status;
            if (field === 'status') {
                newStatus = value as ActivityStatus;
            } else if (prev.status === ActivityStatus.EMPTY) {
                newStatus = ActivityStatus.DRAFT;
            }
            const updated = { ...prev, [field]: value, status: newStatus };
            triggerSave(updated, setSaveStatus);
            return updated;
        });
    }, [triggerSave]);

    const completedRanges = localActivity.dateRanges.filter(r => !r.isAnticipated);
    const anticipatedRange = localActivity.dateRanges.find(r => r.isAnticipated);
    const isRepeated = completedRanges.length > 1;

    const updateRange = (id: string, field: keyof DateRange, value: string) => {
        const newRanges = localActivity.dateRanges.map(r => r.id === id ? { ...r, [field]: value } : r);
        handleChange('dateRanges', newRanges);
    };

    const toggleRepeated = (shouldBeRepeated: boolean) => {
        if (shouldBeRepeated) {
            if (completedRanges.length < 2) {
                const newRange: DateRange = { id: `dr-comp-${Date.now()}`, startDateMonth: '', startDateYear: '', endDateMonth: '', endDateYear: '', hours: '', isAnticipated: false };
                handleChange('dateRanges', [...localActivity.dateRanges, newRange]);
            }
        } else {
            const firstCompleted = completedRanges[0];
            const newRanges = [firstCompleted];
            if (anticipatedRange) newRanges.push(anticipatedRange);
            handleChange('dateRanges', newRanges);
        }
    };

    const addRepeatedRange = () => {
        if (completedRanges.length >= 4) return;
        const newRange: DateRange = { id: `dr-comp-${Date.now()}`, startDateMonth: '', startDateYear: '', endDateMonth: '', endDateYear: '', hours: '', isAnticipated: false };
        handleChange('dateRanges', [...localActivity.dateRanges, newRange]);
    };

    const removeRange = (id: string) => {
        handleChange('dateRanges', localActivity.dateRanges.filter(r => r.id !== id));
    };

    const handleSaveAndClose = () => {
        const finalStatus = localActivity.status === ActivityStatus.EMPTY ? ActivityStatus.DRAFT : localActivity.status;
        onSave({ ...localActivity, status: finalStatus });
        onBack();
    };

    const handleAnalyzeDraft = async () => {
        if (!localActivity.description || localActivity.description.length < 20) {
            addToast("Please draft a bit more content before analyzing.", "info");
            return;
        }
        setIsAnalyzing(true);
        setIsAnalyzeOpen(true);
        try {
            const result = await geminiService.getDraftAnalysis(localActivity.description, DESC_LIMITS[appType]);
            setAnalysis(result);
            if (result.suggestedCompetencies) {
                handleChange('competencies', result.suggestedCompetencies);
            }
        } catch (e: any) {
            console.error(e);
            setIsAnalyzeOpen(false); // Close modal on error so they can see toast
            const msg = e.message === 'AUTH_REQUIRED'
                ? "You must be logged in to use the AI Analysis features and save your data."
                : (e.message || "Failed to generate analysis.");
            addToast(msg, "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return {
        localActivity,
        handleChange,
        saveStatus,
        isWizardMode,
        setIsWizardMode,
        isAnalyzeOpen,
        setIsAnalyzeOpen,
        analysis,
        isAnalyzing,
        completedRanges,
        anticipatedRange,
        isRepeated,
        updateRange,
        toggleRepeated,
        addRepeatedRange,
        removeRange,
        handleSaveAndClose,
        handleAnalyzeDraft
    };
};
