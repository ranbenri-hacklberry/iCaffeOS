/**
 * Hierarchical Smart Dashboard - 3-Tier Mode Selection
 * Tier 1: Hero Cards (POS, KDS) with Live Data
 * Tier 2: Action Cards (Preps, Inventory, Advanced, Menu)
 * Tier 3: Admin Row (Compact Icons)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDashboardLiveData } from '../../hooks/useDashboardLiveData';
import { motion } from 'framer-motion';
import {
    Coffee, Monitor, ChefHat, Package, BarChart3, Palette,
    Lock, ShieldAlert, Settings, LogOut, AlertTriangle, UserCircle,
    Clock, CheckCircle, MonitorPlay, Smartphone, Layout, Music, Database, Brain, Hotel, Building
} from 'lucide-react';
import HeroCard from '../../components/HeroCard';
import { PosWireframe, KdsWireframe } from '../../components/DashboardWireframes';
import PinCodeModal from '../../components/PinCodeModal';
import SmsBalanceWidget from '../../components/SmsBalanceWidget';

const HierarchicalDashboard = () => {
    const navigate = useNavigate();
    const { currentUser, setMode, logout } = useAuth();
    const liveData = useDashboardLiveData(currentUser?.business_id);

    const [pinModal, setPinModal] = useState({ isOpen: false, targetRoute: null, featureName: '' });
    const [sudoAccess, setSudoAccess] = useState(null); // Temporary admin access
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // User permissions
    const isAdmin = currentUser?.access_level === 'admin' || currentUser?.role === 'admin';
    const isSuperAdmin = currentUser?.is_super_admin || currentUser?.role === 'super_admin' || currentUser?.user_metadata?.is_super_admin || localStorage.getItem('is_super_admin') === 'true';

    // App visibility helpers
    const isAppVisible = (appId) => {
        // Super admins see everything
        if (isSuperAdmin) return true;
        // If no preferences saved, show all
        if (!currentUser?.visible_apps || !Array.isArray(currentUser.visible_apps)) return true;
        return currentUser.visible_apps.includes(appId);
    };

    const handleNavigation = (route, modeName) => {
        setMode(modeName || route.replace('/', ''));
        navigate(route);
    };

    const handleAdminFeature = (route, featureName, modeName) => {
        if (isAdmin || sudoAccess) {
            handleNavigation(route, modeName);
        } else {
            // Require PIN for non-admin users
            setPinModal({ isOpen: true, targetRoute: route, featureName, modeName });
        }
    };

    const handlePinSuccess = (manager) => {
        setSudoAccess(manager);
        // Navigate to the requested feature
        if (pinModal.targetRoute) {
            handleNavigation(pinModal.targetRoute, pinModal.modeName);
        }
        // Clear sudo access after 5 minutes
        setTimeout(() => setSudoAccess(null), 5 * 60 * 1000);
    };

    // Determine display name — filter out placeholder values like 'Main Terminal'
    const GENERIC_PLACEHOLDERS = ['Main Terminal', 'main terminal', 'Terminal', 'Device', 'מסוף'];
    const isPlaceholder = (str) => !str || GENERIC_PLACEHOLDERS.some(p => str.trim() === p) || str.trim().startsWith('מסוף ');

    const rawName =
        currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        currentUser?.full_name ||
        currentUser?.name;

    const displayName = !isPlaceholder(rawName)
        ? rawName
        : (currentUser?.business_name || 'iCaffe');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 font-heebo" dir="rtl">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-4 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                        שלום, {displayName} 👋
                    </h1>
                    <SmsBalanceWidget />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                        <span className="text-sm font-bold text-green-400">
                            {currentUser?.business_name || 'iCaffe'}
                        </span>
                    </div>

                    {/* Sudo Access Indicator */}
                    {sudoAccess && (
                        <motion.div
                            // 1. כניסה חלקה (Entrance Only) - Removed 'y' to prevent screen jumping
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full"
                        >
                            <ShieldAlert size={14} className="text-amber-400" />
                            <span className="text-xs font-bold text-amber-400">
                                Sudo Mode: {sudoAccess.name}
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* ========== TIER 1: HERO CARDS ========== */}
                <div className={`grid gap-4 sm:gap-8 mb-4 sm:mb-8 grid-cols-1 md:grid-cols-3`}>
                    {/* Manager Cockpit - FIRST ON MOBILE */}
                    {isMobile && isAppVisible('manager') && (
                        <HeroCard
                            title="הקוקפיט"
                            subtitle="ניהול מלא מהנייד 🚀"
                            icon={Layout}
                            Pattern={() => (
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <Monitor size={120} />
                                </div>
                            )}
                            gradient="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600"
                            stats="Online"
                            delay={0.05}
                            onClick={() => handleNavigation('/data-manager-interface', 'manager')}
                            compact={isMobile}
                        />
                    )}

                    {/* POS - Hero Card (HIDDEN ON MOBILE per user request) */}
                    {!isMobile && isAppVisible('kiosk') && (
                        <HeroCard
                            title="POS"
                            subtitle="מערכת הזמנות ותשלום"
                            icon={MonitorPlay}
                            Pattern={PosWireframe}
                            gradient="bg-gradient-to-br from-orange-400 via-red-500 to-pink-600"
                            stats="Online"
                            delay={0.1}
                            onClick={() => handleNavigation('/?new=true', 'kiosk')}
                        />
                    )}


                    {/* KDS/Service - Hero Card with Live Data */}
                    {/* On mobile → navigate to /mobile-kds, on tablet/desktop → /kds */}
                    {isAppVisible('kds') && (
                        <HeroCard
                            title="KDS"
                            subtitle={!liveData.loading ? `מסך מטבח • ${liveData.kds.activeOrders} בהכנה` : "טוען..."}
                            icon={isMobile ? Smartphone : ChefHat}
                            Pattern={KdsWireframe}
                            gradient="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600"
                            stats={!liveData.loading ? `${liveData.kds.activeOrders + liveData.kds.readyOrders} פעילות` : "טוען..."}
                            delay={0.2}
                            onClick={() => {
                                if (isMobile) {
                                    setMode('kds');
                                    navigate('/mobile-kds');
                                } else {
                                    handleNavigation('/kds', 'kds');
                                }
                            }}
                            compact={isMobile}
                        />
                    )}

                    {/* Music Player - Hero Card (New) */}
                    {isAppVisible('music') && (
                        <HeroCard
                            title="RanTunes"
                            subtitle="ניהול אווירה ופלייליסטים"
                            icon={Music}
                            Pattern={() => (
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <Coffee size={120} />
                                </div>
                            )}
                            gradient="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
                            stats="Active"
                            delay={0.3}
                            onClick={() => handleNavigation('/music', 'music')}
                            compact={isMobile}
                        />
                    )}
                </div>


                {/* ========== TIER 2: ACTION CARDS ========== */}
                <div className={`grid gap-3 sm:gap-4 mb-4 sm:mb-6 ${[isAppVisible('manager'), isAppVisible('prep'), isAppVisible('inventory'), isAppVisible('advanced'), isAppVisible('menu-editor')].filter(Boolean).length === 1
                    ? 'grid-cols-1'
                    : 'grid-cols-2 md:grid-cols-4'
                    }`}>





                    {/* Preps/Tasks with Live Data */}
                    {isAppVisible('prep') && (
                        <motion.button
                            onClick={() => handleNavigation('/prep', 'prep')}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            whileHover={{ scale: 1.04, y: -5 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative bg-gradient-to-br from-violet-50 via-white to-indigo-50 rounded-3xl ${isMobile ? 'p-4 min-h-[90px]' : 'p-5 min-h-[140px]'} shadow-md overflow-hidden border border-violet-100/60 group transition-all duration-300 hover:shadow-xl hover:shadow-violet-200/30`}
                        >

                            {/* Playful bubbles */}
                            <div className="absolute -top-3 -right-3 w-14 h-14 bg-violet-200/40 rounded-full group-hover:scale-125 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 w-8 h-8 bg-indigo-200/30 rounded-full group-hover:translate-y-[-4px] transition-transform duration-700" />
                            <div className="absolute top-1/2 -left-2 w-6 h-6 bg-purple-100/40 rounded-full" />

                            <div className="relative z-10" dir="rtl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-400/30 group-hover:rotate-[-6deg] transition-transform duration-300">
                                        <ChefHat size={24} className="text-white" />
                                    </div>
                                    {!liveData.loading && liveData.tasks.openTasks > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full shadow-md"
                                        >
                                            <Clock size={13} className="text-violet-200" />
                                            <span className="text-base font-black text-white leading-none">
                                                {liveData.tasks.openTasks}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-black text-slate-800`}>הכנות/משימות</h3>

                                {/* Breakdown tags */}
                                {!liveData.loading && liveData.tasks.openTasks > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {liveData.tasks.opening > 0 && (
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">{liveData.tasks.opening} פתיחה</span>
                                        )}
                                        {liveData.tasks.preps > 0 && (
                                            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200/60 px-2 py-0.5 rounded-full">{liveData.tasks.preps} הכנות</span>
                                        )}
                                        {liveData.tasks.closing > 0 && (
                                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">{liveData.tasks.closing} סגירה</span>
                                        )}
                                    </div>
                                )}

                            </div>
                        </motion.button>
                    )}

                    {/* Inventory with Alert Badge */}
                    {isAppVisible('inventory') && (
                        <motion.button
                            onClick={() => handleNavigation('/inventory', 'inventory')}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            whileHover={{ scale: 1.04, y: -5 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative bg-gradient-to-br from-sky-50 via-white to-blue-50 rounded-3xl ${isMobile ? 'p-4 min-h-[90px]' : 'p-5 min-h-[140px]'} shadow-md overflow-hidden border border-sky-100/60 group transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/30`}
                        >

                            {/* Playful bubbles */}
                            <div className="absolute -top-3 -right-3 w-14 h-14 bg-sky-200/40 rounded-full group-hover:scale-125 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 w-8 h-8 bg-blue-200/30 rounded-full group-hover:translate-y-[-4px] transition-transform duration-700" />
                            <div className="absolute top-1/2 -left-2 w-6 h-6 bg-cyan-100/40 rounded-full" />

                            {/* Stock Alert Badge */}
                            {!liveData.loading && liveData.inventory.hasAlert && (
                                <div className="absolute top-3 left-3 z-20">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-red-500 rounded-full shadow-lg shadow-red-300/40"
                                    >
                                        <AlertTriangle size={12} className="text-white animate-pulse" />
                                        <span className="text-xs font-black text-white">{liveData.inventory.lowStockCount}</span>
                                    </motion.div>
                                </div>
                            )}

                            <div className="relative z-10" dir="rtl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-400/30 group-hover:rotate-[-6deg] transition-transform duration-300`}>
                                        <Package size={24} className="text-white" />
                                    </div>
                                </div>
                                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-black text-slate-800`}>ניהול מלאי</h3>
                                {!liveData.loading && liveData.inventory.hasAlert ? (
                                    <p className="text-[10px] font-bold text-red-500 mt-1">{liveData.inventory.lowStockCount} מתחת למינימום ⚠️</p>
                                ) : (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <CheckCircle size={10} className="text-emerald-500" />
                                        <p className="text-[10px] text-emerald-600 font-bold">מלאי תקין 👍</p>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    )}

                    {/* Advanced Info - Open to all employees */}
                    {isAppVisible('manager') && (
                        <motion.button
                            onClick={() => handleNavigation('/dexie-admin', 'dexie-admin')}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            whileHover={{ scale: 1.04, y: -5 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative bg-gradient-to-br from-teal-50 via-white to-cyan-50 rounded-3xl ${isMobile ? 'p-4 min-h-[90px]' : 'p-5 min-h-[140px]'} shadow-md overflow-hidden border border-teal-100/60 group transition-all duration-300 hover:shadow-xl hover:shadow-teal-200/30`}
                        >

                            {/* Playful bubbles */}
                            <div className="absolute -top-3 -right-3 w-14 h-14 bg-teal-200/40 rounded-full group-hover:scale-125 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 w-8 h-8 bg-cyan-200/30 rounded-full group-hover:translate-y-[-4px] transition-transform duration-700" />
                            <div className="absolute top-1/2 -left-2 w-6 h-6 bg-emerald-100/40 rounded-full" />

                            <div className="relative z-10" dir="rtl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-400/30 group-hover:rotate-[-6deg] transition-transform duration-300">
                                        <BarChart3 size={24} className="text-white" />
                                    </div>
                                </div>
                                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-black text-slate-800`}>מידע מתקדם</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">דוחות וסטטיסטיקות 📊</p>

                            </div>
                        </motion.button>
                    )}

                    {/* Menu Editor - Admin Locked */}
                    {isAppVisible('menu-editor') && (
                        <motion.button
                            onClick={() => handleAdminFeature('/menu-editor', 'עריכת תפריט', 'menu-editor')}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            whileHover={{ scale: 1.04, y: -5 }}
                            whileTap={{ scale: 0.96 }}
                            className={`relative bg-gradient-to-br from-rose-50 via-white to-pink-50 rounded-3xl ${isMobile ? 'p-4 min-h-[90px]' : 'p-5 min-h-[140px]'} shadow-md overflow-hidden border border-rose-100/60 group transition-all duration-300 hover:shadow-xl hover:shadow-rose-200/30`}
                        >

                            {/* Playful bubbles */}
                            <div className="absolute -top-3 -right-3 w-14 h-14 bg-rose-200/40 rounded-full group-hover:scale-125 transition-transform duration-500" />
                            <div className="absolute bottom-2 left-2 w-8 h-8 bg-pink-200/30 rounded-full group-hover:translate-y-[-4px] transition-transform duration-700" />
                            <div className="absolute top-1/2 -left-2 w-6 h-6 bg-fuchsia-100/40 rounded-full" />

                            {/* Lock Icon for Non-Admin */}
                            {!isAdmin && !sudoAccess && (
                                <div className="absolute top-3 left-3 z-20">
                                    <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md shadow-amber-300/40">
                                        <Lock size={12} className="text-white" />
                                    </div>
                                </div>
                            )}

                            <div className="relative z-10" dir="rtl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-400/30 group-hover:rotate-[-6deg] transition-transform duration-300">
                                        <Palette size={24} className="text-white" />
                                    </div>
                                </div>
                                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-black text-slate-800`}>עריכת תפריט</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">פריטים וקטגוריות 🎨</p>

                            </div>
                        </motion.button>
                    )}


                </div>

                {/* ========== TIER 3: ADMIN ROW (Compact Icons) ========== */}
                <div className="flex items-center justify-center gap-3">
                    {/* Profile Settings */}
                    <motion.button
                        onClick={() => navigate('/profile-settings')}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center"
                        title="הגדרות פרופיל"
                    >
                        <UserCircle size={20} className="text-white" />
                    </motion.button>

                    {/* Super Admin */}
                    {isSuperAdmin && (
                        <motion.button
                            onClick={() => navigate('/super-admin')}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl flex items-center justify-center"
                            title="Super Admin"
                        >
                            <ShieldAlert size={20} className="text-red-400" />
                        </motion.button>
                    )}

                    {/* DB Sync - Super Admin only */}
                    {isSuperAdmin && (
                        <motion.button
                            onClick={() => navigate('/super-admin/db')}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-xl flex items-center justify-center"
                            title="סנכרון מסד נתונים"
                        >
                            <Database size={20} className="text-cyan-400" />
                        </motion.button>
                    )}

                    {/* Cortex AI */}
                    <motion.button
                        onClick={() => navigate('/cortex')}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 rounded-xl flex items-center justify-center"
                        title="Cortex AI"
                    >
                        <Brain size={20} className="text-indigo-400" />
                    </motion.button>

                    {/* Hotel Staff Dashboard */}
                    <motion.button
                        onClick={() => navigate('/hotel/staff')}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-xl flex items-center justify-center transition-all hover:bg-emerald-500/30 active:scale-95"
                        title="לוח בקרה למלון"
                    >
                        <Hotel size={20} className="text-emerald-400" />
                    </motion.button>

                    {/* Hotel Management Dashboard (Admin Only) */}
                    {isAdmin && (
                        <motion.button
                            onClick={() => navigate('/hotel/admin')}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl flex items-center justify-center transition-all hover:bg-blue-500/30 active:scale-95"
                            title="ניהול מלון (מנהלים)"
                        >
                            <Building size={20} className="text-blue-400" />
                        </motion.button>
                    )}

                    {/* Settings */}
                    <motion.button
                        onClick={() => handleAdminFeature('/owner-settings', 'הגדרות', 'owner-settings')}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center transition-all hover:bg-white/20 active:scale-95"
                        title="הגדרות מערכת"
                    >
                        <Settings size={20} className="text-white" />
                    </motion.button>

                    {/* Logout */}
                    <motion.button
                        onClick={logout}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center transition-all hover:bg-white/20 active:scale-95"
                        title="התנתק"
                    >
                        <LogOut size={20} className="text-white" />
                    </motion.button>
                </div>
            </div>

            {/* PIN Modal */}
            <PinCodeModal
                isOpen={pinModal.isOpen}
                onClose={() => setPinModal({ isOpen: false, targetRoute: null, featureName: '' })}
                onSuccess={handlePinSuccess}
                featureName={pinModal.featureName}
            />
        </div>
    );
};

export default HierarchicalDashboard;
