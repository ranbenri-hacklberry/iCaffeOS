const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = '/Users/user/.gemini/antigravity/scratch/onlinestore/.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(1);

    if (data && data[0]) {
        console.log('Columns in menu_items:', Object.keys(data[0]));
    }
}

checkColumns();
