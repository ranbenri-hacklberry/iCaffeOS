import React, { useState, useEffect } from 'react';
import { Download, Search, Music, Disc, User, Check, AlertCircle, Loader2, Link, X, List, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackendApiUrl } from '@/utils/apiUtils';
import YouTubeSearch from './YouTubeSearch';

const YouTubeIngest = ({ onClose, onSuccess, initialVideo = null, initialQuery = '', context = null }) => {
    const [mode, setMode] = useState(initialVideo ? 'url' : 'search'); // search, url
    const [url, setUrl] = useState(initialVideo ? `https://www.youtube.com/watch?v=${initialVideo.id}` : '');
    const [step, setStep] = useState(initialVideo ? 'analyzing' : 'input'); // input, analyzing, review, downloading, success, error, batch_downloading
    const [error, setError] = useState(null);
    const [quota, setQuota] = useState(null);
    const MUSIC_API_URL = getBackendApiUrl();

    // Single item metadata
    const [metadata, setMetadata] = useState({
        title: initialVideo?.title || '',
        artist: initialVideo?.artist || '',
        album: context?.type === 'album' && context?.collectionId ? context.label : (initialVideo?.album || (context?.type === 'album' ? 'Unknown Album' : 'Single')),
        thumbnail: initialVideo?.thumbnail || '',
        duration: initialVideo?.duration || 0
    });

    // Batch download state
    const [downloadQueue, setDownloadQueue] = useState([]);
    const [completedQueue, setCompletedQueue] = useState([]);
    const [currentBatchItem, setCurrentBatchItem] = useState(null);

    useEffect(() => {
        if (initialVideo) {
            handleAnalyze(`https://www.youtube.com/watch?v=${initialVideo.id}`);
        }
        fetchQuota();
    }, []);

    const fetchQuota = async () => {
        try {
            const res = await fetch(`${MUSIC_API_URL}/music/youtube/quota`);
            if (res.ok) {
                const data = await res.json();
                setQuota(data);
            }
        } catch (err) { }
    };

    const handleAnalyze = async (targetUrl, existingMetadata = null) => {
        setStep('analyzing');
        setError(null);
        setUrl(targetUrl);

        try {
            // Check Quota
            if (quota?.isExceeded) {
                throw new Error('המכסה היומית של YouTube הסתיימה. נסה שוב מחר.');
            }

            let data;
            if (window.electron?.music?.getYoutubeMetadata) {
                data = await window.electron.music.getYoutubeMetadata(targetUrl);
            } else {
                const res = await fetch(`${MUSIC_API_URL}/music/youtube/metadata?url=${encodeURIComponent(targetUrl)}`);
                if (!res.ok) throw new Error(await res.text() || 'Failed to fetch metadata from server');
                data = await res.json();
            }

            // Basic heuristic to split Artist - Title if not provided
            let artist = existingMetadata?.artist || data.uploader || 'Unknown Artist';
            let title = existingMetadata?.title || data.title || 'Unknown Title';

            if (!existingMetadata && data.title && data.title.includes('-')) {
                const parts = data.title.split('-');
                if (parts.length >= 2) {
                    artist = parts[0].trim();
                    title = parts.slice(1).join('-').trim();
                }
            }

            setMetadata({
                title: title,
                artist: artist,
                album: metadata.album || 'Single',
                thumbnail: data.thumbnail || existingMetadata?.thumbnail,
                duration: data.duration
            });
            setStep('review');
            fetchQuota();
        } catch (err) {
            console.error('Analysis failed:', err);
            setError(err.message || 'Failed to analyze URL');
            setStep('input');
        }
    };

    const handleDownload = async () => {
        setStep('downloading');
        setError(null);

        try {
            const downloadParams = {
                url,
                title: metadata.title,
                artist: metadata.artist,
                album: metadata.album,
                thumbnail: metadata.thumbnail
            };

            if (window.electron?.music?.downloadYoutube) {
                await window.electron.music.downloadYoutube(downloadParams);
            } else {
                const res = await fetch(`${MUSIC_API_URL}/music/youtube/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(downloadParams)
                });
                if (!res.ok) throw new Error(await res.text() || 'Download failed on server');
            }

            setStep('success');
            if (onSuccess) onSuccess();

        } catch (err) {
            console.error('Download failed:', err);
            setError(err.message || 'Download failed');
            setStep('review');
        }
    };

    const handleBatchPlay = (track, extras, batchContext) => {
        const all = [track, ...(extras || [])];
        startBatchDownload(all, batchContext);
    };

    // New: Handle Batch Downloads
    const startBatchDownload = async (tracks, batchContext) => {
        setStep('batch_downloading');
        setDownloadQueue(tracks);
        setCompletedQueue([]);

        // Process one by one
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            setCurrentBatchItem({ ...track, index: i + 1, total: tracks.length });

            try {
                const videoUrl = `https://www.youtube.com/watch?v=${track.id}`;

                // If we have a batch context (like a playlist), use its title as the album name
                // This keeps the disk organized into one folder: "Artist - Collection Name"
                let albumName = 'Single';
                if (batchContext?.type === 'playlist') {
                    albumName = batchContext.title;
                } else if (context?.type === 'album') {
                    albumName = context.label;
                }

                const downloadParams = {
                    url: videoUrl,
                    title: track.title,
                    artist: track.artist || 'YouTube Artist',
                    album: albumName,
                    thumbnail: track.thumbnail
                };

                if (window.electron?.music?.downloadYoutube) {
                    await window.electron.music.downloadYoutube(downloadParams);
                } else {
                    const res = await fetch(`${MUSIC_API_URL}/music/youtube/download`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(downloadParams)
                    });
                    if (!res.ok) throw new Error('Download failed');
                }

                setCompletedQueue(prev => [...prev, track.id]);
            } catch (err) {
                console.error('Batch item failed:', err);
                // Continue with next item even if one fails
            }
        }

        setStep('success');
        if (onSuccess) onSuccess();
    };

    const reset = () => {
        setUrl('');
        setMetadata({
            title: '',
            artist: '',
            album: context?.type === 'album' && context?.collectionId ? context.label : 'Single',
            thumbnail: '',
            duration: 0
        });
        setStep('input');
        setDownloadQueue([]);
        setCompletedQueue([]);
        setCurrentBatchItem(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1e1e2e] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-white/10"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-l from-red-600/20 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                            <Download className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">ייבוא מ-YouTube</h2>
                            <p className="text-xs text-white/50">הורד שירים ישירות לכונן ה-SSD</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'input' && (
                        <div className="flex flex-col h-[500px]">
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setMode('search')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                                            ${mode === 'search' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    <Search className="w-4 h-4" />
                                    חיפוש
                                </button>
                                <button
                                    onClick={() => setMode('url')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                                            ${mode === 'url' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    <Link className="w-4 h-4" />
                                    כתובת URL
                                </button>
                            </div>

                            {mode === 'search' ? (
                                <div className="flex-1 overflow-hidden">
                                    <YouTubeSearch
                                        initialQuery={initialQuery}
                                        onPlayTrack={(track, extras, batchContext) => {
                                            if (extras || batchContext) {
                                                handleBatchPlay(track, extras, batchContext);
                                            } else {
                                                const videoUrl = `https://www.youtube.com/watch?v=${track.id}`;
                                                setUrl(videoUrl);
                                                setMetadata({
                                                    title: track.title,
                                                    artist: track.artist || '',
                                                    album: context?.type === 'album' && context?.collectionId ? context.label : 'Single',
                                                    thumbnail: track.thumbnail,
                                                    duration: track.duration || 0
                                                });
                                                handleAnalyze(videoUrl, track);
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">קישור לשיר ב-YouTube</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:outline-none focus:border-red-500 transition-all"
                                            />
                                            <Link className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAnalyze(url)}
                                        disabled={!url.includes('youtube.com') && !url.includes('youtu.be')}
                                        className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                    >
                                        נתח כתובת
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'analyzing' && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                                <Search className="absolute inset-0 m-auto w-6 h-6 text-red-500" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white mb-1">מנתח את הסרטון...</h3>
                                <p className="text-white/40 text-sm">מושך נתונים מ-YouTube</p>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="space-y-6">
                            <div className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-slate-900">
                                    <img src={metadata.thumbnail} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="text-lg font-bold text-white truncate">{metadata.title}</h3>
                                    <p className="text-white/50">{metadata.artist}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full border border-red-500/20">YouTube</span>
                                        {metadata.duration > 0 && <span className="text-[10px] text-white/30">{Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1 mr-1">שם השיר</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={metadata.title}
                                            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-sm focus:border-red-500/50 outline-none"
                                        />
                                        <Music className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/40 mb-1 mr-1">אמן</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={metadata.artist}
                                            onChange={(e) => setMetadata({ ...metadata, artist: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-sm focus:border-red-500/50 outline-none"
                                        />
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-white/40 mb-1 mr-1">אלבום / קטגוריה</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={metadata.album}
                                            onChange={(e) => setMetadata({ ...metadata, album: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-sm focus:border-red-500/50 outline-none"
                                        />
                                        <Disc className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button onClick={reset} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all">ביטול</button>
                                <button onClick={handleDownload} className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                                    <Download className="w-5 h-5" />
                                    הורד עכשיו
                                </button>
                            </div>
                        </div>
                    )}

                    {(step === 'downloading' || step === 'batch_downloading') && (
                        <div className="py-16 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                                <Download className="absolute inset-0 m-auto w-8 h-8 text-red-500 animate-bounce" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white mb-1">
                                    {step === 'batch_downloading'
                                        ? `מוריד שיר ${currentBatchItem?.index} מתוך ${currentBatchItem?.total}...`
                                        : 'מוריד שיר...'}
                                </h3>
                                <p className="text-white/40 text-sm truncate max-w-xs mx-auto">
                                    {step === 'batch_downloading' ? currentBatchItem?.title : metadata.title}
                                </p>
                            </div>

                            {step === 'batch_downloading' && (
                                <div className="w-full max-w-xs space-y-2 text-center">
                                    <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(completedQueue.length / downloadQueue.length) * 100}%` }}
                                            className="h-full bg-red-600"
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/50">{completedQueue.length} הושלמו</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
                                <Check className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">ההורדה הושלמה!</h3>
                                <p className="text-white/60 text-sm">השיר נוסף בהצלחה לכונן ה-SSD</p>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                                    סגור
                                </button>
                                <button onClick={reset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition-colors font-medium">
                                    הורד שיר נוסף
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default YouTubeIngest;
