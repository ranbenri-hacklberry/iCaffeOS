/**
 * adService.js - Digital Ad Agency Backend Orchestrator
 *
 * Multi-stage AI pipeline for generating marketing visuals:
 * 1. Prompt Enrichment (Mistral/Ollama)
 * 2. Image Generation (ComfyUI, Gemini, or Grok)
 * 3. Hebrew Text Compositing (Sharp)
 *
 * Supports seed images for background control.
 * API keys are fetched from database - never exposed to browser!
 */

import fetch from 'node-fetch';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { getBusinessApiKeys as getBusinessApiKeysFromSecrets } from './secretsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://localhost:8188';
const FONTS_DIR = path.join(__dirname, '../assets/fonts');
const DEFAULT_HEBREW_FONT = path.join(FONTS_DIR, 'Heebo-Bold.ttf');

// Supabase for fetching API keys securely
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Fetch API keys securely from business_secrets table (server-side only!)
 * 🔒 REFACTORED: Now uses secretsService
 */
async function getBusinessApiKeys(businessId) {
    return getBusinessApiKeysFromSecrets(businessId);
}

/**
 * Step 1: Enrich prompt using local Mistral (Ollama)
 * Transforms vague Hebrew input into detailed English SD prompt
 */
export async function enrichPrompt(userPrompt, styleHint = '', businessContext = '') {
    const systemPrompt = `You are a professional Stable Diffusion prompt engineer specializing in food and beverage photography for cafes and restaurants.

Your task: Transform the user's marketing request into a highly detailed, artistic English prompt suitable for product photography.

Guidelines:
- Focus on appetizing food/drink presentation
- Include specific lighting (soft natural, studio, golden hour)
- Describe composition (close-up, flat lay, hero shot)
- Add atmosphere (cozy cafe, modern minimalist, rustic)
- Include technical photography terms
- DO NOT include any Hebrew or non-English text
- Keep prompt under 200 words
- End with: "professional food photography, high resolution, 8k"

Style hint to incorporate: ${styleHint || 'modern and clean'}
Business context: ${businessContext || 'local cafe'}`;

    const userMessage = `Create a detailed image generation prompt for this marketing request: "${userPrompt}"`;

    try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 300
                }
            })
        });

        if (!response.ok) throw new Error('Ollama request failed');

        const data = await response.json();
        const enrichedPrompt = data.response?.trim() || '';

        // Extract suggested overlay text from the original Hebrew
        const suggestedOverlay = extractOverlayText(userPrompt);

        return {
            enrichedPrompt,
            suggestedOverlay,
            originalPrompt: userPrompt
        };
    } catch (error) {
        console.error('Prompt enrichment error:', error);
        // Fallback: Create a basic prompt
        return {
            enrichedPrompt: `Delicious food and beverages in a cozy cafe setting, appetizing presentation, warm lighting, professional food photography, high resolution`,
            suggestedOverlay: extractOverlayText(userPrompt),
            originalPrompt: userPrompt
        };
    }
}

/**
 * Extract overlay text from Hebrew input
 * Finds price, percentage, or key phrases
 */
function extractOverlayText(hebrewText) {
    // Extract price patterns like "25 שח" or "₪25"
    const priceMatch = hebrewText.match(/(\d+)\s*(שח|ש״ח|₪|שקל)/i);
    if (priceMatch) {
        return `₪${priceMatch[1]}`;
    }

    // Extract percentage patterns
    const percentMatch = hebrewText.match(/(\d+)\s*%/);
    if (percentMatch) {
        return `${percentMatch[1]}% הנחה`;
    }

    // Return first phrase (up to 30 chars)
    return hebrewText.slice(0, 30);
}

/**
 * Step 2A: Generate image using ComfyUI
 * Supports optional seed image for img2img workflow
 */
export async function generateImageComfyUI(prompt, options = {}) {
    const {
        seedImageBase64 = null,
        aspectRatio = '1:1',
        denoise = 0.75 // For img2img
    } = options;

    // Determine dimensions based on aspect ratio (SD1.5 optimized - 512px base)
    const dimensions = {
        '1:1': { width: 512, height: 512 },
        '4:5': { width: 512, height: 640 },
        '9:16': { width: 512, height: 896 },
        '16:9': { width: 896, height: 512 }
    };
    const { width, height } = dimensions[aspectRatio] || dimensions['1:1'];

    // Build ComfyUI workflow
    const workflow = seedImageBase64
        ? buildImg2ImgWorkflow(prompt, seedImageBase64, width, height, denoise)
        : buildTxt2ImgWorkflow(prompt, width, height);

    try {
        // Queue the prompt
        const queueResponse = await fetch(`${COMFYUI_URL}/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: workflow })
        });

        if (!queueResponse.ok) throw new Error('ComfyUI queue failed');

        const { prompt_id } = await queueResponse.json();
        console.log(`[AdService] ComfyUI job queued: ${prompt_id}`);

        // Poll for completion
        const result = await pollComfyUIResult(prompt_id);
        return result;

    } catch (error) {
        console.error('ComfyUI generation error:', error);
        throw error;
    }
}

/**
 * Build txt2img workflow for ComfyUI
 */
function buildTxt2ImgWorkflow(prompt, width, height) {
    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000000),
                "steps": 20,
                "cfg": 7,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "dreamshaper_8.safetensors"
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt,
                "clip": ["4", 1]
            }
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": "ugly, blurry, low quality, text, watermark, logo, deformed",
                "clip": ["4", 1]
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "ad_gen",
                "images": ["8", 0]
            }
        }
    };
}

/**
 * Build img2img workflow for ComfyUI (with seed image)
 */
function buildImg2ImgWorkflow(prompt, seedImageBase64, width, height, denoise) {
    // Note: This is a simplified workflow. Real img2img requires
    // loading the image and encoding it to latent space first.
    return {
        "1": {
            "class_type": "LoadImageBase64",
            "inputs": {
                "image": seedImageBase64
            }
        },
        "2": {
            "class_type": "VAEEncode",
            "inputs": {
                "pixels": ["1", 0],
                "vae": ["4", 2]
            }
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": Math.floor(Math.random() * 1000000000),
                "steps": 20,
                "cfg": 7,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": denoise,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["2", 0]
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": "dreamshaper_8.safetensors"
            }
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt,
                "clip": ["4", 1]
            }
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": "ugly, blurry, low quality, text, watermark, logo, deformed",
                "clip": ["4", 1]
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "ad_gen_i2i",
                "images": ["8", 0]
            }
        }
    };
}

/**
 * Poll ComfyUI for job completion
 */
async function pollComfyUIResult(promptId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const historyResponse = await fetch(`${COMFYUI_URL}/history/${promptId}`);
        if (!historyResponse.ok) continue;

        const history = await historyResponse.json();
        const jobHistory = history[promptId];

        if (jobHistory && jobHistory.outputs) {
            // Find the output image
            for (const nodeId of Object.keys(jobHistory.outputs)) {
                const output = jobHistory.outputs[nodeId];
                if (output.images && output.images.length > 0) {
                    const imageInfo = output.images[0];

                    // Fetch the image
                    const imageResponse = await fetch(
                        `${COMFYUI_URL}/view?filename=${imageInfo.filename}&subfolder=${imageInfo.subfolder || ''}&type=${imageInfo.type}`
                    );

                    if (imageResponse.ok) {
                        const imageBuffer = await imageResponse.buffer();
                        return imageBuffer.toString('base64');
                    }
                }
            }
        }
    }

    throw new Error('ComfyUI job timed out');
}

/**
 * Step 2B: Generate image using Gemini (Imagen 3)
 */
export async function generateImageGemini(prompt, options = {}) {
    const { apiKey, seedImageBase64 = null } = options;

    if (!apiKey) {
        throw new Error('מפתח Gemini לא מוגדר. הגדר אותו בהגדרות העסק.');
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Gemini 2.0 Flash with image generation
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp-image-generation',
            generationConfig: {
                responseModalities: ['Text', 'Image']
            }
        });

        // Build the prompt
        let finalPrompt = prompt;
        if (seedImageBase64) {
            // Analyze seed image first
            const analysisModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const analysisResult = await analysisModel.generateContent([
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: seedImageBase64
                    }
                },
                'Briefly describe the colors, style, and mood of this image.'
            ]);
            const imageContext = analysisResult.response.text();
            finalPrompt = `${prompt}. Style inspired by: ${imageContext}`;
        }

        console.log('[AdService] Gemini generating with prompt:', finalPrompt.slice(0, 100));

        const result = await model.generateContent(finalPrompt);
        const response = result.response;

        // Extract the generated image
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; // Base64 image
            }
        }

        throw new Error('Gemini לא החזיר תמונה');

    } catch (error) {
        console.error('[AdService] Gemini generation error:', error);
        throw new Error(`שגיאת Gemini: ${error.message}`);
    }
}

/**
 * Step 2C: Generate image using Grok (Aurora)
 * xAI's image generation model
 * Note: Grok doesn't support seed images (img2img) - only text-to-image
 */
export async function generateImageGrok(prompt, options = {}) {
    const { apiKey, seedImageBase64 = null, aspectRatio = '1:1' } = options;

    if (!apiKey) {
        throw new Error('מפתח Grok לא מוגדר. הגדר אותו בהגדרות העסק.');
    }

    // Warn about seed images not being supported
    if (seedImageBase64) {
        console.warn('[AdService] Grok does not support seed images - ignoring');
    }

    try {
        console.log('[AdService] Grok generating with prompt:', prompt.slice(0, 100));

        // xAI Grok API for image generation
        const response = await fetch('https://api.x.ai/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-2-image-1212',
                prompt: prompt,
                n: 1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AdService] Grok API error response:', errorText);
            let errorMsg = `Grok API error: ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMsg = errorData.error?.message || errorMsg;
            } catch (e) { }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Handle URL response format
        if (data.data && data.data[0]) {
            if (data.data[0].b64_json) {
                return data.data[0].b64_json;
            }
            // If URL returned, fetch and convert to base64
            if (data.data[0].url) {
                console.log('[AdService] Grok returned URL, fetching image...');
                const imgResponse = await fetch(data.data[0].url);
                const buffer = await imgResponse.arrayBuffer();
                return Buffer.from(buffer).toString('base64');
            }
        }

        throw new Error('Grok לא החזיר תמונה');

    } catch (error) {
        console.error('[AdService] Grok generation error:', error);
        throw new Error(`שגיאת Grok: ${error.message}`);
    }
}

/**
 * Step 3: Composite Hebrew text overlay using Sharp
 */
export async function compositeHebrewText(imageBase64, options = {}) {
    const {
        hebrewText,
        bodyText = '', // Description line
        textPosition = 'bottom', // top, center, bottom
        textColor = '#FFFFFF',
        textSize = 'large', // small, medium, large
        addLogo = true,
        logoUrl = null,
        addBackground = true // Semi-transparent background behind text
    } = options;

    // Font sizes
    const fontSizes = {
        small: 48,
        medium: 72,
        large: 96
    };
    const fontSize = fontSizes[textSize] || 72;

    try {
        // Use Python PIL for text overlay (supports Assistant font directly)
        const textWithPython = await addHebrewTextWithPython(imageBase64, {
            hebrewText,
            bodyText,
            fontSize,
            textColor,
            textPosition,
            addBackground,
            addLogo,
            logoUrl
        });

        return textWithPython;

    } catch (error) {
        console.error('Hebrew compositing error:', error);
        throw error;
    }
}

/**
 * Add Hebrew text overlay using Python PIL with Assistant font
 */
async function addHebrewTextWithPython(imageBase64, options) {
    const {
        hebrewText,
        bodyText = '',
        fontSize = 72,
        textColor = '#FFFFFF',
        textPosition = 'bottom',
        addBackground = true,
        addLogo = false,
        logoUrl = null
    } = options;

    return new Promise((resolve, reject) => {
        const { spawn } = require('child_process');

        // Convert hex color to RGB tuple
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : '(255, 255, 255)';
        };

        const rgbColor = hexToRgb(textColor);
        // Use DejaVu Sans (available on system, supports Hebrew well)
        const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
        const descFontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
        // Smaller sizes for better aesthetics
        const adjustedTitleSize = Math.round(fontSize * 0.7);
        const descSize = Math.round(adjustedTitleSize * 0.65);

        const pythonCode = `
import base64
import io
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Decode base64 image
img_data = base64.b64decode('${imageBase64}')
img = Image.open(io.BytesIO(img_data)).convert('RGBA')
width, height = img.size

# Create overlay for text
overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# Load fonts
try:
    title_font = ImageFont.truetype('${fontPath.replace(/\\/g, '\\\\')}', ${adjustedTitleSize})
    desc_font = ImageFont.truetype('${descFontPath.replace(/\\/g, '\\\\')}', ${descSize})
except:
    print("Error loading fonts", file=sys.stderr)
    title_font = ImageFont.load_default()
    desc_font = ImageFont.load_default()

# Text to add
title_text = '''${hebrewText.replace(/'/g, "\\'")}'''
desc_text = '''${bodyText.replace(/'/g, "\\'")}'''
has_desc = len(desc_text.strip()) > 0

# Calculate text bounding boxes
title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
title_width = title_bbox[2] - title_bbox[0]
title_height = title_bbox[3] - title_bbox[1]

desc_width = 0
desc_height = 0
if has_desc:
    desc_bbox = draw.textbbox((0, 0), desc_text, font=desc_font)
    desc_width = desc_bbox[2] - desc_bbox[0]
    desc_height = desc_bbox[3] - desc_bbox[1]

# Position calculations - smaller padding, tighter spacing
padding = 40
right_margin = 40
line_spacing = 8

# Calculate Y positions based on textPosition
if '${textPosition}' == 'top':
    title_y = padding + title_height
    desc_y = title_y + desc_height + line_spacing if has_desc else 0
elif '${textPosition}' == 'center':
    total_height = title_height + (desc_height + line_spacing if has_desc else 0)
    title_y = (height - total_height) // 2 + title_height
    desc_y = title_y + desc_height + line_spacing if has_desc else 0
else:  # bottom
    if has_desc:
        desc_y = height - padding
        title_y = desc_y - desc_height - line_spacing
    else:
        title_y = height - padding - title_height // 2

# Add semi-transparent background for readability
${addBackground ? `
bg_overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
bg_draw = ImageDraw.Draw(bg_overlay)
if '${textPosition}' == 'top':
    bg_draw.rectangle([(0, 0), (width, title_y + desc_height + padding * 2)], fill=(0, 0, 0, 180))
elif '${textPosition}' == 'center':
    total_h = title_height + (desc_height + line_spacing if has_desc else 0) + padding * 2
    start_y = (height - total_h) // 2
    bg_draw.rectangle([(0, start_y), (width, start_y + total_h)], fill=(0, 0, 0, 180))
else:
    start_y = title_y - padding if not has_desc else title_y - title_height - padding
    bg_draw.rectangle([(0, start_y), (width, height)], fill=(0, 0, 0, 180))
img = Image.alpha_composite(img, bg_overlay)
` : ''}

# Draw text with outline for better visibility
text_color = ${rgbColor} + (255,)
outline_color = (0, 0, 0, 255)
outline_width = max(2, ${adjustedTitleSize} // 20)

# Draw title with outline - aligned to right
title_x = width - right_margin - title_width
for adj_x in range(-outline_width, outline_width + 1):
    for adj_y in range(-outline_width, outline_width + 1):
        draw.text((title_x + adj_x, title_y + adj_y), title_text, font=title_font, fill=outline_color, anchor='ls')
draw.text((title_x, title_y), title_text, font=title_font, fill=text_color, anchor='ls')

# Draw description with outline (if exists) - aligned to right
if has_desc:
    desc_x = width - right_margin - desc_width
    desc_outline_width = max(2, ${descSize} // 20)
    for adj_x in range(-desc_outline_width, desc_outline_width + 1):
        for adj_y in range(-desc_outline_width, desc_outline_width + 1):
            draw.text((desc_x + adj_x, desc_y + adj_y), desc_text, font=desc_font, fill=outline_color, anchor='ls')
    draw.text((desc_x, desc_y), desc_text, font=desc_font, fill=text_color, anchor='ls')

# Composite overlay onto image
img = Image.alpha_composite(img, overlay)

# Convert back to RGB for output
img = img.convert('RGB')

# Output as base64
output = io.BytesIO()
img.save(output, format='PNG')
output_base64 = base64.b64encode(output.getvalue()).decode('utf-8')
print(output_base64)
`;

        const python = spawn('python', ['-c', pythonCode]);
        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('[HebrewText] Python error:', errorOutput);
                reject(new Error(`Python text overlay failed: ${errorOutput}`));
            } else {
                const base64Result = output.trim();
                resolve(base64Result);
            }
        });
    });
}

/**
 * Load font file and convert to base64
 */
async function loadFontAsBase64(fontFileName) {
    const fontPath = path.join(FONTS_DIR, fontFileName);
    try {
        const fontBuffer = fs.readFileSync(fontPath);
        return fontBuffer.toString('base64');
    } catch (error) {
        console.error(`Failed to load font ${fontFileName}:`, error);
        return ''; // Return empty string if font loading fails
    }
}

/**
 * Create SVG with Hebrew text (RTL support + shadows/outline for readability)
 * Uses system fonts for reliable rendering
 */
async function createHebrewTextSvg(text, options) {
    const { fontSize, textColor, width, position, addBackground, bodyText } = options;

    // Font sizes: title is fontSize, description is smaller
    const titleSize = fontSize;
    const descSize = Math.round(fontSize * 0.55);
    const hasDescription = bodyText && bodyText.trim().length > 0;

    console.log('📝 Creating SVG text:', { title: text, bodyText, hasDescription });

    // Calculate heights - more space for two lines
    const lineSpacing = hasDescription ? 15 : 0;
    const totalTextHeight = titleSize + (hasDescription ? descSize + lineSpacing : 0);
    const svgHeight = totalTextHeight + 50;

    // Y positions
    const titleY = titleSize + 15;
    const descY = hasDescription ? titleY + descSize + lineSpacing : 0;

    // Stroke width for outline effect
    const strokeWidth = Math.max(3, titleSize / 20);
    const descStrokeWidth = Math.max(2, descSize / 20);

    // Use Assistant font for Hebrew text (with fallbacks)
    const fontFamily = "'Assistant', 'DejaVu Sans', 'Liberation Sans', 'Arial', sans-serif";

    // Load Assistant fonts as base64
    const assistantBold = await loadFontAsBase64('Assistant-Bold.ttf');
    const assistantRegular = await loadFontAsBase64('Assistant-Regular.ttf');

    return `
        <svg width="${width}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.9)" flood-opacity="0.9"/>
                </filter>
            </defs>
            <style>
                @font-face {
                    font-family: 'Assistant';
                    src: url('data:font/truetype;charset=utf-8;base64,${assistantBold}') format('truetype');
                    font-weight: bold;
                }
                @font-face {
                    font-family: 'Assistant';
                    src: url('data:font/truetype;charset=utf-8;base64,${assistantRegular}') format('truetype');
                    font-weight: normal;
                }
                .title-text {
                    font-family: ${fontFamily};
                    font-size: ${titleSize}px;
                    font-weight: bold;
                    text-anchor: middle;
                }
                .desc-text {
                    font-family: ${fontFamily};
                    font-size: ${descSize}px;
                    font-weight: normal;
                    text-anchor: middle;
                }
                .stroke {
                    fill: none;
                    stroke: #000000;
                    stroke-linejoin: round;
                }
                .fill {
                    fill: ${textColor};
                    filter: url(#textShadow);
                }
            </style>

            <!-- Title: Black outline first -->
            <text x="${width / 2}" y="${titleY}" class="title-text stroke" style="stroke-width: ${strokeWidth}px">${escapeXml(text)}</text>
            <!-- Title: White fill on top -->
            <text x="${width / 2}" y="${titleY}" class="title-text fill">${escapeXml(text)}</text>

            ${hasDescription ? `
            <!-- Description: Black outline first -->
            <text x="${width / 2}" y="${descY}" class="desc-text stroke" style="stroke-width: ${descStrokeWidth}px">${escapeXml(bodyText)}</text>
            <!-- Description: White fill on top -->
            <text x="${width / 2}" y="${descY}" class="desc-text fill">${escapeXml(bodyText)}</text>
            ` : ''}
        </svg>
    `;

    // Log the SVG for debugging
    // console.log('Generated SVG:', svgResult);
}

/**
 * Create gradient overlay SVG
 */
function createGradientOverlay(width, height, position) {
    const gradientId = position === 'top' ? 'gradTop' : 'gradBottom';
    const y1 = position === 'top' ? '0%' : '100%';
    const y2 = position === 'top' ? '50%' : '50%';

    return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="${gradientId}" x1="0%" y1="${y1}" x2="0%" y2="${y2}">
                    <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0.7" />
                    <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height / 3}" fill="url(#${gradientId})"
                  ${position === 'bottom' ? `y="${height * 2 / 3}"` : ''} />
        </svg>
    `;
}

/**
 * Fetch image from URL
 */
async function fetchImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    return response.buffer();
}

/**
 * Escape XML special characters
 */
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Check if ComfyUI is available
 */
export async function isComfyUIAvailable() {
    try {
        const response = await fetch(`${COMFYUI_URL}/system_stats`, { timeout: 3000 });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Full pipeline: Generate ad from user input
 */
export async function generateAd(userPrompt, options = {}) {
    const {
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
        denoise = 0.75, // For img2img
        provider = 'local' // local, gemini, grok
    } = options;

    const stages = {
        current: 'enriching',
        enrichedPrompt: null,
        rawImage: null,
        finalImage: null
    };

    try {
        // Stage 1: Enrich prompt
        console.log('[AdService] Stage 1: Enriching prompt...');
        const enrichResult = await enrichPrompt(userPrompt, styleHint, businessName);
        stages.enrichedPrompt = enrichResult.enrichedPrompt;

        // Stage 2: Generate image based on provider
        stages.current = 'generating';
        console.log(`[AdService] Stage 2: Generating image with provider: ${provider}...`);

        // Fetch API keys from database (secure - server-side only!)
        const apiKeys = await getBusinessApiKeys(businessId);

        switch (provider) {
            case 'gemini':
                if (!apiKeys.geminiKey) {
                    throw new Error('מפתח Gemini לא מוגדר. הגדר אותו בהגדרות העסק.');
                }
                stages.rawImage = await generateImageGemini(stages.enrichedPrompt, {
                    apiKey: apiKeys.geminiKey,
                    seedImageBase64,
                    aspectRatio
                });
                break;

            case 'grok':
                if (!apiKeys.grokKey) {
                    throw new Error('מפתח Grok לא מוגדר. הגדר אותו בהגדרות העסק.');
                }
                stages.rawImage = await generateImageGrok(stages.enrichedPrompt, {
                    apiKey: apiKeys.grokKey,
                    seedImageBase64,
                    aspectRatio
                });
                break;

            case 'local':
            default:
                const comfyAvailable = await isComfyUIAvailable();
                if (!comfyAvailable) {
                    throw new Error('ComfyUI לא זמין. אנא בדוק שהשירות פועל או בחר ספק אחר.');
                }
                stages.rawImage = await generateImageComfyUI(stages.enrichedPrompt, {
                    seedImageBase64,
                    aspectRatio,
                    denoise
                });
                break;
        }

        // Stage 3: Add Hebrew text
        stages.current = 'compositing';
        console.log('[AdService] Stage 3: Compositing Hebrew text...');

        stages.finalImage = await compositeHebrewText(stages.rawImage, {
            hebrewText: enrichResult.suggestedOverlay || userPrompt.slice(0, 30),
            textPosition,
            textColor,
            textSize,
            addLogo,
            logoUrl
        });

        stages.current = 'done';
        return {
            success: true,
            finalImage: stages.finalImage,
            enrichedPrompt: stages.enrichedPrompt,
            suggestedOverlay: enrichResult.suggestedOverlay
        };

    } catch (error) {
        console.error('[AdService] Pipeline error:', error);
        return {
            success: false,
            error: error.message,
            stage: stages.current
        };
    }
}

/**
 * Generate Professional Canvas Design
 * Creates museum-quality designs with design philosophy
 */
export async function generateCanvasDesign(prompt, options = {}) {
    const { style = 'modern', aspectRatio = '1:1', businessId } = options;

    console.log('[CanvasDesign] Creating professional design...');
    console.log('[CanvasDesign] Prompt:', prompt);
    console.log('[CanvasDesign] Style:', style);

    try {
        // Step 1: Create design philosophy based on style
        const philosophy = await createDesignPhilosophy(prompt, style);
        console.log('[CanvasDesign] Philosophy:', philosophy.name);

        // Step 2: Execute the design using Python
        const imageBase64 = await executeCanvasDesign(prompt, philosophy, aspectRatio);

        return imageBase64;

    } catch (error) {
        console.error('[CanvasDesign] Error:', error);
        throw new Error(`Canvas design generation failed: ${error.message}`);
    }
}

/**
 * Create design philosophy based on style and prompt
 */
async function createDesignPhilosophy(prompt, style) {
    const philosophies = {
        modern: {
            name: 'Geometric Silence',
            description: 'Pure order and restraint through precise geometry',
            colors: ['#000000', '#FFFFFF', '#E5E5E5'],
            typography: 'minimal, sans-serif, precise',
            composition: 'grid-based, bold photography, dramatic negative space',
            principles: [
                'Swiss formalism meets Brutalist material honesty',
                'Structure communicates, not words',
                'Typography precise but minimal',
                'Large quiet zones',
                'Every alignment meticulously crafted'
            ]
        },
        warm: {
            name: 'Organic Warmth',
            description: 'Natural textures and breathing room',
            colors: ['#8B4513', '#D2691E', '#FFF8DC', '#8B7355'],
            typography: 'handwritten feel, warm serifs',
            composition: 'organic clustering, natural patterns',
            principles: [
                'Paper grain, ink bleeds, vast negative space',
                'Photography and illustration dominate',
                'Typography whispered',
                'Japanese photobook aesthetic',
                'Each composition balanced with meditation'
            ]
        },
        luxury: {
            name: 'Golden Elegance',
            description: 'Refined sophistication through premium materials',
            colors: ['#000000', '#D4AF37', '#FFFFFF', '#C0C0C0'],
            typography: 'elegant serifs, refined spacing',
            composition: 'asymmetric balance, premium photography',
            principles: [
                'Luxury through restraint',
                'Gold accents used sparingly',
                'High contrast, sophisticated palette',
                'Premium material feel',
                'Expert craftsman ship in every detail'
            ]
        },
        fresh: {
            name: 'Chromatic Language',
            description: 'Color as primary information system',
            colors: ['#4CAF50', '#2196F3', '#FFC107', '#FFFFFF'],
            typography: 'clean sans-serif, color-coded labels',
            composition: 'geometric precision, color zones create meaning',
            principles: [
                'Josef Albers chromatic interaction',
                'Information encoded spatially and chromatically',
                'Words only to anchor what color shows',
                'Painstaking chromatic calibration',
                'Vibrant yet balanced'
            ]
        },
        street: {
            name: 'Urban Poetry',
            description: 'Bold statement through raw energy',
            colors: ['#FF0000', '#000000', '#FFFF00', '#FFFFFF'],
            typography: 'bold, geometric, impactful',
            composition: 'asymmetric, dynamic, street art energy',
            principles: [
                'Polish poster energy',
                'Massive color blocks',
                'Sculptural typography',
                'Visual weight and spatial tension',
                'Ideas through bold gestures'
            ]
        }
    };

    return philosophies[style] || philosophies.modern;
}

/**
 * Execute canvas design using Python
 */
async function executeCanvasDesign(prompt, philosophy, aspectRatio) {
    const { spawn } = await import('child_process');

    return new Promise((resolve, reject) => {
        // Create Python script inline
        const pythonCode = `
import sys
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import textwrap

# Parse input
input_data = json.loads(sys.stdin.read())
prompt = input_data['prompt']
philosophy = input_data['philosophy']
aspect_ratio = input_data['aspectRatio']

# Determine dimensions
if aspect_ratio == '1:1':
    width, height = 1080, 1080
elif aspect_ratio == '9:16':
    width, height = 1080, 1920
elif aspect_ratio == '16:9':
    width, height = 1920, 1080
else:
    width, height = 1080, 1080

# Create canvas
img = Image.new('RGB', (width, height), color=philosophy['colors'][0])
draw = ImageDraw.Draw(img)

# Extract Hebrew text from prompt (assuming it's the main message)
hebrew_text = prompt[:50] if len(prompt) > 0 else "מבצע מיוחד"

# Apply design philosophy
style_name = philosophy['name']

if 'Geometric' in style_name or 'modern' in style_name.lower():
    # Geometric Silence - Minimalist with bold typography
    # Background: Large geometric shapes
    draw.rectangle([0, 0, width//2, height], fill=philosophy['colors'][0])
    draw.rectangle([width//2, 0, width, height], fill=philosophy['colors'][1])

    # Text: Large, bold, centered
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(height * 0.08))
    except:
        font = ImageFont.load_default()

    # Center text
    bbox = draw.textbbox((0, 0), hebrew_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2

    draw.text((x, y), hebrew_text, fill=philosophy['colors'][2], font=font)

elif 'Organic' in style_name or 'warm' in style_name.lower():
    # Organic Warmth - Natural textures
    # Gradient background
    for i in range(height):
        ratio = i / height
        r = int(139 * (1-ratio) + 255 * ratio)
        g = int(69 * (1-ratio) + 248 * ratio)
        b = int(19 * (1-ratio) + 220 * ratio)
        draw.line([(0, i), (width, i)], fill=(r, g, b))

    # Text with shadow
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", int(height * 0.06))
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), hebrew_text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = int(height * 0.7)

    # Shadow
    draw.text((x+3, y+3), hebrew_text, fill=(0,0,0,128), font=font)
    # Main text
    draw.text((x, y), hebrew_text, fill=philosophy['colors'][3], font=font)

elif 'Golden' in style_name or 'luxury' in style_name.lower():
    # Luxury - Black background with gold accents
    img = Image.new('RGB', (width, height), color=philosophy['colors'][0])
    draw = ImageDraw.Draw(img)

    # Gold frame
    frame_width = int(width * 0.05)
    draw.rectangle([frame_width, frame_width, width-frame_width, height-frame_width],
                   outline=philosophy['colors'][1], width=frame_width//2)

    # Elegant text
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", int(height * 0.07))
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), hebrew_text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = (height - (bbox[3] - bbox[1])) // 2

    draw.text((x, y), hebrew_text, fill=philosophy['colors'][1], font=font)

elif 'Chromatic' in style_name or 'fresh' in style_name.lower():
    # Chromatic Language - Vibrant color blocks
    # Create color zones
    num_zones = len(philosophy['colors'])
    zone_width = width // num_zones
    for i, color in enumerate(philosophy['colors']):
        draw.rectangle([i*zone_width, 0, (i+1)*zone_width, height], fill=color)

    # Text
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(height * 0.08))
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), hebrew_text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    y = (height - (bbox[3] - bbox[1])) // 2

    # Text with outline for visibility
    for adj_x in range(-2, 3):
        for adj_y in range(-2, 3):
            draw.text((x+adj_x, y+adj_y), hebrew_text, fill='#000000', font=font)
    draw.text((x, y), hebrew_text, fill='#FFFFFF', font=font)

else:
    # Default: Urban Poetry - Bold statement
    img = Image.new('RGB', (width, height), color=philosophy['colors'][1])
    draw = ImageDraw.Draw(img)

    # Bold geometric shapes
    draw.polygon([(0, 0), (width//3, 0), (0, height//3)], fill=philosophy['colors'][0])
    draw.polygon([(width, height), (2*width//3, height), (width, 2*height//3)], fill=philosophy['colors'][2])

    # Bold text
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(height * 0.1))
    except:
        font = ImageFont.load_default()

    # Wrap text
    words = hebrew_text.split()
    lines = []
    current_line = ""
    for word in words:
        test_line = current_line + " " + word if current_line else word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] < width * 0.8:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    # Draw centered lines
    y_offset = (height - len(lines) * int(height * 0.12)) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        draw.text((x, y_offset), line, fill=philosophy['colors'][3], font=font)
        y_offset += int(height * 0.12)

# Convert to base64
buffer = BytesIO()
img.save(buffer, format='PNG', quality=95)
buffer.seek(0)
img_base64 = base64.b64encode(buffer.read()).decode('utf-8')

print(img_base64)
`;

        const python = spawn('python', ['-c', pythonCode]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        const input = JSON.stringify({
            prompt,
            philosophy,
            aspectRatio
        });

        python.stdin.write(input);
        python.stdin.end();

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('[CanvasDesign] Python error:', errorOutput);
                reject(new Error(errorOutput || 'Python script failed'));
            } else {
                resolve(output.trim());
            }
        });
    });
}

export default {
    enrichPrompt,
    generateImageComfyUI,
    generateImageGemini,
    generateImageGrok,
    compositeHebrewText,
    generateAd,
    isComfyUIAvailable,
    getBusinessApiKeys,
    generateCanvasDesign
};
