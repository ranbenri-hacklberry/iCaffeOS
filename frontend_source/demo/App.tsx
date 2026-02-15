
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Activity, TrendingUp, Users, Coffee, Zap, ShieldCheck,
    ChevronRight, AlertCircle, RefreshCcw, Mic
} from 'lucide-react';

// --- SDK INTERFACE & MOCK ---
declare global { interface Window { icaffe: any; } }

// Force sync initialization
if (typeof window !== 'undefined' && !window.icaffe) {
    window.icaffe = {
        auth: { identify: async () => ({ id: 'rani-01', name: 'רני', role: 'Software Architect' }) },
        db: {
            query: async (table: string) => {
                const mockOrders = [
                    { id: '7844', items: 'קפוצ\'ינו, עוגת גבינה', status: 'ready', time: '2 min' },
                    { id: '7843', items: 'קפה שחור, סנדוויץ\' טונה', status: 'cooking', time: '5 min' },
                    { id: '7842', items: 'לאטה גדול, קרואסון שקדים', status: 'pending', time: '1 min' },
                ];
                return { data: table === 'orders' ? mockOrders : [], error: null };
            },
            commit: async (table: string, data: any, options: any) => {
                console.log('Zero-G Commit:', { table, data, options });
                return { success: true, rollback_token: 'antigrav_' + Date.now() };
            }
        },
        ai: {
            consult: async () => ({
                content: JSON.stringify({
                    message: "זיהיתי עומס צפוי בשעה 11:00",
                    tip: "העבר 2 בריסטות לתחנת הקור - הביקוש לקפה קר עולה ב-25%.",
                    confidence: 0.94
                })
            })
        }
    };
}

// --- COMPONENTS ---
const GlassCard = ({ children, className = "", glowColor = "cyan" }: any) => {
    const glowStyles: any = {
        cyan: "shadow-[0_0_20px_rgba(34,211,238,0.15)] border-cyan-500/30",
        purple: "shadow-[0_0_20px_rgba(168,85,247,0.15)] border-purple-500/30",
        orange: "shadow-[0_0_20px_rgba(249,115,22,0.15)] border-orange-500/30",
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`backdrop-blur-xl bg-black/40 border rounded-3xl p-6 ${glowStyles[glowColor]} ${className}`}
        >
            {children}
        </motion.div>
    );
};

const StatWidget = ({ icon: Icon, label, value, trend, color }: any) => (
    <GlassCard glowColor={color} className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
                <Icon size={20} />
            </div>
            <span className="text-emerald-400 text-xs font-mono flex items-center">
                {trend} <TrendingUp size={12} className="ml-1" />
            </span>
        </div>
        <div>
            <p className="text-white/50 text-xs uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    </GlassCard>
);

export default function App() {
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [mayaInsight, setMayaInsight] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchData = useCallback(async () => {
        setIsSyncing(true);
        const id = await window.icaffe.auth.identify();
        const { data } = await window.icaffe.db.query('orders');
        const aiResponse = await window.icaffe.ai.consult();

        setUser(id);
        setOrders(data);
        setMayaInsight(JSON.parse(aiResponse.content));
        setTimeout(() => setIsSyncing(false), 1000);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Loading State
    if (!user && !orders.length) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 animate-pulse">Loading Maya Intelligence...</div>;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden p-4 md:p-8" dir="rtl">
            {/* Background Ambient Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header Area */}
            <header className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Brain className="text-white" size={28} />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">שלום, {user?.name} 👋</h1>
                        <p className="text-cyan-400/80 text-xs font-mono tracking-widest uppercase">{user?.role} | Core SDK v4.0</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-2 border border-white/10">
                    <div className="px-4 py-2 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-mono uppercase">System Live</span>
                    </div>
                    <button onClick={() => fetchData()} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Stats & Insight */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatWidget icon={Activity} label="הזמנות פעילות" value={orders.length} trend="+12%" color="cyan" />
                        <StatWidget icon={TrendingUp} label="פדיון שעתי" value="₪2,450" trend="+5%" color="purple" />
                        <StatWidget icon={Users} label="צוות במשמרת" value="4" trend="Optimal" color="orange" />
                    </div>

                    {/* Maya Intelligence Feed */}
                    <GlassCard glowColor="purple" className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={120} className="text-purple-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Brain size={24} className="text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Maya Intelligence</h2>
                        </div>

                        <AnimatePresence mode="wait">
                            {mayaInsight && (
                                <motion.div
                                    key={mayaInsight.message}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-4"
                                >
                                    <p className="text-lg text-purple-100/90 leading-relaxed font-medium">"{mayaInsight.message}"</p>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-purple-500/20">
                                        <p className="text-sm text-white/70 italic flex gap-2">
                                            <span className="text-purple-400 font-bold">טיפ:</span> {mayaInsight.tip}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2">
                                            בצע אופטימיזציה <ChevronRight size={16} />
                                        </button>
                                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-sm transition-all">התעלם</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCard>
                </div>

                {/* Right Column: Live Order Ticker & Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <GlassCard glowColor="cyan" className="flex-1 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Coffee size={20} className="text-cyan-400" /> ניטור KDS חי
                            </h3>
                            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">SDK SYNC</span>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {orders.map((order) => (
                                <motion.div
                                    key={order.id}
                                    whileHover={{ x: 4 }}
                                    className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all flex justify-between items-center group"
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className="text-lg font-bold text-cyan-400 font-mono">#{order.id}</div>
                                        <div>
                                            <div className="text-sm font-medium text-white/90 truncate max-w-[150px]">{order.items}</div>
                                            <div className="text-[10px] text-white/40 uppercase tracking-tighter">{order.time} ago</div>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${order.status === 'ready' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-orange-400 animate-pulse'}`} />
                                </motion.div>
                            ))}
                        </div>

                        <button className="mt-6 w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-2xl text-cyan-400 text-sm font-bold transition-all flex items-center justify-center gap-2">
                            לממשק KDS מלא <ChevronRight size={16} />
                        </button>
                    </GlassCard>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center gap-2 group hover:bg-emerald-500/20 transition-all">
                            <ShieldCheck size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">סגירת קופה</span>
                        </button>
                        <button className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-col items-center gap-2 group hover:bg-orange-500/20 transition-all">
                            <AlertCircle size={24} className="text-orange-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">דיווח תקלה</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Floating Maya Voice Trigger */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-8 left-8 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-purple-500/40 border-4 border-black z-50 group"
            >
                <Mic size={28} className="text-white group-hover:animate-pulse" />
            </motion.button>
        </div>
    );
}
