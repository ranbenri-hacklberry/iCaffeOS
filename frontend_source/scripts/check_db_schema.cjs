
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local if present, otherwise .env
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('Checking database tables...');

    // Check for ai_secrets table existence
    const { data: aiSecretsExists, error: aiSecretsError } = await supabase
        .from('ai_secrets')
        .select('*')
        .limit(1);

    if (aiSecretsError) {
        console.log('ai_secrets table check:', aiSecretsError.message);
    } else {
        console.log('ai_secrets table exists.');
    }

    // Check businesses table columns (implicitly by selecting one row)
    const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .limit(1);

    if (businessError) {
        console.error('Error fetching businesses:', businessError);
    } else if (businessData && businessData.length > 0) {
        console.log('Business table columns:', Object.keys(businessData[0]));
    } else {
        console.log('Business table empty or no access.');
    }
}

checkDatabase();
