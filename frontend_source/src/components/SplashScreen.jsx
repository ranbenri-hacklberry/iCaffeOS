import React, { useState, useEffect, useRef } from 'react';
import './SplashScreen.css';
import { supabase } from '../lib/supabase';
import { initialLoad } from '../services/syncService';
import { getBackendApiUrl } from '../utils/apiUtils';
const API_URL = getBackendApiUrl();

const SplashScreen = ({ onFinish }) => {
    const [minTimePassed, setMinTimePassed] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [syncComplete, setSyncComplete] = useState(false);
    const [statusText, setStatusText] = useState('מתניע מערכת...');
    const [showSkipButton, setShowSkipButton] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const [containerStatus, setContainerStatus] = useState([]); // 🆕 Container visibility


    // --- ✨ NEW SMOOTH PROGRESS LOGIC ---
    const [progress, setProgress] = useState(0);
    const [targetProgress, setTargetProgress] = useState(5);
    const progressTimer = useRef(null);
    const lastUpdate = useRef(Date.now());

    // Track if we've already triggered finish to prevent double calls
    const finishTriggered = useRef(false);

    // 🕵️ SECRET RESET: Tap logo 5 times to clear EVERYTHING
    const handleLogoTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (newCount >= 5) {
            console.warn('🧹 EMERGENCY RESET TRIGGERED!');
            localStorage.clear();
            sessionStorage.clear();
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
            }
            window.location.reload(true);
        }
    };

    // 🏃 PROGRESS ANIMATOR: Moves 'progress' towards 'targetProgress' smoothly
    useEffect(() => {
        let frame;
        const animate = () => {
            setProgress(prev => {
                if (prev >= targetProgress) return prev;
                // Cubic easing for a premium feel
                const distance = targetProgress - prev;
                const step = (distance * 0.08) + 0.15;
                return Math.min(prev + step, targetProgress);
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [targetProgress]);

    // 🚀 INITIALIZATION ENGINE: Runs once on mount
    useEffect(() => {
        console.log('🎨 SplashScreen v5.2 Engine Fixed');

        // Global Safety Timeout - If NOTHING happens in 15 seconds, just go in.
        const globalRescueTimer = setTimeout(() => {
            console.error('🆘 GLOBAL SPLASH TIMEOUT - Forcing entry');
            setTargetProgress(100);
            setAuthChecked(true);
            setSyncComplete(true);
            setMinTimePassed(true);
        }, 15000);

        // Show skip button after 8 seconds
        const skipButtonTimer = setTimeout(() => setShowSkipButton(true), 8000);

        const initialize = async () => {
            try {
                // Phase 1: Environment & Auth (0-30%)
                setTargetProgress(15);
                const { APP_VERSION } = await import('../version');
                localStorage.setItem('app_version', APP_VERSION);

                // 🤖 ELECTRON AUTO-LOGIN (Hardware ID)
                if (window.electron?.auth) {
                    setStatusText('מאמת חומרה...');
                    try {
                        const machineId = await window.electron.auth.getMachineId();
                        if (machineId) {
                            console.log('🔑 Hardware ID:', machineId);
                            const { cloudSupabase } = await import('../lib/supabase');
                            const { data, error } = await cloudSupabase.rpc('verify_kiosk_device', {
                                p_machine_id_hash: machineId
                            });

                            if (data?.success) {
                                console.log('✅ Hardware ID Verified:', data.user.name);
                                // Store in localStorage for AuthContext to pick up immediately
                                localStorage.setItem('kiosk_user', JSON.stringify({ ...data.user, is_device: true }));
                                localStorage.setItem('kiosk_auth_time', Date.now().toString());
                                setTargetProgress(60);
                                setStatusText('התחברות אוטומטית...');
                            } else {
                                console.warn('⚠️ Hardware ID Unregistered:', data?.reason);
                            }
                        }
                    } catch (e) {
                        console.error('❌ Hardware Auth Failed:', e);
                    }
                }

                const { data: { user } } = await supabase.auth.getUser();
                setTargetProgress(40);

                if (user) {
                    setStatusText('מחבר פרופיל...');
                    let businessId = user.user_metadata?.business_id;

                    if (!businessId) {
                        const { data: emp } = await supabase.from('employees').select('business_id').eq('auth_user_id', user.id).maybeSingle();
                        if (emp) businessId = emp.business_id;
                    }

                    if (businessId) {
                        setTargetProgress(45);
                        const { db } = await import('../db/database');
                        const localItemCount = await db.menu_items.count();

                        if (localItemCount > 20) {
                            setStatusText('טוען נתונים...');
                            // Removed: initialLoad(businessId).catch(e => console.warn('Silent sync skipped:', e));
                            setTargetProgress(90);
                            setTimeout(() => {
                                setSyncComplete(true);
                                setAuthChecked(true);
                                setTargetProgress(100);
                            }, 1000);
                        } else {
                            setStatusText('מכין סביבת עבודה...');
                            try {
                                // await initialLoad(businessId);
                            } catch (e) {
                                console.warn('Silent sync skipped:', e);
                            }
                            setTargetProgress(100);
                            setSyncComplete(true);
                            setAuthChecked(true);
                        }
                    } else {
                        setTargetProgress(100);
                    }
                } else {
                    setTargetProgress(100);
                }
                setTargetProgress(100);
            } catch (err) {
                console.error('Initialization error:', err);
                setTargetProgress(100);
            }
        };

        const checkContainers = async () => {
            try {
                const res = await fetch(`${API_URL}/api/system/containers`);
                const data = await res.json();
                if (data && data.success) {
                    setContainerStatus(data.containers || []);
                }
            } catch (err) {
                console.warn('Failed to fetch container status');
            }
        };

        const minTimer = setTimeout(() => setMinTimePassed(true), 1500);
        initialize();

        // 🚀 Polling containers during splash
        checkContainers();
        const pollId = setInterval(checkContainers, 3000);

        return () => {
            clearTimeout(minTimer);
            clearTimeout(globalRescueTimer);
            clearTimeout(skipButtonTimer);
            clearInterval(pollId);
        };
    }, []); // Run ONCE on mount!

    // Coordinate Finish
    useEffect(() => {
        if (progress >= 100 && minTimePassed && !finishTriggered.current) {
            finishTriggered.current = true;
            // Delay slightly to show 100% state
            setTimeout(onFinish, 400);
        }
    }, [progress, minTimePassed, onFinish]);

    return (
        <div className="splash-container">
            <div className="logo-wrapper">
                <img
                    src="rainbow_cup.png"
                    alt="Logo"
                    className="brand-logo-img"
                    onClick={handleLogoTap}
                    onLoad={() => setImageLoaded(true)}
                    style={{
                        opacity: imageLoaded ? 1 : 0,
                        cursor: 'pointer',
                        width: '200px',
                        height: 'auto',
                        marginBottom: '10px'
                    }}
                />

                <h1 className="brand-name">icaffeos</h1>
                <p className="tagline">icaffeos</p>

                <div className="mt-12 flex flex-col items-center gap-4 w-full min-h-[100px] transition-opacity duration-500"
                    style={{ opacity: imageLoaded ? 1 : 0 }}
                >
                    <div className="loading-bar">
                        <div className="progress" style={{ width: `${progress}%`, transition: 'none', animation: 'none' }}></div>
                    </div>
                    {statusText && (
                        <p className="text-white/60 text-[10px] font-mono animate-pulse uppercase tracking-widest">{statusText}</p>
                    )}

                    {showSkipButton && (
                        <button
                            onClick={() => {
                                localStorage.setItem('lite_mode', 'true');
                                onFinish();
                            }}
                            className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full border border-white/20 transition-all animate-bounce"
                        >
                            דלג על סנכרון והכנס ➔ (Lite Mode)
                        </button>
                    )}

                    {/* 🆕 Container Observability Widget */}
                    {containerStatus.length > 0 && (
                        <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-[400px]">
                            {containerStatus.map(c => (
                                <div key={c.name} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status.toLowerCase().includes('up') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                                    <span className="text-[9px] text-white/50 font-mono truncate">{c.name.replace('supabase_', '').replace('_scarlet-zodiac', '')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {tapCount > 0 && tapCount < 5 && (
                    <p className="text-white/20 text-[8px] mt-2">Reset in {5 - tapCount} taps...</p>
                )}
            </div>
        </div>
    );
};

export default SplashScreen;
