import React from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { List, GripVertical, X, Music, Play, Sparkles } from 'lucide-react';
import { useMusic } from '@/context/MusicContext';

/**
 * Persistent Music Queue UI
 * Uses Framer Motion Reorder for smooth drag-and-drop.
 * Supports Swipe-to-Remove for mobile users.
 */
const MusicQueue = ({ onReorder, onRemove }) => {
    const {
        playlist,
        currentSong,
        playSong,
        isPlaying,
        handleReorder,
        removeFromQueue
    } = useMusic();

    // Use context values if props not provided
    const items = playlist;
    const itemsOnReorder = onReorder || handleReorder;
    const itemsOnRemove = onRemove || removeFromQueue;

    // Helper to generate gradients for song cards without album art
    const getSongGradient = (title) => {
        const gradients = [
            'bg-gradient-to-br from-violet-600 to-indigo-700',
            'bg-gradient-to-br from-rose-600 to-pink-700',
            'bg-gradient-to-br from-emerald-600 to-teal-700',
            'bg-gradient-to-br from-amber-600 to-orange-700',
            'bg-gradient-to-br from-sky-600 to-cyan-700',
        ];
        const index = (title?.charCodeAt(0) || 0) % gradients.length;
        return gradients[index];
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl">
            {/* Queue Header */}
            <div className="p-6 pb-4 flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                    <h3 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        תור הנגינה
                    </h3>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">
                        {items.length} רצועות • {(items.reduce((acc, s) => acc + (s.duration || 0), 0) / 60).toFixed(0)} דקות
                    </p>
                </div>
            </div>

            {/* Reorderable List */}
            <div className="flex-1 overflow-y-auto music-scrollbar px-4 pb-6">
                <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={itemsOnReorder}
                    className="space-y-3"
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        {items.map((song) => (
                            <Reorder.Item
                                key={song.id || song.track_id}
                                value={song}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                // Gesture for Swipe-to-Remove
                                drag="x"
                                dragConstraints={{ left: -100, right: 0 }}
                                dragElastic={{ left: 0.5, right: 0 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x < -80) {
                                        itemsOnRemove(song.id || song.track_id);
                                    }
                                }}
                                whileDrag={{
                                    scale: 1.05,
                                    backgroundColor: 'rgba(147, 51, 234, 0.2)',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                                }}
                                className={`group flex items-center gap-4 p-4 rounded-3xl cursor-grab active:cursor-grabbing transition-colors relative overflow-hidden
                                    ${currentSong?.id === (song.id || song.track_id)
                                        ? 'bg-purple-600/20 border border-purple-500/40'
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                            >
                                {/* Drag Handle */}
                                <div className="text-white/20 group-hover:text-white/40 transition-colors shrink-0">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                {/* Album Thumbnail / Waveform */}
                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 shrink-0 relative border border-white/10">
                                    {song.cover_url || song.album?.cover_url ? (
                                        <img
                                            src={song.cover_url || song.album?.cover_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${getSongGradient(song.title)}`}>
                                            <Music className="w-6 h-6 text-white/40" />
                                        </div>
                                    )}

                                    {currentSong?.id === (song.id || song.track_id) && isPlaying && (
                                        <div className="absolute inset-0 bg-purple-600/40 backdrop-blur-[2px] flex items-center justify-center">
                                            <div className="flex gap-1 items-end h-4">
                                                {[1, 2, 3].map(i => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: [6, 16, 8, 12, 6] }}
                                                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.2 }}
                                                        className="w-1 rounded-full bg-white"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0" onClick={() => playSong(song)}>
                                    <h4 className={`text-base font-bold truncate tracking-tight transition-colors
                                        ${currentSong?.id === (song.id || song.track_id) ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                        {song.title}
                                    </h4>
                                    <p className="text-sm text-white/40 group-hover:text-white/60 truncate font-medium">
                                        {song.artist?.name || (typeof song.artist === 'string' ? song.artist : 'אמן לא ידוע')}
                                    </p>
                                </div>

                                {/* Manual Remove Button (fallback for non-touch) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        itemsOnRemove(song.id || song.track_id);
                                    }}
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Swipe Indicator Hint */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500 opacity-0 group-active:opacity-20 transition-opacity" />
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            </div>
        </div>
    );
};

export default MusicQueue;
