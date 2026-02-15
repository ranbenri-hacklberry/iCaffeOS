import { createClient } from '@supabase/supabase-js';

const cloudUrl = import.meta.env?.VITE_SUPABASE_URL;
const cloudKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
// Standardized Hybrid Logic
const localUrl = import.meta.env?.VITE_LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const localKey = import.meta.env?.VITE_LOCAL_SUPABASE_SERVICE_KEY || import.meta.env?.VITE_LOCAL_SUPABASE_ANON_KEY || cloudKey;

if (!cloudUrl || !cloudKey) {
    console.error('🚨 Supabase environment variables missing!');
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

// PRODUCTION CHECK: If we are on Vercel or any non-local hostname, ALWAYS use cloud. No exceptions.
const isProduction = !isElectron && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('.com') ||
    window.location.hostname.includes('.co.il') ||
    (!window.location.hostname.startsWith('192.168.') &&
        !window.location.hostname.startsWith('10.') &&
        !window.location.hostname.startsWith('100.') &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        window.location.hostname !== '')
);

// Only consider local if explicitly on localhost/127.0.0.1/192.168.x/10.x/100.x AND not production
const isLikelyLocal = isElectron || (!isProduction && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('100.') ||
    window.location.search.includes('local=true')
));

// --- ROBUST INITIALIZATION ---
const isValidUrl = (url) => {
    try {
        if (!url || typeof url !== 'string') return false;
        new URL(url);
        return url.startsWith('http');
    } catch (e) {
        return false;
    }
};

const finalUrl = isLikelyLocal ? localUrl : cloudUrl;
const finalKey = isLikelyLocal ? localKey : cloudKey;

console.log(`🚀 Supabase Init [Electron: ${isElectron}]: ${isProduction ? '☁️ PRODUCTION' : (isLikelyLocal ? '🏠 LOCAL' : '☁️ CLOUD')}`);
console.log(`🔗 Target URL: ${finalUrl || 'UNDEFINED'}`);

if (!isValidUrl(finalUrl)) {
    console.warn('⚠️ Selected Supabase URL is invalid. Falling back to emergency local default.');
    activeClient = getClient('http://127.0.0.1:54321', 'no-key');
} else {
    activeClient = getClient(finalUrl, finalKey || 'no-key');
}

isLocal = isLikelyLocal;

export const supabase = new Proxy({}, {
    get: (target, prop) => {
        if (!activeClient) return undefined;
        return activeClient[prop];
    }
});

export const initSupabase = async () => {
    const safeCloudUrl = isValidUrl(cloudUrl) ? cloudUrl : null;

    if (isProduction && safeCloudUrl) {
        isLocal = false;
        activeClient = getClient(safeCloudUrl, cloudKey);
        console.log('☁️ PRODUCTION: Using Cloud Supabase');
        return { isLocal: false, url: safeCloudUrl };
    }

    if (isLikelyLocal) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);

            const response = await fetch(`${localUrl}/rest/v1/`, {
                method: 'GET',
                headers: { 'apikey': localKey },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response && response.ok) {
                isLocal = true;
                activeClient = getClient(localUrl, localKey);
                console.log('🏘️ LOCAL: Connected to local DB');
            } else if (safeCloudUrl) {
                console.warn('⚠️ Local unreachable, switching to Cloud');
                isLocal = false;
                activeClient = getClient(safeCloudUrl, cloudKey);
            }
        } catch (e) {
            console.warn('⚠️ Local DB check failed');
            if (safeCloudUrl) {
                isLocal = false;
                activeClient = getClient(safeCloudUrl, cloudKey);
            }
        }
    } else if (safeCloudUrl) {
        isLocal = false;
        activeClient = getClient(safeCloudUrl, cloudKey);
    }

    return { isLocal, url: isLocal ? localUrl : (safeCloudUrl || localUrl) };
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