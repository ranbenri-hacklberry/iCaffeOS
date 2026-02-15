
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function applyFixes() {
    console.log('🔧 Fixing Hafuch Katan & Adding Milk to Chocos...');

    const { data: businesses } = await supabase.from('businesses').select('id');
    const biz = businesses.find(b => b.id.startsWith('111'));
    if (!biz) return;

    // 1. Get the Shared "Milk Type" Group (created in previous steps)
    // We expect it to be named 'סוג חלב'
    const { data: milkGroup } = await supabase.from('optiongroups')
        .select('id, name')
        .eq('business_id', biz.id)
        .eq('name', 'סוג חלב')
        .single();

    if (!milkGroup) {
        console.error('❌ CRITICAL: Could not find Shared Milk Group!');
        return;
    }
    console.log(`✅ Found Shared Milk Group: ${milkGroup.id}`);

    // 2. Identify new Target Items for Milk: Sachlav, Choco Katan, Choco Gadol, Choco Pralines
    const targetNames = ['סחלב', 'שוקו קטן', 'שוקו גדול', 'שוקו פרלינים'];
    // We use OR syntax for ilike if possible, or just fetch all and filter in JS
    const { data: allItems } = await supabase.from('menu_items')
        .select('id, name')
        .eq('business_id', biz.id);

    const milkTargets = allItems.filter(i => targetNames.some(t => i.name.includes(t)));
    console.log(`Found ${milkTargets.length} items for Milk addition:`, milkTargets.map(i => i.name));

    // 3. Link Milk to these targets
    for (const item of milkTargets) {
        await linkGroupToItem(item, milkGroup.id, 'Milk');
    }

    // 4. FIX HAFUCH KATAN
    // It should have ALL groups: Milk, Foam, Strength, Temp, Caffeine, Serving, Base.
    const hafuchKatan = allItems.find(i => i.name.includes('הפוך קטן'));
    if (hafuchKatan) {
        console.log(`\n🔧 Verifying Hafuch Katan (${hafuchKatan.id})...`);

        // Fetch all shared groups we created recently
        const wantedGroupNames = ['סוג חלב', 'חוזק', 'קצף', 'טמפרטורה', 'קפאין', 'הגשה', 'בסיס'];

        const { data: allSharedGroups } = await supabase.from('optiongroups')
            .select('id, name')
            .eq('business_id', biz.id)
            .in('name', wantedGroupNames)
            .is('menu_item_id', null); // Ensure they are shared

        for (const gName of wantedGroupNames) {
            const g = allSharedGroups.find(x => x.name === gName);
            if (!g) {
                console.warn(`   ⚠️ Warning: Could not find shared group '${gName}' in DB.`);
                continue;
            }
            await linkGroupToItem(hafuchKatan, g.id, gName);
        }
    } else {
        console.error('❌ Could not find "Hafuch Katan"');
    }

    console.log('\n✅ Operations Complete.');
}

async function linkGroupToItem(item, groupId, label) {
    const { data: existing } = await supabase.from('menuitemoptions')
        .select('*')
        .eq('item_id', item.id)
        .eq('group_id', groupId)
        .single();

    if (!existing) {
        const { error } = await supabase.from('menuitemoptions').insert({
            item_id: item.id,
            group_id: groupId
        });
        if (error) console.error(`   ❌ Failed linking ${label} -> ${item.name}: ${error.message}`);
        else console.log(`   🔗 Linked ${label} -> ${item.name}`);
    } else {
        console.log(`   (Already Linked) ${label} -> ${item.name}`);
    }
}

applyFixes();
