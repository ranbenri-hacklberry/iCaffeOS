import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enN4dmJlcmNwa2d4cmFpYWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjMyNzAsImV4cCI6MjA3NzEzOTI3MH0.6sJ7PJ2imo9-mzuYdqRlhQty7PCQAzpSKfcQ5ve571g';

const cloudUrl = import.meta.env?.VITE_SUPABASE_URL || FALLBACK_URL;
const cloudKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Standardized Hybrid Logic: Local vs Cloud
// Standardized Hybrid Logic: Local vs Cloud
const getLocalUrl = () => {
    // 1. Electron/Localhost: Use explicit localhost
    if (typeof window !== 'undefined' && (window.navigator?.userAgent?.includes('Electron') || window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
        return 'http://127.0.0.1:54321';
    }

    // 2. LAN Access (iPad/Tablet): Use the detected IP address
    if (typeof window !== 'undefined' && window.location?.hostname && (
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('100.') ||
        window.location.hostname.startsWith('172.')
    )) {
        return `http://${window.location.hostname}:54321`;
    }

    // Fallback
    return import.meta.env?.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
};

const localUrl = getLocalUrl();
const localKey = import.meta.env?.VITE_LOCAL_SUPABASE_ANON_KEY || 'no-key';

if (!cloudUrl || !cloudKey) {
    console.warn('🚨 Supabase Cloud environment variables missing! Using fallbacks.');
}

let activeClient = null;
let isLocal = false;

/**
 * Cloud-only client for global tasks (registration, discovery)
 */
export const cloudSupabase = createClient(cloudUrl || 'http://localhost:54321', cloudKey || 'no-key');

/**
 * Update the active client instance
 */
const getClient = (url, key) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        console.error('🚨 getClient: Attempted to create client with invalid URL:', url);
        // Return a dummy client that doesnt crash but fails gracefully
        return createClient('http://127.0.0.1:54321', 'no-key');
    }
    if (activeClient && activeClient.supabaseUrl === url) return activeClient;
    try {
        return createClient(url, key, {
            auth: {
                persistSession: true,
                storageKey: 'supabase.auth.token',
                storage: window.localStorage,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
    } catch (e) {
        console.error('🚨 getClient: createClient threw error:', e);
        return createClient('http://127.0.0.1:54321', 'no-key');
    }
};

const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');

// PRODUCTION CHECK: If we are on Vercel or any common deployment hostnames, use cloud.
// But we allow LOCAL bypass if the user is on a Tailscale IP or common LAN IP.
const isProductionHostname = window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('herokuapp.com') ||
    window.location.hostname.includes('supabase.co');

const isLocalIp = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('100.') ||
    window.location.hostname.startsWith('172.');

const isProduction = !isElectron && isProductionHostname && !isLocalIp;

// Lock to Local if explicitly on local IPs OR forced via query/env
const isStrictlyLocal = isElectron || isLocalIp ||
    window.location.search.includes('local=true') ||
    import.meta.env?.VITE_FORCE_LOCAL === 'true';

// --- ROBUST INITIALIZATION ---
// We DO NOT FALLBACK to Cloud if we are strictly local. This prevents the "Frankfurt Loop"
const finalUrl = isStrictlyLocal ? localUrl : cloudUrl;
const finalKey = isStrictlyLocal ? localKey : cloudKey;

console.log(`🚀 Supabase Init [Electron: ${isElectron}]: ${isProduction ? '☁️ PRODUCTION' : (isStrictlyLocal ? '🏠 STRICT LOCAL' : '☁️ CLOUD')}`);
console.log(`🔗 Target URL: ${finalUrl}`);

try {
    activeClient = createClient(finalUrl || 'http://127.0.0.1:54321', finalKey || 'no-key', {
        auth: {
            persistSession: true,
            storageKey: 'supabase.auth.token',
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
} catch (e) {
    console.error('🚨 Failed to initialize strict client:', e);
}

isLocal = isStrictlyLocal;

export const supabase = new Proxy({}, {
    get: (target, prop) => {
        if (!activeClient) return undefined;
        return activeClient[prop];
    }
});

// Remove health check that was accidentally falling back to Cloud.
// If Docker is down, the app should fail on LAN, not failover to Frankfurt and cause zombie UI.
export const initSupabase = async () => {
    return { isLocal: isStrictlyLocal, url: finalUrl };
};

initSupabase().catch(err => console.error('Failed to init supabase:', err));

/**
 * Returns a Supabase client scoped to the appropriate schema based on the user.
 * @param {object} user - The current logged-in user
 * @returns {object} - Supabase client
 */
export const getSupabase = (user) => {
    return supabase;
};

/**
 * NEW: Global helper to check if we are currently running local
 */
export const isLocalInstance = () => isLocal;