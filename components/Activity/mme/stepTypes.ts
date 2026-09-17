import type { Activity, MmeWorkshop } from '../../../types';
import type { WorkshopStep } from '../../../services/mmeCoachService';

export interface StepProps {
    /** The entry being edited, with its latest unsaved changes. */
    activity: Activity;
    /** The workshop state, with notes seeded from the legacy fields. */
    workshop: MmeWorkshop;
    updateWorkshop: (patch: Partial<MmeWorkshop>) => void;
    /** The whole activity list, with this entry's latest changes substituted in. */
    activities: Activity[];
    psSummary: string | null;
    goTo: (step: WorkshopStep) => void;
}

export const STEP_LABELS: Record<WorkshopStep, string> = {
    choose: 'Is it one of your three?',
    moment: 'Find the moment',
    plan: 'Plan',
    write: 'Write',
    final: 'Final check',
};

export const STEP_ORDER: WorkshopStep[] = ['choose', 'moment', 'plan', 'write', 'final'];
