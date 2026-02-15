/**
 * Utility to get the Backend API URL (N150 Local Server).
 * 
 * Architecture Principles:
 * 1. Tablet is loyal to the N150 (Local Docker).
 * 2. No automatic jumping to Cloud for core logic (prevents lag and race conditions).
 * 3. If N150 is unreachable, the system works in Offline mode (Dexie).
 */

const CLOUD_URL = 'https://aimanageragentrani-625352399481.europe-west1.run.app';

export const isElectron = () => window.navigator.userAgent.toLowerCase().includes('electron');

/**
 * Resolves the N150 Local API URL.
 */
export const resolveUrl = async () => {
    // 1. Environment Override
    const envUrl = import.meta.env.VITE_MANAGER_API_URL || import.meta.env.VITE_DATA_MANAGER_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    if (isElectron()) {
        return 'http://localhost:8081';
    }

    // 2. Identify if LAN/Local
    const { hostname, protocol } = window.location;
    const isLocalOrLan =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('100.') ||
        hostname.startsWith('172.');

    // For browser development, return empty string for relative paths to use Vite proxy
    if (isLocalOrLan && protocol.startsWith('http')) {
        return '';
    }

    // 3. Remote/Cloud Access (e.g. external management)
    return CLOUD_URL;
};

/**
 * Legacy support for sync calls
 */
export const getBackendApiUrl = () => {
    if (isElectron()) return 'http://localhost:8081';

    const { hostname, protocol } = window.location;
    const isLocalOrLan =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('100.') ||
        hostname.startsWith('172.');

    // For browser development, return empty string for relative paths to use Vite proxy
    return (isLocalOrLan && protocol.startsWith('http')) ? '' : CLOUD_URL;
};
