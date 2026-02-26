import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = "https://jitzwwxsnpylaistotgq.supabase.co";
const VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdHp3d3hzbnB5bGFpc3RvdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzcyODMsImV4cCI6MjA4NjQxMzI4M30.KYWt_4MlBQB_FtYdJmU7eyIWJJFYX2cePE9bfziAPPs";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
            action: 'draft-analysis',
            payload: { draft: "This is a test draft of my work and activities.", limit: 1325 }
        }
    });

    if (error) {
        console.log("Error type:", error.constructor.name);
        console.log("Keys:", Object.keys(error));
        console.log("Name:", error.name);
        console.log("Message:", error.message);

        if (error.context) {
            console.log("Context type:", error.context.constructor.name);
            try {
                console.log("Context status:", error.context.status);
                const text = await error.context.text();
                console.log("Context body text:", text);
            } catch (e) {
                console.log("Could not read text", e);
            }
        }
    } else {
        console.log("Success:", data);
    }
}
test();
