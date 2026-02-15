/**
 * Maya Code RAG - Indexer Script
 * ===============================
 * This script indexes all code files for Maya's RAG system.
 * Run: node index_codebase.js
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Set this in your environment!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // For embeddings
const XAI_API_KEY = process.env.VITE_XAI_API_KEY; // Alternative: use Grok for summaries

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Files to index
const CODE_EXTENSIONS = ['.jsx', '.js', '.ts', '.tsx', '.css', '.sql', '.md'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'build', '.next'];
const SOURCE_DIR = './frontend_source/src';

// Chunk size (in lines)
const CHUNK_SIZE = 50;
const CHUNK_OVERLAP = 10;

/**
 * Get all code files recursively
 */
function getAllFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!IGNORE_DIRS.includes(entry.name)) {
                getAllFiles(fullPath, files);
            }
        } else if (CODE_EXTENSIONS.includes(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Split file into chunks
 */
function chunkFile(content, filePath) {
    const lines = content.split('\n');
    const chunks = [];

    for (let i = 0; i < lines.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        const chunkLines = lines.slice(i, i + CHUNK_SIZE);
        const chunkContent = chunkLines.join('\n');

        if (chunkContent.trim().length > 20) { // Skip nearly empty chunks
            chunks.push({
                file_path: filePath.replace('./frontend_source/', ''),
                chunk_index: Math.floor(i / (CHUNK_SIZE - CHUNK_OVERLAP)),
                content: chunkContent,
                metadata: {
                    start_line: i + 1,
                    end_line: i + chunkLines.length,
                    file_extension: path.extname(filePath)
                }
            });
        }
    }

    return chunks;
}

/**
 * Generate embedding using OpenAI
 */
async function getEmbedding(text) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: text.slice(0, 8000) // Limit to avoid token limits
        })
    });

    const data = await response.json();
    return data.data?.[0]?.embedding;
}

/**
 * Generate summary using Grok
 */
async function generateSummary(content, filePath) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${XAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'grok-code-fast-1',
            messages: [
                { role: 'system', content: 'You are a code summarizer. Given a code chunk, write a 1-2 sentence summary of what it does. Be concise. Reply in Hebrew.' },
                { role: 'user', content: `File: ${filePath}\n\nCode:\n${content.slice(0, 2000)}` }
            ],
            temperature: 0.1,
            max_tokens: 100
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No summary';
}

/**
 * Main indexing function
 */
async function indexCodebase() {
    console.log('🌸 Maya Code RAG - Starting Indexing...\n');

    // Get all files
    const files = getAllFiles(SOURCE_DIR);
    console.log(`📁 Found ${files.length} files to index\n`);

    let totalChunks = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const filePath of files) {
        console.log(`📄 Processing: ${filePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const chunks = chunkFile(content, filePath);

            for (const chunk of chunks) {
                totalChunks++;

                // Generate embedding
                const embedding = await getEmbedding(chunk.content);
                if (!embedding) {
                    console.log(`   ⚠️ Failed to get embedding for chunk ${chunk.chunk_index}`);
                    errorCount++;
                    continue;
                }

                // Generate summary (optional, can skip for speed)
                // const summary = await generateSummary(chunk.content, chunk.file_path);
                const summary = `Chunk ${chunk.chunk_index + 1} of ${chunk.file_path}`;

                // Upsert to Supabase
                const { error } = await supabase
                    .from('code_chunks')
                    .upsert({
                        file_path: chunk.file_path,
                        chunk_index: chunk.chunk_index,
                        content: chunk.content,
                        summary: summary,
                        embedding: embedding,
                        metadata: chunk.metadata,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'file_path,chunk_index'
                    });

                if (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                    errorCount++;
                } else {
                    successCount++;
                    process.stdout.write(`   ✅ Chunk ${chunk.chunk_index + 1}/${chunks.length}\r`);
                }

                // Rate limiting (OpenAI has limits)
                await new Promise(r => setTimeout(r, 200));
            }

            console.log(`   ✅ Done (${chunks.length} chunks)`);

        } catch (e) {
            console.log(`   ❌ Error processing file: ${e.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🌸 Indexing Complete!`);
    console.log(`   📊 Total Chunks: ${totalChunks}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));
}

// Run
indexCodebase().catch(console.error);
