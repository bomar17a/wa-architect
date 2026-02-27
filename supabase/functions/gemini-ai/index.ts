
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const apiKey = Deno.env.get('API_KEY');
        if (!apiKey) {
            throw new Error('API_KEY is not set');
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Use gemini-2.5-flash as it is supported by the current SDK version for generateContent
        const MODEL_NAME = 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const { action, payload } = await req.json()

        // Helper for retrying AI calls
        const generateWithRetry = async (generationFn: () => Promise<any>, retries = 3, delay = 1000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    return await generationFn();
                } catch (error: any) {
                    if (error.message?.includes('429') || error.status === 429) {
                        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; // Exponential backoff
                    } else {
                        throw error;
                    }
                }
            }
            throw new Error('Max retries exceeded for AI generation due to rate limiting.');
        };

        let result;

        switch (action) {
            case 'draft-analysis':
                result = await handleDraftAnalysis(payload, model, generateWithRetry);
                break;
            case 'rewrite':
                result = await handleRewrite(payload, model, generateWithRetry);
                break;
            case 'mme-synthesis':
                result = await handleMmeSynthesis(payload, model, generateWithRetry);
                break;
            case 'parse-resume':
                result = await handleParseResume(payload, model, generateWithRetry);
                break;
            case 'parse-msar':
                result = await handleParseMsar(payload, model, generateWithRetry);
                break;
            case 'theme-analysis':
                result = await handleThemeAnalysis(payload, model, generateWithRetry);
                break;
            default:
                throw new Error(`Unknown action: ${action} `);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error: any) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

// --- Handler Functions ---

async function handleDraftAnalysis(payload: any, model: any, retryFn: any) {
    const { draft, limit, experienceType } = payload;
    const isOverLimit = draft.length > limit;
    const overLimitInstruction = isOverLimit
        ? `The user is currently at ${draft.length} / ${limit} characters. Your general feedback must start with this exact sentence: "This is a fantastic start and full of great detail! You're currently at ${draft.length} / ${limit} characters. My other comments below will help you identify the most impactful parts to keep (the 'keepers') and which sections we can safely condense or trim to get you under the ${limit}-character limit."`
        : `The user is within the character limit. Provide encouraging and constructive feedback on their draft, suggesting one or two areas for potential improvement if applicable.`;

    let typeSpecificInstruction = '';
    if (experienceType) {
        const typeStr = experienceType.toLowerCase();
        if (typeStr.includes('clinical') || typeStr.includes('healthcare') || typeStr.includes('shadowing')) {
            typeSpecificInstruction = `\n    Crucially, since this is a ${experienceType} experience, specifically check if they described meaningful patient interactions, empathy, and what they learned about the patient experience rather than just listing clinical duties. For shadowing, check if they reflected on the doctor-patient relationship and clinical insights.`;
        } else if (typeStr.includes('research')) {
            typeSpecificInstruction = `\n    Crucially, since this is a ${experienceType} experience, evaluate whether they highlighted their specific contribution, understanding of the scientific method, and any tangible outcomes (like posters, papers, or presentations).`;
        } else if (typeStr.includes('leadership')) {
            typeSpecificInstruction = `\n    Crucially, since this is a ${experienceType} experience, specifically look for examples of guiding others, taking initiative, handling conflict, or driving measurable change.`;
        } else if (typeStr.includes('community') || typeStr.includes('volunteer')) {
            typeSpecificInstruction = `\n    Crucially, since this is a ${experienceType} experience, look for themes of altruism, engagement with diverse populations, and tangible community impact.`;
        }
    }

    const prompt = `You are an expert medical school admissions writing tutor. A pre-med applicant has written a draft for their Work & Activities section and needs your feedback. Do NOT rewrite their draft. Your role is to provide strategic analysis.

    User's Draft:
    ---
    ${draft}
    ---

    ${overLimitInstruction}
    ${typeSpecificInstruction}

    Your task is to provide feedback in five parts:
    1.  **General Feedback:** A top-level comment evaluating the strength of their draft and suggesting thematic improvements.
    2.  **'Keepers':** Bullet points of the most impactful sentences, phrases, or ideas from the draft that are essential to the story. These are the elements that "show" rather than "tell".
    3.  **'Trimmers':** Bullet points of details, sentences, or phrases that are less critical, redundant, or could be expressed more concisely to save space.
    4.  **'Framework Alignment':** Evaluate the draft against three core pillars:
        - **Context:** How well did they establish the "What" and their role?
        - **Impact:** How well did they "Show" their impact with metrics, outcomes, and concrete details?
        - **Reflection:** How well did they "Tell" what they learned and how it shaped their path to medicine?
    5.  **'Suggested Competencies':** Map the draft against the AAMC Core Competencies. Identify 2-4 competencies that are strongly demonstrated by the evidence in the draft.

    Provide the output in a structured JSON format.
    `;

    const result_raw = await retryFn(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    generalFeedback: { type: "STRING" },
                    keepers: { type: "ARRAY", items: { type: "STRING" } },
                    trimmers: { type: "ARRAY", items: { type: "STRING" } },
                    frameworkAlignment: {
                        type: "OBJECT",
                        properties: {
                            context: { type: "STRING" },
                            impact: { type: "STRING" },
                            reflection: { type: "STRING" }
                        }
                    },
                    suggestedCompetencies: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                }
            }
        }
    }));

    return JSON.parse(result_raw.response.text());
}

async function handleRewrite(payload: any, model: any, retryFn: any) {
    const { sentence, rewriteType } = payload;
    const instructionMap: Record<string, string> = {
        CONCISE: 'Rewrite it to be more concise and direct without losing its meaning. Provide 2-3 alternative phrasings.',
        IMPACT: 'Rewrite it to be more "impact-oriented" using strong, active verbs. Focus on the outcome or the skills demonstrated. Provide 2-3 alternative phrasings.',
        REFLECTION: 'Rewrite it to include a brief, reflective insight about what the applicant learned or how they grew from this part of the experience. Provide 2-3 alternative phrasings.'
    };
    const instruction = instructionMap[rewriteType] || instructionMap.CONCISE;

    const prompt = `You are an expert writing coach for medical school applicants. A user has highlighted a sentence. ${instruction}
    The user's sentence is: "${sentence}"
    `;

    const result_raw = await retryFn(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    suggestions: { type: "ARRAY", items: { type: "STRING" } }
                }
            }
        }
    }));

    return JSON.parse(result_raw.response.text()).suggestions || [];
}

async function handleMmeSynthesis(payload: any, model: any, retryFn: any) {
    const { baseDescription, action: mmeAction, result: mmeResult } = payload;
    const prompt = `You are an expert storyteller and medical school admissions advisor crafting a "Most Meaningful Experience" essay using the STAR framework.
      CRITICAL: The final essay must be under 1325 characters.

      **Situation & Task:** ${baseDescription}
      **Action:** ${mmeAction}
      **Result:** ${mmeResult}
      `;

    const result_raw = await retryFn(() => model.generateContent(prompt));
    return result_raw.response.text().trim();
}

async function handleParseResume(payload: any, model: any, retryFn: any) {
    const { text } = payload;
    const prompt = `
    You are an expert resume parser for AAMC/AACOMAS medical school applications.
    
    TASK:
    Extract work and activity entries from the provided resume text.
    
    CRITICAL EXTRACTION RULES:
    1. EXTRACT ONLY:
       - Role Title
       - Organization Name
       - Location (City, Country)
       - Start Date (Month Year)
       - End Date (Month Year)
       - Description (The core narrative/bullets of the role as a single string)
    
    2. DO NOT EXTRACT / LEAVE EMPTY:
       - Contact Information (Email, Phone, Address) -> Ignore completely.
       - Total Hours -> Set to "0" or empty.
       - Contact Person/Supervisor -> Ignore completely.
    
    3. AMCAS CLASSIFICATION:
       - Categorize each entry into one of the 18 AMCAS Experience Types (e.g., "Physician Shadowing", "Community Service/Volunteer - Medical/Clinical", etc.).
       - If uncertain, use "Unclassified".
    
    4. OUTPUT FORMAT:
       - Return a JSON object with a "activities" array.
       - Each activity object MUST match this structure:
         {
           "title": "string",
           "organization": "string",
           "city": "string",
           "country": "string",
           "experienceType": "string",
           "startDateMonth": "string",
           "startDateYear": "string",
           "endDateMonth": "string", 
           "endDateYear": "string",
           "description": "string",
           "hours": "string"
         }
    
    RESUME TEXT:
    ${text}
    `;

    const result_raw = await retryFn(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    activities: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING" },
                                organization: { type: "STRING" },
                                experienceType: { type: "STRING" },
                                startDateMonth: { type: "STRING" },
                                startDateYear: { type: "STRING" },
                                endDateMonth: { type: "STRING" },
                                endDateYear: { type: "STRING" },
                                description: { type: "STRING" },
                                hours: { type: "STRING" },
                                city: { type: "STRING" },
                                country: { type: "STRING" }
                            }
                        }
                    }
                }
            }
        }
    }));

    // Clean the response text (remove markdown code blocks if present)
    let cleanText = result_raw.response.text() || "{}";
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.log("Raw Text:", result_raw.response.text());
        return { activities: [] }; // Fallback
    }
}

async function handleParseMsar(payload: any, model: any, retryFn: any) {
    const { text } = payload;
    const prompt = `
    You are an expert medical school admissions counselor. 
    
    TASK:
    Extract a list of medical schools from the provided raw text block. For each school you identify in the text, you must extract its name, its raw mission statement, and classify it based on constraints below.
    
    CRITICAL CLASSIFICATION RULES:
    1. Degree Type (degree_type):
       - Return exactly "MD" or "DO". (Assume MD unless it explicitly mentions Osteopathic).
       
    2. Application System (application_system):
       - If it is a public medical school in Texas (e.g., UT systems, Dell, McGovern, Texas Tech, Texas A&M), label it "TMDSAS".
       - If its degree type is DO, label it "AACOMAS".
       - For all other schools, label it "AMCAS".
       
    3. Primary Archetype (primary_category):
       - Assign EXACTLY ONE of the following tags based on the primary focus of its mission text:
         - "The Investigator" (Focuses heavily on basic science, bench research, discoveries)
         - "The Advocate" (Focuses on social justice, community service, underserved populations, equity)
         - "The Practitioner" (Emphasizes clinical excellence, primary care, rural medicine)
         - "The Innovator" (Intersection of engineering/tech/systemic delivery with medicine)
         - "The Leader" (Producing leaders, academic medicine, global health, health policy)
         
    TEXT TO PARSE:
    ${text}
    `;

    const result_raw = await retryFn(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    schools: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                school_name: { type: "STRING" },
                                mission_statement: { type: "STRING" },
                                degree_type: { type: "STRING" },
                                application_system: { type: "STRING" },
                                primary_category: { type: "STRING" }
                            }
                        }
                    }
                }
            }
        }
    }));

    return JSON.parse(result_raw.response.text());
}

async function handleThemeAnalysis(payload: any, model: any, retryFn: any) {
    const { activities } = payload;
    const activityTexts = activities
        .map((a: any) => `Activity ID ${a.id}: ${a.description} `)
        .join('\n\n');

    const prompt = `Analyze these medical school activities for AAMC Core Competencies.
Descriptions: ${activityTexts}
      Return top 5 - 7 competencies in JSON.
      `;

    const result_raw = await retryFn(() => model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    overallSummary: { type: "STRING" },
                    analysis: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                competency: { type: "STRING" },
                                relatedActivityIds: { type: "ARRAY", items: { type: "NUMBER" } },
                                summary: { type: "STRING" }
                            }
                        }
                    }
                }
            }
        }
    }));
    return JSON.parse(result_raw.response.text());
}
