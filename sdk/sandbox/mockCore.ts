import { AuthInterface, DBInterface, AIInterface, EmployeeProfile, QueryResult, CommitResult, CommitOptions, AIResponse } from '../types';

export class MockAuth implements AuthInterface {
    async identify(): Promise<EmployeeProfile> {
        return {
            id: 'mock-dev-user',
            name: 'Developer Mode User',
            role: 'admin',
            business_id: 'mock-biz-dev',
            permissions: ['*'],
        };
    }
}

export class MockDB implements DBInterface {
    private _store: Record<string, any[]> = {}; // In-memory DB

    constructor(initialData: Record<string, any[]> = {}) {
        this._store = initialData;
    }

    async query<T = any>(table: string, filter?: object): Promise<QueryResult<T>> {
        const correlation_id = 'mock-correlation-' + Date.now();
        console.log(`[Mock DB] Query on ${table}`);

        let data = this._store[table] || [];

        // Very basic filter implementation for mock
        if (filter) {
            data = data.filter(item => {
                return Object.entries(filter).every(([key, value]) => item[key] == value);
            });
        }

        return {
            data: data as T[],
            error: null,
            correlation_id
        };
    }

    async commit<T = any>(table: string, data: Partial<T> | Partial<T>[], options: CommitOptions): Promise<CommitResult> {
        const correlation_id = 'mock-correlation-' + Date.now();
        console.log(`[Mock SDK] MOCK WRITE (Disclaimer would be logged here) - App: ${options.app_id}`);

        if (!this._store[table]) this._store[table] = [];

        const payload = Array.isArray(data) ? data : [data];

        // Simple append/replace mock
        payload.forEach(item => {
            const id = (item as any).id || Date.now();
            const existingIndex = this._store[table].findIndex(ex => ex.id == id);
            if (existingIndex >= 0) {
                this._store[table][existingIndex] = { ...this._store[table][existingIndex], ...item };
            } else {
                this._store[table].push(item);
            }
        });

        return {
            success: true,
            correlation_id,
            timestamp: new Date().toISOString(),
            rollback_token: correlation_id,
        };
    }
}

export class MockAI implements AIInterface {
    async consult(prompt: string, context: any = {}): Promise<AIResponse> {
        return {
            content: `[Mock AI] Response to: "${prompt}"`,
            suggestions: ['Mock Suggestion A', 'Mock Suggestion B'],
            tokens_used: 0
        };
    }
}

export const createMockSDK = (initialData: any = {}) => ({
    auth: new MockAuth(),
    db: new MockDB(initialData),
    ai: new MockAI()
});
