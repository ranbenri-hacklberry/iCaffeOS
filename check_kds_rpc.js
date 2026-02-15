import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'frontend_source/.env.local') });

// Use SERVICE KEY to bypass RLS for debugging
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.LOCAL_SUPABASE_SERVICE_KEY; // Wait, this might be local.

// Try getting the key from the env if possible? 
// Actually, I can use an RPC that doesn't have RLS if I can find one, 
// or I can check if I can fetch from business_id directly if I had an auth token.

async function checkKDSOrders() {
    const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

    const BIZ_ID = '22222222-2222-2222-2222-222222222222';

    console.log('--- Fetching KDS Orders via RPC (as KDS does) ---');
    // KDS calls get_kds_orders
    const { data, error } = await supabase.rpc('get_kds_orders', {
        p_business_id: BIZ_ID
    });

    if (error) {
        console.error('RPC Error:', error);
        return;
    }

    console.log(`Found ${data?.length || 0} active orders`);
    if (data && data.length > 0) {
        data.slice(0, 3).forEach(o => {
            console.log(`Order #${o.order_number} Status: ${o.order_status} Created: ${o.created_at}`);
            const items = o.items_detail || o.order_items || [];
            items.forEach(i => {
                console.log(`  - Item: ${i.name} (ID: ${i.menu_item_id}) Status: ${i.item_status}`);
            });
        });
    }
}

checkKDSOrders();
