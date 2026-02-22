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
    // 🌍 Pre-warm the Active URL Resolver cache
    import("./utils/apiUtils.js").then(({ resolveUrl }) => {
      resolveUrl().catch(err => console.warn("Failed to pre-warm URL cache:", err));
    });
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
