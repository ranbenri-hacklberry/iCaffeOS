import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, HardDrive, ArrowRight, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import GoogleConnectButton from '@/components/GoogleConnectButton';
import AccountantAccess from '@/components/settings/AccountantAccess';
import WhatsAppConnect from '@/components/settings/WhatsAppConnect';
import ApiValidationSettings from '@/components/settings/ApiValidationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';

const OwnerSettings = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [googleStatus, setGoogleStatus] = useState('loading'); // loading, connected, disconnected
    const [geminiKey, setGeminiKey] = useState(''); // For new input only
    const [grokKey, setGrokKey] = useState(''); // For new input only
    const [hasGeminiKey, setHasGeminiKey] = useState(false); // Indicates if key exists (secure)
    const [hasGrokKey, setHasGrokKey] = useState(false); // Indicates if key exists (secure)
    const [isSavingGemini, setIsSavingGemini] = useState(false);
    const [isSavingGrok, setIsSavingGrok] = useState(false);
    const [folderId, setFolderId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.business_id) return;

            // Fetch Google connection status
            // Note: We only check IF keys exist, not the actual values (security!)
            try {
                const { data, error } = await supabase
                    .from('businesses')
                    .select('is_google_connected, gemini_api_key, grok_api_key')
                    .eq('id', currentUser.business_id)
                    .single();

                if (error) throw error;

                if (data?.is_google_connected) {
                    setGoogleStatus('connected');
                } else {
                    setGoogleStatus('disconnected');
                }

                // Only set boolean flags - don't expose actual keys to browser!
                setHasGeminiKey(!!data?.gemini_api_key);
                setHasGrokKey(!!data?.grok_api_key);
            } catch (err) {
                console.error('Error fetching settings:', err);
                setGoogleStatus('disconnected');
            }
        };

        fetchData();
    }, [currentUser?.business_id]);

    const handleSaveGemini = async () => {
        if (!currentUser?.business_id || !geminiKey) return;
        setIsSavingGemini(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ gemini_api_key: geminiKey })
                .eq('id', currentUser.business_id);

            if (error) throw error;
            alert('✅ מפתח Gemini נשמר בהצלחה!');
            setHasGeminiKey(true);
            setGeminiKey(''); // Clear input - don't keep key in browser memory!
        } catch (err) {
            console.error('Error saving Gemini key:', err);
            alert('❌ שגיאה בשמירת המפתח');
        } finally {
            setIsSavingGemini(false);
        }
    };

    const handleSaveGrok = async () => {
        if (!currentUser?.business_id || !grokKey) return;
        setIsSavingGrok(true);
        try {
            const { error } = await supabase
                .from('businesses')
                .update({ grok_api_key: grokKey })
                .eq('id', currentUser.business_id);

            if (error) throw error;
            alert('✅ מפתח Grok נשמר בהצלחה!');
            setHasGrokKey(true);
            setGrokKey(''); // Clear input - don't keep key in browser memory!
        } catch (err) {
            console.error('Error saving Grok key:', err);
            alert('❌ שגיאה בשמירת המפתח');
        } finally {
            setIsSavingGrok(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-6 font-heebo" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/mode-selection')}
                        className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                    >
                        <ArrowRight size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white mb-1">הגדרות בעלים (Owner)</h1>
                        <p className="text-slate-400 text-lg">ניהול חיבורים ושירותים רגישים</p>
                    </div>
                </div>

                {/* Unified API Key Management */}
                <ApiValidationSettings />

                {/* Security and Face Recognition Settings */}
                <SecuritySettings businessId={currentUser?.business_id} />

                {/* WhatsApp Integration Card */}
                <WhatsAppConnect />

                {/* Google Integration Card */}
                <motion.div>
                    {/* ... existing card content ... */}
                </motion.div>

                {/* Accountant Access - Only show if connected */}
                {googleStatus === 'connected' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AccountantAccess />
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Onboarding Wizard Entry */}
                    <div
                        onClick={() => navigate('/onboarding')}
                        className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/50 p-6 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Magic Menu Wizard</h3>
                                <p className="text-indigo-200/60 text-sm">Launch AI Onboarding</p>
                            </div>
                        </div>
                        <ArrowRight className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex items-center justify-between opacity-40 grayscale pointer-events-none">
                        <span className="text-white font-medium">Wolt Integration</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">בקרוב</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OwnerSettings;
