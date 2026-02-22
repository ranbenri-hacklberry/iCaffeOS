require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Constants
const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';
let GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.VITE_LOCAL_SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('Environment Debug:', {
        hasGemini: !!GEMINI_API_KEY,
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY
    });
    console.error('❌ Missing environment variables. Make sure .env is loaded');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Define categories to create
const CATEGORIES = [
    { name: 'שתיה חמה', sort_order: 10, display_type: 'grid' },
    { name: 'שתיה קרה', sort_order: 20, display_type: 'grid' },
    { name: 'סלטים', sort_order: 30, display_type: 'list' },
    { name: 'קינוחים', sort_order: 40, display_type: 'grid' }
];

// Define standard options we want to attach (like size mapping)
// Realistically, the options/modifiers are usually more complex, but we'll create simple items if they don't exist

const MENU_ITEMS = [
    // שתיה חמה
    { category_name: 'שתיה חמה', name: 'אספרסו קצר', price: 9, description: 'אספרסו קלאסי עשיר', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A small cup of rich dark espresso coffee with thick crema.' },
    { category_name: 'שתיה חמה', name: 'אספרסו ארוך', price: 10, description: 'אספרסו ארוך עדין', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A medium cup of rich dark espresso with crema.' },
    { category_name: 'שתיה חמה', name: 'אספרסו כפול קצר', price: 11, description: 'מנת כפולה של אספרסו חזק', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A double shot of espresso in a small elegant cup.' },
    { category_name: 'שתיה חמה', name: 'אספרסו כפול ארוך', price: 12, description: 'אספרסו כפול עם מים חמים', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A double shot of espresso served long in a slightly larger cup.' },
    { category_name: 'שתיה חמה', name: 'קפוצ׳ינו קטן', price: 13, description: 'אספרסו עם חלב מוקצף חלק', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A small cappuccino in a premium disposable cup with beautiful latte art.' },
    { category_name: 'שתיה חמה', name: 'קפוצ׳ינו גדול', price: 16, description: 'הקפוצ׳ינו הקלאסי בכוס גדולה', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A large cappuccino in a premium disposable cup with rich milk foam.' },
    { category_name: 'שתיה חמה', name: 'מקיאטו', price: 11, description: 'אספרסו מוכתם בקצף חלב', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A small espresso cup with a dollop of milk foam on top.' },
    { category_name: 'שתיה חמה', name: 'קורטדו', price: 12, description: 'חלוקה שווה של אספרסו וחלב', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'Cortado coffee served in a small glass cup.' },
    { category_name: 'שתיה חמה', name: 'לאטה מקיאטו', price: 14, description: 'כוס חלב חמה מוכתמת באספרסו', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'Latte macchiato in a clear tall glass, showing distinct layers of milk, espresso, and foam.' },

    // שתיה קרה
    { category_name: 'שתיה קרה', name: 'קפה קר', price: 15, description: 'קפה איכותי ומרענן על בסיס חלב', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A tall clear disposable plastic cup filled with iced latte, coffee mingling with milk, lots of ice cubes.' },
    { category_name: 'שתיה קרה', name: 'שוקו קר', price: 16, description: 'משקה שוקולד קר קטיפתי', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A clear plastic cup of rich iced chocolate, garnished with a sprinkle of cocoa powder.' },
    { category_name: 'שתיה קרה', name: 'אייסקפה', price: 18, description: 'קפה קר עשיר, מתוק ומרענן', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A tall cold iced coffee frappuccino style in a clear dome cup with a straw.' },
    { category_name: 'שתיה קרה', name: 'לימונדה', price: 14, description: 'לימונדה קרה ומרעננת סחוטה במקום', is_active: true, kds_routing_logic: { routeTo: "ColdDrinks" }, prompt: 'A tall clear glass of fresh iced lemonade with lemon slices and mint leaves.' },
    { category_name: 'שתיה קרה', name: 'תפוזים סחוט', price: 16, description: 'מיץ תפוזים סחוט טבעי', is_active: true, kds_routing_logic: { routeTo: "ColdDrinks" }, prompt: 'A glass of fresh squeezed orange juice, vibrant orange color.' },
    { category_name: 'שתיה קרה', name: 'סודה', price: 10, description: 'מי סודה מחביות מוגזים', is_active: true, kds_routing_logic: { routeTo: "ColdDrinks" }, prompt: 'A glass of sparkling soda water with ice and a lemon wedge popping with bubbles.' },
    { category_name: 'שתיה קרה', name: 'חליטת פירות יער', price: 15, description: 'חליטה קרה ומתקתקה של פירות יער', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A clear glass of bright red iced berry tea with ice cubes and floating berries.' },
    { category_name: 'שתיה קרה', name: 'חליטת לימונית ולואיזה', price: 15, description: 'מרענן וטבעי', is_active: true, kds_routing_logic: { routeTo: "Baristi" }, prompt: 'A cold refreshing herbal tea infustion in a glass cup, light green color.' },

    // סלטים
    { category_name: 'סלטים', name: 'סלט קיסר', price: 42, description: 'חסה פריכה, קרוטונים, פרמזן ורוטב קיסר קרוי', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A beautiful fresh Caesar salad in a rustic bowl with croutons and shaved parmesan.' },
    { category_name: 'סלטים', name: 'סלט רוקפור ופקאן', price: 46, description: 'עלי בייבי, תפוח ירוק, אגוזי פקאן וגבינת רוקפור', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A gourmet salad featuring crisp greens, sliced green apples, candied pecans, and crumbled Roquefort blue cheese.' },
    { category_name: 'סלטים', name: 'סלט שוק איכרים', price: 44, description: 'מלפפון, עגבניה, בצל סגול, זיתי קלמטה וטחינה', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A colorful Mediterranean farmers salad with diced tomatoes, cucumbers, red onions, and kalamata olives.' },
    { category_name: 'סלטים', name: 'סלט קינואה ובטטה', price: 48, description: 'קינואה לבנה, קוביות בטטה צלויות, חמוציות ועשבי תיבול', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A healthy quinoa salad bowl topped with roasted sweet potato cubes and fresh herbs.' },
    { category_name: 'סלטים', name: 'סלט חלומי צרוב', price: 52, description: 'קוביות חלומי צרובות על מצע חסה מתוקה ועגבניות שרי', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A fresh salad topped with golden grilled halloumi cheese squares.' },
    { category_name: 'סלטים', name: 'סלט עדשים שחורות', price: 44, description: 'עדשים שחורות טעימות עם בולגרית ונענע', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A nutritious black lentil salad with crumbled feta cheese and fresh mint leaves.' },
    { category_name: 'סלטים', name: 'סלט קפרזה', price: 40, description: 'מוצרלה פרסקה, עגבניות, בזיליקום ובלסמי', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A classic Italian Caprese salad with thick slices of ripe red tomatoes, fresh mozzarella, and aromatic basil leaves.' },
    { category_name: 'סלטים', name: 'סלט ירוק מרענן', price: 38, description: 'עלי רוקט, סלרי, תפוח עץ ושקדים טלויים', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A vibrant green salad with arugula, sliced green apples, and toasted sliced almonds.' },

    // קינוחים
    { category_name: 'קינוחים', name: 'טירמיסו', price: 34, description: 'הקינוח האיטלקי הקלאסי', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A rich classic Italian tiramisu layered dessert dusted generously with cocoa powder.' },
    { category_name: 'קינוחים', name: 'עוגת גבינה', price: 36, description: 'עוגת גבינה אפויה עשירה', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A pristine slice of baked New York style cheesecake with a golden crust.' },
    { category_name: 'קינוחים', name: 'טראפלים', price: 28, description: '4 יחידות טראפלס שוקולד מריר עשיר', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'Four dark chocolate truffles dusted in fine cocoa powder on a small elegant plate.' },
    { category_name: 'קינוחים', name: 'סופלה שוקולד', price: 38, description: 'סופלה חם ונמס מבפנים', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A warm flowing chocolate lava cake dessert on a plate, rich and gooey.' },
    { category_name: 'קינוחים', name: 'פנקוטה', price: 32, description: 'פנקוטה וניל עם רוטב פירות יער', is_active: true, kds_routing_logic: { routeTo: "Kitchen" }, prompt: 'A smooth creamy vanilla panna cotta dessert topped with vibrant red berry coulis.' }
];

async function generateWithGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`;

    // Simple direct image generation prompt
    const finalPrompt = `Professional food photography, studio lighting. DO NOT include text unless essential. Minimal pure white or dark cafe table background. THE DISH: ${prompt}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
            responseModalities: ["IMAGE"]
        }
    };

    try {
        const response = await axios.post(url, payload);
        const candidates = response?.data?.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts || [];
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (error) {
        console.error('❌ Gemini Error on generation:', error.response?.data?.error?.message || error.message);
    }
    return null;
}

// Ensure categories mapping, insert missing ones
async function ensureCategories() {
    console.log('Fetching existing categories...');
    const { data: existing, error } = await supabase.from('item_category').select('*').eq('business_id', BUSINESS_ID);
    if (error) {
        console.error('Error fetching categories:', error);
        return {};
    }

    const catMap = {};
    for (const cat of existing) {
        catMap[cat.name] = cat.id;
    }

    // Insert missing categories
    for (const c of CATEGORIES) {
        if (!catMap[c.name]) {
            console.log(`Inserting category: ${c.name}`);
            const { data, error: insErr } = await supabase.from('item_category').insert({
                business_id: BUSINESS_ID,
                name: c.name
            }).select().single();

            if (data) {
                catMap[data.name] = data.id;
            } else if (insErr) {
                console.error('Error inserting cat:', insErr);
            }
        }
    }

    return catMap;
}


async function runInject() {
    console.log(`Starting to inject menu items for business ${BUSINESS_ID}`);

    // Hardcoded key for local/remote reliability
    GEMINI_API_KEY = 'AIzaSyAIsebB1FdlPXyUsFCB6ZNTaDLV2JgEquA';
    console.log('Using verified Gemini API key');

    const catMap = await ensureCategories();

    for (const item of MENU_ITEMS) {
        const catId = catMap[item.category_name];
        if (!catId) {
            console.warn(`Category not found for ${item.name} (${item.category_name})`);
            continue;
        }

        // Check if item exists
        const { data: existingItem } = await supabase.from('menu_items')
            .select('*')
            .eq('business_id', BUSINESS_ID)
            .eq('name', item.name)
            .maybeSingle();

        let itemId;
        let requiresImageUpdate = false;

        if (existingItem) {
            console.log(`Item exists: ${item.name}`);
            itemId = existingItem.id;
            // if no image, update it
            if (!existingItem.image_url) requiresImageUpdate = true;
        } else {
            console.log(`Inserting new item: ${item.name}`);
            const insertData = {
                business_id: BUSINESS_ID,
                category: item.category_name,
                name: item.name,
                price: item.price,
                description: item.description,
                kds_routing_logic: item.kds_routing_logic,
            };

            const { data: newlyCreated, error: cErr } = await supabase.from('menu_items')
                .insert(insertData).select().single();

            if (cErr) {
                console.error(`Error inserting ${item.name}:`, cErr.message);
                continue;
            }
            if (newlyCreated) {
                itemId = newlyCreated.id;
                requiresImageUpdate = true;
            }
        }

        // Generation step
        if (requiresImageUpdate) {
            console.log(`🎨 Generating image for ${item.name}...`);
            const imageBase64 = await generateWithGemini(item.prompt);

            if (imageBase64) {
                console.log(`✅ Image generated. Saving to database...`);
                await supabase.from('menu_items').update({ image_url: imageBase64 }).eq('id', itemId);
                console.log(`✨ Saved image for ${item.name}`);
            } else {
                console.log(`❌ Failed to generate image for ${item.name}`);
            }

            // Rate limit wait
            console.log('Sleeping 3s...');
            await new Promise(r => setTimeout(r, 3000));
        }

    }

    console.log('Done!');
}

runInject();
