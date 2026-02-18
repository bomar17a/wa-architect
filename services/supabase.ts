import { createClient } from '@supabase/supabase-js';

// Hardcoding keys for "WA Architect" (jitzwwxsnpylaistotgq) to ensure correct project connection
// This resolves the 401 Unauthorized errors caused by using old project keys.
const supabaseUrl = 'https://jitzwwxsnpylaistotgq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdHp3d3hzbnB5bGFpc3RvdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzcyODMsImV4cCI6MjA4NjQxMzI4M30.KYWt_4MlBQB_FtYdJmU7eyIWJJFYX2cePE9bfziAPPs';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Key is missing. Check your .env setup.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
