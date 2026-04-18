const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const fs = require('fs');
const cors = require('cors');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

app.get('/api/debug/orders-audit', async (req, res) => {
    try {
        const { data: orders, error: ordErr } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    menu_items (name)
                )
            `)
            .order('created_at', { ascending: false })
            .limit(7);

        res.json({ success: true, orders: orders || [], error: ordErr });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/debug/read-file', (req, res) => {
    const filePath = req.query.path;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        res.send(content);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/debug/ls', (req, res) => {
    const dirPath = req.query.path;
    try {
        const results = execSync(`ls -F ${dirPath}`).toString();
        res.send(results);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.use('/rest/v1', createProxyMiddleware({
    target: 'http://127.0.0.1:54321',
    changeOrigin: true,
    pathRewrite: { '^/rest/v1': '/rest/v1' }
}));

app.listen(8081, '0.0.0.0', () => {
    console.log('DEBUG PROXY RUNNING ON 8081');
});
