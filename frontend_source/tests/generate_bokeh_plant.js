import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini with the provided API key
const API_KEY = "AIzaSyBzrKmkf5X50ONyoFGR1WGVgG5mrNJLyj4";
const genAI = new GoogleGenerativeAI(API_KEY);

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

async function generatePlantImage() {
    try {
        console.log("Initializing model gemini-3.1-flash-image-preview...");
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

        // The exact prompt from geminiService.js that we updated earlier
        const promptString = `LITERAL PRODUCT PHOTOGRAPHY for an E-commerce catalog.
**SUBJECT:** "Lobelia plant"

**CRITICAL FIDELITY RULES:**
1. REPLICATE SEEDS EXACTLY: Use the provided REFERENCE PHOTO (the plant) for the subject and the SECOND PHOTO (desert valley) for the environment.
2. NO BEAUTIFICATION: Avoid adjectives like "breathtaking", "stunning", or "cinematic". No sun flares or extra lighting.
3. CONTAINER: The plant MUST be in its original "simple brown plastic nursery pot" as shown in the reference. Crop it so only a small portion is visible at the bottom. DO NOT change the pot.
4. BACKGROUND & BOKEH: Use the vast desert valley landscape (second image) as the background. You MUST apply a VERY STRONG BOKEH effect to this background (f/1.4 blur equivalent). The desert background should be very blurred, soft, and out of focus so the plant and its pot stand out sharply against it.
5. COMPOSITION: Subject must be centered and fill exactly 75% of the entire frame. The plant is the absolute center of attention.

**PHOTOGRAPHIC GUIDELINES:**
- Focus: Razor-sharp on the Lobelia.
- Style: Premium commercial catalog photography, bright and inviting.`;

        console.log("Reading source image (Lobelia)...");
        // We'll use the lobelia image that we downloaded earlier for the first test
        // Resolving relative to the current script execution which is in the frontend_source dir
        const artifactsDir = "/Users/user/.gemini/antigravity/brain/d3687f98-ed43-4c68-a1b2-dc4712646802";
        const sourceImagePath = path.join(artifactsDir, "lobelia.jpg");
        const bgImagePath = path.join(process.cwd(), "public/seeds/desert_bg.jpg");

        if (!fs.existsSync(sourceImagePath) || !fs.existsSync(bgImagePath)) {
            console.error(`Source image or BG image not found!`);
            return;
        }

        const imagePart = fileToGenerativePart(sourceImagePath, "image/jpeg");
        const bgPart = fileToGenerativePart(bgImagePath, "image/jpeg");

        console.log("Generating image...");
        let result;
        let success = false;
        let retries = 0;

        while (!success && retries < 5) {
            try {
                result = await model.generateContent([
                    promptString,
                    imagePart,
                    bgPart
                ]);
                success = true; // execution reached here, so no error thrown
            } catch (err) {
                if (err.status === 429) {
                    const retryDelayStr = err.errorDetails?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay;
                    const delaySec = retryDelayStr ? parseInt(retryDelayStr.replace('s', '')) : 60;
                    console.log(`Rate limit hit. Waiting ${delaySec} seconds before retry ${retries + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, delaySec * 1000 + 1000));
                    retries++;
                } else {
                    throw err; // rethrow unknown errors
                }
            }
        }

        if (!success) {
            console.error("Failed to generate image after multiple retries due to quota limits.");
            return;
        }

        // Access the response
        if (result && result.response) {
            const candidates = result.response.candidates;
            if (candidates && candidates.length > 0) {
                const firstCandidate = candidates[0];
                console.log("Received a response. Inspecting structure...");

                if (firstCandidate.content && firstCandidate.content.parts) {
                    for (const part of firstCandidate.content.parts) {
                        if (part.inlineData) {
                            const base64Data = part.inlineData.data;
                            const outputPath = path.join(artifactsDir, `lobelia_test_75percent_bokeh_${Date.now()}.png`);
                            fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
                            console.log(`✅ Image successfully saved to: ${outputPath}`);
                            return;
                        } else if (part.executableCode) {
                            console.log("Got executable code???");
                        } else if (part.text) {
                            console.log("Got text:", part.text);
                        }
                    }
                }

                console.log("Could not find inlineData in parts. Dumping candidate structure:");
                console.log(JSON.stringify(firstCandidate, null, 2));

            } else {
                console.log("No candidates returned.");
            }
        } else {
            console.log("No response object.");
        }

    } catch (error) {
        console.error("Error generating image:", error);
    }
}

generatePlantImage();
