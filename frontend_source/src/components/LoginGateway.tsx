/**
 * Login Gateway - Smart Login Router
 * מנתב בין MayaGateway (רשת מקומית) ל-LoginScreen (גישה מרחוק)
 */

import React from 'react';
import { isLocalNetworkAccess } from '@/utils/networkDetection';
import MayaGateway from '@/components/maya/MayaGatewayComplete';
import LoginScreen from '@/pages/login/LoginScreen';

export const LoginGateway: React.FC = () => {
  const isLocalNetwork = isLocalNetworkAccess();
  // אם אנחנו ב-Electron, אנחנו תמיד רוצים כניסת PIN כברירת מחדל
  const isElectronApp = window.navigator.userAgent.toLowerCase().includes('electron') ||
    window.location.protocol === 'file:';

  const [useRemoteLogin, setUseRemoteLogin] = React.useState(false);

  console.log('🔐 LoginGateway:', { isLocalNetwork, isElectronApp, useRemoteLogin });

  if ((isLocalNetwork || isElectronApp) && !useRemoteLogin) {
    // רשת מקומית → כניסה עם PIN (בלבד)
    return (
      <div className="min-h-screen bg-[#050505] relative" dir="rtl">
        <MayaGateway forceOpen={true} hideClose={true} />
      </div>
    );
  } else {
    // גישה מרחוק או מעבר יזום → לוגין רגיל
    return (
      <div className="relative">
        <LoginScreen />
        {isLocalNetwork && (
          <button
            onClick={() => setUseRemoteLogin(false)}
            className="fixed bottom-4 right-4 text-slate-500 hover:text-white text-[10px] transition-colors z-[10000]"
          >
            חזור לכניסת PIN
          </button>
        )}
      </div>
    );
  }
};

export default LoginGateway;
