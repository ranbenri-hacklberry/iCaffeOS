import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing credentials. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY are set in your local .env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSqlFile(filePath) {
    console.log(`🚀 Running SQL from: ${filePath}`);
    try {
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        // Split by semicolon (naive approach, but often works for functions)
        // OR simpler: Supabase JS library doesn't support raw SQL execution directly via client unless you wrap it in an RPC or use the postgres connection string.
        // However, we often have a 'exec_sql' RPC in these projects. Let's try that first.

        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        // If exec_sql doesn't exist, we might fail here. 
        // Fallback: If no exec_sql RPC, we cannot easily run raw SQL from client without postgres connection.
        // We will assume 'exec_sql' exists as it's common in these setups, or 'run_sql'.

        if (error) {
            console.warn('⚠️ Standard RPC exec_sql failed:', error.message);
            console.log('Trying direct PG connection might be needed if RPC is missing.');
            return;
        }

        console.log('✅ SQL Triggered successfully.');
        console.log(data);

    } catch (err) {
        console.error('❌ File Read/Exec Error:', err);
    }
}

// Get file from args
const targetFile = process.argv[2];
if (!targetFile) {
    console.error('Please provide a SQL file path.');
    process.exit(1);
}

runSqlFile(targetFile);
