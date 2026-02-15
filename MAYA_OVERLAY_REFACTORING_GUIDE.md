# 🔄 MayaOverlay Refactoring Guide
## המדריך המלא לרה-פקטורינג - הכל בחלון אחד

---

## 📦 קומפוננטות מוכנות / Ready Components

✅ **FaceScannerCompact.tsx** - 200x200px webcam
✅ **PINPadCompact.tsx** - Compact PIN grid
✅ **ClockInModalInline.tsx** - Role selection (already exists)
✅ **StartScreen.tsx** - Initial choice screen

---

## 🏗️ הארכיטקטורה החדשה / New Architecture

### State Machine:

```typescript
type AuthState =
  | 'UNAUTHENTICATED'    // Not logged in - show StartScreen
  | 'FACE_SCANNING'      // Scanning face
  | 'PIN_ENTRY'          // Entering PIN
  | 'MATCHING'           // Verifying with backend
  | 'IDENTIFIED'         // Employee identified
  | 'CLOCK_IN_REQUIRED'  // Worker needs to select role
  | 'AUTHORIZED'         // Ready for chat
  | 'ERROR';             // Error state
```

### Flow:

```
User clicks Maya button
  ↓
Open MayaOverlay → authState = 'UNAUTHENTICATED'
  ↓
Show StartScreen
  ↓
User chooses Face or PIN
  ↓
authState = 'FACE_SCANNING' or 'PIN_ENTRY'
  ↓
Capture complete → authState = 'MATCHING'
  ↓
Backend verification → authState = 'IDENTIFIED'
  ↓
Check requirements:
  - If Worker → authState = 'CLOCK_IN_REQUIRED'
  - If Admin → authState = 'AUTHORIZED'
  ↓
Select role (if needed) → authState = 'AUTHORIZED'
  ↓
Show ChatInterface
```

---

## 📝 Step-by-Step Refactoring

### Step 1: Add Imports

**At the top of MayaOverlay.tsx:**

```typescript
// Add these imports
import StartScreen from './StartScreen';
import FaceScannerCompact from './FaceScannerCompact';
import PINPadCompact from './PINPadCompact';
import ClockInModalInline from './ClockInModalInline';
import { RefreshCw } from 'lucide-react'; // Add to existing lucide imports
```

### Step 2: Add Auth State

**After existing state declarations:**

```typescript
// 🆕 Auth State Management
type AuthState =
  | 'UNAUTHENTICATED'
  | 'FACE_SCANNING'
  | 'PIN_ENTRY'
  | 'MATCHING'
  | 'IDENTIFIED'
  | 'CLOCK_IN_REQUIRED'
  | 'AUTHORIZED'
  | 'ERROR';

const [authState, setAuthState] = useState<AuthState>('UNAUTHENTICATED');
const [employee, setEmployee] = useState<any>(null);
const [similarity, setSimilarity] = useState<number>(0);
const [authError, setAuthError] = useState<string>('');
```

### Step 3: Add Verification Handlers

**Add these handler functions:**

```typescript
// 🆕 Face Verification Handler
const handleFaceVerify = async (embedding: Float32Array, confidence: number) => {
  try {
    console.log('🎯 Face captured, verifying...');
    setAuthState('MATCHING');

    const response = await fetch('http://localhost:3001/api/maya/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embedding: Array.from(embedding),
        threshold: 0.4,
        businessId: businessId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.matched) {
      throw new Error(result.message || 'No matching employee');
    }

    // Set employee from backend
    const emp = {
      id: result.employee.id,
      name: result.employee.name,
      accessLevel: result.employee.accessLevel,
      isSuperAdmin: result.employee.isSuperAdmin,
      businessId: result.employee.businessId
    };

    setEmployee(emp);
    setSimilarity(result.similarity);
    setAuthState('IDENTIFIED');

    // Auto-check requirements after 1s
    setTimeout(() => checkAccessRequirements(emp), 1000);

  } catch (err) {
    console.error('Face verification failed:', err);
    setAuthError(err.message);
    setAuthState('ERROR');
  }
};

// 🆕 PIN Verification Handler
const handlePINVerify = async (emp: any, sim: number) => {
  console.log('✅ PIN verified:', emp);

  setEmployee(emp);
  setSimilarity(sim);
  setAuthState('IDENTIFIED');

  // Auto-check requirements
  setTimeout(() => checkAccessRequirements(emp), 1000);
};

// 🆕 Check Access Requirements
const checkAccessRequirements = async (emp: any) => {
  // Workers need to clock in
  const needsClockIn = ['Worker', 'Chef', 'Barista', 'Checker', 'Software Architect']
    .includes(emp.accessLevel) && !emp.isSuperAdmin;

  if (needsClockIn) {
    // Check if already clocked in
    try {
      const response = await fetch('http://localhost:3001/api/maya/check-clocked-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: emp.id })
      });

      const result = await response.json();

      if (result.isClockedIn) {
        setAuthState('AUTHORIZED');
      } else {
        setAuthState('CLOCK_IN_REQUIRED');
      }
    } catch (err) {
      console.error('Clock-in check failed:', err);
      // Don't block - allow access
      setAuthState('AUTHORIZED');
    }
  } else {
    // Admin/Manager - authorize immediately
    setAuthState('AUTHORIZED');
  }
};

// 🆕 Clock-In Handler
const handleClockInSuccess = (role: string, eventId: string) => {
  console.log('✅ Clocked in:', { role, eventId });
  setAuthState('AUTHORIZED');
};

// 🆕 Refresh Handler
const handleRefresh = () => {
  setMessages([]);
  setInput('');
  scrollToBottom();
};

// 🆕 Logout Handler
const handleLogout = () => {
  setAuthState('UNAUTHENTICATED');
  setEmployee(null);
  setSimilarity(0);
  setMessages([]);
  setInput('');
};
```

### Step 4: Add Worker Sanity Check

**In the sendMessage function, before calling the API:**

```typescript
const sendMessage = async () => {
  // ... existing validation ...

  try {
    // 🆕 Worker Sanity Check
    let messagesToSend = [...messages, userMessage];

    if (employee && !canViewFinancialData(employee)) {
      const workerInstruction = {
        role: 'system',
        content: `⚠️ SECURITY: You are talking to ${employee.name} (${employee.accessLevel}).
        DO NOT reveal any financial data, revenue, profit, sales figures, pricing strategies,
        or sensitive owner-only metrics.`
      };
      messagesToSend = [workerInstruction, ...messagesToSend];
    }

    // Send to API
    const response = await fetch('http://localhost:3001/api/maya/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messagesToSend,
        businessId: businessId,
        provider: provider,
        sessionId: employee?.id, // Track by employee
        employeeId: employee?.id
      })
    });

    // ... rest of existing code ...
  } catch (err) {
    // ... error handling ...
  }
};

// Helper function
const canViewFinancialData = (emp: any) => {
  return emp.accessLevel === 'Admin' ||
         emp.accessLevel === 'Manager' ||
         emp.isSuperAdmin === true;
};
```

### Step 5: Update Render Logic

**Replace the body content with state-based rendering:**

```typescript
{/* Body Content - State Based */}
{!isMinimized && (
  <div className="h-[464px] flex flex-col overflow-hidden">
    <AnimatePresence mode="wait">
      {/* UNAUTHENTICATED - Start Screen */}
      {authState === 'UNAUTHENTICATED' && (
        <motion.div
          key="start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <StartScreen
            onChooseFace={() => setAuthState('FACE_SCANNING')}
            onChoosePIN={() => setAuthState('PIN_ENTRY')}
          />
        </motion.div>
      )}

      {/* FACE_SCANNING */}
      {authState === 'FACE_SCANNING' && (
        <motion.div
          key="face"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <FaceScannerCompact
            onScanComplete={handleFaceVerify}
            onError={(err) => {
              setAuthError(err);
              setAuthState('ERROR');
            }}
            onSwitchToPIN={() => setAuthState('PIN_ENTRY')}
          />
        </motion.div>
      )}

      {/* PIN_ENTRY */}
      {authState === 'PIN_ENTRY' && (
        <motion.div
          key="pin"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <PINPadCompact
            onSuccess={handlePINVerify}
            onError={(err) => {
              setAuthError(err);
              setAuthState('ERROR');
            }}
            onSwitchToFace={() => setAuthState('FACE_SCANNING')}
          />
        </motion.div>
      )}

      {/* MATCHING */}
      {authState === 'MATCHING' && (
        <motion.div
          key="matching"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full"
        >
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-3" />
          <p className="text-white font-medium">בודק במערכת...</p>
        </motion.div>
      )}

      {/* IDENTIFIED */}
      {authState === 'IDENTIFIED' && (
        <motion.div
          key="identified"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mb-3" />
          <h3 className="text-xl font-bold text-white">היי {employee?.name}! 👋</h3>
          <p className="text-white/60 text-sm">{employee?.accessLevel}</p>
        </motion.div>
      )}

      {/* CLOCK_IN_REQUIRED */}
      {authState === 'CLOCK_IN_REQUIRED' && employee && (
        <motion.div
          key="clock-in"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="overflow-y-auto"
        >
          <ClockInModalInline
            employee={employee}
            onClockInSuccess={handleClockInSuccess}
            onError={(err) => {
              setAuthError(err);
              setAuthState('ERROR');
            }}
          />
        </motion.div>
      )}

      {/* AUTHORIZED - Chat Interface */}
      {authState === 'AUTHORIZED' && (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-full"
        >
          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* ...existing messages rendering... */}
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-3">
            {/* ...existing input rendering... */}
          </div>
        </motion.div>
      )}

      {/* ERROR */}
      {authState === 'ERROR' && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full p-6"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <h3 className="text-base font-bold text-white mb-2">שגיאה</h3>
          <p className="text-red-400 text-sm text-center mb-4">{authError}</p>
          <button
            onClick={() => setAuthState('UNAUTHENTICATED')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl
                       text-white text-sm font-medium transition"
          >
            נסה שוב
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)}
```

### Step 6: Add Refresh Button to Header

**In the header section, add refresh button:**

```typescript
<div className="flex items-center gap-1">
  {/* 🆕 Logout/Refresh Button */}
  {!isMinimized && authState === 'AUTHORIZED' && (
    <>
      <button
        onClick={handleRefresh}
        className="p-1.5 hover:bg-white/10 rounded-lg transition"
        title="רענן שיחה"
      >
        <RefreshCw className="w-4 h-4 text-white/60 hover:text-white" />
      </button>

      <button
        onClick={handleLogout}
        className="p-1.5 hover:bg-white/10 rounded-lg transition"
        title="התנתק"
      >
        <LogOut className="w-4 h-4 text-white/60 hover:text-white" />
      </button>
    </>
  )}

  {/* ... rest of header buttons ... */}
</div>
```

---

## 🗑️ What to Remove / מה למחוק

### Remove These Files:
```
❌ MayaGateway.tsx
❌ MayaGatewayComplete.tsx
❌ MayaAuthContext.tsx
❌ FaceScanner.tsx (full size)
❌ PINPad.tsx (full size)
❌ ClockInModal.tsx (full size)
```

### Remove These Props from MayaOverlay:
```typescript
// REMOVE these props (no longer needed):
❌ employee?: Employee
❌ canViewFinancialData?: boolean
❌ sessionId?: string
❌ onLogout?: () => void
❌ needsClockIn?: boolean
❌ isClockedIn?: boolean
❌ onClockInComplete?: () => void
```

**MayaOverlay is now self-contained!**

---

## ✅ Testing Checklist

### 1. Unauthenticated State:
- [ ] Click Maya button → StartScreen appears
- [ ] Choose Face → FaceScannerCompact appears
- [ ] Choose PIN → PINPadCompact appears

### 2. Face Authentication:
- [ ] Webcam opens (200x200)
- [ ] Face detected → green ring
- [ ] Capture 2 frames → success
- [ ] Transitions to MATCHING → IDENTIFIED
- [ ] Workers → CLOCK_IN_REQUIRED
- [ ] Admin → AUTHORIZED (skip clock-in)

### 3. PIN Authentication:
- [ ] PIN pad appears (compact grid)
- [ ] Enter 4 digits → auto-submit
- [ ] Success → IDENTIFIED → requirements check
- [ ] Failed → error + retry
- [ ] 3 failed → lock-out

### 4. Clock-In:
- [ ] ClockInModalInline appears for workers
- [ ] 2x2 role grid
- [ ] Last used role highlighted
- [ ] Select → clocking in animation
- [ ] Success → AUTHORIZED → chat

### 5. Chat:
- [ ] Messages area visible
- [ ] Input box works
- [ ] Worker sanity check (system instruction)
- [ ] Refresh button clears messages
- [ ] Logout returns to StartScreen

---

## 🎨 Visual Result

```
┌──────────────────────────────────┐
│ Maia [🔄][Logout][▫][×]         │
├──────────────────────────────────┤
│                                  │
│ StartScreen:                     │
│  Choose Face or PIN             │
│                                  │
│         ↓                        │
│                                  │
│ FaceScanner (200x200)           │
│  or PINPad                      │
│                                  │
│         ↓                        │
│                                  │
│ ClockInModalInline              │
│  (if worker)                    │
│                                  │
│         ↓                        │
│                                  │
│ Chat Interface                  │
│  💬 Messages                    │
│  📝 Input                       │
│                                  │
└──────────────────────────────────┘
     400px x 520px (fixed)
```

---

## 🚀 Summary

**What Changed:**
- ✅ Single MayaOverlay component (no separate Gateway)
- ✅ All auth states managed internally
- ✅ Compact components (200x200 webcam, smaller grids)
- ✅ Smooth AnimatePresence transitions
- ✅ Worker sanity check built-in
- ✅ Refresh + Logout buttons

**Benefits:**
- 🎯 Simpler architecture
- 📦 Smaller bundle (removed 3 components)
- 🎨 Consistent UI (always 400px window)
- 🔄 Smooth transitions
- 🛡️ Self-contained security logic

---

**Ready to apply? Let me know if you want me to create the complete refactored MayaOverlay.tsx file!** 🚀
