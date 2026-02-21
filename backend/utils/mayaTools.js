import { createClient } from '@supabase/supabase-js';
import pkg from 'node-sql-parser';
const { Parser } = pkg;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize SQL Parser
const parser = new Parser();

/**
 * Executes a read-only SQL query against the Supabase database.
 * Uses node-sql-parser to strictly enforce SELECT-only statements.
 * @param {string} sqlQuery The raw SQL query to execute.
 * @returns {Promise<object>} The query result or a user-friendly error message.
 */
export async function runSafeQuery(sqlQuery) {
    if (!supabase) {
        return { error: 'Database connection not unavailable.' };
    }

    try {
        // 1. Strict SQL parsing to ensure read-only safety
        let ast;
        try {
            // Trim and remove trailing semicolon for parsing if needed, though parser handles it
            const cleanQuery = sqlQuery.trim();
            ast = parser.astify(cleanQuery);
        } catch (parseError) {
            return { error: `I couldn't understand that SQL query. It might have a syntax error: ${parseError.message}` };
        }

        // 2. Validate AST for dangerous operations
        // ast can be a single object or an array of objects
        const statements = Array.isArray(ast) ? ast : [ast];

        for (const stmt of statements) {
            if (stmt.type !== 'select') {
                return {
                    error: `⚠️ Unity Security Alert: I cannot execute '${stmt.type.toUpperCase()}' statements. I am restricted to read-only access (SELECT) for your safety.`
                };
            }
        }

        // 3. Execute the safe query using Supabase RPC or direct connection if available.
        // Since supabase-js client doesn't support raw SQL directly without RPC, we assume an RPC function 'exec_sql' exists
        // OR we use the PostgREST text search / filter features if possible, but for raw SQL we ideally need an RPC.
        // Let's assume an 'exec_read_only_sql' RPC function is available on the backend for Super Admins.

        // Fallback: If no RPC, we can't run raw SQL easily with just the JS client unless we use specific table methods.
        // However, for the purpose of this "Architect" task, we'll assume the RPC exists or simulate it.
        // Implementation Detail: You MUST create this RPC in Supabase:
        // CREATE OR REPLACE FUNCTION exec_read_only_sql(query text) RETURNS json AS $$ BEGIN RETURN query_to_json(query); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

        const { data, error } = await supabase.rpc('exec_read_only_sql', { query: sqlQuery });

        if (error) {
            // Heuristic for table not found to be friendly
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                return { error: "I couldn't find that table. Would you like me to list the available tables for you?" };
            }
            return { error: `Database Error: ${error.message}` };
        }

        return {
            success: true,
            result: data,
            rowCount: Array.isArray(data) ? data.length : 0
        };

    } catch (err) {
        return { error: `System Error during query execution: ${err.message}` };
    }
}

/**
 * Retrieves the database schema (tables and columns) to provide Maya with context.
 * Useful for constructing accurate SQL queries.
 * @returns {Promise<object>} A summary of tables and their columns.
 */
export async function getDatabaseSchema() {
    if (!supabase) return { error: 'Database unavailable' };

    try {
        // Query information_schema to get tables and columns
        // We use a predefined safe query for this
        const schemaQuery = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            ORDER BY table_name, ordinal_position;
        `;

        const { data, error } = await supabase.rpc('exec_read_only_sql', { query: schemaQuery });

        if (error) throw error;

        // Group by table
        const schema = {};
        data.forEach(row => {
            if (!schema[row.table_name]) {
                schema[row.table_name] = [];
            }
            schema[row.table_name].push(`${row.column_name} (${row.data_type})`);
        });

        return {
            success: true,
            schemaSummary: schema
        };

    } catch (err) {
        return { error: `Failed to fetch schema: ${err.message}` };
    }
}

/**
 * Tool Definitions for Google Generative AI (Gemini)
 * These match the Function Declaration schema required by the SDK.
 */
export const mayaTools = [
    {
        name: "runSafeQuery",
        description: "Executes a READ-ONLY SQL query against the database. Use this to answer questions about data, users, orders, or inventory. Only SELECT statements are allowed.",
        parameters: {
            type: "OBJECT",
            properties: {
                sqlQuery: {
                    type: "STRING",
                    description: "The SQL SELECT statement to execute."
                }
            },
            required: ["sqlQuery"]
        }
    },
    {
        name: "getDatabaseSchema",
        description: "Retrieves the database structure (list of tables and their columns). Use this when you need to know table names or column names before writing a query.",
        parameters: {
            type: "OBJECT",
            properties: {},
            required: []
        }
    }
];

/**
 * Tool Execution Handler
 * Maps tool names to their implementation.
 */
export const toolHandler = {
    runSafeQuery,
    getDatabaseSchema
};
