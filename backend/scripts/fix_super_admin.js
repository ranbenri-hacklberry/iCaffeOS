import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Use cloud Supabase instance (where the user is actually connected)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
}

console.log(`📡 Connecting to: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixSuperAdmin() {
    console.log('🔧 Fixing super admin status for user רני...\n');

    // First, let's check the current status
    const { data: currentData, error: fetchError } = await supabase
        .from('employees')
        .select('id, name, is_super_admin, access_level')
        .eq('id', '37044bfe-20ab-4f17-949f-e6660d7c5cc8')
        .single();

    if (fetchError) {
        console.error('❌ Error fetching user:', fetchError);
        process.exit(1);
    }

    console.log('📊 Current status:', currentData);
    console.log('');

    // Update the super admin flag
    const { data, error } = await supabase
        .from('employees')
        .update({ is_super_admin: true })
        .eq('id', '37044bfe-20ab-4f17-949f-e6660d7c5cc8')
        .select('id, name, is_super_admin, access_level');

    if (error) {
        console.error('❌ Error updating:', error);
        process.exit(1);
    }

    console.log('✅ Successfully updated super admin flag!');
    console.log('📊 New status:', data[0]);
    console.log('');
    console.log('🎉 User רני is now a super admin!');
}

fixSuperAdmin();
