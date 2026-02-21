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
        // 🛡️ LAN FIX: Check if this is a LAN IP (iPad/tablet on local network).
        // For LAN access, NEVER fall back to cloud — the local Supabase IS the source of truth.
        // Falling back to cloud causes ~5 minute delays because orders exist in local DB, not cloud.
        const isLanAccess = typeof window !== 'undefined' && (
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.startsWith('100.') ||
            window.location.hostname.startsWith('172.')
        );

        try {
            const controller = new AbortController();
            // 🛡️ LAN FIX: Increase timeout for LAN (was 1500ms — too short, causes cloud fallback)
            const timeoutId = setTimeout(() => controller.abort(), isLanAccess ? 5000 : 1500);

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
            } else if (safeCloudUrl && !isLanAccess) {
                // Only fall back to cloud for localhost (dev), NOT for LAN tablets
                console.warn('⚠️ Local unreachable, switching to Cloud (localhost only)');
                isLocal = false;
                activeClient = getClient(safeCloudUrl, cloudKey);
            } else {
                // LAN access: stay on local even if health check returned non-ok
                console.warn(`⚠️ Local health check returned non-ok (${response?.status}), but staying LOCAL for LAN access`);
                isLocal = true;
                activeClient = getClient(localUrl, localKey);
            }
        } catch (e) {
            console.warn('⚠️ Local DB check failed:', e.message);
            if (safeCloudUrl && !isLanAccess) {
                // Only fall back to cloud for localhost (dev), NOT for LAN tablets
                isLocal = false;
                activeClient = getClient(safeCloudUrl, cloudKey);
            } else {
                // LAN access: stay on local, work in offline mode if needed
                console.warn('🏠 LAN access — staying LOCAL despite health check failure');
                isLocal = true;
                activeClient = getClient(localUrl, localKey);
            }
        }
    } else if (safeCloudUrl) {
        isLocal = false;
        activeClient = getClient(safeCloudUrl, cloudKey);
        console.log('☁️ FALLBACK: Defaulting to Cloud Supabase');
        console.log(`🔗 Active Connection: ${safeCloudUrl}`);
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