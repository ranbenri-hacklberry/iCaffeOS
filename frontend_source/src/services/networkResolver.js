import axios from 'axios';

let activeConfig = null;
let activeEndpoint = null;

export async function initActiveEndpoint() {
    let config = null;
    const cachedConfig = localStorage.getItem('icaffe_server_config');
    if (cachedConfig) {
        try {
            config = JSON.parse(cachedConfig);
        } catch (e) {
            console.error('Failed to parse cached server config:', e);
        }
    }

    if (!config) {
        // Fallback to manual server IP settings or default Mac Mini IP
        const savedIp = localStorage.getItem('kds_server_ip') || '192.168.1.10';
        config = {
            tenant_id: localStorage.getItem('business_id') || '11111111-1111-1111-1111-111111111111',
            local_url: `http://${savedIp}:4028`,
            remote_url: 'https://icaffeos.tail9a5357.ts.net'
        };
    }

    activeConfig = config;

    try {
        // Trust the local_url exactly as provided in the JSON payload
        await axios.get(`${config.local_url}/api/system/health`, { timeout: 1500 });
        console.log("⚡ Connected directly to store Wi-Fi network");
        activeEndpoint = config.local_url;
    } catch (error) {
        console.log("🌐 Local network unreachable, routing via Tailscale/Remote Tunnel");
        if (config.remote_url) {
            activeEndpoint = config.remote_url;
        } else {
            activeEndpoint = 'http://localhost:8081';
        }
    }
    return activeEndpoint;
}

export function getActiveEndpoint() {
    return activeEndpoint || 'http://localhost:8081';
}

export function isUsingRemoteEndpoint() {
    if (!activeConfig || !activeEndpoint) return false;
    const localHost = activeConfig.local_url.replace(/https?:\/\//, '').split(':')[0];
    return !activeEndpoint.includes(localHost);
}

export function getActiveConfig() {
    return activeConfig;
}
