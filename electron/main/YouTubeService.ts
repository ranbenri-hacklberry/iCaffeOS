import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { net } from 'electron';

// Load env vars
dotenv.config();

// Interfaces
interface QuotaData {
    date: string;
    unitsUsed: number;
}

interface SearchResult {
    id: string;
    title: string;
    artist?: string;
    thumbnail: string;
    duration?: number;
    isLocal: boolean;
    source: 'LOCAL' | 'YOUTUBE';
}

const QUOTA_FILE = 'youtube_quota.json';
const MAX_DAILY_UNITS = 9000;
const SEARCH_COST = 100;
const PLAYLIST_COST = 1; // per page

export class YouTubeService {
    private apiKey: string = '';
    private supabase: SupabaseClient | null = null;
    private quotaPath: string;
    private businessId: string;

    constructor() {
        this.quotaPath = path.join(app.getPath('userData'), QUOTA_FILE);
        this.businessId = process.env.BUSINESS_ID || process.env.VITE_BUSINESS_ID || '22222222-2222-2222-2222-222222222222';
        this.initialize();
    }

    private async initialize() {
        // 1. Setup Supabase for Realtime
        const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Use ANON for public listen, or Service Role if needed

        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
            console.log('🎥 [YouTube] Supabase Client Initialized');

            // 2. Fetch Initial Key
            await this.fetchApiKey();

            // 3. Setup Realtime Listener
            this.setupRealtimeWatcher();
        } else {
            console.warn('⚠️ [YouTube] Missing Supabase Config - Dynamic Sync Disabled');
        }
    }

    private async fetchApiKey() {
        if (!this.supabase) return;

        try {
            // 🔒 REFACTORED: Fetch from business_secrets table
            const { data, error } = await this.supabase
                .from('business_secrets')
                .select('youtube_api_key')
                .eq('business_id', this.businessId)
                .single();

            if (data?.youtube_api_key) {
                this.apiKey = data.youtube_api_key;
                console.log('🔑 [YouTube] API Key Loaded from business_secrets');
            } else if (error && error.code !== 'PGRST116') {
                console.error('❌ [YouTube] Failed to fetch API key:', error.message);
            }
        } catch (err) {
            console.error('❌ [YouTube] Error fetching key from Supabase:', err);
        }

        // Fallback to .env if Supabase didn't provide a key
        if (!this.apiKey && process.env.YOUTUBE_API_KEY) {
            this.apiKey = process.env.YOUTUBE_API_KEY;
            console.log('🔑 [YouTube] API Key Loaded from .env (Fallback)');
        }
    }

    private setupRealtimeWatcher() {
        if (!this.supabase) return;

        // 🔒 REFACTORED: Watch business_secrets table instead of businesses
        console.log(`👁️ [YouTube] Watching business_secrets for Business: ${this.businessId}`);

        this.supabase
            .channel('public:business_secrets')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'business_secrets', filter: `business_id=eq.${this.businessId}` },
                (payload: any) => {
                    const newKey = payload.new.youtube_api_key;
                    if (newKey && newKey !== this.apiKey) {
                        console.log('🔄 [YouTube] Hot-Reload: API Key Updated from business_secrets!');
                        this.apiKey = newKey;
                    }
                }
            )
            .subscribe();
    }

    // --- QUOTA MANAGEMENT ---
    private getQuota(): QuotaData {
        const today = new Date().toISOString().split('T')[0];
        let quota: QuotaData = { date: today, unitsUsed: 0 };

        if (fs.existsSync(this.quotaPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.quotaPath, 'utf-8'));
                if (data.date === today) {
                    quota = data;
                }
            } catch (e) {
                console.warn('⚠️ [YouTube] Failed to read quota file, resetting.');
            }
        }
        return quota;
    }

    private updateQuota(cost: number) {
        const quota = this.getQuota();
        quota.unitsUsed += cost;
        fs.writeFileSync(this.quotaPath, JSON.stringify(quota));
        return quota.unitsUsed;
    }

    public getQuotaStatus() {
        const quota = this.getQuota();
        return {
            used: quota.unitsUsed,
            limit: MAX_DAILY_UNITS,
            remaining: Math.max(0, MAX_DAILY_UNITS - quota.unitsUsed),
            isExceeded: quota.unitsUsed >= MAX_DAILY_UNITS
        };
    }

    // --- SEARCH LOGIC ---
    public async search(query: string): Promise<{ results: SearchResult[], offline: boolean, error?: string }> {
        // 1. Search Local DB
        let localResults: SearchResult[] = [];
        if (this.supabase) {
            try {
                const { data: songs } = await this.supabase
                    .from('music_songs')
                    .select('id, title, artist:artist_id(name), album:album_id(cover_url)')
                    .ilike('title', `%${query}%`)
                    .limit(10);

                if (songs) {
                    localResults = songs.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        artist: s.artist?.name,
                        thumbnail: s.album?.cover_url || '',
                        isLocal: true,
                        source: 'LOCAL'
                    }));
                }
            } catch (e) {
                console.error('⚠️ [YouTube] Local search failed:', e);
            }
        }

        // Cache-First: If we have enough local matches, skip YouTube to save quota!
        if (localResults.length >= 5) {
            console.log(`🏠 [YouTube] Found ${localResults.length} local matches. Skipping API to save quota.`);
            return { results: localResults, offline: false };
        }

        // 2. Check Quota
        const quota = this.getQuota();
        if (quota.unitsUsed >= MAX_DAILY_UNITS) {
            console.warn('⚠️ [YouTube] Quota Exceeded. Returning Offline Mode.');
            return { results: localResults, offline: true, error: "Daily Quota Exceeded" };
        }

        // 3. Remote Search
        if (!this.apiKey) {
            return { results: localResults, offline: true, error: "No API Key Configured" };
        }

        try {
            console.log(`🔎 [YouTube] Searching: "${query}" (Cost: ${SEARCH_COST})`);
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=20&key=${this.apiKey}`;

            const response = await net.fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error('❌ [YouTube] API Error:', data.error);
                throw new Error(data.error.message);
            }

            // Update Quota
            this.updateQuota(SEARCH_COST);

            const youtubeResults: SearchResult[] = data.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                artist: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                isLocal: false,
                source: 'YOUTUBE'
            }));

            // Merge: Local first, then YouTube
            return { results: [...localResults, ...youtubeResults], offline: false };

        } catch (err: any) {
            console.error('❌ [YouTube] Search Failed:', err);
            // Even if YouTube fails, return local results if we have them
            return { results: localResults, offline: true, error: err.message };
        }

    }

    // --- PLAYLIST OPTIMIZATION ---
    public async getPlaylistItems(playlistId: string, pageToken?: string): Promise<{ items: any[], nextPageToken?: string, error?: string }> {
        if (!this.apiKey) {
            return { items: [], error: "No API Key Configured" };
        }

        const quota = this.getQuota();
        if (quota.unitsUsed >= MAX_DAILY_UNITS) {
            return { items: [], error: "Daily Quota Exceeded" };
        }

        try {
            console.log(`📋 [YouTube] Fetching Playlist: ${playlistId} (Cost: ${PLAYLIST_COST})`);
            let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${this.apiKey}`;
            if (pageToken) url += `&pageToken=${pageToken}`;

            const response = await net.fetch(url);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            // Update Quota (PlaylistItems.list costs only 1 unit)
            this.updateQuota(PLAYLIST_COST);

            return {
                items: data.items,
                nextPageToken: data.nextPageToken
            };

        } catch (err: any) {
            console.error('❌ [YouTube] Playlist Fetch Failed:', err);
            return { items: [], error: err.message };
        }
    }

    // --- VALIDATION ---
    public async testApiKey(key: string) {
        try {
            console.log('🧪 [YouTube] Testing API Key...');
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&regionCode=IL&key=${key}`;

            const response = await net.fetch(url);
            const data = await response.json();

            if (data.error) {
                const reason = data.error.errors?.[0]?.reason;
                let errorType = 'UNKNOWN';

                if (reason === 'quotaExceeded') errorType = 'QUOTA';
                else if (reason === 'keyInvalid' || reason === 'badRequest') errorType = 'AUTH';

                return { success: false, errorType, message: data.error.message };
            }

            return { success: true };

        } catch (err: any) {
            return { success: false, errorType: 'NETWORK', message: err.message };
        }
    }
}
