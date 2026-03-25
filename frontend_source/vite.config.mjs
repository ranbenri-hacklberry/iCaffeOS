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
      port: 4029,
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: 'all',
      proxy: {
        "/item": { target: backendTarget, changeOrigin: true, secure: false },
        "/api/marketing": { target: backendTarget, changeOrigin: true, secure: false },
        "/api/maya": { target: backendTarget, changeOrigin: true, secure: false },
        "/api": { target: backendTarget, changeOrigin: true, secure: false },
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
