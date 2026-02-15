import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMayaAuth } from '@/context/MayaAuthContext';
import { Monitor, ChefHat, LogOut, BarChart3, Coffee, Users, Music, ShieldAlert, Package, List, LayoutGrid, Truck, ShoppingCart, Settings, MessageSquare, ExternalLink, Film, Palette, UserCircle } from 'lucide-react';
import WhatsNewModal from '@/components/WhatsNewModal';
import SmsBalanceWidget from '@/components/SmsBalanceWidget';

const ModeSelectionScreen = () => {
    const navigate = useNavigate();
    const { currentUser, setMode, logout, appVersion } = useAuth();
    const mayaAuth = useMayaAuth();
    const [showWhatsNew, setShowWhatsNew] = useState(true);

    // Get user from either regular auth or Maya auth
    const user = currentUser || (mayaAuth.employee ? {
        name: mayaAuth.employee.name,
        access_level: mayaAuth.employee.accessLevel,
        is_super_admin: mayaAuth.employee.isSuperAdmin,
        business_id: mayaAuth.employee.businessId,
        business_name: 'iCaffe' // TODO: Get from database
    } : null);

    // Debug logging
    console.log('🔍 ModeSelection Debug:', {
        currentUser: currentUser?.name,
        currentUserIsSuperAdmin: currentUser?.is_super_admin,
        mayaEmployee: mayaAuth.employee?.name,
        mayaEmployeeIsSuperAdmin: mayaAuth.employee?.isSuperAdmin,
        mergedUserIsSuperAdmin: user?.is_super_admin
    });

    // Check if user is a manager/admin (case-insensitive)
    const accessLevel = (user?.access_level || '').toLowerCase();
    const role = (user?.role || '').toLowerCase();

    const isManager = role === 'admin' ||
        role === 'manager' ||
        role === 'owner' ||
        accessLevel === 'admin' ||
        accessLevel === 'manager' ||
        accessLevel === 'owner' ||
        user?.is_admin === true;

    // Check if user is a driver
    const isDriver = user?.is_driver === true || role === 'driver' || accessLevel === 'driver';

    // Check if user is staff
    const isStaff = role === 'staff' || accessLevel === 'staff';

    // Check if user is owner
    const isOwner = role === 'owner' || accessLevel === 'owner';

    // Get user's visible apps preferences (from employees.visible_apps)
    const visibleApps = user?.visible_apps || null;

    // Helper function to check if an app should be displayed
    const isAppVisible = (appId) => {
        // If user hasn't set preferences, show all apps (default behavior)
        if (!visibleApps || !Array.isArray(visibleApps)) {
            return true;
        }

        // Otherwise, check if the app is in the user's visible apps list
        return visibleApps.includes(appId);
    };

    const handleModeSelect = (mode) => {
        setMode(mode);
        if (mode === 'kiosk') {
            navigate('/');
        } else if (mode === 'kds') {
            navigate('/kds');
        } else if (mode === 'inventory') {
            navigate('/inventory');
        } else if (mode === 'prep') {
            navigate('/prep');
        } else if (mode === 'music') {
            navigate('/music');
        } else if (mode === 'mobile-kds') {
            setMode('kds'); // Set as KDS mode for auth
            navigate('/mobile-kds');
        } else if (mode === 'manager') {
            navigate('/data-manager-interface');
        } else if (mode === 'dexie-admin') {
            navigate('/dexie-admin');
        } else if (mode === 'db-explorer') {
            navigate('/super-admin/db');
        } else if (mode === 'kanban') {
            navigate('/kanban');
        } else if (mode === 'driver') {
            navigate('/driver');
        } else if (mode === 'owner-settings') {
            navigate('/owner-settings');
        } else if (mode === 'menu-editor') {
            navigate('/ipad-menu-editor');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 pt-16 font-heebo" dir="rtl">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-white mb-2">
                        שלום, {user?.name || 'עובד'} 👋
                    </h1>

                    <SmsBalanceWidget />
                    {/* Business Name Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                        <span className="text-sm font-bold text-green-400">
                            {user?.impersonating_business_name || user?.business_name || 'iCaffe'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-5xl mx-auto">

                    {/* 0. Super Admin Portal - Debug/Always Visible */}
                    {(user?.is_super_admin || mayaAuth.employee?.isSuperAdmin || currentUser?.is_super_admin) && (
                        <button
                            onClick={() => navigate('/super-admin')}
                            className="group relative bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl p-5 hover:from-red-700 hover:to-pink-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-white/20 hover:border-white/40"
                        >
                            <div className="absolute top-3 left-3 bg-yellow-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                ADMIN
                            </div>
                            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-12 transition-transform border border-white/30">
                                    <ShieldAlert size={20} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-white mb-1">פורטל Super Admin</h2>
                                <p className="text-white/80 text-sm leading-relaxed font-medium">
                                    ניהול עסקים והגדרות על
                                </p>
                            </div>
                        </button>
                    )}

                    {/* Profile Settings - Visible to ALL users */}
                    <button
                        onClick={() => navigate('/profile-settings')}
                        className="group relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-white/20 hover:border-white/40"
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform border border-white/30">
                                <UserCircle size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-white mb-1">הגדרות פרופיל</h2>
                            <p className="text-white/80 text-sm leading-relaxed font-medium">
                                סיסמה, PIN, טלפון וזיהוי פנים
                            </p>
                        </div>
                    </button>

                    {/* 1. Dashboard (Cockpit) - Visible to all, requires Manager Re-Auth (TODO: Phase 2) */}
                    {isAppVisible('manager') && (
                    <button
                        onClick={() => handleModeSelect('manager')}
                        className="group relative bg-white rounded-2xl p-5 hover:bg-purple-50 transition-all duration-300 hover:-translate-y-1 active:scale-95 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-purple-100 cursor-pointer z-30"
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 bg-purple-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform pointer-events-none" />
                        <div className="relative z-10 pointer-events-none">
                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <BarChart3 size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">הקוקפיט (Dashboard)</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                מכירות, תפריט, מלאי ומשימות
                            </p>
                            {/* TODO: Add lock icon for Phase 2 */}
                        </div>
                    </button>
                    )}

                    {/* 2. Cash Register - Hidden on Mobile */}
                    {isAppVisible('kiosk') && (
                    <button
                        onClick={() => handleModeSelect('kiosk')}
                        className="hidden md:block group relative bg-white rounded-2xl p-5 hover:bg-orange-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-orange-100"
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 bg-orange-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <Coffee size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">עמדת קופה</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                הקלדת הזמנות ומכירות
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 3. Service (KDS) - Tablet/Desktop */}
                    {isAppVisible('kds') && (
                    <button
                        onClick={() => handleModeSelect('kds')}
                        className="hidden md:block group relative bg-white rounded-2xl p-5 hover:bg-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-emerald-100"
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <Monitor size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">סרוויס (KDS)</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                ניהול הזמנות ומשימות
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 3. Prep Tasks - Reordered to be before Inventory */}
                    {isAppVisible('prep') && (
                    <button
                        onClick={() => handleModeSelect('prep')}
                        className="group relative bg-white rounded-2xl p-5 hover:bg-indigo-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-indigo-100"
                    >
                        <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            חדש
                        </div>
                        <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <List size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">הכנות ומשימות</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                פתיחה, סגירה ומשימות יום
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 4. Inventory - Reordered after Prep Tasks */}
                    {isAppVisible('inventory') && (
                    <button
                        onClick={() => handleModeSelect('inventory')}
                        className="group relative bg-white rounded-2xl p-5 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-blue-100"
                    >
                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            חדש
                        </div>
                        <div className="absolute top-0 left-0 w-20 h-20 bg-blue-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <Package size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">ניהול מלאי</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                ספירות מלאי והזמנות רכש
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 5. Menu Editor */}
                    {isAppVisible('menu-editor') && (
                    <button
                        onClick={() => handleModeSelect('menu-editor')}
                        className="group relative bg-white rounded-2xl p-5 hover:bg-rose-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-rose-100"
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 bg-rose-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <Palette size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">עריכת תפריט</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                עדכון פריטים, מחירים ותמונות
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 3b. Mobile KDS - HIDDEN REQUESTED */}
                    {/* <button
                        onClick={() => handleModeSelect('mobile-kds')}
                        className="md:hidden group relative bg-white rounded-2xl p-5 hover:bg-emerald-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-emerald-100"
                    >
                        <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <ChefHat size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">צפייה בהזמנות</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                מעקב הזמנות מהטלפון
                            </p>
                        </div>
                    </button> */}

                    {/* 4. Kanban - Order Management Board */}
                    {isAppVisible('kanban') && (
                    <button
                        onClick={() => handleModeSelect('kanban')}
                        className="hidden md:block group relative bg-white rounded-2xl p-5 hover:bg-teal-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-teal-100"
                    >
                        <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            חדש
                        </div>
                        <div className="absolute top-0 left-0 w-20 h-20 bg-teal-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                <LayoutGrid size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-1">קנבן הזמנות</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                ניהול הזמנות ומשלוחים
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 7. Owner Settings - Owner Only */}
                    {isOwner && isAppVisible('owner-settings') && (
                        <button
                            onClick={() => handleModeSelect('owner-settings')}
                            className="group relative bg-slate-800 rounded-2xl p-5 hover:bg-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-yellow-500"
                        >
                            <div className="absolute top-3 left-3 bg-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Owner
                            </div>
                            <div className="absolute top-0 left-0 w-20 h-20 bg-yellow-900/50 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                    <Settings size={20} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-white mb-1">הגדרות עסק</h2>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    ניהול חיבורים והגדרות ראשיות
                                </p>
                            </div>
                        </button>
                    )}

                    {/* 8. Menu Editor - Manager/Owner Only */}
                    {isManager && (
                        <button
                            onClick={() => {
                                setMode('manager');
                                navigate('/menu-editor');
                            }}
                            className="group relative bg-white rounded-2xl p-5 hover:bg-violet-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-violet-100"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-24 h-24 bg-violet-100 rounded-br-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />

                            <div className="relative z-10 flex flex-col items-end">
                                {/* Icon Container with Badge */}
                                <div className="relative mb-3 group-hover:rotate-6 transition-transform">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                        <Coffee size={24} strokeWidth={2.5} />
                                    </div>
                                    {/* Suspended Badge on Icon */}
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-20 border border-white/50">
                                        BETA
                                    </div>
                                </div>

                                <h2 className="text-xl font-black text-slate-900 mb-1">עריכת תפריט</h2>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                    עריכת מנות ויצירת תמונות AI
                                </p>
                            </div>
                        </button>
                    )}

                    {/* 9. Video Creator - Super Admin Only */}
                    {user?.is_super_admin && (
                    <button
                        onClick={() => {
                            navigate('/video-creator');
                        }}
                        className="group relative bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-5 hover:from-purple-800 hover:to-pink-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-white/10 hover:border-white/30"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-br-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />

                        {/* NEW Badge */}
                        <div className="absolute top-3 left-3 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            חדש
                        </div>

                        <div className="relative z-10 flex flex-col items-end">
                            {/* Icon Container */}
                            <div className="relative mb-3 group-hover:rotate-6 transition-transform">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Film size={24} strokeWidth={2.5} />
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-white mb-1">יצירת סרטון AI</h2>
                            <p className="text-white/80 text-sm leading-relaxed font-medium">
                                צור סרטונים מדהימים עם Kling AI
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 10. Ad Generator - Super Admin Only */}
                    {user?.is_super_admin && (
                    <button
                        onClick={() => {
                            navigate('/ad-generator');
                        }}
                        className="group relative bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-5 hover:from-indigo-800 hover:to-purple-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-white/10 hover:border-white/30"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-br-full -translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform" />

                        {/* NEW Badge */}
                        <div className="absolute top-3 left-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            חדש
                        </div>

                        <div className="relative z-10 flex flex-col items-end">
                            {/* Icon Container */}
                            <div className="relative mb-3 group-hover:rotate-6 transition-transform">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Palette size={24} strokeWidth={2.5} />
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-white mb-1">סטודיו פרסום</h2>
                            <p className="text-white/80 text-sm leading-relaxed font-medium">
                                צור מודעות מקצועיות ברמת מוזיאון
                            </p>
                        </div>
                    </button>
                    )}

                    {/* 4b. Driver Screen - Only for drivers */}
                    {isDriver && isAppVisible('driver') && (
                        <button
                            onClick={() => handleModeSelect('driver')}
                            className="group relative bg-gray-800 rounded-2xl p-5 hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-purple-500"
                        >
                            <div className="absolute top-0 left-0 w-20 h-20 bg-purple-900/50 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                    <Truck size={20} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-white mb-1">מסך נהג</h2>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    משלוחים מוכנים לאיסוף
                                </p>
                            </div>
                        </button>
                    )}

                    {/* 5. Advanced Data - Manager/Owner/Staff Only */}
                    {(isManager || isStaff) && (
                        <button
                            onClick={() => handleModeSelect('dexie-admin')}
                            className="hidden md:block group relative bg-white rounded-2xl p-5 hover:bg-cyan-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-cyan-100"
                        >
                            <div className="absolute top-0 left-0 w-20 h-20 bg-cyan-100 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                    <BarChart3 size={20} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-1">מידע מתקדם</h2>
                                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                    לקוחות, תפריט וסנכרון
                                </p>
                            </div>
                        </button>
                    )}

                    {/* 6. Database Explorer - Admin/Owner Only */}
                    {(currentUser?.is_super_admin || currentUser?.role === 'admin' || isOwner) && (
                        <button
                            onClick={() => handleModeSelect('db-explorer')}
                            className="group relative bg-slate-800 rounded-2xl p-5 hover:bg-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-right overflow-hidden border-2 border-transparent hover:border-purple-500"
                        >
                            <div className="absolute top-3 left-3 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Admin / Owner
                            </div>
                            <div className="absolute top-0 left-0 w-20 h-20 bg-purple-900/50 rounded-br-full -translate-x-5 -translate-y-5 group-hover:scale-110 transition-transform" />
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg group-hover:rotate-6 transition-transform">
                                    <BarChart3 size={20} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-xl font-black text-white mb-1">בסיס נתונים</h2>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    צפייה בטבלאות ו-SQL
                                </p>
                            </div>
                        </button>
                    )}

                </div>

                <div className="mt-6 text-center flex flex-col items-center gap-2">
                    <button
                        onClick={() => {
                            if (currentUser?.is_impersonating) {
                                // Impersonating - return to Super Admin Portal
                                logout();
                            } else if (currentUser?.is_super_admin) {
                                // Super Admin not impersonating - go to Super Admin Portal
                                navigate('/super-admin');
                            } else {
                                // Regular user - full logout
                                logout();
                            }
                        }}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10 text-sm"
                    >
                        <LogOut size={16} />
                        <span>{currentUser?.is_impersonating ? 'חזרה לפורטל הראשי' : currentUser?.is_super_admin ? 'חזרה לפורטל' : 'יציאה'}</span>
                    </button>
                    <div className="text-[10px] text-slate-500 font-mono opacity-50">
                        v{appVersion}
                    </div>
                </div>
            </div>
            {/* What's New Modal - shows once per version after login (for all managers) */}
            {showWhatsNew && isManager && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
        </div>
    );
};

export default ModeSelectionScreen;
