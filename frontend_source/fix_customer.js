const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// טעינת הגדרות מה-env
const env = fs.readFileSync('/Users/icaffeos/icaffeos/frontend_source/.env', 'utf8');
const url = 'http://localhost:54321';
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const phone = process.argv[2];
const name = process.argv[3];
const businessId = '67667232-a581-423c-99b8-a1c17006767c';

async function fix() {
    console.log(`🔧 Fixing: ${name} (${phone})...`);
    
    // 1. יצירת לקוח
    const { data: cust, error: custErr } = await supabase
        .from('customers')
        .upsert({ business_id: businessId, first_name: name, phone: phone }, { onConflict: 'phone,business_id' })
        .select();

    if (custErr) return console.error('Error customer:', custErr.message);

    // 2. עדכון הזמנה
    const { error: ordErr } = await supabase
        .from('orders')
        .update({ customer_id: cust[0].id, customer_name: name, customer_phone: phone })
        .eq('customer_phone', phone)
        .eq('business_id', businessId)
        .in('status', ['pending', 'preparing']);

    if (ordErr) return console.error('Error order:', ordErr.message);
    console.log('✅ Done! KDS should update now.');
}

fix();
