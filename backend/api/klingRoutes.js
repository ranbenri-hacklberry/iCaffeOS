/**
 * Kling AI Video Generation API Routes
 * Handles video creation with Kling AI using JWT authentication
 */

import express from 'express';
import multer from 'multer';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getKlingKeys } from '../services/secretsService.js';

dotenv.config();

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * Generate JWT Token for Kling AI API Authentication
 * Uses HS256 algorithm with Access Key and Secret Key
 */
function generateKlingToken(accessKey, secretKey) {
  const currentTime = Math.floor(Date.now() / 1000);

  const payload = {
    iss: accessKey,                // Issuer: Access Key
    exp: currentTime + 1800,       // Expires in 30 minutes
    nbf: currentTime - 5           // Not before: 5 seconds ago (time sync buffer)
  };

  // Sign with HS256 algorithm using Secret Key
  const token = jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT'
    }
  });

  return token;
}

/**
 * POST /api/kling/generate-video
 * Generate a video using Kling AI
 */
router.post('/generate-video', upload.fields([
  { name: 'opening_image', maxCount: 1 },
  { name: 'ending_image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { prompt, business_id } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    if (!business_id) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    console.log('🎬 Generating video with Kling AI...');
    console.log('📝 Prompt:', prompt);
    console.log('🏢 Business ID:', business_id);

    // Get Kling API keys from business_secrets (via secretsService)
    const { accessKey, secretKey } = await getKlingKeys(business_id);

    if (!accessKey || !secretKey) {
      return res.status(400).json({
        message: 'Kling API keys not configured. Please add them in Business Settings.'
      });
    }

    console.log('🔑 Kling keys found, generating JWT token...');

    // Generate JWT token
    const jwtToken = generateKlingToken(
      accessKey,
      secretKey
    );

    console.log('✅ JWT token generated');

    // Determine endpoint based on whether images are provided
    const hasImages = req.files && (req.files.opening_image || req.files.ending_image);
    const endpoint = hasImages ? '/v1/videos/image2video' : '/v1/videos/text2video';

    console.log(`🎯 Using endpoint: ${endpoint}`);

    // Prepare request body
    const requestBody = {
      prompt: prompt,
      model_name: 'kling-v1-6',  // Default model
      duration: 5,                // 5 seconds
      aspect_ratio: '16:9',       // 16:9 format
      mode: 'std'                 // Standard quality
    };

    // If using image2video endpoint and image is provided
    if (hasImages && req.files.opening_image) {
      const openingImage = req.files.opening_image[0];
      console.log('🖼️ Including opening image:', openingImage.originalname);

      // Convert image to base64 for API
      const imageBase64 = openingImage.buffer.toString('base64');
      requestBody.image = imageBase64;
    }

    console.log('📤 Sending request to Kling API...');

    // Call Kling API
    const klingResponse = await axios.post(
      `https://api-singapore.klingai.com${endpoint}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ Kling API response:', JSON.stringify(klingResponse.data, null, 2));

    // Return task ID for polling
    res.json({
      task_id: klingResponse.data.task_id || klingResponse.data.data?.task_id || klingResponse.data.id,
      status: 'processing',
      message: 'Video generation started',
      endpoint_used: endpoint
    });

  } catch (error) {
    console.error('❌ Kling video generation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(500).json({
      message: error.response?.data?.message || error.message || 'Failed to generate video',
      details: error.response?.data
    });
  }
});

/**
 * GET /api/kling/video-status/:taskId
 * Check video generation status
 */
router.get('/video-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    console.log('🔍 Checking video status for task:', taskId);

    // Get Kling API keys from business_secrets (via secretsService)
    const { accessKey, secretKey } = await getKlingKeys(business_id);

    if (!accessKey) {
      return res.status(500).json({ message: 'Failed to fetch business settings' });
    }

    // Generate JWT token
    const jwtToken = generateKlingToken(
      accessKey,
      secretKey
    );

    // Check status with Kling API
    // Try both text2video and image2video endpoints
    let klingResponse;
    try {
      klingResponse = await axios.get(
        `https://api-singapore.klingai.com/v1/videos/text2video/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          },
          timeout: 10000
        }
      );
    } catch (textError) {
      // Try image2video endpoint if text2video fails
      console.log('⚠️ text2video endpoint failed, trying image2video...');
      klingResponse = await axios.get(
        `https://api-singapore.klingai.com/v1/videos/image2video/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          },
          timeout: 10000
        }
      );
    }

    const data = klingResponse.data.data || klingResponse.data;
    console.log('📊 Status response:', JSON.stringify(data, null, 2));

    // Map Kling status to our format
    let status = 'processing';
    let videoUrl = null;
    let progress = 0;

    // Kling uses different status codes
    // Common statuses: "processing", "succeed", "failed"
    if (data.status === 'succeed' || data.status === 'succeeded' || data.status === 'completed' || data.task_status === 'succeed') {
      status = 'completed';
      videoUrl = data.task_result?.videos?.[0]?.url || data.video_url || data.result?.video_url || data.works?.[0]?.resource?.resource;
      progress = 100;
    } else if (data.status === 'failed' || data.task_status === 'failed') {
      status = 'failed';
      progress = 0;
    } else if (data.status === 'processing' || data.task_status === 'processing' || data.status === 'submitted') {
      status = 'processing';
      progress = data.progress || 50; // Estimate if not provided
    }

    res.json({
      status,
      progress,
      video_url: videoUrl,
      raw_status: data.status || data.task_status,
      error: data.error || data.task_result?.error
    });

  } catch (error) {
    console.error('❌ Status check error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(500).json({
      message: error.response?.data?.message || 'Failed to check video status',
      details: error.response?.data
    });
  }
});

/**
 * GET /api/kling/credits
 * Check remaining Kling credits (SKIPPED - endpoint not available)
 */
router.get('/credits', async (req, res) => {
  console.log('ℹ️ Credits check skipped – Kling API endpoint not available');

  // Return mock data - credits check is skipped for now
  res.json({
    credits_remaining: 66,
    daily_limit: 66,
    message: 'Credits check skipped – generating video directly'
  });
});

export default router;
