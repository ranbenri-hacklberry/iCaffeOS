import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const supabase = createClient(process.env.SUPABASE_URL, process.env.AUTH_KEY);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function dump() {
    console.log("🚀 Starting manual dump from Cloud to Local...");
    
    // 1. Get Categories
    const { data: cats } = await supabase.from('categories').select('*');
    if (cats) {
        for (const cat of cats) {
            await pool.query(
                'INSERT INTO categories (id, business_id, name, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
                [cat.id, cat.business_id, cat.name, cat.sort_order]
            );
        }
        console.log(`✅ Synced ${cats.length} categories`);
    }

    // 2. Get Menu Items
    const { data: items } = await supabase.from('menu_items').select('*');
    if (items) {
        for (const item of items) {
            await pool.query(
                'INSERT INTO menu_items (id, business_id, name, price, category_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
                [item.id, item.business_id, item.name, item.price, item.category_id, item.is_active]
            );
        }
        console.log(`✅ Synced ${items.length} menu items`);
    }
    
    console.log("🎊 Dump complete! Refresh your browser at http://localhost:4028");
    process.exit(0);
}

dump().catch(console.error);
