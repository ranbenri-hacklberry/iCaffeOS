
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use local Supabase URL
const supabaseUrl = process.env.VITE_LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Local Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log(`Connecting to ${supabaseUrl}...`);

    // Check ai_secrets
    const { error: errorSecrets } = await supabase.from('ai_secrets').select('*').limit(1);

    if (errorSecrets) {
        console.log('ai_secrets table:', errorSecrets.message); // Likely "relation does not exist"
    } else {
        console.log('ai_secrets table exists!');
    }

    // Check businesses columns
    const { data: businesses, error: errorBusinesses } = await supabase
        .from('businesses')
        .select('*')
        .limit(1);

    if (errorBusinesses) {
        console.error('Error fetching businesses:', errorBusinesses.message);
    } else if (businesses.length > 0) {
        console.log('Business columns:', Object.keys(businesses[0]));
    } else {
        console.log('Businesses table empty or no rows.');
    }
}

inspect();
