import React from 'react';
import { Activity, ActivityStatus } from '../types';
import { computeCompetencyScores, milestone } from '../components/MissionFitRadar';
import {
    Briefcase, AlertTriangle, Heart, Users, Target, Award, Brain, Zap
} from 'lucide-react';

export const calculateAdComScore = (activities: Activity[]) => {
    const activeActivities = activities.filter(a => a.status !== ActivityStatus.EMPTY);

    // ── Use the shared competency engine as the source of truth ──
    const pillarScores = computeCompetencyScores(activities);

    // ── AdCom-specific accumulators (for feedback thresholds only) ──
    let clinicalHours = 0;
    let shadowingHours = 0;
    let researchHours = 0;
    let medicalServiceHours = 0;
    let nonMedicalServiceHours = 0;
    let leadershipHours = 0;
    let mmeCount = 0;

    const uniqueCompetencies = new Set<string>();

    activeActivities.forEach(a => {
        if (a.isMostMeaningful) mmeCount++;

        const hours = a.dateRanges.reduce((acc, r) => acc + (parseInt(r.hours) || 0), 0);
        const type = a.experienceType;
        const desc = [a.description, a.mmeEssay, a.mmeAction, a.mmeResult].filter(Boolean).join(' ').toLowerCase();

        const isHandsOnClinical = 
          type === 'Paid Employment - Medical/Clinical' || 
          type === 'Healthcare Experience';
        const isMedicalVolunteer = 
          type === 'Community Service/Volunteer - Medical/Clinical';
        const isShadowing = 
          type === 'Physician Shadowing/Clinical Observation';
        const isNonMedService = 
          type === 'Community Service/Volunteer - Not Medical/Clinical' || 
          type === 'Non-Healthcare Volunteer';
        const isResearch = 
          type === 'Research/Lab' || type === 'Research';
        
        // Leadership tracking
        const isExplicitLeadership = 
          type === 'Leadership - Not Listed Elsewhere' || 
          type === 'Leadership Experience' ||
          type === 'Military Service';
          
        const hasLeadershipKeywords = 
          desc.includes('captain') || desc.includes('president') || 
          desc.includes('chair') || desc.includes('founded') || 
          desc.includes('managed') || desc.includes('director') || desc.includes('led');

        if (isHandsOnClinical || isMedicalVolunteer) clinicalHours += hours;
        if (isMedicalVolunteer) medicalServiceHours += hours;
        if (isNonMedService) nonMedicalServiceHours += hours;
        if (isShadowing) shadowingHours += hours;
        if (isResearch) researchHours += hours;
        if (isExplicitLeadership || hasLeadershipKeywords) leadershipHours += hours;

        // Competency Superficiality Guard: Require depth (>= 50h) and cap at 3 per activity
        if (hours >= 50) {
            a.competencies?.slice(0, 3).forEach(c => uniqueCompetencies.add(c));
        }
    });

    // ── Derive the AdCom score from pillar scores ──────────────────
    // Each pillar is 0–10; average them and scale to 0–60 (60% of total)
    const pillarAvg = (pillarScores.Inquiry + pillarScores.Service + pillarScores.Teamwork + pillarScores.Clinical) / 4;
    let score = Math.round(pillarAvg * 6); // 0–60

    // Activity Volume Bonus (Max 15 pts)
    score += Math.min(15, activeActivities.length);

    // Competency Saturation Bonus (Max 15 pts)
    const saturationBonus = Math.min(15, uniqueCompetencies.size);
    score += saturationBonus;

    // MME Designation Bonus (Max 12 pts — 4 per MME)
    score += Math.min(12, mmeCount * 4);

    // Narrative Polish Bonus (up to 5 pts)
    const finalCount = activeActivities.filter(a => a.status === ActivityStatus.FINAL || a.status === ActivityStatus.REFINED).length;
    score += Math.min(5, Math.round(finalCount * 0.5));

    // ── Breadth Multiplier (AdCom expects ~10-15 activities) ──
    let breadthMultiplier = 1.0;
    if (activeActivities.length < 5) breadthMultiplier = 0.5;
    else if (activeActivities.length < 8) breadthMultiplier = 0.7;
    else if (activeActivities.length < 10) breadthMultiplier = 0.85;

    score = Math.round(score * breadthMultiplier);

    const normalizedScore = Math.min(100, score);

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

    if (clinicalHours < 300) {
        feedbackItems.push({
            text: `Clinical hours are at ${clinicalHours}h (excluding shadowing). Targeted goal is 300h+. Consider scribing or patient intake volunteering.`,
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

    if (shadowingHours < 50) {
        feedbackItems.push({
            text: `Shadowing is low (${shadowingHours}h). Aim for at least 50h across multiple specialties to demonstrate informed career choice.`,
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
            text: `Strategic Gap: You haven't designated 3 'Most Meaningful' experiences yet. This is critical for AMCAS (ignore if DO/AACOMAS exclusively).`,
            category: 'Strategy',
            icon: <Zap className="w-3.5 h-3.5" />,
            color: 'text-amber-600',
            borderColor: 'border-amber-300'
        });
    }

    const stats = {
        clinical: { val: clinicalHours, target: 300, label: 'Clinical (Hands-On)' },
        medicalService: { val: medicalServiceHours, target: 100, label: 'Medical Vol.' },
        nonMedicalService: { val: nonMedicalServiceHours, target: 100, label: 'Non-Medical Vol.' },
        shadowing: { val: shadowingHours, target: 50, label: 'Physician Shadowing' },
        leadership: { val: leadershipHours, target: 100, label: 'Leadership' },
        research: { val: researchHours, target: 100, label: 'Research' },
        competencies: { val: uniqueCompetencies.size, target: 15, label: 'Competency Depth' }
    };

    return { score: normalizedScore, feedback: feedbackItems, level, stats, competencyCount: uniqueCompetencies.size, pillarScores };
};
