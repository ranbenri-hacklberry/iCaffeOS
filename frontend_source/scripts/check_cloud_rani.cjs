const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRani() {
    console.log('🔍 Checking Cloud Database for "רני"...');
    const { data, error } = await supabase
        .from('employees')
        .select('id, name, phone, email, business_id, pin_code, access_level, is_super_admin')
        .ilike('name', '%רני%');

    if (error) {
        console.error('❌ Error fetching employees:', error);
        return;
    }

    console.log('✅ Found', data.length, 'records:');
    console.table(data);

    // Also check for duplicates by phone
    const phones = [...new Set(data.map(e => e.phone).filter(p => p))];
    if (phones.length > 0) {
        console.log('\n🔍 Checking for any other users with these phone numbers...');
        const { data: duplicates, error: dupError } = await supabase
            .from('employees')
            .select('id, name, phone, email')
            .in('phone', phones);

        if (dupError) {
            console.error('❌ Error fetching duplicates:', dupError);
            return;
        }

        if (duplicates.length > data.length) {
            console.log('⚠️ Found duplicates with same phone numbers:');
            console.table(duplicates);
        } else {
            console.log('✅ No duplicate phone numbers found outside of the "רני" records.');
        }
    }
}

checkRani();
