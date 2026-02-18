import React from 'react';
import { Activity, ActivityStatus } from '../types';
import { ACTIVITY_WEIGHTS } from '../constants';
import {
    Briefcase, AlertTriangle, Heart, Users, Target, Award, Brain, Zap
} from 'lucide-react';

export const calculateAdComScore = (activities: Activity[]) => {
    let score = 0;
    let clinicalHours = 0;
    let shadowingHours = 0;
    let researchHours = 0;
    let medicalServiceHours = 0;
    let nonMedicalServiceHours = 0;
    let leadershipHours = 0;
    let mmeCount = 0;

    const activeActivities = activities.filter(a => a.status !== ActivityStatus.EMPTY);

    // Track unique competencies
    const uniqueCompetencies = new Set<string>();

    activeActivities.forEach(a => {
        const weight = ACTIVITY_WEIGHTS[a.experienceType] || 0;
        score += weight;

        if (a.isMostMeaningful) {
            score += 4; // Higher weight for MME
            mmeCount++;
        }

        if (a.status === ActivityStatus.FINAL || a.status === ActivityStatus.REFINED) {
            score += 2;
        }

        const hours = a.dateRanges.reduce((acc, r) => acc + (parseInt(r.hours) || 0), 0);
        const type = a.experienceType.toLowerCase();

        // 1. Clinical Total (General)
        if (type.includes('medical/clinical') || type.includes('healthcare')) {
            clinicalHours += hours;
        }

        // 2. Medical Service (Specific: Community Service/Volunteer - Medical/Clinical)
        if (type.includes('community service/volunteer - medical/clinical')) {
            medicalServiceHours += hours;
        }

        // 3. Non-Medical Service (Specific: Community Service/Volunteer - Not Medical/Clinical)
        if (type.includes('community service/volunteer - not medical/clinical')) {
            nonMedicalServiceHours += hours;
        }

        // 4. Shadowing
        if (type.includes('shadowing')) {
            shadowingHours += hours;
        }

        // 5. Research
        if (type.includes('research')) {
            researchHours += hours;
        }

        // 6. Leadership
        if (type.includes('leadership')) {
            leadershipHours += hours;
        }

        a.competencies?.forEach(c => uniqueCompetencies.add(c));
    });

    // Activity Volume Bonus (Max 15)
    score += activeActivities.length;

    // Competency Saturation Bonus (Max 15)
    const saturationBonus = Math.min(15, uniqueCompetencies.size);
    score += saturationBonus;

    const MAX_RAW_SCORE = 90;
    const normalizedScore = Math.min(100, Math.round((score / MAX_RAW_SCORE) * 100));

    let level = "Foundation";
    if (normalizedScore >= 40) level = "Building";
    if (normalizedScore >= 70) level = "Competitive";
    if (normalizedScore >= 90) level = "Exceptional";

    const feedbackItems: { text: string; icon: React.ReactNode; color: string; category: string; borderColor: string }[] = [];

    if (activeActivities.length < 15) {
        feedbackItems.push({
            text: `Maximize your narrative real estate. You have filled ${activeActivities.length}/15 slots. Aim to utilize all 15 spaces to show breadth.`,
            category: 'Volume',
            icon: <Briefcase className="w-3.5 h-3.5" />,
            color: 'text-brand-gold',
            borderColor: 'border-amber-200'
        });
    }

    if (clinicalHours < 150) {
        feedbackItems.push({
            text: `Clinical hours are at ${clinicalHours}h. Targeted goal is 150h+. Consider scribing or patient intake volunteering.`,
            category: 'Clinical Gap',
            icon: <AlertTriangle className="w-3.5 h-3.5" />,
            color: 'text-rose-500',
            borderColor: 'border-rose-200'
        });
    }

    if (medicalServiceHours < 100) {
        feedbackItems.push({
            text: `Medical Volunteering is a core pillar. You are at ${medicalServiceHours}h. Aim for 100h+ of altruistic clinical service.`,
            category: 'Med. Service',
            icon: <Heart className="w-3.5 h-3.5" />,
            color: 'text-brand-teal',
            borderColor: 'border-emerald-200'
        });
    }

    if (nonMedicalServiceHours < 100) {
        feedbackItems.push({
            text: `Service beyond medicine is crucial. You have ${nonMedicalServiceHours}h. Target 100h+ in non-clinical volunteering to show diverse altruism.`,
            category: 'Non-Med Service',
            icon: <Users className="w-3.5 h-3.5" />,
            color: 'text-indigo-500',
            borderColor: 'border-indigo-200'
        });
    }

    if (shadowingHours < 100) {
        feedbackItems.push({
            text: `Shadowing is low (${shadowingHours}h). Reach out to specialists to hit the 100h benchmark.`,
            category: 'Shadowing',
            icon: <Target className="w-3.5 h-3.5" />,
            color: 'text-orange-500',
            borderColor: 'border-orange-200'
        });
    }

    if (leadershipHours < 100) {
        feedbackItems.push({
            text: `Leadership demonstrates initiative. You currently have ${leadershipHours}h. Aim for 100h+ in leadership roles.`,
            category: 'Leadership',
            icon: <Award className="w-3.5 h-3.5" />,
            color: 'text-brand-dark',
            borderColor: 'border-slate-300'
        });
    }

    if (uniqueCompetencies.size < 8) {
        feedbackItems.push({
            text: `Narrative is missing key AAMC pillars. Reflect on 'Teamwork' or 'Resilience' in your current drafts.`,
            category: 'Competencies',
            icon: <Brain className="w-3.5 h-3.5" />,
            color: 'text-purple-500',
            borderColor: 'border-purple-200'
        });
    }

    if (mmeCount < 3 && activeActivities.length >= 3) {
        feedbackItems.push({
            text: `Strategic Gap: You haven't designated 3 'Most Meaningful' experiences yet. This is critical for AMCAS.`,
            category: 'Strategy',
            icon: <Zap className="w-3.5 h-3.5" />,
            color: 'text-amber-600',
            borderColor: 'border-amber-300'
        });
    }

    const stats = {
        clinical: { val: clinicalHours, target: 150, label: 'Clinical (Total)' },
        medicalService: { val: medicalServiceHours, target: 100, label: 'Medical Vol.' },
        nonMedicalService: { val: nonMedicalServiceHours, target: 100, label: 'Non-Medical Vol.' },
        shadowing: { val: shadowingHours, target: 100, label: 'Physician Shadowing' },
        leadership: { val: leadershipHours, target: 100, label: 'Leadership' },
        research: { val: researchHours, target: 100, label: 'Research' },
        competencies: { val: uniqueCompetencies.size, target: 15, label: 'Competency Depth' }
    };

    return { score: normalizedScore, feedback: feedbackItems, level, stats, competencyCount: uniqueCompetencies.size };
};
