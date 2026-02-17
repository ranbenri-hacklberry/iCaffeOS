import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Music, Disc, ListMusic, Search, Plus, RefreshCw,
    ArrowRight, Sparkles, User, Play, FolderOpen, Heart, Youtube,
    Pause, SkipForward, SkipBack, Trash2, X, HardDrive, AlertCircle, Home, Download, Archive, List,
    Volume2, VolumeX, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '@/context/MusicContext';
import { useAlbums } from '@/hooks/useAlbums';
import { useImportContext } from '@/hooks/useImportContext';
import { useAuth } from '@/context/AuthContext';
import AlbumCard from '@/components/music/AlbumCard';
import AddMusicCard from '@/components/music/AddMusicCard';
import VinylTurntable from '@/components/music/VinylTurntable';
import SongRow from '@/components/music/SongRow';
import MiniMusicPlayer from '@/components/music/MiniMusicPlayer';
import AlbumView from '@/pages/music/components/AlbumView';
import PlaylistBuilder from '@/pages/music/components/PlaylistBuilder';
import SyncOverlay from '@/pages/music/components/SyncOverlay';
import CDImportModal from '@/pages/music/components/CDImportModal';
import MusicQueue from '@/components/music/MusicQueue';
import QueueModeModal from '@/components/music/QueueModeModal';
import UnifiedHeader from '@/components/UnifiedHeader';

import DirectoryScanner from '@/pages/music/components/DirectoryScanner';
import YouTubeIngest from '@/pages/music/components/YouTubeIngest';
import ExternalIngestManager from '@/pages/music/components/ExternalIngestManager';
// Removed YouTubeSearch import as it is now used within YouTubeIngest

import { getBackendApiUrl } from '@/utils/apiUtils';
import '@/styles/music.css';

const MUSIC_API_URL = getBackendApiUrl();

// Tabs for navigation
const TABS = [
    { id: 'albums', label: 'אלבומים', icon: Disc },
    { id: 'artists', label: 'אמנים', icon: User },
    { id: 'singles', label: 'סינגלים', icon: Music },
    { id: 'playlists', label: 'פלייליסטים', icon: ListMusic },
    { id: 'favorites', label: 'מועדפים', icon: Heart },
];

// Helper to generate gradients for song cards without album art
const getSongGradient = (title) => {
    const gradients = [
        'bg-gradient-to-br from-violet-900 to-indigo-900',
        'bg-gradient-to-br from-rose-900 to-pink-900',
        'bg-gradient-to-br from-emerald-900 to-teal-900',
        'bg-gradient-to-br from-amber-900 to-orange-900',
        'bg-gradient-to-br from-sky-900 to-cyan-900',
        'bg-gradient-to-br from-fuchsia-900 to-purple-900',
    ];
    const index = (title?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
};

const MusicPageContent = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Permissions: Everyone can see the player, but maybe only admins can ingest?
    const accessLevel = (currentUser?.access_level || '').toLowerCase();
    const role = (currentUser?.role || '').toLowerCase();
    const isManager = role === 'admin' || role === 'manager' || role === 'owner' ||
        accessLevel === 'admin' || accessLevel === 'manager' || accessLevel === 'owner' ||
        currentUser?.is_admin || currentUser?.is_super_admin;

    const {
        albums,
        artists,
        playlists,
        isLoading,
        error,
        isMusicDriveConnected,
        checkMusicDriveConnection,
        refreshAll,
        addSongToPlaylist,
        scanMusicDirectory,
        fetchArtists,
        fetchAlbums,
        fetchAlbumSongs,
        fetchAllSongs,
        fetchPlaylists,
        fetchPlaylistSongs,
        fetchArtistSongs,
        fetchFavoritesSongs,
        deleteSong,
        deleteAlbum,
        deletePlaylist,
        archiveItem,
        generateSmartPlaylist
    } = useAlbums();

    const {
        currentSong,
        playSong,
        isPlaying,
        togglePlay,
        handleNext,
        handlePrevious,
        playlist, // This is the current playback queue
        rateSong,
        currentTime,
        duration,
        volume,
        seek,
        setVolume,
        handleReorder,
        removeFromQueue,
        addToQueue,
        addPlaylistToQueue
    } = useMusic();

    const [activeTab, setActiveTab] = useState('albums');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [queueContext, setQueueContext] = useState(null); // { item, type: 'song'|'album' }
    const [showYouTubeIngest, setShowYouTubeIngest] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [showDirectoryScanner, setShowDirectoryScanner] = useState(false);
    const [selectedYoutubeVideo, setSelectedYoutubeVideo] = useState(null);
    const [currentAlbumSongs, setCurrentAlbumSongs] = useState([]);
    const [favoriteSongs, setFavoriteSongs] = useState([]);
    const [allSongs, setAllSongs] = useState([]);

    // SYNC STATE
    const [showSyncOverlay, setShowSyncOverlay] = useState(false);
    const [mismatchDetected, setMismatchDetected] = useState(false);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // CD STATE
    const [showCDImport, setShowCDImport] = useState(false);
    const [isCdMounted, setIsCdMounted] = useState(false);

    // NETWORK STATUS
    const [networkSource, setNetworkSource] = useState('local'); // 'local', 'yt'
    const [isMasterOnline, setIsMasterOnline] = useState(true);
    const [libraryStats, setLibraryStats] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // Array of IDs

    const toggleItemSelection = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedItems.length} פריטים?`)) return;

        try {
            for (const id of selectedItems) {
                if (activeTab === 'albums') await deleteAlbum(id, false);
                else if (activeTab === 'playlists') await deletePlaylist(id);
                else if (activeTab === 'singles') await deleteSong(id, false);
            }
            setSelectedItems([]);
            setIsEditMode(false);
            refreshAll();
        } catch (err) {
            console.error('Bulk delete failed:', err);
        }
    };

    const fetchLibraryStats = useCallback(async () => {
        try {
            const res = await fetch(`${MUSIC_API_URL}/api/music/library/stats`);
            const data = await res.json();
            if (data.success) setLibraryStats(data.stats);
        } catch (err) { }
    }, []);

    useEffect(() => {
        // Start Heartbeat if we are on the N150
        const isN150 = window.location.hostname.includes('n150') || true; // Auto-detect in real env
        fetch(`${MUSIC_API_URL}/api/music/discovery/start`, {
            method: 'POST',
            body: JSON.stringify({ device_type: isN150 ? 'n150' : 'mbp' }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.warn('Discovery skipped:', err));

        fetchLibraryStats();
    }, [fetchLibraryStats]);

    // NEW: Music Source State (simplified to local only)
    const [showDiskPopup, setShowDiskPopup] = useState(false);
    // Context for deletion
    const [itemToDelete, setItemToDelete] = useState(null); // { type: 'song'|'album'|'playlist', item }
    const [deleteFiles, setDeleteFiles] = useState(false);

    // Context for imports
    const importContext = useImportContext(activeTab);

    // Reuse disk connection helper
    const handleRetryDisk = async () => {
        const connected = await checkMusicDriveConnection();
        if (connected) {
            setShowDiskPopup(false);
            refreshAll();
        }
    };

    // Generic delete handler
    const handleDeleteClick = (type, item) => {
        setItemToDelete({ type, item });
        setDeleteFiles(false); // Reset checkbox
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, item } = itemToDelete;

        try {
            if (type === 'playlist') {
                await deletePlaylist(item.id);
            } else if (type === 'album') {
                await deleteAlbum(item.id, deleteFiles);
            } else if (type === 'song') {
                await deleteSong(item.id, deleteFiles);
            }
            refreshAll();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setItemToDelete(null);
        }
    };

    const confirmArchive = async () => {
        if (!itemToDelete) return;
        const { type, item } = itemToDelete;
        // Only songs and albums can be archived (playlists are DB-only)
        if (type === 'playlist') {
            await deletePlaylist(item.id);
            setItemToDelete(null);
            refreshAll();
            return;
        }

        try {
            await archiveItem(item.id, type);
            refreshAll();
        } catch (err) {
            console.error('Archive failed:', err);
        } finally {
            setItemToDelete(null);
        }
    };

    // Filter albums/artists/playlists/singles by search
    const filteredArtists = (artists || []).filter(artist =>
        artist.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group albums by name + artist to avoid "split" albums in the grid
    const processedAlbums = React.useMemo(() => {
        const groups = new Map();
        (albums || []).forEach(album => {
            const key = `${album.name?.toLowerCase()}|${album.artist?.name?.toLowerCase()}`;
            if (!groups.has(key)) {
                groups.set(key, album);
            }
        });
        return Array.from(groups.values());
    }, [albums]);

    const filteredAlbums = processedAlbums.filter(album =>
        ((album.song_count > 1 || album.song_count === undefined) || (album.song_count === 0)) &&
        (album.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            album.artist?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredPlaylists = (playlists || []).filter(playlist =>
        playlist.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSingles = React.useMemo(() => {
        // Real songs with no album_id
        const realSingles = (allSongs || []).filter(song => !song.album_id);

        // Count songs per album to find single-song albums
        const albumCounts = {};
        (allSongs || []).forEach(s => {
            if (s.album_id) albumCounts[s.album_id] = (albumCounts[s.album_id] || 0) + 1;
        });

        // Single-song albums (converted to song-like objects for the tab)
        // We check song_count property OR the calculated count
        const albumSingles = (albums || [])
            .filter(a => (a.song_count == 1) || (albumCounts[a.id] == 1))
            .map(a => ({
                id: a.id,
                title: a.name,
                artist: a.artist,
                album: a,
                isAlbumSingle: true,
                track_id: a.id,
                // Ensure we have a cover
                cover_url: a.cover_url,
                thumbnail_url: a.cover_url,
                // Add the song ID if we found it via count, for direct playback
                actual_song_id: (allSongs || []).find(s => s.album_id === a.id)?.id
            }));

        const combined = [...realSingles, ...albumSingles];
        return combined.filter(song =>
            song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.artist?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allSongs, albums, searchQuery]);

    // Load songs for singles tab
    useEffect(() => {
        if (activeTab === 'singles') {
            const loadAll = async () => {
                const results = await fetchAllSongs();
                setAllSongs(results || []);
            };
            loadAll();
        }
    }, [activeTab, fetchAllSongs]);

    // Check Sync Status
    const checkSyncStatus = useCallback(async () => {
        try {
            const res = await fetch(`${MUSIC_API_URL}/api/music/sync/status`);
            const data = await res.json();
            if (data.success && data.count > 0) {
                setMismatchDetected(true);
                setPendingSyncCount(data.count);
            } else {
                setMismatchDetected(false);
            }
        } catch (err) { }
    }, []);

    useEffect(() => {
        checkSyncStatus();

        // Listen for drive mount events
        if (window.electron?.ipcRenderer) {
            const removeListener = window.electron.ipcRenderer.on('system:volume-change', (data) => {
                console.log('📦 Volume change event received:', data);
                if (data.isMounted && data.filename === 'RANTUNES') {
                    checkSyncStatus();
                }
            });

            const removeCdListener = window.electron.ipcRenderer.on('system:cd-event', (data) => {
                console.log('📀 CD event received:', data);
                setIsCdMounted(data.isMounted);
                if (data.isMounted) setShowCDImport(true);
            });

            return () => {
                removeListener();
                removeCdListener();
            };
        }
    }, [checkSyncStatus]);

    // Load songs when album/playlist is selected
    useEffect(() => {
        const loadSongs = async () => {
            if (selectedAlbum?.id) {
                if (selectedAlbum.isPlaylist) {
                    const songs = await fetchPlaylistSongs(selectedAlbum.id);
                    setCurrentAlbumSongs(songs);
                } else if (selectedAlbum.isArtist) {
                    const songs = await fetchArtistSongs(selectedAlbum.id);
                    setCurrentAlbumSongs(songs);
                } else {
                    const songs = await fetchAlbumSongs(selectedAlbum.id);
                    setCurrentAlbumSongs(songs);
                }
            }
        };
        loadSongs();
    }, [selectedAlbum, fetchAlbumSongs, fetchPlaylistSongs, fetchArtistSongs]);

    // Handle artist click
    const handleArtistClick = async (artist) => {
        setSelectedAlbum({ ...artist, isArtist: true });
    };

    // Handle album click - just view songs, don't play
    const handleAlbumClick = async (album) => {
        setSelectedAlbum({ ...album, isPlaylist: false, isArtist: false });
        // Songs will be loaded by effect
    };

    // Handle playlist click
    const handlePlaylistClick = async (playlist) => {
        setSelectedAlbum({ ...playlist, isPlaylist: true, artist: { name: 'פלייליסט חכם' } });
        // Songs will be loaded by effect
    };

    // Handle album play - play all songs
    const handleAlbumPlay = async (album, mode = 'last') => {
        const songs = await fetchAlbumSongs(album.id);
        const playable = (songs || []).filter(s => (s?.myRating || 0) !== 1);
        if (playable.length > 0) {
            addPlaylistToQueue(playable, mode);
        }
    };

    // Handle playlist play
    const handlePlaylistPlay = async (playlist, mode = 'last') => {
        const songs = await fetchPlaylistSongs(playlist.id);
        const playable = (songs || []).filter(s => (s?.myRating || 0) !== 1);
        if (playable.length > 0) {
            addPlaylistToQueue(playable, mode);
        }
    };

    // Handle add to queue selection
    const handleQueueSelect = async (mode) => {
        if (!queueContext) return;

        if (queueContext.type === 'album') {
            handleAlbumPlay(queueContext.item, mode);
        } else {
            let item = queueContext.item;
            // If it's a "Single" that's actually an album with 1 song, fetch the song object
            if (item.isAlbumSingle) {
                const songs = await fetchAlbumSongs(item.id);
                if (songs?.[0]) {
                    item = songs[0];
                }
            }
            addToQueue(item, mode);
        }
        setQueueContext(null);
    };

    // Handle back from album view
    const handleBack = () => {
        setSelectedAlbum(null);
        setCurrentAlbumSongs([]);
    };

    // Handle exit
    const handleExit = () => {
        navigate('/mode-selection');
    };

    // Handle song play - Immediate play (User request: "Click plays immediately")
    const handleSongPlay = async (song) => {
        if ((song?.myRating || 0) === 1) return;

        let songToPlay = song;
        // If this is a single-song album wrapper, we need the actual song file path
        if (song.isAlbumSingle) {
            // Priority 1: Use the pre-calculated song ID if available
            if (song.actual_song_id && allSongs) {
                const found = allSongs.find(s => s.id === song.actual_song_id);
                if (found) {
                    playSong(found, [found], true);
                    return;
                }
            }

            try {
                const songs = await fetchAlbumSongs(song.id);
                if (songs && songs.length > 0) {
                    songToPlay = songs[0];
                }
            } catch (err) {
                console.error("Failed to fetch song for album single:", err);
                return;
            }
        }

        playSong(songToPlay, [songToPlay], true);
    };

    // Handle rating
    const handleRate = async (songId, rating) => {
        // Find the song to get current rating
        const songToUpdate = currentAlbumSongs.find(s => s.id === songId) ||
            favoriteSongs.find(s => s.id === songId) ||
            allSongs.find(s => s.id === songId);

        const currentRating = songToUpdate?.myRating || 0;

        // Toggle logic: if same rating, set to 0 (remove)
        const finalRating = currentRating === rating ? 0 : rating;

        console.log('🎵 handleRate toggle:', { songId, current: currentRating, requested: rating, final: finalRating });

        const ok = await rateSong(songId, finalRating);
        if (!ok) return;

        // Optimistic UI update
        setCurrentAlbumSongs(prev => prev.map(s => s.id === songId ? { ...s, myRating: finalRating } : s));
        setAllSongs(prev => prev.map(s => s.id === songId ? { ...s, myRating: finalRating } : s));
        setFavoriteSongs(prev => {
            const exists = prev.some(s => s.id === songId);
            if (finalRating === 5) {
                if (exists) return prev.map(s => s.id === songId ? { ...s, myRating: 5 } : s);
                const src = currentAlbumSongs.find(s => s.id === songId) || allSongs.find(s => s.id === songId);
                return src ? [{ ...src, myRating: 5 }, ...prev] : prev;
            }
            if (finalRating === 1 || finalRating === 0) {
                // remove from favorites if disliked or removed
                return prev.filter(s => s.id !== songId);
            }
            return prev;
        });

        // Refresh from server after a short delay
        setTimeout(async () => {
            try {
                if (selectedAlbum) {
                    if (selectedAlbum.isPlaylist) {
                        const songs = await fetchPlaylistSongs(selectedAlbum.id);
                        setCurrentAlbumSongs(songs);
                    } else {
                        const songs = await fetchAlbumSongs(selectedAlbum.id);
                        setCurrentAlbumSongs(songs);
                    }
                }
                // Refresh favorites if we're on that tab
                if (activeTab === 'favorites') {
                    await loadFavorites();
                }
            } catch (err) {
                console.error('Error refreshing after rating:', err);
            }
        }, 500);
    };



    // Load favorites
    const loadFavorites = useCallback(async () => {
        const songs = await fetchFavoritesSongs();
        setFavoriteSongs(songs || []);
    }, [fetchFavoritesSongs]);

    // Load favorites when opening the favorites tab
    useEffect(() => {
        if (activeTab === 'favorites') loadFavorites();
        if (activeTab === 'singles' && allSongs.length === 0) {
            fetchAllSongs().then(setAllSongs);
        }
    }, [activeTab, loadFavorites, allSongs.length, fetchAllSongs]);

    // Get songs to display (current album or playlist)
    const displaySongs = currentAlbumSongs.length > 0 ? currentAlbumSongs : playlist;

    return (
        <div className="h-screen overflow-hidden music-gradient-dark flex flex-col" dir="rtl">
            {/* Unified Header - Dark Mode Forced */}
            <UnifiedHeader
                title="מוזיקה"
                subtitle="ניהול ספריית מוזיקה ופלייליסטים"
                onHome={() => navigate('/mode-selection')}
                forceMusicDark={true}
                className="music-header"
            >
                <div className="flex items-center gap-3">
                    {/* Library Tools / Edit Actions */}
                    <div className="flex items-center gap-2">
                        {isEditMode ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedItems.length === 0}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all
                                        ${selectedItems.length > 0 ? 'bg-red-500 text-white shadow-lg' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>מחק {selectedItems.length}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setSelectedItems([]);
                                    }}
                                    className="px-4 py-1.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20"
                                >
                                    ביטול
                                </button>
                            </div>
                        ) : (
                            isManager && (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs hover:bg-indigo-500/30 transition-all"
                                >
                                    <List className="w-3.5 h-3.5" />
                                    <span>עריכה</span>
                                </button>
                            )
                        )}

                        {!isEditMode && (
                            <>
                                {isCdMounted && (
                                    <button
                                        onClick={() => setShowCDImport(true)}
                                        className="w-9 h-9 rounded-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 flex items-center justify-center animate-pulse"
                                        title="דיסק פיזי זוהה"
                                    >
                                        <Disc className="w-4 h-4 text-blue-400" />
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowYouTubeIngest(true)}
                                    className="w-9 h-9 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 flex items-center justify-center transition-all active:scale-90 shadow-lg"
                                    title="ייבוא מ-YouTube"
                                >
                                    <Download className="w-4 h-4 text-red-400" />
                                </button>

                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-90"
                                    title="סרוק ספרייה"
                                >
                                    <FolderOpen className="w-4 h-4 text-white/70" />
                                </button>

                                <button
                                    onClick={refreshAll}
                                    className={`w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-90
                                           ${isLoading ? 'animate-spin' : ''}`}
                                    title="רענן"
                                >
                                    <RefreshCw className="w-4 h-4 text-white/70" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    {/* Source Indicator */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-[10px] font-black tracking-tight transition-all shadow-sm
                        ${isMusicDriveConnected ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'}`}>
                        {isMusicDriveConnected ? <HardDrive className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        <span className="uppercase tracking-wider">{isMusicDriveConnected ? 'RANTUNES' : 'Local Disk'}</span>
                    </div>
                </div>
            </UnifiedHeader>

            {/* Sync Notification Banner */}
            <AnimatePresence>
                {mismatchDetected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-purple-600 overflow-hidden"
                    >
                        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-white animate-pulse" />
                                <span className="text-white text-sm font-bold">
                                    זוהה פער בספרייה: {pendingSyncCount} שירים ממתינים לסינכרון לדיסק RANTUNES
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSyncOverlay(true)}
                                    className="px-4 py-1 bg-white text-purple-600 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors"
                                >
                                    סינכרון כעת
                                </button>
                                <button
                                    onClick={() => setMismatchDetected(false)}
                                    className="p-1 hover:bg-black/10 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/70" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="music-split-layout flex-1 flex overflow-hidden">
                {/* Right side - Vinyl Turntable or Queue */}
                <div
                    className="music-split-right order-last flex flex-col items-center justify-center p-6 relative"
                >
                    <AnimatePresence mode="wait">
                        {!showQueue ? (
                            <motion.div
                                key="turntable"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center justify-center w-full"
                            >
                                <VinylTurntable
                                    key={currentSong?.id || 'no-song'}
                                    song={currentSong}
                                    isPlaying={isPlaying}
                                    albumArt={currentSong?.album?.cover_url || currentSong?.cover_url || currentSong?.thumbnail_url}
                                    onTogglePlay={(forcePlayFirst) => {
                                        if (forcePlayFirst && playlist.length > 0 && !currentSong) {
                                            playSong(playlist[0], null, true);
                                        } else {
                                            togglePlay();
                                        }
                                    }}
                                    queue={playlist}
                                />

                                {/* Player controls */}
                                <div className="flex flex-col items-center w-full max-w-sm mt-8">
                                    {/* Progress & Time - Always show if we have a song OR a queue (since turntable shows queue item) */}
                                    {(currentSong || playlist.length > 0) && (
                                        <>
                                            <div className="w-full flex items-center gap-3 mb-6 px-4" dir="ltr">
                                                <span className="text-white/40 text-xs w-10 text-right font-mono">
                                                    {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                                                </span>

                                                {/* Interactive Progress Bar */}
                                                <div
                                                    className="relative flex-1 h-6 group cursor-pointer flex items-center"
                                                    onClick={(e) => {
                                                        if (!duration) return;
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const percent = (e.clientX - rect.left) / rect.width;
                                                        seek(Math.min(Math.max(0, percent), 1) * duration);
                                                    }}
                                                >
                                                    {/* Background Track */}
                                                    <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        {/* Progress Fill */}
                                                        <motion.div
                                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                                            layoutId="progressBar"
                                                        />
                                                    </div>

                                                    {/* Scrubber Knob (visible on hover) */}
                                                    <motion.div
                                                        className="absolute w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
                                                    />
                                                </div>

                                                <span className="text-white/40 text-xs w-10 font-mono">
                                                    {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-6" dir="ltr">
                                                <button
                                                    onClick={handlePrevious}
                                                    disabled={!currentSong && playlist.length === 0}
                                                    className="w-14 h-14 rounded-2xl music-glass flex items-center justify-center hover:scale-110 transition-transform border border-white/10 disabled:opacity-50"
                                                >
                                                    <SkipBack className="w-6 h-6 text-white" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (!currentSong && playlist.length > 0) {
                                                            playSong(playlist[0], null, true);
                                                        } else {
                                                            togglePlay();
                                                        }
                                                    }}
                                                    className="w-20 h-20 rounded-3xl music-gradient-purple flex items-center justify-center shadow-2xl hover:scale-105 transition-transform border border-white/20"
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="w-9 h-9 text-white fill-current" />
                                                    ) : (
                                                        <Play className="w-9 h-9 text-white fill-current ml-1" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={handleNext}
                                                    disabled={!currentSong && playlist.length === 0}
                                                    className="w-14 h-14 rounded-2xl music-glass flex items-center justify-center hover:scale-110 transition-transform border border-white/10 disabled:opacity-50"
                                                >
                                                    <SkipForward className="w-6 h-6 text-white" />
                                                </button>
                                            </div>

                                            {/* Volume Control */}
                                            <div className="flex items-center gap-3 mt-8 w-full px-4" dir="ltr">
                                                <VolumeX className="w-4 h-4 text-white/40 cursor-pointer hover:text-white" onClick={() => setVolume(0)} />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    value={volume}
                                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                                                />
                                                <Volume2 className="w-4 h-4 text-white/40 cursor-pointer hover:text-white" onClick={() => setVolume(1)} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="queue"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                className="w-full h-full flex flex-col"
                            >
                                <MusicQueue />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* View Toggle Button */}
                    <button
                        onClick={() => setShowQueue(!showQueue)}
                        className={`absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border z-30
                            ${showQueue
                                ? 'bg-purple-600 text-white border-purple-400 shadow-lg'
                                : 'music-glass text-white/60 border-white/10 hover:text-white'}`}
                        title={showQueue ? "חזרה לנגן" : "הצג תור נגינה"}
                    >
                        {showQueue ? <Disc className="w-6 h-6" /> : <ListMusic className="w-6 h-6" />}
                    </button>


                </div>

                {/* Left side - Song list / Albums */}
                <div className="music-split-left flex-1 flex flex-col overflow-hidden">
                    {error && String(error).includes('Missing Supabase Credentials') && (
                        <div className="p-4">
                            <div className="music-glass rounded-2xl p-4 border border-red-500/30">
                                <p className="text-white font-bold mb-1">שרת המוזיקה לא מוגדר</p>
                                <p className="text-white/60 text-sm">
                                    חסרים משתני סביבה בשרת: <span className="font-mono">SUPABASE_URL</span> ו-<span className="font-mono">SUPABASE_SERVICE_KEY</span>.
                                    בלי זה לא ניתן לשמור/לקרוא את ספריית המוזיקה.
                                </p>
                            </div>
                        </div>
                    )}

                    {selectedAlbum ? (
                        /* Selected album - FIXED HEADER + SCROLLABLE LIST */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* STICKY ALBUM HEADER */}
                            <div className="p-6 pb-4 bg-black/40 backdrop-blur-xl border-b border-white/10 z-20 shrink-0">
                                <div className="flex items-center gap-5">
                                    <button
                                        onClick={handleBack}
                                        className="w-12 h-12 rounded-2xl music-glass flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                                    >
                                        <ArrowRight className="w-6 h-6 text-white" />
                                    </button>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-4 mb-1">
                                            <h2 className="text-white text-4xl font-black tracking-tight truncate drop-shadow-lg">{selectedAlbum.name}</h2>
                                            <button
                                                onClick={() => setQueueContext({ item: selectedAlbum, type: 'album' })}
                                                className="group relative"
                                                title="הוסף אלבום לתור"
                                            >
                                                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/20 group-active:scale-95 shadow-2xl">
                                                    <Plus className="w-6 h-6 text-white" />
                                                </div>
                                            </button>
                                        </div>
                                        <p className="text-white/60 font-bold mt-0.5">{selectedAlbum.artist?.name} • {currentAlbumSongs.length} שירים</p>
                                    </div>
                                </div>
                            </div>

                            {/* SCROLLABLE SONG LIST */}
                            <div className="flex-1 overflow-y-auto music-scrollbar p-4">
                                <div className="space-y-1">
                                    {currentAlbumSongs.map((song, index) => (
                                        <SongRow
                                            key={song.id}
                                            song={song}
                                            index={index}
                                            isPlaying={isPlaying}
                                            isCurrentSong={currentSong?.id === song.id}
                                            onPlay={handleSongPlay}
                                            onRate={handleRate}
                                            onDelete={(s) => handleDeleteClick('song', s)}
                                            onQueue={(item) => setQueueContext({ item, type: 'song' })}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Album grid */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="p-6 pb-2 shrink-0">
                                <nav className="flex items-center gap-2 mb-4">
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                                           ${activeTab === tab.id
                                                    ? 'music-gradient-purple text-white'
                                                    : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            <span className="font-medium">{tab.label}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="flex-1 overflow-y-auto music-scrollbar p-6 pt-2">
                                {/* Albums grid */}
                                {activeTab === 'albums' && (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                        {isManager && (
                                            <AddMusicCard tabId="albums" onAdd={(tracks) => {
                                                if (tracks && tracks.length > 0) {
                                                    setSelectedBatch(tracks);
                                                }
                                                setShowYouTubeIngest(true);
                                            }} />
                                        )}

                                        {isLoading && albums.length === 0 ? (
                                            <div className="col-span-full flex items-center justify-center py-12">
                                                <div className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                            </div>
                                        ) : !isMusicDriveConnected && filteredAlbums.length === 0 ? (
                                            <div className="col-span-full text-center py-12">
                                                <HardDrive className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                                                <p className="text-white/60 text-lg mb-2">כונן המוזיקה לא מחובר</p>
                                                <p className="text-white/40 text-sm mb-4">חבר את הכונן ונסה שוב</p>
                                                <button onClick={handleRetryDisk} className="px-6 py-3 music-gradient-purple rounded-xl text-white font-medium">בדוק שוב</button>
                                            </div>
                                        ) : (
                                            filteredAlbums.map(album => (
                                                <AlbumCard
                                                    key={album.id}
                                                    album={album}
                                                    onClick={isEditMode ? () => toggleItemSelection(album.id) : handleAlbumClick}
                                                    onPlay={isEditMode ? null : handleAlbumPlay}
                                                    selectionMode={isEditMode}
                                                    isSelected={selectedItems.includes(album.id)}
                                                    onDelete={isEditMode ? null : (item) => handleDeleteClick('album', item)}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Artists grid */}
                                {activeTab === 'artists' && (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                        {isManager && (
                                            <AddMusicCard tabId="artists" onAdd={(tracks) => {
                                                if (tracks && tracks.length > 0) {
                                                    setSelectedBatch(tracks);
                                                }
                                                setShowYouTubeIngest(true);
                                            }} />
                                        )}
                                        {filteredArtists.map(artist => {
                                            const initials = artist.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                                            const artistGradients = [
                                                'from-pink-600 to-rose-500',
                                                'from-purple-600 to-indigo-500',
                                                'from-blue-600 to-cyan-500',
                                                'from-emerald-600 to-teal-500',
                                                'from-orange-600 to-amber-500',
                                                'from-red-600 to-pink-500',
                                            ];
                                            const gradIdx = (artist.name?.charCodeAt(0) || 0) % artistGradients.length;
                                            const artistImageUrl = artist.image_url
                                                ? (artist.image_url.startsWith('http') ? artist.image_url : `${MUSIC_API_URL}/music/cover?path=${encodeURIComponent(artist.image_url)}`)
                                                : null;

                                            const isSelected = selectedItems.includes(artist.id);

                                            return (
                                                <motion.div
                                                    key={artist.id}
                                                    whileHover={!isEditMode ? { scale: 1.03 } : { scale: 1.01 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`rounded-2xl overflow-hidden group relative cursor-pointer transition-all
                                                        ${isEditMode && isSelected ? 'ring-4 ring-purple-500 opacity-100' : isEditMode ? 'opacity-60' : ''}`}
                                                    onClick={() => isEditMode ? toggleItemSelection(artist.id) : handleArtistClick(artist)}
                                                >
                                                    <div className="aspect-square relative overflow-hidden">
                                                        {artistImageUrl ? (
                                                            <img
                                                                src={artistImageUrl}
                                                                alt={artist.name}
                                                                className={`w-full h-full object-cover transition-transform duration-500 ${!isEditMode ? 'group-hover:scale-110' : ''}`}
                                                                loading="lazy"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className={`w-full h-full bg-gradient-to-br ${artistGradients[gradIdx]} flex items-center justify-center`}>
                                                                <span className="text-white/80 text-4xl font-black select-none">{initials}</span>
                                                            </div>
                                                        )}

                                                        {isEditMode && (
                                                            <div className={`absolute top-3 left-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-20
                                                                ${isSelected ? 'bg-purple-500 border-white' : 'bg-black/20 border-white/30'}`}>
                                                                {isSelected && <div className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mt-[-2px]" />}
                                                            </div>
                                                        )}

                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-2.5 px-3 z-10">
                                                            <h3 className="text-white font-bold text-sm truncate">{artist.name}</h3>
                                                            <p className="text-white/60 text-xs">אמן</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Playlists grid */}
                                {activeTab === 'playlists' && (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                        {isManager && (
                                            <AddMusicCard tabId="playlists" onAdd={(tracks) => {
                                                if (tracks && tracks.length > 0) {
                                                    setSelectedBatch(tracks);
                                                }
                                                setShowYouTubeIngest(true);
                                            }} />
                                        )}
                                        {filteredPlaylists.map(playlist => {
                                            const isSelected = selectedItems.includes(playlist.id);
                                            return (
                                                <motion.div
                                                    key={playlist.id}
                                                    whileHover={!isEditMode ? { scale: 1.03 } : { scale: 1.01 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`rounded-2xl overflow-hidden group relative cursor-pointer transition-all
                                                        ${isEditMode && isSelected ? 'ring-4 ring-purple-500 opacity-100' : isEditMode ? 'opacity-60' : ''}`}
                                                    onClick={() => isEditMode ? toggleItemSelection(playlist.id) : handlePlaylistClick(playlist)}
                                                >
                                                    <div className="aspect-square bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center relative overflow-hidden">
                                                        <ListMusic className="w-16 h-16 text-white/25" />

                                                        {isEditMode && (
                                                            <div className={`absolute top-3 left-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-20
                                                                ${isSelected ? 'bg-purple-500 border-white' : 'bg-black/20 border-white/30'}`}>
                                                                {isSelected && <div className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mt-[-2px]" />}
                                                            </div>
                                                        )}

                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-2.5 px-3 z-10">
                                                            <h3 className="text-white font-bold text-sm truncate">{playlist.name}</h3>
                                                            <p className="text-white/60 text-xs">
                                                                {playlist.created_at ? new Date(playlist.created_at).toLocaleDateString('he-IL') : 'פלייליסט'}
                                                            </p>
                                                        </div>

                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Singles grid */}
                                {activeTab === 'singles' && (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                        {isManager && (
                                            <AddMusicCard tabId="singles" onAdd={(tracks) => {
                                                if (tracks && tracks.length > 0) {
                                                    setSelectedBatch(tracks);
                                                }
                                                setShowYouTubeIngest(true);
                                            }} />
                                        )}
                                        {filteredSingles.map((song) => {
                                            const isSelected = selectedItems.includes(song.id);
                                            return (
                                                <motion.div
                                                    key={song.id}
                                                    whileHover={!isEditMode ? { scale: 1.03 } : { scale: 1.01 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`rounded-2xl overflow-hidden group relative cursor-pointer transition-all
                                                        ${isEditMode && isSelected ? 'ring-4 ring-purple-500 opacity-100' : isEditMode ? 'opacity-60' : ''}
                                                        ${!isEditMode && currentSong?.id === song.id ? 'ring-2 ring-purple-500' : ''}`}
                                                    onClick={() => isEditMode ? toggleItemSelection(song.id) : handleSongPlay(song)}
                                                >
                                                    <div className={`aspect-square flex items-center justify-center relative overflow-hidden
                                                        ${getSongGradient(song.title)}`}>
                                                        <Music className="w-14 h-14 text-white/20" />

                                                        {isEditMode && (
                                                            <div className={`absolute top-3 left-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-20
                                                                ${isSelected ? 'bg-purple-500 border-white' : 'bg-black/20 border-white/30'}`}>
                                                                {isSelected && <div className="w-3 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mt-[-2px]" />}
                                                            </div>
                                                        )}

                                                        {!isEditMode && currentSong?.id === song.id && isPlaying && (
                                                            <div className="absolute bottom-3 left-3 flex items-center gap-[2px] z-10">
                                                                <div className="w-1 h-3 bg-white rounded-full animate-music-bar-1" />
                                                                <div className="w-1 h-5 bg-white rounded-full animate-music-bar-2" />
                                                                <div className="w-1 h-2 bg-white rounded-full animate-music-bar-3" />
                                                            </div>
                                                        )}

                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-2.5 px-3 z-10">
                                                            <h3 className="text-white font-bold text-sm truncate">{song.title}</h3>
                                                            <p className="text-white/60 text-xs truncate">{song.artist?.name || 'אמן לא ידוע'}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Favorites - list style with song rows */}
                                {activeTab === 'favorites' && (
                                    <div className="space-y-1">
                                        {favoriteSongs.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Heart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                                                <p className="text-white/40 text-lg mb-1">אין מועדפים עדיין</p>
                                                <p className="text-white/30 text-sm">לחץ על 👍 ליד שיר כדי להוסיף למועדפים</p>
                                            </div>
                                        ) : (
                                            favoriteSongs.map((song, index) => (
                                                <SongRow
                                                    key={song.id}
                                                    song={song}
                                                    index={index}
                                                    isPlaying={isPlaying}
                                                    isCurrentSong={currentSong?.id === song.id}
                                                    onPlay={(s) => playSong(s, favoriteSongs.filter(x => (x?.myRating || 0) !== 1))}
                                                    onRate={handleRate}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Popups & Overlays */}
                {/* Playlist builder modal */}
                {showPlaylistBuilder && (
                    <PlaylistBuilder
                        onClose={() => setShowPlaylistBuilder(false)}
                        onSuccess={() => {
                            setShowPlaylistBuilder(false);
                            fetchPlaylists();
                        }}
                    />
                )}

                {/* Directory scanner modal */}
                <AnimatePresence>
                    {showScanner && (
                        <DirectoryScanner
                            isOpen={showScanner}
                            onClose={() => setShowScanner(false)}
                            onScan={scanMusicDirectory}
                            isDriveConnected={isMusicDriveConnected}
                        />
                    )}
                </AnimatePresence>

                {/* YouTube Ingest */}
                {showYouTubeIngest && (
                    <YouTubeIngest
                        initialVideo={selectedYoutubeVideo}
                        initialTracks={selectedBatch}
                        initialQuery={searchQuery}
                        context={importContext}
                        isManager={isManager}
                        onClose={() => {
                            setShowYouTubeIngest(false);
                            setSelectedYoutubeVideo(null);
                            setSelectedBatch(null);
                            setSearchQuery('');
                        }}
                        onSuccess={() => {
                            refreshAll();
                            checkSyncStatus();
                            setShowYouTubeIngest(false);
                            setSelectedBatch(null);
                        }}
                    />
                )}

                {/* CD Import Modal */}
                <CDImportModal
                    isOpen={showCDImport}
                    onClose={() => setShowCDImport(false)}
                    onSuccess={() => {
                        refreshAll();
                        checkSyncStatus();
                    }}
                />

                {/* Queue Selection Modal */}
                <QueueModeModal
                    isOpen={!!queueContext}
                    onClose={() => setQueueContext(null)}
                    onSelect={handleQueueSelect}
                    title={queueContext?.type === 'album' ? selectedAlbum?.name : (queueContext?.item?.title)}
                />

                {/* Sync Overlay */}
                <AnimatePresence>
                    {showSyncOverlay && (
                        <SyncOverlay
                            isOpen={showSyncOverlay}
                            onClose={() => setShowSyncOverlay(false)}
                            onSyncComplete={() => {
                                refreshAll();
                                checkSyncStatus();
                            }}
                        />
                    )}
                </AnimatePresence>



                {/* Disk Not Connected Popup */}
                <AnimatePresence>
                    {showDiskPopup && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setShowDiskPopup(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="music-glass rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-amber-500/20 mb-6 flex items-center justify-center mx-auto">
                                        <AlertCircle className="w-10 h-10 text-amber-400" />
                                    </div>
                                    <h3 className="text-white text-2xl font-bold mb-3">כונן לא מחובר</h3>
                                    <p className="text-white/60 mb-8">
                                        לא הצלחנו לזהות את כונן המוזיקה.
                                        <br />
                                        וודא שהכונן מחובר כראוי ונסה שוב.
                                    </p>

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={handleRetryDisk}
                                            className="px-8 py-3 music-gradient-purple hover:opacity-90 rounded-xl text-white font-bold transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            נסה שוב
                                        </button>
                                        <button
                                            onClick={() => setShowDiskPopup(false)}
                                            className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Delete Confirmation Dialog */}
                <AnimatePresence>
                    {itemToDelete && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setItemToDelete(null)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[#1e1e2e] rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
                                onClick={e => e.stopPropagation()}
                                dir="rtl"
                            >
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-red-500/10 mb-6 flex items-center justify-center mx-auto">
                                        <Trash2 className="w-10 h-10 text-red-500" />
                                    </div>
                                    <h3 className="text-white text-2xl font-bold mb-3">אישור מחיקה</h3>
                                    <p className="text-white/60 mb-6">
                                        האם אתה בטוח שברצונך למחוק את {itemToDelete.type === 'album' ? 'האלבום' : itemToDelete.type === 'playlist' ? 'הפלייליסט' : 'השיר'}
                                        <br />
                                        <span className="text-white font-bold">"{itemToDelete.item.name || itemToDelete.item.title}"</span>?
                                    </p>

                                    {(itemToDelete.type === 'album' || itemToDelete.type === 'song') && (
                                        <div className="bg-white/5 p-4 rounded-2xl mb-8 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                                            onClick={() => setDeleteFiles(!deleteFiles)}>
                                            <div className="text-right">
                                                <p className="text-white font-medium text-sm">מחק גם קבצים פיזיים מהדיסק</p>
                                                <p className="text-white/40 text-xs text-red-400/80">אזהרה: פעולה זו לא ניתנת לביטול</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${deleteFiles ? 'bg-red-600 border-red-600' : 'border-white/20'}`}>
                                                {deleteFiles && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <button
                                            onClick={confirmArchive}
                                            className="py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 font-bold transition-all flex flex-col items-center justify-center p-2"
                                        >
                                            <Archive className="w-5 h-5 mb-1" />
                                            <span className="text-xs">העבר לארכיון SSD</span>
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            className="py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-red-400 font-bold transition-all flex flex-col items-center justify-center p-2"
                                        >
                                            <Trash2 className="w-5 h-5 mb-1" />
                                            <span className="text-xs">מחק לצמיתות</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setItemToDelete(null)}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 text-sm font-medium transition-colors"
                                    >
                                        ביטול
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};

// Export without wrapper
const MusicPage = () => {
    return <MusicPageContent />;
};

export default MusicPage;