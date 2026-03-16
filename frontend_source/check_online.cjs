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

async function checkOnlineVisibility() {
    const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, is_visible_online')
        .eq('business_id', BUSINESS_ID);

    const hiddenOnline = items.filter(i => i.is_visible_online === false);
    console.log(`❌ Items hidden online: ${hiddenOnline.length}`);
    if (hiddenOnline.length > 0) {
        hiddenOnline.slice(0, 10).forEach(i => console.log(`   - ${i.name} is hidden online`));
    }
}

checkOnlineVisibility();
