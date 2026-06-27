/**
 * iCaffeOS Production Server
 * Serves the built frontend + proxies API requests
 * Runs entirely on Mac Studio
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

const PORT = 4028;
const EDGE_NODE = 'http://127.0.0.1:8090';
const SUPABASE = 'http://127.0.0.1:54321';
const BACKEND = 'http://127.0.0.1:8081';
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'font/eot',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.map': 'application/json',
};

// Create proxy
const proxy = httpProxy.createProxyServer({ ws: true, timeout: 30000 });

proxy.on('error', (err, req, res) => {
  console.error(`Proxy error: ${err.message} for ${req.url}`);
  if (res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
  }
});

// Proxy routing rules
const proxyRoutes = [
  { prefix: '/edge-node', target: EDGE_NODE, strip: true },
  { prefix: '/supabase-api', target: SUPABASE, strip: true },
  { prefix: '/api/sms', target: 'https://sapi.itnewsletter.co.il', strip: false, 
    rewrite: (p) => p.replace(/^\/api\/sms/, '/api/restApiSms') },
  { prefix: '/item', target: BACKEND, strip: false },
  { prefix: '/api', target: BACKEND, strip: false },
  { prefix: '/health', target: BACKEND, strip: false },
  { prefix: '/music/', target: BACKEND, strip: false },
  { prefix: '/ollama', target: 'http://127.0.0.1:11434/api', strip: true },
];

const server = http.createServer((req, res) => {
  const url = req.url;

  // Check proxy routes
  for (const route of proxyRoutes) {
    if (url.startsWith(route.prefix)) {
      if (route.strip) {
        req.url = url.replace(new RegExp(`^${route.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '') || '/';
      }
      if (route.rewrite) {
        req.url = route.rewrite(req.url);
      }
      return proxy.web(req, res, { 
        target: route.target, 
        changeOrigin: true,
        secure: false,
      });
    }
  }

  // Serve static files
  let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url.split('?')[0]);

  // Check if file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback: serve index.html for any non-file route
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    
    // Cache static assets (with hash), no-cache for HTML
    const cacheControl = ext === '.html' 
      ? 'no-store, no-cache, must-revalidate' 
      : 'public, max-age=31536000, immutable';
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

// WebSocket upgrade support
server.on('upgrade', (req, socket, head) => {
  for (const route of proxyRoutes) {
    if (req.url.startsWith(route.prefix)) {
      if (route.strip) {
        req.url = req.url.replace(new RegExp(`^${route.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '') || '/';
      }
      return proxy.ws(req, socket, head, { target: route.target, changeOrigin: true });
    }
  }
  socket.destroy();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 iCaffeOS Production Server`);
  console.log(`   Frontend:  http://0.0.0.0:${PORT}`);
  console.log(`   Edge Node: ${EDGE_NODE}`);
  console.log(`   Supabase:  ${SUPABASE}`);
  console.log(`   Backend:   ${BACKEND}`);
  console.log(`\n   Access from iPad: http://192.168.1.50:${PORT}\n`);
});
