
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function replicateStringCategory() {
    console.log('🚀 Cloning to Business 222 (Using String Category)...');

    const { data: businesses } = await supabase.from('businesses').select('id');
    const sourceBiz = businesses.find(b => b.id.startsWith('111'));
    const targetBiz = businesses.find(b => b.id.startsWith('222'));

    // Target Category Name
    const TARGET_CAT = 'שתייה חמה';

    // Filter Items
    const INCLUDE = ['הפוך', 'מוקה', 'סחלב', 'שוקו', 'אספרסו', 'מקיאטו', 'אמריקנו', 'נס', 'תה', 'קפה'];
    const EXCLUDE = ['כריך', 'טוסט', 'סלט', 'מאפה'];

    const { data: allSource } = await supabase.from('menu_items').select('*').eq('business_id', sourceBiz.id);
    const itemsToClone = allSource.filter(i => {
        const name = i.name;
        if (EXCLUDE.some(ex => name.includes(ex))) return false;
        return INCLUDE.some(inc => name.includes(inc));
    });

    console.log(`Cloning ${itemsToClone.length} items to Category: "${TARGET_CAT}"`);

    // Group Mapping Cache
    const groupMap = new Map();

    for (const item of itemsToClone) {
        console.log(`\n📦 ${item.name}...`);

        // Check if exists
        const { data: exists } = await supabase.from('menu_items')
            .select('id')
            .eq('business_id', targetBiz.id)
            .eq('name', item.name)
            .single();

        let newItemId;
        if (exists) {
            console.log('   (Exists)');
            newItemId = exists.id;
        } else {
            const { data: created, error } = await supabase.from('menu_items').insert({
                business_id: targetBiz.id,
                category: TARGET_CAT, // STRING!
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image
            }).select().single();

            if (error) {
                console.error(`   ❌ Insert failed: ${error.message}`);
                continue;
            }
            newItemId = created.id;
            console.log(`   ✨ Created Item (${newItemId})`);
        }

        // Clone Modifiers
        const { data: links } = await supabase.from('menuitemoptions').select('group_id').eq('item_id', item.id);
        const gIds = links.map(l => l.group_id);

        if (gIds.length === 0) continue;

        const { data: groups } = await supabase.from('optiongroups').select('*, optionvalues(*)').in('id', gIds);

        for (const grp of groups || []) {
            let targetGid = groupMap.get(grp.id);
            if (!targetGid) {
                // Check existing by name in Target
                const { data: ex } = await supabase.from('optiongroups').select('id').eq('business_id', targetBiz.id).eq('name', grp.name).single();
                if (ex) {
                    targetGid = ex.id;
                } else {
                    // Create Group
                    const { data: nG, error: gErr } = await supabase.from('optiongroups').insert({
                        business_id: targetBiz.id,
                        name: grp.name,
                        is_multiple_select: grp.is_multiple_select,
                        is_required: grp.is_required,
                        type: grp.type
                    }).select().single();

                    if (nG) {
                        targetGid = nG.id;
                        // Values
                        if (grp.optionvalues) {
                            const vals = grp.optionvalues.map(v => ({
                                group_id: targetGid,
                                value_name: v.value_name || v.name,
                                price_adjustment: v.price_adjustment,
                                display_order: v.display_order,
                                is_default: v.is_default
                            }));
                            await supabase.from('optionvalues').insert(vals);
                        }
                    } else if (gErr) {
                        console.error(`   ❌ Group create failed: ${gErr.message}`);
                    }
                }
                if (targetGid) groupMap.set(grp.id, targetGid);
            }

            // Link
            if (targetGid) {
                const { error: lErr } = await supabase.from('menuitemoptions').insert({
                    item_id: newItemId,
                    group_id: targetGid
                });
                if (!lErr) console.log(`   🔗 Linked ${grp.name}`);
                else if (!lErr.message.includes('duplicate')) console.log(`   ⚠️ Link err: ${lErr.message}`);
            }
        }
    }
    console.log('✅ Done.');
}

replicateStringCategory();
