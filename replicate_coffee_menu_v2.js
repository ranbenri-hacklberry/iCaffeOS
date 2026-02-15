
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function replicateMenuV2() {
    console.log('🐑 Cloning Coffee Menu (Strict) from Biz 111 to 222 (with Categories)...');

    // 1. Resolve Businesses
    const { data: businesses } = await supabase.from('businesses').select('id');
    const sourceBiz = businesses.find(b => b.id.startsWith('111'));
    const targetBiz = businesses.find(b => b.id.startsWith('222'));

    if (!sourceBiz || !targetBiz) return;

    // 2. Resolve Target Category (Required for Insert)
    // We need to put these items somewhere. Let's find a category named "שתייה חמה" or "קפה" in Target.
    // If not found, create one.

    let targetCategory = 'שתייה חמה';
    const { data: categories } = await supabase.from('categories')
        .select('id, name')
        .eq('business_id', targetBiz.id);

    let targetCatId;
    const match = categories?.find(c => c.name.includes('חמה') || c.name.includes('קפה'));

    if (match) {
        targetCatId = match.id;
        console.log(`✅ Using existing category: ${match.name} (${targetCatId})`);
    } else {
        // Create Category "קפה ושתייה חמה"
        const { data: newCat, error: catErr } = await supabase.from('categories').insert({
            business_id: targetBiz.id,
            name: 'קפה ושתייה חמה',
            display_order: 1
        }).select().single();

        if (catErr) {
            console.error(`❌ Failed to create category: ${catErr.message}`);
            return;
        }
        targetCatId = newCat.id;
        console.log(`✨ Created new category: קפה ושתייה חמה (${targetCatId})`);
    }

    // 3. Identify and FILTER Items Strictly
    // Exclude sandwiches/food
    const includeKeywords = ['הפוך', 'מוקה', 'סחלב', 'שוקו', 'אספרסו', 'מקיאטו', 'אמריקנו', 'נס', 'תה', 'קפה'];
    const excludeKeywords = ['כריך', 'מאפה', 'טוסט', 'סלט']; // Explicit exclusions

    const { data: allSourceItems } = await supabase.from('menu_items')
        .select('*')
        .eq('business_id', sourceBiz.id);

    const sourceItems = allItems.filter(item => {
        const name = item.name.toLowerCase();
        const hasInclude = includeKeywords.some(k => name.includes(k));
        const hasExclude = excludeKeywords.some(k => name.includes(k));
        return hasInclude && !hasExclude;
    });

    console.log(`Found ${sourceItems.length} STRICT items to clone:`, sourceItems.map(i => i.name));

    // 4. Map & Clone Groups (from previous step mostly works, re-run safe)
    const sourceItemIds = sourceItems.map(i => i.id);
    const { data: links } = await supabase.from('menuitemoptions').select('group_id, item_id').in('item_id', sourceItemIds);
    const uniqueSourceGroupIds = [...new Set(links.map(l => l.group_id))];

    const { data: sourceGroups } = await supabase.from('optiongroups')
        .select('*, optionvalues(*)')
        .in('id', uniqueSourceGroupIds);

    const groupMapping = new Map();

    for (const sGroup of sourceGroups || []) {
        console.log(`Processing Group: ${sGroup.name}...`);

        // Find existing in target
        const { data: existingTarget } = await supabase.from('optiongroups')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', sGroup.name) // Match name mainly
            .single();

        let targetGroupId;
        if (existingTarget) {
            targetGroupId = existingTarget.id;
        } else {
            // Create
            const { data: newGroup } = await supabase.from('optiongroups').insert({
                business_id: targetBiz.id,
                name: sGroup.name,
                is_multiple_select: sGroup.is_multiple_select,
                is_required: sGroup.is_required,
                min_selection: sGroup.min_selection,
                max_selection: sGroup.max_selection,
                type: sGroup.type
            }).select().single();
            targetGroupId = newGroup.id;

            // Values
            if (sGroup.optionvalues?.length) {
                const vals = sGroup.optionvalues.map(v => ({
                    group_id: targetGroupId,
                    value_name: v.value_name || v.name,
                    price_adjustment: v.price_adjustment,
                    display_order: v.display_order,
                    is_default: v.is_default
                }));
                await supabase.from('optionvalues').insert(vals);
            }
        }
        groupMapping.set(sGroup.id, targetGroupId);
    }

    // 5. Clone Items using Category ID
    for (const srcItem of sourceItems) {
        console.log(`\n📦 Cloning: ${srcItem.name}...`);

        let targetItemId;
        const { data: existingItem } = await supabase.from('menu_items')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', srcItem.name)
            .single();

        if (existingItem) {
            targetItemId = existingItem.id;
            console.log('   (Exists)');
        } else {
            const { data: newItem, error } = await supabase.from('menu_items').insert({
                business_id: targetBiz.id,
                name: srcItem.name,
                description: srcItem.description,
                price: srcItem.price,
                image: srcItem.image,
                category: targetCatId, // OLD SCHEMA: column is 'category' (text/uuid)
                category_id: targetCatId, // NEW SCHEMA: column is 'category_id'
                // We supply BOTH to be safe if schema transition is midway
                is_instock: true,
                available: true
            }).select().single();

            if (error) {
                // Retry with just 'category' (UUID) if 'category_id' doesn't exist?
                // Or vice versa.
                console.error(`   ❌ Failed: ${error.message}`);
                continue;
            }
            targetItemId = newItem.id;
            console.log(`   ✨ Created Item (${targetItemId})`);
        }

        // Link Modifiers
        const itemLinks = links.filter(l => l.item_id === srcItem.id);
        const uniqueGroups = [...new Set(itemLinks.map(l => l.group_id))];

        for (const srcGid of uniqueGroups) {
            const tgtGid = groupMapping.get(srcGid);
            if (tgtGid) {
                await supabase.from('menuitemoptions').insert({ // Ignore conflict error internally? or check
                    item_id: targetItemId,
                    group_id: tgtGid
                }).catch(() => { }); // catch dupes
            }
        }
    }

    console.log('\n✅ Cloning Complete.');
}

replicateMenuV2();
