import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const text = fs.readFileSync('msar_text.txt', 'utf8');
const lines = text.split('\n');

const chunkSize = 1000;
let chunks = [];
for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join('\n'));
}

const prompt = `
You are an expert data extraction assistant.
I will provide you with a chunk of the raw text from the "MSAR Mission Statement.pdf".
For EACH medical school found in the text chunk, extract and categorize the data into the following JSON format:
[
  {
    "school_name": "...",
    "degree_type": "MD" or "DO",
    "application_system": "TMDSAS" or "AACOMAS" or "AMCAS",
    "mission_statement": "...",
    "primary_category": "The Investigator" or "The Advocate" or "The Practitioner" or "The Innovator" or "The Leader"
  }
]

Here are the rules for categorization:
A. Degree Type: 
- MD (Allopathic) programs (default for most MSAR schools unless specified DO).
- DO (Osteopathic) programs.

B. Application System:
- If it is a public medical school in Texas (e.g., UT systems, Dell, McGovern, Texas Tech), label it "TMDSAS". Note: Baylor College of Medicine and TCU are AMCAS, NOT TMDSAS.
- If it is a DO school, label it "AACOMAS".
- For all other MD programs, label it "AMCAS".

C. Primary Mission Archetype (Must be exactly one of these):
1. "The Investigator": Focuses on basic science, bench research, discoveries, and pushing medical knowledge.
2. "The Advocate": Focuses on social justice, community service, health equity, diversity, and underserved/urban/global populations.
3. "The Practitioner": Emphasizes primary care, rural health, healing, providing care, and hands-on clinical excellence.
4. "The Innovator": Focuses on the intersection of medicine with engineering, technology, systems, or systemic delivery.
5. "The Leader": Emphasizes producing future leaders in academic medicine, leaders in health care, and health policy.

Return ONLY the raw JSON array string. Do not include markdown \`\`\`json blocks.
`;

async function run() {
    console.log("Starting parsing across", chunks.length, "chunks...");
    let allSchools: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1} of ${chunks.length}...`);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt + "\n\n---CHUNK CONTENT---\n" + chunks[i],
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            });

            const data = JSON.parse(response.text || '[]');
            allSchools = allSchools.concat(data);
            console.log(`Got ${data.length} schools from chunk ${i + 1}`);

            // small delay to respect rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`Failed to parse chunk ${i + 1}`, e);
        }
    }

    // Deduplicate by exact name just in case chunk bleeding duplicated an entry
    const uniqueNames = new Set();
    const finalSchools = [];
    for (const s of allSchools) {
        if (!s.school_name || uniqueNames.has(s.school_name)) continue;
        uniqueNames.add(s.school_name);
        finalSchools.push(s);
    }

    fs.writeFileSync('schools_data.json', JSON.stringify(finalSchools, null, 2));
    console.log(`Successfully parsed ${finalSchools.length} unique schools total.`);

    // Generate SQL
    let sql = 'CREATE TABLE IF NOT EXISTS medical_schools (\n  id uuid primary key default gen_random_uuid(),\n  school_name text not null,\n  degree_type text not null,\n  application_system text not null,\n  mission_statement text not null,\n  primary_category text not null\n);\n\n';

    for (const school of finalSchools) {
        if (!school.school_name || !school.mission_statement || !school.primary_category) continue;

        const sName = String(school.school_name).replace(/'/g, "''").trim();
        const dType = String(school.degree_type).replace(/'/g, "''").trim();
        const appSys = String(school.application_system).replace(/'/g, "''").trim();
        const mStt = String(school.mission_statement).replace(/'/g, "''").trim();
        const pCat = String(school.primary_category).replace(/'/g, "''").trim();

        sql += `INSERT INTO medical_schools (school_name, degree_type, application_system, mission_statement, primary_category) VALUES ('${sName}', '${dType}', '${appSys}', '${mStt}', '${pCat}');\n`;
    }
    fs.writeFileSync('insert_schools.sql', sql);
    console.log("SQL generation complete.");
}

run().catch(console.error);
