-- A daily ceiling on AI calls per user.
--
-- gemini-ai checked only that a request carried a real user's token. The aiCache that saves
-- repeat calls lives in the browser, and anyone signed up can POST to the function directly,
-- so one account could loop calls at gemini-2.5-flash with no ceiling on cost, and drain the
-- project's shared Gemini quota for everyone else.
--
-- ai_usage             one row per user per UTC day: how many calls reached the model.
-- consume_ai_call()    counts a call and returns true, or returns NULL once the user is at
--                      the limit. One statement, so two concurrent calls cannot both take
--                      the last slot. The edge function passes the limit (DAILY_AI_CALLS).
--
-- Only the edge function touches either, as service_role. RLS is on with no policies and
-- the grants are revoked, so no signed-in user can read, reset, or spend someone else's count.
-- Rows cascade on user delete like the rest of a user's data.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.ai_usage (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0),
    PRIMARY KEY (user_id, day)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_ai_call(p_user UUID, p_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
    INSERT INTO public.ai_usage AS u (user_id, day, calls)
    VALUES (p_user, (now() AT TIME ZONE 'utc')::date, 1)
    ON CONFLICT (user_id, day) DO UPDATE SET calls = u.calls + 1
        WHERE u.calls < p_limit
    RETURNING true;
$$;

-- Supabase grants EXECUTE on new public functions to anon and authenticated by default.
-- Either could otherwise spend another user's allowance by passing their id.
REVOKE ALL ON FUNCTION public.consume_ai_call(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_call(UUID, INTEGER) TO service_role;
