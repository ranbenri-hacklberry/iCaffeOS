import React, { useEffect, useState, lazy, Suspense } from "react";
import { ConnectionProvider } from "./context/ConnectionContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import SplashScreen from "./components/SplashScreen.jsx";

import LoadingFallback from "./components/LoadingFallback.jsx";

// Lazy Load Routes to ensure tree-shaking works for LITE mode
const FullRoutes = lazy(() => import("./Routes.jsx"));
const LiteRoutes = lazy(() => import("./LiteRoutes.jsx"));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isLite = import.meta.env.VITE_APP_MODE === 'lite';

  useEffect(() => {
    // 🛡️ GLOBAL CRASH MONITORING
    const handleError = (e) => {
      console.error("🔥 GLOBAL_CRASH:", e);
      const errorMsg = e.message || (e.reason && e.reason.message) || "Unknown Crash";\n      \n      // 🛡️ IGNORE BENIGN LAYOUT ERRORS\n      if (errorMsg.includes("ResizeObserver loop completed with undelivered notifications") || errorMsg.includes("ResizeObserver loop limit exceeded")) {\n        console.warn("Ignoring benign ResizeObserver error:", errorMsg);\n        return;\n      }
      if (typeof window !== 'undefined') {
        const overlay = document.createElement('div');
        overlay.id = 'crash-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:rgba(220,38,38,0.9);color:white;padding:20px;z-index:10000;font-family:sans-serif;text-align:center;direction:rtl;';
        overlay.innerHTML = `<h3>⚠️ אירעה שגיאה באפליקציה</h3><p>${errorMsg}</p><button onclick="window.location.reload()" style="background:white;color:red;border:none;padding:10px 20px;border-radius:10px;font-weight:bold;">רענן דף</button>`;
        if (!document.getElementById('crash-overlay')) {
          document.body.appendChild(overlay);
        }
      }
    };

    window.onerror = (msg, url, line, col, error) => handleError(error || { message: msg });
    window.onunhandledrejection = (event) => handleError(event);

    // 🛡️ [SMART RESET] Detect environment changes and force-wipe Dexie if needed
    const runMigration = async () => {
      try {
        const { autoDetectMigrationAndReset } = await import("./services/syncService");
        await autoDetectMigrationAndReset();
      } catch (e) {
        console.error("Migration check failed:", e);
      }
    };
    runMigration();

    // 🌍 Pre-warm the Active URL Resolver cache
    import("./utils/apiUtils.js").then(({ resolveUrl }) => {
      resolveUrl().catch(err => console.warn("Failed to pre-warm URL cache:", err));
    });

    return () => {
      window.onerror = null;
      window.onunhandledrejection = null;
    };
  }, []);

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  // 🚀 LITE MODE: Minimal Providers
  if (isLite) {
    return (
      <ThemeProvider>
        <ConnectionProvider>
          <Suspense fallback={<LoadingFallback message="טוען גרסה קלה..." />}>
            <LiteRoutes />
          </Suspense>
        </ConnectionProvider>
      </ThemeProvider>
    );
  }

  // 🌟 FULL MODE: All Providers
  return (
    <ThemeProvider>
      <ConnectionProvider>
        <Suspense fallback={<LoadingFallback message="טוען מודולים..." />}>
          <FullRoutes />
        </Suspense>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

export default App;
