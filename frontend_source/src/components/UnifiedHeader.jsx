import React from 'react';
import { House } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiniMusicPlayer from '@/components/music/MiniMusicPlayer';
import ConnectivityStatus from '@/components/ConnectivityStatus';
import ConnectionStatusBar from '@/components/ConnectionStatusBar';

const UnifiedHeader = ({
    title,
    subtitle,
    onHome,
    children, // For Tabs or specific controls
    className = '',
    forceMusicDark = false
}) => {
    const navigate = useNavigate();

    const handleHome = () => {
        if (onHome) onHome();
        else navigate('/mode-selection');
    };

    const headerBg = forceMusicDark ? 'bg-black/60 !text-white border-white/10' : 'bg-white/95 border-slate-100 text-slate-800';
    const titleColor = forceMusicDark ? 'text-white' : 'text-slate-800';
    const subtitleColor = forceMusicDark ? 'text-white/60' : 'text-slate-400';
    const clockColor = forceMusicDark ? 'text-white' : 'text-slate-800';

    return (
        <header className={`${headerBg} backdrop-blur-md border-b px-6 py-3 flex items-center justify-between z-50 shrink-0 sticky top-0 ${className}`}>

            {/* RIGHT SIDE: Navigation & Title */}
            <div className="flex items-center gap-6 z-10">
                {/* Home Button */}
                <button
                    onClick={handleHome}
                    className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all active:scale-95 shadow-sm ${forceMusicDark ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                    title="חזרה למסך ראשי"
                >
                    <House size={20} strokeWidth={2} />
                </button>

                {/* Title Block */}
                <div className="flex flex-col">
                    <h1 className={`text-xl font-black tracking-tight leading-none ${titleColor}`}>
                        {title}
                    </h1>
                    {subtitle && (
                        <span className={`text-[11px] font-bold mt-0.5 ${subtitleColor}`}>
                            {subtitle}
                        </span>
                    )}
                </div>

                {/* Divider & Children (Tabs) */}
                {children && (
                    <>
                        <div className={`w-px h-8 mx-2 ${forceMusicDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        {/* Translate Right significantly to clear the central clock */}
                        <div className="translate-x-12">
                            {children}
                        </div>
                    </>
                )}
            </div>

            {/* CENTER: CLOCK & STATUS (Absolute) */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden xl:flex items-center gap-6">
                {/* Clock */}
                <span className={`text-3xl font-black tracking-tight tabular-nums leading-none ${clockColor}`}>
                    {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Status - Attached to the left of the clock */}
                <div className="mt-1">
                    <ConnectivityStatus mode="inline" invert={forceMusicDark} />
                </div>
            </div>

            {/* LIGHT LEFT SIDE: Music Only */}
            <div className="flex items-center gap-4 z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-px h-8 ${forceMusicDark ? 'bg-white/10' : 'bg-slate-100'}`} />
                    {/* Music Player */}
                    <MiniMusicPlayer forceDark={forceMusicDark} />
                </div>
            </div>
        </header>
    );
};

export default UnifiedHeader;
