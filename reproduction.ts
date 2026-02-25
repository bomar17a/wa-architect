
const SUPABASE_URL = 'https://jitzwwxsnpylaistotgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdHp3d3hzbnB5bGFpc3RvdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzcyODMsImV4cCI6MjA4NjQxMzI4M30.KYWt_4MlBQB_FtYdJmU7eyIWJJFYX2cePE9bfziAPPs';

// Mock complex resume text for thorough testing
const MOCK_RESUME = `
JANE DOE
123 Medical Way, Cityville, ST 12345 | (555) 123-4567 | jane.doe@email.com

EXPERIENCE

Senior Clinical Research Coordinator | Cityville General Hospital | Cityville, USA
June 2021 – Present
- Managed clinical trials for oncology patients.
- Coordinated with multidisciplinary teams to ensure protocol compliance.
- Facilitated patient enrollment and data management for 15+ active studies.

Volunteer Medical Assistant | Free Clinic of Cityville | Cityville, USA
January 2019 – May 2021
- Performed vitals and recorded patient history for underserved populations.
- Assisted physicians with minor procedures and translation services.
- Managed front-desk operations and scheduled follow-up appointments.

LEADERSHIP & SERVICE

President | Pre-Health Honor Society | University of Science | Cityville, USA
August 2019 – May 2021
- Led a student organization of 200+ members interested in healthcare careers.
- Organized annual health symposium featuring 20 guest speakers.
- Mentored underclassmen on application timelines and course selection.
`;

async function testParseResume() {
    console.log("🚀 Starting Resume Architect Verification (API Test)...");
    console.log("---------------------------------------------------------");

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                action: 'parse-resume',
                payload: { text: MOCK_RESUME }
            })
        });

        if (!response.ok) {
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
            return;
        }

        const data = await response.json();
        console.log("✅ Success! Parsed Activities:");
        console.log(JSON.stringify(data, null, 2));

        // Basic Validation Checks
        const activities = data.activities || [];
        console.log("\n--- Verification Summary ---");
        console.log(`- Total Activities Parsed: ${activities.length}`);

        activities.forEach((activity: any, index: number) => {
            console.log(`\nActivity ${index + 1}: ${activity.title}`);
            console.log(`  - Organization: ${activity.organization}`);
            console.log(`  - Type: ${activity.experienceType}`);
            console.log(`  - Restricted Field (Hours): ${activity.hours === '0' || activity.hours === '' ? '✅ Success (Empty)' : '❌ Failure (Contains Data)'}`);
        });

    } catch (error) {
        console.error("❌ Fetch error:", error);
    }
}

testParseResume();
