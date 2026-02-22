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

const sql = `
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    case_number TEXT NOT NULL,
    title TEXT NOT NULL,
    client_name TEXT,
    status TEXT DEFAULT 'open',
    description TEXT,
    court_date TIMESTAMPTZ,
    assigned_attorney TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    cpu TEXT,
    ram_gb NUMERIC,
    storage_gb NUMERIC,
    os TEXT,
    os_version TEXT,
    status TEXT DEFAULT 'active',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    record_id UUID NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    extraction_method TEXT NOT NULL,
    page_count INT NOT NULL DEFAULT 1,
    char_count INT NOT NULL DEFAULT 0,
    sanitized_text TEXT NOT NULL,
    pii_detected BOOLEAN NOT NULL DEFAULT false,
    masked_entities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function testRpc() {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.log("exec_sql failed:", error.message);
        const { data: d2, error: e2 } = await supabase.rpc('execute_sql', { sql: sql });
        if (e2) {
            console.log("execute_sql failed:", e2.message);
        } else {
            console.log("Success with execute_sql:", d2);
        }
    } else {
        console.log("Success with exec_sql:", data);
    }
}
testRpc();
