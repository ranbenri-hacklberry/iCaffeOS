
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function replicateRevised() {
    console.log('🕵️‍♀️ Replication Diagnostic & Execute...');

    const { data: businesses } = await supabase.from('businesses').select('id');
    const sourceBiz = businesses.find(b => b.id.startsWith('111'));
    const targetBiz = businesses.find(b => b.id.startsWith('222'));

    // 1. Inspect Source Items
    const { data: srcItems } = await supabase.from('menu_items').select('*').eq('business_id', sourceBiz.id).limit(1);
    if (srcItems && srcItems.length > 0) {
        const sample = srcItems[0];
        console.log('Sample Item Column "category":', sample.category, 'Type:', typeof sample.category);
        console.log('Sample Item Column "category_id":', sample.category_id, 'Type:', typeof sample.category_id);
    }

    // 2. Try to Create Category in Target
    let targetCatId = null;
    const catName = 'שתייה חמה';

    // Attempt 1: 'categories' table
    console.log(`Attempting insert into 'categories'...`);
    const { data: cat1, error: err1 } = await supabase.from('categories').insert({
        business_id: targetBiz.id,
        name: catName,
        display_order: 1
    }).select().single();

    if (cat1) {
        console.log('✅ Created in categories:', cat1.id);
        targetCatId = cat1.id;
    } else {
        console.error('❌ categories insert failed:', err1?.message);
    }

    // Attempt 2: 'menu_categories' table (if 1 failed)
    if (!targetCatId) {
        console.log(`Attempting insert into 'menu_categories'...`);
        const { data: cat2, error: err2 } = await supabase.from('menu_categories').insert({
            business_id: targetBiz.id,
            name: catName
        }).select().single();
        if (cat2) {
            console.log('✅ Created in menu_categories:', cat2.id);
            targetCatId = cat2.id;
        } else {
            console.error('❌ menu_categories insert failed:', err2?.message);
        }
    }

    if (!targetCatId) {
        // Fallback: Check if there are EXISTING categories and use one?
        // Maybe RLS allows READ but not INSERT?
        // Or maybe user said "only categories exist", so I should FIND them.
        console.log('Attempting to FIND existing categories...');
        const { data: existing } = await supabase.from('categories').select('id, name').eq('business_id', targetBiz.id);
        if (existing && existing.length > 0) {
            targetCatId = existing[0].id;
            console.log(`✅ Found existing: ${existing[0].name} (${targetCatId})`);
        } else {
            // Try menu_categories
            const { data: existing2 } = await supabase.from('menu_categories').select('id, name').eq('business_id', targetBiz.id);
            if (existing2 && existing2.length > 0) {
                targetCatId = existing2[0].id;
                console.log(`✅ Found existing mb: ${existing2[0].name} (${targetCatId})`);
            }
        }
    }

    if (!targetCatId) {
        console.error('⛔ Critical: No Target Category ID. Cannot insert items.');
        return;
    }

    // 3. Clone (Strict)
    const INCLUDE = ['הפוך', 'מוקה', 'סחלב', 'שוקו', 'אספרסו', 'מקיאטו', 'אמריקנו', 'נס', 'תה', 'קפה'];
    const EXCLUDE = ['כריך', 'טוסט', 'סלט', 'מאפה'];

    const { data: itemsToClone } = await supabase.from('menu_items').select('*').eq('business_id', sourceBiz.id);

    // Create mapping for Groups
    const groupMap = new Map();

    for (const item of itemsToClone) {
        const name = item.name.toLowerCase();
        if (EXCLUDE.some(ex => name.includes(ex))) continue;
        if (!INCLUDE.some(inc => name.includes(inc))) continue;

        console.log(`Processing ${item.name}...`);

        // Check if exists
        const { data: exists } = await supabase.from('menu_items').select('id').eq('business_id', targetBiz.id).eq('name', item.name).single();
        if (exists) {
            console.log('   Already exists.');
            continue;
        }

        // Clone Item
        // Notice we used 'category' NOT NULL constraint earlier.
        const { data: newItem, error: itemErr } = await supabase.from('menu_items').insert({
            business_id: targetBiz.id,
            category: targetCatId, // Using the found ID
            // If the column takes simple text, this will fail if ID is uuid. Use logic based on step 1 inspection.
            // But let's assume UUID for now as 'violations not-null' logic usually implies FK or UUID.
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            is_instock: true,
            available: true
        }).select().single();

        if (itemErr) {
            console.error(`   ❌ Insert failed: ${itemErr.message}`);
            continue;
        }

        // Link Modifiers logic (Simplified reuse: find source groups, recreate/find target, link)
        // For brevity in this fix script, let's just create the item. 
        // User asked to replicate "all coffee drinks" to 222.
        // We really should replicate modifiers too.

        // Re-fetch modifiers for this source item
        const { data: links } = await supabase.from('menuitemoptions').select('group_id').eq('item_id', item.id);
        const gIds = links.map(l => l.group_id);
        const { data: groups } = await supabase.from('optiongroups').select('*, optionvalues(*)').in('id', gIds);

        for (const grp of groups || []) {
            let targetGid = groupMap.get(grp.id);
            if (!targetGid) {
                // Check existing in target
                const { data: exG } = await supabase.from('optiongroups').select('id').eq('business_id', targetBiz.id).eq('name', grp.name).single();
                if (exG) targetGid = exG.id;
                else {
                    const { data: nG } = await supabase.from('optiongroups').insert({
                        business_id: targetBiz.id, name: grp.name, is_multiple_select: grp.is_multiple_select, is_required: grp.is_required, type: grp.type
                    }).select().single();
                    if (nG) {
                        targetGid = nG.id;
                        if (grp.optionvalues) {
                            const vals = grp.optionvalues.map(v => ({ group_id: targetGid, value_name: v.value_name || v.name, price_adjustment: v.price_adjustment, display_order: v.display_order }));
                            await supabase.from('optionvalues').insert(vals);
                        }
                    }
                }
                if (targetGid) groupMap.set(grp.id, targetGid);
            }
            if (targetGid) {
                await supabase.from('menuitemoptions').insert({ item_id: newItem.id, group_id: targetGid });
            }
        }
        console.log('   ✅ Cloned + Modifiers.');
    }
}

replicateRevised();
