import { Activity, ActivityStatus } from '../types';
import { calcDurationMonths } from '../components/MissionFitRadar';

export interface RedFlag {
    id: string;
    title: string;
    message: string;
}

// Matches MissionFitRadar's client-side "Impossible Hours Guard" cap (~80 hrs/week).
const MAX_HOURS_PER_MONTH = 340;

const HANDS_ON_CLINICAL_TYPES = [
    'Paid Employment - Medical/Clinical',
    'Healthcare Experience',
    'Community Service/Volunteer - Medical/Clinical',
];

const CLINICAL_OR_SHADOWING_TYPES = [
    ...HANDS_ON_CLINICAL_TYPES,
    'Physician Shadowing/Clinical Observation',
];

const HIGH_STATUS_TYPES = [
    'Research/Lab', 'Research', 'Publications', 'Presentations/Posters',
    'Honors/Awards/Recognitions', 'Achievements',
];

// Common tells of unedited AI-generated prose in personal statements / activity descriptions.
const AI_TELL_PHRASES = [
    'furthermore', 'moreover', 'it is important to note', 'in conclusion',
    "in today's society", 'delve into', 'tapestry', 'testament to',
    'plays a pivotal role', 'plays a crucial role', 'underscores the',
    'in the realm of', 'navigate the complexities', 'a myriad of', 'boasts a',
];

const getActivityHours = (a: Activity): number =>
    a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0);

const activityLabel = (a: Activity) => a.title || 'Untitled activity';

/**
 * Client-side, non-blocking audit of common AdCom red flags.
 * Runs against a full activity list (Dashboard) or a single activity (Editor).
 */
export function runRedFlagAudit(activities: Activity[]): RedFlag[] {
    const flags: RedFlag[] = [];
    const filled = activities.filter(a => a.status !== ActivityStatus.EMPTY && a.experienceType);

    // 1. Impossible Hours Guard — surfaced as an actual message, not just a silent score cap.
    filled.forEach(a => {
        const hours = getActivityHours(a);
        const months = Math.max(1, calcDurationMonths(a.dateRanges));
        if (hours > months * MAX_HOURS_PER_MONTH) {
            const perMonth = Math.round(hours / months);
            flags.push({
                id: `hours-${a.id}`,
                title: 'Hours may look implausible',
                message: `"${activityLabel(a)}" reports ${hours} hours over ~${months} month${months === 1 ? '' : 's'} (~${perMonth}/month, well past a full-time course load). AdComs notice entries like this — double-check the total before submitting.`,
            });
        }
    });

    // 2. Shadowing Overload — heavy observation with no hands-on / direct patient care.
    const shadowingHours = filled
        .filter(a => a.experienceType === 'Physician Shadowing/Clinical Observation')
        .reduce((sum, a) => sum + getActivityHours(a), 0);
    const hasHandsOnClinical = filled.some(a => HANDS_ON_CLINICAL_TYPES.includes(a.experienceType));
    if (shadowingHours > 200 && !hasHandsOnClinical) {
        flags.push({
            id: 'shadowing-overload',
            title: 'Shadowing-heavy, no direct patient care',
            message: `You've logged ${shadowingHours} hours of shadowing but no hands-on clinical or medical-volunteering entry. AdComs weight direct patient interaction far more than observation — consider adding a scribing, CNA, EMT, or clinical volunteering role.`,
        });
    }

    // 3. Short-term Pattern — several commitments under 3 months.
    const shortTerm = filled.filter(a => {
        const months = calcDurationMonths(a.dateRanges);
        return months > 0 && months < 3;
    });
    if (shortTerm.length >= 3) {
        flags.push({
            id: 'short-term-pattern',
            title: 'Several very short commitments',
            message: `${shortTerm.length} activities (${shortTerm.map(activityLabel).join(', ')}) each span under 3 months. A pattern of short stints can read as difficulty sustaining long-term responsibility — consider consolidating, extending, or trimming one.`,
        });
    }

    // 4. Clinical Gap — a substantial activity list with no clinical exposure at all.
    const hasClinical = filled.some(a => CLINICAL_OR_SHADOWING_TYPES.includes(a.experienceType));
    if (filled.length >= 8 && !hasClinical) {
        flags.push({
            id: 'clinical-gap',
            title: 'No clinical exposure yet',
            message: `You've filled ${filled.length} activity slots with no clinical, shadowing, or healthcare entry. Every competitive application shows sustained direct or observed patient contact — worth prioritizing before you submit.`,
        });
    }

    // 5. MME Selection Quality — every MME is a prestige/status entry, not a "moment" entry.
    const mmeActivities = filled.filter(a => a.isMostMeaningful);
    const highStatusMmes = mmeActivities.filter(a => HIGH_STATUS_TYPES.includes(a.experienceType));
    if (mmeActivities.length >= 2 && highStatusMmes.length === mmeActivities.length) {
        flags.push({
            id: 'mme-status-bias',
            title: 'MMEs skew toward prestige over meaning',
            message: `All of your Most Meaningful Experiences (${mmeActivities.map(activityLabel).join(', ')}) are research, publication, or award-type entries. MME should mark the moments that changed your perspective, not just your most impressive lines — make sure at least one reflects a genuine personal turning point.`,
        });
    }

    // 6. AI Prose Detector — common unedited-LLM phrases in description / MME essay.
    filled.forEach(a => {
        const text = [a.description, a.mmeEssay].filter(Boolean).join(' ').toLowerCase();
        const hits = AI_TELL_PHRASES.filter(p => text.includes(p));
        if (hits.length > 0) {
            flags.push({
                id: `ai-prose-${a.id}`,
                title: 'Possible AI-sounding phrasing',
                message: `"${activityLabel(a)}" contains phrase${hits.length > 1 ? 's' : ''} common in unedited AI writing (${hits.map(h => `"${h}"`).join(', ')}). AdComs are trained to spot this — rewrite it in your own voice.`,
            });
        }
    });

    return flags;
}
