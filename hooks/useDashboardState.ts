import { useState, useMemo, useRef } from 'react';
import { Activity, ActivityStatus } from '../types';
import { calculateAdComScore } from '../utils/scoring';

export const useDashboardState = (activities: Activity[]) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'mission-fit'>('overview');
    const [isCompetencyModalOpen, setIsCompetencyModalOpen] = useState(false);
    const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const activitiesRef = useRef<HTMLDivElement>(null);

    const scrollToActivities = () => {
        setActiveTab('overview');
        setTimeout(() => {
            activitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const scrollToTop = () => {
        setActiveTab('overview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    return {
        activeTab,
        setActiveTab,
        isCompetencyModalOpen,
        setIsCompetencyModalOpen,
        isReadinessModalOpen,
        setIsReadinessModalOpen,
        searchQuery,
        setSearchQuery,
        activitiesRef,
        scrollToActivities,
        scrollToTop,
        handleOpenCompetencyAudit,
        filledActivities,
        filteredActivities,
        readiness
    };
};
