
const { createClient } = require('@supabase/supabase-js');
const remoteSupabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const TABLES = [
    'businesses', 'business_secrets', 'employees', 'customers',
    'inventory_items', 'menu_items', 'item_category', 'optiongroups',
    'optionvalues', 'recipe_ingredients', 'recipes', 'orders',
    'order_items', 'loyalty_cards', 'loyalty_transactions',
    'discounts', 'prepared_items_inventory'
];

async function getCols(table) {
    const { data, error } = await remoteSupabase.from(table).select('*').limit(1);
    if (error || !data[0]) return [];
    return Object.keys(data[0]).map(k => {
        const val = data[0][k];
        let type = 'TEXT';
        if (typeof val === 'number') type = 'NUMERIC';
        if (typeof val === 'boolean') type = 'BOOLEAN';
        if (Array.isArray(val)) type = 'JSONB';
        else if (typeof val === 'object' && val !== null) type = 'JSONB';

        if (k === 'id' || k.endsWith('_id')) type = 'UUID';
        if (k.endsWith('_at') || k.endsWith('_date')) type = 'TIMESTAMPTZ';

        return { name: k, type };
    });
}

async function run() {
    for (const table of TABLES) {
        const cols = await getCols(table);
        if (cols.length === 0) continue;
        let sql = `ALTER TABLE public.${table} `;
        const additions = cols.map(c => `ADD COLUMN IF NOT EXISTS ${c.name} ${c.type}`);
        sql += additions.join(',\n    ') + ';';
        console.log(sql);
    }
}
run();
