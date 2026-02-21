// @ts-nocheck
/**
 * Maia Chat Overlay - Team Member Interface
 * With Quick Actions for Post Creation
 */
import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
    Sparkles, X, Minimize2, Maximize2, Send,
    Loader2, Bot, User, GripVertical, Zap,
    Instagram, MessageSquare, AlertTriangle,
    Plus, Image as ImageIcon, Square, RectangleVertical,
    RefreshCw, Settings, LogOut, MousePointer2,
    Cpu, ChevronDown
} from 'lucide-react';
import ClockInModalInline from './ClockInModalInline';
import UserSettingsModal from './UserSettingsModal';
import TeamMessageModal from './TeamMessageModal';
import { useAbraHat, useMagicSDK } from '../../context/AbraHatContext';
import { AbraManifesto } from '../../types/AbraTypes';

// Safe location hook - returns fallback if outside Router
const useSafeLocation = () => {
    try {
        // Dynamic import to avoid errors outside Router
        const { useLocation } = require('react-router-dom');
        return useLocation();
    } catch {
        return { pathname: '/manager' }; // Default to showing Maya
    }
};

// Import context directly (not the hook) - this won't throw when outside provider
import AuthContext from '../../context/AuthContextCore';
import { supabase } from '../../lib/supabase';
import maiaLogo from '../../assets/maia-logo.png';
import PostCreator from '../marketing/PostCreator';

// Safe auth hook - returns null safely if outside AuthProvider
const useSafeAuth = () => {
    const ctx = useContext(AuthContext);
    // ctx will be null if outside provider (that's fine, we have fallbacks)
    return ctx || { businessId: null, currentUser: null };
};

// TypeScript Interfaces
interface Employee {
    id: string;
    name: string;
    accessLevel: string;
    isSuperAdmin: boolean;
    businessId: string;
}

interface MayaOverlayProps {
    employee?: Employee | null;
    canViewFinancialData?: boolean;
    sessionId?: string;
    onLogout?: () => void;
    needsClockIn?: boolean;           // 🆕 NEW
    isClockedIn?: boolean;             // 🆕 NEW
    onClockInComplete?: (role: string, eventId: string) => void; // 🆕 NEW
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isAutomation?: boolean;
    actions?: MessageAction[];
}

interface MessageAction {
    type: 'story' | 'sms' | 'alert';
    label: string;
    data: any;
    pending?: boolean;
    completed?: boolean;
}

interface AutomationLog {
    id: string;
    action: string;
    target: string;
    details: any;
    created_at: string;
}

// Routes where Maya should be visible
const ALLOWED_ROUTES = {
    // Manager screens (for all users)
    manager: ['/manager', '/orders', '/kitchen', '/shift', '/staff'],
    // Owner/Admin screens
    owner: ['/data', '/super-admin', '/owner-settings', '/analytics', '/marketing']
};

export const MayaOverlay: React.FC<MayaOverlayProps> = ({
    employee = null,
    canViewFinancialData = false,
    sessionId = null,
    onLogout = null,
    needsClockIn = false,           // 🆕 NEW
    isClockedIn = false,             // 🆕 NEW
    onClockInComplete = null         // 🆕 NEW
}) => {
    const auth = useSafeAuth(); // Safely get auth - won't crash outside AuthProvider
    const location = useSafeLocation(); // Safely get location - won't crash outside Router

    // Use passed employee OR fallback to current auth user
    const activeEmployee = employee || auth.currentUser;

    // iCaffe business ID (UUID format)
    const businessId = activeEmployee?.business_id || activeEmployee?.businessId || auth?.businessId || '22222222-2222-2222-2222-222222222222';
    const userRole = activeEmployee?.access_level || activeEmployee?.accessLevel || 'staff';
    const isSuperAdmin = activeEmployee?.is_super_admin || activeEmployee?.isSuperAdmin || false;
    const isOwner = isSuperAdmin || userRole === 'owner' || userRole === 'admin' || userRole === 'Admin' || userRole === 'Owner' || userRole === 'Manager' || userRole === 'manager';

    // Abrakadabra Access Level (V-003: Level 8+)
    const accessLevelNum = typeof userRole === 'number' ? userRole : (
        isSuperAdmin ? 10 : (
            ['Owner', 'owner', 'Admin', 'admin', 'Software Architect'].includes(userRole) ? 9 : (
                ['manager', 'Manager'].includes(userRole) ? 8 : 2
            )
        )
    );
    const hasMagicalAccess = accessLevelNum >= 8;

    // Check if Maya should be visible on current route
    const shouldShow = useCallback(() => {
        const path = location.pathname;

        // Manager routes - always visible
        if (ALLOWED_ROUTES.manager.some(route => path.startsWith(route))) {
            return true;
        }

        // Owner routes - only for owners/admins
        if (isOwner && ALLOWED_ROUTES.owner.some(route => path.startsWith(route))) {
            return true;
        }

        return false;
    }, [location.pathname, isOwner]);

    // UI State
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position] = useState({ x: 20, y: 20 });
    const [unreadCount, setUnreadCount] = useState(0);

    // Post Creator State
    const [showPostCreator, setShowPostCreator] = useState(false);
    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

    // User Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [showTeamMessage, setShowTeamMessage] = useState(false);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Provider State
    const [provider, setProvider] = useState<'local' | 'google' | 'anthropic' | 'xai'>('google');
    const [model, setModel] = useState('gemini-3-flash-preview');
    const [localAvailable, setLocalAvailable] = useState(true);
    const [lastUsage, setLastUsage] = useState<any>(null); // For token tracking

    // 🤖 AI Models Configuration (Updated Feb 2026)
    const AI_MODELS = {
        'google': [
            { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (Fast)' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Best)' },
            { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro Image' }
        ],
        'anthropic': [
            { id: 'claude-4-6-sonnet-latest', name: 'Claude Sonnet 4.6' },
            { id: 'claude-4-6-opus-latest', name: 'Claude Opus 4.6' },
            { id: 'claude-4-5-haiku-latest', name: 'Claude Haiku 4.5' }
        ],
        'xai': [
            { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning' },
            { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast' },
            { id: 'grok-code-fast-1', name: 'Grok Code Fast 1' }
        ],
        'local': [
            { id: 'dictalm-hebrew', name: 'DictaLM 3.0 (1.7B)' },
            { id: 'llama3.2', name: 'Llama 3.2 (3B)' },
            { id: 'deepseek-r1:7b', name: 'DeepSeek R1 (7B)' },
            { id: 'maya', name: 'Maya Custom (2.0GB)' }
        ]
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();

    // Abrakadabra Integration
    const { wearHat, toggleInspector, inspectorActive } = useAbraHat();
    const sdk = useMagicSDK();
    const [castingSpell, setCastingSpell] = useState(false);

    const castSpell = async () => {
        if (!input.trim() || castingSpell) return;
        setCastingSpell(true);
        setLoading(true);

        try {
            console.log('🧠 DicTAlm 1.7B (Ollama): Capturing Hebrew Intent...');

            // 1. Local Intent Capture via DicTAlm
            const intentResponse = await fetch('http://localhost:8081/api/maya/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are DicTAlm 1.7B. Output ONLY a valid JSON AbraIntent object for the Hebrew request.' },
                        { role: 'user', content: input }
                    ],
                    businessId,
                    provider: 'local',
                    model: 'dictalm-hebrew'
                })
            });

            const intentData = await intentResponse.json();
            // Simulate/Parse structured intent
            const abraIntent = {
                intent_type: 'UI_MODIFICATION',
                primary_component_id: input.includes('POS') ? 'pos-checkout-biometric' : 'pages-kds-components-ordercard',
                hebrew_description: input,
                english_summary: 'Evolution triggered via Maya Host (DicTAlm)',
                affected_entities: ['orders'],
                risk_assessment: 'medium',
                correlation_id: `abra-${Date.now()}`
            };

            console.log('👨‍🍳 Prep Kitchen (Claude): Routing intent to prep sandbox...');

            // 2. Claude Prep Routing
            const componentContext = {
                file_path: abraIntent.primary_component_id === 'pos-checkout-biometric'
                    ? 'src/components/pos/POSCheckoutWithBiometric.tsx'
                    : 'src/pages/kds/components/OrderCard.jsx',
                current_behavior: 'Standard behavior before spell casting.',
            };

            const prepResponse = await fetch('http://localhost:8081/api/abrakadabra/prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: abraIntent,
                    componentContext,
                    caster: {
                        employee_id: activeEmployee?.id || 'unknown',
                        role: userRole,
                        business_id: businessId
                    }
                })
            });

            const { manifesto } = await prepResponse.json();

            // 3. Sandbox Deployment
            console.log('⚡ Triggering wearHat (Sandbox Initialization)...');
            wearHat(manifesto);

            const assistantMessage: Message = {
                id: `maia-spell-${Date.now()}`,
                role: 'assistant',
                content: `✨ ניתחתי את הבקשה שלך באמצעות DicTAlm והכנתי את השינוי ב-"Prep Kitchen" (Claude). 
                המניפסט מוכן: **${manifesto.incantation}**. 
                נכנסנו למצב סנדבוקס באופן אוטומטי! בדוק את ה-Drawer בצד הימני.`,
                timestamp: new Date(),
                actions: [
                    {
                        type: 'alert',
                        label: '🔍 הצג שינויים',
                        data: { manifesto }
                    }
                ]
            };

            setMessages(prev => [...prev, assistantMessage]);
            setInput('');
        } catch (err) {
            console.error('Prep Bridge Error:', err);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'הגשר למטבח ההכנות נקטע... אולי אחת מהבינות מלאכותיות עסוקה? 😅',
                timestamp: new Date()
            }]);
        } finally {
            setCastingSpell(false);
            setLoading(false);
        }
    };

    // 🆕 Clock-In State
    const [showClockIn, setShowClockIn] = useState(needsClockIn && !isClockedIn);

    // 🆕 Sync showClockIn with props OR Fetch status
    // 🆕 Sync showClockIn with props OR Fetch status
    useEffect(() => {
        if (needsClockIn !== undefined) {
            // If prop is explicit, honor it
            setShowClockIn(needsClockIn && !isClockedIn);
        } else if (activeEmployee?.id) {
            // Otherwise, check DB for status via RPC (Reliable)
            console.log('🕰️ Maya: Checking clock status for', activeEmployee.name);
            const checkClockStatus = async () => {
                try {
                    const { data, error } = await supabase.rpc('get_employee_shift_status', {
                        p_employee_id: activeEmployee.id
                    });

                    if (!error && data) {
                        const currentlyClockedIn = data.is_clocked_in; // RPC returns { is_clocked_in: boolean }
                        console.log('🕰️ Clock Status (RPC):', currentlyClockedIn ? 'IN' : 'OUT');
                        if (!currentlyClockedIn) {
                            setShowClockIn(true);
                            // Auto-open if not clocked in
                            setIsOpen(true);
                        }
                    } else if (error) {
                        console.warn('⚠️ RPC failed, assuming clocked out:', error);
                        // Fallback logic could go here, but let's be safe
                        setShowClockIn(true);
                        setIsOpen(true);
                    }
                } catch (err) {
                    console.error('Failed to check clock status:', err);
                }
            };
            checkClockStatus();
        }
    }, [needsClockIn, isClockedIn, activeEmployee?.id, activeEmployee?.name]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check provider availability on mount
    useEffect(() => {
        const checkProviders = async () => {
            // Check local (Ollama)
            try {
                const res = await fetch('http://localhost:8081/api/maya/health');
                const data = await res.json();
                setLocalAvailable(data.healthy === true);
            } catch {
                setLocalAvailable(false);
            }
        };
        checkProviders();
    }, [businessId]);

    // Realtime Automations Listener
    useEffect(() => {
        if (!businessId) return;

        const channel = supabase
            .channel('maia-automations')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'automation_logs',
                    filter: `business_id=eq.${businessId}`
                },
                (payload) => {
                    const log = payload.new as AutomationLog;
                    const systemMessage = createSystemMessage(log);

                    setMessages(prev => [...prev, systemMessage]);

                    if (!isOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [businessId, isOpen]);

    const createSystemMessage = (log: AutomationLog): Message => {
        let content = '';
        let actions: MessageAction[] = [];

        switch (log.action) {
            case 'vip_order_detected':
                const vipName = log.target;
                content = `🎯 זיהיתי שנתי הזמין! הזרקתי את הקבוע שלו.`;
                actions = [
                    {
                        type: 'story',
                        label: '📸 פרסם סטורי לדנה',
                        data: { vipName: log.target, ...log.details }
                    },
                    {
                        type: 'sms',
                        label: '📱 שלח מסרון לנתי',
                        data: { target: log.target }
                    }
                ];
                break;

            case 'story_posted':
                content = `✅ הסטורי נשלח לדנה (Instagram Webhook)!`;
                break;

            case 'sms_sent':
                content = `✅ מסרון נשלח בהצלחה ל-${log.target}`;
                break;

            default:
                content = `🤖 אוטומציה: ${log.action}`;
        }

        return {
            id: `auto-${log.id}`,
            role: 'system',
            content,
            timestamp: new Date(log.created_at),
            isAutomation: true,
            actions: actions.length > 0 ? actions : undefined
        };
    };

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading || !businessId) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLastUsage(null);

        // MAGIC DETECTION LOGIC
        const lowerInput = input.toLowerCase();
        const isMagicRequest = lowerInput.includes('kds') || lowerInput.includes('עיצוב') || lowerInput.includes('וורלד') || lowerInput.includes('world') || lowerInput.includes('שינוי') || lowerInput.includes('צבע');
        const isDeviceUser = activeEmployee?.is_device === true || activeEmployee?.name?.includes('Terminal');

        if (isMagicRequest && (hasMagicalAccess || isDeviceUser)) {
            setLoading(true);
            setTimeout(() => {
                const magicSuggestion: Message = {
                    id: `magic-suggest-${Date.now()}`,
                    role: 'assistant',
                    content: 'נראה שאתה מבקש שינוי בממשק. האם תרצה שאשתמש ב-Abrakadabra Engine כדי להכין לך גרסת סנדבוקס של השינוי הזה?',
                    timestamp: new Date(),
                    actions: [
                        {
                            type: 'alert',
                            label: '🪄 הפעל מנוע קוסמי (Cast)',
                            data: { action: 'trigger_cast', original_input: input }
                        }
                    ]
                };
                setMessages(prev => [...prev, magicSuggestion]);
                setLoading(false);
            }, 800);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://localhost:8081/api/maya/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    businessId,
                    provider,
                    model, // Pass selected model
                    employeeId: activeEmployee?.id,
                    // Security Context for Backend
                    securityContext: {
                        isSuperAdmin: activeEmployee?.isSuperAdmin || activeEmployee?.is_super_admin,
                        role: activeEmployee?.accessLevel || activeEmployee?.access_level
                    }
                })
            });

            const data = await res.json();

            // Track usage if available
            if (data.usage) {
                setLastUsage(data.usage);
            }

            // Handle response format (string or object)
            const responseText = typeof data.response === 'string' ? data.response : (data.response || 'Error');

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText || 'סליחה, לא הצלחתי להבין.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error('Error sending message:', err);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'סליחה, יש בעיה בתקשורת כרגע.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, businessId, provider, model, activeEmployee, hasMagicalAccess]);



    const handleAction = async (action: MessageAction, messageId: string) => {
        // Set Pending
        setMessages(prev => prev.map(m => {
            if (m.id === messageId && m.actions) {
                return {
                    ...m,
                    actions: m.actions.map(a => a === action ? { ...a, pending: true } : a)
                };
            }
            return m;
        }));

        try {
            if (action.type === 'story') {
                // Generate Caption
                const captionRes = await fetch('http://localhost:8081/api/marketing/generate-caption', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        context: `${action.data.vipName} הזמין את הקבוע שלו (הפוך חזק שיבולת)`,
                        style: 'עוקצני'
                    })
                });
                const { caption } = await captionRes.json();

                // Publish
                await fetch('http://localhost:8081/api/marketing/story', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        type: 'vip_order',
                        caption,
                        metadata: action.data
                    })
                });
            }

            if (action.type === 'sms') {
                // Placeholder for SMS
                await fetch('http://localhost:8081/api/marketing/sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        businessId,
                        phone: '0501234567', // Nati's phone from DB/Env
                        message: 'הקפה שלך מוכן נתי! בוא לפני שיתקרר 😉'
                    })
                });
            }

            // Set Completed
            setMessages(prev => prev.map(m => {
                if (m.id === messageId && m.actions) {
                    return {
                        ...m,
                        actions: m.actions.map(a => a === action ? { ...a, pending: false, completed: true } : a)
                    };
                }
                return m;
            }));

        } catch (err) {
            console.error('Action Failed:', err);
            // Revert pending
            setMessages(prev => prev.map(m => {
                if (m.id === messageId && m.actions) {
                    return {
                        ...m,
                        actions: m.actions.map(a => a === action ? { ...a, pending: false } : a)
                    };
                }
                return m;
            }));
        }

        // Handle Magic Trigger from Chat
        if (action.type === 'alert' && action.data.action === 'trigger_cast') {
            const originalInput = action.data.original_input;
            setInput(originalInput);
            // We need to wait for state update or just call castSpell with local variable
            // Since castSpell uses 'input' from state, let's call a modified version or just use state
            setTimeout(() => {
                castSpell();
            }, 100);
            return;
        }

        // Handle Magic Sandbox Entry
        if (action.type === 'alert' && action.data.manifesto) {
            console.log('⚡ Triggering wearHat (Sandbox Initialization)...');
            wearHat(action.data.manifesto);
        }
    };


    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
        setUnreadCount(0);
    };

    // 🆕 Refresh Handler
    const handleRefresh = () => {
        setMessages([]);
        setInput('');
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Don't render if not on allowed route
    if (!shouldShow()) {
        return null;
    }

    return (
        <>
            {/* Post Creator Modal */}
            <AnimatePresence>
                {showPostCreator && (
                    <PostCreator
                        businessId={businessId}
                        onClose={() => setShowPostCreator(false)}
                    />
                )}
            </AnimatePresence>

            {/* User Settings Modal */}
            <AnimatePresence>
                {showSettings && activeEmployee && (
                    <UserSettingsModal
                        employee={activeEmployee}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </AnimatePresence>

            {/* Team Message Modal */}
            <AnimatePresence>
                {showTeamMessage && activeEmployee && (
                    <TeamMessageModal
                        businessId={businessId}
                        activeEmployee={activeEmployee}
                        onClose={() => setShowTeamMessage(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleOpen}
                        className="fixed bottom-[88px] left-4 z-[9999] w-14 h-14 rounded-xl
                       bg-purple-600 border-2 border-purple-400
                       shadow-lg shadow-purple-500/30 flex items-center justify-center
                       hover:bg-purple-500 hover:shadow-purple-500/50 hover:border-purple-300
                       transition-all duration-200 lg:bottom-6"
                    >
                        <img src={maiaLogo} alt="Maia" className="w-8 h-8 object-contain" />
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
                           text-xs text-white flex items-center justify-center font-bold"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            height: isMinimized ? 56 : 520,
                            width: isMinimized ? 200 : 400
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        drag
                        dragControls={dragControls}
                        dragMomentum={false}
                        dragElastic={0}
                        className="fixed z-[9999] rounded-2xl overflow-hidden
                       backdrop-blur-xl bg-slate-900/90 border border-white/10
                       shadow-2xl shadow-purple-500/20"
                        style={{ left: position.x, bottom: position.y, direction: 'rtl' }}
                    >
                        {/* Header */}
                        <div
                            className="h-14 px-4 flex items-center justify-between 
                         bg-gradient-to-r from-purple-600/50 to-pink-600/50 
                         border-b border-white/10 cursor-move"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-white/40" />
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                    <img src={maiaLogo} alt="Maia" className="w-full h-full object-cover" />
                                </div>
                                {!isMinimized && (
                                    <div>
                                        <h3 className="text-sm font-bold text-white">מאיה 🌸</h3>
                                        <p className="text-xs text-white/60">המנהלת הדיגיטלית</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Settings Button */}


                                {/* Settings Button */}
                                {!isMinimized && activeEmployee && (
                                    <>
                                        {/* 🕒 Clock Out Button (Only if NOT showing clock-in modal) */}
                                        {!showClockIn && (
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('לסיים משמרת ולצאת?')) {
                                                        try {
                                                            const { error } = await supabase.rpc('handle_clock_event', {
                                                                p_employee_id: activeEmployee.id,
                                                                p_event_type: 'clock_out'
                                                            });

                                                            if (!error) {
                                                                // alert('יצאת מהמשמרת בהצלחה');
                                                                // Force re-check -> show clock-in modal
                                                                setShowClockIn(true);
                                                                handleRefresh();
                                                            } else {
                                                                alert('שגיאה ביציאה מהמשמרת');
                                                            }
                                                        } catch (e) {
                                                            console.error('Clock out error', e);
                                                        }
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition ml-1"
                                                title="סיים משמרת (Clock Out)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (window.confirm('האם אתה בטוח שברצונך להחליף משתמש?')) {
                                                    auth?.logout?.(); // Call AuthContext logout if available
                                                    onLogout?.();     // Call prop onLogout if available
                                                    setIsOpen(false);
                                                }
                                            }}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition"
                                            title="החלף משתמש (Sign Out)"
                                        >
                                            <LogOut className="w-4 h-4 text-amber-400 hover:text-amber-300" />
                                        </button>

                                        {/* 👑 Super Admin Shortcut */}
                                        {(activeEmployee?.isSuperAdmin || activeEmployee?.is_super_admin || userRole === 'super-admin') && (
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    window.location.href = '/super-admin';
                                                }}
                                                className="p-1.5 hover:bg-purple-500/20 text-purple-400 rounded-lg transition"
                                                title="לוח בקרה סופר-אדמין (Super Admin)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setShowSettings(true)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition"
                                            title="הגדרות פרופיל"
                                        >
                                            <User className="w-4 h-4 text-white/60 hover:text-white" />
                                        </button>
                                    </>
                                )}

                                {/* 🆕 Refresh Button */}
                                {!isMinimized && !showClockIn && (
                                    <button
                                        onClick={handleRefresh}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition"
                                        title="רענן שיחה"
                                    >
                                        <RefreshCw className="w-4 h-4 text-white/60 hover:text-white" />
                                    </button>
                                )}

                                {/* 🖱️ ABRA INSPECTOR TOGGLE (Level 8+) */}
                                {hasMagicalAccess && !isMinimized && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleInspector();
                                            // Minimize Maya so the user can see the screen to inspect
                                            if (!inspectorActive) setIsMinimized(true);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${inspectorActive ? 'bg-yellow-400 text-purple-900 shadow-lg shadow-yellow-400/50' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
                                        title="מצב עריכה (Inspector Mode)"
                                    >
                                        <MousePointer2 className="w-4 h-4" />
                                    </button>
                                )}

                                <div className="w-px h-4 bg-white/20 mx-1" />

                                {/* Model Selector Dropdown */}
                                {!isMinimized && (
                                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1 ml-2">
                                        <Cpu className="w-3.5 h-3.5 text-indigo-300 ml-1" />
                                        <div className="relative">
                                            <select
                                                value={JSON.stringify({ p: provider, m: model })}
                                                onChange={(e) => {
                                                    const val = JSON.parse(e.target.value);
                                                    setProvider(val.p);
                                                    setModel(val.m);
                                                }}
                                                className="appearance-none bg-transparent text-xs font-medium text-white pl-2 pr-6 py-1 focus:outline-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                                            >
                                                <optgroup label="Anthropic (Claude)">
                                                    {AI_MODELS['anthropic'].map(m => (
                                                        <option key={m.id} value={JSON.stringify({ p: 'anthropic', m: m.id })}>{m.name}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Google (Gemini)">
                                                    {AI_MODELS['google'].map(m => (
                                                        <option key={m.id} value={JSON.stringify({ p: 'google', m: m.id })}>{m.name}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="xAI (Grok)">
                                                    {AI_MODELS['xai'].map(m => (
                                                        <option key={m.id} value={JSON.stringify({ p: 'xai', m: m.id })}>{m.name}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Local (Ollama)">
                                                    {AI_MODELS['local'].map(m => (
                                                        <option key={m.id} value={JSON.stringify({ p: 'local', m: m.id })}>{m.name}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                                                <ChevronDown className="w-3 h-3 text-white/50" />
                                            </div>
                                        </div>

                                        {/* Status Dot */}
                                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                                    </div>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition"
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4 text-white/70" /> : <Minimize2 className="w-4 h-4 text-white/70" />}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition"
                                    title="סגור חלון"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Chat Body */}
                        {!isMinimized && (
                            <>
                                {/* 🆕 INLINE CLOCK-IN (if needed) */}
                                {showClockIn && activeEmployee && (
                                    <div className="flex-1 overflow-y-auto px-4 py-3">
                                        <ClockInModalInline
                                            employee={activeEmployee}
                                            onClockInSuccess={(role, eventId) => {
                                                console.log('✅ Clocked in:', { role, eventId });
                                                setShowClockIn(false);
                                                if (onClockInComplete) {
                                                    onClockInComplete(role, eventId);
                                                }
                                            }}
                                            onError={(err) => {
                                                console.error('Clock-in error:', err);
                                                // You can add a toast notification here
                                            }}
                                        />
                                    </div>
                                )}

                                {/* CHAT INTERFACE (only if NOT showing clock-in) */}
                                {!showClockIn && (
                                    <>
                                        <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                                            {messages.length === 0 && (
                                                <div className="text-center text-white/40 py-6">
                                                    <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">היי! אני מאיה 🌸</p>
                                                    <p className="text-xs mb-4">מה אפשר לעשות בשבילך היום?</p>

                                                    {/* Quick Actions */}
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setShowPostCreator(true)}
                                                            className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-xs font-medium flex items-center gap-2"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            צור פוסט
                                                        </motion.button>

                                                        {/* Team Message - Only for Managers+ */}
                                                        {['owner', 'admin', 'manager'].includes(userRole) && (
                                                            <motion.button
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => setShowTeamMessage(true)}
                                                                className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-xs font-medium flex items-center gap-2"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                הודעה לצוות
                                                            </motion.button>
                                                        )}
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setInput('תכתבי לי טקסט שיווקי ל')}
                                                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-medium flex items-center gap-2"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            טקסט שיווקי
                                                        </motion.button>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setInput('מה המבצע של היום?')}
                                                            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-medium flex items-center gap-2"
                                                        >
                                                            <Zap className="w-3.5 h-3.5" />
                                                            מבצע היום
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            )}

                                            <AnimatePresence mode="popLayout">
                                                {messages.map((msg) => (
                                                    <motion.div
                                                        key={msg.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                                    >
                                                        {msg.role !== 'user' && (
                                                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center 
                                          ${msg.isAutomation ? 'bg-amber-500/30' : 'bg-purple-500/30'}`}>
                                                                {msg.isAutomation ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Bot className="w-3.5 h-3.5 text-purple-400" />}
                                                            </div>
                                                        )}

                                                        <div className="max-w-[85%] space-y-2">
                                                            <div className={`px-3 py-2 rounded-xl text-sm 
                                          ${msg.role === 'user' ? 'bg-cyan-500 text-white' :
                                                                    msg.isAutomation ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30' : 'bg-white/10 text-white'}`}>
                                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                            </div>

                                                            {msg.actions && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {msg.actions.map((action, idx) => (
                                                                        <motion.button
                                                                            key={idx}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => handleAction(action, msg.id)}
                                                                            disabled={action.pending || action.completed}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors
                                             ${action.completed ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                                        >
                                                                            {action.pending ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                                                                action.type === 'story' ? <Instagram className="w-3 h-3" /> :
                                                                                    action.type === 'sms' ? <MessageSquare className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                                            {action.completed ? 'בוצע' : action.label}
                                                                        </motion.button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {msg.role === 'user' && (
                                                            <div className="w-7 h-7 rounded-full bg-cyan-500/30 flex-shrink-0 flex items-center justify-center">
                                                                <User className="w-3.5 h-3.5 text-cyan-400" />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {loading && (
                                                <div className="flex gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center">
                                                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                                                    </div>
                                                    <div className="bg-white/10 px-3 py-2 rounded-xl">
                                                        <div className="flex gap-1">
                                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:100ms]" />
                                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:200ms]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input Area */}
                                        <div className="p-3 border-t border-white/10">
                                            <div className="flex gap-2">
                                                {/* Usage Stats (If available) */}
                                                {lastUsage && (
                                                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs shadow-lg">
                                                        <div className="p-1 bg-emerald-500/20 rounded-full">
                                                            <Zap className="w-3 h-3" />
                                                        </div>
                                                        <div className="flex flex-col leading-none">
                                                            <span className="opacity-60 text-[10px]">שימוש (טוקנים)</span>
                                                            <span className="font-bold font-mono">
                                                                {(lastUsage.input + lastUsage.output).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Create Post Button */}
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setShowPostCreator(true)}
                                                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:opacity-90 transition-opacity"
                                                    title="צור פוסט"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </motion.button>
                                                <input
                                                    type="text"
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                                    placeholder="דבר איתי..."
                                                    disabled={loading}
                                                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                                />
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={sendMessage}
                                                    disabled={loading || !input.trim()}
                                                    className="px-3 py-2 bg-purple-500 rounded-xl text-white disabled:opacity-50 hover:bg-purple-600 transition-colors"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </motion.button>

                                                {/* ✨ ABRAKADABRA: CAST SPELL / EDIT MODE BUTTON (Level 8+) */}
                                                {hasMagicalAccess && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            if (input.trim()) {
                                                                castSpell();
                                                            } else {
                                                                toggleInspector();
                                                                setIsOpen(false);
                                                            }
                                                        }}
                                                        disabled={loading}
                                                        className={`px-3 py-2 rounded-xl text-white shadow-lg flex items-center gap-2 border border-white/20
                                                            ${input.trim()
                                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/20' // Spell Mode
                                                                : 'bg-slate-700 hover:bg-slate-600' // Edit Mode
                                                            }`}
                                                        title={input.trim() ? "הפעל כישוף (Abrakadabra)" : "מצב עריכה (Inspector)"}
                                                    >
                                                        {input.trim() ? <Sparkles className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
                                                        {!loading && <span className="text-xs font-bold">{input.trim() ? 'כישוף' : 'עריכה'}</span>}
                                                    </motion.button>
                                                )}

                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MayaOverlay;
