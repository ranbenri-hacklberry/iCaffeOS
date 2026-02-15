
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
    const { error } = await supabase.from('automation_logs').insert({
        business_id: 1,
        action: 'test_insert',
        target: 'manual_check',
        details: { message: 'Checking if table exists' },
        triggered_by: 'installer'
    });

    if (error) {
        if (error.code === '42P01') {
            console.log('MISSING_TABLE');
        } else {
            console.log('ERROR:', error.message);
        }
    } else {
        console.log('EXISTS');
    }
}

test();
