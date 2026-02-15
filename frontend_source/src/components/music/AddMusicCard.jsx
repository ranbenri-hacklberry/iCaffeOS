import React from 'react';
import { Plus, Disc, Music, ListMusic, User } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Contextual "Add Music" card that adapts its appearance based on the active tab.
 * Always appears as the first card in each tab's grid.
 * Uses the same aspect-ratio as album/artist/playlist cards for visual consistency.
 */
const AddMusicCard = ({ tabId, onAdd }) => {
    const config = {
        albums: {
            icon: Disc,
            title: 'הוסף אלבום',
            subtitle: 'חפש וייבא אלבום שלם',
            gradient: 'from-purple-600/30 to-indigo-600/30',
            borderColor: 'border-purple-500/30',
            hoverBorder: 'hover:border-purple-400/60',
            iconBg: 'bg-purple-500/20',
            iconColor: 'text-purple-400',
        },
        singles: {
            icon: Music,
            title: 'הוסף שיר',
            subtitle: 'חפש וייבא שיר בודד',
            gradient: 'from-emerald-600/30 to-teal-600/30',
            borderColor: 'border-emerald-500/30',
            hoverBorder: 'hover:border-emerald-400/60',
            iconBg: 'bg-emerald-500/20',
            iconColor: 'text-emerald-400',
        },
        playlists: {
            icon: ListMusic,
            title: 'הוסף פלייליסט',
            subtitle: 'ייבא פלייליסט מ-YouTube',
            gradient: 'from-amber-600/30 to-orange-600/30',
            borderColor: 'border-amber-500/30',
            hoverBorder: 'hover:border-amber-400/60',
            iconBg: 'bg-amber-500/20',
            iconColor: 'text-amber-400',
        },
        artists: {
            icon: User,
            title: 'הוסף אמן',
            subtitle: 'הוסף מוזיקה חדשה',
            gradient: 'from-pink-600/30 to-rose-600/30',
            borderColor: 'border-pink-500/30',
            hoverBorder: 'hover:border-pink-400/60',
            iconBg: 'bg-pink-500/20',
            iconColor: 'text-pink-400',
        },
        favorites: null,
    };

    const cfg = config[tabId];
    if (!cfg) return null;

    const Icon = cfg.icon;

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAdd}
            className={`
                group cursor-pointer rounded-2xl overflow-hidden
                border border-white/10 ${cfg.hoverBorder}
                bg-gradient-to-br ${cfg.gradient}
                backdrop-blur-md relative
                transition-all duration-500
                hover:shadow-2xl hover:shadow-white/5
                w-full h-full
            `}
        >
            {/* Background design elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/20 rounded-full blur-2xl" />

            {/* Square area – matches album cover aspect ratio */}
            <div className="aspect-square flex items-center justify-center relative w-full overflow-hidden">
                {/* Animated Plus Icon Ring */}
                <div className={`
                    w-20 h-20 rounded-full ${cfg.iconBg}
                    flex items-center justify-center
                    border border-white/10
                    shadow-xl shadow-black/20
                    group-hover:scale-110 group-hover:rotate-90 
                    transition-all duration-700 ease-out
                    relative z-10
                `}>
                    <Plus className={`w-10 h-10 ${cfg.iconColor}`} />

                    {/* Pulsing ring around plus */}
                    <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20 group-hover:opacity-40" />
                </div>

                {/* Info Bar at bottom - Absolute positioned to match AlbumCard */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-3 px-3 z-20 flex flex-col items-start text-right">
                    <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${cfg.iconColor} opacity-80`} />
                        <h3 className="text-white font-extrabold text-sm tracking-tight leading-tight">{cfg.title}</h3>
                    </div>
                    <p className="text-white/50 text-[10px] font-bold mt-0.5">{cfg.subtitle}</p>
                </div>
            </div>

            {/* Bottom highlight bar */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${cfg.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
    );
};

export default AddMusicCard;
