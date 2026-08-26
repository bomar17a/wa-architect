-- activities.user_id was created without ON DELETE CASCADE, so deleting a user
-- who has any activities failed with a foreign-key violation. That meant account
-- deletion (including a GDPR/erasure request) would fail for exactly the users who
-- had used the product. profiles already cascaded correctly; activities did not.
--
-- Found while running the authenticated smoke test: deleting the throwaway QA user
-- returned a 500 because it owned one activity row.
--
-- Idempotent: drops the old constraint by name if present, then re-adds with CASCADE.

ALTER TABLE public.activities
    DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

ALTER TABLE public.activities
    ADD CONSTRAINT activities_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
