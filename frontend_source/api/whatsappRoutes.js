import express from 'express';

const router = express.Router();

// WAHA API base - inside Docker network use container name
const WAHA_URL = process.env.WAHA_URL || 'http://waha_api:8081';
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'your_key_here';

const wahaFetch = async (path, method = 'GET', body = null) => {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': WAHA_API_KEY
        }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${WAHA_URL}${path}`, options);
    return response;
};

// GET /api/whatsapp/status?instanceName=default
router.get('/status', async (req, res) => {
    try {
        const { instanceName = 'default' } = req.query;

        const sessionsRes = await wahaFetch('/api/sessions');
        const sessions = await sessionsRes.json();

        const session = sessions.find(s => s.name === instanceName);

        if (!session) {
            return res.json({ status: 'disconnected' });
        }

        if (session.status === 'WORKING') {
            return res.json({ status: 'connected', number: session.config?.proxyController });
        }

        if (session.status === 'SCAN_QR_CODE') {
            try {
                const qrRes = await wahaFetch(`/api/${instanceName}/auth/qr`);
                const qrData = await qrRes.json();
                return res.json({ status: 'qr_ready', qr: qrData.value || qrData.data });
            } catch (e) {
                return res.json({ status: 'connecting' });
            }
        }

        return res.json({ status: session.status?.toLowerCase() || 'unknown' });
    } catch (err) {
        console.error('WhatsApp status error:', err.message);
        res.json({ status: 'disconnected', error: err.message });
    }
});

// POST /api/whatsapp/connect
router.post('/connect', async (req, res) => {
    try {
        const { instanceName = 'default' } = req.body;

        const startRes = await wahaFetch('/api/sessions/start', 'POST', {
            name: instanceName,
            config: { proxy: null, webhooks: [] }
        });

        const startData = await startRes.json();

        if (startRes.status === 422 || startData.name) {
            try {
                const qrRes = await wahaFetch(`/api/${instanceName}/auth/qr`);
                const qrData = await qrRes.json();
                return res.json({
                    success: true,
                    status: 'qr_ready',
                    qr: qrData.value || qrData.data
                });
            } catch (e) {
                return res.json({ success: true, status: 'started', message: 'Session started, waiting for QR' });
            }
        }

        res.json({ success: true, ...startData });
    } catch (err) {
        console.error('WhatsApp connect error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/whatsapp/send
router.post('/send', async (req, res) => {
    try {
        const { instanceName = 'default', phone, message } = req.body;
        const chatId = phone.includes('@') ? phone : `${phone}@c.us`;

        const sendRes = await wahaFetch(`/api/sendText`, 'POST', {
            session: instanceName,
            chatId,
            text: message
        });

        const result = await sendRes.json();
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('WhatsApp send error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/whatsapp/instance/logout/:instanceName
router.delete('/instance/logout/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        await wahaFetch(`/api/sessions/stop`, 'POST', { name: instanceName });
        res.json({ success: true });
    } catch (err) {
        console.error('WhatsApp logout error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/whatsapp/instance/connect/:instanceName  (refresh QR)
router.get('/instance/connect/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const qrRes = await wahaFetch(`/api/${instanceName}/auth/qr`);
        const qrData = await qrRes.json();
        res.json({ base64: qrData.value || qrData.data, pairingCode: qrData.pairingCode });
    } catch (err) {
        console.error('WhatsApp QR refresh error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
