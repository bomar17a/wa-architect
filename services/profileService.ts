import { supabase } from './supabase';
import { Profile, ApplicationType } from '../types';
import { isMissingColumn } from './activityService';

const fromDb = (row: any): Profile => ({
    id: row.id,
    onboarded: row.onboarded ?? false,
    applicationType: (row.application_type as ApplicationType) ?? null,
    cycleYear: row.cycle_year ?? null,
    schoolTier: row.school_tier ?? null,
    gpaRange: row.gpa_range ?? null,
    mcatRange: row.mcat_range ?? null,
    northStarArchetypes: row.north_star_archetypes ?? [],
    targetSchoolIds: row.target_school_ids ?? [],
    psSummary: row.ps_summary ?? null,
    legalResidenceState: row.legal_residence_state ?? null,
    residencyStatus: row.residency_status ?? null,
});

// Only maps keys actually present in the patch, so a partial update never
// blanks out columns the caller didn't mention.
const toDb = (patch: Partial<Profile>) => {
    const row: Record<string, unknown> = {};
    if ('onboarded' in patch) row.onboarded = patch.onboarded;
    if ('applicationType' in patch) row.application_type = patch.applicationType;
    if ('cycleYear' in patch) row.cycle_year = patch.cycleYear;
    if ('schoolTier' in patch) row.school_tier = patch.schoolTier;
    if ('gpaRange' in patch) row.gpa_range = patch.gpaRange;
    if ('mcatRange' in patch) row.mcat_range = patch.mcatRange;
    if ('northStarArchetypes' in patch) row.north_star_archetypes = patch.northStarArchetypes;
    if ('targetSchoolIds' in patch) row.target_school_ids = patch.targetSchoolIds;
    if ('psSummary' in patch) row.ps_summary = patch.psSummary;
    if ('legalResidenceState' in patch) row.legal_residence_state = patch.legalResidenceState;
    if ('residencyStatus' in patch) row.residency_status = patch.residencyStatus;
    return row;
};

// Columns added after the table shipped. A preview deploy can reach the production
// database before the migration does; onboarding should still save everything else.
const LATER_COLUMNS: Record<string, string> = {
    legal_residence_state: '20260919010000_applicant_residency_and_ties.sql',
    residency_status: '20260919010000_applicant_residency_and_ties.sql',
};

export const profileService = {
    /** Returns null when the user has no profile row yet (i.e. never onboarded). */
    async fetchProfile(): Promise<Profile | null> {
        const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
        if (error) throw error;
        return data ? fromDb(data) : null;
    },

    async upsertProfile(patch: Partial<Profile>): Promise<Profile> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let row: Record<string, unknown> = { id: user.id, ...toDb(patch) };
        const dropped: Partial<Profile> = {};

        for (;;) {
            const { data, error } = await supabase
                .from('profiles')
                .upsert(row)
                .select()
                .single();

            if (!error) return { ...fromDb(data), ...dropped };

            const missing = Object.keys(LATER_COLUMNS).find(c => c in row && isMissingColumn(error, c));
            if (!missing) throw error;
            console.warn(`profiles.${missing} is missing; apply ${LATER_COLUMNS[missing]}`);
            const { [missing]: _omitted, ...rest } = row;
            row = rest;
            if (missing === 'legal_residence_state') dropped.legalResidenceState = patch.legalResidenceState;
            if (missing === 'residency_status') dropped.residencyStatus = patch.residencyStatus;
        }
    },
};
