/**
 * PinCodeModal - Sudo Mode PIN verification for admin access
 * Allows one-time navigation to admin features without full logout
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PinCodeModal = ({ isOpen, onClose, onSuccess, featureName }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            // Focus first input when modal opens
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    }, [isOpen]);

    const handlePinChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newPin = pin.split('');
        newPin[index] = value;
        const updatedPin = newPin.join('').slice(0, 4);
        setPin(updatedPin);
        setError('');

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-verify when 4 digits entered
        if (updatedPin.length === 4) {
            verifyPin(updatedPin);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const verifyPin = async (pinCode) => {
        setIsVerifying(true);
        setError('');

        try {
            // Query for manager/admin users with this PIN
            const { data: managers, error: queryError } = await supabase
                .from('employees')
                .select('id, name, access_level')
                .eq('pin_code', pinCode)
                .in('access_level', ['admin', 'manager', 'owner']);

            if (queryError) throw queryError;

            if (managers && managers.length > 0) {
                // Valid admin PIN - grant access
                onSuccess(managers[0]);
                onClose();
            } else {
                setError('PIN שגוי או אין הרשאת מנהל');
                setPin('');
                setTimeout(() => inputRefs[0].current?.focus(), 100);
            }
        } catch (err) {
            console.error('PIN verification error:', err);
            setError('שגיאה באימות PIN');
            setPin('');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Shield size={24} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">אימות מנהל</h3>
                                    <p className="text-sm text-slate-500 font-medium">Sudo Mode</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Feature Info */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-sm font-bold text-blue-900">
                                <Lock size={16} className="inline ml-1" />
                                גישה ל: <span className="text-blue-600">{featureName}</span>
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                הכנס PIN של מנהל לאישור חד-פעמי
                            </p>
                        </div>

                        {/* PIN Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-3 text-center">
                                הכנס PIN (4 ספרות)
                            </label>
                            <div className="flex justify-center gap-3" dir="ltr">
                                {[0, 1, 2, 3].map((index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={pin[index] || ''}
                                        onChange={(e) => handlePinChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        disabled={isVerifying}
                                        className="w-16 h-16 text-center text-2xl font-black border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-50"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                            >
                                <AlertCircle size={16} className="text-red-600" />
                                <p className="text-sm font-bold text-red-700">{error}</p>
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {isVerifying && (
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl">
                                    <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <span className="text-sm font-bold text-indigo-600">מאמת...</span>
                                </div>
                            </div>
                        )}

                        {/* Helper Text */}
                        <p className="text-xs text-center text-slate-400 mt-4">
                            PIN נכון יאפשר גישה חד-פעמית ללא התנתקות
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PinCodeModal;
