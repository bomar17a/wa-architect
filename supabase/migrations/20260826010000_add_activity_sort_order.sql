-- Explicit display order for activities.
-- Until now the list was ordered by created_at DESC, so a user could not choose
-- the order AdComs read their entries in. Drag-to-reorder needs a real column.
--
-- Idempotent: safe to re-run.

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Backfill existing rows with their CURRENT on-screen order (created_at DESC),
-- so enabling this feature does not visibly reshuffle anyone's list.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS rn
    FROM public.activities
)
UPDATE public.activities a
SET sort_order = r.rn
FROM ranked r
WHERE a.id = r.id AND a.sort_order IS NULL;

-- Ordering is always scoped to a single user's rows.
CREATE INDEX IF NOT EXISTS activities_user_sort_idx
    ON public.activities (user_id, sort_order);
