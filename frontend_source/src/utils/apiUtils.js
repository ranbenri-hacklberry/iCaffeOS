/**
 * Utility to get the Backend API URL (N150 Local Server or Cloud Proxy).
 */

export const CORTEX_CLOUD_URL = 'https://aimanageragentrani-625352399481.europe-west1.run.app';
export const BACKEND_CLOUD_URL = 'https://api-icaffe.hacklberryfinn.com'; // Fallback for general backend if needed

export const isElectron = () => window.navigator.userAgent.toLowerCase().includes('electron');

/**
 * Identifies if the current environment is local (Localhost/LAN).
 */
const checkIsLocalOrLan = () => {
    const { hostname } = window.location;
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('100.') ||
        hostname.startsWith('172.') ||
        import.meta.env.VITE_FORCE_LOCAL === 'true'
    );
};

/**
 * Resolves the Backend API URL (for Nodes/Data).
 */
export const resolveUrl = async () => {
    // 1. Environment Override
    const envUrl = import.meta.env.VITE_DATA_MANAGER_API_URL || import.meta.env.VITE_MANAGER_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    if (isElectron()) {
        return 'http://127.0.0.1:8081';
    }

    // 2. Local/LAN Access
    if (checkIsLocalOrLan()) {
        return `http://${window.location.hostname}:8081`;
    }

    // 3. Remote/Cloud Access (Fallback to known backend cloud URL)
    return BACKEND_CLOUD_URL;
};

/**
 * Legacy support for sync calls - used by Splash and other services
 */
export const getBackendApiUrl = () => {
    if (isElectron()) return 'http://localhost:8081';

    // Priority 1: Direct backend override
    const backendEnv = import.meta.env.VITE_DATA_MANAGER_API_URL || import.meta.env.VITE_MANAGER_API_URL;
    if (backendEnv) return backendEnv.replace(/\/$/, '');

    // Priority 2: Local check
    if (checkIsLocalOrLan()) {
        return `http://${window.location.hostname}:8081`;
    }

    // Priority 3: Cloud fallback
    return BACKEND_CLOUD_URL;
};

/**
 * Specifically resolves the Cortex (AI) API URL.
 */
export const getCortexApiUrl = () => {
    const cortexEnv = import.meta.env.VITE_CORTEX_API_URL;
    if (cortexEnv) return cortexEnv.replace(/\/$/, '');
    
    // If local, try port 8000 (Cortex default)
    if (checkIsLocalOrLan()) {
        return `http://${window.location.hostname}:8000`;
    }

    return CORTEX_CLOUD_URL;
};
