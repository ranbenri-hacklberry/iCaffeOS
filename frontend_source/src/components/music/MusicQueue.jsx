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
    const items = (playlist || []).filter(s => s.id !== currentSong?.id);
    const itemsOnReorder = onReorder || handleReorder;
    const itemsOnRemove = onRemove || removeFromQueue;

    // Filter out the current song from the "Up Next" list to avoid duplication
    // but keep it in the items for the Reorder component if needed? 
    // Actually, Reorder.Item expects to be part of the values.
    // If we want to show it separately, we should exclude it from the loop.
    const upNextItems = items.filter(s => (s.id || s.track_id) !== currentSong?.id);
    const upNextOnReorder = (newItems) => {
        // If we reorder the "Up Next", we should probably update the whole playlist?
        // Let's stick to the context handler.
        itemsOnReorder(newItems);
    };

    // Parse title: Extract content in parentheses or after a dash
    const parseTitle = (title) => {
        if (!title) return { main: '', sub: '' };
        let main = title;
        let subParts = [];

        if (main.includes(' - ')) {
            const parts = main.split(' - ');
            main = parts[0];
            subParts.push(...parts.slice(1));
        } else if (main.includes(' – ')) {
            const parts = main.split(' – ');
            main = parts[0];
            subParts.push(...parts.slice(1));
        }

        const parenRegex = /\(([^)]+)\)/g;
        const matches = main.match(parenRegex);
        if (matches) {
            matches.forEach(m => {
                main = main.replace(m, '');
                subParts.push(m);
            });
        }

        return {
            main: main.trim().replace(/\s+/g, ' '),
            sub: subParts.join(' ').trim()
        };
    };

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
                {/* Now Playing Section */}
                {currentSong && (
                    <div className="mb-6">
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-3 pr-2">מתנגן כעת</p>
                        <div className="p-5 rounded-[2.5rem] bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 shadow-xl flex items-center gap-5 relative overflow-hidden group">
                            {/* Animated background glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] -mr-10 -mt-10 animate-pulse" />

                            {/* Vinyl Turntable (Small version) */}
                            <div className="relative shrink-0">
                                <div className={`w-20 h-20 rounded-full bg-[#111] border-4 border-black/60 shadow-2xl relative overflow-hidden flex items-center justify-center
                                    ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>

                                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle,_transparent_30%,_rgba(255,255,255,0.1)_35%,_transparent_40%,_rgba(255,255,255,0.1)_45%,_transparent_50%,_rgba(255,255,255,0.1)_55%,_transparent_60%,_rgba(255,255,255,0.1)_65%,_transparent_70%)]" />

                                    <div className="w-8 h-8 rounded-full bg-white z-10 overflow-hidden relative border-2 border-black/20 flex items-center justify-center">
                                        {currentSong.cover_url || currentSong.album?.cover_url ? (
                                            <img
                                                src={currentSong.cover_url || currentSong.album?.cover_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${getSongGradient(currentSong.title)}`}>
                                                <Music className="w-4 h-4 text-white/40" />
                                            </div>
                                        )}
                                        <div className="w-1.5 h-1.5 rounded-full bg-black/80 absolute z-20" />
                                    </div>
                                </div>
                                {/* Turntable Headshell Visual */}
                                <div className={`absolute -top-2 -right-2 w-8 h-8 transition-transform duration-700 origin-top-right
                                    ${isPlaying ? 'rotate-[25deg]' : 'rotate-0'}`}>
                                    <div className="w-1 h-10 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-lg ml-6" />
                                    <div className="w-3 h-4 bg-gray-800 rounded-sm ml-5 mt-[-2px]" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-xl font-black text-white truncate leading-tight tracking-tight">
                                    {parseTitle(currentSong.title).main}
                                </h4>
                                {parseTitle(currentSong.title).sub && (
                                    <p className="text-purple-300/40 text-[9px] font-black uppercase tracking-widest truncate mt-0.5">
                                        {parseTitle(currentSong.title).sub}
                                    </p>
                                )}
                                <p className="text-purple-400 font-bold text-sm truncate opacity-80 mt-1">
                                    {currentSong.artist?.name || 'אמן לא ידוע'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-3 pr-2">הבאים בתור</p>

                <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={itemsOnReorder}
                    className="space-y-0 divide-y divide-white/5" // Use divide for separation instead of heavy rounding
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        {items.map((song) => (
                            <Reorder.Item
                                key={song.id || song.track_id}
                                value={song}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                // Enable Vertical Dragging for Reorder
                                drag="y"
                                dragControls={undefined} // Allow dragging from anywhere if Grip isn't exclusive
                                dragListener={true}

                                // Keep horizontal swipe for remove? It conflicts with Y drag often.
                                // Let's simplify: ONLY vertical drag for reorder. Remove via button for now to solve "Can't drag".
                                // If user wants swipe-to-remove, we need drag="y" for reorder and maybe a separate handler.
                                // Framer Motion Reorder.Item handles Y drag logic for reordering automatically if axis is y.

                                whileDrag={{
                                    scale: 1.02,
                                    backgroundColor: 'rgba(147, 51, 234, 0.2)',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                    zIndex: 50
                                }}
                                className={`group flex items-center gap-4 p-4 cursor-grab active:cursor-grabbing transition-colors relative overflow-hidden
                                    ${currentSong?.id === (song.id || song.track_id)
                                        ? 'bg-purple-600/10'
                                        : 'hover:bg-white/5'}`}
                            >
                                {/* Drag Handle - Make it obvious */}
                                <div className="text-white/20 group-hover:text-white/40 transition-colors shrink-0 cursor-grab active:cursor-grabbing p-2 -ml-2">
                                    <GripVertical className="w-5 h-5" />
                                </div>

                                {/* Vinyl Record Thumbnail */}
                                <div className="relative shrink-0">
                                    <div className={`w-12 h-12 rounded-full bg-[#111] border border-black/40 shadow-xl relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform
                                        ${currentSong?.id === (song.id || song.track_id) && isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>

                                        {/* Vinyl Grooves */}
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle,_transparent_30%,_rgba(255,255,255,0.1)_35%,_transparent_40%,_rgba(255,255,255,0.1)_45%,_transparent_50%,_rgba(255,255,255,0.1)_55%,_transparent_60%,_rgba(255,255,255,0.1)_65%,_transparent_70%)]" />

                                        {/* Album Label (Center) */}
                                        <div className="w-5 h-5 rounded-full bg-white z-10 overflow-hidden relative border border-black/20 flex items-center justify-center">
                                            {song.cover_url || song.album?.cover_url ? (
                                                <img
                                                    src={song.cover_url || song.album?.cover_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${getSongGradient(song.title)}`}>
                                                    <Music className="w-2.5 h-2.5 text-white/40" />
                                                </div>
                                            )}
                                            {/* Pin hole */}
                                            <div className="w-1 h-1 rounded-full bg-black/80 absolute z-20" />
                                        </div>
                                    </div>

                                    {/* Playback Indicator (Turntable Arm visual equivalent) */}
                                    {currentSong?.id === (song.id || song.track_id) && isPlaying && (
                                        <div className="absolute -top-1 -right-1 z-20">
                                            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] flex items-center justify-center animate-pulse">
                                                <div className="w-1 h-1 rounded-full bg-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0 pointer-events-none">
                                    {/* pointer-events-none prevents text selection while dragging, click handled by parent if needed, 
                                        but usually we want separate click for play. 
                                        Let's allow pointer events but ensure drag starts from handle or background. */}
                                    <div className="pointer-events-auto" onClick={() => playSong(song)}>
                                        <h4 className={`text-sm font-bold truncate tracking-tight mb-0.5 transition-colors
                                            ${currentSong?.id === (song.id || song.track_id) ? 'text-purple-400' : 'text-white/80 group-hover:text-white'}`}>
                                            {parseTitle(song.title).main}
                                        </h4>
                                        <p className="text-xs text-white/40 group-hover:text-white/60 truncate font-medium leading-none">
                                            {song.artist?.name || (typeof song.artist === 'string' ? song.artist : 'אמן לא ידוע')}
                                        </p>
                                    </div>
                                </div>

                                {/* Manual Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        itemsOnRemove(song.id || song.track_id);
                                    }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            </div>
        </div>
    );
};

export default MusicQueue;
