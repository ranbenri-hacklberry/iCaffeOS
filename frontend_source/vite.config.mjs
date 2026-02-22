import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// NOTE: tsconfigPaths removed — it conflicts with resolve.alias in Rollup production builds on Vercel.
// The explicit resolve.alias below handles all @/ imports reliably.
import tagger from "@dhiwise/component-tagger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLite = env.VITE_APP_MODE === 'lite';
  const rootDir = process.cwd();

  // Docker networking: use service name 'backend' when running in container
  // Falls back to localhost:8081 for local development
  const backendTarget = process.env.DOCKER_ENV === 'true'
    ? 'http://localhost:8081'
    : 'http://localhost:8081';

  // Check if running in a container, Linux environment without display (headless), or Vercel
  const isHeadless = process.env.DOCKER_ENV === 'true' ||
    !!process.env.VERCEL ||
    !!process.env.CI ||
    (process.platform === 'linux' && !process.env.DISPLAY);

  // 🚨 Only load Electron plugins if we are NOT in a headless/CI/Vercel environment
  const plugins = [
    react(),
    tagger(),
  ];

  if (!isHeadless) {
    try {
      console.log("🔌 Attempting to load Electron plugins...");
      // Use variables to prevent static analysis/bundling of optional dependencies
      const electronPlugin = 'vite-plugin-electron';
      const rendererPlugin = 'vite-plugin-electron-renderer';

      const electron = (await import(electronPlugin)).default;
      const renderer = (await import(rendererPlugin)).default;

      plugins.push(
        electron([
          {
            // Main-Process entry point
            entry: 'electron/main/index.ts',
            vite: {
              build: {
                outDir: 'dist-electron/main',
              },
            },
          },
          {
            // Preload-Process entry point
            entry: 'electron/preload/index.ts',
            onstart(args) {
              args.reload()
            },
            vite: {
              build: {
                outDir: 'dist-electron/preload',
              },
            },
          },
        ]),
        renderer()
      );
      console.log("✅ Electron plugins loaded successfully.");
    } catch (e) {
      console.warn("⚠️  Electron plugins could not be loaded, skipping. This is normal in web-only environments (Vercel/CI). Error:", e.message);
    }
  }

  const srcPath = path.resolve(__dirname, "./src");

  const aliases = {
    "@": srcPath,
  };

  if (isLite) {
    console.log("🚀 Building in LITE mode: Swapping heavy modules...");
    const emptyModule = path.resolve(__dirname, "./src/emptyModule.jsx");
    aliases['framer-motion'] = emptyModule;
    aliases['recharts'] = emptyModule;
  }

  return {
    base: './', // 🚀 CRITICAL: Fixes relative paths for Electron file:// protocol
    build: {
      outDir: "build",
      chunkSizeWarningLimit: isLite ? 500 : 2000,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // 🔧 FIX: Explicitly pass alias resolution to Rollup so @/ imports
      // work in production builds (tsconfigPaths alone is unreliable on Vercel)
      rollupOptions: {
        plugins: [],
      },
    },
    plugins: plugins.filter(Boolean),
    resolve: {
      alias: aliases,
      // Deduplicate so Rollup uses the same resolution as Vite dev server
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 4028,
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: 'all',
      proxy: {
        "/item": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Marketing routes
        "/api/marketing": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Maya AI routes
        "/api/maya": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        "/health": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        // Music API Routes - Explicitly proxying to avoid matching the frontend /music route
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
          target: "http://localhost:11434/api",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ollama/, ""),
        },
      },
    }
  };
});
