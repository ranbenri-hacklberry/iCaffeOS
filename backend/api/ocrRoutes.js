import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini with API key from environment (secure!)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * POST /api/ocr/process
 * Process an invoice image with Gemini Vision API
 * Request body: { base64Image: string, mimeType?: string }
 */
router.post('/process', async (req, res) => {
    if (!genAI) {
        return res.status(500).json({
            success: false,
            error: 'Gemini API key not configured on server'
        });
    }

    try {
        const { base64Image, mimeType = 'image/jpeg' } = req.body;

        if (!base64Image) {
            return res.status(400).json({
                success: false,
                error: 'Missing base64Image in request body'
            });
        }

        // Extract pure base64 if data URL is provided
        const base64Match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
        const actualMimeType = base64Match ? base64Match[1] : mimeType;
        const base64Data = base64Match ? base64Match[2] : base64Image;

        // Try Gemini models with fallback
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        let lastError = null;

        for (const modelName of models) {
            try {
                console.log(`🔍 Processing OCR with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const prompt = `נתח את המסמך המצורף (חשבונית, תעודת משלוח, או הזמנה) וחלץ את כל הפריטים למערך JSON.

**חשוב מאוד:**
1. זהה את **סוג המסמך** - האם כתוב "חשבונית", "תעודת משלוח", "משלוח", "הזמנה" או אחר
2. חלץ את **התאריך שמופיע על המסמך** (לא תאריך של היום!) - חפש תאריך ליד "תאריך:", "ת.משלוח", "תאריך הפקה" וכו'
3. זהה את **שם הספק** בדיוק כפי שמופיע על המסמך (בראש המסמך, בלוגו, או בחותמת)

שים לב לפרטים הקטנים: שמות פריטים בעברית כולל משקלים, כמותות ויחידות מידה.

עבור כל פריט, ספק את השדות הבאים:
- name: שם הפריט המלא בעברית (כולל משקל אם מופיע)
- category: קטגוריה מתאימה (חלבי, ירקות, קפואים, פירות, יבשים, משקאות)
- unit: יחידת מידה בדיוק כפי שמופיע (יח', ק"ג, ליטר, קרטון, מארז)
- quantity: הכמות המספרית בלבד
- price: מחיר ליחידה אחת כמספר בלבד (ללא סמל ₪)

החזר **רק** אובייקט JSON תקין בפורמט הבא:
{
  "document_type": "חשבונית" או "תעודת משלוח" או "הזמנה",
  "supplier_name": "שם הספק בדיוק כפי שמופיע על המסמך",
  "invoice_number": "מספר המסמך",  
  "document_date": "YYYY-MM-DD (התאריך שמופיע על המסמך!)",
  "total_amount": 0,
  "items": [
    { "name": "...", "category": "...", "unit": "...", "quantity": 0, "price": 0 }
  ]
}`;

                const result = await model.generateContent([
                    { text: prompt },
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: actualMimeType
                        }
                    }
                ]);

                const response = await result.response;
                const content = response.text();
                const usage = response.usageMetadata;

                if (!content || content.trim() === '') {
                    throw new Error('Empty response from model');
                }

                // Clean up markdown
                let cleanedContent = content.trim();
                if (cleanedContent.startsWith('```')) {
                    cleanedContent = cleanedContent
                        .replace(/^```json\s*/i, '')
                        .replace(/^```\s*/i, '')
                        .replace(/\s*```$/, '');
                }

                const parsed = JSON.parse(cleanedContent);
                if (!parsed.items || !Array.isArray(parsed.items)) {
                    parsed.items = [];
                }

                console.log(`✅ OCR successful with ${modelName}, found ${parsed.items.length} items`);

                return res.json({
                    success: true,
                    ...parsed,
                    usageMetadata: usage,
                    model: modelName
                });

            } catch (modelError) {
                console.error(`❌ Error with model ${modelName}:`, modelError.message);
                lastError = modelError;
                // Continue to next model
            }
        }

        // All models failed
        throw lastError || new Error('All OCR models failed');

    } catch (error) {
        console.error('🚨 OCR Processing Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'OCR processing failed'
        });
    }
});

// Rate limiting tracking (simple in-memory)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

router.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(clientIP)) {
        requestCounts.set(clientIP, { count: 1, windowStart: now });
    } else {
        const clientData = requestCounts.get(clientIP);
        if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
            // Reset window
            requestCounts.set(clientIP, { count: 1, windowStart: now });
        } else if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please wait a moment.'
            });
        } else {
            clientData.count++;
        }
    }

    next();
});

export default router;
