
const SUPABASE_URL = 'https://jitzwwxsnpylaistotgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdHp3d3hzbnB5bGFpc3RvdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzcyODMsImV4cCI6MjA4NjQxMzI4M30.Hb98u_r4wTiWJq9YIX9-r8Uo-TszL4wz2q-uT99lX_s';

// Mock resume text
const MOCK_RESUME = `
Jane Doe
Software Engineer
Experience:
Senior Developer at Tech Corp (2020-Present)
- Led team of 5 developers.
- Built React apps.
`;

async function testParseResume() {
    console.log("Testing gemini-ai function (parse-resume)...");

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
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
            return;
        }

        const data = await response.json();
        console.log("Success! Response data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testParseResume();
