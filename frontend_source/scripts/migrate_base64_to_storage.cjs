
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BIZ_ID = '8e4e05da-2d99-4bd9-aedf-8e54cbde930a';
const BUCKET_NAME = 'menu-images';

async function run() {
    console.log('🚀 Starting Robust Migration of Base64 images...\n');

    // 1. Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets || !buckets.find(b => b.name === BUCKET_NAME)) {
        console.log(`📦 Creating bucket: ${BUCKET_NAME}`);
        await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    }

    // 2. Fetch IDs of items that potentially have base64 images
    const { data: itemIds, error } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('business_id', BIZ_ID);

    if (error) {
        console.error('❌ Error fetching item IDs:', error.message);
        return;
    }

    console.log(`🔍 Checking ${itemIds.length} items...`);

    for (const item of itemIds) {
        // Fetch image_url separately for this specific item to avoid timeout
        const { data: itemData, error: fetchErr } = await supabase
            .from('menu_items')
            .select('image_url')
            .eq('id', item.id)
            .single();

        if (fetchErr || !itemData.image_url || !itemData.image_url.startsWith('data:image/')) {
            // console.log(`⏩ Skipping ${item.name} (No base64 image)`);
            continue;
        }

        try {
            console.log(`⬆️ Migrating image for: ${item.name}`);
            const base64Parts = itemData.image_url.split(';base64,');
            if (base64Parts.length < 2) continue;

            const base64Data = base64Parts.pop();
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `${BIZ_ID}/${item.id}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, buffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (uploadError) {
                console.error(`   ❌ Upload failed:`, uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('menu_items')
                .update({ image_url: publicUrl })
                .eq('id', item.id);

            if (updateError) {
                console.error(`   ❌ DB Update failed:`, updateError.message);
            } else {
                console.log(`   ✅ Success!`);
            }
        } catch (err) {
            console.error(`   ❌ Unexpected error for ${item.name}:`, err.message);
        }
    }

    console.log('\n🏁 Global migration complete!');
}

run();
