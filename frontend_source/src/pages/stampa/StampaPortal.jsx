import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLocationCluster } from '../../hooks/useLocationCluster';
import RegionSelectorOverride from '../../components/RegionSelectorOverride';
import PushNotificationManager from '../../components/PushNotificationManager';
import jsQR from 'jsqr';
import { useTranslation } from 'react-i18next';
import StampaLogo from '../../components/StampaLogo';

const getSupabaseUrl = () => {
    const defaultUrl = import.meta.env.VITE_LOCAL_SUPABASE_URL || 'http://100.82.152.52:54321';
    if (typeof window !== 'undefined' && window.location) {
        const ua = navigator.userAgent || '';
        const isMobileDevice = /android|iphone|ipad|ipod/i.test(ua) || (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web');
        
        if (isMobileDevice) {
            return defaultUrl;
        }

        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') {
            return 'http://localhost:54321';
        }
        if (h) {
            return `http://${h}:54321`;
        }
    }
    return defaultUrl;
};

const supabaseKey = import.meta.env.VITE_LOCAL_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(getSupabaseUrl(), supabaseKey);

// Helper to dynamically resolve backend URL based on current host & platform
const getBackendUrl = () => {
    const defaultUrl = import.meta.env.VITE_BACKEND_URL || 'http://100.82.152.52:8081';
    if (typeof window !== 'undefined' && window.location) {
        const ua = navigator.userAgent || '';
        const isMobileDevice = /android|iphone|ipad|ipod/i.test(ua) || (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() !== 'web');
        
        // On mobile devices/APK, localhost refers to the phone itself, so we must use the server's network IP
        if (isMobileDevice) {
            return defaultUrl;
        }

        // On desktop browser
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') {
            return 'http://localhost:8081';
        }
        if (h) {
            return `http://${h}:8081`;
        }
    }
    return defaultUrl;
};


// Helper to darken and de-saturate hex colors for a premium, low-saturation look
const getPremiumColor = (hex) => {
    if (!hex || hex[0] !== '#') return '#1f1b16';
    // Remove hash
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    
    // Parse r, g, b
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    
    // Convert to HSL
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;
    
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let hColor = 0;
    let s = 0;
    let l = (max + min) / 2;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rNorm: hColor = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: hColor = (bNorm - rNorm) / d + 2; break;
            case bNorm: hColor = (rNorm - gNorm) / d + 4; break;
        }
        hColor /= 6;
    }
    
    // De-saturate by 50% and limit lightness to maximum 12% for deepness
    s = s * 0.5; 
    l = Math.min(l * 0.5, 0.12); 
    
    // Convert back to RGB
    const hslToRgb = (hVal, sVal, lVal) => {
        let rVal, gVal, bVal;
        if (sVal === 0) {
            rVal = gVal = bVal = lVal;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = lVal < 0.5 ? lVal * (1 + sVal) : lVal + sVal - lVal * sVal;
            const p = 2 * lVal - q;
            rVal = hue2rgb(p, q, hVal + 1/3);
            gVal = hue2rgb(p, q, hVal);
            bVal = hue2rgb(p, q, hVal - 1/3);
        }
        return [Math.round(rVal * 255), Math.round(gVal * 255), Math.round(bVal * 255)];
    };
    
    const [newR, newG, newB] = hslToRgb(hColor, s, l);
    return `rgb(${newR}, ${newG}, ${newB})`;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
};

export default function LoyaltyPortal() {
    const { t, i18n } = useTranslation();
    const { selectedRegion, loading: locationLoading } = useLocationCluster();
    const currentRegion = selectedRegion?.name;
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    
    // User Data
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('לקוח נאמנות');
    const [userPhone, setUserPhone] = useState('');
    const [stores, setStores] = useState([]);
    
    // Multi-Tenant Key-Value Maps
    const [coffeeCounts, setCoffeeCounts] = useState({});
    const [promosMap, setPromosMap] = useState({});
    const [subscriptionMap, setSubscriptionMap] = useState({});
    
    // Accordion State
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [showRegionSelector, setShowRegionSelector] = useState(false);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);

    // QR Scanner States
    const [isScanning, setIsScanning] = useState(false);
    const [activeScanBizId, setActiveScanBizId] = useState(null);
    const [scanError, setScanError] = useState('');
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const streamRef = React.useRef(null);

    // Cashier PIN verification states
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinAuthBizId, setPinAuthBizId] = useState(null);
    const [enteredPin, setEnteredPin] = useState('');

    const handleStartQRScanner = (bizId) => {
        setActiveScanBizId(bizId);
        setIsScanning(true);
        setScanError('');
    };

    const handleStopQRScanner = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
        setActiveScanBizId(null);
    };

    useEffect(() => {
        let animationId;
        
        if (isScanning && videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    streamRef.current = stream;
                    video.srcObject = stream;
                    video.setAttribute('playsinline', true);
                    video.play();
                    
                    const scanFrame = () => {
                        if (video.readyState === video.HAVE_ENOUGH_DATA) {
                            canvas.height = video.videoHeight;
                            canvas.width = video.videoWidth;
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: 'dontInvert',
                            });

                            if (code) {
                                console.log('Found QR Code:', code.data);
                                handleScannedCode(code.data);
                                return;
                            }
                        }
                        animationId = requestAnimationFrame(scanFrame);
                    };
                    
                    animationId = requestAnimationFrame(scanFrame);
                })
                .catch(err => {
                    console.error('Failed to access camera:', err);
                    setScanError('לא ניתן לגשת למצלמה. אנא ודא שאישרת הרשאות מצלמה.');
                });
        }

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isScanning]);

    const handleScannedCode = async (data) => {
        handleStopQRScanner();
        
        let scannedBizId = '';
        if (data.startsWith('stampa-stamp:')) {
            scannedBizId = data.replace('stampa-stamp:', '').trim();
        } else if (data.startsWith('icaffeos-stamp:')) {
            scannedBizId = data.replace('icaffeos-stamp:', '').trim();
        } else {
            showToast('קוד QR לא תקין או שאינו שייך למערכת Stampa', 'error');
            return;
        }

        // If scanning to add a new business card
        if (activeScanBizId === 'ADD_NEW_BIZ') {
            try {
                // Fetch the business from db
                const { data: bizData, error: bizErr } = await supabase
                    .from('businesses')
                    .select('id, name')
                    .eq('id', scannedBizId)
                    .single();
                
                if (bizErr || !bizData) {
                    showToast('בית העסק לא נמצא במערכת 🔍', 'error');
                    return;
                }

                // Add subscription
                const { error: subErr } = await supabase
                    .from('store_subscriptions')
                    .upsert({
                        customer_phone: userPhone,
                        store_id: scannedBizId,
                        is_marketing_allowed: true
                    }, { onConflict: 'customer_phone,store_id' });

                if (subErr) {
                    throw subErr;
                }

                // Reload dashboard
                await loadCustomerDashboard();
                
                // Expand the new card
                setExpandedCardId(scannedBizId);
                
                showToast(`🎉 הצטרפת בהצלחה למועדון הלקוחות של ${bizData.name}!`, 'success');
            } catch (err) {
                console.error('Failed to subscribe to business:', err);
                showToast('שגיאה בהצטרפות למועדון הלקוחות. אנא נסה שוב.', 'error');
            }
            return;
        }

        if (scannedBizId !== activeScanBizId) {
            showToast('קוד ה-QR שסרקת אינו שייך לעסק הנבחר!', 'error');
            return;
        }

        const currentBiz = stores.find(b => b.id === scannedBizId);
        if (!currentBiz) {
            showToast('שגיאה בטעינת פרטי העסק.', 'error');
            return;
        }

        // GPS Geofence Check (80 meters limit with buffer)
        if (currentBiz.latitude && currentBiz.longitude) {
            try {
                const getCoords = () => new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
                });
                
                const position = await getCoords();
                const dist = calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    currentBiz.latitude,
                    currentBiz.longitude
                );

                if (dist > 80) {
                    showToast(`עליך להיות בטווח של בית העסק על מנת לקבל ניקוב 📍 (מרחק מהקופה: ${Math.round(dist)} מטרים)`, 'error');
                    return;
                }
            } catch (err) {
                console.error('GPS error:', err);
                showToast('שגיאה באימות מיקומך הגיאוגרפי. אנא ודא שהרשאות המיקום בנייד מופעלות ונסה שוב.', 'error');
                return;
            }
        }

        // PIN Verification Check
        if (currentBiz.require_pin_auth) {
            setPinAuthBizId(scannedBizId);
            setEnteredPin('');
            setShowPinModal(true);
        } else {
            await awardStampToUser(scannedBizId);
        }
    };

    const awardStampToUser = async (bizId) => {
        try {
            let formatted = userPhone;
            if (!formatted) return;
            if (formatted.startsWith('0')) {
                formatted = '+972' + formatted.substring(1);
            } else if (!formatted.startsWith('+')) {
                formatted = '+972' + formatted;
            }

            const { data: customer, error: fetchErr } = await supabase
                .from('customers')
                .select('id, loyalty_coffee_count')
                .in('phone_number', [formatted, userPhone, userPhone.replace(/\D/g, '')])
                .eq('business_id', bizId)
                .limit(1)
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            if (customer) {
                const currentCount = customer.loyalty_coffee_count || 0;
                const { error: updateErr } = await supabase
                    .from('customers')
                    .update({ 
                        loyalty_coffee_count: currentCount + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', customer.id);

                if (updateErr) throw updateErr;
            } else {
                const { error: insertErr } = await supabase
                    .from('customers')
                    .insert({
                        business_id: bizId,
                        phone_number: formatted,
                        name: userName || 'לקוח נאמנות',
                        loyalty_coffee_count: 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (insertErr) throw insertErr;
            }

            await fetchUserDataForBiz(bizId);
            showToast('הניקוב נוסף בהצלחה! ☕🎉', 'success');
        } catch (err) {
            console.error('Failed to award stamp:', err);
            showToast('שגיאה בעדכון הניקובים בבסיס הנתונים', 'error');
        }
    };


    // Manager Mode States
    const [isManagerUser, setIsManagerUser] = useState(false);
    const [managerBusinessId, setManagerBusinessId] = useState(null);
    const [isManagerModeActive, setIsManagerModeActive] = useState(false);
    const [managerBizData, setManagerBizData] = useState(null);
    const [editBrandColor, setEditBrandColor] = useState('#1c1a19');
    const [editLogoUrl, setEditLogoUrl] = useState('');
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoUploadError, setLogoUploadError] = useState('');

    const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingLogo(true);
        setLogoUploadError('');

        const formData = new FormData();
        formData.append('image', file);
        formData.append('businessId', managerBusinessId);

        try {
            const url = getBackendUrl();
            const response = await fetch(`${url}/api/public/upload-logo`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('העלאת התמונה נכשלה');
            }

            const result = await response.json();
            if (result.success && result.url) {
                const fullUrl = `${url}${result.url}`;
                setEditLogoUrl(fullUrl);
            } else {
                throw new Error('תגובת שרת לא תקינה');
            }
        } catch (err) {
            console.error('Failed to upload logo:', err);
            setLogoUploadError(err.message || 'שגיאה בהעלאת הקובץ');
        } finally {
            setIsUploadingLogo(false);
        }
    };
    const [editHasStamps, setEditHasStamps] = useState(true);
    const [editStampLimit, setEditStampLimit] = useState(10);
    const [editStampIcon, setEditStampIcon] = useState('coffee-cup');
    const [editDescription, setEditDescription] = useState('');
    
    // Security & Location States
    const [editRequirePinAuth, setEditRequirePinAuth] = useState(false);
    const [editManagerPin, setEditManagerPin] = useState('1234');
    const [editLatitude, setEditLatitude] = useState('');
    const [editLongitude, setEditLongitude] = useState('');
    const [editSourceLanguage, setEditSourceLanguage] = useState('he');
    
    const [saveLoading, setSaveLoading] = useState(false);

    // Manager Promotions State
    const [managerPromos, setManagerPromos] = useState([]);
    const [promoTitle, setPromoTitle] = useState('');
    const [promoDesc, setPromoDesc] = useState('');
    const [promoImgUrl, setPromoImgUrl] = useState('');
    const [isUploadingPromoImg, setIsUploadingPromoImg] = useState(false);
    const [promoImgUploadError, setPromoImgUploadError] = useState('');
    const [sendPushOnCreate, setSendPushOnCreate] = useState(false);

    // Create Business States
    const [isCreateBizModalOpen, setIsCreateBizModalOpen] = useState(false);
    const [newBizName, setNewBizName] = useState('');
    const [newBizOwner, setNewBizOwner] = useState('');
    const [newBizLink, setNewBizLink] = useState('');
    const [newBizClubType, setNewBizClubType] = useState('☕ כרטיסיית ניקובים (עגלת קפה, מאפייה)');
    const [createBizLoading, setCreateBizLoading] = useState(false);
    const [createBizError, setCreateBizError] = useState('');

    const handlePromoImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingPromoImg(true);
        setPromoImgUploadError('');

        const formData = new FormData();
        formData.append('image', file);
        formData.append('businessId', managerBusinessId);

        try {
            const url = getBackendUrl();
            const response = await fetch(`${url}/api/public/upload-logo`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('העלאת התמונה נכשלה');
            }

            const result = await response.json();
            if (result.success && result.url) {
                const fullUrl = `${url}${result.url}`;
                setPromoImgUrl(fullUrl);
            } else {
                throw new Error('תגובת שרת לא תקינה');
            }
        } catch (err) {
            console.error('Failed to upload promo image:', err);
            setPromoImgUploadError(err.message || 'שגיאה בהעלאת הקובץ');
        } finally {
            setIsUploadingPromoImg(false);
        }
    };
    const [promoLoading, setPromoLoading] = useState(false);
    const [pushLoading, setPushLoading] = useState({});

    // Check Auth Status on mount
    useEffect(() => {
        const token = localStorage.getItem('loyalty_access_token');
        const savedPhone = localStorage.getItem('loyalty_phone');
        const savedId = localStorage.getItem('loyalty_user_id');

        if (token && savedPhone && savedId) {
            supabase.auth.setSession({ access_token: token, refresh_token: '' });
            setUserId(savedId);
            setUserPhone(savedPhone);
            setIsAuthenticated(true);
            fetchProfileName(savedId);
            checkEmployeeRole(savedPhone);
        }
    }, []);



    // Dynamic Content Translation & Caching
    const [translationsMap, setTranslationsMap] = useState({});
    const [activeCardTabs, setActiveCardTabs] = useState({});
    const [toast, setToast] = useState(null);
    
    // Virtual Pager States
    const [activePager, setActivePager] = useState(null);
    const [isPagerReadyAlertActive, setIsPagerReadyAlertActive] = useState(false);
    const [managerPagers, setManagerPagers] = useState([]);
    const [activeManagerTab, setActiveManagerTab] = useState('stamps');
    
    // Manager Pager Settings States
    const [editEnableVirtualPager, setEditEnableVirtualPager] = useState(false);
    const [editDefaultAdminTab, setEditDefaultAdminTab] = useState('stamps');
    const [editEnableSmsFallback, setEditEnableSmsFallback] = useState(true);
    const [editSmsFallbackDelaySeconds, setEditSmsFallbackDelaySeconds] = useState(5);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Gamification & Cashier Validation flow states
    const [joinConfirmBiz, setJoinConfirmBiz] = useState(null);
    const [redeemChoiceBiz, setRedeemChoiceBiz] = useState(null);
    const [validationScreenData, setValidationScreenData] = useState(null);

    // Validation Screen 60s countdown timer
    useEffect(() => {
        let interval;
        if (validationScreenData && validationScreenData.timeLeft > 0) {
            interval = setInterval(() => {
                setValidationScreenData(prev => {
                    if (!prev || prev.timeLeft <= 1) {
                        clearInterval(interval);
                        return null;
                    }
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [validationScreenData]);

    // Realtime subscription for manager pagers
    useEffect(() => {
        if (!isManagerModeActive || !managerBusinessId) return;
        
        const fetchActivePagers = async () => {
            const { data, error } = await supabase
                .from('pagers')
                .select('*')
                .eq('business_id', managerBusinessId)
                .in('status', ['pending', 'ready'])
                .order('created_at', { ascending: true });
            if (!error && data) {
                setManagerPagers(data);
            }
        };
        
        fetchActivePagers();
        
        const channel = supabase
            .channel(`manager-pagers-${managerBusinessId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pagers',
                    filter: `business_id=eq.${managerBusinessId}`
                },
                async (payload) => {
                    console.log('Realtime pager change:', payload);
                    if (payload.eventType === 'INSERT') {
                        try {
                            const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav');
                            chime.volume = 0.5;
                            chime.play().catch(e => console.log('Chime autoplay blocked:', e));
                        } catch (e) {
                            console.log('Audio error:', e);
                        }
                    }
                    fetchActivePagers();
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [isManagerModeActive, managerBusinessId]);

    // Initial check for active pager
    useEffect(() => {
        const savedPagerId = localStorage.getItem('stampa_active_pager_id');
        if (savedPagerId) {
            const fetchPager = async () => {
                const { data, error } = await supabase
                    .from('pagers')
                    .select('*')
                    .eq('id', savedPagerId)
                    .single();
                if (!error && data) {
                    if (data.status === 'collected' || data.status === 'cancelled') {
                        localStorage.removeItem('stampa_active_pager_id');
                    } else {
                        setActivePager(data);
                        if (data.status === 'ready') {
                            setIsPagerReadyAlertActive(true);
                        }
                    }
                } else {
                    localStorage.removeItem('stampa_active_pager_id');
                }
            };
            fetchPager();
        }
    }, []);

    // Realtime subscription for customer's active pager
    useEffect(() => {
        if (!activePager) return;
        
        const channel = supabase
            .channel(`customer-pager-${activePager.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pagers',
                    filter: `id=eq.${activePager.id}`
                },
                (payload) => {
                    console.log('Pager update received:', payload);
                    const updated = payload.new;
                    setActivePager(updated);
                    
                    if (updated.status === 'ready') {
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-200.wav');
                            audio.volume = 0.8;
                            audio.play().catch(e => console.log('Chime autoplay blocked:', e));
                        } catch (e) {
                            console.log('Audio error:', e);
                        }
                        if (navigator.vibrate) {
                            navigator.vibrate([300, 100, 300, 100, 500]);
                        }
                        setIsPagerReadyAlertActive(true);
                    } else if (updated.status === 'collected' || updated.status === 'cancelled') {
                        localStorage.removeItem('stampa_active_pager_id');
                        setActivePager(null);
                        setIsPagerReadyAlertActive(false);
                    }
                }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, [activePager?.id]);

    const handleCreatePager = async (bizId) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.0001;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(0);
            osc.stop(0.01);
        } catch (e) {
            console.log('Audio bypass failed:', e);
        }

        if (typeof window !== 'undefined' && 'Notification' in window) {
            await Notification.requestPermission();
        }

        try {
            const rawPhone = localStorage.getItem('stampa_customer_phone') || userPhone || '';
            const rawName = localStorage.getItem('stampa_customer_name') || userName || 'לקוח';
            
            const { data, error } = await supabase.rpc('create_pager', {
                p_business_id: bizId,
                p_customer_phone: rawPhone,
                p_customer_name: rawName
            });
            if (error) throw error;
            if (data) {
                localStorage.setItem('stampa_active_pager_id', data.id);
                setActivePager(data);
                showToast('הביפר הדיגיטלי הופעל בהצלחה! 📟');
            }
        } catch (err) {
            console.error(err);
            showToast('שגיאה בהפעלת הביפר', 'error');
        }
    };

    const triggerPagerNotification = async (pagerId) => {
        try {
            const { data, error } = await supabase.functions.invoke('notify-pager', {
                body: { pager_id: pagerId }
            });
            if (error) throw error;
            showToast('התראה נשלחה ללקוח!');
        } catch (err) {
            console.error('Notification error:', err);
            await supabase
                .from('pagers')
                .update({ status: 'ready', notified_at: new Date().toISOString() })
                .eq('id', pagerId);
            showToast('התראה נשלחה ידנית (מצב גיבוי)');
        }
    };

    // Trigger store/promotions loading when region changes, authenticated or managerBusinessId is resolved
    useEffect(() => {
        if (isAuthenticated) {
            fetchStoresAndSubscriptions();
        }
    }, [isAuthenticated, currentRegion, userPhone, managerBusinessId]);


    
    useEffect(() => {
        const translateDynamicContent = async () => {
            if (!isAuthenticated || stores.length === 0) return;
            const targetLanguage = i18n.language || 'he';

            // Filter stores that need translation and are not already cached
            const storesToTranslate = stores.filter(biz => {
                const srcLang = biz.source_language || 'he';
                if (srcLang === targetLanguage) return false;
                const cacheKey = `${biz.id}_${targetLanguage}`;
                return !translationsMap[cacheKey];
            });

            if (storesToTranslate.length === 0) return;

            const url = getBackendUrl();

            for (const biz of storesToTranslate) {
                const cacheKey = `${biz.id}_${targetLanguage}`;
                const bizPromos = promosMap[biz.id] || [];

                // Collect texts: 1. Biz Name, 2. Biz Description, 3. Promo Titles, 4. Promo Descriptions
                const textsToTranslate = [];
                const mappingInfo = [];

                if (biz.name) {
                    textsToTranslate.push(biz.name);
                    mappingInfo.push({ type: 'biz_name' });
                }
                if (biz.description) {
                    textsToTranslate.push(biz.description);
                    mappingInfo.push({ type: 'biz_desc' });
                }

                bizPromos.forEach(p => {
                    if (p.title) {
                        textsToTranslate.push(p.title);
                        mappingInfo.push({ type: 'promo_title', promoId: p.id });
                    }
                    if (p.description) {
                        textsToTranslate.push(p.description);
                        mappingInfo.push({ type: 'promo_desc', promoId: p.id });
                    }
                });

                if (textsToTranslate.length === 0) continue;

                try {
                    const res = await fetch(`${url}/api/translate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            texts: textsToTranslate,
                            targetLanguage
                        })
                    });
                    const data = await res.json();

                    if (data.success && data.translations) {
                        const translatedObj = {
                            name: '',
                            description: '',
                            promos: {}
                        };

                        data.translations.forEach((translatedText, index) => {
                            const info = mappingInfo[index];
                            if (!info) return;

                            if (info.type === 'biz_name') {
                                translatedObj.name = translatedText;
                            } else if (info.type === 'biz_desc') {
                                translatedObj.description = translatedText;
                            } else {
                                if (!translatedObj.promos[info.promoId]) {
                                    translatedObj.promos[info.promoId] = { title: '', description: '' };
                                }
                                if (info.type === 'promo_title') {
                                    translatedObj.promos[info.promoId].title = translatedText;
                                } else if (info.type === 'promo_desc') {
                                    translatedObj.promos[info.promoId].description = translatedText;
                                }
                            }
                        });

                        setTranslationsMap(prev => ({
                            ...prev,
                            [cacheKey]: translatedObj
                        }));
                    }
                } catch (err) {
                    console.error(`Translation failed for business ${biz.id}:`, err);
                }
            }
        };

        translateDynamicContent();
    }, [isAuthenticated, stores, promosMap, i18n.language]);

    // Fetch Manager Business customizations and promotions
    useEffect(() => {
        if (isManagerModeActive && managerBusinessId) {
            fetchManagerBizData();
            fetchManagerPromotions();
        }
    }, [isManagerModeActive, managerBusinessId]);

    const checkEmployeeRole = async (rawPhone) => {
        if (!rawPhone) return;
        
        try {
            // Normalize variants of Israeli phone numbers
            let cleanPhone = rawPhone.trim().replace(/\D/g, '');
            let phoneVariants = [rawPhone, cleanPhone];
            
            if (cleanPhone.startsWith('0')) {
                phoneVariants.push('+972' + cleanPhone.substring(1));
                phoneVariants.push('972' + cleanPhone.substring(1));
            } else if (cleanPhone.startsWith('972')) {
                phoneVariants.push('+' + cleanPhone);
                phoneVariants.push('0' + cleanPhone.substring(3));
            } else if (cleanPhone.startsWith('5')) {
                phoneVariants.push('0' + cleanPhone);
                phoneVariants.push('972' + cleanPhone);
                phoneVariants.push('+972' + cleanPhone);
            }
            
            const { data: employees, error } = await supabase
                .from('employees')
                .select('id, name, access_level, business_id')
                .in('phone', phoneVariants);
                
            if (error) throw error;
            
            if (employees && employees.length > 0) {
                const eligibleRoles = ['owner', 'admin', 'manager', 'Owner', 'Admin', 'Manager'];
                const matchingEmp = employees.find(emp => 
                    eligibleRoles.includes(emp.access_level)
                );
                
                if (matchingEmp) {
                    setIsManagerUser(true);
                    setManagerBusinessId(matchingEmp.business_id);
                    console.log(`🔑 Manager Mode unlocked for ${matchingEmp.name} (Store: ${matchingEmp.business_id})`);
                } else {
                    setIsManagerUser(false);
                    setManagerBusinessId(null);
                }
            } else {
                setIsManagerUser(false);
                setManagerBusinessId(null);
            }
        } catch (err) {
            console.error('Failed to verify employee role:', err);
        }
    };

    const fetchProfileName = async (idStr) => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', idStr)
                .single();

            if (profile?.name) {
                setUserName(profile.name);
            }
        } catch (err) {
            console.error('Failed to fetch profile name:', err);
        }
    };

    const fetchStoresAndSubscriptions = async () => {
        try {
            let bizList = [];
            
            // Try fetching by region first if currentRegion is set
            if (currentRegion) {
                const { data: regionData } = await supabase
                    .from('regions')
                    .select('id')
                    .eq('name', currentRegion)
                    .single();

                if (regionData) {
                    const { data: regionBiz } = await supabase
                        .from('businesses')
                        .select('id, name, has_stamps, brand_color, settings, stamp_limit, stamp_icon, logo_url, description, require_pin_auth, manager_pin, latitude, longitude, source_language, enable_virtual_pager, default_admin_tab, enable_sms_fallback, sms_fallback_delay_seconds')
                        .eq('region_id', regionData.id);
                    if (regionBiz) {
                        bizList = regionBiz;
                    }
                }
            }

            // Fallback: if no businesses found for the selected region (or region is not loaded), load ALL businesses
            if (bizList.length === 0) {
                const { data: allBiz } = await supabase
                    .from('businesses')
                    .select('id, name, has_stamps, brand_color, settings, stamp_limit, stamp_icon, logo_url, description, require_pin_auth, manager_pin, latitude, longitude, source_language, enable_virtual_pager, default_admin_tab, enable_sms_fallback, sms_fallback_delay_seconds');
                if (allBiz) {
                    bizList = allBiz;
                }
            }

            // Always ensure the managed business is included at the top of the stack
            if (managerBusinessId) {
                const { data: managedBiz } = await supabase
                    .from('businesses')
                    .select('id, name, has_stamps, brand_color, settings, stamp_limit, stamp_icon, logo_url, description, require_pin_auth, manager_pin, latitude, longitude, source_language, enable_virtual_pager, default_admin_tab, enable_sms_fallback, sms_fallback_delay_seconds')
                    .eq('id', managerBusinessId)
                    .single();
                
                if (managedBiz) {
                    // Remove from list if already exists to avoid duplication
                    bizList = bizList.filter(b => b.id !== managedBiz.id);
                    // Place at the very top (front) of the stack
                    bizList.unshift(managedBiz);
                }
            }

            if (bizList && bizList.length > 0) {
                setStores(bizList);
                setExpandedCardId(bizList[0].id); // Expand first card on load
                
                // Fetch data in parallel for each store
                bizList.forEach(biz => {
                    fetchUserDataForBiz(biz.id);
                    fetchPromotionsForBiz(biz.id);
                    fetchSubscriptionStatusForBiz(biz.id);
                });
            } else {
                setStores([]);
                setExpandedCardId(null);
            }
        } catch (err) {
            console.error('Failed to fetch stores:', err);
        }
    };

    const fetchUserDataForBiz = async (bizId) => {
        try {
            let formatted = userPhone;
            if (!formatted) return;
            if (formatted.startsWith('0')) {
                formatted = '+972' + formatted.substring(1);
            } else if (!formatted.startsWith('+')) {
                formatted = '+972' + formatted;
            }

            const { data: customer } = await supabase
                .from('customers')
                .select('loyalty_coffee_count, name')
                .in('phone_number', [formatted, userPhone, userPhone.replace(/\D/g, '')])
                .eq('business_id', bizId)
                .limit(1)
                .maybeSingle();

            if (customer) {
                setCoffeeCounts(prev => ({ ...prev, [bizId]: customer.loyalty_coffee_count || 0 }));
                if (customer.name && userName === 'לקוח נאמנות') {
                    setUserName(customer.name);
                }
            } else {
                setCoffeeCounts(prev => ({ ...prev, [bizId]: 0 }));
            }
        } catch (err) {
            console.error(`Failed to fetch user data for store ${bizId}:`, err);
        }
    };

    const fetchSubscriptionStatusForBiz = async (storeId) => {
        try {
            const { data } = await supabase
                .from('store_subscriptions')
                .select('is_marketing_allowed')
                .eq('customer_phone', userPhone)
                .eq('store_id', storeId)
                .single();

            if (data) {
                setSubscriptionMap(prev => ({ ...prev, [storeId]: data.is_marketing_allowed }));
            } else {
                setSubscriptionMap(prev => ({ ...prev, [storeId]: false }));
            }
        } catch (err) {
            console.error(`Failed to fetch subscription for store ${storeId}:`, err);
        }
    };

    const handleCreateBusiness = async (e) => {
        e.preventDefault();
        if (!newBizName || !newBizOwner || !newBizLink) {
            setCreateBizError(i18n.language === 'he' ? 'נא למלא את כל השדות' : 'Please fill all required fields');
            return;
        }
        setCreateBizLoading(true);
        setCreateBizError('');

        try {
            const url = getBackendUrl();
            const response = await fetch(`${url}/api/public/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    businessName: newBizName,
                    ownerName: newBizOwner,
                    phone: userPhone,
                    clubType: newBizClubType,
                    businessLink: newBizLink
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Registration failed');
            }

            // Success
            setIsCreateBizModalOpen(false);
            setNewBizName('');
            setNewBizLink('');
            
            // Refresh stores list
            await fetchStoresAndSubscriptions();
            // Refresh employee status
            await checkEmployeeRole(userPhone);

            alert(i18n.language === 'he' ? '🎉 העסק נוצר והופעל בהצלחה! מועדון הלקוחות שלך מוכן.' : '🎉 Business registered successfully! Your loyalty club is ready.');

        } catch (err) {
            console.error('Failed to register business:', err);
            setCreateBizError(err.message || (i18n.language === 'he' ? 'רישום העסק נכשל' : 'Registration failed'));
        } finally {
            setCreateBizLoading(false);
        }
    };

    const fetchPromotionsForBiz = async (storeId) => {
        try {
            const { data } = await supabase
                .from('marketplace_promotions')
                .select('*')
                .eq('business_id', storeId)
                .eq('is_active', true);

            if (data) {
                setPromosMap(prev => ({ ...prev, [storeId]: data }));
            }
        } catch (err) {
            console.error(`Failed to fetch promotions for store ${storeId}:`, err);
        }
    };

    const handleToggleSubscriptionForBiz = async (storeId, currentStatus) => {
        const newStatus = !currentStatus;
        setSubscriptionMap(prev => ({ ...prev, [storeId]: newStatus }));

        try {
            await supabase
                .from('store_subscriptions')
                .upsert({
                    customer_phone: userPhone,
                    store_id: storeId,
                    is_marketing_allowed: newStatus
                }, { onConflict: 'customer_phone,store_id' });
        } catch (err) {
            console.error(`Failed to update subscription for store ${storeId}:`, err);
            setSubscriptionMap(prev => ({ ...prev, [storeId]: currentStatus })); // revert
        }
    };

    // Manager Mode logic
    const fetchManagerBizData = async () => {
        if (!managerBusinessId) return;
        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', managerBusinessId)
                .single();
            if (error) throw error;
            if (data) {
                setManagerBizData(data);
                setEditBrandColor(data.brand_color || '#1c1a19');
                setEditLogoUrl(data.logo_url || '');
                setEditHasStamps(data.has_stamps ?? true);
                setEditStampLimit(data.stamp_limit || 10);
                setEditStampIcon(data.stamp_icon || 'coffee-cup');
                setEditDescription(data.description || '');
                setEditRequirePinAuth(data.require_pin_auth ?? false);
                setEditManagerPin(data.manager_pin || '1234');
                setEditLatitude(data.latitude !== null ? String(data.latitude) : '');
                setEditLongitude(data.longitude !== null ? String(data.longitude) : '');
                setEditSourceLanguage(data.source_language || 'he');
                setEditEnableVirtualPager(data.enable_virtual_pager ?? false);
                setEditDefaultAdminTab(data.default_admin_tab || 'stamps');
                setEditEnableSmsFallback(data.enable_sms_fallback ?? true);
                setEditSmsFallbackDelaySeconds(data.sms_fallback_delay_seconds || 5);
                if (data.default_admin_tab) {
                    setActiveManagerTab(data.default_admin_tab);
                } else if (data.enable_virtual_pager) {
                    setActiveManagerTab('pagers');
                } else {
                    setActiveManagerTab('stamps');
                }
            }
        } catch (err) {
            console.error('Failed to fetch manager business data:', err);
        }
    };

    const fetchManagerPromotions = async () => {
        if (!managerBusinessId) return;
        try {
            const { data, error } = await supabase
                .from('marketplace_promotions')
                .select('*')
                .eq('business_id', managerBusinessId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setManagerPromos(data || []);
        } catch (err) {
            console.error('Failed to fetch manager promotions:', err);
        }
    };

    const handleSaveCardSettings = async (e) => {
        e.preventDefault();
        if (!managerBusinessId) return;
        setSaveLoading(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    brand_color: editBrandColor,
                    logo_url: editLogoUrl,
                    has_stamps: editHasStamps,
                    stamp_limit: editStampLimit,
                    stamp_icon: editStampIcon,
                    description: editDescription,
                    require_pin_auth: editRequirePinAuth,
                    manager_pin: editManagerPin,
                    latitude: editLatitude !== '' ? parseFloat(editLatitude) : null,
                    longitude: editLongitude !== '' ? parseFloat(editLongitude) : null,
                    source_language: editSourceLanguage,
                    enable_virtual_pager: editEnableVirtualPager,
                    default_admin_tab: editDefaultAdminTab,
                    enable_sms_fallback: editEnableSmsFallback,
                    sms_fallback_delay_seconds: parseInt(editSmsFallbackDelaySeconds) || 5
                })
                .eq('id', managerBusinessId);
            if (error) throw error;
            
            await fetchManagerBizData();
            await fetchStoresAndSubscriptions();
            alert('הגדרות כרטיס המועדון עודכנו בהצלחה!');
        } catch (err) {
            console.error('Failed to update business settings:', err);
            alert('שגיאה בעדכון הגדרות כרטיס המועדון');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleAddPromotion = async (e) => {
        e.preventDefault();
        if (!managerBusinessId || !promoTitle) return;
        setPromoLoading(true);
        try {
            const { data: newPromo, error } = await supabase
                .from('marketplace_promotions')
                .insert({
                    business_id: managerBusinessId,
                    title: promoTitle,
                    description: promoDesc,
                    image_url: promoImgUrl,
                    is_active: true
                })
                .select('*')
                .single();

            if (error) throw error;

            // Trigger Push Notification to club members automatically if checked
            if (sendPushOnCreate && newPromo) {
                try {
                    const backendUrl = getBackendUrl();
                    await fetch(`${backendUrl}/api/promotions/send-regional`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            storeId: managerBusinessId,
                            title: newPromo.title,
                            body: newPromo.description,
                            data: {
                                imageUrl: newPromo.image_url,
                                promotionId: newPromo.id
                            }
                        })
                    });
                    console.log('📣 Auto push broadcast successfully sent for:', newPromo.title);
                } catch (pushErr) {
                    console.error('Failed to auto-send push notification:', pushErr);
                }
            }

            setPromoTitle('');
            setPromoDesc('');
            setPromoImgUrl('');
            setSendPushOnCreate(false);
            fetchManagerPromotions();
            alert('המבצע נוסף בהצלחה!');
        } catch (err) {
            console.error('Failed to add promotion:', err);
            alert('שגיאה בהוספת המבצע');
        } finally {
            setPromoLoading(false);
        }
    };

    const handleTogglePromoStatus = async (promoId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('marketplace_promotions')
                .update({ is_active: !currentStatus })
                .eq('id', promoId);
            if (error) throw error;
            fetchManagerPromotions();
        } catch (err) {
            console.error('Failed to toggle promotion status:', err);
        }
    };

    const handleDeletePromo = async (promoId) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק מבצע זה?')) return;
        try {
            const { error } = await supabase
                .from('marketplace_promotions')
                .delete()
                .eq('id', promoId);
            if (error) throw error;
            fetchManagerPromotions();
        } catch (err) {
            console.error('Failed to delete promotion:', err);
        }
    };

    const handleSendPushBroadcast = async (promo) => {
        setPushLoading(prev => ({ ...prev, [promo.id]: true }));
        try {
            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/promotions/send-regional`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: managerBusinessId,
                    title: promo.title,
                    body: promo.description,
                    data: {
                        imageUrl: promo.image_url,
                        promotionId: promo.id
                    }
                })
            });

            const data = await response.json();
            if (response.ok) {
                if (data.devMode) {
                    alert(`[מצב פיתוח] שידור הפוש נרשם בהצלחה בשרת ל-${data.sentCount} לקוחות!`);
                } else {
                    alert(`שידור הפוש נשלח בהצלחה ל-${data.sentCount} לקוחות!`);
                }
            } else {
                alert(`שגיאה בשליחת הפוש: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Push broadcast request failed:', err);
            alert('שגיאה בחיבור לשרת לצורך שידור הפוש');
        } finally {
            setPushLoading(prev => ({ ...prev, [promo.id]: false }));
        }
    };

    // OTP Handlers
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 9) {
            setAuthError('אנא הזן מספר טלפון תקין');
            return;
        }

        setAuthLoading(true);
        setAuthError('');

        try {
            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/auth/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const data = await response.json();

            if (response.ok) {
                setIsOtpSent(true);
                if (data.devMode) {
                    setAuthError(`[DEV MODE] קוד האימות: ${data.message.split(': ')[1]}`);
                }
            } else {
                setAuthError(data.error || 'שגיאה בשליחת קוד אימות');
            }
        } catch (err) {
            setAuthError(`לא ניתן להתחבר לשרת ה-API בכתובת ${backendUrl}. אנא ודא שהמכשיר מחובר לאותה רשת Wi-Fi של השרת.`);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.length !== 6) {
            setAuthError('אנא הזן קוד אימות בן 6 ספרות');
            return;
        }

        setAuthLoading(true);
        setAuthError('');

        try {
            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/api/auth/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: otpCode })
            });

            const data = await response.json();

            if (response.ok && data.session) {
                const { access_token, user } = data.session;
                localStorage.setItem('loyalty_access_token', access_token);
                localStorage.setItem('loyalty_phone', user.phone);
                localStorage.setItem('loyalty_user_id', user.id);

                supabase.auth.setSession({ access_token, refresh_token: '' });

                setUserId(user.id);
                setUserPhone(user.phone);
                setIsAuthenticated(true);
                fetchProfileName(user.id);
                checkEmployeeRole(user.phone);
            } else {
                setAuthError(data.error || 'קוד אימות שגוי');
            }
        } catch (err) {
            setAuthError('שגיאה במהלך אימות הקוד');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('loyalty_access_token');
        localStorage.removeItem('loyalty_phone');
        localStorage.removeItem('loyalty_user_id');
        setIsAuthenticated(false);
        setPhone('');
        setOtpCode('');
        setIsOtpSent(false);
        setUserName('לקוח נאמנות');
        setUserId('');
        setUserPhone('');
        setIsManagerUser(false);
        setManagerBusinessId(null);
        setIsManagerModeActive(false);
        setStores([]);
        setCoffeeCounts({});
        setPromosMap({});
        setSubscriptionMap({});
        setEditDescription('');
        setEditRequirePinAuth(false);
        setEditManagerPin('1234');
        setEditLatitude('');
        setEditLongitude('');
    };

    // Render Login Screen if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#12100e] text-[#f5f0eb] flex flex-col justify-center items-center px-6 py-12 font-inter" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                <div className="w-full max-w-md bg-[#1f1b16]/90 backdrop-blur-md border border-amber-900/30 p-8 rounded-2xl shadow-stone-950/60 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#c59b27]/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/5 rounded-full blur-3xl"></div>

                    {/* Language Switcher */}
                    <div className={`absolute top-4 ${i18n.language === 'he' ? 'left-4' : 'right-4'} z-10 flex gap-1.5`}>
                        <button
                            type="button"
                            onClick={() => {
                                i18n.changeLanguage('he');
                                localStorage.setItem('i18nextLng', 'he');
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                                i18n.language === 'he' 
                                    ? 'bg-[#c59b27] text-black shadow-stone-950/30 shadow-md shadow-stone-950/40' 
                                    : 'bg-stone-900/80 text-[#f5f0eb]/60 hover:text-[#f5f0eb] border border-amber-900/30'
                            }`}
                        >
                            עב
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                i18n.changeLanguage('en');
                                localStorage.setItem('i18nextLng', 'en');
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                                i18n.language === 'en' 
                                    ? 'bg-[#c59b27] text-black shadow-stone-950/30 shadow-md shadow-stone-950/40' 
                                    : 'bg-stone-900/80 text-[#f5f0eb]/60 hover:text-[#f5f0eb] border border-amber-900/30'
                            }`}
                        >
                            EN
                        </button>
                    </div>

                    <div className="text-center mb-8 relative">
                        <div className="flex justify-center mb-4">
                            <StampaLogo size={90} className="transform hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">{t('login.title')}</h2>
                        <p className="text-xs text-[#f5f0eb]/60 mt-2 leading-relaxed">{t('login.subtitle')}</p>
                    </div>

                    {authError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-bold">
                            {authError}
                        </div>
                    )}

                    {!isOtpSent ? (
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2 mr-1">{t('login.phoneLabel')}</label>
                                <input
                                    type="tel"
                                    placeholder={t('login.phonePlaceholder')}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-5 py-4 text-[#f5f0eb] text-lg placeholder-[#f5f0eb]/20 focus:border-[#c59b27] focus:outline-none transition-all duration-300"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-400 hover:to-[#b45309] text-black font-black py-4 rounded-xl shadow-stone-950/40 shadow-lg shadow-stone-950/40 hover:shadow-stone-950/40 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                            >
                                {authLoading ? t('login.loading') : t('login.sendOtp')}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2 mr-1">{t('login.otpTitle')}</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder=" הזן את הקוד שקיבלת"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-5 py-4 text-[#f5f0eb] text-center text-2xl tracking-widest placeholder-[#f5f0eb]/20 focus:border-[#c59b27] focus:outline-none transition-all duration-300"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-400 hover:to-[#b45309] text-black font-black py-4 rounded-xl shadow-stone-950/40 shadow-lg shadow-stone-950/40 hover:shadow-stone-950/40 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                            >
                                {authLoading ? t('login.loading') : t('login.verifyOtp')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsOtpSent(false)}
                                className="w-full text-xs text-[#f5f0eb]/60 hover:text-[#f5f0eb] transition-colors duration-200"
                            >
                                {t('login.backToPhone')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // Render Manager Mode View
    if (isManagerModeActive) {
        return (
            <div className="min-h-screen bg-[#12100e] text-[#f5f0eb] font-inter pb-12" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                <PushNotificationManager userId={userId} />
                <header className="sticky top-0 bg-[#12100e]/95 backdrop-blur-md border-b border-amber-900/30 z-50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#c59b27]">{t('manager.title')}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsManagerModeActive(false)}
                            className="text-xs font-black bg-stone-900 border border-amber-900/30 text-[#f5f0eb]/80 rounded-full px-4 py-2 hover:bg-stone-800 transition-all shadow-stone-950/30 shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                            <span>👤</span>
                            <span>{i18n.language === 'he' ? 'מצב לקוח' : 'Customer Mode'}</span>
                        </button>
                        <button 
                            onClick={handleLogout}
                            className="text-[#f5f0eb]/40 hover:text-[#f5f0eb]/80 transition-colors p-1"
                            title={t('customer.logout')}
                        >
                            ⚙️
                        </button>
                    </div>
                </header>

                <main className="max-w-md mx-auto px-6 mt-6 space-y-8">
                    {/* Manager Sub-navigation Tab Bar */}
                    {managerBizData && managerBizData.enable_virtual_pager && (
                        <div className="flex bg-[#1f1b16] p-1 rounded-2xl border border-amber-900/20 max-w-sm mx-auto mb-6">
                            <button
                                type="button"
                                onClick={() => setActiveManagerTab('stamps')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 \${
                                    activeManagerTab === 'stamps' 
                                        ? 'bg-gradient-to-r from-[#e5c17d] to-[#c59b27] text-black shadow-md' 
                                        : 'text-[#f5f0eb]/60 hover:text-[#f5f0eb]'
                                }`}
                            >
                                🎨 {i18n.language === 'he' ? 'עיצוב והגדרות' : 'Design & Settings'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveManagerTab('pagers')}
                                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 \${
                                    activeManagerTab === 'pagers' 
                                        ? 'bg-gradient-to-r from-[#e5c17d] to-[#c59b27] text-black shadow-md' 
                                        : 'text-[#f5f0eb]/60 hover:text-[#f5f0eb]'
                                }`}
                            >
                                📟 {i18n.language === 'he' ? 'ביפרים' : 'Pagers'}
                            </button>
                        </div>
                    )}

                    {activeManagerTab === 'pagers' ? (
                        <section className="space-y-6">
                            {/* Column 1: Pending pagers */}
                            <div className="bg-[#1f1b16] border border-amber-900/30 p-6 rounded-3xl shadow-xl space-y-4">
                                <h3 className="text-md font-black text-[#c59b27] border-b border-amber-900/30 pb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <span>⏳</span>
                                        <span>{i18n.language === 'he' ? 'הזמנות בהכנה' : 'Orders in Prep'}</span>
                                    </span>
                                    <span className="text-xs bg-[#c59b27]/10 text-[#c59b27] px-2 py-0.5 rounded-full">
                                        {managerPagers.filter(p => p.status === 'pending').length}
                                    </span>
                                </h3>

                                {managerPagers.filter(p => p.status === 'pending').length === 0 ? (
                                    <p className="text-xs text-[#f5f0eb]/40 text-center py-6">{i18n.language === 'he' ? 'אין כרגע הזמנות בהכנה' : 'No active orders in prep'}</p>
                                ) : (
                                    <div className="space-y-3.5 text-right" dir="rtl">
                                        {managerPagers.filter(p => p.status === 'pending').map((pager) => {
                                            const elapsed = Math.round((new Date() - new Date(pager.created_at)) / 60000);
                                            return (
                                                <div key={pager.id} className="bg-[#12100e]/60 border border-amber-900/20 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                                                    <div>
                                                        <span className="text-2xl font-black text-[#c59b27] block">#{pager.pager_number}</span>
                                                        <span className="text-xs font-bold text-[#f5f0eb]/80 block mt-1">
                                                            {pager.customer_name || 'לקוח'} • {pager.customer_phone || 'אין טלפון'}
                                                        </span>
                                                        <span className="text-[10px] text-[#f5f0eb]/40 mt-0.5 block">
                                                            {i18n.language === 'he' ? `התחיל לפני ${elapsed} דק'` : `Started ${elapsed}m ago`}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => triggerPagerNotification(pager.id)}
                                                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
                                                    >
                                                        <span>🔔</span>
                                                        <span>{i18n.language === 'he' ? 'קרא ללקוח!' : 'Call!'}</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Column 2: Ready for Pickup pagers */}
                            <div className="bg-[#1f1b16] border border-amber-900/30 p-6 rounded-3xl shadow-xl space-y-4">
                                <h3 className="text-md font-black text-emerald-500 border-b border-amber-900/30 pb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <span>✅</span>
                                        <span>{i18n.language === 'he' ? 'מוכן לאיסוף' : 'Ready for Pickup'}</span>
                                    </span>
                                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                                        {managerPagers.filter(p => p.status === 'ready').length}
                                    </span>
                                </h3>

                                {managerPagers.filter(p => p.status === 'ready').length === 0 ? (
                                    <p className="text-xs text-[#f5f0eb]/40 text-center py-6">{i18n.language === 'he' ? 'אין כרגע הזמנות שממתינות לאיסוף' : 'No orders waiting for pickup'}</p>
                                ) : (
                                    <div className="space-y-3.5 text-right" dir="rtl">
                                        {managerPagers.filter(p => p.status === 'ready').map((pager) => {
                                            return (
                                                <div key={pager.id} className="bg-emerald-950/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between shadow-inner animate-pulse">
                                                    <div>
                                                        <span className="text-2xl font-black text-emerald-400 block">#{pager.pager_number}</span>
                                                        <span className="text-xs font-bold text-[#f5f0eb]/80 block mt-1">
                                                            {pager.customer_name || 'לקוח'} • {pager.customer_phone || 'אין טלפון'}
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => triggerPagerNotification(pager.id)}
                                                            className="bg-[#12100e] border border-amber-500/30 text-[#c59b27] px-3 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
                                                            title="קרא שוב"
                                                        >
                                                            🔄
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await supabase
                                                                        .from('pagers')
                                                                        .update({ status: 'collected', collected_at: new Date().toISOString() })
                                                                        .eq('id', pager.id);
                                                                    showToast('ההזמנה נמסרה בהצלחה!');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                }
                                                            }}
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
                                                        >
                                                            ✓ {i18n.language === 'he' ? 'נמסר' : 'Delivered'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : (
                        <>
                            {/* Card Customization Editor */}
                    <section className="bg-[#1f1b16] border border-amber-900/30 p-6 rounded-3xl shadow-stone-950/50 shadow-xl space-y-6">
                        <h3 className="text-lg font-black text-[#c59b27] border-b border-amber-900/30 pb-3 flex items-center gap-2">
                            <span>🎨</span>
                            <span>{t('manager.sectionCardTitle')}</span>
                        </h3>

                        <form onSubmit={handleSaveCardSettings} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">{i18n.language === 'he' ? 'צבע מותג (Hex)' : 'Brand Color (Hex)'}</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="color" 
                                        value={editBrandColor}
                                        onChange={(e) => setEditBrandColor(e.target.value)}
                                        className="w-12 h-12 bg-transparent border-0 cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={editBrandColor}
                                        onChange={(e) => setEditBrandColor(e.target.value)}
                                        className="flex-1 bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none text-left"
                                        placeholder="#1c1a19"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">{t('manager.logoLabel')}</label>
                                <div className="flex items-center gap-4">
                                    {editLogoUrl ? (
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-amber-900/30 bg-[#12100e] relative group">
                                            <img src={editLogoUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setEditLogoUrl('')}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-red-500 font-bold transition-all"
                                            >
                                                {i18n.language === 'he' ? 'הסר ❌' : 'Remove ❌'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-amber-900/30 flex items-center justify-center text-2xl text-stone-600">
                                            🖼️
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="cursor-pointer bg-[#12100e] hover:bg-stone-900 border border-amber-900/30 hover:border-stone-750 text-[#f5f0eb] rounded-xl px-4 py-3 text-sm font-medium transition-all text-center inline-block">
                                            {isUploadingLogo ? t('manager.uploading') : t('manager.uploadButton')}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                disabled={isUploadingLogo}
                                            />
                                        </label>
                                        
                                        {logoUploadError && (
                                            <span className="text-xs text-red-500 font-semibold">{logoUploadError}</span>
                                        )}
                                        
                                        {!isUploadingLogo && !logoUploadError && (
                                            <span className="text-[10px] text-[#f5f0eb]/40">{t('manager.uploadSpecs')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">{t('manager.descriptionLabel')}</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none text-xs h-20 resize-none"
                                    placeholder={t('manager.descriptionPlaceholder')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">{t('manager.stampsLabel')}</label>
                                    <select
                                        value={editStampLimit}
                                        onChange={(e) => setEditStampLimit(parseInt(e.target.value))}
                                        className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none"
                                    >
                                        <option value={8}>{t('manager.stampOptions.8')}</option>
                                        <option value={10}>{t('manager.stampOptions.10')}</option>
                                        <option value={12}>{t('manager.stampOptions.12')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">{t('manager.iconLabel')}</label>
                                    <select
                                        value={editStampIcon}
                                        onChange={(e) => setEditStampIcon(e.target.value)}
                                        className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none"
                                    >
                                        <option value="coffee-cup">{t('manager.iconOptions.coffee-cup')}</option>
                                        <option value="star">{t('manager.iconOptions.star')}</option>
                                        <option value="heart">{t('manager.iconOptions.heart')}</option>
                                        <option value="leaf">{t('manager.iconOptions.leaf')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditHasStamps(!editHasStamps)}
                                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${editHasStamps ? 'bg-[#c59b27]' : 'bg-stone-700'}`}
                                >
                                    <div className={`bg-black w-4 h-4 rounded-full shadow-stone-950/30 shadow-md transform transition-transform duration-300 ${editHasStamps ? '-translate-x-5' : 'translate-x-0'}`}></div>
                                </button>
                                <span className="text-xs font-bold text-[#f5f0eb]/80">{t('manager.enableStamps')}</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">{i18n.language === 'he' ? 'שפת המקור של התכנים' : 'Content Source Language'}</label>
                                <select
                                    value={editSourceLanguage}
                                    onChange={(e) => setEditSourceLanguage(e.target.value)}
                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none"
                                >
                                    <option value="he">עברית (Hebrew)</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            {/* Security PIN Settings */}
                            <div className="border-t border-amber-900/30 pt-4 space-y-4">
                                <span className="text-xs font-black text-[#c59b27] block text-right">{t('manager.pinSettingsTitle')}</span>
                                
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditRequirePinAuth(!editRequirePinAuth)}
                                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${editRequirePinAuth ? 'bg-[#c59b27]' : 'bg-stone-700'}`}
                                    >
                                        <div className={`bg-black w-4 h-4 rounded-full shadow-stone-950/30 shadow-md transform transition-transform duration-300 ${editRequirePinAuth ? '-translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                    <span className="text-xs font-bold text-[#f5f0eb]/80">{t('manager.requirePinAuth')}</span>
                                </div>

                                {editRequirePinAuth && (
                                    <div>
                                        <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2 mr-1">{t('manager.pinLabel')}</label>
                                        <input 
                                            type="text" 
                                            maxLength={4}
                                            value={editManagerPin}
                                            onChange={(e) => setEditManagerPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none text-center font-mono tracking-widest text-sm"
                                            placeholder="1234"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Pager Settings */}
                            <div className="border-t border-amber-900/30 pt-4 space-y-4" dir="rtl">
                                <span className="text-xs font-black text-[#c59b27] block text-right">📟 הגדרות ביפר דיגיטלי (Virtual Pager)</span>
                                
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditEnableVirtualPager(!editEnableVirtualPager)}
                                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 \${editEnableVirtualPager ? 'bg-[#c59b27]' : 'bg-stone-700'}`}
                                    >
                                        <div className={`bg-black w-4 h-4 rounded-full shadow-stone-950/30 shadow-md transform transition-transform duration-300 \${editEnableVirtualPager ? '-translate-x-5' : 'translate-x-0'}`}></div>
                                    </button>
                                    <span className="text-xs font-bold text-[#f5f0eb]/80">הפעל מערכת ביפרים דיגיטליים לעסק זה</span>
                                </div>

                                {editEnableVirtualPager && (
                                    <div className="space-y-4 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">לשונית ברירת מחדל למנהל:</label>
                                            <select
                                                value={editDefaultAdminTab}
                                                onChange={(e) => setEditDefaultAdminTab(e.target.value)}
                                                className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none"
                                            >
                                                <option value="pagers">📟 ביפר דיגיטלי (Pagers)</option>
                                                <option value="stamps">🎨 כרטיס מועדון (Stamps)</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEditEnableSmsFallback(!editEnableSmsFallback)}
                                                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 \${editEnableSmsFallback ? 'bg-[#c59b27]' : 'bg-stone-700'}`}
                                            >
                                                <div className={`bg-black w-4 h-4 rounded-full shadow-stone-950/30 shadow-md transform transition-transform duration-300 \${editEnableSmsFallback ? '-translate-x-5' : 'translate-x-0'}`}></div>
                                            </button>
                                            <span className="text-xs font-bold text-[#f5f0eb]/80">גיבוי התראות ב-SMS (SMS Fallback)</span>
                                        </div>

                                        {editEnableSmsFallback && (
                                            <div>
                                                <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-2">עיכוב שליחת SMS (שניות):</label>
                                                <input 
                                                    type="number" 
                                                    value={editSmsFallbackDelaySeconds}
                                                    onChange={(e) => setEditSmsFallbackDelaySeconds(parseInt(e.target.value) || 0)}
                                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none text-center"
                                                    placeholder="5"
                                                    min="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* GPS Location Settings */}
                            <div className="border-t border-amber-900/30 pt-4 space-y-4">
                                <span className="text-xs font-black text-[#c59b27] block text-right">{t('manager.locationTitle')}</span>
                                <p className="text-[10px] text-[#f5f0eb]/40 leading-normal text-right">{t('manager.locationDesc')}</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#f5f0eb]/40 mb-1.5 mr-1 text-right">{t('manager.latLabel')}</label>
                                        <input 
                                            type="text"
                                            value={editLatitude}
                                            onChange={(e) => setEditLatitude(e.target.value)}
                                            className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-3 py-2 text-[#f5f0eb]/80 focus:border-[#c59b27] focus:outline-none text-xs font-mono text-center"
                                            placeholder="32.0853"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#f5f0eb]/40 mb-1.5 mr-1 text-right">{t('manager.lonLabel')}</label>
                                        <input 
                                            type="text"
                                            value={editLongitude}
                                            onChange={(e) => setEditLongitude(e.target.value)}
                                            className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-3 py-2 text-[#f5f0eb]/80 focus:border-[#c59b27] focus:outline-none text-xs font-mono text-center"
                                            placeholder="34.7818"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setEditLatitude(String(position.coords.latitude));
                                                    setEditLongitude(String(position.coords.longitude));
                                                    alert(t('manager.updateLocationSuccess'));
                                                },
                                                (error) => {
                                                    console.error(error);
                                                    alert(t('manager.gpsDenied'));
                                                },
                                                { enableHighAccuracy: true }
                                            );
                                        } else {
                                            alert(t('manager.gpsUnsupported'));
                                        }
                                    }}
                                    className="w-full bg-[#12100e] hover:bg-stone-900 border border-amber-900/30 hover:border-stone-750 text-[#c59b27] font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-stone-950/30 shadow-md"
                                >
                                    <span>📍</span>
                                    <span>{t('manager.updateLocationButton')}</span>
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={saveLoading}
                                className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-400 hover:to-[#b45309] text-black font-black py-3.5 rounded-xl shadow-stone-950/40 shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {saveLoading ? t('manager.saving') : t('manager.saveSettings')}
                            </button>
                        </form>

                        <div className="bg-[#1f1b16]/50 p-4 rounded-2xl border border-amber-900/30 space-y-4">
                             <span className="text-xs font-bold tracking-wide text-[#f5f0eb]/80 block">{t('manager.qrPrintTitle')}</span>
                             <p className="text-[10px] text-[#f5f0eb]/60">{t('manager.qrPrintDesc')}</p>
                             
                             <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl justify-center shadow-stone-950/50 shadow-inner">
                                 <img 
                                     src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=stampa-stamp:${managerBusinessId}`} 
                                     alt="Stamp QR Code" 
                                     className="w-48 h-48 border border-stone-200 p-2 bg-white rounded-xl shadow-stone-950/30 shadow-md"
                                 />
                                 <span className="text-[10px] font-mono text-black font-bold tracking-wider">stampa-stamp:{managerBusinessId}</span>
                             </div>
                             
                             <button
                                 onClick={() => {
                                     const win = window.open();
                                     win.document.write(`
                                         <html>
                                             <head>
                                                 <title>הדפסת קוד QR - Stampa</title>
                                                 <style>
                                                     body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                                                     .container { border: 2px solid #000; padding: 40px; border-radius: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                                                     h1 { margin-bottom: 5px; font-size: 28px; }
                                                     p { font-size: 14px; color: #555; margin-bottom: 20px; }
                                                     img { width: 300px; height: 300px; }
                                                 </style>
                                             </head>
                                             <body>
                                                 <div class="container">
                                                     <h1>${i18n.language === 'he' ? 'סרוק לקבלת ניקוב! ☕' : 'Scan for Stamp! ☕'}</h1>
                                                     <p>${i18n.language === 'he' ? 'הצג את המסך למצלמה בתוך כרטיס המועדון' : 'Show this screen to the camera inside customer club card'}</p>
                                                     <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${managerBusinessId}" />
                                                 </div>
                                                 <script>
                                                     window.onload = function() {
                                                         window.print();
                                                     }
                                                 </script>
                                             </body>
                                         </html>
                                     `);
                                     win.document.close();
                                 }}
                                 className="w-full bg-stone-800 hover:bg-stone-700 text-[#f5f0eb] font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                             >
                                 <span>🖨️</span>
                                 <span>{t('manager.qrPrintButton')}</span>
                             </button>
                         </div>
                    </section>

                    {/* Promotions Management */}
                    <section className="bg-[#1f1b16] border border-amber-900/30 p-6 rounded-3xl shadow-stone-950/50 shadow-xl space-y-6">
                        <h3 className="text-lg font-black text-[#c59b27] border-b border-amber-900/30 pb-3 flex items-center gap-2">
                            <span>🏷️</span>
                            <span>{t('promotions.title')}</span>
                        </h3>

                        {/* Add Promotion Form */}
                        <form onSubmit={handleAddPromotion} className="space-y-4 bg-[#12100e]/50 p-4 rounded-2xl border border-amber-900/30">
                            <span className="text-xs font-bold tracking-wide text-[#f5f0eb]/80 block mb-2">{t('promotions.addNew')}</span>
                            <div>
                                <label className="block text-[10px] font-bold text-[#f5f0eb]/60 mb-1">{t('promotions.promoTitleLabel')}</label>
                                <input 
                                    type="text" 
                                    value={promoTitle}
                                    onChange={(e) => setPromoTitle(e.target.value)}
                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-2.5 text-sm text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none"
                                    placeholder={t('promotions.promoTitlePlaceholder')}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#f5f0eb]/60 mb-1">{t('promotions.promoDescLabel')}</label>
                                <textarea 
                                    value={promoDesc}
                                    onChange={(e) => setPromoDesc(e.target.value)}
                                    className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-2.5 text-sm text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none h-16 resize-none"
                                    placeholder={t('promotions.promoDescPlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#f5f0eb]/60 mb-1">{i18n.language === 'he' ? 'תמונת המבצע' : 'Promotion Image'}</label>
                                <div className="flex items-center gap-3">
                                    {promoImgUrl ? (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-900/30 bg-[#12100e] relative group flex-shrink-0">
                                            <img src={promoImgUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setPromoImgUrl('')}
                                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-500 font-bold transition-all"
                                            >
                                                {i18n.language === 'he' ? 'הסר' : 'Remove'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl border border-dashed border-amber-900/30 flex items-center justify-center text-lg text-stone-700 flex-shrink-0">
                                            🖼️
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="cursor-pointer bg-[#12100e] hover:bg-stone-900 border border-amber-900/30 hover:border-amber-900/30 text-[#f5f0eb] rounded-xl px-3 py-2 text-xs font-semibold transition-all text-center inline-block">
                                            {isUploadingPromoImg ? t('manager.uploading') : (i18n.language === 'he' ? 'בחר תמונת מבצע 📸' : 'Select Promo Image 📸')}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePromoImageUpload}
                                                className="hidden"
                                                disabled={isUploadingPromoImg}
                                            />
                                        </label>
                                        
                                        {promoImgUploadError && (
                                            <span className="text-[10px] text-red-500 font-bold">{promoImgUploadError}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 py-1 select-none">
                                <input
                                    type="checkbox"
                                    id="sendPushOnCreate"
                                    checked={sendPushOnCreate}
                                    onChange={(e) => setSendPushOnCreate(e.target.checked)}
                                    className="w-4 h-4 rounded border-amber-900/30 text-amber-600 focus:ring-amber-500 bg-[#12100e] cursor-pointer"
                                />
                                <label htmlFor="sendPushOnCreate" className="text-xs text-[#f5f0eb]/60 font-semibold cursor-pointer">
                                    {t('promotions.pushSentLabel')}
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={promoLoading}
                                className="w-full bg-amber-600 hover:bg-[#c59b27] text-stone-950 font-bold py-2.5 rounded-xl text-sm transition-all duration-300 active:scale-95 disabled:opacity-50"
                            >
                                {promoLoading ? t('login.loading') : t('promotions.addButton')}
                            </button>
                        </form>

                        {/* List of Manager's Promotions */}
                        <div className="space-y-4">
                            <span className="text-xs font-bold tracking-wide text-[#f5f0eb]/80 block">{t('promotions.activeTitle')}</span>
                            {managerPromos.length === 0 ? (
                                <p className="text-xs text-[#f5f0eb]/40 text-center py-4">{t('promotions.noPromos')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {managerPromos.map((promo) => (
                                        <div key={promo.id} className="bg-[#12100e]/80 border border-amber-900/30 p-4 rounded-2xl space-y-4">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="text-sm font-bold tracking-wide text-[#f5f0eb]">{promo.title}</h4>
                                                    <p className="text-xs text-[#f5f0eb]/60 mt-1">{promo.description}</p>
                                                    {promo.image_url && (
                                                        <a href={promo.image_url} target="_blank" rel="noreferrer" className="text-[10px] text-[#c59b27] underline mt-1 block">
                                                            {i18n.language === 'he' ? 'צפה בתמונה' : 'View Image'}
                                                        </a>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${promo.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-stone-800 text-[#f5f0eb]/40'}`}>
                                                    {promo.is_active ? (i18n.language === 'he' ? 'פעיל' : 'Active') : (i18n.language === 'he' ? 'כבוי' : 'Inactive')}
                                                </span>
                                            </div>

                                            <div className="flex gap-2 justify-between items-center pt-2 border-t border-amber-900/30">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleTogglePromoStatus(promo.id, promo.is_active)}
                                                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${promo.is_active ? 'border-amber-900/30 text-[#f5f0eb]/60 hover:text-[#f5f0eb]' : 'border-green-800/30 text-green-500 hover:bg-green-500/10'}`}
                                                    >
                                                        {promo.is_active ? (i18n.language === 'he' ? 'כיבוי' : 'Deactivate') : (i18n.language === 'he' ? 'הפעלה' : 'Activate')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePromo(promo.id)}
                                                        className="text-xs px-3 py-1.5 rounded-lg font-bold border border-red-900/30 text-red-500 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        {t('promotions.deleteButton')}
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleSendPushBroadcast(promo)}
                                                    disabled={pushLoading[promo.id]}
                                                    className="text-xs bg-amber-600 hover:bg-[#c59b27] disabled:opacity-50 text-stone-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all"
                                                >
                                                    <span>📣</span>
                                                    <span>{pushLoading[promo.id] ? (i18n.language === 'he' ? 'משדר פוש...' : 'Broadcasting...') : (i18n.language === 'he' ? 'שלח פוש ללקוחות' : 'Send Push to Customers')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                        </>
                    )}
                </main>
            </div>
        );
    }

    // Render Client Mode View
    const regionLocalization = {
        'Jordan Valley': 'בקעת הירדן 🌾',
        'Sharon': 'השרון 🌳',
        'Poleg': 'פולג 🌊'
    };
    const displayRegion = regionLocalization[currentRegion] || currentRegion || 'בחר סניף 📍';

    return (
        <div className="min-h-screen bg-[#12100e] text-[#f5f0eb] font-inter pb-12" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
            <PushNotificationManager userId={userId} />

            {/* Top Navigation */}
            <header className="sticky top-0 bg-[#12100e]/95 backdrop-blur-md border-b border-amber-900/30 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                    <span className="text-sm font-black text-[#c59b27]">Stampa</span>
                </div>

                <div className="flex items-center gap-3.5">
                    <span className="text-xs font-bold text-[#f5f0eb]/80 flex items-center gap-1.5">
                        <span>{i18n.language === 'he' ? `שלום, ${userName.split(' ')[0]}` : `Hello, ${userName.split(' ')[0]}`}</span>
                        <span>☕</span>
                    </span>
                    
                    {isManagerUser && (
                        <button
                            onClick={() => setIsManagerModeActive(true)}
                            className="text-[11px] font-extrabold bg-gradient-to-r from-amber-700 to-[#b45309] border border-[#c59b27]/25 text-[#f5f0eb] rounded-full px-3.5 py-2 hover:from-amber-500 hover:to-amber-600 transition-all shadow-stone-950/30 shadow-md active:scale-95 flex items-center gap-1"
                        >
                            <span>🛠️</span>
                            <span>{i18n.language === 'he' ? 'ניהול' : 'Manage'}</span>
                        </button>
                    )}
                    
                    <button 
                        onClick={handleLogout}
                        className="text-xs font-bold text-[#f5f0eb]/60 hover:text-red-400 border border-amber-900/30 hover:border-red-900/35 bg-[#1f1b16] hover:bg-red-950/20 px-3.5 py-2 rounded-full transition-all active:scale-95 flex items-center gap-1.5 shadow-stone-950/30 shadow-md"
                        title={t('customer.logout')}
                    >
                        <span>{t('customer.logout')}</span>
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 mt-6 space-y-6">


                {/* Apple Wallet Card Stack */}
                <div className="space-y-4">
                    {stores.map((biz, idx) => {
                        const isExpanded = expandedCardId === biz.id;
                        const bizCoffeeCount = coffeeCounts[biz.id] || 0;
                        const bizPromos = promosMap[biz.id] || [];
                        const bizIsSubscribed = subscriptionMap[biz.id] || false;
            
                         let bizLogo = '🏷️';
                         if (biz.has_stamps) {
                             bizLogo = '☕';
                         } else if (biz.name.includes('משתלה') || biz.name.includes('גן')) {
                             bizLogo = '🌿';
                         }

                         let baseColor = biz.brand_color || '#3a271d';
                         if (baseColor && !baseColor.startsWith('#')) {
                             baseColor = '#' + baseColor;
                         }
                         if (baseColor && baseColor.length === 4) {
                             baseColor = '#' + baseColor[1] + baseColor[1] + baseColor[2] + baseColor[2] + baseColor[3] + baseColor[3];
                         }

                         const cardGradient = isExpanded 
                            ? `linear-gradient(135deg, ${baseColor} 0%, #19100a 100%)` 
                            : `linear-gradient(135deg, ${baseColor}cc 0%, #110a06 100%)`;

                         const hasPagerOption = biz.enable_virtual_pager;
                         const hasStampsOption = biz.has_stamps;
                         const defaultTab = (activePager && activePager.business_id === biz.id)
                             ? 'pager'
                             : (hasStampsOption ? 'stamps' : (hasPagerOption ? 'pager' : 'promos'));
                         const activeTab = activeCardTabs[biz.id] || defaultTab;
                         const setActiveTab = (tab) => {
                             setActiveCardTabs(prev => ({ ...prev, [biz.id]: tab }));
                         };

                          return (
                              <div 
                                  key={biz.id}
                                  onClick={() => {
                                      if (!isExpanded) {
                                          setExpandedCardId(biz.id);
                                      }
                                  }}
                                  className={`transition-all duration-500 ease-out rounded-[24px] overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative border-t border-[#ffd700]/20 ${
                                       isExpanded 
                                           ? 'z-50 my-6 scale-[1.02] border border-[#c59b27]/30 shadow-[0_20px_40px_rgba(0,0,0,0.8)]' 
                                           : '-mt-6 first:mt-0 hover:-translate-y-2 cursor-pointer opacity-90 hover:opacity-100'
                                   }`}
                                  style={{ 
                                      backgroundImage: cardGradient,
                                      zIndex: isExpanded ? 50 : 10 + idx,
                                      position: 'relative'
                                  }}
                              >
                                  {/* Card Header (Visible in Collapsed State) */}
                                  <div className="p-8 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-stone-950/50 shadow-inner overflow-hidden">
                                              {biz.logo_url ? (
                                                  <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                                              ) : (
                                                  bizLogo
                                              )}
                                          </div>
                                          {(() => {
                                              const targetLang = i18n.language || 'he';
                                              const srcLang = biz.source_language || 'he';
                                              const cacheKey = `${biz.id}_${targetLang}`;
                                              const translated = translationsMap[cacheKey];
                                              const isTranslated = srcLang !== targetLang && translated;
                                              
                                              const displayName = isTranslated && translated.name ? translated.name : biz.name;
                                              const displayDesc = isTranslated && translated.description ? translated.description : biz.description;

                                              return (
                                                  <div>
                                                      <h3 className="text-[20px] font-bold tracking-wide text-[#f5f0eb] flex items-center gap-1.5 flex-wrap">
                                                          <span>{displayName}</span>
                                                          {isTranslated && (
                                                              <span className="text-[7.5px] font-black text-[#c59b27]/80 bg-[#c59b27]/5 px-1.5 py-0.5 rounded border border-[#c59b27]/10 tracking-wide uppercase">
                                                                  {targetLang === 'he' ? '✨ תורגם אוטומטית' : '✨ Translated automatically'}
                                                              </span>
                                                          )}
                                                      </h3>
                                                      {displayDesc && (
                                                           <p className="text-[12px] text-[#f5f0eb]/80 mt-0.5 line-clamp-1">{displayDesc}</p>
                                                      )}
                                                  </div>
                                              );
                                          })()}
                                      </div>

                                      {/* Stack Badge */}
                                      <div className="flex items-center gap-2">
                                          {isExpanded ? (
                                              <button 
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      setExpandedCardId(null);
                                                  }}
                                                  className="text-[#f5f0eb]/60 hover:text-[#f5f0eb] text-xs bg-[#12100e]/80 border border-amber-900/30 rounded-full w-6 h-6 flex items-center justify-center"
                                              >
                                                  ✕
                                              </button>
                                          ) : (
                                              <span className="text-[10px] font-extrabold text-[#1a100b] bg-gradient-to-r from-[#e5c17d] via-[#d9a752] to-[#c59b27] border border-[#f3dbad]/30 px-3 py-1 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] tracking-wide">
                                                  {biz.has_stamps ? `${bizCoffeeCount}/${biz.stamp_limit || 10} ${i18n.language === 'he' ? 'כוסות' : 'Stamps'}` : `${bizPromos.length} ${i18n.language === 'he' ? 'מבצעים' : 'Promotions'}`}
                                              </span>
                                          )}
                                      </div>
                                  </div>

                                  {/* Expanded Card Body */}
                                  {isExpanded && (
                                      <div className="pb-6 animate-fadeIn">
                                          <div className="px-8 pt-4 space-y-4">
                                              
                                              {/* Segmented Control (Tabs) */}
                                              {biz.has_stamps && (
                                                  <div className="flex bg-[#12100e]/60 p-1.5 rounded-2xl border border-amber-900/20 max-w-[260px] mx-auto mb-2">
                                                      <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); setActiveTab('stamps'); }}
                                                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 ${
                                                              activeTab === 'stamps' 
                                                                  ? 'bg-gradient-to-r from-[#e5c17d] to-[#c59b27] text-black shadow-md' 
                                                                  : 'text-[#f5f0eb]/60 hover:text-[#f5f0eb]'
                                                          }`}
                                                      >
                                                          <span>☕</span>
                                                          <span>{i18n.language === 'he' ? 'כרטיסייה' : 'Stamp Card'}</span>
                                                      </button>
                                                      <button
                                                          type="button"
                                                          onClick={(e) => { e.stopPropagation(); setActiveTab('promos'); }}
                                                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-300 ${
                                                              activeTab === 'promos' 
                                                                  ? 'bg-gradient-to-r from-[#e5c17d] to-[#c59b27] text-black shadow-md' 
                                                                  : 'text-[#f5f0eb]/60 hover:text-[#f5f0eb]'
                                                          }`}
                                                      >
                                                          <span>🏷️</span>
                                                          <span>{i18n.language === 'he' ? `מבצעים (${bizPromos.length})` : `Promos (${bizPromos.length})`}</span>
                                                      </button>
                                                  </div>
                                              )}

                                              {/* Tab content rendering */}
                                              {activeTab === 'pager' && (
                                                  <div className="bg-[#22201e]/80 rounded-3xl p-6 border border-[#c59b27]/25 space-y-6 text-center">
                                                      {activePager && activePager.business_id === biz.id ? (
                                                          <div className="space-y-6">
                                                              <div className="w-20 h-20 bg-amber-500/10 border border-[#c59b27]/30 rounded-full mx-auto flex items-center justify-center animate-pulse">
                                                                  <span className="text-3xl">📟</span>
                                                              </div>
                                                              <div>
                                                                  <h4 className="text-lg font-black text-[#f5f0eb]">
                                                                      {i18n.language === 'he' ? `הזמנה #${activePager.pager_number} בהכנה...` : `Order #${activePager.pager_number} in prep...`}
                                                                  </h4>
                                                                  <p className="text-xs text-[#f5f0eb]/60 mt-1.5">
                                                                      {i18n.language === 'he' ? 'נשלח לך התראה ברגע שההזמנה תהיה מוכנה!' : 'We\'ll notify you when your order is ready!'}
                                                                  </p>
                                                              </div>

                                                              <div className="flex flex-col gap-2.5">
                                                                  <button 
                                                                      onClick={async () => {
                                                                          if (typeof window !== 'undefined' && 'Notification' in window) {
                                                                              const perm = await Notification.requestPermission();
                                                                              if (perm === 'granted') {
                                                                                  showToast('התראות דפדפן פעילות בהצלחה!');
                                                                              }
                                                                          }
                                                                      }}
                                                                      className="w-full bg-[#12100e] border border-emerald-500/30 text-emerald-400 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                                                                  >
                                                                      <span>🔔</span>
                                                                      <span>
                                                                          {typeof window !== 'undefined' && Notification.permission === 'granted'
                                                                              ? (i18n.language === 'he' ? 'התראות דפדפן פעילות' : 'Browser alerts active')
                                                                              : (i18n.language === 'he' ? 'שלח לי התראה כשהקפה מוכן' : 'Send me alert when ready')
                                                                          }
                                                                      </span>
                                                                  </button>

                                                                  <button 
                                                                      onClick={async () => {
                                                                          try {
                                                                              await supabase
                                                                                  .from('pagers')
                                                                                  .update({ status: 'cancelled' })
                                                                                  .eq('id', activePager.id);
                                                                              localStorage.removeItem('stampa_active_pager_id');
                                                                              setActivePager(null);
                                                                              showToast('הביפר בוטל.');
                                                                          } catch (err) {
                                                                              console.error(err);
                                                                          }
                                                                      }}
                                                                      className="w-full bg-red-950/20 border border-red-500/20 text-red-400 py-3 rounded-xl text-xs hover:bg-red-950/40 transition-all duration-300"
                                                                  >
                                                                      {i18n.language === 'he' ? 'ביטול ביפר' : 'Cancel Pager'}
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      ) : (
                                                          <div className="space-y-6 text-right" dir="rtl">
                                                              <div className="text-center">
                                                                  <span className="text-5xl">📟</span>
                                                                  <h4 className="text-md font-black text-[#f5f0eb] mt-3">
                                                                      {i18n.language === 'he' ? 'ביפר דיגיטלי - לא צריך לעמוד בתור!' : 'Digital Pager - No Queue!'}
                                                                  </h4>
                                                                  <p className="text-[11px] text-[#f5f0eb]/60 mt-1 max-w-[240px] mx-auto leading-relaxed text-center">
                                                                      {i18n.language === 'he'
                                                                          ? 'הפעל ביפר דיגיטלי להזמנה הנוכחית שלך. נשלח לך התראה ישר לטלפון ברגע שההזמנה מוכנה.'
                                                                          : 'Activate a digital pager for your order. We\'ll send an alert directly to your phone when ready.'}
                                                                  </p>
                                                              </div>

                                                              <div className="space-y-4">
                                                                  <div>
                                                                      <label className="block text-[10px] font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">שם הלקוח (אופציונלי):</label>
                                                                      <input 
                                                                          type="text" 
                                                                          defaultValue={userName || localStorage.getItem('stampa_customer_name') || ''} 
                                                                          onChange={(e) => localStorage.setItem('stampa_customer_name', e.target.value)}
                                                                          placeholder="למשל: רן"
                                                                          className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-2.5 text-xs text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none"
                                                                      />
                                                                  </div>

                                                                  <div>
                                                                      <label className="block text-[10px] font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">מספר טלפון להתראת SMS (חובה):</label>
                                                                      <input 
                                                                          type="tel" 
                                                                          defaultValue={userPhone || localStorage.getItem('stampa_customer_phone') || ''} 
                                                                          onChange={(e) => localStorage.setItem('stampa_customer_phone', e.target.value)}
                                                                          placeholder="050-1234567"
                                                                          className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-2.5 text-xs text-left text-[#f5f0eb] focus:border-[#c59b27] focus:outline-none font-mono"
                                                                      />
                                                                  </div>

                                                                  <button 
                                                                      onClick={() => handleCreatePager(biz.id)}
                                                                      className="w-full bg-gradient-to-r from-[#e5c17d] to-[#c59b27] text-black font-black py-4 rounded-xl text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300"
                                                                  >
                                                                      {i18n.language === 'he' ? '📟 הפעל ביפר דיגיטלי' : '📟 Activate Digital Pager'}
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </div>
                                              )}

                                              {/* Tab content rendering */}
                                              {activeTab === 'stamps' ? (
                                                  biz.has_stamps ? (
                                                      <div 
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              setActiveScanBizId(biz.id);
                                                              setIsScanning(true);
                                                              setScanError('');
                                                          }}
                                                          className="bg-[#22201e]/80 rounded-3xl p-5 border border-[#c59b27]/25 hover:border-[#c59b27]/40 transition-all duration-300 shadow-stone-950/50 shadow-inner space-y-4 cursor-pointer active:scale-[0.99] group"
                                                      >
                                                          <div className="text-center py-1">
                                                              <p className="text-xs font-black text-[#c59b27] group-hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                                                                  <span>📸</span>
                                                                  <span>{t('customer.scanPrompt')}</span>
                                                              </p>
                                                              <p className="text-[8.5px] text-[#f5f0eb]/40 font-bold mt-1 uppercase tracking-wider">
                                                                  {i18n.language === 'he' ? 'כרטיסיית קפה' : 'Coffee Stamp Card'} ({bizCoffeeCount}/{biz.stamp_limit || 10} {i18n.language === 'he' ? 'כוסות' : 'Stamps'})
                                                              </p>
                                                          </div>

                                                          {(() => {
                                                              const limit = biz.stamp_limit || 10;
                                                              const gridCols = limit === 8 ? 'grid-cols-4' : limit === 6 ? 'grid-cols-3' : 'grid-cols-5';
                                                              return (
                                                                  <div className={`grid ${gridCols} gap-4`} dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                                                                      {Array.from({ length: limit }).map((_, idx) => {
                                                                          const isStamped = idx < bizCoffeeCount;
                                                                          const isLast = idx === limit - 1;
                                                                          let stampIconChar = '☕';
                                                                          if (biz.stamp_icon === 'star') {
                                                                              stampIconChar = '⭐';
                                                                          } else if (biz.stamp_icon === 'heart') {
                                                                              stampIconChar = '❤️';
                                                                          } else if (biz.stamp_icon === 'leaf') {
                                                                              stampIconChar = '🌿';
                                                                          }

                                                                          if (isLast) {
                                                                              return (
                                                                                  <div 
                                                                                      key={idx}
                                                                                      className={`aspect-square rounded-full border-2 flex flex-col items-center justify-center transition-all duration-500 relative ${
                                                                                          isStamped 
                                                                                              ? 'bg-gradient-to-tr from-amber-500/30 to-amber-600/40 border-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-105' 
                                                                                              : 'bg-black/60 border-dashed border-[#c59b27]/30 text-[#c59b27]/60 shadow-[0_0_4px_rgba(197,155,39,0.1)]'
                                                                                      }`}
                                                                                  >
                                                                                      <span className={`text-2xl ${isStamped ? 'opacity-100 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] text-[#fbbf24]' : 'opacity-60 text-[#c59b27]/60'}`}>🎁</span>
                                                                                      <span className="text-[7px] font-black absolute bottom-0.5 text-[#c59b27]/80">{limit}</span>
                                                                                  </div>
                                                                              );
                                                                          }

                                                                          return (
                                                                              <div 
                                                                                  key={idx}
                                                                                  className={`aspect-square rounded-full border flex flex-col items-center justify-center transition-all duration-500 ${
                                                                                      isStamped 
                                                                                          ? 'bg-gradient-to-tr from-amber-600/30 to-amber-500/40 border-2 border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-105' 
                                                                                          : 'bg-black/60 border-dashed border-[#c59b27]/30 text-[#c59b27]/40'
                                                                                  }`}
                                                                              >
                                                                                  <span className={`text-xl ${isStamped ? 'opacity-100 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] text-[#fbbf24]' : 'opacity-35 text-[#c59b27]/40'}`}>{stampIconChar}</span>
                                                                                  <span className={`text-[7px] font-bold mt-0.5 ${isStamped ? 'text-[#fbbf24]' : 'text-[#c59b27]/40'}`}>{idx + 1}</span>
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              );
                                                          })()}
                                                      </div>
                                                  ) : (
                                                      <div className="bg-[#12100e]/40 border border-amber-900/30 rounded-2xl p-6 text-center text-[#f5f0eb]/40">
                                                          <span className="text-2xl block mb-2">☕</span>
                                                          <p className="text-xs">{i18n.language === 'he' ? 'אין כרטיסיית חותמות לעסק זה' : 'No stamp card available'}</p>
                                                      </div>
                                                  )
                                              ) : (
                                                  <div className="space-y-3">
                                                      {bizPromos.length === 0 ? (
                                                           <div className="bg-[#12100e]/40 border border-amber-900/10 rounded-2xl p-8 text-center text-[#f5f0eb]/40 flex flex-col items-center justify-center gap-2">
                                                               <span className="text-4xl">🐶</span>
                                                               <h5 className="text-xs font-bold text-[#f5f0eb]/70 mt-2">
                                                                   {i18n.language === 'he' ? 'אין עדיין מבצעים חמים...' : 'No promotions yet...'}
                                                               </h5>
                                                               <p className="text-[10px] text-[#f5f0eb]/40 leading-relaxed max-w-[200px] mx-auto">
                                                                   {i18n.language === 'he' 
                                                                       ? 'העסק עדיין לא פרסם מבצעים חדשים. שווה להתעדכן בקרוב!' 
                                                                       : 'The shop hasn\'t posted new offers yet. Check back soon!'}
                                                               </p>
                                                           </div>
                                                       ) : (
                                                          <div className="space-y-3">
                                                              {bizPromos.map((promo) => {
                                                                  const targetLang = i18n.language || 'he';
                                                                  const srcLang = biz.source_language || 'he';
                                                                  const cacheKey = `${biz.id}_${targetLang}`;
                                                                  const translated = translationsMap[cacheKey];
                                                                  const isTranslatedPromo = srcLang !== targetLang && translated && translated.promos && translated.promos[promo.id];
                                                                  
                                                                  const promoTitle = isTranslatedPromo && translated.promos[promo.id].title ? translated.promos[promo.id].title : promo.title;
                                                                  const promoDesc = isTranslatedPromo && translated.promos[promo.id].description ? translated.promos[promo.id].description : promo.description;

                                                                  return (
                                                                      <div key={promo.id} className="bg-[#12100e]/60 border border-amber-900/30 rounded-2xl p-4 flex gap-3 shadow-stone-950/50 shadow-inner">
                                                                          <div className="w-12 h-12 bg-[#1f1b16] border border-amber-900/30 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl shadow-stone-950/30 shadow-md overflow-hidden">
                                                                              {promo.image_url ? (
                                                                                  <img src={promo.image_url} alt={promoTitle} className="w-full h-full object-cover" />
                                                                              ) : (
                                                                                  '🏷️'
                                                                              )}
                                                                          </div>
                                                                          <div className="flex-1 flex flex-col justify-between">
                                                                              <div>
                                                                                  <h6 className="text-xs font-bold tracking-wide text-[#f5f0eb] flex items-center gap-1.5 flex-wrap">
                                                                                      <span>{promoTitle}</span>
                                                                                      {isTranslatedPromo && (
                                                                                          <span className="text-[6.5px] font-black text-[#c59b27]/80 bg-[#c59b27]/5 px-1 py-0.5 rounded border border-[#c59b27]/10 tracking-wide uppercase">
                                                                                              {targetLang === 'he' ? '✨ תורגם' : '✨ Auto'}
                                                                                          </span>
                                                                                      )}
                                                                                  </h6>
                                                                                  {promoDesc && (
                                                                                      <p className="text-[10px] text-[#f5f0eb]/60 mt-0.5 line-clamp-2">{promoDesc}</p>
                                                                                  )}
                                                                              </div>
                                                                              {promo.valid_to && (
                                                                                  <span className="text-[8px] font-bold text-[#c59b27]/80 bg-[#c59b27]/10 px-2 py-0.5 rounded self-start mt-2 border border-[#c59b27]/10">
                                                                                      {i18n.language === 'he' ? 'בתוקף עד:' : 'Valid until:'} {new Date(promo.valid_to).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US')}
                                                                                  </span>
                                                                              )}
                                                                          </div>
                                                                      </div>
                                                                  );
                                                              })}
                                                          </div>
                                                      )}
                                                  </div>
                                              )}

                                              {/* Compact Notifications Opt-In Panel */}
                                              <div className="bg-[#12100e]/20 border border-amber-900/10 rounded-xl p-2.5 flex items-center justify-between shadow-inner mt-4">
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-xs">🔔</span>
                                                      <span className="text-[10px] font-medium text-[#f5f0eb]/80">
                                                          {i18n.language === 'he' ? 'קבלת התראות שיווקיות ומבצעים לעסק זה' : 'Receive promotions & push updates'}
                                                      </span>
                                                  </div>
                                                  <button 
                                                      type="button"
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleToggleSubscriptionForBiz(biz.id, bizIsSubscribed);
                                                      }}
                                                      className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${bizIsSubscribed ? 'bg-[#c59b27]' : 'bg-stone-700'}`}
                                                  >
                                                      <div className={`bg-black w-3 h-3 rounded-full shadow-stone-950/30 shadow-md transform transition-transform duration-300 ${bizIsSubscribed ? '-translate-x-4' : 'translate-x-0'}`} />
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>

                  {/* Floating Action Button for Scan (Modern Minimalist SVG Icon) */}
                  <button 
                      onClick={() => {
                          setActiveScanBizId('PORTAL_SCAN_ANY');
                          setIsScanning(true);
                          setScanError('');
                      }}
                      className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-[#e5c17d] via-[#d9a752] to-[#c59b27] text-[#1a100b] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-[#f3dbad]/30 hover:scale-110 active:scale-95 transition-all duration-300"
                  >
                      <svg className="w-6 h-6 text-[#1a100b]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  </button>
              </main>

              {/* Create Business Modal */}
              {isCreateBizModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md px-6 animate-fadeIn">
                      <div className="bg-[#1f1b16] border border-amber-900/30 rounded-3xl p-6 max-w-md w-full shadow-stone-950/60 shadow-2xl relative text-right" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
                          <button 
                              type="button"
                              onClick={() => setIsCreateBizModalOpen(false)}
                              className="absolute top-4 left-4 text-[#f5f0eb]/60 hover:text-[#f5f0eb] text-xs bg-[#12100e]/80 border border-amber-900/30 rounded-full w-6 h-6 flex items-center justify-center"
                          >
                              ✕
                          </button>
                          <h3 className="text-lg font-black mb-1 text-[#f5f0eb]">
                              {i18n.language === 'he' ? '➕ הוספת עסק חדש למערכת' : '➕ Register New Business'}
                          </h3>
                          <p className="text-[10px] text-[#f5f0eb]/60 mb-6 font-bold">
                              {i18n.language === 'he' ? 'בעל עסק? מלא את הפרטים הבאים כדי להקים מועדון לקוחות עבור העסק שלך' : 'Business owner? Fill details below to set up a loyalty club for your business'}
                          </p>

                          {createBizError && (
                              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 font-bold">
                                  ⚠️ {createBizError}
                              </div>
                          )}

                          <form className="space-y-4" onSubmit={handleCreateBusiness}>
                              <div>
                                  <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">
                                      {i18n.language === 'he' ? 'שם העסק *' : 'Business Name *'}
                                  </label>
                                  <input 
                                      type="text" 
                                      required 
                                      value={newBizName} 
                                      onChange={(e) => setNewBizName(e.target.value)} 
                                      placeholder={i18n.language === 'he' ? 'למשל: קפה פינת החמד' : 'e.g. Sunny Coffee Shop'}
                                      className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] text-xs focus:border-[#c59b27] focus:outline-none" 
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">
                                      {i18n.language === 'he' ? 'שם הבעלים *' : 'Owner Name *'}
                                  </label>
                                  <input 
                                      type="text" 
                                      required 
                                      value={newBizOwner} 
                                      onChange={(e) => setNewBizOwner(e.target.value)} 
                                      placeholder={i18n.language === 'he' ? 'שמך המלא' : 'Your full name'}
                                      className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] text-xs focus:border-[#c59b27] focus:outline-none" 
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">
                                      {i18n.language === 'he' ? 'טלפון בעלים (מאומת כעת)' : 'Verified Owner Phone'}
                                  </label>
                                  <input 
                                      type="text" 
                                      disabled 
                                      value={userPhone} 
                                      className="w-full bg-stone-900 border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb]/60 text-xs cursor-not-allowed focus:outline-none" 
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">
                                      {i18n.language === 'he' ? 'קישור למיקום / כתובת בגוגל מאפס *' : 'Google Maps Location Link *'}
                                  </label>
                                  <input 
                                      type="url" 
                                      required 
                                      value={newBizLink} 
                                      onChange={(e) => setNewBizLink(e.target.value)} 
                                      placeholder="https://maps.google.com/..."
                                      className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] text-xs focus:border-[#c59b27] focus:outline-none" 
                                  />
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-[#f5f0eb]/60 mb-1.5 mr-1">
                                      {i18n.language === 'he' ? 'סוג כרטיס המועדון' : 'Loyalty Club Type'}
                                  </label>
                                  <select 
                                      value={newBizClubType} 
                                      onChange={(e) => setNewBizClubType(e.target.value)}
                                      className="w-full bg-[#12100e] border border-amber-900/30 rounded-xl px-4 py-3 text-[#f5f0eb] text-xs focus:border-[#c59b27] focus:outline-none"
                                  >
                                      <option value="☕ כרטיסיית ניקובים (עגלת קפה, מאפייה)">
                                          {i18n.language === 'he' ? '☕ כרטיסיית ניקובים (עגלת קפה, מאפייה)' : '☕ Stamp Card (Cafe, Bakery)'}
                                      </option>
                                      <option value="🎁 כרטיסיית הטבות (הנחות ונקודות)">
                                          {i18n.language === 'he' ? '🎁 כרטיסיית הטבות (הנחות ונקודות)' : '🎁 Rewards Card (Discounts & Points)'}
                                      </option>
                                  </select>
                              </div>

                              <button 
                                  type="submit" 
                                  disabled={createBizLoading}
                                  className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-600 hover:to-amber-700 text-black text-xs font-black py-4 rounded-xl shadow-stone-950/40 shadow-lg transition-all duration-300 disabled:opacity-50 mt-4 active:scale-[0.98]"
                              >
                                  {createBizLoading 
                                      ? (i18n.language === 'he' ? 'מקים עסק מועדון...' : 'Creating loyalty club...') 
                                      : (i18n.language === 'he' ? 'צור והפעל עסק חדש! 🚀' : 'Create & Activate Business! 🚀')}
                              </button>
                          </form>
                      </div>
                  </div>
              )}

              {/* Barcode Modal */}
              {showBarcodeModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md px-6 animate-fadeIn">
                      <div className="bg-[#1f1b16] border border-amber-900/30 rounded-3xl p-8 max-w-sm w-full shadow-stone-950/60 shadow-2xl relative text-center">
                          <h3 className="text-lg font-black mb-6">{t('customer.barcodeTitle')}</h3>
                          <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-stone-950/50 shadow-inner">
                              <div className="w-full h-16 flex justify-between gap-1 items-center px-2">
                                  {[2,4,1,3,2,4,1,2,3,1,4,2,1,3,2,1,4,2,3,1,2,4,1].map((weight, idx) => (
                                      <div key={idx} className="bg-black h-12" style={{ width: 2 * weight + 'px' }} />
                                  ))}
                              </div>
                              <span className="text-xs font-mono text-black font-bold tracking-widest mt-3">{userPhone.replace('+', '')}</span>
                          </div>
                          
                          <p className="text-xs text-[#f5f0eb]/60 mb-6">{t('customer.barcodeSubtitle')}</p>
                          
                          <button 
                              onClick={() => setShowBarcodeModal(false)}
                              className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-400 hover:to-[#b45309] text-black font-black py-4 rounded-xl shadow-stone-950/40 shadow-lg transition-all duration-300 transform active:scale-95"
                          >
                              {t('customer.close')}
                          </button>
                      </div>
                  </div>
              )}

              {/* Join Loyalty Club Confirmation Modal */}
              {joinConfirmBiz && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md px-6 animate-fadeIn">
                      <div className="bg-[#1f1b16] border border-amber-900/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
                          <span className="text-4xl block mb-4">🎁</span>
                          <h3 className="text-lg font-black mb-2 text-[#f5f0eb]">
                              {i18n.language === 'he' ? `הצטרפות למועדון: ${joinConfirmBiz.name}` : `Join: ${joinConfirmBiz.name}`}
                          </h3>
                          <p className="text-xs text-[#f5f0eb]/70 mb-6 leading-relaxed">
                              {i18n.language === 'he' 
                                  ? 'הצטרף למועדון הלקוחות כעת וקבל 2 חותמות בונוס במתנה ישירות לכרטיסייה החדשה שלך! ☕✨' 
                                  : 'Join the loyalty club now and get 2 bonus stamps credited instantly to your wallet! ☕✨'}
                          </p>
                          
                          <div className="space-y-2">
                              <button 
                                  onClick={async () => {
                                      try {
                                          const bizId = joinConfirmBiz.id;
                                          setJoinConfirmBiz(null);
                                          
                                          // Add subscription
                                          const { error: subErr } = await supabase
                                              .from('store_subscriptions')
                                              .upsert({
                                                  customer_phone: userPhone,
                                                  store_id: bizId,
                                                  is_marketing_allowed: true
                                              }, { onConflict: 'customer_phone,store_id' });

                                          if (subErr) throw subErr;

                                          // Create customer with 2 bonus stamps!
                                          let formatted = userPhone;
                                          if (formatted.startsWith('0')) {
                                              formatted = '+972' + formatted.substring(1);
                                          } else if (!formatted.startsWith('+')) {
                                              formatted = '+972' + formatted;
                                          }

                                          const { error: insertErr } = await supabase
                                              .from('customers')
                                              .insert({
                                                  business_id: bizId,
                                                  phone_number: formatted,
                                                  name: userName || 'לקוח נאמנות',
                                                  loyalty_coffee_count: 2,
                                                  created_at: new Date().toISOString(),
                                                  updated_at: new Date().toISOString()
                                              });

                                          if (insertErr) throw insertErr;

                                          await loadCustomerDashboard();
                                          setExpandedCardId(bizId);
                                          showToast(i18n.language === 'he' ? '🎉 ברוכים הבאים! הצטרפת וקיבלת 2 חותמות בונוס!' : '🎉 Welcome! Joined with 2 bonus stamps!');
                                      } catch (err) {
                                          console.error(err);
                                          showToast('שגיאה בתהליך ההצטרפות', 'error');
                                      }
                                  }}
                                  className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-600 hover:to-amber-700 text-black font-black py-4 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                              >
                                  {i18n.language === 'he' ? 'כן, אני רוצה להצטרף! 🎉' : 'Yes, Join Loyalty Club! 🎉'}
                              </button>
                              <button 
                                  onClick={() => setJoinConfirmBiz(null)}
                                  className="w-full bg-[#12100e] border border-amber-900/30 text-[#f5f0eb]/60 hover:text-[#f5f0eb] font-bold py-3 rounded-xl transition-all duration-300"
                              >
                                  {i18n.language === 'he' ? 'ביטול' : 'Cancel'}
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Redemption Choice Modal */}
              {redeemChoiceBiz && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md px-6 animate-fadeIn">
                      <div className="bg-[#1f1b16] border border-amber-900/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
                          <span className="text-4xl block mb-4">🏆</span>
                          <h3 className="text-lg font-black mb-2 text-[#f5f0eb]">
                              {i18n.language === 'he' ? `הגעת לפרס ב-<truncated 3 bytes>${redeemChoiceBiz.biz.name}!` : `Reward at ${redeemChoiceBiz.biz.name}!`}
                          </h3>
                          <p className="text-xs text-[#f5f0eb]/70 mb-6 leading-relaxed">
                              {i18n.language === 'he' 
                                  ? 'האם תרצה לממש את כוס המשקה החינמית שלך כעת מול הקופאי, או לצבור חותמת רגילה לכרטיסייה הבאה?' 
                                  : 'Would you like to redeem your free drink reward now with the cashier, or collect a regular stamp for the next card?'}
                          </p>
                          
                          <div className="space-y-2">
                              <button 
                                  onClick={async () => {
                                      const bizId = redeemChoiceBiz.biz.id;
                                      const currentCount = redeemChoiceBiz.currentCount;
                                      const limit = redeemChoiceBiz.limit;
                                      setRedeemChoiceBiz(null);
                                      
                                      try {
                                          let formatted = userPhone;
                                          if (formatted.startsWith('0')) {
                                              formatted = '+972' + formatted.substring(1);
                                          } else if (!formatted.startsWith('+')) {
                                              formatted = '+972' + formatted;
                                          }

                                          const { error: resetErr } = await supabase
                                              .from('customers')
                                              .update({
                                                  loyalty_coffee_count: Math.max(0, currentCount - limit),
                                                  updated_at: new Date().toISOString()
                                              })
                                              .eq('phone_number', formatted)
                                              .eq('business_id', bizId);

                                          if (resetErr) throw resetErr;

                                          await fetchUserDataForBiz(bizId);
                                          
                                          setValidationScreenData({
                                              bizName: redeemChoiceBiz.biz.name,
                                              rewardName: i18n.language === 'he' ? 'כוס קפה/משקה במתנה' : 'Free Coffee/Drink Reward',
                                              phone: userPhone,
                                              timeLeft: 60
                                          });
                                      } catch (err) {
                                          console.error(err);
                                          showToast('שגיאה במימוש ההטבה', 'error');
                                      }
                                  }}
                                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#f5f0eb] font-black py-4 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                              >
                                  {i18n.language === 'he' ? '🎁 לממש כוס חינם כעת!' : '🎁 Redeem Free Drink Now!'}
                              </button>
                              <button 
                                  onClick={async () => {
                                      const bizId = redeemChoiceBiz.biz.id;
                                      setRedeemChoiceBiz(null);
                                      if (redeemChoiceBiz.biz.require_pin_auth) {
                                          setPinAuthBizId(bizId);
                                          setEnteredPin('');
                                          setShowPinModal(true);
                                      } else {
                                          await awardStampToUser(bizId);
                                      }
                                  }}
                                  className="w-full bg-gradient-to-r from-[#c59b27] to-amber-700 hover:from-amber-600 hover:to-amber-700 text-black font-black py-4 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                              >
                                  {i18n.language === 'he' ? '☕ לצבור חותמת רגילה' : '☕ Collect Regular Stamp'}
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Cashier Validation Screen Modal */}
              {validationScreenData && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg px-6 animate-fadeIn">
                      <div className="bg-[#1f1b16] border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center space-y-6">
                          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
                              <span className="text-4xl text-emerald-500">✓</span>
                          </div>
                          
                          <div>
                              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">
                                  {i18n.language === 'he' ? 'אישור מימוש לקופאי' : 'Cashier Validation Screen'}
                              </span>
                              <h2 className="text-xl font-black text-[#f5f0eb]">
                                  {validationScreenData.rewardName}
                              </h2>
                              <p className="text-sm font-bold text-[#c59b27] mt-1">
                                  {validationScreenData.bizName}
                              </p>
                          </div>

                          <div className="bg-black/40 border border-amber-900/20 rounded-2xl p-4">
                              <p className="text-[10px] text-[#f5f0eb]/40 font-bold uppercase tracking-wider">
                                  {i18n.language === 'he' ? 'קוד אימות לקוח:' : 'Customer verification:'}
                              </p>
                              <p className="text-lg font-mono text-[#f5f0eb] font-bold mt-1 tracking-widest">
                                  {validationScreenData.phone.replace('+', '')}
                              </p>
                          </div>

                          <div className="text-center">
                              <p className="text-[10px] text-[#f5f0eb]/40 font-bold">
                                  {i18n.language === 'he' ? 'הראה מסך זה לקופאי לאישור. פג תוקף בעוד:' : 'Show this to the cashier. Expires in:'}
                              </p>
                              <p className="text-3xl font-black text-emerald-500 mt-2 font-mono">
                                  {validationScreenData.timeLeft}s
                              </p>
                          </div>

                          <button 
                              onClick={() => setValidationScreenData(null)}
                              className="w-full bg-[#12100e] border border-amber-900/30 text-[#f5f0eb]/60 hover:text-[#f5f0eb] font-bold py-3.5 rounded-xl transition-all duration-300"
                          >
                              {i18n.language === 'he' ? 'סגור מסך אישור' : 'Close Validation Screen'}
                          </button>
                      </div>
                  </div>
              )}


            {/* QR Scanner Modal Overlay */}
            {isScanning && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-6">
                    <div className="w-full max-w-sm flex flex-col items-center gap-6">
                        <div className="text-center">
                            <h3 className="text-lg font-bold tracking-wide text-[#f5f0eb]">{t('customer.scanTitle')}</h3>
                            <p className="text-xs text-[#f5f0eb]/60 mt-1">{t('customer.scanSubtitle')}</p>
                        </div>

                        <div className="w-full aspect-square rounded-3xl border border-[#c59b27]/30 bg-stone-950 overflow-hidden relative shadow-stone-950/60 shadow-2xl">
                            <video 
                                ref={videoRef}
                                className="w-full h-full object-cover"
                            />
                            <canvas 
                                ref={canvasRef}
                                className="hidden"
                            />
                            
                            <div className="absolute inset-8 border-2 border-dashed border-[#c59b27]/50 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                                <div className="w-4 h-4 border-t-2 border-r-2 border-[#c59b27] absolute top-0 right-0"></div>
                                <div className="w-4 h-4 border-t-2 border-l-2 border-[#c59b27] absolute top-0 left-0"></div>
                                <div className="w-4 h-4 border-b-2 border-r-2 border-[#c59b27] absolute bottom-0 right-0"></div>
                                <div className="w-4 h-4 border-b-2 border-l-2 border-[#c59b27] absolute bottom-0 left-0"></div>
                            </div>
                        </div>

                        {scanError && (
                            <p className="text-xs text-red-500 font-bold text-center px-4 bg-red-500/10 border border-red-500/25 py-2.5 rounded-xl">{scanError}</p>
                        )}

                        <button 
                            onClick={handleStopQRScanner}
                            className="w-full bg-stone-850 hover:bg-stone-800 text-[#f5f0eb] font-black py-4 rounded-xl shadow-stone-950/40 shadow-lg transition-all duration-300 transform active:scale-95 border border-amber-900/30"
                        >
                            {t('customer.cancel')}
                        </button>
                    </div>
                </div>
            )}

            {/* Cashier PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/85 backdrop-blur-md px-6">
                    <div className="bg-[#1f1b16] border border-amber-900/30 rounded-3xl p-6 max-w-sm w-full shadow-stone-950/60 shadow-2xl relative text-center space-y-6">
                        <div className="space-y-1">
                            <span className="text-3xl block">🔑</span>
                            <h3 className="text-lg font-bold tracking-wide text-[#f5f0eb]">{t('customer.pinTitle')}</h3>
                            <p className="text-xs text-[#f5f0eb]/60">{t('customer.pinSubtitle')}</p>
                        </div>

                        <div className="flex justify-center gap-3">
                            {Array.from({ length: 4 }).map((_, idx) => {
                                const char = enteredPin[idx] || '';
                                return (
                                    <div 
                                        key={idx}
                                        className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-bold font-mono transition-all ${
                                            char ? 'border-[#c59b27] bg-[#c59b27]/10 text-[#f5f0eb]' : 'border-amber-900/30 bg-stone-900/50 text-stone-600'
                                        }`}
                                    >
                                        {char ? '●' : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Numeric Keyboard */}
                        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        if (enteredPin.length < 4) {
                                            setEnteredPin(prev => prev + num);
                                        }
                                    }}
                                    className="aspect-square bg-stone-900 hover:bg-stone-850 border border-amber-900/30 active:scale-95 rounded-xl font-bold text-base transition-all flex items-center justify-center text-[#f5f0eb]/80"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => setEnteredPin(prev => prev.slice(0, -1))}
                                className="aspect-square bg-stone-900 hover:bg-stone-850 border border-amber-900/30 active:scale-95 rounded-xl font-bold text-xs transition-all flex items-center justify-center text-red-400"
                            >
                                ⌫
                            </button>
                            <button
                                onClick={() => {
                                    if (enteredPin.length < 4) {
                                        setEnteredPin(prev => prev + '0');
                                    }
                                }}
                                className="aspect-square bg-stone-900 hover:bg-stone-850 border border-amber-900/30 active:scale-95 rounded-xl font-bold text-base transition-all flex items-center justify-center text-[#f5f0eb]/80"
                            >
                                0
                            </button>
                            <button
                                onClick={async () => {
                                    const currentBiz = stores.find(b => b.id === pinAuthBizId);
                                    if (!currentBiz) return;
                                    
                                    if (enteredPin === (currentBiz.manager_pin || '1234')) {
                                        setShowPinModal(false);
                                        await awardStampToUser(pinAuthBizId);
                                    } else {
                                        alert(t('customer.pinError'));
                                        setEnteredPin('');
                                    }
                                }}
                                disabled={enteredPin.length !== 4}
                                className="aspect-square bg-[#c59b27] hover:bg-amber-400 disabled:opacity-40 text-black active:scale-95 rounded-xl font-black text-xs transition-all flex items-center justify-center"
                            >
                                אשר
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setShowPinModal(false);
                                setPinAuthBizId(null);
                                setEnteredPin('');
                            }}
                            className="w-full text-xs text-[#f5f0eb]/60 hover:text-[#f5f0eb]/80 pt-2 transition-colors"
                        >
                            ביטול סריקה
                        </button>
                    </div>
                </div>
            )}
        
            {/* Customer Pager Ready Full Screen Alert Overlay */}
            {isPagerReadyAlertActive && activePager && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg px-6 animate-fadeIn">
                    <div className="bg-[#1f1b16] border-2 border-emerald-500/60 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center space-y-6">
                        <div className="w-24 h-24 bg-emerald-500/10 border-4 border-emerald-500 rounded-full mx-auto flex items-center justify-center animate-bounce">
                            <span className="text-5xl text-emerald-500">☕🎉</span>
                        </div>
                        
                        <div>
                            <span className="text-xs font-black text-emerald-500 uppercase tracking-widest block mb-1">
                                {i18n.language === 'he' ? 'הקפה שלך מוכן!' : 'Your Coffee is Ready!'}
                            </span>
                            <h2 className="text-3xl font-black text-[#f5f0eb]">
                                #${activePager.pager_number}
                            </h2>
                            <p className="text-xs text-[#f5f0eb]/70 mt-3 leading-relaxed">
                                {i18n.language === 'he' 
                                    ? 'ההזמנה שלך מוכנה וממתינה לך בדלפק האיסוף. בתיאבון!' 
                                    : 'Your order is ready and waiting for you at the counter. Enjoy!'}
                            </p>
                        </div>

                        <button 
                            onClick={async () => {
                                try {
                                    await supabase
                                        .from('pagers')
                                        .update({ status: 'collected', collected_at: new Date().toISOString() })
                                        .eq('id', activePager.id);
                                    localStorage.removeItem('stampa_active_pager_id');
                                    setActivePager(null);
                                    setIsPagerReadyAlertActive(false);
                                    showToast('בתיאבון! ☕');
                                } catch (err) {
                                    console.error(err);
                                    setIsPagerReadyAlertActive(false);
                                }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4.5 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                        >
                            {i18n.language === 'he' ? '✓ אספתי את ההזמנה' : '✓ I collected the order'}
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Custom Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-6 animate-slideDown">
                    <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${
                        toast.type === 'success' 
                            ? 'bg-[#1f1b16]/95 border-emerald-500/30 text-[#f5f0eb]' 
                            : 'bg-[#1f1b16]/95 border-red-500/30 text-[#f5f0eb]'
                    }`}>
                        <span className="text-xl">
                            {toast.type === 'success' ? '✨' : '⚠️'}
                        </span>
                        <p className="text-xs font-black flex-1" dir="rtl">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="text-[#f5f0eb]/40 hover:text-[#f5f0eb] text-xs font-bold">
                            ✕
                        </button>
                    </div>
                </div>
            )}
    
            {/* Premium Custom Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-6 animate-slideDown">
                    <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${
                        toast.type === 'success' 
                            ? 'bg-[#1f1b16]/95 border-emerald-500/30 text-[#f5f0eb]' 
                            : 'bg-[#1f1b16]/95 border-red-500/30 text-[#f5f0eb]'
                    }`}>
                        <span className="text-xl">
                            {toast.type === 'success' ? '✨' : '⚠️'}
                        </span>
                        <p className="text-xs font-black flex-1" dir="rtl">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="text-[#f5f0eb]/40 hover:text-[#f5f0eb] text-xs font-bold">
                            ✕
                        </button>
                    </div>
                </div>
            )}
    
            {/* Premium Custom Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-sm px-6 animate-slideDown">
                    <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${
                        toast.type === 'success' 
                            ? 'bg-[#1f1b16]/95 border-emerald-500/30 text-[#f5f0eb]' 
                            : 'bg-[#1f1b16]/95 border-red-500/30 text-[#f5f0eb]'
                    }`}>
                        <span className="text-xl">
                            {toast.type === 'success' ? '✨' : '⚠️'}
                        </span>
                        <p className="text-xs font-black flex-1" dir="rtl">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="text-[#f5f0eb]/40 hover:text-[#f5f0eb] text-xs font-bold">
                            ✕
                        </button>
                    </div>
                </div>
            )}
    </div>
    );
}
