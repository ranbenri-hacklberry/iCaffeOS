
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function trySql() {
    console.log('🔮 Trying run_sql...');

    // First, try standard run_sql
    const sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
    const { data, error } = await supabase.rpc('run_sql', { sql });

    if (error) {
        console.error('run_sql Error:', error);

        // Try creating the function first using run_sql? No, looping.
        // Try fallback function names seen in history?
        // exec_sql?
        return;
    }

    console.log('Success!', data);
}

trySql();
