import React from 'react';
import { Play, Music, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getBackendApiUrl } from '@/utils/apiUtils';

const MUSIC_API_URL = getBackendApiUrl();

// Helper to convert local path to backend URL
const getCoverUrl = (localPath) => {
    if (!localPath) return null;
    if (localPath.startsWith('http')) return localPath;
    return `${MUSIC_API_URL}/music/cover?path=${encodeURIComponent(localPath)}`;
};

/**
 * Album card with cover art, always-visible info, and hover play/delete buttons.
 * Uses aspect-square for consistent grid sizing.
 */
const AlbumCard = ({
    album,
    onPlay,
    onClick,
    onDelete,
    showPlayCount = false
}) => {
    const handlePlay = (e) => {
        e.stopPropagation();
        onPlay?.(album);
    };

    const handleClick = () => {
        onClick?.(album);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete?.(album);
    };

    // Generate a gradient based on album name for albums without covers
    const getGradient = (name) => {
        const gradients = [
            'music-gradient-purple',
            'music-gradient-pink',
            'music-gradient-blue',
            'music-gradient-orange',
            'music-gradient-green',
            'music-gradient-sunset'
        ];
        const index = name?.charCodeAt(0) % gradients.length || 0;
        return gradients[index];
    };

    const coverUrl = getCoverUrl(album.cover_url);

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="music-album-card group relative rounded-2xl overflow-hidden cursor-pointer bg-black/20"
            onClick={handleClick}
        >
            {/* Album Cover Container – always square */}
            <div className="aspect-square relative overflow-hidden bg-zinc-900 shadow-inner">
                {coverUrl ? (
                    <div className="w-full h-full relative">
                        <img
                            src={coverUrl}
                            alt={album.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />

                        {/* 💿 Vintage Effects Overlay */}

                        {/* 1. Ring Wear – faints circle from vinyl inside */}
                        <div className="absolute inset-4 rounded-full border border-white/[0.03] shadow-[inset_0_0_40px_rgba(255,255,255,0.02)] pointer-events-none" />

                        {/* 2. Paper Texture / Worn Edges */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-[0.07] mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] pointer-events-none" />

                        {/* 3. Plastic Reflection – top right */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/[0.08] via-transparent to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <div className={`w-full h-full ${getGradient(album.name)} flex items-center justify-center`}>
                        <Music className="w-16 h-16 text-white/40" />
                        <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                    </div>
                )}

                {/* Always-visible gradient + info at bottom */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-3 px-3 z-10">
                    <h3 className="text-white font-bold text-sm truncate leading-tight">{album.name}</h3>
                    <p className="text-white/60 text-xs truncate font-medium mt-0.5">{album.artist?.name || 'אמן לא ידוע'}</p>
                </div>

                {/* Play button – center, hover only */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <button
                        onClick={handlePlay}
                        className="w-14 h-14 rounded-full music-gradient-purple
                           flex items-center justify-center
                           scale-75 group-hover:scale-100 
                           transition-all duration-300
                           shadow-[0_0_20px_rgba(102,126,234,0.5)]"
                    >
                        <Play className="w-6 h-6 text-white fill-white mr-[-3px]" />
                    </button>
                </div>

                {/* Delete button – top right, hover only */}
                <button
                    onClick={handleDelete}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-all duration-200
                       shadow-xl z-30 text-white/70 hover:text-white backdrop-blur-md"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default AlbumCard;
