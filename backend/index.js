import dotenv from 'dotenv';
dotenv.config({ override: true });

console.log('--- [iCaffeOS Backend: Validating Environment] ---');
const requiredEnvVars = [
    { name: 'PORT', fallback: '8081' },
    { name: 'VITE_SUPABASE_URL', fallback: 'None (CRITICAL)' },
];

const hasRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_SERVICE_KEY;
const hasStandardKey = !!process.env.SUPABASE_KEY;
const hasAnonKey = !!process.env.VITE_SUPABASE_ANON_KEY;

console.log(`- SUPABASE_URL: ${!!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY/SERVICE_KEY: ${hasRoleKey}`);
console.log(`- SUPABASE_KEY: ${hasStandardKey}`);
console.log(`- VITE_SUPABASE_ANON_KEY: ${hasAnonKey}`);
console.log('------------------------------------------------');

// Guard Execution
if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.error('🚨 FATAL: Missing Supabase URL. Exiting to prevent crash loop.');
    process.exit(1);
}
if (!hasRoleKey && !hasStandardKey && !hasAnonKey) {
    console.error('🚨 FATAL: Missing ALL Supabase Keys. Exiting to prevent crash loop.');
    process.exit(1);
}

import os from 'os';
import express from 'express';
import cors from 'cors';
import driveRoutes from './api/driveRoutes.js';
import ocrRoutes from './api/ocrRoutes.js';
import musicRoutes from './api/musicRoutes.js';
import spotifyRoutes from './api/spotifyRoutes.js';
import mayaRoutes from './api/mayaRoutes.js';
import marketingRoutes from './api/marketingRoutes.js';
import klingRoutes from './api/klingRoutes.js';
import adminRoutes from './api/adminRoutes.js';
import systemRoutes from './api/systemRoutes.js';
import smsRoutes from './api/smsRoutes.js';
import labRoutes from './api/labRoutes.js';
import { CacheService } from './services/cacheService.js';

const app = express();
const PORT = process.env.PORT || 8081;

// Init services
CacheService.init();

console.log('🔧 Initializing backend...');
console.log('📍 Current Directory:', process.cwd());
console.log('📂 Drive Folder ID From Env:', process.env.DRIVE_INVOICES_FOLDER_ID || 'MISSING');
console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️ MISSING');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import musicCoverRouter from './api/musicCoverRoute.js';

// Routes
app.use(musicCoverRouter); // Override specific music routes (e.g. cover)
app.use('/api/drive', driveRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/music', musicRoutes);
app.use('/music', musicRoutes); // Legacy support for music frontend
app.use('/api/spotify', spotifyRoutes);
app.use('/api/maya', mayaRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/kling', klingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/lab', labRoutes);   // 🖥️ Superadmin Remote Execution (Lab)

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        platform: os.platform()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📂 Drive backup integration active`);
});
