import React from 'react';
import { House } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MiniMusicPlayer from './music/MiniMusicPlayer';
import ConnectivityStatus from './ConnectivityStatus';

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

    const headerBg = forceMusicDark ? 'music-gradient-dark !text-white border-white/5' : 'bg-white/95 border-slate-100 text-slate-800';
    const titleColor = forceMusicDark ? 'text-white' : 'text-slate-800';
    const subtitleColor = forceMusicDark ? 'text-white/40' : 'text-slate-400';
    const clockColor = forceMusicDark ? 'text-white' : 'text-slate-800';

    return (
        <header className={`${headerBg} backdrop-blur-2xl border-b px-6 py-2.5 z-50 shrink-0 sticky top-0 ${className}`}>
            <div className="grid grid-cols-3 items-center w-full">
                {/* RIGHT: Home & Title */}
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={handleHome}
                        className={`shrink-0 w-10 h-10 flex items-center justify-center border rounded-2xl transition-all active:scale-95 shadow-sm ${forceMusicDark ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                        title="חזרה למסך ראשי"
                    >
                        <House size={20} strokeWidth={2.5} />
                    </button>

                    <div className="flex flex-col shrink-0">
                        <h1 className={`text-lg font-black tracking-tight leading-none ${titleColor}`}>
                            {title}
                        </h1>
                        {subtitle && (
                            <span className={`text-[10px] font-bold mt-1 ${subtitleColor} truncate max-w-[150px]`}>
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>

                {/* CENTER: CLOCK */}
                <div className="flex justify-center pointer-events-none">
                    <div className={`px-4 py-1.5 rounded-2xl border border-white/5 shadow-inner bg-white/5`}>
                        <span className={`text-2xl font-black tracking-tighter tabular-nums leading-none ${clockColor}`}>
                            {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* LEFT: Tools & Status & Player */}
                <div className="flex items-center gap-4 justify-end min-w-0">
                    {/* Tools (passed via children) */}
                    {children && (
                        <div className="flex items-center gap-2 pr-4 ml-2 border-r border-white/10">
                            {children}
                        </div>
                    )}

                    {/* Status Pill */}
                    <div className="hidden lg:block shrink-0">
                        <ConnectivityStatus mode="inline" invert={forceMusicDark} forceShow={true} />
                    </div>

                    <div className={`shrink-0 w-px h-6 ${forceMusicDark ? 'bg-white/10' : 'bg-slate-100'}`} />

                    {/* Music Player - Temporarily Disabled per User Request */}
                    {/* 
                    <div className="shrink-0 scale-95 origin-left">
                        <MiniMusicPlayer forceDark={forceMusicDark} />
                    </div>
                    */}
                </div>
            </div>
        </header>
    );
};

export default UnifiedHeader;
