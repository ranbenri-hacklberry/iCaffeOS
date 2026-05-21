import express from 'express';
import { writeFile, unlink } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);
const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const TEXT_MODEL = process.env.OCR_TEXT_MODEL || 'gemma4:e2b';
const SWIFT_OCR_PATH = join(import.meta.dirname, '..', 'scripts', 'ocr_livetext.swift');

// Strict system prompt — no conversational text, JSON only
const SYSTEM_PROMPT = `You are a strict data converter for Israeli supplier invoices and delivery notes.
Your ONLY output must be a raw JSON object matching the schema below.
ZERO conversational text before or after. No explanations, no markdown.

Rules:
- Item names must be in Hebrew exactly as they appear in the source text.
- Do NOT translate, fix, reverse, or modify any Hebrew text.
- Prices are in ILS (₪). Output numbers only, no currency symbols.
- If a field is missing, use null.
- category must be one of: חלבי, ירקות, קפואים, פירות, יבשים, משקאות, בשרי, ניקיון, אחר

JSON Schema:
{
  "document_type": "חשבונית | תעודת משלוח | הזמנה",
  "supplier_name": "string",
  "invoice_number": "string | null",
  "document_date": "YYYY-MM-DD | null",
  "total_amount": number | null,
  "items": [
    {
      "name": "string (Hebrew, as-is)",
      "category": "string",
      "unit": "string (יח׳ | ק״ג | ליטר | קרטון | מארז | אריזה)",
      "quantity": number,
      "price": number
    }
  ]
}`;

/**
 * Layer 1: Native macOS Vision OCR (Neural Engine, 0 VRAM)
 * Runs compiled Swift binary as async child process (won't block main thread)
 * Vision handles Hebrew natively in .accurate mode — no RTL fixes needed
 * No manual deskewing — Vision has built-in orientation detection
 */
async function runOCR(imagePath) {
    console.log(`👁️ [Layer 1] Running macOS Vision OCR (.accurate, he-IL) on: ${imagePath}`);
    const startTime = Date.now();

    try {
        const compiledPath = SWIFT_OCR_PATH.replace('.swift', '');
        const { existsSync } = await import('fs');
        
        const cmd = existsSync(compiledPath) ? compiledPath : 'swift';
        const args = existsSync(compiledPath) ? [imagePath] : [SWIFT_OCR_PATH, imagePath];
        
        const { stdout, stderr } = await execFileAsync(cmd, args, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024,
            encoding: 'utf-8'
        });

        if (stderr && stderr.trim()) {
            console.warn(`⚠️ [Vision OCR] stderr: ${stderr.trim().slice(0, 300)}`);
        }

        const text = stdout.trim();
        const elapsed = Date.now() - startTime;
        console.log(`✅ [Layer 1] Vision OCR complete in ${elapsed}ms — extracted ${text.length} chars`);

        return text;
    } catch (err) {
        console.error(`❌ [Layer 1] Vision OCR failed:`, err.message);
        throw new Error(`Vision OCR failed: ${err.message}`);
    }
}

/**
 * Layer 2: Gemma 4 structured text parsing via Ollama
 * Sends extracted text with strict JSON schema enforcement
 */
async function parseWithGemma(ocrText) {
    console.log(`🧠 [Layer 2] Sending ${ocrText.length} chars to ${TEXT_MODEL} for parsing...`);
    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: TEXT_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Extract all items from the following invoice/delivery note text:\n\n${ocrText}` }
            ],
            stream: false,
            format: "json",
            options: {
                temperature: 0.1,
                num_predict: 4096
            }
        })
    });

    if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Ollama Error: ${response.status} - ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.message?.content;

    if (!content || content.trim() === '') {
        throw new Error('Empty response from Gemma');
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ [Layer 2] Gemma parsing complete in ${elapsed}ms`);
    console.log(`📝 [Layer 2] Raw Gemma response:\n${content}`);

    // Parse the JSON response
    const parsed = JSON.parse(content);
    console.log(`📦 [Layer 2] Parsed ${parsed.items?.length || 0} items:`, JSON.stringify(parsed.items?.map(i => i.name), null, 2));

    return {
        ...parsed,
        _meta: {
            model: TEXT_MODEL,
            ocrChars: ocrText.length,
            parseTimeMs: elapsed,
            promptTokens: data.prompt_eval_count,
            evalTokens: data.eval_count
        }
    };
}

/**
 * POST /api/ocr/process
 * Two-layer pipeline:
 *   1. macOS Vision API extracts text from image (Neural Engine, 0 VRAM)
 *   2. Gemma 4 parses text into structured JSON (Ollama, format: "json")
 */
router.post('/process', async (req, res) => {
    let tempFilePath = null;

    try {
        const { base64Image, mimeType = 'image/jpeg' } = req.body;

        if (!base64Image) {
            return res.status(400).json({
                success: false,
                error: 'Missing base64Image in request body'
            });
        }

        // Strip data URL prefix if present
        let base64Data = base64Image;
        let actualMimeType = mimeType;

        if (base64Image.startsWith('data:')) {
            const commaIndex = base64Image.indexOf(',');
            if (commaIndex !== -1) {
                const header = base64Image.substring(0, commaIndex);
                const mimeMatch = header.match(/data:([^;]+)/);
                actualMimeType = mimeMatch ? mimeMatch[1] : mimeType;
                base64Data = base64Image.substring(commaIndex + 1);
            }
        }

        // Determine file extension
        const extMap = {
            'image/jpeg': '.jpg', 'image/jpg': '.jpg',
            'image/png': '.png', 'image/webp': '.webp',
            'image/heic': '.heic', 'image/heif': '.heif',
            'application/pdf': '.pdf'
        };
        const ext = extMap[actualMimeType] || '.jpg';

        // Save to temp file (async, won't block)
        tempFilePath = join(tmpdir(), `ocr_${randomUUID()}${ext}`);
        await writeFile(tempFilePath, Buffer.from(base64Data, 'base64'));
        console.log(`📄 Saved temp file: ${tempFilePath} (${actualMimeType})`);

        // Layer 1: Vision OCR (runs in child process — non-blocking)
        const ocrText = await runOCR(tempFilePath);
        console.log(`👁️ [Layer 1] Extracted text:\n---\n${ocrText}\n---`);

        if (!ocrText || ocrText.length < 10) {
            return res.status(422).json({
                success: false,
                error: 'לא הצלחנו לזהות טקסט בתמונה. נסה לצלם שוב עם תאורה טובה יותר.',
                ocrTextLength: ocrText?.length || 0
            });
        }

        // Layer 2: Gemma 4 parsing
        const result = await parseWithGemma(ocrText);

        if (!result.items || !Array.isArray(result.items)) {
            result.items = [];
        }

        console.log(`🎉 Pipeline complete: ${result.items.length} items extracted`);

        return res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('🚨 OCR Pipeline Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'OCR processing failed'
        });
    } finally {
        // Clean up temp file
        if (tempFilePath) {
            unlink(tempFilePath).catch(() => {});
        }
    }
});

// Rate limiting (simple in-memory)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

router.use((req, res, next) => {
    const clientIP = req.ip || req.connection?.remoteAddress;
    const now = Date.now();

    if (!requestCounts.has(clientIP)) {
        requestCounts.set(clientIP, { count: 1, windowStart: now });
    } else {
        const clientData = requestCounts.get(clientIP);
        if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
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

router.post('/send_sms_temp', async (req, res) => {
    const { phone, message } = req.body;
    try {
        console.log(`[Temp Route] Sending SMS to ${phone}...`);
        const response = await fetch("https://sapi.itnewsletter.co.il/api/restApiSms/sendSmsToRecipients", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                ApiKey: "5v$YW#4k2Dn@w96306$H#S7cMp@8t$6R",
                txtOriginator: "0548317887",
                destinations: phone,
                txtSMSmessage: message,
                dteToDeliver: "",
                txtAddInf: ""
            })
        });
        const resText = await response.text();
        console.log(`[Temp Route] Result:`, resText);
        return res.json({ success: true, result: resText });
    } catch (e) {
        console.error(`[Temp Route] Error:`, e.message);
        return res.json({ success: false, error: e.message });
    }
});

export default router;
