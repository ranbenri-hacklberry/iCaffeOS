# MayaOverlay Inline Clock-In Patch

## Changes Required

### 1. Add Props to MayaOverlay Interface

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

### 2. Add State for Clock-In

```typescript
const [showClockIn, setShowClockIn] = useState(needsClockIn && !isClockedIn);
```

### 3. Add Refresh Button to Header

In the header (around line 493), add refresh button:

```typescript
<div className="flex items-center gap-1">
    {/* 🆕 Refresh Button */}
    {!isMinimized && !showClockIn && (
        <button
            onClick={() => {
                setMessages([]);
                setInput('');
                // Optionally: generate new sessionId
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="רענן שיחה"
        >
            <RefreshCw className="w-4 h-4 text-white/60" />
        </button>
    )}

    {/* Provider Toggle */}
    ...existing code...
</div>
```

### 4. Show Inline Clock-In Modal

In the body section (after header, before chat messages), add:

```typescript
{/* Body */}
{!isMinimized && (
    <div className="flex-1 flex flex-col overflow-hidden h-[456px]">
        {/* 🆕 INLINE CLOCK-IN (if needed) */}
        {showClockIn && employee && (
            <div className="flex-1 overflow-y-auto p-4">
                <ClockInModalInline
                    employee={employee}
                    onClockInSuccess={(role, eventId) => {
                        setShowClockIn(false);
                        if (onClockInComplete) {
                            onClockInComplete(role, eventId);
                        }
                    }}
                    onError={(err) => {
                        console.error('Clock-in error:', err);
                        // Show error toast
                    }}
                />
            </div>
        )}

        {/* CHAT INTERFACE (only if NOT showing clock-in) */}
        {!showClockIn && (
            <>
                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    ...existing messages code...
                </div>

                {/* Input Area */}
                <div className="border-t border-white/10 p-3">
                    ...existing input code...
                </div>
            </>
        )}
    </div>
)}
```

### 5. Create ClockInModalInline Component

```typescript
// New component: ClockInModalInline.tsx (compact version)
interface ClockInModalInlineProps {
  employee: Employee;
  onClockInSuccess: (role: string, eventId: string) => void;
  onError: (error: string) => void;
}

const ClockInModalInline: React.FC<ClockInModalInlineProps> = ({
  employee,
  onClockInSuccess,
  onError
}) => {
  // Same logic as ClockInModal but with compact UI
  const ROLES = [
    { id: 'Software Architect', label: 'ארכיטקט', icon: Terminal, color: 'cyan' },
    { id: 'Chef', label: 'שף', icon: Utensils, color: 'orange' },
    { id: 'Barista', label: 'בריסטה', icon: Coffee, color: 'purple' },
    { id: 'Checker', label: 'צ׳קר', icon: ClipboardCheck, color: 'green' }
  ];

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-1">
          שלום {employee.name}! 👋
        </h3>
        <p className="text-sm text-white/60">בחר תפקיד למשמרת</p>
      </div>

      {/* Compact 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(role => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className="p-3 rounded-xl bg-slate-800/40 border border-cyan-400/20
                         hover:border-cyan-400/60 transition-all group"
            >
              <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-br
                            from-${role.color}-500 to-${role.color}-600
                            rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-bold text-white">{role.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

### 6. Update MayaGateway to Pass Props

In MayaGatewayComplete.tsx:

```typescript
// When rendering MayaOverlay
if (mayaAuth.authState === 'AUTHORIZED' || mayaAuth.authState === 'CLOCK_IN_REQUIRED') {
  return (
    <MayaOverlay
      employee={mayaAuth.employee}
      canViewFinancialData={canViewFinancialData(mayaAuth)}
      sessionId={mayaAuth.currentSessionId}
      needsClockIn={mayaAuth.authState === 'CLOCK_IN_REQUIRED'}  // 🆕
      isClockedIn={mayaAuth.isClockedIn}                          // 🆕
      onClockInComplete={(role, eventId) => {                     // 🆕
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

## Visual Flow

```
┌─────────────────────────────────────┐
│  Maia AI        [🔄] [Toggle] [▫][×]│ ← Header with Refresh
├─────────────────────────────────────┤
│                                     │
│  IF needsClockIn:                   │
│  ┌───────────────────────────────┐ │
│  │   שלום Danny! 👋              │ │
│  │   בחר תפקיד למשמרת            │ │
│  │                               │ │
│  │   ┌────────┐ ┌────────┐      │ │
│  │   │ ארכיטקט│ │  שף    │      │ │
│  │   └────────┘ └────────┘      │ │
│  │   ┌────────┐ ┌────────┐      │ │
│  │   │בריסטה  │ │ צ׳קר   │      │ │
│  │   └────────┘ └────────┘      │ │
│  └───────────────────────────────┘ │
│                                     │
│  ELSE (after clock-in):             │
│  ┌───────────────────────────────┐ │
│  │  💬 Chat messages...          │ │
│  │  📝 Input area...             │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## Benefits

1. ✅ הכל בתוך חלון Maya אחד
2. ✅ לא תופס את כל המסך
3. ✅ מעבר חלק: Clock-in → Chat
4. ✅ כפתור רענון לשיחה חדשה
5. ✅ UI קומפקטי וממוקד

---

## Implementation Steps

1. Create `ClockInModalInline.tsx` (compact version)
2. Add imports to MayaOverlay: `RefreshCw`, `ClockInModalInline`
3. Add props to interface
4. Add state and refresh handler
5. Modify render: show clock-in OR chat (conditional)
6. Update MayaGateway to pass new props

Ready to implement? 🚀
