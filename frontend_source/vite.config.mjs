import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tagger from "@dhiwise/component-tagger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLite = env.VITE_APP_MODE === 'lite';
  const rootDir = process.cwd();

  const backendTarget = process.env.DOCKER_ENV === 'true'
    ? 'http://backend:8081'
    : 'http://localhost:8081';

  const plugins = [
    react(),
    tagger(),
  ];

  const srcPath = path.resolve(__dirname, "./src");

  const aliases = {
    "@": srcPath,
  };

  if (isLite) {
    const emptyModule = path.resolve(__dirname, "./src/emptyModule.jsx");
    aliases['framer-motion'] = emptyModule;
    aliases['recharts'] = emptyModule;
  }

  return {
    base: '/',
    build: {
      outDir: "dist",
      chunkSizeWarningLimit: isLite ? 500 : 2000,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        plugins: [],
      },
    },
    plugins: plugins.filter(Boolean),
    resolve: {
      alias: aliases,
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 4028,
      host: "0.0.0.0",
      strictPort: false,
      allowedHosts: 'all',
      // Force no-cache so tablets always get fresh code after restart
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      hmr: {
        // Let Vite auto-detect host from window.location (works for LAN devices)
        port: 4028,
      },
      proxy: {
        "/item": { target: backendTarget, changeOrigin: true, secure: false },
        "/api/marketing": { target: backendTarget, changeOrigin: true, secure: false },
        "/api/maya": { target: backendTarget, changeOrigin: true, secure: false },
        "/api/sms": {
          target: "https://sapi.itnewsletter.co.il",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/sms/, "/api/restApiSms"),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  const time = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
                  const phone = data.destinations || '?';
                  const msgPreview = (data.txtSMSmessage || '').slice(0, 50);
                  console.log(`\n📱 ═══════════════════════════════════════`);
                  console.log(`📱 SMS OUT  │ ${time}`);
                  console.log(`📱 Phone    │ ${phone}`);
                  console.log(`📱 Message  │ ${msgPreview}...`);
                  console.log(`📱 Path     │ ${req.url}`);
                  console.log(`📱 ═══════════════════════════════════════\n`);
                } catch(e) { /* ignore parse errors */ }
              });
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              let responseBody = '';
              proxyRes.on('data', chunk => responseBody += chunk);
              proxyRes.on('end', () => {
                const status = proxyRes.statusCode;
                const icon = status >= 200 && status < 300 ? '✅' : '❌';
                console.log(`${icon} SMS Response │ Status: ${status} │ Body: ${responseBody.slice(0, 120)}`);
              });
            });
          },
        },
        "/api": { target: backendTarget, changeOrigin: true, secure: false },
        "/supabase-api": {
          target: "http://127.0.0.1:54321",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/supabase-api/, ""),
        },
        "/edge-node": {
          target: "http://100.112.253.49:8090",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/edge-node/, ""),
        },
        "/studio": {
          target: "http://localhost:5002",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/studio/, ""),
        },
        "/health": { target: backendTarget, changeOrigin: true, secure: false },
        "/music/volumes": { target: backendTarget, changeOrigin: true },
        "/music/library": { target: backendTarget, changeOrigin: true },
        "/music/scan": { target: backendTarget, changeOrigin: true },
        "/music/stream": { target: backendTarget, changeOrigin: true },
        "/music/folders": { target: backendTarget, changeOrigin: true },
        "/music/process": { target: backendTarget, changeOrigin: true },
        "/music/cover": { target: backendTarget, changeOrigin: true },
        "/music/sync": { target: backendTarget, changeOrigin: true },
        "/music/youtube": { target: backendTarget, changeOrigin: true },
        "/ollama": {
          target: process.env.DOCKER_ENV === 'true' ? "http://host.docker.internal:11434/api" : "http://localhost:11434/api",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ollama/, ""),
        },
      },
    }
  };
});
