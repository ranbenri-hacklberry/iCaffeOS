import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import AppRoutes from './Routes';
import { useTheme } from './context/ThemeContext';

function App() {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // 🛡️ GLOBAL CRASH MONITORING
    const handleError = (e) => {
      console.error('🔥 GLOBAL_CRASH:', e);
      const errorMsg = e.message || (e.reason && e.reason.message) || 'Unknown Crash';

      // 🛡️ IGNORE BENIGN LAYOUT ERRORS
      if (
        errorMsg.includes('ResizeObserver loop completed with undelivered notifications') ||
        errorMsg.includes('ResizeObserver loop limit exceeded')
      ) {
        console.warn('Ignoring benign ResizeObserver error:', errorMsg);
        return;
      }

      if (typeof window !== 'undefined') {
        const overlay = document.createElement('div');
        overlay.id = 'crash-overlay';
        overlay.style.cssText =
          'position:fixed;top:0;left:0;width:100%;background:rgba(220,38,38,0.9);color:white;padding:20px;z-index:10000;font-family:sans-serif;text-align:center;direction:rtl;';
        overlay.innerHTML = `<h3>⚠️ אירעה שגיאה באפליקציה</h3><p>${errorMsg}</p><button onclick="window.location.reload()" style="background:white;color:red;border:none;padding:10px 20px;border-radius:10px;font-weight:bold;">רענן דף</button>`;
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
    <div className={isDarkMode ? 'dark' : ''}>
      <AppRoutes />
    </div>
  );
}

export default App;
