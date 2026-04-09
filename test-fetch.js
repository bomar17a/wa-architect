import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.split('\n').find(l => l.startsWith('VITE_SUPABASE_URL')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('VITE_SUPABASE_ANON_KEY')).split('=')[1].trim();

fetch(`${url}/rest/v1/medical_schools?select=*`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(r => r.json()).then(data => {
  if (data.error) {
    console.error("Error:", data);
  } else {
    console.log("Found", data.length, "schools.");
    if (data.length > 0) {
      console.log("First school:", data[0].school_name, "Category:", data[0].primary_category);
    }
  }
}).catch(console.error);
