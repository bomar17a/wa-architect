-- One Settings save of applicant_ties, as one transaction.
--
-- tiesService.saveTies used to make the table equal whatever list the form held: it read
-- the stored ties, deleted every row missing from that list, then inserted the new ones,
-- one request each. Two things went wrong with that:
--
--   - When the ties failed to load, the form held an empty list, so the next save (even
--     one that only changed legal residence) deleted every tie the user had.
--   - The deletes and the insert were separate requests. A dropped connection left some
--     done and some not, and two saves at once collided on the unique key.
--
-- apply_tie_changes takes only what the user changed since the form loaded: the ties
-- they added and the ones they removed. A form that loaded nothing can add but never
-- remove. Adding a tie that is already stored is a no-op.
--
-- SECURITY INVOKER, so the applicant_ties RLS policies still apply; the user_id filters
-- below repeat them rather than rely on them alone.
--
-- Idempotent: safe to re-run.

CREATE OR REPLACE FUNCTION public.apply_tie_changes(p_add JSONB, p_remove JSONB)
RETURNS SETOF public.applicant_ties
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.applicant_ties t
    USING jsonb_to_recordset(COALESCE(p_remove, '[]'::jsonb)) AS r(state TEXT, tie_type TEXT)
    WHERE t.user_id = auth.uid() AND t.state = r.state AND t.tie_type = r.tie_type;

    INSERT INTO public.applicant_ties (user_id, state, tie_type)
    SELECT auth.uid(), a.state, a.tie_type
    FROM jsonb_to_recordset(COALESCE(p_add, '[]'::jsonb)) AS a(state TEXT, tie_type TEXT)
    ON CONFLICT (user_id, state, tie_type) DO NOTHING;

    RETURN QUERY
        SELECT * FROM public.applicant_ties WHERE user_id = auth.uid() ORDER BY created_at, id;
END;
$$;

-- Supabase grants EXECUTE on new public functions to anon by default.
REVOKE ALL ON FUNCTION public.apply_tie_changes(JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_tie_changes(JSONB, JSONB) TO authenticated;
