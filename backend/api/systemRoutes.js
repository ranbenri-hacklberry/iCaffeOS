
import express from 'express';
import { exec } from 'child_process';

const router = express.Router();

/**
 * GET /api/system/containers
 * Get status of Docker containers (Supabase, etc.)
 */
router.get('/containers', (req, res) => {
    // Only works on Linux/Mac with Docker installed
    exec('docker ps --format "{{.Names}}\t{{.Status}}"', (error, stdout, stderr) => {
        if (error) {
            console.error('Docker check failed:', error);
            // Fallback for non-docker environments (like Vercel or local dev without docker)
            return res.json({
                success: true,
                containers: [],
                message: 'Docker not available or error occurred'
            });
        }

        const lines = stdout.trim().split('\n');
        const containers = lines
            .filter(line => line.trim())
            .map(line => {
                const [name, status] = line.split('\t');
                return { name, status };
            });

        res.json({
            success: true,
            containers
        });
    });
});

export default router;
