import os from 'os';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export const DiscoveryService = {
    nodeId: null,

    /**
     * Registers this instance as a node in the distributed network
     */
    async startHeartbeat(deviceType = 'unknown') {
        const hostname = os.hostname();
        const localIp = this.getLocalIp();

        console.log(`📡 Node Discovery: Starting heartbeat for ${hostname} (${localIp})`);

        // Register/Update Node
        const { data, error } = await supabase
            .from('music_nodes')
            .upsert({
                hostname,
                local_ip: localIp,
                device_type: deviceType,
                is_online: true,
                last_seen: new Date().toISOString(),
                capabilities: {
                    can_transcode: true,
                    is_master: deviceType === 'n150'
                }
            }, { onConflict: 'hostname' })
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to register node:', error);
            return;
        }

        this.nodeId = data.id;

        // Start 30s heartbeat
        setInterval(async () => {
            await supabase
                .from('music_nodes')
                .update({ last_seen: new Date().toISOString(), is_online: true })
                .eq('id', this.nodeId);
        }, 30000);
    },

    getLocalIp() {
        const interfaces = os.networkInterfaces();
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
        return '0.0.0.0';
    },

    /**
     * Returns the base URL of the "Master" node (N150) or uses local if none
     */
    async getMasterUrl() {
        if (!supabase) return null;
        const { data: nodes } = await supabase
            .from('music_nodes')
            .select('*')
            .eq('device_type', 'n150')
            .eq('is_online', true)
            .order('last_seen', { ascending: false })
            .limit(1);

        if (nodes && nodes.length > 0) {
            return `http://${nodes[0].local_ip}:8081`;
        }
        return null; // Fallback to current relative path
    }
};

export default DiscoveryService;
