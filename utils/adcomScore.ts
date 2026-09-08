import type { Activity } from '../types';
import {
    computeCompetency,
    computeCompleteness,
    type PillarScores,
    type Completeness,
    type Pillar,
} from './missionFit.ts';

// The numeric half of the readiness score. Kept free of React so the calibration
// harness (scripts/calibrate-scoring.ts) can run it directly under Node.
// utils/scoring.tsx wraps this and attaches icons for the dashboard.

export type FeedbackTone = 'volume' | 'clinical' | 'medService' | 'nonMedService'
                         | 'shadowing' | 'leadership' | 'competencies' | 'strategy';

export interface FeedbackItem {
    text: string;
    category: string;
    tone: FeedbackTone;
}

export interface StatLine {
    val: number;
    target: number;
    label: string;
}

export interface AdComResult {
    score: number;
    level: 'Foundation' | 'Building' | 'Competitive' | 'Exceptional';
    feedback: FeedbackItem[];
    stats: Record<string, StatLine>;
    competencyCount: number;
    pillarScores: PillarScores;
    pillarHours: PillarScores;
    completeness: Completeness;
}

// Weighting: the four pillars carry 70 of the 100 points, because they measure
// substance (hours, depth, distinct evidence). The remaining 30 come from bonuses
// that largely measure diligence in filling out the form — real signal, but it
// must not outweigh what the applicant actually did.
const PILLAR_WEIGHT = 7;      // pillar average (0–10) → 0–70
const MAX_VOLUME_BONUS = 10;
const MAX_COMPETENCY_BONUS = 10;
const MME_BONUS_EACH = 2;
const MAX_MME_BONUS = 6;
const MAX_POLISH_BONUS = 4;

const TIERS: [number, AdComResult['level']][] = [
    [90, 'Exceptional'],
    [70, 'Competitive'],
    [40, 'Building'],
    [0, 'Foundation'],
];

export const calculateAdComScore = (activities: Activity[]): AdComResult => {
    const activeActivities = activities.filter(a => a.status !== 'Empty');

    // The shared competency engine is the single source of truth for hours and
    // pillar scores — it applies the anticipated-hours discount and the hours
    // guard, which a second local tally here would silently skip.
    const { scores: pillarScores, hours: pillarHours } = computeCompetency(activities);
    const completeness = computeCompleteness(activities);

    let shadowingHours = 0;
    let medicalServiceHours = 0;
    let nonMedicalServiceHours = 0;
    let leadershipHours = 0;
    let handsOnClinicalHours = 0;
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

        const isExplicitLeadership =
            type === 'Leadership - Not Listed Elsewhere' ||
            type === 'Leadership Experience' ||
            type === 'Military Service';

        const hasLeadershipKeywords =
            desc.includes('captain') || desc.includes('president') ||
            desc.includes('chair') || desc.includes('founded') ||
            desc.includes('managed') || desc.includes('director') || desc.includes('led');

        if (isHandsOnClinical || isMedicalVolunteer) handsOnClinicalHours += hours;
        if (isMedicalVolunteer) medicalServiceHours += hours;
        if (isNonMedService) nonMedicalServiceHours += hours;
        if (isShadowing) shadowingHours += hours;
        if (isExplicitLeadership || hasLeadershipKeywords) leadershipHours += hours;

        // Competency Superficiality Guard: require depth (>= 50h) and cap at 3 per activity
        if (hours >= 50) {
            a.competencies?.slice(0, 3).forEach(c => uniqueCompetencies.add(c));
        }
    });

    const pillarAvg = (pillarScores.Inquiry + pillarScores.Service + pillarScores.Teamwork + pillarScores.Clinical) / 4;
    let score = Math.round(pillarAvg * PILLAR_WEIGHT);

    score += Math.min(MAX_VOLUME_BONUS, activeActivities.length);
    score += Math.min(MAX_COMPETENCY_BONUS, uniqueCompetencies.size);
    score += Math.min(MAX_MME_BONUS, mmeCount * MME_BONUS_EACH);

    const finalCount = activeActivities.filter(a => a.status === 'Final' || a.status === 'Polished').length;
    score += Math.min(MAX_POLISH_BONUS, Math.round(finalCount * 0.5));

    // Breadth multiplier: AdComs read 10–15 entries, and a handful of strong
    // activities is not the same application as a full one.
    let breadthMultiplier = 1.0;
    if (activeActivities.length < 5) breadthMultiplier = 0.5;
    else if (activeActivities.length < 8) breadthMultiplier = 0.7;
    else if (activeActivities.length < 10) breadthMultiplier = 0.85;

    score = Math.round(score * breadthMultiplier);
    const normalizedScore = Math.max(0, Math.min(100, score));

    const level = TIERS.find(([floor]) => normalizedScore >= floor)![1];

    const feedback: FeedbackItem[] = [];

    if (activeActivities.length < 15) {
        feedback.push({
            text: `You have filled ${activeActivities.length} of 15 slots. Most admitted applicants use 10 to 15 — the empty ones are narrative space you are giving up.`,
            category: 'Volume',
            tone: 'volume',
        });
    }

    if (handsOnClinicalHours < 300) {
        feedback.push({
            text: `Clinical hours are at ${handsOnClinicalHours}h, excluding shadowing. Competitive applicants land between 300 and 500. Scribing and patient intake volunteering are the usual ways to close this.`,
            category: 'Clinical Gap',
            tone: 'clinical',
        });
    }

    if (medicalServiceHours < 100) {
        feedback.push({
            text: `Medical volunteering sits at ${medicalServiceHours}h. Aim for 100h or more — it is where schools look for altruism inside a clinical setting.`,
            category: 'Med. Service',
            tone: 'medService',
        });
    }

    if (nonMedicalServiceHours < 100) {
        feedback.push({
            text: `Non-clinical service is at ${nonMedicalServiceHours}h. The median matriculant logs 100 to 150, and it is what shows service is a habit rather than a checkbox.`,
            category: 'Non-Med Service',
            tone: 'nonMedService',
        });
    }

    if (shadowingHours < 50) {
        feedback.push({
            text: `Shadowing is at ${shadowingHours}h. Around 50 across two or three specialties is the working minimum; past 100 it stops adding much.`,
            category: 'Shadowing',
            tone: 'shadowing',
        });
    }

    if (leadershipHours < 100) {
        feedback.push({
            text: `Leadership is at ${leadershipHours}h. Aim for 100h or more in roles where you were responsible for an outcome, not only present for one.`,
            category: 'Leadership',
            tone: 'leadership',
        });
    }

    if (uniqueCompetencies.size < 8) {
        feedback.push({
            text: `Your entries evidence ${uniqueCompetencies.size} of the 15 AAMC competencies. Look for drafts where you could show Teamwork or Resilience without inventing anything.`,
            category: 'Competencies',
            tone: 'competencies',
        });
    }

    if (mmeCount < 3 && activeActivities.length >= 3) {
        feedback.push({
            text: `You have designated ${mmeCount} of 3 Most Meaningful experiences. Each one buys you 1,325 extra characters to make a case. Skip this if you are applying DO only.`,
            category: 'Strategy',
            tone: 'strategy',
        });
    }

    const stats: Record<string, StatLine> = {
        clinical: { val: Math.round(pillarHours.Clinical), target: 400, label: 'Clinical (Hands-On)' },
        medicalService: { val: medicalServiceHours, target: 100, label: 'Medical Vol.' },
        nonMedicalService: { val: nonMedicalServiceHours, target: 150, label: 'Non-Medical Vol.' },
        shadowing: { val: shadowingHours, target: 50, label: 'Physician Shadowing' },
        leadership: { val: leadershipHours, target: 100, label: 'Leadership' },
        research: { val: Math.round(pillarHours.Inquiry), target: 400, label: 'Research' },
        competencies: { val: uniqueCompetencies.size, target: 15, label: 'Competency Depth' },
    };

    return {
        score: normalizedScore,
        level,
        feedback,
        stats,
        competencyCount: uniqueCompetencies.size,
        pillarScores,
        pillarHours,
        completeness,
    };
};

export type { Pillar, PillarScores, Completeness };
