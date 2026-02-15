import React, { useEffect, useState, lazy, Suspense } from "react";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SplashScreen from "@/components/SplashScreen";

import LoadingFallback from "@/components/LoadingFallback";
import MayaOverlay from "./components/maya/MayaOverlay";

// Lazy Load Routes to ensure tree-shaking works for LITE mode
const FullRoutes = lazy(() => import("./Routes"));
const LiteRoutes = lazy(() => import("./LiteRoutes"));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isLite = import.meta.env.VITE_APP_MODE === 'lite';

  useEffect(() => {
    // 🌍 Pre-warm the Active URL Resolver cache
    import("@/utils/apiUtils").then(({ resolveUrl }) => {
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
        <MayaOverlay />
        <Suspense fallback={<LoadingFallback message="טוען מודולים..." />}>
          <FullRoutes />
        </Suspense>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

export default App;
