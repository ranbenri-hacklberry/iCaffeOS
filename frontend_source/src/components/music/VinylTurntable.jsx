import React from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause } from 'lucide-react';

import { getBackendApiUrl } from '@/utils/apiUtils';

const MUSIC_API_URL = getBackendApiUrl();

// Helper to convert local path to backend URL
const getCoverUrl = (localPath, id) => {
    if (!localPath && !id) return null;
    if (localPath?.startsWith('http')) return localPath;

    let url = `${MUSIC_API_URL}/music/cover?`;
    if (localPath) url += `path=${encodeURIComponent(localPath)}`;
    if (id) url += `${localPath ? '&' : ''}id=${id}`;
    return url;
};

/**
 * Simplified Vinyl Turntable Component
 * Shows a spinning vinyl record with album art in center
 */
const VinylTurntable = ({ song, isPlaying, albumArt, onTogglePlay, queue = [] }) => {
    // If no song is actively playing, show the first song in queue as preview
    const displaySong = song || (queue.length > 0 ? queue[0] : null);

    // Determine cover URL
    let coverUrl = albumArt;
    if (!coverUrl && displaySong) {
        coverUrl = displaySong.album?.cover_url || displaySong.cover_url || displaySong.thumbnail_url;
    }
    // Fallback to API resolver if needed (simplified here, usually passed down or resolved in context)
    // We'll trust the passed albumArt or the song object's standard fields.

    // Check if we should rotate: 
    // 1. If song is playing (isPlaying=true) -> rotate
    // 2. If NO song is playing but turntable represents the queue (displaySong exists), we usually DON'T rotate until played.
    // User complaint: "Turntables won't rotate". 
    // We should ensure 'isPlaying' is true only when music is actually playing.

    const shouldRotate = isPlaying && !!song; // Only rotate if a song is loaded and playing

    return (
        <div
            className="flex flex-col items-center justify-center cursor-pointer group"
            onClick={() => onTogglePlay(!isPlaying)} // Toggle play/pause state
        >
            {/* Main Vinyl Record */}
            <div className={`relative w-72 h-72 md:w-96 md:h-96 rounded-full bg-[#111] border-8 border-black shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-700
                ${shouldRotate ? 'animate-[spin_4s_linear_infinite]' : ''}`}>

                {/* Vinyl Grooves Texture */}
                <div className="absolute inset-0 rounded-full opacity-20 pointer-events-none bg-[radial-gradient(circle,_transparent_30%,_rgba(255,255,255,0.1)_31%,_transparent_32%,_rgba(255,255,255,0.1)_33%,_transparent_40%,_rgba(255,255,255,0.1)_41%,_transparent_42%,_rgba(255,255,255,0.1)_50%,_transparent_60%)]" />

                {/* Album Art Label */}
                <div className="w-1/3 h-1/3 rounded-full bg-neutral-800 relative shadow-inner overflow-hidden flex items-center justify-center">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={displaySong?.title || "Album Art"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
                            <Music className="w-12 h-12 text-white/20" />
                        </div>
                    )}
                    {/* Spindle Hole */}
                    <div className="absolute w-3 h-3 bg-black rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-inner border border-stone-800" />
                </div>

                {/* Shine/Reflection */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>

            {/* Song Info (Below Turntable) */}
            <div className="mt-8 text-center max-w-md px-4">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-lg">
                    {displaySong?.title || "מוכן לנגינה"}
                </h2>
                <p className="text-lg text-white/60 font-medium">
                    {displaySong?.artist?.name || displaySong?.artist || (displaySong ? "אמן לא ידוע" : "בחר שיר מהרשימה")}
                </p>
            </div>
        </div>
    );
};

export default VinylTurntable;
