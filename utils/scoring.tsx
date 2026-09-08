import React from 'react';
import { Activity } from '../types';
import {
    calculateAdComScore as computeAdComScore,
    type AdComResult,
    type FeedbackTone,
} from './adcomScore';
import {
    Briefcase, AlertTriangle, Heart, Users, Target, Award, Brain, Zap
} from 'lucide-react';

// Presentation layer over utils/adcomScore.ts. The numbers live there, free of
// React, so they can be exercised by scripts/calibrate-scoring.ts.

interface FeedbackStyle {
    icon: React.ReactNode;
    color: string;
    borderColor: string;
}

const FEEDBACK_STYLES: Record<FeedbackTone, FeedbackStyle> = {
    volume:         { icon: <Briefcase className="w-3.5 h-3.5" />,     color: 'text-brand-gold',  borderColor: 'border-amber-200' },
    clinical:       { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-rose-500',    borderColor: 'border-rose-200' },
    medService:     { icon: <Heart className="w-3.5 h-3.5" />,         color: 'text-brand-teal',  borderColor: 'border-emerald-200' },
    nonMedService:  { icon: <Users className="w-3.5 h-3.5" />,         color: 'text-indigo-500',  borderColor: 'border-indigo-200' },
    shadowing:      { icon: <Target className="w-3.5 h-3.5" />,        color: 'text-orange-500',  borderColor: 'border-orange-200' },
    leadership:     { icon: <Award className="w-3.5 h-3.5" />,         color: 'text-brand-dark',  borderColor: 'border-slate-300' },
    competencies:   { icon: <Brain className="w-3.5 h-3.5" />,         color: 'text-purple-500',  borderColor: 'border-purple-200' },
    strategy:       { icon: <Zap className="w-3.5 h-3.5" />,           color: 'text-amber-600',   borderColor: 'border-amber-300' },
};

export const calculateAdComScore = (activities: Activity[]) => {
    const result: AdComResult = computeAdComScore(activities);
    return {
        ...result,
        feedback: result.feedback.map(item => ({
            text: item.text,
            category: item.category,
            ...FEEDBACK_STYLES[item.tone],
        })),
    };
};
