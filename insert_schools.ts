import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const data = JSON.parse(fs.readFileSync('schools_data.json', 'utf8'));
    console.log(`Read ${data.length} schools from json.`);

    let inserted = 0;
    for (const school of data) {
        if (!school.school_name || !school.mission_statement || !school.primary_category) continue;

        const { error } = await supabase.from('medical_schools').insert({
            school_name: school.school_name.trim(),
            degree_type: school.degree_type.trim(),
            application_system: school.application_system.trim(),
            mission_statement: school.mission_statement.trim(),
            primary_category: school.primary_category.trim(),
        });

        if (error) {
            console.error("Error inserting:", school.school_name, error);
        } else {
            inserted++;
        }
    }

    console.log(`Successfully inserted ${inserted} out of ${data.length}`);
}

run().catch(console.error);
