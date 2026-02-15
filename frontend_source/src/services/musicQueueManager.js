import { playback_queue } from '@/db/database';
import { calculateNewPosition } from '@/utils/fractionalIndexing';

/**
 * Music Queue Manager
 * Persistent queue management with fractional indexing.
 */
export const MusicQueueManager = {
    /**
     * Get the full queue ordered by position.
     */
    async getQueue() {
        return await playback_queue.orderBy('position').toArray();
    },

    /**
     * Set a new queue (bulk replace).
     */
    async setQueue(songs) {
        await playback_queue.clear();
        const now = new Date().toISOString();
        const entries = songs.map((song, index) => ({
            track_id: song.id,
            position: index + 1,
            is_current: false,
            added_at: now,
            // Include essential metadata to avoid extra joins if needed
            title: song.title,
            artist: song.artist,
            file_path: song.file_path,
            duration: song.duration,
            cover_url: song.cover_url || song.album?.cover_url
        }));
        await playback_queue.bulkAdd(entries);
    },

    /**
     * Append a song to the end.
     */
    async append(song) {
        const lastItem = await playback_queue.orderBy('position').last();
        const newPos = calculateNewPosition(lastItem ? lastItem.position : null, null);

        await playback_queue.add({
            track_id: song.id,
            position: newPos,
            is_current: false,
            added_at: new Date().toISOString(),
            title: song.title,
            artist: song.artist,
            file_path: song.file_path,
            duration: song.duration,
            cover_url: song.cover_url || song.album?.cover_url
        });
    },

    /**
     * Update the 'is_current' flag.
     */
    async setCurrent(songId) {
        await playback_queue.where('is_current').equals(1).modify({ is_current: 0 });
        await playback_queue.where('track_id').equals(songId).modify({ is_current: 1 });
    },

    /**
     * Reorder an item.
     * @param {string} songId - ID of track being moved.
     * @param {number|null} prevPos - Position of the new neighbor before.
     * @param {number|null} nextPos - Position of the new neighbor after.
     */
    async moveTrack(songId, prevPos, nextPos) {
        const newPos = calculateNewPosition(prevPos, nextPos);
        await playback_queue.where('track_id').equals(songId).modify({ position: newPos });
        return newPos;
    },

    /**
     * Remove a track.
     */
    async removeTrack(songId) {
        await playback_queue.where('track_id').equals(songId).delete();
    },

    /**
     * Clear queue.
     */
    async clear() {
        await playback_queue.clear();
    }
};
