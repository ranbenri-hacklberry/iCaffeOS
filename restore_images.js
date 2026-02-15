
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const supabase = createClient(supabaseUrl, supabaseKey);

const CAFE_IMAGES_DIR = '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/public/cafe-images';

async function restoreImages() {
    console.log('🚀 Starting restoration of original menu images...');

    // 1. Get all files in cafe-images
    const files = fs.readdirSync(CAFE_IMAGES_DIR);
    console.log(`📂 Found ${files.length} files in cafe-images/`);

    // 2. Fetch items with NULL image_url
    const { data: items, error } = await supabase
        .from('menu_items')
        .select('id, name')
        .is('image_url', null);

    if (error) {
        console.error('❌ Error fetching items:', error);
        return;
    }

    console.log(`🍽️ Found ${items.length} items with missing image_url`);

    let restoredCount = 0;

    for (const item of items) {
        // Construct potential filename
        // Pattern: item_{id}_{name}.png (with spaces as underscores)
        const safeName = item.name.replace(/ /g, '_');

        // Try exact match or variations
        const possibleFilenames = [
            `item_${item.id}_${safeName}.png`,
            `item_${item.id}_ ${safeName}.png`, // Sometimes there is a space after ID
            `item_${item.id}__${safeName}.png`, // Sometimes double underscore
            `item_${item.id}_${item.name}.png`
        ];

        let foundFile = null;
        for (const filename of possibleFilenames) {
            if (files.includes(filename)) {
                foundFile = filename;
                break;
            }
        }

        if (foundFile) {
            const imageUrl = `/cafe-images/${foundFile}`;
            console.log(`✅ Matching: "${item.name}" (ID: ${item.id}) -> ${imageUrl}`);

            const { error: updateError } = await supabase
                .from('menu_items')
                .update({ image_url: imageUrl })
                .eq('id', item.id);

            if (updateError) {
                console.error(`❌ Failed to update ${item.id}:`, updateError);
            } else {
                restoredCount++;
            }
        } else {
            console.log(`❓ No match for: "${item.name}" (ID: ${item.id})`);
        }
    }

    console.log(`\n🎉 Restoration complete! Restored ${restoredCount} image URLs.`);
}

restoreImages();
