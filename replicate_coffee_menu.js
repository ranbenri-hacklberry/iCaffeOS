
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function replicateMenu() {
    console.log('🐑 Cloning Coffee Menu from Biz 111 to 222...');

    // 1. Resolve Businesses
    const { data: businesses } = await supabase.from('businesses').select('id');
    const sourceBiz = businesses.find(b => b.id.startsWith('111'));
    const targetBiz = businesses.find(b => b.id.startsWith('222')); // iCaffe

    if (!sourceBiz || !targetBiz) {
        console.error(`❌ Missing business(es). Source: ${sourceBiz?.id}, Target: ${targetBiz?.id}`);
        return;
    }
    console.log(`Source: ${sourceBiz.id} -> Target: ${targetBiz.id}`);

    // 2. Identify Items to Clone
    // Keywords for coffee/warm drinks
    const keywords = ['הפוך', 'מוקה', 'סחלב', 'שוקו', 'אספרסו', 'מקיאטו', 'אמריקנו', 'נס', 'תה', 'קפה'];
    const query = keywords.map(k => `name.ilike.%${k}%`).join(',');

    const { data: sourceItems } = await supabase.from('menu_items')
        .select('*')
        .eq('business_id', sourceBiz.id)
        .or(query);

    if (!sourceItems || sourceItems.length === 0) {
        console.error('No source items found.');
        return;
    }
    console.log(`Found ${sourceItems.length} items to clone:`, sourceItems.map(i => i.name));

    // 3. Map & Clone Modifier Groups
    const groupMapping = new Map(); // SourceGroupId -> TargetGroupId

    // Get all groups linked to these items
    const sourceItemIds = sourceItems.map(i => i.id);
    const { data: links } = await supabase.from('menuitemoptions').select('group_id, item_id').in('item_id', sourceItemIds);

    // Find unique group IDs used
    const uniqueSourceGroupIds = [...new Set(links.map(l => l.group_id))];

    // Fetch full structure of these groups
    const { data: sourceGroups } = await supabase.from('optiongroups')
        .select(`
            *,
            optionvalues (*)
        `)
        .in('id', uniqueSourceGroupIds);

    console.log(`Found ${sourceGroups?.length || 0} unique modifier groups to replicate.`);

    for (const sGroup of sourceGroups || []) {
        console.log(`   Processing Group: ${sGroup.name}...`);

        // Check if an equivalent exists in Target (by Name) to avoid duplication
        const { data: existingTarget } = await supabase.from('optiongroups')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', sGroup.name)
            .single();

        let targetGroupId;

        if (existingTarget) {
            targetGroupId = existingTarget.id;
            console.log(`      -> Found existing in target (${targetGroupId})`);
        } else {
            // Create New Group
            const { data: newGroup, error: grpErr } = await supabase.from('optiongroups').insert({
                business_id: targetBiz.id,
                name: sGroup.name,
                is_multiple_select: sGroup.is_multiple_select,
                is_required: sGroup.is_required,
                min_selection: sGroup.min_selection,
                max_selection: sGroup.max_selection,
                type: sGroup.type,
                menu_item_id: null // Shared
            }).select().single();

            if (grpErr) {
                console.error(`      ❌ Failed to create group: ${grpErr.message}`);
                continue;
            }
            targetGroupId = newGroup.id;
            console.log(`      ✨ Created new group in target (${targetGroupId})`);

            // Create Values
            if (sGroup.optionvalues && sGroup.optionvalues.length > 0) {
                const valuesPayload = sGroup.optionvalues.map(v => ({
                    group_id: targetGroupId,
                    value_name: v.value_name || v.name, // Handle column variance
                    price_adjustment: v.price_adjustment,
                    display_order: v.display_order,
                    is_default: v.is_default,
                    calories: v.calories
                }));
                const { error: valErr } = await supabase.from('optionvalues').insert(valuesPayload);
                if (valErr) console.error(`      ❌ Failed to copy values: ${valErr.message}`);
            }
        }

        groupMapping.set(sGroup.id, targetGroupId);
    }

    // 4. Clone Items & Link
    for (const srcItem of sourceItems) {
        console.log(`\n📦 Cloning Item: ${srcItem.name}...`);

        let targetItemId;

        // Check if item exists in target
        const { data: existingItem } = await supabase.from('menu_items')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', srcItem.name)
            .single();

        if (existingItem) {
            targetItemId = existingItem.id;
            console.log(`   -> Item already exists (${targetItemId}). Updating links...`);
        } else {
            // Create Item
            const { data: newItem, error: itemErr } = await supabase.from('menu_items').insert({
                business_id: targetBiz.id,
                name: srcItem.name,
                description: srcItem.description,
                price: srcItem.price,
                image: srcItem.image,
                category_id: null, // Hard to map if categories differ. Leave unassigned or use default? 
                // We'll leave category null for now, user can sort later, OR attempt to find matching category name.
                is_instock: srcItem.is_instock,
                available: srcItem.available
            }).select().single();

            if (itemErr) {
                console.error(`   ❌ Failed to clone item: ${itemErr.message}`);
                continue;
            }
            targetItemId = newItem.id;
            console.log(`   ✨ Created new item (${targetItemId})`);
        }

        // Link Modifiers
        const itemLinks = links.filter(l => l.item_id === srcItem.id);
        const uniqueGroupsForThisItem = [...new Set(itemLinks.map(l => l.group_id))];

        for (const srcGroupId of uniqueGroupsForThisItem) {
            const targetGroupId = groupMapping.get(srcGroupId);
            if (!targetGroupId) continue;

            // Link
            const { error: linkErr } = await supabase.from('menuitemoptions').insert({
                item_id: targetItemId,
                group_id: targetGroupId
            });
            if (linkErr && !linkErr.message.includes('duplicate')) {
                console.error(`      ❌ Link failed: ${linkErr.message}`);
            } else if (!linkErr) {
                console.log(`      🔗 Linked group ${targetGroupId}`);
            }
        }
    }

    console.log('\n✅ Cloning Complete.');
}

replicateMenu();
