import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { PathManager } from '../utils/pathManager.js';
import dotenv from 'dotenv';

// Load .env from backend dir AND project root .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../../.env.local'), override: false });

// Lazy Supabase client — credentials resolved on first use, not at parse time
let _supabase = null;

function getSupabaseClient() {
    if (_supabase) return _supabase;

    const supabaseUrl =
        process.env.LOCAL_SUPABASE_URL && process.env.LOCAL_SUPABASE_SERVICE_KEY
            ? process.env.LOCAL_SUPABASE_URL
            : (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

    const supabaseKey =
        process.env.LOCAL_SUPABASE_SERVICE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ [SyncManager] Supabase credentials not available — sync operations will fail.');
        return null;
    }

    _supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });
    return _supabase;
}

// Named export kept for backwards compat
export const supabase = new Proxy({}, {
    get(_, prop) {
        const client = getSupabaseClient();
        if (!client) throw new Error('[SyncManager] Supabase not initialized — check credentials');
        return client[prop];
    }
});


// 5. Explicit Named Export for the SyncManager
export const SyncManager = {
    /**
     * Compares local staging with external library
     * Returns songs that are in staging but not yet synced (marked in DB)
     */
    async getPendingSyncList() {
        const { data: pending, error } = await supabase
            .from('music_songs')
            .select('*, artist:music_artists(name), album:music_albums(name)')
            .eq('is_synced', false);

        if (error) throw error;

        // Filter out those whose local files actually exist
        return (pending || []).filter(song => fs.existsSync(song.file_path));
    },

    /**
     * Atomic Sync Operation
     * 1. Move file
     * 2. Update DB path and is_synced
     */
    async syncToExternal() {
        if (!PathManager.isExternalMounted()) {
            throw new Error('External drive not mounted');
        }

        const pending = await this.getPendingSyncList();
        const results = {
            success: [],
            failed: []
        };

        for (const song of pending) {
            try {
                const oldPath = song.file_path;
                const newPath = PathManager.convertToExternal(oldPath);
                const newDir = path.dirname(newPath);

                // 1. Ensure directory exists on external
                if (!fs.existsSync(newDir)) {
                    fs.mkdirSync(newDir, { recursive: true });
                }

                // 2. Move file
                fs.copyFileSync(oldPath, newPath);

                // 3. Verify move
                if (fs.existsSync(newPath)) {
                    // 4. Update DB (Transaction-style check)
                    const { error } = await supabase
                        .from('music_songs')
                        .update({
                            file_path: newPath,
                            is_synced: true
                        })
                        .eq('id', song.id);

                    if (error) throw error;

                    // 5. Cleanup local
                    fs.unlinkSync(oldPath);
                    results.success.push(song.id);
                } else {
                    throw new Error('Verification failed after copy');
                }
            } catch (err) {
                console.error(`❌ Sync failed for song ${song.id}:`, err);
                results.failed.push({ id: song.id, error: err.message });
            }
        }

        return results;
    }
};

export default SyncManager;
