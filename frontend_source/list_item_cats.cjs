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

const BUSINESS_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';

async function listUniqueCategories() {
    const { data: items } = await supabase
        .from('menu_items')
        .select('category')
        .eq('business_id', BUSINESS_ID);

    const uniqueCats = [...new Set(items.map(i => i.category).filter(Boolean))];
    console.log('Unique categories in items:', uniqueCats);
}

listUniqueCategories();
