import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addTestUser() {
    console.log('Adding test user for Maya Gateway...');

    // Check if user already exists to avoid duplicates
    const { data: existingUser } = await supabase
        .from('employees')
        .select('*')
        .eq('name', 'Danny Test')
        .eq('business_id', '22222222-2222-2222-2222-222222222222')
        .single();

    if (existingUser) {
        console.log('⚠️ Test user "Danny Test" already exists:', existingUser.id);
        return;
    }

    const { data, error } = await supabase
        .from('employees')
        .insert([
            {
                name: 'Danny Test',
                access_level: 'Worker',
                pin_hash: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn98Wu3t4L2alHYpIp/6HVMQEwhi', // PIN: 1234
                business_id: '22222222-2222-2222-2222-222222222222'
            }
        ])
        .select();

    if (error) {
        console.error('❌ Error adding user:', error);
    } else {
        console.log('✅ User "Danny Test" added successfully:', data[0]);
    }
}

addTestUser();
