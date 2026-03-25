const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('/Users/icaffeos/icaffeos/frontend_source/.env', 'utf8');
const url = 'http://localhost:54321';
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const phone = process.argv[2];
const customerName = process.argv[3];
const orderNum = process.argv[4]; // מספר ההזמנה (למשל 3777)
const businessId = '11111111-1111-1111-1111-111111111111';

async function fix() {
    console.log(`🎯 מעדכן הזמנה ${orderNum} עבור ${customerName}...`);
    
    try {
        // 1. טיפול בלקוח (שליפה או יצירה)
        let { data: cust } = await supabase.from('customers').select('id').eq('phone_number', phone).maybeSingle();
        
        let customerId;
        if (cust) {
            customerId = cust.id;
        } else {
            const { data: newCust, error: insErr } = await supabase
                .from('customers')
                .insert({ business_id: businessId, name: customerName, phone_number: phone })
                .select()
                .single();
            if (insErr) return console.error('❌ שגיאה ביצירת לקוח:', insErr.message);
            customerId = newCust.id;
        }

        // 2. עדכון ההזמנה לפי מספר הזמנה (order_number)
        // אני מניח שלעמודה קוראים order_number - אם לא, נבדוק שוב
        const { error: ordErr } = await supabase
            .from('orders')
            .update({ 
                customer_id: customerId, 
                customer_name: customerName, 
                customer_phone: phone 
            })
            .eq('order_number', orderNum)
            .eq('business_id', businessId);

        if (ordErr) {
            console.error('❌ שגיאה בעדכון הזמנה:', ordErr.message);
        } else {
            console.log(`✅ הצלחה! הזמנה ${orderNum} עודכנה עם השם "${customerName}".`);
        }
        
    } catch (e) {
        console.error('שגיאת מערכת:', e.message);
    }
}
fix();
