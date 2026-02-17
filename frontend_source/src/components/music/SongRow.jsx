import React from 'react';
import { Play, Pause, ThumbsUp, ThumbsDown, Trash2, Sparkles, Plus } from 'lucide-react';
import { useMusic } from '@/context/MusicContext';

/**
 * Song row component for album view
 */
const SongRow = ({
    song,
    index,
    isPlaying = false,
    isCurrentSong = false,
    onPlay,
    onRate,
    onDelete,
    onQueue // New callback for the Plus button
}) => {
    const handlePlay = () => {
        onPlay?.(song);
    };

    const handleRate = (rating) => {
        // Like (5) or Dislike (1)
        onRate?.(song.id, rating);
    };

    const myRating = song?.myRating || 0;
    const isLiked = myRating === 5;
    const isDisliked = myRating === 1;

    const { addToQueue } = useMusic();

    // Parse title: Extract content in parentheses or after a dash
    const parseTitle = (title) => {
        if (!title) return { main: '', sub: '' };

        // Match ALL content in parentheses or after a dash
        // Strategy: 
        // 1. Separate by dash if exists
        // 2. Extract all parentheses from the main part

        let main = title;
        let subParts = [];

        // Handle dash (-)
        if (main.includes(' - ')) {
            const parts = main.split(' - ');
            main = parts[0];
            subParts.push(...parts.slice(1));
        } else if (main.includes(' – ')) { // em-dash
            const parts = main.split(' – ');
            main = parts[0];
            subParts.push(...parts.slice(1));
        }

        // Match content in parentheses
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

    const { main, sub } = parseTitle(song.title);

    // Format duration (seconds to MM:SS)
    const formatDuration = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    return (
        <div
            className={`music-song-row ${isCurrentSong ? 'playing' : ''} group`}
            onClick={() => addToQueue(song, 'last')}
        >
            {/* Track number / Playing indicator */}
            <div className="w-10 flex-shrink-0 flex justify-center">
                {isCurrentSong && isPlaying ? (
                    <div className="music-playing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                ) : (
                    <span className="text-white/40 text-sm font-medium track-number">
                        {index + 1}
                    </span>
                )}
            </div>

            {/* Queue Plus Button (Left Side) */}
            <div className="flex items-center justify-center w-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onQueue) {
                            onQueue(song);
                        } else {
                            addToQueue(song, 'last');
                        }
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-purple-500 text-white/40 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                    title="אפשרויות הוספה"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0 mr-3 py-1">
                <h4 className={`font-bold truncate text-sm leading-none mb-1 ${isCurrentSong ? 'text-purple-400' : 'text-white'}`}>
                    {main}
                </h4>
                {sub && (
                    <p className="text-white/20 text-[9px] font-medium truncate leading-none uppercase tracking-wider">
                        {sub}
                    </p>
                )}
                {song.artist && !sub && (
                    <p className="text-white/40 text-[10px] truncate leading-none mt-1">
                        {song.artist.name}
                    </p>
                )}
            </div>


            {/* Actions */}
            <div className="flex-shrink-0 ml-3 flex items-center gap-1 sm:gap-2">
                {/* Delete button (Trash icon) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(song); }}
                    className="p-2 sm:p-3 rounded-full transition-all transform hover:scale-110 text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                    title="מחק שיר"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); handleRate(1); }}
                    className={`p-2 sm:p-3 rounded-full transition-all transform hover:scale-110
                        ${isDisliked ? 'text-red-400 bg-red-500/20 ring-1 ring-red-400/40' : 'text-white/40 hover:text-red-400 hover:bg-white/10'}`}
                    title="לא אהבתי"
                >
                    <ThumbsDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); handleRate(5); }}
                    className={`p-2 sm:p-3 rounded-full transition-all transform hover:scale-110
                        ${isLiked ? 'text-green-400 bg-green-500/20 ring-1 ring-green-400/40' : 'text-white/40 hover:text-green-400 hover:bg-white/10'}`}
                    title="אהבתי"
                >
                    <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>

            {/* Duration */}
            <div className="w-12 flex-shrink-0 text-left text-white/40 text-sm ml-2">
                {formatDuration(song.duration_seconds)}
            </div>
        </div>
    );
};

export default SongRow;
