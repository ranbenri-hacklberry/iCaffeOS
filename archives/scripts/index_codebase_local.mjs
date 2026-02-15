/**
 * Maya Code RAG - Local Indexer Script
 * =====================================
 * Uses Ollama for local embeddings - 100% free and private!
 * Run: node index_codebase_local.mjs
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://gxzsxvbercpkgxraiaex.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Need service key for writes
const OLLAMA_URL = 'http://localhost:11434';
const EMBEDDING_MODEL = 'nomic-embed-text';

// Check for service key
if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required!');
    console.error('   Set it with: export SUPABASE_SERVICE_KEY="your-service-role-key"');
    console.error('   Find it in Supabase Dashboard -> Settings -> API -> service_role key');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Files to index
const CODE_EXTENSIONS = ['.jsx', '.js', '.ts', '.tsx', '.css', '.sql', '.md'];
const IGNORE_DIRS = ['node_modules', 'dist', '.git', 'build', '.next', 'RanTunes'];
const SOURCE_DIR = './frontend_source/src';

// Chunk size (in lines)
const CHUNK_SIZE = 60;
const CHUNK_OVERLAP = 15;

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

        if (chunkContent.trim().length > 30) { // Skip nearly empty chunks
            chunks.push({
                file_path: filePath.replace('./frontend_source/', ''),
                chunk_index: Math.floor(i / (CHUNK_SIZE - CHUNK_OVERLAP)),
                content: chunkContent,
                metadata: {
                    start_line: i + 1,
                    end_line: i + chunkLines.length,
                    file_extension: path.extname(filePath),
                    file_name: path.basename(filePath)
                }
            });
        }
    }

    return chunks;
}

/**
 * Generate embedding using Ollama (LOCAL!)
 */
async function getEmbedding(text) {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                prompt: text.slice(0, 8000) // Limit to avoid issues
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = await response.json();
        return data.embedding;
    } catch (e) {
        console.error(`   ⚠️ Embedding error: ${e.message}`);
        return null;
    }
}

/**
 * Generate a simple summary from the code
 */
function generateLocalSummary(content, filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);

    // Extract function/component names
    const functionMatch = content.match(/(?:function|const|let|var)\s+(\w+)\s*[=(]/g);
    const functions = functionMatch ? functionMatch.slice(0, 3).map(f => f.replace(/(?:function|const|let|var)\s+/, '').replace(/\s*[=(]/, '')) : [];

    // Extract export names
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g);
    const exports = exportMatch ? exportMatch.slice(0, 2).map(e => e.split(/\s+/).pop()) : [];

    let summary = `${fileName}`;
    if (exports.length) summary += ` | Exports: ${exports.join(', ')}`;
    else if (functions.length) summary += ` | Contains: ${functions.join(', ')}`;

    return summary;
}

/**
 * Main indexing function
 */
async function indexCodebase() {
    console.log('🌸 Maya Code RAG - Local Indexer (Ollama)\n');
    console.log('='.repeat(50));

    // Check Ollama is running
    try {
        const resp = await fetch(`${OLLAMA_URL}/api/tags`);
        if (!resp.ok) throw new Error('Ollama not responding');
        console.log('✅ Ollama is running\n');
    } catch (e) {
        console.error('❌ Ollama is not running! Start it with: ollama serve');
        process.exit(1);
    }

    // Get all files
    const files = getAllFiles(SOURCE_DIR);
    console.log(`📁 Found ${files.length} files to index\n`);

    let totalChunks = 0;
    let successCount = 0;
    let errorCount = 0;

    for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const filePath = files[fileIdx];
        console.log(`📄 [${fileIdx + 1}/${files.length}] ${filePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const chunks = chunkFile(content, filePath);

            for (const chunk of chunks) {
                totalChunks++;

                // Generate embedding using Ollama
                const embedding = await getEmbedding(chunk.content);
                if (!embedding) {
                    errorCount++;
                    continue;
                }

                // Generate local summary
                const summary = generateLocalSummary(chunk.content, chunk.file_path);

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
                    console.log(`   ❌ DB Error: ${error.message}`);
                    errorCount++;
                } else {
                    successCount++;
                }
            }

            console.log(`   ✅ ${chunks.length} chunks indexed`);

        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
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
