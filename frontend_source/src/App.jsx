import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import AppRoutes from './Routes';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import MusicPage from './pages/music';
import YouTubePage from './pages/youtube';
import './i18n';

const isStandaloneRanTunes = import.meta.env.VITE_STANDALONE_RANTUNES === 'true';

function AppContent() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const handleError = (e) => {
      console.error('🔥 GLOBAL_CRASH:', e);
      const errorMsg = e.message || (e.reason && e.reason.message) || 'Unknown Crash';

      if (
        errorMsg.includes('ResizeObserver loop completed with undelivered notifications') ||
        errorMsg.includes('ResizeObserver loop limit exceeded')
      ) {
        return;
      }

      if (typeof window !== 'undefined') {
        const overlay = document.createElement('div');
        overlay.id = 'crash-overlay';
        overlay.style.cssText =
          'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.95);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10000;font-family:Inter,sans-serif;text-align:center;direction:ltr;backdrop-blur:10px;';
        overlay.innerHTML = `
          <div style="background:#1e293b;padding:40px;border-radius:24px;border:1px solid #334155;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <h3 style="font-size:24px;font-weight:900;margin-bottom:16px;">⚠️ Application Error</h3>
            <p style="color:#94a3b8;margin-bottom:24px;max-width:400px;">${errorMsg}</p>
            <button onclick="window.location.reload()" style="background:#f97316;color:white;border:none;padding:12px 32px;border-radius:12px;font-weight:bold;cursor:pointer;transition:transform 0.2s;">Reload System</button>
          </div>
        `;
        if (!document.getElementById('crash-overlay')) {
          document.body.appendChild(overlay);
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} font-inter`} dir="ltr">
      {isStandaloneRanTunes ? (
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MusicPage />
              </ProtectedRoute>
            } />
            <Route path="/youtube" element={
              <ProtectedRoute>
                <YouTubePage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      ) : (
        <AppRoutes />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MusicProvider>
          <AppContent />
        </MusicProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
