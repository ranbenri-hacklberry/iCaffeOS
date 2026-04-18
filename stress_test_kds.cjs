const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('/Users/icaffeos/icaffeos/frontend_source/.env', 'utf8');
const subUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const subKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(subUrl, subKey);

const menuItems = [
    {id: 1, name: "סלט יווני", price: 40, category: "סלטים"},
    {id: 24, name: "אמריקנו קר", price: 15, category: "שתיה קרה"},
    {id: 19, name: "נס על חלב", price: 12, category: "שתיה חמה"},
    {id: 27, name: "טרופית", price: 3, category: "שתיה קרה"},
    {id: 367, name: "פסטה שמנת ערמונים", price: 48, category: "עיקריות"},
    {id: 371, name: "פיצה לבנה אישי", price: 52, category: "עיקריות"}
];

const customerNames = ["רוני", "דני", "מיכל", "יעל", "איתי", "נועה", "אלון", "גיא", "מאיה", "עמית"];

async function run() {
    console.log('🚀 STRESS TEST: Injecting 20 Random Orders...');
    
    for (let i = 1; i <= 20; i++) {
        const selectedItems = [];
        let total = 0;
        
        for (let j = 0; j < 3; j++) {
            const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
            selectedItems.push({
                item_id: randomItem.id,
                quantity: 1,
                price: randomItem.price,
                mods: [],
                notes: "Stress Test Order"
            });
            total += randomItem.price;
        }
        
        const payload = {
            p_customer_phone: "050" + Math.floor(1000000 + Math.random() * 9000000),
            p_customer_name: customerNames[Math.floor(Math.random() * customerNames.length)] + " (" + i + ")",
            p_items: selectedItems,
            p_is_paid: true,
            p_payment_method: 'cash',
            p_final_total: total
        };
        
        const { data, error } = await supabase.rpc('submit_order_v3', payload);
        if (error) console.error("Error " + i + ":", error.message);
        else console.log("Success " + i + ": " + data.order_id);
    }
    console.log('🏁 Stress Test complete!');
}

run();
