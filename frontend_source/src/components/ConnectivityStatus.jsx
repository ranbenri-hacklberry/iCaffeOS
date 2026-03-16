import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isLocalInstance } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { resolveUrl, CORTEX_CLOUD_URL, BACKEND_CLOUD_URL } from '../utils/apiUtils';
import db from '../db/database';

/**
 * ConnectivityStatus Component
 * Displays the current business name, connection status, and last sync time.
 * Refined Layout: Status Pill and Sync Time are on the same line (Sync left of Pill).
 */
const ConnectivityStatus = ({ mode = 'fixed', invert = false, forceShow = false, className = '' }) => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const [isLocal, setIsLocal] = useState(false);
    const [lastSyncLabel, setLastSyncLabel] = useState('');
    const [pendingCount, setPendingCount] = useState(0);
    const [isN150Down, setIsN150Down] = useState(false);
    const [machineName, setMachineName] = useState('Ryzen AI');

    // Hide on Manager/Admin pages (only relevant for fixed mode usually)
    // 🛡️ REVISION: KDS and Prep SHOULD show the status if explicitly requested (forceShow)
    const isManagerPage = location.pathname.startsWith('/data-manager') ||
        location.pathname.startsWith('/super-admin') ||
        location.pathname.startsWith('/dexie-admin') ||
        location.pathname.startsWith('/prep') ||
        location.pathname.startsWith('/kds') ||
        location.pathname.startsWith('/inventory') ||
        location.pathname === '/' ||
        location.pathname === '/music' ||
        location.pathname.startsWith('/music') ||
        location.pathname.startsWith('/mode-selection') ||
        location.pathname.startsWith('/menu-ordering') ||
        location.pathname.startsWith('/menu-editor') ||
        location.pathname.startsWith('/ipad-menu-editor');

    useEffect(() => {
        const checkStatus = async () => {
            // 1. Check Local N150 Connectivity
            const isLocalClient = window.location.hostname !== new URL(CORTEX_CLOUD_URL).hostname &&
                window.location.hostname !== new URL(BACKEND_CLOUD_URL).hostname &&
                window.location.hostname !== 'icaffe.vercel.app';
            setIsLocal(isLocalClient);

            try {
                const baseUrl = await resolveUrl();

                // 🛡️ [SYNC STABILITY] Skip health check for Cloud URL to avoid 404 noise
                if (baseUrl === BACKEND_CLOUD_URL || baseUrl === CORTEX_CLOUD_URL) {
                    // If we are on a cloud domain (Vercel), "Cloud" is the intended state.
                    const isCloudDomain = window.location.hostname.includes('vercel.app') ||
                        window.location.hostname.includes('run.app') ||
                        window.location.hostname.includes('hacklberryfinn.com');

                    setIsN150Down(!isCloudDomain);
                    setMachineName(isCloudDomain ? 'Cloud' : 'Offline');
                    return;
                }

                // --- TEMPORARILY DISABLED MAYA HEALTH CHECK PER USER REQUEST ---
                setIsN150Down(false);
                setMachineName('המערכת המקומית');
                
                /*
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 5000);

                const healthResp = await fetch('/api/maya/health', { signal: controller.signal });
                clearTimeout(id);

                if (healthResp.ok) {
                    const health = await healthResp.json();
                    let name = health.hostname || 'Ryzen AI';

                    // Smart Override for Mac / Local Dev
                    const isMac = /Macintosh/i.test(navigator.userAgent);
                    // Also check for Electron explicitly
                    const isElectron = /Electron/i.test(navigator.userAgent);
                    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';

                    // 1. Prioritize Local Mac Detection
                    if (isMac && (isLocalhost || isElectron)) {
                        setMachineName('המחשב שלי');
                    }
                    // 2. Otherwise use what the server says
                    else {
                        const cleanName = (name || health.hostname || 'Ryzen AI').split('.')[0];
                        setMachineName(cleanName === 'Mac M1' ? 'Mac M1' : cleanName);
                    }
                }
                setIsN150Down(!healthResp.ok);
                */
            } catch (err) {
                console.warn('Connectivity check failed:', err);
                setIsN150Down(false); // Changed from true so we don't show angry red errors while disabled
            }

            // 2. Check Queue Status (Dexie)
            try {
                const count = await db.offline_queue_v3.where('status').equals('pending').count();
                setPendingCount(count);
            } catch { /* ignore */ }

            // 3. Check sync time
            const lastSync = localStorage.getItem('last_sync_time');
            if (lastSync) {
                const diffMin = Math.floor((Date.now() - parseInt(lastSync)) / 60000);
                if (diffMin < 1) setLastSyncLabel('סונכרן עכשיו');
                else if (diffMin < 60) setLastSyncLabel(`לפני ${diffMin} דק'`);
                else {
                    const date = new Date(parseInt(lastSync));
                    setLastSyncLabel(date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));
                }
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    // If we're on a page that should hide the status, and forceShow isn't true, return null
    if (!forceShow && isManagerPage) {
        return null;
    }

    if (mode === 'fixed' && isManagerPage) return null;

    const displayName = currentUser?.business_name || '';

    // Common Content
    const Content = () => (
        <div className={`flex flex-col items-start pointer-events-auto ${className}`}>
            {/* 1. Business Name */}
            <div className="text-[17px] font-black tracking-tight text-gray-900 leading-none mb-0.5 whitespace-nowrap drop-shadow-sm/50">
                {displayName}
            </div>

            {/* Row: Pill + Sync Time */}
            {/* In RTL: First item is Right, Second item is Left */}
            <div className="flex items-center gap-1.5">

                <div
                    onClick={() => window.dispatchEvent(new CustomEvent('open-sync-modal'))}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <div className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isN150Down ? 'bg-red-400' : (pendingCount > 0 ? 'bg-amber-400' : 'bg-emerald-400')}`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isN150Down ? 'bg-red-500' : (pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500')}`}></span>
                    </div>
                    <span className={`text-[10px] font-bold leading-none ${isN150Down ? 'text-red-800' : 'text-emerald-700'}`}>
                        {isN150Down ? (window.location.hostname.includes('vercel.app') ? 'Not Connected' : 'Offline') : (machineName === 'n150' ? 'Ryzen AI' : machineName)}
                    </span>
                </div>

            </div>
        </div>
    );

    // INLINE MODE
    if (mode === 'inline') {
        return <Content />;
    }

    // FIXED MODE
    return (
        <div
            className="fixed top-3 z-[9999] pointer-events-none select-none flex flex-col items-end"
            style={{ left: 'calc(50% - 160px)', transform: 'translateX(-100%)' }}
            dir="rtl"
        >
            <Content />
        </div>
    );
};

export default ConnectivityStatus;
