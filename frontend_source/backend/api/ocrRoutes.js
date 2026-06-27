import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Client (Standardized as in backend_server.js)
const REMOTE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const REMOTE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const LOCAL_URL = process.env.LOCAL_SUPABASE_URL || process.env.VITE_LOCAL_SUPABASE_URL;
const LOCAL_KEY = process.env.LOCAL_SUPABASE_SERVICE_KEY || process.env.VITE_LOCAL_SUPABASE_ANON_KEY;

let supabase = null;

if (LOCAL_URL && LOCAL_KEY) {
    try {
        supabase = createClient(LOCAL_URL, LOCAL_KEY);
        console.log("🔌 OCR Route: Initialized Local Supabase Client.");
    } catch (e) {
        console.warn("⚠️ OCR Route: Failed to init local client, falling back to remote:", e.message);
    }
}

if (!supabase && REMOTE_URL && REMOTE_KEY) {
    try {
        supabase = createClient(REMOTE_URL, REMOTE_KEY);
        console.log("🔌 OCR Route: Initialized Remote Supabase Client.");
    } catch (e) {
        console.error("❌ OCR Route: Failed to init remote client:", e.message);
    }
}

// Helper to execute Tesseract CLI with a timeout
const runTesseract = (imagePath) => {
    return new Promise((resolve, reject) => {
        // Hard timeout of 15 seconds (15000 ms)
        const cmd = `/opt/homebrew/bin/tesseract "${imagePath}" stdout -l heb+eng --psm 6`;
        console.log(`🤖 Running Tesseract command: ${cmd} (timeout: 15s)`);
        exec(cmd, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Tesseract execution failed:`, stderr);
                return reject(error);
            }
            resolve(stdout);
        });
    });
};

// Helper to preprocess the image (grayscale L conversion) via Python
const preprocessImage = (imagePath) => {
    return new Promise((resolve, reject) => {
        const cmd = `python3 -c "from PIL import Image; Image.open('${imagePath}').convert('L').save('${imagePath}')"`;
        console.log(`🤖 Preprocessing image: ${cmd}`);
        exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Preprocessing failed:`, stderr);
                return reject(new Error(`Preprocessing failed: ${stderr || error.message}`));
            }
            resolve();
        });
    });
};

// Helper to convert all pages of PDF to PNG using pdftoppm
const convertPdfToPngs = (pdfPath, outputPathPrefix) => {
    return new Promise((resolve, reject) => {
        const cmd = `/opt/homebrew/bin/pdftoppm -png -r 150 "${pdfPath}" "${outputPathPrefix}"`;
        console.log(`🤖 Converting all pages of PDF to PNG: ${cmd}`);
        exec(cmd, { timeout: 25000 }, async (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ PDF conversion failed:`, stderr);
                return reject(new Error(`PDF conversion failed: ${stderr || error.message}`));
            }
            
            try {
                const dir = path.dirname(pdfPath);
                const prefix = path.basename(outputPathPrefix);
                const files = await fs.promises.readdir(dir);
                const pageFiles = files
                    .filter(f => f.startsWith(prefix) && f.endsWith('.png'))
                    .sort((a, b) => {
                        const numA = parseInt(a.replace(prefix + '-', '').replace('.png', '')) || 0;
                        const numB = parseInt(b.replace(prefix + '-', '').replace('.png', '')) || 0;
                        return numA - numB;
                    })
                    .map(f => path.join(dir, f));
                
                resolve(pageFiles);
            } catch (readErr) {
                reject(readErr);
            }
        });
    });
};

// Helper to split text into chunks by line to prevent Ollama timeout
const splitTextIntoChunks = (text, maxLength = 800) => {
    if (text.length <= maxLength) return [text];
    
    const lines = text.split('\n');
    const chunks = [];
    let currentChunk = '';
    
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > maxLength) {
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk);
            }
            currentChunk = line;
        } else {
            currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
        }
    }
    
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk);
    }
    
    return chunks;
};

/**
 * Helper to extract and parse JSON from model output
 */
const extractAndParseJSON = (text) => {
    // Escaping double quotes inside Hebrew words (e.g. בע"מ) to prevent JSON syntax errors
    const sanitize = (str) => str.replace(/([\u0590-\u05FF])"([\u0590-\u05FF])/g, '$1\\"$2');
    
    const trimmed = sanitize(text.trim());
    
    // First try: parse directly
    try {
        return JSON.parse(trimmed);
    } catch (e) {
        console.warn('⚠️ Direct JSON parse failed, trying regex extraction...');
    }

    // Second try: extract json block using regex
    try {
        const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const sanitizedMatch = sanitize(jsonMatch[0]);
            return JSON.parse(sanitizedMatch);
        }
    } catch (e) {
        console.error('❌ Regex JSON extraction and parse failed:', e);
    }

    throw new Error('Failed to parse a valid JSON from Ollama response.');
};

/**
 * Word overlap matching algorithm for entity resolution in Node.js
 */
const findBestMatch = (extractedName, closedList) => {
    if (!extractedName) return null;
    let bestMatch = null;
    let maxOverlap = 0;
    
    // Clean and split words for the extracted item name
    const extWords = extractedName.toLowerCase()
        .replace(/[^\w\s\u0590-\u05FF]/g, "") // remove punctuation
        .split(/\s+/)
        .filter(w => w.length >= 2); // only words >= 2 chars
        
    for (const dbItem of closedList) {
        const dbWords = dbItem.name.toLowerCase()
            .replace(/[^\w\s\u0590-\u05FF]/g, "")
            .split(/\s+/)
            .filter(w => w.length >= 2);
            
        // Count overlapping words (substring matches in either direction)
        const overlap = extWords.filter(w => dbWords.some(dbW => dbW.includes(w) || w.includes(dbW))).length;
        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            bestMatch = dbItem;
        }
    }
    
    return maxOverlap > 0 ? bestMatch : null;
};

/**
 * Heuristically parses structured invoices using regex and removes BiDi characters
 */
const parseInvoiceHeuristically = (rawText) => {
    const cleanText = rawText.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    const lines = cleanText.split('\n');
    const items = [];
    
    // Regex 1: With leading code/barcode (optionally followed by discount column at the end)
    const regexWithCode = /^(\d+)\s+([\u0590-\u05FF\w\s"\(\)\-\.\+\/]+?)\s+(?:(ק"ג|קג|יח׳|יח|יח')\s+)?(\d+\.\d+|\d+)\s+(\d+\.\d+|\d+)\s+(\d+\.\d+|\d+)(?:\s+(\d+(?:\.\d+)?))?\s*$/;
    
    // Regex 2: Without leading code
    const regexWithoutCode = /^([\u0590-\u05FF\w\s"\(\)\-\.\+\/]+?)\s+(?:(ק"ג|קג|יח׳|יח|יח')\s+)?(\d+\.\d+|\d+)\s+(\d+\.\d+|\d+)\s+(\d+\.\d+|\d+)(?:\s+(\d+(?:\.\d+)?))?\s*$/;

    // Regex 3: Reversed format (numbers first, e.g. layout-preserved PDF tables on page 2 & 3)
    const regexReversed = /^\s*(\d{1,6}\.\d+|\d{1,6})\s+(?:(\d{1,6}\.\d+|\d{1,6})\s+)?(\d{1,6}\.\d+|\d{1,6})\s+(\d{1,6}\.\d+|\d{1,6})\s+(?:(ק"ג|קג|יח׳|יח|יח')\s+)?([\u0590-\u05FFa-zA-Z\d\s"\(\)\-\.\+\/\?]+?)(?:\s+(?:תעודה|\d{7}|\d{2}\/\d{2}\/\d{4}).*)?\s*$/;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        
        let match = line.match(regexWithCode);
        if (match) {
            let name = match[2].trim();
            name = name
                .replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '')
                .replace(/^\d{2}\/\d{2}\/\d{2}\s+/, '')
                .replace(/^\d{5,9}\s+/, '')
                .replace(/^\d+\s+/, '')
                .replace(/^[a-zA-Z\?"\s\.\+]+/, '')
                .trim();
            const unit = match[3] || 'יח';
            const quantity = parseFloat(match[4]);
            const price = parseFloat(match[5]);
            if (name.length >= 2 && quantity > 0 && price >= 0) {
                items.push({ name, quantity, price, unit });
            }
            continue;
        }
        
        match = line.match(regexWithoutCode);
        if (match) {
            let name = match[1].trim();
            name = name
                .replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '')
                .replace(/^\d{2}\/\d{2}\/\d{2}\s+/, '')
                .replace(/^\d{5,9}\s+/, '')
                .replace(/^\d+\s+/, '')
                .replace(/^[a-zA-Z\?"\s\.\+]+/, '')
                .trim();
            const unit = match[2] || 'יח';
            const quantity = parseFloat(match[3]);
            const price = parseFloat(match[4]);
            if (name.length >= 2 && quantity > 0 && price >= 0 && !/^[\d\.\s]+$/.test(name)) {
                items.push({ name, quantity, price, unit });
            }
            continue;
        }

        match = line.match(regexReversed);
        if (match) {
            const quantity = parseFloat(match[4]);
            const price = parseFloat(match[3]);
            const unit = match[5] || 'יח';
            
            let rawNameAndCode = match[6].trim();
            const codeMatch = rawNameAndCode.match(/\b\d{1,14}\b/);
            let name = rawNameAndCode;
            if (codeMatch) {
                const itemCode = codeMatch[0];
                name = rawNameAndCode.replace(itemCode, '').replace(/\s+/g, ' ').trim();
            }

            name = name
                .replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '')
                .replace(/^\d{2}\/\d{2}\/\d{2}\s+/, '')
                .replace(/^\d{5,9}\s+/, '')
                .replace(/^\d+\s+/, '')
                .replace(/^[a-zA-Z\?"\s\.\+]+/, '')
                .trim();

            if (name.length >= 2 && quantity > 0 && price >= 0 && !/^[\d\.\s]+$/.test(name)) {
                items.push({ name, quantity, price, unit });
            }
        }
    }
    
    return items;
};

/**
 * Extracts structured metadata heuristically from plain OCR text
 */
const extractMetadataHeuristically = (ocrText) => {
    let document_type = 'חשבונית';
    let invoice_number = '';
    let document_date = '';
    let total_amount = 0;

    const cleanOcr = ocrText.replace(/[\u200E\u200F\u202A-\u202E]/g, '');

    if (cleanOcr.includes('תעודת משלוח') || cleanOcr.includes('ת.משלוח')) {
        document_type = 'תעודת משלוח';
    }

    const invMatch = cleanOcr.match(/(?:חשבונית מס|חשבונית|תעודה|מספר|מס)\s*:?\s*(\d{6,8})/i);
    if (invMatch) {
        invoice_number = invMatch[1];
    }

    const dateMatch = cleanOcr.match(/(\d{2})\/(\d{2})\/(\d{4}|\d{2})/);
    if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2];
        let year = dateMatch[3];
        if (year.length === 2) {
            year = `20${year}`;
        }
        document_date = `${year}-${month}-${day}`;
    }

    const amountMatch = cleanOcr.match(/(?:סה"כ|סה''כ|סהכת|סכום)\s*:?\s*([\d,]+\.\d{2}|[\d,]+)/i);
    if (amountMatch) {
        total_amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    return { document_type, invoice_number, document_date, total_amount };
};

/**
 * 📝 POST /api/ocr/process
 */
router.post('/process', async (req, res) => {
    const { base64Image, businessId: requestBusinessId } = req.body;
    
    if (!base64Image) {
        return res.status(400).json({ success: false, error: 'Missing base64Image payload.' });
    }

    const businessId = requestBusinessId || '22222222-2222-2222-2222-222222222222';
    console.log(`🔄 OCR Request received for business: ${businessId}. Processing...`);
    console.log(`📦 base64Image prefix: ${base64Image.substring(0, 100)}`);

    const tempDir = path.join(__dirname, '..', '..', 'temp');
    const tempFileName = `ocr_temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    let tempImagePath = path.join(tempDir, tempFileName);

    let tempFileCreated = false;
    let isPdf = false;
    let ocrText = '';
    let pageFilesToCleanup = [];
    let ocrTextChunks = [];

    // Phase 1: Pre-OCR Write and Preprocessing Validation (Fail early and prevent Ollama queue load)
    try {
        // Ensure temp directory exists inside workspace asynchronously
        await fs.promises.mkdir(tempDir, { recursive: true });

        // Clean up prefix if exists (e.g. data:image/png;base64,...)
        const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");
        const imageBuffer = Buffer.from(cleanBase64, 'base64');
        isPdf = imageBuffer.slice(0, 4).toString('ascii') === '%PDF';

        if (isPdf) {
            // Write temp pdf file
            const pdfPath = tempImagePath.replace('.png', '.pdf');
            await fs.promises.writeFile(pdfPath, imageBuffer);
            
            // Try digital text extraction first (instant and 100% accurate)
            let digitalText = '';
            try {
                const execPromise = (cmd) => new Promise((resolve, reject) => exec(cmd, (err, stdout) => err ? reject(err) : resolve(stdout)));
                digitalText = await execPromise(`pdftotext -layout "${pdfPath}" -`);
            } catch (err) {
                console.warn('⚠️ pdftotext extraction failed, falling back to OCR:', err.message);
            }

            const hasHebrew = /[\u0590-\u05FF]/.test(digitalText);
            if (digitalText && digitalText.trim().length > 100 && hasHebrew) {
                console.log('⚡ Digitally extracted vector text from PDF successfully! Bypassing OCR!');
                ocrText = digitalText;
                
                // Populate chunks for downstream Qwen fallback if heuristic misses
                ocrTextChunks = splitTextIntoChunks(ocrText, 500);

                try {
                    await fs.promises.unlink(pdfPath);
                } catch (err) {
                    console.warn('⚠️ Failed to clean up temp PDF file:', err.message);
                }
            } else {
                console.log('⚠️ PDF has no extractable digital text layer or lacks Hebrew. Running image OCR...');
                // Convert all pages of PDF to PNG
                const pngPrefix = pdfPath.replace('.pdf', '_page');
                const pageFiles = await convertPdfToPngs(pdfPath, pngPrefix);
                pageFilesToCleanup = pageFiles;
                
                // Delete temp pdf file
                try {
                    await fs.promises.unlink(pdfPath);
                } catch (err) {
                    console.warn('⚠️ Failed to clean up temp PDF file:', err.message);
                }
                
                // Process and run Tesseract OCR on each page sequentially
                console.log(`📄 PDF has ${pageFiles.length} pages. Running OCR on each page...`);
                const pageTexts = [];
                for (let i = 0; i < pageFiles.length; i++) {
                    const pageFile = pageFiles[i];
                    console.log(`🔍 Processing PDF Page ${i + 1}/${pageFiles.length}: ${pageFile}`);
                    
                    await preprocessImage(pageFile);
                    const text = await runTesseract(pageFile);
                    pageTexts.push(text);
                    
                    // Split this page's text into small chunks
                    const chunks = splitTextIntoChunks(text, 500);
                    ocrTextChunks.push(...chunks);

                    // Clean up page image file right away
                    try {
                        await fs.promises.unlink(pageFile);
                    } catch (err) {
                        console.warn(`⚠️ Failed to clean up page file ${pageFile}:`, err.message);
                    }
                }
                ocrText = pageTexts.map((text, i) => `--- PAGE ${i + 1} ---\n${text}`).join('\n\n');
            }
        } else {
            // Write temp png file
            await fs.promises.writeFile(tempImagePath, imageBuffer);
            tempFileCreated = true;
            console.log(`💾 Saved temporary image asynchronously to: ${tempImagePath}`);

            // Preprocess image to convert to grayscale L
            await preprocessImage(tempImagePath);
        }
    } catch (err) {
        console.error(`❌ Pre-OCR image write or preprocess validation failed:`, err);
        if (tempFileCreated) {
            try {
                await fs.promises.unlink(tempImagePath);
            } catch (cleanupErr) {
                console.warn(`⚠️ Cleanup failed for ${tempImagePath}:`, cleanupErr);
            }
        }
        return res.status(500).json({
            success: false,
            error: `Failed to prepare image for OCR: ${err.message}`
        });
    }

    // Phase 2: OCR, DB lookup, Ollama reasoning, and post-processing
    try {
        // 1. Run Tesseract OCR (only if not already done for PDF)
        if (!isPdf) {
            console.log('🔍 Step 1: Running Tesseract OCR...');
            ocrText = await runTesseract(tempImagePath);
            console.log(`✅ Step 1 complete. Extracted raw text length: ${ocrText.length}`);
            ocrTextChunks = splitTextIntoChunks(ocrText, 500);
        } else {
            console.log(`✅ PDF OCR complete. Total combined text length: ${ocrText.length}`);
        }

        if (ocrTextChunks.length === 0 || !ocrText || ocrText.trim().length === 0) {
            throw new Error('Tesseract OCR could not extract any text from the document.');
        }

        // 2. Vendor Lookup (Identify supplier from Raw Text)
        console.log('🔍 Step 2: Running Vendor Lookup...');
        let matchedSupplier = null;
        let closedList = [];

        if (supabase) {
            const { data: suppliers, error: supError } = await supabase
                .from('suppliers')
                .select('id, name')
                .eq('business_id', businessId);

            if (supError) {
                console.error('⚠️ Failed to fetch suppliers for lookup:', supError.message);
            } else if (suppliers && suppliers.length > 0) {
                for (const supplier of suppliers) {
                    const sName = supplier.name.toLowerCase().trim();
                    const cleanName = sName.replace(/(בע"מ|בעמ|בע\\|שיווק|סחר|Ltd|L.t.d.)/gi, "").trim();
                    const headerText = ocrText.substring(0, 800);
                    if (headerText.toLowerCase().includes(cleanName.toLowerCase())) {
                        matchedSupplier = supplier;
                        console.log(`🎯 Vendor Identified: ${supplier.name} (ID: ${supplier.id})`);
                        break;
                    }
                }
            }

            // 3. Fetch items for the matched supplier in a single SELECT query
            if (matchedSupplier) {
                const { data: dbItems, error: itemsError } = await supabase
                    .from('inventory_items')
                    .select('id, name')
                    .eq('supplier_id', matchedSupplier.id)
                    .eq('business_id', businessId);
                
                if (itemsError) {
                    console.error('⚠️ Failed to fetch inventory items for supplier:', itemsError.message);
                } else if (dbItems) {
                    closedList = dbItems;
                    console.log(`📦 Loaded closed dictionary of ${closedList.length} items for this supplier.`);
                }
            }
        }

        // 3.5 Heuristic Parser Attempt (Deterministic parsing for speed and 100% accuracy)
        console.log('🔍 Step 2.5: Attempting deterministic heuristic parser...');
        const heuristicItems = parseInvoiceHeuristically(ocrText);
        console.log(`🔍 Heuristic parser found ${heuristicItems.length} items.`);

        if (heuristicItems.length >= 5) {
            console.log('⚡ Heuristic parsing succeeded with sufficient items. Bypassing Ollama!');
            const metadata = extractMetadataHeuristically(ocrText);
            
            const matchedItems = [];
            const unmatchedItems = [];

            for (const item of heuristicItems) {
                const rawName = item.name;
                const quantity = item.quantity;
                const price = item.price;
                const unit = item.unit || 'יח׳';

                const bestMatch = closedList.length > 0 ? findBestMatch(rawName, closedList) : null;
                if (bestMatch) {
                    matchedItems.push({
                        inventory_item_id: bestMatch.id,
                        name: bestMatch.name,
                        quantity,
                        price,
                        unit
                    });
                    console.log(`🔗 Match Verified: "${rawName}" -> "${bestMatch.name}" (ID: ${bestMatch.id})`);
                } else {
                    unmatchedItems.push({
                        raw_name: rawName,
                        quantity,
                        price,
                        unit
                    });
                    console.log(`❓ Unmatched item: "${rawName}"`);
                }
            }

            return res.json({
                success: true,
                document_type: metadata.document_type,
                supplier_name: matchedSupplier ? matchedSupplier.name : 'Unknown',
                supplier_id: matchedSupplier ? matchedSupplier.id : null,
                invoice_number: metadata.invoice_number,
                document_date: metadata.document_date,
                total_amount: metadata.total_amount,
                items: matchedItems,
                unmatched_items: unmatchedItems
            });
        }

        // 4. Compact string serialization of closedList to optimize token usage
        let closedListStr = '';
        if (closedList && closedList.length > 0) {
            closedListStr = closedList.map(item => `ID: ${item.id} | Name: ${item.name}`).join('\n');
        } else {
            closedListStr = '(אין פריטים ברשימה הסגורה - סווג את כל הפריטים תחת "unmatched_items")';
        }

        // 5. Call Ollama with Qwen3.5:2b for dynamic mapping (page by page to respect 30s timeout)
        console.log(`🤖 Step 3: Sending ${ocrTextChunks.length} page(s) to Ollama Qwen3.5:2b sequentially...`);
        
        const systemPrompt = `Extract items from Hebrew OCR text to JSON. Return ONLY valid JSON.
Output Schema:
{
  "document_type": "תעודת משלוח" or "חשבונית",
  "invoice_number": "...",
  "document_date": "YYYY-MM-DD",
  "total_amount": 0.0,
  "items": [
    { "name": "...", "quantity": 0.0, "price": 0.0, "unit": "קג" or "יח" }
  ]
}`;

        const matchedItems = [];
        const unmatchedItems = [];
        let finalDocType = 'חשבונית';
        let finalInvoiceNumber = '';
        let finalDocDate = '';
        let finalTotalAmount = 0;

        for (let i = 0; i < ocrTextChunks.length; i++) {
            const chunk = ocrTextChunks[i];
            console.log(`🤖 Processing page chunk ${i + 1}/${ocrTextChunks.length} (length: ${chunk.length})...`);
            
            const userPrompt = `Raw Invoice OCR Text:\n${chunk}`;

            const ollamaPayload = {
                model: 'qwen3.5:2b',
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                stream: false,
                think: false, // Disables thinking trace to save CPU/RAM/VRAM and start generating response immediately
                keep_alive: '5m',
                options: {
                    num_predict: 1000 // Limit output to prevent infinite loops and save CPU time
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // Strict 30s timeout

            try {
                const ollamaResponse = await fetch('http://127.0.0.1:11434/api/generate', {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ollamaPayload)
                });
                clearTimeout(timeoutId);

                if (!ollamaResponse.ok) {
                    throw new Error(`Ollama request failed with status: ${ollamaResponse.status}`);
                }

                const ollamaData = await ollamaResponse.json();
                const structuredText = ollamaData.response;
                console.log(`🟢 Ollama Raw Page ${i + 1} Response:`, structuredText);

                const parsedJson = extractAndParseJSON(structuredText);

                // Merge metadata across pages
                if (parsedJson.document_type) {
                    finalDocType = parsedJson.document_type;
                }
                if (parsedJson.invoice_number && parsedJson.invoice_number.trim()) {
                    finalInvoiceNumber = parsedJson.invoice_number;
                }
                if (parsedJson.document_date && parsedJson.document_date.trim()) {
                    finalDocDate = parsedJson.document_date;
                }
                if (parsedJson.total_amount && parsedJson.total_amount > 0) {
                    finalTotalAmount = Math.max(finalTotalAmount, parsedJson.total_amount);
                }

                const extractedItems = parsedJson.items || [];

                for (const item of extractedItems) {
                    const rawName = item.name || 'פריט לא מזוהה';
                    const quantity = item.quantity || 0;
                    const price = item.price || 0;
                    const unit = item.unit || 'יח׳';

                    // Resolve rawName to closedList using deterministic word-overlap matcher
                    const bestMatch = closedList.length > 0 ? findBestMatch(rawName, closedList) : null;
                    if (bestMatch) {
                        matchedItems.push({
                            inventory_item_id: bestMatch.id, // Number type from database
                            name: bestMatch.name,
                            quantity,
                            price,
                            unit
                        });
                        console.log(`🔗 Match Verified: "${rawName}" -> "${bestMatch.name}" (ID: ${bestMatch.id})`);
                    } else {
                        unmatchedItems.push({
                            raw_name: rawName,
                            quantity,
                            price,
                            unit
                        });
                        console.log(`❓ Unmatched item: "${rawName}"`);
                    }
                }
            } catch (chunkErr) {
                clearTimeout(timeoutId);
                console.warn(`⚠️ Ollama request/parse for chunk ${i + 1} failed or timed out:`, chunkErr.message);
                // Continue gracefully to next chunk so user gets remaining data
            }
        }

        // Return structured results to frontend
        return res.json({
            success: true,
            document_type: finalDocType,
            supplier_name: matchedSupplier ? matchedSupplier.name : 'Unknown',
            supplier_id: matchedSupplier ? matchedSupplier.id : null,
            invoice_number: finalInvoiceNumber,
            document_date: finalDocDate,
            total_amount: finalTotalAmount,
            items: matchedItems,
            unmatched_items: unmatchedItems
        });

    } catch (err) {
        console.error('❌ OCR/Ollama processing error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Error occurred during OCR processing.'
        });
    } finally {
        // Guarantee clean up of temporary image file asynchronously in finally block
        try {
            const exists = await fs.promises.access(tempImagePath).then(() => true).catch(() => false);
            if (exists) {
                await fs.promises.unlink(tempImagePath);
                console.log(`🗑️ Temporary image file deleted asynchronously: ${tempImagePath}`);
            }
        } catch (cleanupErr) {
            console.error('⚠️ Failed to delete temporary image file asynchronously:', cleanupErr);
        }
        // Cleanup any residual page files if they exist
        for (const file of pageFilesToCleanup) {
            try {
                const exists = await fs.promises.access(file).then(() => true).catch(() => false);
                if (exists) {
                    await fs.promises.unlink(file);
                    console.log(`🗑️ Residual page file deleted: ${file}`);
                }
            } catch (err) {
                // Ignore
            }
        }
    }
});

export default router;
