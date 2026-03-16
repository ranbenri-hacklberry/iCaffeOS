const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = '/Users/user/.gemini/antigravity/scratch/onlinestore/.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_BIZ_ID = '22222222-2222-2222-2222-222222222222';

async function runInhibitionTest() {
    console.log('🧪 Starting Inhibition Logic Test...');

    // 1. Setup Test Data
    console.log('--- 1. Setting up test data ---');

    // A. Create/Ensure Inventory Items
    const { data: invItems, error: invError } = await supabase
        .from('inventory_items')
        .upsert([
            { id: 9001, name: 'חלב רגיל (טסט)', business_id: TEST_BIZ_ID, current_stock: 10, unit: 'L' },
            { id: 9002, name: 'חלב סויה (טסט)', business_id: TEST_BIZ_ID, current_stock: 10, unit: 'L' }
        ], { onConflict: 'id' }).select();

    if (invError) { console.error('Inv Setup Error:', invError); return; }
    console.log('✅ Inventory items established.');

    // B. Create/Ensure Menu Item
    const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .upsert([
            { id: 9001, name: 'קפוצ׳ינו טסט', business_id: TEST_BIZ_ID, price: 12, is_deleted: false }
        ], { onConflict: 'id' }).select();

    if (menuError) { console.error('Menu Setup Error:', menuError); return; }
    console.log('✅ Menu item established.');

    // C. Create/Ensure Recipe
    const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .upsert([{ id: 9001, menu_item_id: 9001, business_id: TEST_BIZ_ID }], { onConflict: 'id' }).select();

    if (recipeError) { console.error('Recipe Error:', recipeError); return; }

    await supabase.from('recipe_ingredients').upsert([
        { recipe_id: 9001, inventory_item_id: 9001, quantity_used: 0.2 } // 200ml regular milk
    ], { onConflict: 'recipe_id, inventory_item_id' });
    console.log('✅ Recipe (Regular Milk) established.');

    // 2. Initial Stock Check
    const { data: stockBefore } = await supabase.from('inventory_items').select('id, current_stock').in('id', [9001, 9002]);
    const regBefore = stockBefore.find(i => i.id === 9001).current_stock;
    const soyBefore = stockBefore.find(i => i.id === 9002).current_stock;
    console.log(`📊 Initial Stock: Regular=${regBefore}, Soy=${soyBefore}`);

    // 3. Submit Order with Soy Milk (Inhibitor)
    console.log('--- 3. Submitting order with Soy Milk modifier ---');
    const modSoy = {
        id: 'soy-mod-id',
        name: 'חלב סויה',
        inventory_item_id: 9002,
        quantity: 0.2, // uses 200ml soy
        inhibits_ingredient_id: 9001 // <--- THE MAGIC KEY
    };

    const payload = {
        p_business_id: TEST_BIZ_ID,
        p_customer_name: 'Test Customer',
        p_items: [{
            item_id: 9001,
            quantity: 1,
            price: 13,
            mods: [modSoy]
        }],
        p_is_paid: true,
        p_payment_method: 'cash'
    };

    const { data: orderResult, error: orderError } = await supabase.rpc('submit_order_v3', payload);
    if (orderError) { console.error('Order Submission Error:', orderError); return; }
    console.log('✅ Order submitted successfully. Order ID:', orderResult.order_id);

    // 4. Final Stock Check
    console.log('--- 4. Checking final stock levels ---');
    const { data: stockAfter } = await supabase.from('inventory_items').select('id, current_stock').in('id', [9001, 9002]);
    const regAfter = stockAfter.find(i => i.id === 9001).current_stock;
    const soyAfter = stockAfter.find(i => i.id === 9002).current_stock;

    console.log(`📊 Final Stock: Regular=${regAfter}, Soy=${soyAfter}`);

    // 5. Verification
    const regDiff = regBefore - regAfter;
    const soyDiff = soyBefore - soyAfter;

    console.log('\n🔍 VERIFICATION RESULTS:');
    if (regDiff === 0) {
        console.log('✅ SUCCESS: Regular Milk was INHIBITED (0 change).');
    } else {
        console.log(`❌ FAILURE: Regular Milk was deducted by ${regDiff}.`);
    }

    if (soyDiff > 0) {
        console.log(`✅ SUCCESS: Soy Milk was DEDUCTED (Changed by ${soyDiff}).`);
    } else {
        console.log('❌ FAILURE: Soy Milk was NOT deducted.');
    }

    console.log('\n🧪 Test Finished.');
}

runInhibitionTest();
