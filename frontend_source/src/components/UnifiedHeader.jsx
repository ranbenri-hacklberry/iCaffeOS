import React, { useState, useEffect } from 'react';
import { House, Speaker, Tablet } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MiniMusicPlayer from './music/MiniMusicPlayer';
import ConnectivityStatus from './ConnectivityStatus';
import { useMusic } from '../context/MusicContext';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const UnifiedHeader = ({
    title: propTitle,
    subtitle: propSubtitle,
    hideTitle = false,
    onHome,
    children, // Left side components (in RTL)
    rightContent, // Next to Home button (in RTL)
    headerTabs, // Standardized tab array: [{ id, label, icon: <Icon/>, onClick, isActive, colorClass (optional active color) }]
    className = '',
    forceMusicDark = false,
    showMusicPlayer = true
}) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();
    const { i18n } = useTranslation();
    const { playbackTarget, setPlaybackTarget } = useMusic();
    const location = useLocation();
    const [time, setTime] = useState(new Date());

    const isMusicPage = location.pathname.startsWith('/music');

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

    const isLTR = i18n.language !== 'he';
    const headerBg = isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800';
    const titleColor = isDarkMode ? 'text-white' : 'text-slate-800';
    const subtitleColor = isDarkMode ? 'text-white/40' : 'text-slate-400';
    const clockColor = isDarkMode ? 'text-white' : 'text-slate-800';
    const buttonBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700';

    return (
        <header className={`${headerBg} backdrop-blur-2xl border-b px-6 h-[65px] z-50 shrink-0 sticky top-0 flex items-center ${className}`}>
            <div className={`flex items-center justify-between w-full h-full ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>

                {/* START (Home button side) */}
                <div className={`flex items-center gap-4 flex-1 min-w-0 ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
                    <button
                        onClick={handleHome}
                        className={`shrink-0 w-10 h-10 flex items-center justify-center border rounded-2xl transition-all active:scale-95 shadow-sm ${buttonBg}`}
                        title={isLTR ? "Back to Home" : "חזרה למסך ראשי"}
                    >
                        <House size={20} strokeWidth={2.5} />
                    </button>

                    {rightContent && (
                        <div className={`flex items-center gap-3 shrink-0 ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
                            {rightContent}
                        </div>
                    )}

                    {headerTabs && headerTabs.length > 0 && (
                        <div className={`flex bg-slate-100/80 p-0.5 rounded-2xl gap-0.5 border border-slate-200 shadow-inner h-10 shrink-0 overflow-hidden items-center ${isLTR ? 'ml-auto' : 'mr-auto'}`}>
                            {headerTabs.map(tab => {
                                const activeColor = tab.colorClass || 'text-blue-600';
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={tab.onClick}
                                        className={`px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all h-full justify-center min-w-max outline-none focus:outline-none ${tab.isActive
                                            ? `bg-white shadow-sm ring-1 ring-slate-900/5 ${activeColor}`
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label && <span className="mt-[2px]">{tab.label}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* CENTER: CLOCK & CONNECTION STATUS */}
                <div className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center gap-3">
                    <div className={`px-3 py-1 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white/5 border-white/5'}`}>
                        <span className={`text-[22px] font-black tracking-tighter tabular-nums leading-none ${clockColor}`}>
                            {time.toLocaleTimeString(isLTR ? 'en-US' : 'he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className={`hidden lg:block shrink-0 w-[4px] rounded-full h-8 mx-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
                    <div className="hidden lg:block shrink-0">
                        <ConnectivityStatus mode="inline" invert={isDarkMode || forceMusicDark} forceShow={true} />
                    </div>
                </div>

                {/* END (Tools side) */}
                <div className={`flex items-center gap-3 justify-end flex-1 min-w-0 ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
                    {showMusicPlayer && (
                        <div className={`flex items-center gap-3 ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
                            {isMusicPage && (
                                <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
                                    <button
                                        onClick={() => setPlaybackTarget('local')}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${playbackTarget === 'local' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                    >
                                        <Tablet size={18} />
                                    </button>
                                    <button
                                        onClick={() => setPlaybackTarget('server')}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${playbackTarget === 'server' ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                    >
                                        <Speaker size={18} />
                                    </button>
                                </div>
                            )}
                            <div className="shrink-0 scale-95 origin-left">
                                <MiniMusicPlayer forceDark={forceMusicDark} />
                            </div>
                        </div>
                    )}

                    {children && (
                        <div className={`flex items-center gap-2 ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
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
