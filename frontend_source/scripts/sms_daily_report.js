const { createClient } = require('@supabase/supabase-client');
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const REPORT_PHONE = '0506102416';
const CLOUD_FUNCTION_URL = 'https://us-central1-repos-477613.cloudfunctions.net/sendSms';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
async function runReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    try {
        const { count: smsCount } = await supabase.from('sms_queue').select('*', { count: 'exact', head: true }).eq('status', 'success').gte('created_at', todayISO);
        const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayISO);
        const message = `בוקר טוב, נכון לשעה 10:00 נשלחו היום ${smsCount || 0} מסרונים מתוך ${ordersCount || 0} הזמנות במערכת iCaffeOS.`;
        await fetch(CLOUD_FUNCTION_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: REPORT_PHONE, message }) });
    } catch (err) { console.error(err); }
}
runReport();
