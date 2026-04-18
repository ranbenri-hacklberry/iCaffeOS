import { supabase } from '@/lib/supabase';
import { useState, useRef } from 'react';
import { sendSms } from '@/services/smsService';

/**
 * ð± useKDSSms Hook
 * Handles the logic for sending SMS notifications to customers from the KDS.
 */
export const useKDSSms = () => {
    const [smsToast, setSmsToast] = useState(null);
    const [isSendingSms, setIsSendingSms] = useState(false);

    // Track recently sent sms status with timestamps (orderId-phone -> timestamp)
    const sentLogRef = useRef(new Map());

    const handleSendSms = async (phoneOrOrderId, customerName = null, customerPhone = null) => {
        // ð AUTO-DETECT call pattern
        let cleanPhone;
        let displayName = customerName;
        let orderId = null;

        if (customerPhone !== null && customerPhone !== undefined) {
            orderId = phoneOrOrderId;
            cleanPhone = String(customerPhone).trim();
        } else {
            cleanPhone = String(phoneOrOrderId || '').trim();
        }

        // ð¡️ IDEMPOTENCY: Short-term lockout (2 minutes) per unique key
        const idempotencyKey = orderId ? `${orderId}-${cleanPhone}` : cleanPhone;
        const lastSent = sentLogRef.current.get(idempotencyKey);
        const now = Date.now();
        const LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes

        if (lastSent && (now - lastSent) < LOCKOUT_MS) {
            const remaining = Math.ceil((LOCKOUT_MS - (now - lastSent)) / 1000);
            console.log(`ð¡️ SMS recently sent to ${idempotencyKey}, locking for safety (${remaining}s remaining)`);
            return;
        }

        if (!cleanPhone || cleanPhone === '0500000000' || cleanPhone === 'null' || cleanPhone === 'undefined') {
            console.log('ð« Skipping SMS: No valid phone number provided');
            return;
        }

        if (cleanPhone.startsWith('00')) {
            console.log('ð§ª Test phone detected, skipping SMS:', cleanPhone);
            setSmsToast({
                show: true,
                message: `שליחה ל${displayName || 'לקוח'} לא הצליחה - מספר בדיקה`,
                isError: true
            });
            setTimeout(() => setSmsToast(null), 3000);
            return;
        }

        if (!navigator.onLine) {
            console.log('ð´ Offline: Skipping SMS and showing notification');
            setSmsToast({
                show: true,
                message: 'הודעת ה-SMS לא נשלחה (אין חיבור לאינטרנט)',
                isWarning: true
            });
            setTimeout(() => setSmsToast(null), 3000);
            return;
        }

        sentLogRef.current.set(idempotencyKey, Date.now());
        setIsSendingSms(true);

        const message = `היי ${displayName || 'אורח'}, ההזמנה שלכם מוכנה! ð¥³, מוזמנים לעגלה לאסוף אותה`;

        try {
            const result = await sendSms(cleanPhone, message);

            try {
                await supabase.from('sms_queue').insert({
                    phone: cleanPhone,
                    message: message,
                    status: result.success ? 'success' : 'failed',
                    error: result.error || null,
                    sent_at: result.success ? new Date().toISOString() : null,
                    order_id: orderId || null
                });
            } catch (logErr) {
                console.error('❌ Failed to log SMS to DB:', logErr);
            }

            setIsSendingSms(false);

            if (result.success) {
                sentLogRef.current.set(idempotencyKey, Date.now());
                setSmsToast({
                    show: true,
                    message: `הודעה נשלחה ל-${displayName || 'לקוח'} בהצלחה! ð¥³`,
                    isError: false
                });
                setTimeout(() => setSmsToast(null), 3000);
            } else {
                sentLogRef.current.delete(idempotencyKey);
                const errorMessage = result.isBlocked
                    ? result.error
                    : `שליחה ל${displayName || 'לקוח'} לא הצליחה - ${result.error || 'מספר שגוי'}`;

                setSmsToast({
                    show: true,
                    message: errorMessage,
                    isError: true
                });
                setTimeout(() => setSmsToast(null), 4000);
            }
        } catch (err) {
            console.error('❌ SMS error:', err);
            sentLogRef.current.delete(idempotencyKey);
            setIsSendingSms(false);
            setSmsToast({
                show: true,
                message: 'תקלת רשת בשליחת SMS',
                isError: true
            });
            setTimeout(() => setSmsToast(null), 3000);
        }
    };

    return {
        smsToast,
        setSmsToast,
        isSendingSms,
        handleSendSms
    };
};
