const { createClient } = require('@supabase/supabase-js');

// ✅ FIXED: Use LOCAL Supabase, not Cloud!
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);
const CLOUD_FUNCTION_URL = 'https://us-central1-repos-477613.cloudfunctions.net/sendSms';
const REPORT_PHONE = "0506102416";

async function runReport() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:00`;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    
    try {
        console.log(`Generating report for ${currentTimeStr}...`);

        // 1. Fetch Today's Successful SMS count
        const { data: smsData, error: smsErr } = await supabase
            .from('sms_queue')
            .select('phone')
            .eq('status', 'success')
            .gte('created_at', todayISO);
        
        if (smsErr) console.warn('SMS query error:', smsErr.message);
        const actualSmsCount = smsData?.filter(s => s.phone && !s.phone.startsWith('GUEST')).length || 0;
        
        // 2. Fetch Today's Real Orders count
        const { data: ordersData, error: ordErr } = await supabase
            .from('orders')
            .select('customer_phone')
            .gte('created_at', todayISO);
        
        if (ordErr) console.warn('Orders query error:', ordErr.message);
        const realOrdersCount = ordersData?.filter(o => o.customer_phone && !o.customer_phone.startsWith('GUEST')).length || 0;
        
        // 3. Fetch Balance from local proxy (Port 8081)
        let balanceStr = '---';
        try {
            const balanceRes = await fetch('http://localhost:8081/api/sms/balance');
            const balanceData = await balanceRes.json();
            if (balanceData.success) {
                balanceStr = balanceData.balance;
            }
        } catch (e) {
            console.warn('Could not fetch balance:', e.message);
        }

        // 4. Construct Message
        const message = `שלום רני, נכון לשעה ${currentTimeStr} נשלחו היום ${actualSmsCount} מסרונים ללקוחות מתוך ${realOrdersCount} הזמנות מזוהות במערכת. יתרת הודעות בגלובל סמס: ${balanceStr}.`;
        
        // 5. Send Notification
        const res = await fetch(CLOUD_FUNCTION_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ phone: REPORT_PHONE, message }) 
        });
        
        console.log(`Report sent to ${REPORT_PHONE}. Status: ${res.status}`);
        console.log(`Message: ${message}`);
        process.exit(0);
    } catch (err) { 
        console.error('Report failed:', err); 
        process.exit(1);
    }
}

runReport();
