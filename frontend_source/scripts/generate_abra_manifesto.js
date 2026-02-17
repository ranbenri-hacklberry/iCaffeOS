import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../src');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'components');
const PAGES_DIR = path.join(ROOT_DIR, 'pages');
const OUTPUT_FILE = path.resolve(__dirname, '../abra-manifesto.json');

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
            // Generate a component ID
            const relativePath = path.relative(ROOT_DIR, fullPath);
            const componentId = relativePath
                .replace(/\.(jsx|tsx)$/, '')
                .replace(/\//g, '-')
                .toLowerCase();

            registry[componentId] = {
                file_path: relativePath,
                last_modified: stat.mtime
            };
        }
    }
    return registry;
}

console.log('🔮 Casting Spell: Component Discovery...');
const registry = {};
scanDirectory(COMPONENTS_DIR, registry);
scanDirectory(PAGES_DIR, registry);

const manifest = {
    generated_at: new Date().toISOString(),
    components: registry
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`✨ Manifesto written to ${OUTPUT_FILE} with ${Object.keys(registry).length} components.`);
