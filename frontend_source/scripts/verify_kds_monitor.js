import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from parent dir (where the Cloud keys are)
dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase Cloud credentials in ../.env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnectivity() {
    console.log(`🔗 Testing connection to: ${SUPABASE_URL}`);

    // 1. Test Heartbeat
    console.log('💓 Sending test heartbeat...');
    const { data: heartbeat, error: hError } = await supabase.rpc('send_device_heartbeat', {
        p_business_id: '11111111-1111-1111-1111-111111111111', // Pilot Cafe
        p_device_id: 'DIAGNOSTIC_TEST_DEVICE',
        p_device_type: 'kds',
        p_user_name: 'Antigravity Diagnostic'
    });

    if (hError) {
        console.error('❌ Heartbeat RPC Failed:', hError.message);
    } else {
        console.log('✅ Heartbeat RPC Success!');
    }

    // 2. Test Alerts Table
    console.log('🔔 Checking system_alerts table...');
    const { data: alerts, error: aError } = await supabase
        .from('system_alerts')
        .select('count')
        .limit(1);

    if (aError) {
        console.error('❌ system_alerts table connection failed:', aError.message);
        console.log('💡 Tip: Make sure you ran the SQL script in Supabase Editor.');
    } else {
        console.log('✅ system_alerts table is accessible!');
    }
}

testConnectivity();
