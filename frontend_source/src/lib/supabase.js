import { createClient } from '@supabase/supabase-js';

// Configuration: Detect environment
const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
const isLocalIp = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('100.') ||
    window.location.hostname.startsWith('172.')
);

const isStrictlyLocal = isElectron || isLocalIp || import.meta.env?.VITE_FORCE_LOCAL === 'true';

// URLs
const getLocalUrl = () => {
    if (import.meta.env?.VITE_LOCAL_SUPABASE_URL) {
        return import.meta.env.VITE_LOCAL_SUPABASE_URL;
    }
    return 'http://127.0.0.1:54321';
};

const localUrl = getLocalUrl();
const localKey = import.meta.env?.VITE_LOCAL_SUPABASE_ANON_KEY || 'no-key';

// Initialize the primary client
const client = createClient(localUrl, localKey, {
    auth: {
        persistSession: true,
        storageKey: 'supabase.auth.token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// 🛡️ [STRICT LOCAL LOCK]
// We use a Proxy to ensure 'supabase' is always available and 'cloudSupabase' also points local
export const cloudSupabase = client;
export const supabase = new Proxy(client, {
    get: (target, prop) => {
        return target[prop];
    }
});

export const isLocalInstance = () => isStrictlyLocal;
export const resolveSupabaseUrl = (url) => url;
export const initSupabase = async () => ({ isLocal: true, url: localUrl });

/**
 * Legacy support for components expecting getSupabase
 */
export const getSupabase = (user) => supabase;

export default supabase;