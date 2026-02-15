import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUSINESS_ID = '11111111-1111-1111-1111-111111111111'; // "עגלת קפה"
const ITEM_ID = 12; // "הפוך קטן"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkInventoryLink() {
    console.log(`🔍 Checking inventory link for Business: ${BUSINESS_ID}`);

    // 1. Get Recipe
    const { data: recipes } = await supabase.from('recipes').select('id, menu_item_id').eq('menu_item_id', ITEM_ID);
    if (!recipes?.length) {
        console.error('❌ No recipe found.');
        return;
    }
    const recipe = recipes[0];
    console.log(`✅ Found recipe ${recipe.id} for item ${ITEM_ID}`);

    // 2. Get Ingredients and Current Stock
    const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select(`
            inventory_item_id,
            quantity_used,
            inventory_items (
                name,
                current_stock,
                unit
            )
        `)
        .eq('recipe_id', recipe.id);

    if (!ingredients?.length) {
        console.error('❌ No ingredients found.');
        return;
    }

    console.log('Initial Stocks:');
    const initialStocks = ingredients.map(ig => {
        console.log(` - ${ig.inventory_items.name}: Usage: ${ig.quantity_used}, Stock: ${ig.inventory_items.current_stock}`);
        return {
            id: ig.inventory_item_id,
            name: ig.inventory_items.name,
            stock: ig.inventory_items.current_stock
        };
    });

    // 3. Submit Order
    console.log('\n🚀 Submitting test order (submit_order_v3)...');
    const { data: orderResult, error: oError } = await supabase.rpc('submit_order_v3', {
        p_business_id: BUSINESS_ID,
        p_final_total: 10,
        p_order_type: 'dine_in',
        p_payment_method: 'cash',
        p_customer_name: 'Inventory Test Bot',
        p_customer_phone: '0540000000',
        p_items: [{
            item_id: ITEM_ID,
            name: 'הפוך קטן (TEST)',
            price: 10,
            quantity: 1,
            kds_routing_logic: 'MADE_TO_ORDER',
            item_status: 'in_progress'
        }]
    });

    if (oError) {
        console.error('❌ Order submission failed:', oError.message);
        return;
    }
    console.log(`✅ Order submitted! ID: ${orderResult.order_id}`);

    // Wait for triggers
    console.log('Waiting 5 seconds for inventory triggers...');
    await new Promise(r => setTimeout(r, 5000));

    // 4. Check Stock After
    console.log('\n📊 Checking inventory levels after order:');
    const { data: finalIngredients } = await supabase
        .from('recipe_ingredients')
        .select(`
            inventory_item_id,
            inventory_items (
                name,
                current_stock
            )
        `)
        .eq('recipe_id', recipe.id);

    let foundDecrement = false;
    finalIngredients.forEach(ig => {
        const initial = initialStocks.find(s => s.id === ig.inventory_item_id);
        const change = parseFloat(ig.inventory_items.current_stock) - parseFloat(initial.stock);
        console.log(` - ${ig.inventory_items.name}: Stock: ${ig.inventory_items.current_stock} (Initial: ${initial.stock}, Change: ${change})`);
        if (change < 0) foundDecrement = true;
    });

    if (foundDecrement) {
        console.log('\n💪 SUCCESS: Inventory was decremented based on recipe!');
    } else {
        console.log('\n❌ FAILURE: Inventory stock did not change.');
    }

    // cleanup
    await supabase.from('orders').delete().eq('id', orderResult.order_id);
}

checkInventoryLink();
