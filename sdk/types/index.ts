/**
 * iCaffe Core SDK - Type Definitions
 * Immutable base for Zero-G Apps
 */

export interface EmployeeProfile {
    id: string;
    name: string;
    role: 'admin' | 'manager' | 'barista' | 'staff';
    business_id: string;
    permissions: string[];
}

export interface AuthInterface {
    identify(): Promise<EmployeeProfile>;
}

export interface QueryResult<T = any> {
    data: T[];
    error: any | null;
    correlation_id: string;
}

export interface CommitResult {
    success: boolean;
    correlation_id: string;
    timestamp: string;
    rollback_token: string;
}

export interface CommitOptions {
    app_id: string;
    reason?: string;
    bypass_cache?: boolean;
}

export interface DBInterface {
    query<T = any>(table: string, filter?: object): Promise<QueryResult<T>>;
    commit<T = any>(table: string, data: Partial<T> | Partial<T>[], options: CommitOptions): Promise<CommitResult>;
}

export interface AIResponse {
    content: string;
    suggestions: string[];
    tokens_used: number;
}

export interface AIInterface {
    consult(prompt: string, context?: any): Promise<AIResponse>;
}

export interface ICaffeSDK {
    auth: AuthInterface;
    db: DBInterface;
    ai: AIInterface;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface PlatformLog {
    app_id: string;
    correlation_id: string;
    message: string;
    level: LogLevel;
    timestamp: string;
    metadata?: any;
}
