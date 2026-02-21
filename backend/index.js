import dotenv from 'dotenv';
dotenv.config({ override: true });

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
