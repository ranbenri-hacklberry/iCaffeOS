import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCase() {
    console.log("Connecting to Supabase...");
    console.log(`URL: ${supabaseUrl}`);

    // We need to find the LAW_FIRM business
    const { data: lawFirm, error: bizError } = await supabase
        .from('business_config')
        .select('id')
        .eq('business_type', 'LAW_FIRM')
        .limit(1)
        .single();

    if (bizError || !lawFirm) {
        console.error("Could not find a LAW_FIRM business:", bizError);
        return;
    }

    console.log(`Found LAW_FIRM business ID: ${lawFirm.id}`);

    // Delete weird cases
    const { error: delError } = await supabase
        .from('cases')
        .delete()
        .eq('tenant_id', lawFirm.id)
        .not('title', 'eq', 'תביעת אבהות');

    if (delError) {
        console.error("Error deleting old cases:", delError);
    } else {
        console.log("Deleted old random cases.");
    }

    // Check if target case exists
    const { data: existingCases, error: getError } = await supabase
        .from('cases')
        .select('id')
        .eq('tenant_id', lawFirm.id)
        .eq('title', 'תביעת אבהות');

    if (existingCases && existingCases.length > 0) {
        console.log("Case 'תביעת אבהות' already exists. ID:", existingCases[0].id);
        return;
    }

    const { data: newCase, error: insertError } = await supabase
        .from('cases')
        .insert([
            {
                tenant_id: lawFirm.id,
                title: 'תביעת אבהות',
                client_name: 'משה לוי',
                description: 'ניהול תיק תביעת אבהות בבית דין',
                status: 'open',
                case_number: `CASE-${Date.now().toString().slice(-6)}`
            }
        ])
        .select()
        .single();

    if (insertError) {
        console.error("Error inserting case:", insertError);
    } else {
        console.log("Successfully inserted case:", newCase.title, "ID:", newCase.id);
    }
}

addCase();
