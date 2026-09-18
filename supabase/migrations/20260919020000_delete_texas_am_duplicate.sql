-- medical_schools held two rows for Texas A&M. This one, "Texas A&M University School of
-- Medicine", carried a mission statement that reads as a model-written summary of the other
-- ("Texas A&M School of Medicine"), which keeps the verbatim text and the AAMC A-1 figures.
-- Most likely the original MSAR parse emitted the school twice.
--
-- Deleted on the user's go-ahead, 2026-09-18. Refuses to run while any profile targets it.
-- Idempotent: a second run deletes nothing.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE 'fdb6311c-4805-40cd-a0ba-31ad79453932' = ANY(target_school_ids)
  ) THEN
    RAISE EXCEPTION 'a profile still targets the duplicate Texas A&M row; move it to 87ef5d6a-1ac6-44b2-b80d-732a26f5ddf9 first';
  END IF;
END $$;

DELETE FROM public.medical_schools
WHERE id = 'fdb6311c-4805-40cd-a0ba-31ad79453932'
  AND school_name = 'Texas A&M University School of Medicine';
