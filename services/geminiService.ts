
import { supabase } from "./supabase.ts";
import { Activity, RewriteType, ArchitectAnalysis, ThemeAnalysis } from "../types.ts";
import { DESC_LIMITS, MME_LIMIT, AAMC_CORE_COMPETENCIES } from "../constants.ts";
export const checkUserAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('AUTH_REQUIRED');
  }
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

export const getDraftAnalysis = async (draft: string, limit: number, experienceType?: string): Promise<ArchitectAnalysis> => {
  try {
    await checkUserAuth();
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'draft-analysis',
        payload: { draft, limit, experienceType }
      }
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
    await checkUserAuth();
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'rewrite',
        payload: { sentence, rewriteType }
      }
    });

    await throwIfEdgeFunctionError(error);
    return data as string[];
  } catch (error) {
    console.error("Error rewriting sentence:", error);
    return ["Error generating suggestions."];
  }
};

export const synthesizeMmeEssay = async (baseDescription: string, action: string, result: string): Promise<string> => {
  try {
    await checkUserAuth();
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'mme-synthesis',
        payload: { baseDescription, action, result }
      }
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
    await checkUserAuth();
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'theme-analysis',
        payload: { activities }
      }
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

export const parseResume = async (text: string): Promise<Activity[]> => {
  try {
    await checkUserAuth();
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'parse-resume',
        payload: { text }
      }
    });

    await throwIfEdgeFunctionError(error);
    // Ensure we return an array, defaulting to empty if response is weird
    return (data as any).activities || [];
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error; // Propagate the error to the hook for handling (and Toasting)
  }
};
