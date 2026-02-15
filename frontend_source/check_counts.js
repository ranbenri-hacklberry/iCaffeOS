import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.VITE_LOCAL_SERVICE_ROLE_KEY;
const BUSINESS_ID = "22222222-2222-2222-2222-222222222222";

const local = createClient(LOCAL_URL, LOCAL_KEY);

async function checkCounts() {
    const tables = ['orders', 'order_items', 'menu_items', 'optiongroups', 'menuitemoptions'];
    console.log("📊 Checking Local Docker Counts for business:", BUSINESS_ID);

    for (const table of tables) {
        // Total count
        const { count: total } = await local.from(table).select('*', { count: 'exact', head: true });

        // Filtered count
        let filtered = 0;
        if (table === 'order_items') {
            const { count } = await local.from(table).select('*', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID);
            filtered = count;
        } else if (table === 'menuitemoptions') {
            const { data: groups } = await local.from('optiongroups').select('id').eq('business_id', BUSINESS_ID);
            const ids = (groups || []).map(g => g.id);
            if (ids.length > 0) {
                const { count } = await local.from(table).select('*', { count: 'exact', head: true }).in('group_id', ids);
                filtered = count;
            }
        } else {
            const { count } = await local.from(table).select('*', { count: 'exact', head: true }).eq('business_id', BUSINESS_ID);
            filtered = count;
        }

        console.log(`- ${table.padEnd(20)}: Total=${String(total).padStart(3)}, Filtered=${String(filtered).padStart(3)}`);
    }
}
checkCounts();
