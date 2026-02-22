import React, { useState, useEffect } from 'react';
import { House } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiniMusicPlayer from './music/MiniMusicPlayer';
import ConnectivityStatus from './ConnectivityStatus';

import { useAuth } from '../context/AuthContext';

const UnifiedHeader = ({
    title: propTitle,
    subtitle: propSubtitle,
    hideTitle = false,
    onHome,
    children, // Left side components (in RTL)
    rightContent, // Next to Home button (in RTL)
    className = '',
    forceMusicDark = false,
    showMusicPlayer = true
}) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fallback logic for title/subtitle
    const title = propTitle || currentUser?.business_name || currentUser?.businessName || currentUser?.impersonating_business_name || 'icaffeOS';
    const subtitle = propSubtitle || (currentUser?.is_impersonating ? `מצב התחזות: ${currentUser.name}` : '');

    const handleHome = () => {
        if (onHome) onHome();
        else navigate('/mode-selection');
    };

    const headerBg = forceMusicDark ? 'music-gradient-dark !text-white border-white/5' : 'bg-white/95 border-slate-100 text-slate-800';
    const titleColor = forceMusicDark ? 'text-white' : 'text-slate-800';
    const subtitleColor = forceMusicDark ? 'text-white/40' : 'text-slate-400';
    const clockColor = forceMusicDark ? 'text-white' : 'text-slate-800';

    return (
        <header className={`${headerBg} backdrop-blur-2xl border-b px-6 h-[56px] z-50 shrink-0 sticky top-0 flex items-center ${className}`}>
            <div className="flex items-center justify-between w-full h-full">

                {/* RIGHT: Home, Title & custom right content */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                        onClick={handleHome}
                        className={`shrink-0 w-10 h-10 flex items-center justify-center border rounded-2xl transition-all active:scale-95 shadow-sm ${forceMusicDark ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                        title="חזרה למסך ראשי"
                    >
                        <House size={20} strokeWidth={2.5} />
                    </button>

                    {/* TITLE REMOVED PER USER REQUEST */}

                    {/* RIGHT CONTENT (Right of Home Button) */}
                    {rightContent && (
                        <div className="flex items-center gap-3">
                            {rightContent}
                        </div>
                    )}
                </div>

                {/* CENTER: CLOCK & CONNECTION STATUS */}
                <div className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center gap-3">
                    {/* RTL: Clock comes FIRST, rendering on the RIGHT. Status comes SECOND, rendering on the LEFT */}
                    <div className="px-3 py-1 rounded-2xl border border-white/5 shadow-inner bg-white/5">
                        <span className={`text-[22px] font-black tracking-tighter tabular-nums leading-none ${clockColor}`}>
                            {time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    {/* SEPARATOR */}
                    <div className="hidden lg:block shrink-0 w-[4px] rounded-full h-8 bg-slate-300 mx-1" />
                    <div className="hidden lg:block shrink-0">
                        <ConnectivityStatus mode="inline" invert={forceMusicDark} forceShow={true} />
                    </div>
                </div>

                {/* LEFT: Tools & Player */}
                <div className="flex items-center gap-3 justify-end flex-1 min-w-0">

                    {/* 1. MUSIC PLAYER (Rendered to the right of children in RTL) */}
                    {showMusicPlayer && (
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 scale-95 origin-left">
                                <MiniMusicPlayer forceDark={forceMusicDark} />
                            </div>
                        </div>
                    )}

                    {/* 2. CUSTOM LEFT ACTIONS (Rendered to the leftmost in RTL) */}
                    {children && (
                        <div className="flex items-center gap-2">
                            {/* If there are items on left and also music player, show a separator */}
                            {showMusicPlayer && (
                                <div className={`hidden lg:block shrink-0 w-px h-6 mx-2 ${forceMusicDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            )}
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default UnifiedHeader;
