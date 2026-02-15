import { CoreAuth } from './auth';
import { CoreDB } from './db';
import { CoreAI } from './ai';
import { ICaffeSDK } from '../types/index';

export class CoreSDK implements ICaffeSDK {
    public auth: CoreAuth;
    public db: CoreDB;
    public ai: CoreAI;

    constructor(supabaseClient: any) {
        // 1. Initialize Auth
        this.auth = new CoreAuth();

        // 2. Initialize DB with strict permissions
        this.db = new CoreDB(supabaseClient);

        // 3. Initialize AI
        this.ai = new CoreAI();

        console.log('[iCaffe Core SDK] Initialized successfully.');
    }
}

// Global factory if needed
export function initializeSDK(supabaseClient: any): ICaffeSDK {
    return new CoreSDK(supabaseClient);
}
