import { useState } from 'react';
import { sendSms } from '@/services/smsService';

/**
 * 📱 useKDSSms Hook
 * Handles the logic for sending SMS notifications to customers from the KDS.
 */
export const useKDSSms = () => {
    const [smsToast, setSmsToast] = useState(null);
    const [isSendingSms, setIsSendingSms] = useState(false);

    const handleSendSms = async (phone, customerName = null) => {
        // 🛠️ STRICT CHECK: Ensure phone exists and is valid before even attempting anything
        const cleanPhone = String(phone || '').trim();
        if (!cleanPhone || cleanPhone === '0500000000' || cleanPhone === 'null' || cleanPhone === 'undefined') {
            console.log('🚫 Skipping SMS: No valid phone number provided');
            return;
        }

        // Test phone support
        if (phone.startsWith('00')) {
            console.log('🧪 Test phone detected, skipping SMS:', phone);
            setSmsToast({
                show: true,
                message: `שליחה ל${customerName || 'לקוח'} לא הצליחה - מספר בדיקה`,
                isError: true
            });
            setTimeout(() => setSmsToast(null), 3000);
            return;
        }

        // 📴 OFFLINE CHECK
        if (!navigator.onLine) {
            console.log('📴 Offline: Skipping SMS and showing notification');
            setSmsToast({
                show: true,
                message: 'הודעת ה-SMS לא נשלחה (אין חיבור לאינטרנט)',
                isWarning: true
            });
            setTimeout(() => setSmsToast(null), 3000);
            return;
        }

        setIsSendingSms(true);

        const message = `היי ${customerName || 'אורח'}, ההזמנה שלכם מוכנה! 🎉, מוזמנים לעגלה לאסוף אותה`;

        try {
            const result = await sendSms(phone, message);
            setIsSendingSms(false);

            if (result.success) {
                setSmsToast({ show: true, message: `הודעה נשלחה ל${customerName || 'לקוח'} בהצלחה!` });
                setTimeout(() => setSmsToast(null), 2000);
            } else {
                const errorMessage = result.isBlocked
                    ? result.error
                    : `שליחה ל${customerName || 'לקוח'} לא הצליחה - ${result.error || 'מספר שגוי'}`;

                setSmsToast({
                    show: true,
                    message: errorMessage,
                    isError: true
                });
                setTimeout(() => setSmsToast(null), 4000);
            }
        } catch (err) {
            console.error('❌ SMS error:', err);
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
