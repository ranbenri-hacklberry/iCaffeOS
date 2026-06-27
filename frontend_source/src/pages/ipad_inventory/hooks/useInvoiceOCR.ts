import { useState } from 'react';
import { compressAndToBase64, fileToBase64 } from '@/utils/imageUtils';
import { processInvoiceOCR } from '@/services/ocrService';

export const useInvoiceOCR = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<any>(null);

    const scanInvoice = async (file: File, businessId?: string) => {
        if (!file) return;
        setIsProcessing(true);
        setError(null);
        setOcrResult(null);

        try {
            let base64Image: string;
            if (file.type === 'application/pdf') {
                base64Image = await fileToBase64(file);
            } else {
                // Higher quality for OCR — invoices have small text that needs detail
                base64Image = await compressAndToBase64(file, {
                    maxWidth: 2500,
                    maxHeight: 2500, 
                    quality: 0.92
                });
            }

            const result = await processInvoiceOCR(base64Image, businessId);
            setOcrResult(result);
            return result;
        } catch (err: any) {
            console.error('OCR Error:', err);
            setError(err.message || 'שגיאה בעיבוד החשבונית');
        } finally {
            setIsProcessing(false);
        }
    };

    return { scanInvoice, isProcessing, error, ocrResult, resetOCR: () => setOcrResult(null) };
};
