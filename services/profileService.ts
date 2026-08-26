import { supabase } from './supabase';
import { Profile, ApplicationType } from '../types';

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
    return row;
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

        const { data, error } = await supabase
            .from('profiles')
            .upsert({ id: user.id, ...toDb(patch) })
            .select()
            .single();

        if (error) throw error;
        return fromDb(data);
    },
};
