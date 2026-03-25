const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('/Users/icaffeos/icaffeos/frontend_source/.env', 'utf8');
const url = 'http://localhost:54321';
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const PHONE_ITEM_ID = 374;
const NAME_ITEM_ID = 375;

async function autoFix() {
    try {
        const { data: items, error: itemsErr } = await supabase
            .from('order_items')
            .select('id, order_id, notes, menu_item_id')
            .in('menu_item_id', [PHONE_ITEM_ID, NAME_ITEM_ID]);

        if (itemsErr) throw itemsErr;
        if (!items || items.length === 0) return;

        const ordersToFix = {};
        items.forEach(item => {
            if (!ordersToFix[item.order_id]) ordersToFix[item.order_id] = { name: null, phone: null, itemIds: [] };
            if (item.menu_item_id === NAME_ITEM_ID) ordersToFix[item.order_id].name = item.notes?.trim();
            if (item.menu_item_id === PHONE_ITEM_ID) ordersToFix[item.order_id].phone = item.notes?.trim();
            ordersToFix[item.order_id].itemIds.push(item.id);
        });

        for (const orderId in ordersToFix) {
            const { name, phone, itemIds } = ordersToFix[orderId];
            
            // עדכון ההזמנה עם שם וטלפון
            // ה-updated_at כאן הוא קריטי כדי שה-KDS ימשוך את השינוי
            await supabase.from('orders').update({
                customer_name: name,
                customer_phone: phone,
                updated_at: new Date().toISOString()
            }).eq('id', orderId);

            // מחיקת הפריטים הפיקטיביים
            await supabase.from('order_items').delete().in('id', itemIds);
            
            console.log(`✅ Order ${orderId} synced. Name: ${name}, Phone: ${phone}`);
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

setInterval(autoFix, 5000); // נוריד ל-5 שניות לזמן תגובה מהיר בשיא הלחץ
autoFix();
