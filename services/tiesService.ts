import { supabase } from './supabase';
import type { ApplicantTie, TieType } from '../types';
import { tieChanges } from '../utils/residency';

type TieRow = { state: string; tie_type: TieType };

const toRow = (t: ApplicantTie): TieRow => ({ state: t.state, tie_type: t.tieType });
const fromRow = (r: TieRow): ApplicantTie => ({ state: r.state, tieType: r.tie_type });

/**
 * PostgREST answers PGRST205 when a table is not in its schema cache, which is what a
 * preview deploy sees before 20260919010000_applicant_residency_and_ties.sql is applied.
 */
const isMissingTable = (error: { code?: string }) => error.code === 'PGRST205' || error.code === '42P01';

export const tiesService = {
    async fetchTies(): Promise<ApplicantTie[]> {
        const { data, error } = await supabase
            .from('applicant_ties')
            .select('state, tie_type')
            .order('created_at', { ascending: true });
        if (error) {
            if (isMissingTable(error)) {
                console.warn('applicant_ties is missing; apply 20260919010000_applicant_residency_and_ties.sql');
                return [];
            }
            throw error;
        }
        return (data || []).map(fromRow);
    },

    /**
     * Saves the ties the user added or removed since `loaded`, in one transaction, and
     * returns what is stored. Null when nothing changed. Diffing against `loaded` rather
     * than the database is what keeps a form that failed to load from deleting ties.
     */
    async saveTies(next: ApplicantTie[], loaded: ApplicantTie[]): Promise<ApplicantTie[] | null> {
        const { add, remove } = tieChanges(next, loaded);
        if (!add.length && !remove.length) return null;

        const { data, error } = await supabase.rpc('apply_tie_changes', {
            p_add: add.map(toRow),
            p_remove: remove.map(toRow),
        });
        if (error) {
            // PGRST202: PostgREST has no function by that name.
            if (error.code === 'PGRST202') console.warn('apply_tie_changes is missing; apply 20260920000000_apply_tie_changes.sql');
            throw error;
        }
        return ((data as TieRow[] | null) || []).map(fromRow);
    },
};
