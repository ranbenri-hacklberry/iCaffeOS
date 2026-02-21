
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log('Checking "businesses" table columns for keys...');

    // Check businesses columns
    const { data: bCols, error: bErr } = await supabase
        .from('businesses')
        .select('*')
        .limit(1);

    if (bErr) console.error('Error fetching businesses:', bErr);
    else if (bCols.length > 0) {
        console.log('Keys in businesses table:', Object.keys(bCols[0]).filter(k => k.includes('key') || k.includes('api') || k.includes('settings')));
    } else {
        console.log('No businesses found to check columns.');
    }

    console.log('\nChecking if "business_settings" table exists...');
    const { data: sCols, error: sErr } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1);

    if (sErr) {
        if (sErr.code === '42P01') console.log('Table "business_settings" does NOT exist.');
        else console.error('Error fetching business_settings:', sErr);
    } else if (sCols.length > 0) {
        console.log('Keys in business_settings:', Object.keys(sCols[0]));
    } else {
        console.log('business_settings exists but is empty.');
    }
}

check();
