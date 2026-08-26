
import { supabase, supabaseAnonKey } from "./supabase.ts";
import { Activity, RewriteType, ArchitectAnalysis, ThemeAnalysis, InterviewQuestion, StoryAnalysis } from "../types.ts";
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
    try {
      const text = await error.context.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        // If it isn't JSON, throw the raw text directly if there's text
        if (text) throw new Error(text);
        throw error;
      }
      if (body && body.error) {
        throw new Error(body.error);
      } else if (text) {
        throw new Error(text);
      }
    } catch (e: any) {
      // Don't swallow the error we just threw in the inner try
      throw e;
    }
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
const invokeEdgeFunction = async (body: object): Promise<{ data: any; error: any }> => {
  const EDGE_FUNCTION_URL =
    'https://jitzwwxsnpylaistotgq.supabase.co/functions/v1/gemini-ai';

  // Get the live session — throws AUTH_REQUIRED if logged out
  const session = await checkUserAuth();

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
    });
  } catch (networkError) {
    return { data: null, error: networkError };
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

  const data = await response.json();
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

export const synthesizeMmeEssay = async (baseDescription: string, action: string, result: string): Promise<string> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'mme-synthesis',
      payload: { baseDescription, action, result }
    });

    await throwIfEdgeFunctionError(error);
    return data as string;
  } catch (error) {
    console.error("Error synthesizing MME essay:", error);
    return "There was an error generating the essay. Please try again.";
  }
};

export const analyzeThemes = async (activities: Activity[]): Promise<ThemeAnalysis> => {
  try {
    const { data, error } = await invokeEdgeFunction({
      action: 'theme-analysis',
      payload: { activities }
    });

    await throwIfEdgeFunctionError(error);
    return data as ThemeAnalysis;
  } catch (error) {
    console.error("Error analyzing themes:", error);
    return {
      overallSummary: "Error analyzing activities. Please check your network and try again.",
      analysis: []
    };
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

export const getStoryAnalysis = async (activities: Activity[]): Promise<StoryAnalysis> => {
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
    });

    await throwIfEdgeFunctionError(error);
    return data as StoryAnalysis;
  } catch (error) {
    console.error("Error analyzing application story:", error);
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
