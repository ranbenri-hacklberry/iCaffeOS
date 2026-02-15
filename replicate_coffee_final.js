
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function replicateFinal() {
    console.log('🚀 Starting Final Replication (Strict Coffee Only)...');

    const { data: businesses } = await supabase.from('businesses').select('id');
    const sourceBiz = businesses.find(b => b.id.startsWith('111'));
    const targetBiz = businesses.find(b => b.id.startsWith('222')); // iCaffe

    if (!sourceBiz || !targetBiz) {
        console.error('Missing business IDs');
        return;
    }

    // 1. Find a Valid Category ID for Target
    let targetCatId = null;

    // Try 'categories' table
    const { data: cats1 } = await supabase.from('categories').select('id, name').eq('business_id', targetBiz.id);
    // Try 'menu_categories' table
    const { data: cats2 } = await supabase.from('menu_categories').select('id, name').eq('business_id', targetBiz.id);

    const validCats = [...(cats1 || []), ...(cats2 || [])];
    console.log(`Found ${validCats.length} existing categories in Target.`);

    const preferred = validCats.find(c => c.name.includes('קפה') || c.name.includes('חמה') || c.name.includes('שתייה'));
    if (preferred) {
        targetCatId = preferred.id;
        console.log(`✅ Selected Category: ${preferred.name} (${targetCatId})`);
    } else if (validCats.length > 0) {
        targetCatId = validCats[0].id; // Fallback to first available
        console.log(`⚠️ No specific Coffee category found, using: ${validCats[0].name}`);
    } else {
        // Create one if none exist? But which table?
        // Let's guess 'categories' first.
        const { data: newCat, error } = await supabase.from('categories').insert({
            business_id: targetBiz.id,
            name: 'שתייה חמה'
        }).select().single();

        if (newCat) {
            targetCatId = newCat.id;
            console.log(`✨ Created 'categories': ${newCat.name} (${targetCatId})`);
        } else {
            // Try menu_categories
            const { data: newCat2 } = await supabase.from('menu_categories').insert({
                business_id: targetBiz.id,
                name: 'שתייה חמה'
            }).select().single();
            if (newCat2) {
                targetCatId = newCat2.id;
                console.log(`✨ Created 'menu_categories': ${newCat2.name} (${targetCatId})`);
            }
        }
    }

    if (!targetCatId) {
        console.error('❌ Could not determine target category. Aborting.');
        return;
    }

    // 2. Filter Source Items (Strict)
    const INCLUDE = ['הפוך', 'מוקה', 'סחלב', 'שוקו', 'אספרסו', 'מקיאטו', 'אמריקנו', 'נס', 'תה', 'קפה'];
    const EXCLUDE = ['כריך', 'טוסט', 'סלט', 'מאפה', 'עוגה', 'קרואסון'];

    const { data: sourceItems } = await supabase.from('menu_items')
        .select('*')
        .eq('business_id', sourceBiz.id);

    const itemsToClone = sourceItems.filter(i => {
        const name = i.name;
        // detailed check
        if (EXCLUDE.some(ex => name.includes(ex))) return false;
        if (INCLUDE.some(inc => name.includes(inc))) return true;
        return false;
    });

    console.log(`\n📋 Cloning ${itemsToClone.length} Items:`);
    itemsToClone.forEach(i => console.log(`   - ${i.name}`));

    // 3. Modifiers (Clone Logic)
    // Gather all groups needed
    const srcIds = itemsToClone.map(i => i.id);
    const { data: links } = await supabase.from('menuitemoptions').select('group_id, item_id').in('item_id', srcIds);
    const neededGroupIds = [...new Set(links.map(l => l.group_id))];

    const { data: srcGroups } = await supabase.from('optiongroups')
        .select('*, optionvalues(*)')
        .in('id', neededGroupIds);

    const groupMap = new Map(); // OldID -> NewID

    for (const group of srcGroups || []) {
        // Check if exists in target by name
        const { data: existing } = await supabase.from('optiongroups')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', group.name)
            .single();

        let newGroupId;
        if (existing) {
            newGroupId = existing.id;
        } else {
            // Create
            const { data: created } = await supabase.from('optiongroups').insert({
                business_id: targetBiz.id,
                name: group.name,
                is_multiple_select: group.is_multiple_select,
                is_required: group.is_required,
                type: group.type
            }).select().single();

            if (created) {
                newGroupId = created.id;
                // Copy Values
                if (group.optionvalues) {
                    const vals = group.optionvalues.map(v => ({
                        group_id: newGroupId,
                        value_name: v.value_name || v.name,
                        price_adjustment: v.price_adjustment,
                        display_order: v.display_order,
                        is_default: v.is_default
                    }));
                    await supabase.from('optionvalues').insert(vals);
                }
            }
        }
        if (newGroupId) groupMap.set(group.id, newGroupId);
    }

    // 4. Execute Item Cloning
    for (const item of itemsToClone) {
        // Check existence
        const { data: exists } = await supabase.from('menu_items')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', item.name)
            .single();

        let newItemId;
        if (exists) {
            newItemId = exists.id;
        } else {
            const { data: created, error } = await supabase.from('menu_items').insert({
                business_id: targetBiz.id,
                category: targetCatId, // Important!
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image, // Setup image if needed
                is_instock: true,
                available: true
            }).select().single();

            if (error) {
                console.error(`   ❌ Failed cloning ${item.name}: ${error.message}`);
                continue;
            }
            newItemId = created.id;
            console.log(`   ✨ Cloned Item: ${item.name}`);
        }

        // Link Modifiers
        const mySourceLinks = links.filter(l => l.item_id === item.id);
        for (const link of mySourceLinks) {
            const targetGroupId = groupMap.get(link.group_id);
            if (targetGroupId) {
                await supabase.from('menuitemoptions').insert({
                    item_id: newItemId,
                    group_id: targetGroupId
                }).catch(() => { });
            }
        }
    }

    console.log('\n✅ Mission Complete.');
}

replicateFinal();
