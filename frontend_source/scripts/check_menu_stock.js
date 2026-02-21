
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load ecosystem variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.LOCAL_SUPABASE_URL || process.env.VITE_LOCAL_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.VITE_LOCAL_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Configuration. Please check .env or .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMenuStock() {
    console.log('🔍 Checking Menu Items with Inventory Logic...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);

    // 1. Get all menu items
    const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, category, is_prep_required')
        .order('name');

    if (menuError) {
        console.error('❌ Error fetching menu items:', menuError);
        return;
    }

    console.log(`✅ Found ${menuItems.length} menu items.`);

    // 2. Get all recipes
    const { data: recipes, error: recipeError } = await supabase
        .from('recipes')
        .select('id, menu_item_id');

    if (recipeError) {
        console.error('❌ Error fetching recipes:', recipeError);
        // Check if table exists
        if (recipeError.code === '42P01') console.error('⚠️ "recipes" table does not exist!');
        return;
    }

    // Check inventory items count
    const { count: inventoryCount, error: invError } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

    if (invError) {
        console.error('❌ Error checking inventory_items:', invError);
    } else {
        console.log(`✅ Found ${inventoryCount} inventory items in database.`);
        if (inventoryCount > 0 && recipes.length === 0) {
            const { data: sampleInv } = await supabase.from('inventory_items').select('name').limit(5);
            console.log('Sample inventory items:', sampleInv.map(i => i.name).join(', '));
        }
    }

    console.log(`✅ Found ${recipes.length} recipes.`);
    if (recipes.length > 0) {
        console.log(`Sample recipe:`, recipes[0]);
        console.log(`Sample menu item ID:`, menuItems[0]?.id);
    }

    // Map recipes to items
    const start = Date.now();
    let itemsWithinventory = 0;

    console.log('\n📦 Inventory Report:\n');
    console.log('--------------------------------------------------------------------------------');
    console.log(pad('Menu Item', 30) + ' | ' + pad('Ingredient', 25) + ' | ' + pad('Req', 8) + ' | ' + pad('Stock', 8) + ' | Status');
    console.log('--------------------------------------------------------------------------------');

    for (const item of menuItems) {
        // Find recipe
        const recipe = recipes.find(r => r.menu_item_id === item.id);

        if (recipe) {
            itemsWithinventory++;
            // Fetch ingredients for this recipe
            const { data: ingredients, error: ingError } = await supabase
                .from('recipe_ingredients')
                .select('quantity, inventory_item_id, inventory_items(name, stock_quantity, unit)')
                .eq('recipe_id', recipe.id);

            if (ingError) {
                console.error(`Error fetching ingredients for ${item.name}:`, ingError);
                continue;
            }

            if (ingredients && ingredients.length > 0) {
                // Determine item status
                let canMake = true;
                let firstLine = true;

                for (const ing of ingredients) {
                    const itemName = firstLine ? item.name : '';
                    const invItem = ing.inventory_items;
                    const required = ing.quantity;
                    const current = invItem ? invItem.stock_quantity : 0;
                    const unit = invItem ? invItem.unit : '?';
                    const invName = invItem ? invItem.name : `Unknown (${ing.inventory_item_id})`;

                    const status = (current >= required) ? '✅ OK' : '❌ LOW';
                    if (current < required) canMake = false;

                    console.log(
                        pad(itemName, 30) + ' | ' +
                        pad(invName, 25) + ' | ' +
                        pad(`${required} ${unit}`, 8) + ' | ' +
                        pad(`${current} ${unit}`, 8) + ' | ' + status
                    );
                    firstLine = false;
                }
                console.log(pad('', 80, '-')); // Separator
            } else {
                console.log(pad(item.name, 30) + ' | ' + pad('(No Ingredients Defined)', 25) + ' | ' + pad('-', 8) + ' | ' + pad('-', 8) + ' | ⚠️ Empty Recipe');
                console.log(pad('', 80, '-'));
            }
        }
    }

    console.log(`\n✅ Checked ${itemsWithinventory} items with recipes out of ${menuItems.length} total items.`);
}

function pad(str, len, char = ' ') {
    str = String(str || '');
    if (str.length >= len) return str.substring(0, len - 1) + '…';
    return str + char.repeat(len - str.length);
}

checkMenuStock();
