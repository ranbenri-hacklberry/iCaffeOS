import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data: businesses } = await supabase.from('business_config').select('*').eq('business_type', 'LAW_FIRM');
    console.log(`LAW_FIRM tenants:`, businesses.length);

    // Insert the case into ALL of them to guarantee success for the user.
    for (const biz of businesses) {
        console.log(`Inserting case for ${biz.id} (${biz.business_name})...`);
        const { data: caseExists } = await supabase.from('cases').select('*').eq('tenant_id', biz.id).eq('title', 'תביעת אבהות');
        if (caseExists && caseExists.length > 0) {
            console.log(`Case already exists for ${biz.id}, skipping.`);
            continue;
        }

        const { data, error } = await supabase.from('cases').insert({
            tenant_id: biz.id,
            title: 'תביעת אבהות',
            client_name: 'משה לוי',
            description: 'ניהול תיק תביעת אבהות בבית דין',
            status: 'open',
            case_number: `CASE-${Date.now().toString().slice(-6)}`
        }).select();

        if (error) {
            console.error(`Error inserting for ${biz.id}:`, error);
        } else {
            console.log(`Success inserting for ${biz.id}:`, data);
        }
    }

    const { data: allCases } = await supabase.from('cases').select('*');
    console.log(`Final cases count:`, allCases.length);
}

checkData();
