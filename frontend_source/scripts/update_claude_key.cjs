
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

// Target local Supabase
const supabaseUrl = process.env.VITE_LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Local Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
const CLAUDE_KEY = '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';

async function updateKey() {
    console.log(`Updating Claude API Key for Business ID: ${BUSINESS_ID}...`);

    const { data, error } = await supabase
        .from('businesses')
        .update({ claude_api_key: CLAUDE_KEY })
        .eq('id', BUSINESS_ID)
        .select();

    if (error) {
        console.error('Error updating key:', error.message);
    } else {
        console.log('Successfully updated Claude API Key!');
        console.log('Updated Business:', data);
    }
}

updateKey();
