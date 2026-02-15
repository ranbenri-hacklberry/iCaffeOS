/**
 * Marketing Routes - Instagram, SMS & AI Ad Generation
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { askMaya } from '../services/mayaService.js';
import adService from '../services/adService.js';
import fetch from 'node-fetch';

const router = express.Router();
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

const INSTAGRAM_WEBHOOK_URL = process.env.INSTAGRAM_WEBHOOK_URL;
const ASSETS_BUCKET = process.env.INSTAGRAM_ASSETS_BUCKET || 'icaffe-marketing';
const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;

// Templates for stories
const STORY_TEMPLATES = {
    vip_order: 'templates/vip-order.png',
    daily_special: 'templates/daily-special.png',
    low_stock_alert: 'templates/low-stock.png',
    milestone: 'templates/milestone.png',
    morning_vibes: 'templates/morning.png'
};

/**
 * Publis Story via Webhook
 */
router.post('/story', async (req, res) => {
    try {
        const { businessId, type = 'vip_order', caption, customImageUrl, metadata = {} } = req.body;

        // Choose Image
        let imageUrl = customImageUrl;
        if (!imageUrl && supabase) {
            const template = STORY_TEMPLATES[type] || STORY_TEMPLATES.vip_order;
            const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(template);
            imageUrl = data?.publicUrl;
        }

        if (!imageUrl || !INSTAGRAM_WEBHOOK_URL) {
            return res.status(400).json({ error: 'Missing Image URL or Webhook Config' });
        }

        // Send payload to Make/Zapier
        const payload = {
            type: 'instagram_story',
            imageUrl,
            caption,
            metadata: { ...metadata, businessId, source: 'maia_ai' }
        };

        const response = await fetch(INSTAGRAM_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Webhook failed');

        // Log action
        if (supabase) {
            await supabase.from('automation_logs').insert({
                business_id: businessId,
                action: 'story_posted',
                target: 'instagram',
                details: { type, caption, imageUrl },
                triggered_by: 'maia'
            });
        }

        res.json({ success: true, message: 'הסטורי נשלח לדנה (דרך ה-Webhook)!' });

    } catch (e) {
        console.error('Marketing Error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Generate Caption via Maia
 */
router.post('/generate-caption', async (req, res) => {
    try {
        const { businessId, context, style = 'עוקצני' } = req.body;
        const prompt = `כתבי טקסט ${style} לסטורי באינסטגרם על: ${context}. מקסימום 2 משפטים. בעברית.`;
        const caption = await askMaya(prompt, businessId);
        res.json({ caption });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Send SMS
 */
router.post('/sms', async (req, res) => {
    try {
        const { businessId, phone, message } = req.body;
        // ... validation ...
        const cleanPhone = phone.replace(/\D/g, '');

        // Send via SMS Provider
        if (!SMS_API_URL || !SMS_API_KEY) throw new Error('SMS Provider not configured');

        const response = await fetch(SMS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SMS_API_KEY}`
            },
            body: JSON.stringify({ to: cleanPhone, message, from: 'iCaffe' })
        });

        // Assume success for demo or check response

        if (supabase) {
            await supabase.from('automation_logs').insert({
                business_id: businessId,
                action: 'sms_sent',
                target: cleanPhone,
                details: { message },
                triggered_by: 'maia'
            });
        }

        res.json({ success: true });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ========================================
// AI AD GENERATION ENDPOINTS
// ========================================

/**
 * Enrich prompt using Mistral
 * POST /api/marketing/enrich-prompt
 */
router.post('/enrich-prompt', async (req, res) => {
    try {
        const { businessId, userPrompt, styleHint, context } = req.body;

        if (!userPrompt) {
            return res.status(400).json({ error: 'Missing userPrompt' });
        }

        const result = await adService.enrichPrompt(userPrompt, styleHint, context);
        res.json(result);

    } catch (e) {
        console.error('Enrich prompt error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Generate image using selected provider (local/gemini/grok)
 * POST /api/marketing/generate-image
 */
router.post('/generate-image', async (req, res) => {
    try {
        const {
            businessId,
            prompt,
            aspectRatio,
            seedImageBase64,
            style,
            provider = 'local',
            denoise = 0.75
        } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt' });
        }

        let imageBase64;

        // Fetch API keys from database (secure - server-side only!)
        const apiKeys = await adService.getBusinessApiKeys(businessId);

        switch (provider) {
            case 'canvas-design':
                // Professional design studio - no API key needed!
                console.log('[Marketing] Using Canvas Design for professional design...');
                imageBase64 = await adService.generateCanvasDesign(prompt, {
                    style: style || 'modern',
                    aspectRatio: aspectRatio || '1:1',
                    businessId
                });
                break;

            case 'grok':
                if (!apiKeys.grokKey) {
                    return res.status(400).json({
                        error: 'מפתח Grok לא מוגדר',
                        suggestion: 'הגדר מפתח Grok בהגדרות העסק'
                    });
                }
                imageBase64 = await adService.generateImageGrok(prompt, {
                    apiKey: apiKeys.grokKey,
                    seedImageBase64,
                    aspectRatio: aspectRatio || '1:1'
                });
                break;

            case 'local':
            default:
                const comfyAvailable = await adService.isComfyUIAvailable();
                if (!comfyAvailable) {
                    return res.status(503).json({
                        error: 'ComfyUI לא זמין',
                        suggestion: 'ודא ש-ComfyUI פועל על localhost:8188 או בחר ספק אחר'
                    });
                }
                imageBase64 = await adService.generateImageComfyUI(prompt, {
                    seedImageBase64,
                    aspectRatio: aspectRatio || '1:1',
                    denoise
                });
                break;
        }

        res.json({
            success: true,
            imageBase64,
            prompt,
            provider
        });

    } catch (e) {
        console.error('Generate image error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Composite Hebrew text on image using Sharp
 * POST /api/marketing/composite-hebrew
 */
router.post('/composite-hebrew', async (req, res) => {
    try {
        const {
            businessId,
            imageBase64,
            hebrewText,
            bodyText,
            textPosition,
            textColor,
            textSize,
            addLogo,
            logoUrl
        } = req.body;

        if (!imageBase64 || !hebrewText) {
            return res.status(400).json({ error: 'Missing imageBase64 or hebrewText' });
        }

        const finalImage = await adService.compositeHebrewText(imageBase64, {
            hebrewText,
            bodyText: bodyText || '',
            textPosition: textPosition || 'bottom',
            textColor: textColor || '#FFFFFF',
            textSize: textSize || 'large',
            addLogo: addLogo !== false,
            logoUrl
        });

        res.json({
            success: true,
            finalImage
        });

    } catch (e) {
        console.error('Composite Hebrew error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Full pipeline: Generate complete ad
 * POST /api/marketing/generate-ad
 */
router.post('/generate-ad', async (req, res) => {
    try {
        const {
            businessId,
            businessName,
            userPrompt,
            styleHint,
            seedImageBase64,
            textPosition,
            textColor,
            textSize,
            addLogo,
            logoUrl,
            aspectRatio,
            denoise = 0.75,
            provider = 'local' // local, gemini, grok
        } = req.body;

        if (!userPrompt) {
            return res.status(400).json({ error: 'Missing userPrompt' });
        }

        const result = await adService.generateAd(userPrompt, {
            businessId,
            businessName,
            styleHint,
            seedImageBase64,
            textPosition,
            textColor,
            textSize,
            addLogo,
            logoUrl,
            aspectRatio,
            denoise,
            provider
        });

        if (result.success) {
            // Log the generation
            if (supabase) {
                await supabase.from('automation_logs').insert({
                    business_id: businessId,
                    action: 'ad_generated',
                    target: 'local_ai',
                    details: {
                        prompt: userPrompt,
                        enrichedPrompt: result.enrichedPrompt,
                        hasSeedImage: !!seedImageBase64
                    },
                    triggered_by: 'maya_ad_agency'
                });
            }

            res.json(result);
        } else {
            res.status(500).json(result);
        }

    } catch (e) {
        console.error('Generate ad error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Check ComfyUI availability
 * GET /api/marketing/comfyui-status
 */
router.get('/comfyui-status', async (req, res) => {
    const available = await adService.isComfyUIAvailable();
    res.json({
        available,
        url: process.env.COMFYUI_URL || 'http://localhost:8188'
    });
});

/**
 * Get available providers for a business (without exposing keys!)
 * GET /api/marketing/providers/:businessId
 */
router.get('/providers/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        // Check ComfyUI
        const comfyAvailable = await adService.isComfyUIAvailable();

        // Check API keys (only boolean - never expose actual keys!)
        const apiKeys = await adService.getBusinessApiKeys(businessId);

        res.json({
            providers: {
                local: {
                    available: comfyAvailable,
                    name: 'מקומי (ComfyUI)',
                    description: comfyAvailable ? 'זמין ומוכן' : 'ComfyUI לא פועל'
                },
                'canvas-design': {
                    available: true,
                    name: 'סטודיו עיצוב',
                    description: 'עיצוב מקצועי ברמת מוזיאון - תמיד זמין ✨'
                },
                grok: {
                    available: !!apiKeys.grokKey,
                    name: 'xAI Grok',
                    description: apiKeys.grokKey ? 'מפתח מוגדר' : 'נדרש מפתח API'
                }
            }
        });
    } catch (e) {
        console.error('Get providers error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * Remove background from logo image
 * POST /api/marketing/remove-background
 * Body: { imageBase64: string }
 * Returns: { imageBase64: string } (PNG with transparent background)
 */
router.post('/remove-background', async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Missing imageBase64' });
        }

        console.log('[Marketing] Removing background from image...');

        // Use spawn to run Python script
        const { spawn } = await import('child_process');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const pythonScript = path.join(__dirname, '../scripts/remove_background.py');

        // Pass base64 via stdin, get base64 via stdout
        const python = spawn('python3', ['-c', `
import sys
import base64
sys.path.insert(0, '${path.dirname(pythonScript)}')
from remove_background import remove_bg_base64
input_b64 = sys.stdin.read().strip()
result = remove_bg_base64(input_b64)
print(result)
        `]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.stdin.write(imageBase64);
        python.stdin.end();

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('[Marketing] Python error:', errorOutput);
                return res.status(500).json({
                    error: 'נכשל בהסרת הרקע',
                    details: errorOutput || 'Python script failed'
                });
            }

            console.log('[Marketing] Background removed successfully');
            res.json({ imageBase64: output.trim() });
        });

    } catch (e) {
        console.error('Remove background error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
