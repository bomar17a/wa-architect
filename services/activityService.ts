
import { supabase } from './supabase';
import { Activity, ActivityStatus, DateRange } from '../types';

// Map Frontend (CamelCase) to DB (SnakeCase)
const toDb = (activity: Activity, userId: string) => {
    return {
        user_id: userId,
        // id is auto-generated on insert, or present on update. 
        // We might need to handle the case where ID is temporary (timestamp based) vs real DB ID.
        // For simplicity, if ID is < 1000000000, it's likely a timestamp, but let's rely on upsert returning the real ID.
        // Actually, for new activities, we shouldn't send an ID if it's a placeholder.
        // But our app uses Date.now() for IDs.
        // Strategy: Use the Date.now() ID as a client-side ID, but let Supabase assign a real BigInt ID?
        // Or just use the Date.now() ID if it fits in BigInt? Date.now() is ~1.7e12, BigInt max is 9e18. So it fits.
        // We can basically use the client-generated ID for now, or let DB handle it.
        // Let's try to preserve the ID if it exists and is valid.
        id: activity.id,
        title: activity.title,
        organization: activity.organization,
        city: activity.city,
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
        competencies: activity.competencies,
        due_date: activity.dueDate || null,
    };
};

// Map DB (SnakeCase) to Frontend (CamelCase)
const fromDb = (row: any): Activity => {
    return {
        id: row.id,
        title: row.title || '',
        organization: row.organization || '',
        city: row.city || '',
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
        competencies: row.competencies || [],
        dueDate: row.due_date || undefined,
    };
};

export const activityService = {
    async fetchActivities() {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false }); // Sort by newest first? Or maybe we want a specific order.

        if (error) throw error;
        return (data || []).map(fromDb);
    },

    async saveActivity(activity: Activity) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const payload = toDb(activity, user.id);

        // Remove ID if it's falsy (0) to let DB generate it, but our app uses Date.now().
        // We will pass the ID. If it conflicts, we handle it.

        const { data, error } = await supabase
            .from('activities')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return fromDb(data);
    },

    async deleteActivity(id: number) {
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
