
import { useState, useCallback } from 'react';
import { parseResume } from '../services/geminiService.ts';
import { Activity, ActivityStatus } from '../types.ts';

interface UseResumeProcessorReturn {
    isProcessing: boolean;
    error: string | null;
    parsedActivities: Activity[];
    processResumeText: (text: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

export const useResumeProcessor = (): UseResumeProcessorReturn => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedActivities, setParsedActivities] = useState<Activity[]>([]);

    const processResumeText = useCallback(async (text: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            if (!text || text.trim().length === 0) {
                throw new Error("Resume text is empty.");
            }

            const newActivities = await parseResume(text);

            if (!newActivities || newActivities.length === 0) {
                throw new Error("AI extracted no activities. The resume format might be tricky.");
            }

            // Transform simple objects into full Activity objects
            const stampedActivities: Activity[] = newActivities.map((a: any, i: number) => ({
                id: Date.now() + i, // Temp ID
                title: a.title || 'Untitled Role',
                organization: a.organization || 'Unknown Organization',
                experienceType: a.experienceType || 'General Entry',
                city: a.city || '',
                country: a.country || '',
                contactName: '', // Explicitly empty
                contactTitle: '',
                contactEmail: '',
                contactPhone: '',
                status: ActivityStatus.DRAFT,
                isMostMeaningful: false,
                description: a.description || '',
                mmeAction: '',
                mmeResult: '',
                mmeEssay: '',
                competencies: [],
                dueDate: '',
                dateRanges: [{
                    id: `dr-${Date.now()}-${i}`,
                    startDateMonth: a.startDateMonth || '',
                    startDateYear: a.startDateYear || '',
                    endDateMonth: a.endDateMonth || '',
                    endDateYear: a.endDateYear || '',
                    hours: '0', // Explicitly empty
                    isAnticipated: false
                }],
                // Ensure required fields from Activity type are present
                tags: [],
                notes: ''
            }));

            setParsedActivities(stampedActivities);
        } catch (err: any) {
            console.error("Resume processing error:", err);
            setError(err.message || "Failed to process resume.");
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const reset = useCallback(() => {
        setParsedActivities([]);
        setError(null);
        setIsProcessing(false);
    }, []);

    return {
        isProcessing,
        error,
        parsedActivities,
        processResumeText,
        clearError,
        reset
    };
};
