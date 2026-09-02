import { useState, useMemo, useRef, useEffect } from 'react';
import { Activity, ActivityStatus } from '../types';
import { calculateAdComScore } from '../utils/scoring';
import { useProfile } from '../contexts/ProfileContext';

export type DashboardTab = 'overview' | 'mission-fit' | 'school-recommender';

export interface AmcasInfo {
    daysToOpening: number;
    isOpen: boolean;
    openingDate: Date;
    urgency: 'green' | 'amber' | 'red';
    cycleYear: number | 'auto';
}

// AMCAS opens the application portal (coursework entry, personal statement upload, etc.)
// in the first week of May each cycle — historically May 1st, ~9:30 AM ET. That's distinct
// from the *submission* opening, which lands closer to the end of May.
const AMCAS_OPENING_MONTH = 4; // May (0-indexed)
const AMCAS_OPENING_DAY = 1;

const computeAmcasInfo = (cycleYear: number | 'auto'): AmcasInfo => {
    const today = new Date();
    let openingDate: Date;
    if (cycleYear === 'auto') {
        openingDate = new Date(today.getFullYear(), AMCAS_OPENING_MONTH, AMCAS_OPENING_DAY);
        if (today > openingDate) openingDate.setFullYear(openingDate.getFullYear() + 1);
    } else {
        openingDate = new Date(cycleYear, AMCAS_OPENING_MONTH, AMCAS_OPENING_DAY);
    }
    const daysToOpening = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOpen = daysToOpening <= 0;
    const urgency: AmcasInfo['urgency'] = isOpen ? 'green' : daysToOpening > 180 ? 'green' : daysToOpening > 90 ? 'amber' : 'red';
    return { daysToOpening, isOpen, openingDate, urgency, cycleYear };
};

export const useDashboardState = (activities: Activity[]) => {
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
    const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
    const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Persisted on the user's profile row so the countdown follows them across devices.
    // profile.cycleYear === null means "auto" (track the nearest upcoming opening).
    const { profile, updateProfile } = useProfile();
    const cycleYear: number | 'auto' = profile?.cycleYear ?? 'auto';
    const setCycleYear = (year: number | 'auto') => {
        updateProfile({ cycleYear: year === 'auto' ? null : year })
            .catch(() => { /* already surfaced by ProfileContext */ });
    };

    const amcasInfo = useMemo(() => computeAmcasInfo(cycleYear), [cycleYear]);

    const activitiesRef = useRef<HTMLDivElement>(null);

    const scrollToActivities = () => {
        setActiveTab('overview');
        setTimeout(() => {
            activitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };


    const handleOpenCompetencyAudit = () => {
        setIsCompetencyModalOpen(true);
    };

    const filledActivities = useMemo(() => activities.filter(a => a.status !== ActivityStatus.EMPTY), [activities]);

    const filteredActivities = useMemo(() => {
        if (!searchQuery) return filledActivities;
        const query = searchQuery.toLowerCase();
        return filledActivities.filter(a =>
            a.title.toLowerCase().includes(query) ||
            a.organization.toLowerCase().includes(query) ||
            a.experienceType.toLowerCase().includes(query)
        );
    }, [filledActivities, searchQuery]);

    const readiness = useMemo(() => calculateAdComScore(activities), [activities]);

    // A deadline long past isn't a deadline any more, it's stale data — and surfacing it
    // pushes genuinely actionable dates out of view in a panel titled "Upcoming".
    const STALE_AFTER_DAYS = 30;

    const upcomingDeadlines = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        return activities
            .filter(a => a.dueDate && a.status !== ActivityStatus.EMPTY)
            .map(a => {
                const daysLeft = Math.ceil((new Date(a.dueDate!).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
                return { activity: a, daysLeft };
            })
            .filter(d => d.daysLeft >= -STALE_AFTER_DAYS)
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [activities]);

    return {
        activeTab,
        setActiveTab,
        isCompetencyModalOpen,
        setIsCompetencyModalOpen,
        isReadinessModalOpen,
        setIsReadinessModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        searchQuery,
        setSearchQuery,
        cycleYear,
        setCycleYear,
        amcasInfo,
        activitiesRef,
        scrollToActivities,
        handleOpenCompetencyAudit,
        filledActivities,
        filteredActivities,
        readiness,
        upcomingDeadlines
    };
};
