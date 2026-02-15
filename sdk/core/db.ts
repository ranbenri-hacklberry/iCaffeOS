import { DBInterface, QueryResult, CommitResult, CommitOptions } from '../types/index';

export class CoreDB implements DBInterface {
    private _supabase: any; // Ideally typed if supabase-js is available

    constructor(supabaseClient: any) {
        this._supabase = supabaseClient;
    }

    async query<T = any>(table: string, filter?: object): Promise<QueryResult<T>> {
        const correlation_id = crypto.randomUUID();
        console.log(`[iCaffe DB] Query requested on ${table}`, { filter, correlation_id });

        try {
            let query = this._supabase.from(table).select('*');
            if (filter) {
                Object.entries(filter).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            const { data, error } = await query;

            return {
                data: data || [],
                error,
                correlation_id
            };
        } catch (e) {
            return {
                data: [],
                error: e,
                correlation_id
            };
        }
    }

    async commit<T = any>(table: string, data: Partial<T> | Partial<T>[], options: CommitOptions): Promise<CommitResult> {
        const correlation_id = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        // 1. Mandatory Disclaimer Logging
        console.warn(`[iCaffe SDK] WRITE OPERATION INITIATED by App: ${options.app_id}`);
        console.warn(`[iCaffe SDK] DISCLAIMER: User-defined app action: Platform not responsible for data outcomes.`);
        console.log(`[iCaffe SDK] Correlation ID: ${correlation_id}`);

        // Normalize data to array
        const payload = Array.isArray(data) ? data : [data];

        // 2. Tagging the payload
        // We'll simulate logging the operation for rollback purposes
        await this._logOperation(table, 'upsert', payload, options.app_id, correlation_id);

        try {
            // Perform the actual write
            // Supabase upsert accepts array for batch operations
            const { error } = await this._supabase.from(table).upsert(payload);

            if (error) throw error;

            return {
                success: true,
                correlation_id,
                timestamp,
                rollback_token: correlation_id // In a real system, this might be a specific transaction ID
            };

        } catch (e) {
            console.error(`[iCaffe SDK] Commit failed`, e);
            return {
                success: false,
                correlation_id,
                timestamp,
                rollback_token: ''
            };
        }
    }

    private async _logOperation(table: string, action: string, data: any, app_id: string, correlation_id: string) {
        // Internal method to log for rollback capability
        // In a real scenario, this writes to a system 'audit_log' table
        console.log(`[iCaffe Audit] Logging operation: ${action} on ${table} by ${app_id} [${correlation_id}]`);
    }
}
