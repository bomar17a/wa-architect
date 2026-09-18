import { supabase } from './supabase';
import type { ApplicantTie, TieType } from '../types';

const key = (t: ApplicantTie) => `${t.state}:${t.tieType}`;

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
        return (data || []).map(r => ({ state: r.state as string, tieType: r.tie_type as TieType }));
    },

    /** Makes the stored ties equal `next`, touching only the rows that changed. */
    async saveTies(next: ApplicantTie[]): Promise<ApplicantTie[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const current = await this.fetchTies();
        const wanted = new Map(next.map(t => [key(t), t]));
        const have = new Set(current.map(key));

        for (const t of current.filter(t => !wanted.has(key(t)))) {
            const { error } = await supabase
                .from('applicant_ties')
                .delete()
                .eq('state', t.state)
                .eq('tie_type', t.tieType);
            if (error) throw error;
        }

        const added = [...wanted.values()].filter(t => !have.has(key(t)));
        if (added.length) {
            const { error } = await supabase
                .from('applicant_ties')
                .insert(added.map(t => ({ user_id: user.id, state: t.state, tie_type: t.tieType })));
            if (error) throw error;
        }
        return [...wanted.values()];
    },
};
