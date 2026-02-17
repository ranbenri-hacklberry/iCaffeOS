import React from "react";
import { BrowserRouter, HashRouter, Routes as RouterRoutes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MayaAuthProvider, useMayaAuth } from "./context/MayaAuthContext";
import { MusicProvider } from "./context/MusicContext";
import SyncStatusModal from "./components/SyncStatusModal";
import ConnectivityStatus from "./components/ConnectivityStatus";
import MiniMusicBar from './components/music/MiniMusicBar';
// SyncManager removed as per user request
import LoginGateway from './components/LoginGateway';
import { isElectron } from "./utils/apiUtils";

// Pages
import LoginScreen from "./pages/login/LoginScreen";
import ModeSelectionScreen from "./pages/login/ModeSelectionScreen";
import HierarchicalDashboard from "./pages/login/HierarchicalDashboard";
import MenuOrderingInterface from './pages/menu-ordering-interface';
import KdsScreen from './pages/kds';
import DataManagerInterface from './pages/data-manager-interface';
import SuperAdminDashboard from './pages/super-admin';
import SuperAdminPortal from './pages/super-admin/SuperAdminPortal';
import DatabaseExplorer from './pages/super-admin/DatabaseExplorer';
import ManagerKDS from './components/manager/ManagerKDS';
import InventoryPage from './pages/inventory';
import PrepPage from './pages/prep';
import MusicPage from './pages/music';
import DexieAdminPanel from './pages/dexie-admin';
import MayaAssistant from './pages/maya';

import DexieTestPage from './pages/DexieTestPage';
import KanbanPage from './pages/kanban';
import DriverPage from './pages/driver';
import OrderTrackingPage from './pages/order-tracking';
import CompleteProfile from './pages/login/CompleteProfile';
import GoogleCallback from './pages/auth/GoogleCallback';
import OwnerSettings from './pages/owner-settings';
import IPadMenuEditor from './pages/ipad-menu-editor';
import WizardLayout from './pages/onboarding/components/WizardLayout';
import MenuReviewDashboard from './pages/onboarding/components/MenuReviewDashboard';
import IPadInventoryPage from './pages/ipad_inventory/IPadInventoryPage';
import FaceScannerTest from './pages/FaceScannerTest';
import EnrollFace from './pages/EnrollFace';
import VideoCreator from './pages/VideoCreator';
import AdGenerator from './components/marketing/AdGenerator';
import ProfileSettings from './pages/profile-settings';
import AdminFixSuperAdmin from './pages/admin-fix-superadmin';
import SMSDashboard from './components/SMSDashboard';

// Wrapper for AdGenerator to provide props
const AdGeneratorWrapper = () => {
  const { currentUser } = useAuth();
  return (
    <AdGenerator
      businessId={currentUser?.business_id}
      businessName={currentUser?.business?.name || 'העסק שלי'}
      logoUrl={currentUser?.business?.logo_url}
    />
  );
};

// Animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "linear" }
};

const PageTransition = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

import LoadingFallback from './components/LoadingFallback';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, deviceMode: stateMode, isLoading } = useAuth();
  const mayaAuth = useMayaAuth();
  const location = useLocation();

  // Use state mode or fallback to localStorage for immediate transitions
  const deviceMode = stateMode || localStorage.getItem('kiosk_mode');

  // Show loading state with Framer Motion (Using new Fallback)
  if (isLoading) {
    return <LoadingFallback message="טוען מערכת..." />;
  }

  // Check if authenticated via Maya Gateway (biometric)
  const isMayaAuthenticated = mayaAuth.authState === 'AUTHORIZED' && mayaAuth.employee;

  // CRITICAL: If no user and not Maya authenticated, redirect to login
  // Also clear any stale deviceMode that might be in localStorage
  if (!currentUser && !isMayaAuthenticated) {
    // Clear stale mode to prevent auto-redirect to POS on next login
    localStorage.removeItem('kiosk_mode');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.role === 'super_admin' || currentUser?.isSuperAdmin || mayaAuth.employee?.isSuperAdmin;
  const isSuperAdminPath = location.pathname.startsWith('/super-admin');

  // 👑 SUPER ADMIN REDIRECT: If super admin lands on root '/', send them to their portal
  if (isSuperAdmin && location.pathname === '/' && !currentUser?.is_impersonating) {
    console.log('👑 Super Admin on root - Redirecting to Portal');
    return <Navigate to="/super-admin" replace />;
  }

  if (isSuperAdminPath) {
    // Super Admin routes don't need device mode
    return <PageTransition>{children}</PageTransition>;
  }

  // User is logged in - check mode
  if (!deviceMode) {
    // Super Admin without device mode should go to their portal, not mode selection
    if (isSuperAdmin && !currentUser?.is_impersonating) {
      return <Navigate to="/super-admin" replace />;
    }

    // Explicitly check for POS path (/) when no mode is set
    if (location.pathname === '/' || location.pathname === '/menu-ordering-interface') {
      return <Navigate to="/mode-selection" replace />;
    }

    // If no mode selected and not already on selection screen or login, redirect to mode selection
    if (location.pathname !== '/mode-selection' && location.pathname !== '/login') {
      return <Navigate to="/mode-selection" replace />;
    }

    // If on mode selection, allow access
    return children;
  }

  // 🛡️ MODE-BASED ROOT REDIRECT: Ensure root path always reflects the active mode.
  // This prevents users who are 'Managers' from seeing the 'Kiosk' just because they are on '/'
  if (location.pathname === '/' && deviceMode && deviceMode !== 'kiosk') {
    if (deviceMode === 'kds') return <Navigate to="/kds" replace />;
    if (deviceMode === 'manager') return <Navigate to="/data-manager-interface" replace />;
    if (deviceMode === 'music') return <Navigate to="/music" replace />;
  }

  return <PageTransition>{children}</PageTransition>;
};

const AppRoutes = () => {
  const location = useLocation();

  return (

    <RouterRoutes location={location} key={location.pathname}>
      {/* Public Routes */}
      <Route path="/login" element={<PageTransition><LoginGateway /></PageTransition>} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/face-scanner-test" element={<PageTransition><FaceScannerTest /></PageTransition>} />
      <Route path="/admin/enroll-face" element={<PageTransition><EnrollFace /></PageTransition>} />
      <Route path="/admin" element={<Navigate to="/login" replace />} />
      <Route path="/manager" element={<Navigate to="/login" replace />} />
      <Route path="/super-admin" element={
        <ProtectedRoute>
          <SuperAdminPortal />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/businesses" element={
        <ProtectedRoute>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/db" element={
        <ProtectedRoute>
          <DatabaseExplorer />
        </ProtectedRoute>
      } />
      <Route path="/super-admin/sms" element={
        <ProtectedRoute>
          <SMSDashboard />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route path="/mode-selection" element={
        <ProtectedRoute>
          <HierarchicalDashboard />
        </ProtectedRoute>
      } />

      {/* Legacy mode selection (kept for backward compatibility) */}
      <Route path="/mode-selection-legacy" element={
        <ProtectedRoute>
          <ModeSelectionScreen />
        </ProtectedRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <MenuOrderingInterface />
        </ProtectedRoute>
      } />

      {/* Aliases for Menu Interface */}
      <Route path="/menu-ordering-interface" element={<Navigate to="/" replace />} />

      <Route path="/kds" element={
        <ProtectedRoute>
          <KdsScreen />
        </ProtectedRoute>
      } />

      {/* Aliases for KDS */}
      <Route path="/kitchen-display-system-interface" element={<Navigate to="/kds" replace />} />

      <Route path="/mobile-kds" element={
        <ProtectedRoute>
          <ManagerKDS />
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute>
          <InventoryPage />
        </ProtectedRoute>
      } />

      <Route path="/ipad-inventory-test" element={
        <ProtectedRoute>
          <IPadInventoryPage />
        </ProtectedRoute>
      } />

      <Route path="/prep" element={
        <ProtectedRoute>
          <PrepPage />
        </ProtectedRoute>
      } />

      <Route path="/music" element={
        <ProtectedRoute>
          <MusicPage />
        </ProtectedRoute>
      } />

      <Route path="/video-creator" element={
        <ProtectedRoute>
          <VideoCreator />
        </ProtectedRoute>
      } />

      <Route path="/ad-generator" element={
        <ProtectedRoute>
          <AdGeneratorWrapper />
        </ProtectedRoute>
      } />

      <Route path="/maya" element={
        <ProtectedRoute>
          <MayaAssistant />
        </ProtectedRoute>
      } />

      <Route path="/profile-settings" element={
        <ProtectedRoute>
          <ProfileSettings />
        </ProtectedRoute>
      } />

      {/* Admin Utility - Fix Super Admin */}
      <Route path="/admin-fix-superadmin" element={<AdminFixSuperAdmin />} />

      <Route path="/data-manager-interface" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <DataManagerInterface />
          </ErrorBoundary>
        </ProtectedRoute>
      } />



      {/* Google Callback Route */}
      <Route path="/auth/callback" element={<GoogleCallback />} />

      {/* Kanban Order System */}
      <Route path="/kanban" element={
        <ProtectedRoute>
          <KanbanPage />
        </ProtectedRoute>
      } />

      <Route path="/driver" element={
        <ProtectedRoute>
          <DriverPage />
        </ProtectedRoute>
      } />

      <Route path="/owner-settings" element={
        <ProtectedRoute>
          <OwnerSettings />
        </ProtectedRoute>
      } />

      <Route path="/onboarding" element={
        <ProtectedRoute>
          <WizardLayout />
        </ProtectedRoute>
      } />

      <Route path="/menu-editor" element={
        <ProtectedRoute>
          <ErrorBoundary>
            <MenuReviewDashboard />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Order Tracking - Public (no auth required) */}
      <Route path="/order-tracking/:id" element={<PageTransition><OrderTrackingPage /></PageTransition>} />

      {/* Debug/Internal Tools */}
      <Route path="/dexie-test" element={
        <ProtectedRoute>
          <DexieTestPage />
        </ProtectedRoute>
      } />

      <Route path="/dexie-admin" element={
        <ProtectedRoute>
          <DexieAdminPanel />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </RouterRoutes>

  );
};

const Routes = () => {
  const Router = isElectron() ? HashRouter : BrowserRouter;

  return (
    <Router>
      <ErrorBoundary>
        <MayaAuthProvider>
          <AuthProvider>
            <ConnectivityStatus />
            {/* <SyncStatusModal /> - USER REQUESTED TO HIDE THIS MODAL */}
            <MusicProvider>
              <ScrollToTop />
              <AppRoutes />
            </MusicProvider>
          </AuthProvider>
        </MayaAuthProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default Routes;