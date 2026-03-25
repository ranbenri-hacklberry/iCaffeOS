const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();
app.use(cors());
const target = 'http://127.0.0.1:54321';
app.use('/', createProxyMiddleware({ target, changeOrigin: true }));
app.listen(8081, '0.0.0.0', () => console.log('🚀 Standard Proxy is back on 8081'));
