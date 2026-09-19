-- The residency cycles the app actually uses: the latest three per school.
--
-- The School Recommender read every row of school_residency_stats with no limit and no order.
-- PostgREST caps a response at the project's max_rows (1,000 by default), and each AAMC A-1
-- cycle adds about 159 rows, so the seventh cycle seeded would cross it. Rows past the cap are
-- dropped without an error, and with no ORDER BY which ones is arbitrary: some schools would
-- lose their recent cycles, and the tercile cutoffs every school is banded against would move.
--
-- The app pools three cycles (POOLED_CYCLES in utils/residency.ts), so it only ever needs
-- three per school. Reading this view keeps the response at three times the number of schools
-- however many cycles are seeded. Keep the 3 below in step with POOLED_CYCLES.
--
-- security_invoker, so the RLS on school_residency_stats applies to whoever reads the view:
-- signed-in users see the figures, anonymous callers see nothing, as with the table.
--
-- Idempotent: safe to re-run.

CREATE OR REPLACE VIEW public.school_residency_recent
WITH (security_invoker = true) AS
SELECT school_id, cycle_year, applications, apps_in_state_pct, matriculants, mat_in_state_pct
FROM (
    SELECT s.*, row_number() OVER (PARTITION BY s.school_id ORDER BY s.cycle_year DESC) AS rn
    FROM public.school_residency_stats s
) ranked
WHERE rn <= 3;

-- Supabase grants new views to anon by default. RLS would already return it nothing; this
-- keeps the grants matching the table's policy.
REVOKE ALL ON public.school_residency_recent FROM anon;
GRANT SELECT ON public.school_residency_recent TO authenticated;
