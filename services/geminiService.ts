
import { supabase, supabaseAnonKey } from "./supabase.ts";
import { readCache, writeCache, invalidate } from "./aiCache.ts";
import { sanitizeReview, type RawReview } from "./mmeReviewFilter.ts";
import { scoreMmeQuality } from "./narrativeQualityService.ts";
import { Activity, RewriteType, ArchitectAnalysis, InterviewQuestion, StoryAnalysis, SchoolAlignment, AiNarrativeQuality, MmeWorkshop, MmeReview } from "../types.ts";
import { DESC_LIMITS, MME_LIMIT, AAMC_CORE_COMPETENCIES } from "../constants.ts";

export const checkUserAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('AUTH_REQUIRED');
  }
  return session;
};

const throwIfEdgeFunctionError = async (error: any) => {
  if (!error) return;

  if (error.context && typeof error.context.text === 'function') {
    const text = await error.context.text();
    let message: unknown;
    try {
      message = JSON.parse(text)?.error;
    } catch { /* not the function's JSON: a gateway page or platform error text */ }
    // Only the function's own { error } sentence reaches the toast. Anything else would be
    // shown raw, so it is logged and replaced.
    if (typeof message === 'string' && message) throw new Error(message);
    console.error(`AI service error ${error.context.status}:`, text);
    throw new Error('The AI service returned an error. Try again in a minute.');
  }
  throw error;
};

/**
 * Calls the gemini-ai edge function via raw fetch() so we fully control headers.
 *
 * Auth strategy (two-layer):
 *   1. Authorization: Bearer <anonKey>  — satisfies Supabase's API gateway
 *   2. x-user-token: <access_token>     — verified inside the edge function via
 *      JWT_SECRET, proving the caller is a real, non-expired logged-in user.
 */
// Longer than the edge function's own 90-second model timeout plus its retries' backoff, so
// the function's answer (including its timeout sentence) normally arrives first. This only
// ends a request the function never answers.
const REQUEST_TIMEOUT_MS = 120_000;

const invokeEdgeFunction = async (
  body: { action: string; payload: any },
  opts: { force?: boolean } = {},
): Promise<{ data: any; error: any }> => {
  const EDGE_FUNCTION_URL =
    'https://jitzwwxsnpylaistotgq.supabase.co/functions/v1/gemini-ai';

  // Get the live session — throws AUTH_REQUIRED if logged out
  const session = await checkUserAuth();
  const userId = session.user?.id ?? 'anon';

  // Identical input has already been paid for. Cached per user, so results are
  // never served across accounts on a shared browser.
  if (opts.force) {
    invalidate(body.action, body.payload, userId);
  } else {
    const cached = readCache<any>(body.action, body.payload, userId);
    if (cached !== null) return { data: cached, error: null };
  }

  let response: Response;
  try {
    response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Anon key for the Supabase gateway (never expires)
        Authorization: `Bearer ${supabaseAnonKey}`,
        // User's live JWT — verified inside the edge function
        'x-user-token': session.access_token,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (networkError: any) {
    console.error('AI request did not complete:', networkError);
    return {
      data: null,
      error: new Error(networkError?.name === 'TimeoutError'
        ? 'The AI took too long to answer. Try again.'
        : "Couldn't reach the AI service. Check your connection and try again."),
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    const err: any = new Error(`Edge function error: ${response.status}`);
    err.context = {
      text: () => Promise.resolve(errorText),
      status: response.status,
    };
    return { data: null, error: err };
  }

  let data: any;
  try {
    data = await response.json();
  } catch (readError) {
    console.error('AI response was not readable JSON:', readError);
    return { data: null, error: new Error("The AI's answer came back incomplete. Try again.") };
  }
  writeCache(body.action, body.payload, userId, data);
  return { data, error: null };
};

export const getDraftAnalysis = async (draft: string, limit: number, experienceType?: string): Promise<ArchitectAnalysis> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'draft-analysis',
      payload: { draft, limit, experienceType }
    });

    await throwIfEdgeFunctionError(error);
    return data as ArchitectAnalysis;
  } catch (error) {
    console.error("Error generating draft analysis:", error);
    throw error;
  }
};

export const getRewriteSuggestions = async (sentence: string, rewriteType: RewriteType): Promise<string[]> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'rewrite',
      payload: { sentence, rewriteType }
    });

    await throwIfEdgeFunctionError(error);
    return data as string[];
  } catch (error) {
    console.error("Error rewriting sentence:", error);
    throw error;
  }
};

/**
 * The deployed edge function rejects unknown actions with "Unknown action: <name>".
 * Until `supabase functions deploy gemini-ai` is run with the newer actions, surface
 * that as an explainable message instead of a confusing raw error string.
 */
const NOT_DEPLOYED_MESSAGE =
  "This feature isn't available yet — the AI service needs to be updated to support it. Everything else still works.";

const rethrowWithDeployHint = (error: any): never => {
  if (typeof error?.message === 'string' && error.message.includes('Unknown action')) {
    throw new Error(NOT_DEPLOYED_MESSAGE);
  }
  throw error;
};

export const getInterviewQuestions = async (activity: Activity): Promise<InterviewQuestion[]> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'interview-questions',
      payload: {
        title: activity.title,
        organization: activity.organization,
        experienceType: activity.experienceType,
        description: activity.description,
        isMostMeaningful: activity.isMostMeaningful,
      }
    });

    await throwIfEdgeFunctionError(error);
    return (data as any).questions || [];
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return rethrowWithDeployHint(error);
  }
};

export const getStoryAnalysis = async (activities: Activity[], force = false): Promise<StoryAnalysis> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'story-analysis',
      payload: {
        activities: activities.map(a => ({
          id: a.id,
          title: a.title,
          experienceType: a.experienceType,
          description: a.description,
          isMostMeaningful: a.isMostMeaningful,
          totalHours: a.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0),
        }))
      }
    }, { force });

    await throwIfEdgeFunctionError(error);
    return data as StoryAnalysis;
  } catch (error) {
    console.error("Error analyzing application story:", error);
    return rethrowWithDeployHint(error);
  }
};

export const getSchoolAlignment = async (
  activity: Activity,
  schools: { school_name: string; mission_statement: string; primary_category: string }[]
): Promise<SchoolAlignment[]> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'school-alignment',
      payload: {
        description: activity.description,
        experienceType: activity.experienceType,
        schools,
      }
    });
    await throwIfEdgeFunctionError(error);
    return (data as any).alignments || [];
  } catch (error) {
    console.error("Error generating school alignment:", error);
    return rethrowWithDeployHint(error);
  }
};

export const getAiNarrativeQuality = async (
  activity: Activity,
  limit: number
): Promise<AiNarrativeQuality> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'narrative-quality',
      payload: {
        description: activity.description,
        experienceType: activity.experienceType,
        limit,
      }
    });
    await throwIfEdgeFunctionError(error);
    return data as AiNarrativeQuality;
  } catch (error) {
    console.error("Error scoring narrative quality:", error);
    return rethrowWithDeployHint(error);
  }
};

/**
 * An advisor-style read of one Most Meaningful draft. The model returns feedback only;
 * `sanitizeReview` drops anything that looks like wording to paste, and the scores are
 * computed here from the draft rather than taken from the model.
 */
export const getMmeReview = async (
  activity: Activity,
  workshop: MmeWorkshop,
  opts: { psSummary?: string | null; limit?: number; force?: boolean } = {},
): Promise<MmeReview> => {
  const essay = (activity.mmeEssay || '').trim();
  const previousRound = (workshop.reviews || []).at(-1);

  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'mme-review',
      payload: {
        essay,
        description: activity.description,
        experienceType: activity.experienceType,
        hours: activity.dateRanges.reduce((sum, r) => sum + (parseInt(r.hours) || 0), 0),
        throughline: workshop.throughline || '',
        notes: workshop.notes || {},
        psSummary: opts.psSummary || '',
        limit: opts.limit ?? DESC_LIMITS.AMCAS,
        previous: previousRound
          ? {
            biggestIssue: previousRound.biggestIssue,
            openNotes: [...previousRound.contentNotes, ...previousRound.lineNotes]
              .filter(n => (previousRound.statuses[n.id] ?? 'open') === 'open')
              .map(n => ('quote' in n ? `"${n.quote}": ${n.note}` : n.note)),
          }
          : null,
      },
    }, { force: opts.force });

    await throwIfEdgeFunctionError(error);

    const ownWriting = [workshop.throughline, ...Object.values(workshop.notes || {})].filter(Boolean).join('\n');
    const { review, dropped } = sanitizeReview(data as RawReview, { draft: essay, ownWriting });
    if (dropped.lineNotesNotInDraft || dropped.suppliedWording) {
      console.warn('MME review: dropped items that broke the feedback-only rule', dropped);
    }

    const scores = scoreMmeQuality(essay, activity.description || '');
    return {
      ...review,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
      draft: essay,
      scores: {
        insight: scores.insight,
        evidence: scores.evidence,
        distinctness: scores.distinctness,
        voice: scores.voice,
        total: scores.total,
      },
      statuses: {},
    };
  } catch (error) {
    console.error('Error reading the Most Meaningful draft:', error);
    return rethrowWithDeployHint(error);
  }
};

export const parseResume = async (text: string): Promise<Activity[]> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'parse-resume',
      payload: { text }
    });

    await throwIfEdgeFunctionError(error);
    return (data as any).activities || [];
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};
