# MayaOverlay.tsx - Required Modifications

## Summary
Add inline clock-in support and refresh button to MayaOverlay.

---

## Step 1: Add Imports (Line ~13)

**Add these imports:**
```typescript
import { RefreshCw } from 'lucide-react'; // Add to existing lucide imports
import ClockInModalInline from './ClockInModalInline';
```

---

## Step 2: Update Props Interface (Line ~47)

**BEFORE:**
```typescript
interface MayaOverlayProps {
    employee?: Employee | null;
    canViewFinancialData?: boolean;
    sessionId?: string;
    onLogout?: () => void;
}
```

**AFTER:**
```typescript
interface MayaOverlayProps {
    employee?: Employee | null;
    canViewFinancialData?: boolean;
    sessionId?: string;
    onLogout?: () => void;
    needsClockIn?: boolean;           // 🆕 NEW
    isClockedIn?: boolean;             // 🆕 NEW
    onClockInComplete?: (role: string, eventId: string) => void; // 🆕 NEW
}
```

---

## Step 3: Update Component Signature (Line ~87)

**BEFORE:**
```typescript
export const MayaOverlay: React.FC<MayaOverlayProps> = ({
    employee = null,
    canViewFinancialData = false,
    sessionId = null,
    onLogout = null
}) => {
```

**AFTER:**
```typescript
export const MayaOverlay: React.FC<MayaOverlayProps> = ({
    employee = null,
    canViewFinancialData = false,
    sessionId = null,
    onLogout = null,
    needsClockIn = false,           // 🆕 NEW
    isClockedIn = false,             // 🆕 NEW
    onClockInComplete = null         // 🆕 NEW
}) => {
```

---

## Step 4: Add Clock-In State (after other useState declarations)

**Add this state:**
```typescript
const [showClockIn, setShowClockIn] = useState(needsClockIn && !isClockedIn);
```

**Add this effect to sync with props:**
```typescript
useEffect(() => {
    setShowClockIn(needsClockIn && !isClockedIn);
}, [needsClockIn, isClockedIn]);
```

---

## Step 5: Add Refresh Handler

**Add this function (near other handlers):**
```typescript
const handleRefresh = () => {
    setMessages([]);
    setInput('');
    scrollToBottom();
};
```

---

## Step 6: Add Refresh Button to Header

**Find the header buttons section (around line 493-530) and add refresh button BEFORE the provider toggle:**

```typescript
<div className="flex items-center gap-1">
    {/* 🆕 Refresh Button */}
    {!isMinimized && !showClockIn && (
        <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="רענן שיחה"
        >
            <RefreshCw className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
    )}

    {/* Provider Toggle */}
    {!isMinimized && (
        <div className="flex bg-white/10 rounded-lg p-0.5 ml-2">
            ...existing provider toggle code...
        </div>
    )}

    ...rest of header buttons...
</div>
```

---

## Step 7: Modify Body to Show Clock-In OR Chat

**Find the body section (around line 545-650) and wrap it:**

**BEFORE:**
```typescript
{!isMinimized && (
    <>
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            ...messages rendering...
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-3">
            ...input rendering...
        </div>
    </>
)}
```

**AFTER:**
```typescript
{!isMinimized && (
    <>
        {/* 🆕 INLINE CLOCK-IN (if needed) */}
        {showClockIn && employee && (
            <div className="flex-1 overflow-y-auto px-4 py-3">
                <ClockInModalInline
                    employee={employee}
                    onClockInSuccess={(role, eventId) => {
                        console.log('✅ Clocked in:', { role, eventId });
                        setShowClockIn(false);
                        if (onClockInComplete) {
                            onClockInComplete(role, eventId);
                        }
                    }}
                    onError={(err) => {
                        console.error('Clock-in error:', err);
                        // You can add a toast notification here
                    }}
                />
            </div>
        )}

        {/* CHAT INTERFACE (only if NOT showing clock-in) */}
        {!showClockIn && (
            <>
                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    ...existing messages rendering...
                </div>

                {/* Input Area */}
                <div className="border-t border-white/10 p-3">
                    ...existing input rendering...
                </div>
            </>
        )}
    </>
)}
```

---

## Step 8: Update MayaGatewayComplete.tsx

**Find where MayaOverlay is rendered (around line 148-160):**

**BEFORE:**
```typescript
if (mayaAuth.authState === 'AUTHORIZED' && isFullyAuthorized(mayaAuth)) {
  return (
    <MayaOverlay
      employee={mayaAuth.employee}
      canViewFinancialData={canViewFinancialData(mayaAuth)}
      sessionId={mayaAuth.currentSessionId}
      onLogout={() => {
        mayaAuth.reset();
        setIsOpen(false);
      }}
    />
  );
}
```

**AFTER:**
```typescript
// Show overlay for both AUTHORIZED and CLOCK_IN_REQUIRED states
if (mayaAuth.authState === 'AUTHORIZED' || mayaAuth.authState === 'CLOCK_IN_REQUIRED') {
  return (
    <MayaOverlay
      employee={mayaAuth.employee}
      canViewFinancialData={canViewFinancialData(mayaAuth)}
      sessionId={mayaAuth.currentSessionId}
      needsClockIn={mayaAuth.authState === 'CLOCK_IN_REQUIRED'}  // 🆕
      isClockedIn={mayaAuth.isClockedIn}                          // 🆕
      onClockInComplete={(role, eventId) => {                     // 🆕
        console.log('✅ Clock-in complete from inline modal');
        mayaAuth.setClockInStatus(true, role);
        mayaAuth.setAuthState('AUTHORIZED');
      }}
      onLogout={() => {
        mayaAuth.reset();
        setIsOpen(false);
      }}
    />
  );
}
```

---

## Visual Result

```
┌─────────────────────────────────────┐
│  Maia AI    [🔄] [Local] [▫][×]     │ ← Refresh button added
├─────────────────────────────────────┤
│                                     │
│  When needsClockIn=true:            │
│  ┌─────────────────────────────┐   │
│  │  שלום Danny! 👋             │   │
│  │  בחר תפקיד למשמרת          │   │
│  │                             │   │
│  │  ┌──────┐  ┌──────┐        │   │
│  │  │ארכיטקט│  │ שף  │        │   │
│  │  └──────┘  └──────┘        │   │
│  │  ┌──────┐  ┌──────┐        │   │
│  │  │בריסטה │  │צ׳קר │        │   │
│  │  └──────┘  └──────┘        │   │
│  └─────────────────────────────┘   │
│                                     │
│  After clock-in:                    │
│  Messages appear here...            │
│  Input box at bottom...             │
│                                     │
└─────────────────────────────────────┘
```

---

## Testing

1. **Start without clock-in:**
   - Employee is Admin/Super Admin
   - Should see chat immediately
   - Refresh button visible and working

2. **Start with clock-in required:**
   - Employee is Worker/Chef/Barista/Checker
   - Not clocked in today
   - Should see inline role selection
   - Select role → smooth transition to chat
   - Refresh button appears after clock-in

3. **Already clocked in:**
   - Worker but already clocked in
   - Should skip inline modal, go straight to chat

---

## Files Modified

1. ✅ `ClockInModalInline.tsx` (NEW)
2. 📝 `MayaOverlay.tsx` (MODIFIED - 8 changes)
3. 📝 `MayaGatewayComplete.tsx` (MODIFIED - 1 change)

---

Ready to apply these changes! 🚀
