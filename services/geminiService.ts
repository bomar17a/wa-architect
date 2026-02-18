
import { supabase } from "./supabase.ts";
import { Activity, RewriteType, ArchitectAnalysis, ThemeAnalysis } from "../types.ts";
import { DESC_LIMITS, MME_LIMIT, AAMC_CORE_COMPETENCIES } from "../constants.ts";

export const getDraftAnalysis = async (draft: string, limit: number): Promise<ArchitectAnalysis> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'draft-analysis',
        payload: { draft, limit }
      }
    });

    if (error) throw error;
    return data as ArchitectAnalysis;
  } catch (error) {
    console.error("Error generating draft analysis:", error);
    return {
      generalFeedback: "Error: Could not generate analysis. Please try again or adjust your draft.",
      keepers: [],
      trimmers: [],
      suggestedCompetencies: []
    };
  }
};

export const getRewriteSuggestions = async (sentence: string, rewriteType: RewriteType): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'rewrite',
        payload: { sentence, rewriteType }
      }
    });

    if (error) throw error;
    return data as string[];
  } catch (error) {
    console.error("Error rewriting sentence:", error);
    return ["Error generating suggestions."];
  }
};

export const synthesizeMmeEssay = async (baseDescription: string, action: string, result: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'mme-synthesis',
        payload: { baseDescription, action, result }
      }
    });

    if (error) throw error;
    return data as string;
  } catch (error) {
    console.error("Error synthesizing MME essay:", error);
    return "There was an error generating the essay. Please try again.";
  }
};

export const analyzeThemes = async (activities: Activity[]): Promise<ThemeAnalysis> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'theme-analysis',
        payload: { activities }
      }
    });

    if (error) throw error;
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
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        action: 'parse-resume',
        payload: { text }
      }
    });

    if (error) throw error;
    // Ensure we return an array, defaulting to empty if response is weird
    return (data as any).activities || [];
  } catch (error) {
    console.error("Error parsing resume:", error);
    return [];
  }
};
