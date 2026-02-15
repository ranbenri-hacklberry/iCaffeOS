
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log('🕵️‍♀️ Inspecting Schema via RPC...');

    const sql = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'menu_items'
    `;

    const { data, error } = await supabase.rpc('run_sql_command_v2', { sql });

    if (error) {
        console.error('RPC Error:', error);
        // Fallback: maybe function is named differently?
        // Tried checking list earlier.
        return;
    }

    // RPC returns void usually if defined as RETURNS VOID.
    // Ah, wait. run_sql_command_v2 returns VOID! It EXECUTES but doesn't return result set.
    // I need a function that returns TABLE or JSON.

    // Let's TRY to create a function that returns json?
    // "CREATE OR REPLACE FUNCTION run_sql_ret_json(sql text) RETURNS json ..."
    // But I can't create functions if I can't run SQL... catch-22 unless I have a runner.
    // But I DO have run_sql_command_v2. I can use it to CREATE a better runner!

    console.log('Upgrading SQL Runner...');
    const createRunnerSQL = `
        CREATE OR REPLACE FUNCTION run_sql_returning_json(sql text) 
        RETURNS jsonb 
        LANGUAGE plpgsql 
        SECURITY DEFINER 
        AS $$
        DECLARE
            json_result jsonb;
        BEGIN
            EXECUTE 'SELECT jsonb_agg(t) FROM (' || sql || ') t' INTO json_result;
            RETURN json_result;
        END;
        $$;
    `;

    const { error: upgradeErr } = await supabase.rpc('run_sql_command_v2', { sql: createRunnerSQL });
    if (upgradeErr) {
        console.error('Upgrade Failed:', upgradeErr);
        return;
    }
    console.log('✅ Runner Upgraded! Fetching Columns...');

    const { data: cols, error: colErr } = await supabase.rpc('run_sql_returning_json', { sql });
    if (colErr) console.error('Column Fetch Error:', colErr);
    else console.log('Columns:', JSON.stringify(cols, null, 2));

    // Also check tables again
    const sqlTables = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    const { data: tables, error: tabsErr } = await supabase.rpc('run_sql_returning_json', { sql: sqlTables });
    if (tabsErr) console.error('Table Fetch Error:', tabsErr);
    else console.log('Tables:', JSON.stringify(tables, null, 2));

}

inspect();
