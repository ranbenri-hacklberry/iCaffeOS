import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../src');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const OUTPUT_FILE = path.resolve(__dirname, '../abra-manifesto.json');

// Metadata Parser
function parseMetadata(content) {
    const tableMatch = content.match(/@abra-table\s+(.*)/);
    const dexieMatch = content.match(/@abra-dexie\s+(.*)/);

    const tables = tableMatch ? tableMatch[1].split(',').map(s => s.trim()) : [];
    const dexie = dexieMatch ? dexieMatch[1].split(',').map(s => s.trim()) : [];

    return {
        supabase_tables: tables,
        dexie_tables: dexie,
        is_cast_ready: tables.length > 0
    };
}

// Simple scanner
function scanDirectory(dir, registry) {
    if (!fs.existsSync(dir)) return registry;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath, registry);
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const metadata = parseMetadata(content);

            const relativePath = path.relative(ROOT_DIR, fullPath);
            const componentId = relativePath
                .replace(/\.(jsx|tsx)$/, '')
                .replace(/\//g, '-')
                .toLowerCase();

            registry[componentId] = {
                file_path: relativePath,
                last_modified: stat.mtime,
                ...metadata
            };
        }
    }
    return registry;
}

console.log('🔮 Casting Spell: Component Discovery & Meta-Mapping...');
const registry = {};
scanDirectory(COMPONENTS_DIR, registry);
scanDirectory(PAGES_DIR, registry);

const castReadyCount = Object.values(registry).filter(c => c.is_cast_ready).length;

const manifest = {
    generated_at: new Date().toISOString(),
    stats: {
        total_components: Object.keys(registry).length,
        cast_ready_components: castReadyCount
    },
    components: registry
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`✨ Manifesto written to ${OUTPUT_FILE}`);
console.log(`📊 Stats: ${castReadyCount}/${Object.keys(registry).length} components are "Cast-Ready".`);
