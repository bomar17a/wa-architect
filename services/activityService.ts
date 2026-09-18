
import { supabase } from './supabase';
import { Activity, ActivityStatus, DateRange } from '../types';

// Map Frontend (CamelCase) to DB (SnakeCase)
const toDb = (activity: Activity, userId: string) => {
    return {
        user_id: userId,
        id: activity.id,
        title: activity.title,
        organization: activity.organization,
        city: activity.city,
        state: activity.state || null,
        country: activity.country,
        experience_type: activity.experienceType,
        date_ranges: activity.dateRanges,
        contact_name: activity.contactName,
        contact_title: activity.contactTitle,
        contact_email: activity.contactEmail,
        contact_phone: activity.contactPhone,
        status: activity.status,
        is_most_meaningful: activity.isMostMeaningful,
        description: activity.description,
        mme_action: activity.mmeAction,
        mme_result: activity.mmeResult,
        mme_essay: activity.mmeEssay,
        mme_workshop: activity.mmeWorkshop ?? {},
        competencies: activity.competencies,
        due_date: activity.dueDate || null,
        sort_order: activity.sortOrder ?? null,
    };
};

// Map DB (SnakeCase) to Frontend (CamelCase)
const fromDb = (row: any): Activity => {
    return {
        id: row.id,
        title: row.title || '',
        organization: row.organization || '',
        city: row.city || '',
        state: row.state || '',
        country: row.country || '',
        experienceType: row.experience_type || '',
        dateRanges: (row.date_ranges as DateRange[]) || [],
        contactName: row.contact_name || '',
        contactTitle: row.contact_title || '',
        contactEmail: row.contact_email || '',
        contactPhone: row.contact_phone || '',
        status: (row.status as ActivityStatus) || ActivityStatus.EMPTY,
        isMostMeaningful: row.is_most_meaningful || false,
        description: row.description || '',
        mmeAction: row.mme_action || '',
        mmeResult: row.mme_result || '',
        mmeEssay: row.mme_essay || '',
        mmeWorkshop: row.mme_workshop ?? {},
        competencies: row.competencies || [],
        dueDate: row.due_date || undefined,
        sortOrder: row.sort_order ?? null,
    };
};

/** PostgREST reports an unknown column as PGRST204 and names it, quoted, in the message. */
export const isMissingColumn = (error: { code?: string; message?: string }, column: string) =>
    error.code === 'PGRST204' && (error.message || '').includes(`'${column}'`);

// Columns added after the table shipped, and the migration that adds each. Preview
// deploys share the production database, so the frontend can reach a database that
// does not have one yet. The entry is saved without it rather than failing the whole
// save, and the field is kept in memory.
const LATER_COLUMNS: Record<string, string> = {
    mme_workshop: '20260916120000_add_mme_workshop.sql',
    state: '20260919010000_applicant_residency_and_ties.sql',
};

export const activityService = {
    async fetchActivities() {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            // Explicit user-chosen order first; created_at only breaks ties for rows
            // that predate sort_order or were created in the same instant.
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(fromDb);
    },

    async saveActivity(activity: Activity) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        let payload: Record<string, unknown> = toDb(activity, user.id);
        const dropped = new Set<string>();

        for (;;) {
            const { data, error } = await supabase
                .from('activities')
                .upsert(payload)
                .select()
                .single();

            if (!error) {
                const saved = fromDb(data);
                if (dropped.has('mme_workshop')) saved.mmeWorkshop = activity.mmeWorkshop;
                if (dropped.has('state')) saved.state = activity.state;
                return saved;
            }

            const missing = Object.keys(LATER_COLUMNS).find(c => c in payload && isMissingColumn(error, c));
            if (!missing) throw error;
            console.warn(`activities.${missing} is missing; apply ${LATER_COLUMNS[missing]}`);
            const { [missing]: _omitted, ...rest } = payload;
            payload = rest;
            dropped.add(missing);
        }
    },

    /**
     * Persists a new display order. Writes only the rows whose position actually
     * changed, so dragging one card doesn't rewrite the whole list.
     */
    async reorderActivities(orderedIds: number[]) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const updates = orderedIds.map((id, index) => ({ id, sort_order: index }));
        const results = await Promise.all(
            updates.map(u =>
                supabase.from('activities')
                    .update({ sort_order: u.sort_order })
                    .eq('id', u.id)
            )
        );
        const failed = results.find(r => r.error);
        if (failed?.error) throw failed.error;
    },

    async deleteActivity(id: number) {
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
