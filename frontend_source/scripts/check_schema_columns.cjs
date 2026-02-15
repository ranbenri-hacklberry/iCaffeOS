
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.LOCAL_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking schema for time_clock_events...');
    const { data, error } = await supabase.rpc('run_sql', {
        query_text: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'time_clock_events'"
    });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns:', JSON.stringify(data, null, 2));

        // Check if assigned_role and location exist
        const cols = data.map(c => c.column_name);
        console.log('assigned_role exists:', cols.includes('assigned_role'));
        console.log('location exists:', cols.includes('location'));
    }
}

check();
