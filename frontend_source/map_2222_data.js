
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const BIZ_ID = '22222222-2222-2222-2222-222222222222';

async function mapMissingData() {
    console.log('📊 Mapping data for business:', BIZ_ID);

    const tables = [
        'item_category',
        'inventory_items',
        'menu_items',
        'recipes',
        'optiongroups',
        'employees'
    ];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('business_id', BIZ_ID);

        console.log(`${table.padEnd(20)}: ${count ?? 0} rows ${error ? '(ERROR: ' + error.message + ')' : ''}`);
    }

    // Check if there are menu_items with NO business_id or a different one that looks like it
    const { data: orphans } = await supabase
        .from('menu_items')
        .select('business_id, count(*)')
        .limit(10);

    console.log('\n🔍 Other business IDs in menu_items:', orphans);
}

mapMissingData();
