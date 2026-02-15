# 🎯 Maya Gateway - Complete Authentication & Authorization Flow

## תרשים הזרימה המלא

```
┌─────────────────────────────────────────────────────────┐
│           גישה למערכת (localhost:4029)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  LoginGateway   │
         │  בודק רשת      │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    מקומי               מרחוק
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ MayaGateway  │    │ LoginScreen  │
│ Face/PIN     │    │ Email/Pass   │
└──────┬───────┘    └──────┬───────┘
       │                   │
       └──────────┬─────────┘
                  │
          ✅ מזוהה בהצלחה
                  │
                  ▼
        ┌─────────────────┐
        │  בדיקת תפקיד    │
        └────────┬────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
  Worker      Manager     Owner/Admin
     │           │           │
     ▼           │           │
┌─────────────┐  │           │
│ יש משמרת?   │  │           │
└──────┬──────┘  │           │
       │         │           │
   ┌───┴───┐     │           │
   │       │     │           │
  כן      לא    │           │
   │       │     │           │
   ▼       │     │           │
┌─────────────┐  │           │
│"רוצה להיכנס │  │           │
│ למשמרת?"    │  │           │
└──────┬──────┘  │           │
       │         │           │
   ┌───┴───┐     │           │
   │       │     │           │
  כן      לא    │           │
   │       │     │           │
   ▼       │     │           │
┌─────────────┐  │           │
│Clock-In API │  │           │
│רישום נוכחות │  │           │
└──────┬──────┘  │           │
       │         │           │
       └────┬────┴───────────┘
            │
            ▼
   ┌─────────────────┐
   │ Mode Selection  │
   │ Screen          │
   └────────┬────────┘
            │
    ┌───────┼───────┐
    │       │       │
  כיוסק  מטבח   מנהל
    │       │       │
    ▼       ▼       ▼
 ┌────┐ ┌────┐ ┌────────┐
 │ POS│ │KDS │ │Protected│
 └────┘ └────┘ └────┬───┘
                     │
              דורש אימות נוסף
                     │
                     ▼
            ┌──────────────────┐
            │ Re-Auth Modal    │
            │ Face/PIN מנהל    │
            └────────┬─────────┘
                     │
                 ✅ אושר
                     │
                     ▼
            ┌──────────────────┐
            │  Manager Apps    │
            │ Dashboard, Data  │
            └──────────────────┘
```

---

## 📋 Phase 1: Clock-In Integration

### קבצים לשנות:
1. **MayaGatewayComplete.tsx**
   - אחרי AUTHORIZED → בדוק אם Worker
   - אם Worker → הצג ClockInPrompt
   - אחרי Clock-In → redirect to Mode Selection

2. **ClockInModal.tsx** (קיים)
   - תמיכה ב-"worker השני מצטרף"
   - כפתור "כניסה למשמרת" בנפרד

3. **MayaOverlay.tsx** (קיים)
   - כפתור "יציאה ממשמרת" (Clock-Out)
   - כפתור "כניסה למשמרת" (לעובד נוסף)

### Auth States חדשים:
```typescript
| 'AUTHORIZED'
| 'CLOCK_IN_PROMPT'   // 🆕 שואל אם רוצה clock-in
| 'CLOCKED_IN'        // 🆕 נרשם למשמרת
```

---

## 📋 Phase 2: Protected Mode Selection

### קומפוננטות חדשות:

#### 1. **ProtectedModeButton.tsx**
```tsx
interface ProtectedModeButtonProps {
  label: string;
  icon: Icon;
  requiredLevel: 'Manager' | 'Owner' | 'Admin';
  currentUserLevel: string;
  onAccessGranted: () => void;
}

// אם currentUser אין הרשאה → הצג ReAuthModal
// אם יש הרשאה → קרא onAccessGranted
```

#### 2. **ReAuthModal.tsx**
```tsx
// Modal זיהוי מחדש למנהלים/בעלים
// תומך ב-Face ID או PIN
// מקבל requiredLevel
// מחזיר authorized user
```

#### 3. **ModeSelectionScreen.jsx** (עדכון)
```tsx
<ProtectedModeButton
  label="ניהול עסק"
  requiredLevel="Owner"
  currentUserLevel={mayaAuth.employee?.accessLevel}
  onAccessGranted={() => navigate('/data-manager')}
/>

<ProtectedModeButton
  label="דוחות"
  requiredLevel="Manager"
  currentUserLevel={mayaAuth.employee?.accessLevel}
  onAccessGranted={() => navigate('/reports')}
/>

// כיוסק ו-KDS → ללא הגנה (נגישים לכולם)
```

---

## 📋 Phase 3: Multi-User iPad Support

### Scenario: 2 עובדים באותו iPad

**עובד ראשון:**
1. Maya Gateway → זיהוי
2. "רוצה להיכנס למשמרת?" → כן
3. Clock-In → recorded
4. KDS Screen נפתח

**עובד שני מגיע:**
1. לוחץ על כפתור Maya (בפינה)
2. Maya Modal נפתח
3. "כניסה למשמרת" → Face/PIN
4. זיהוי → Clock-In
5. כעת **שני עובדים** רשומים על iPad

**יציאה:**
- לוחץ Maya → "יציאה ממשמרת"
- זיהוי → Clock-Out
- אם זה היה העובד האחרון → חזרה ל-Login

---

## 🔐 Authorization Matrix

| תפקיד | POS | KDS | Inventory | Reports | Settings | Dashboard |
|-------|-----|-----|-----------|---------|----------|-----------|
| **Worker** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Chef/Barista** | ❌ | ✅ | ✅ (view) | ❌ | ❌ | ❌ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ⚠️ (limited) | ✅ |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Super Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ + Admin |

**Legend:**
- ✅ = גישה מלאה
- ⚠️ = גישה מוגבלת
- ❌ = דורש Re-Auth

---

## 🎨 UX Flow Examples

### Example 1: Worker Clock-In
```
1. [Face Scan] → ✅ מזוהה: "דני - Barista"
2. Modal: "היי דני! רוצה להיכנס למשמרת?"
   [כן, בוא נתחיל] [לא, רק לעבוד קצת]
3. אם כן → Clock-In → "נרשמת למשמרת! 🎉"
4. → Mode Selection → [Kiosk] [KDS] זמינים
```

### Example 2: Worker Tries Manager Feature
```
1. Worker מזוהה → Mode Selection
2. לוחץ על "דוחות" (Manager only)
3. ReAuthModal: "נדרשת הרשאת מנהל"
   [סרוק פנים מנהל] [הזן PIN מנהל]
4. מנהל מסרק פנים → ✅ אושר
5. → Reports Screen
```

### Example 3: Multiple Workers Same iPad
```
1. Worker #1: Maya → Clock-In → KDS
2. Worker #2 מגיע, לוחץ Maya floating button
3. Maya Modal: [כניסה למשמרת] [יציאה ממשמרת]
4. Worker #2 → כניסה למשמרת → Face scan → Clock-In
5. כעת שניהם רשומים!
6. Worker #1 גומר: Maya → יציאה → Face scan → Clock-Out
7. Worker #2 ממשיך לעבוד
```

---

## 🛠️ Implementation Checklist

### Phase 1: Clock-In Flow
- [ ] Add CLOCK_IN_PROMPT state to MayaAuthContext
- [ ] Update MayaGatewayComplete to show prompt after AUTHORIZED
- [ ] Create ClockInPrompt component (or reuse ClockInModal)
- [ ] Add "Join Shift" button to MayaOverlay
- [ ] Add "Leave Shift" button to MayaOverlay
- [ ] Test: Worker → Clock-In → appears in dashboard
- [ ] Test: Worker → Clock-Out → recorded in DB

### Phase 2: Protected Modes
- [ ] Create ProtectedModeButton.tsx
- [ ] Create ReAuthModal.tsx (Face/PIN for elevated access)
- [ ] Update ModeSelectionScreen with ProtectedModeButton
- [ ] Define authorization matrix (who can access what)
- [ ] Test: Worker tries Manager feature → Re-Auth required
- [ ] Test: Manager authenticates → access granted

### Phase 3: Multi-User Support
- [ ] Add floating Maya button in app (always visible)
- [ ] Update MayaOverlay with "Join Shift" / "Leave Shift"
- [ ] Test: 2 workers clock-in on same iPad
- [ ] Test: 1 worker leaves, other continues
- [ ] Track "active users" on iPad (localStorage?)

### Phase 4: Database & Backend
- [x] Migration: clock_events table ✅
- [x] Migration: RPC functions ✅
- [ ] Apply migration to DB
- [ ] Test: Clock-In API endpoint
- [ ] Test: Clock-Out API endpoint
- [ ] Test: Check clocked-in status

---

## 🚀 Priority Order

**עכשיו (Critical):**
1. ✅ הרץ migration (20260209_maya_gateway_complete.sql)
2. ✅ רשום פנים של לפחות עובד אחד (`/admin/enroll-face`)
3. ✅ בדוק שזיהוי פנים עובד

**הבא (High Priority):**
1. Clock-In prompt אחרי זיהוי
2. ProtectedModeButton במסך Mode Selection
3. ReAuthModal לגישה מוגבלת

**אחרי (Medium Priority):**
1. Multi-user support (Join/Leave shift)
2. Floating Maya button
3. Active users tracking

**Nice to Have:**
1. Shift schedule integration
2. Auto clock-out after shift ends
3. Analytics dashboard for attendance

---

## 📝 הערות חשובות

1. **Session vs Shift:**
   - Session = זמן חיבור ל-iPad (יכול להיות קצר)
   - Shift = משמרת מלאה (clock-in → clock-out)

2. **Security:**
   - אל תשמור passwords/PINs ב-localStorage
   - Re-Auth token תקף רק ל-30 דקות
   - כל Re-Auth נרשם ב-audit log

3. **UX:**
   - Clock-In prompt לא חייב (אפשרות "דלג")
   - Re-Auth modal חייב להיות ברור למה צריך
   - Error messages בעברית ברורה

4. **Performance:**
   - Face recognition לא אמור לקחת יותר מ-2 שניות
   - אם לוקח יותר → fallback ל-PIN אוטומטי
   - Cache face embeddings ב-memory

---

**עכשיו: תגיד לי אם ה-migration רץ בהצלחה ואז נתחיל לממש Phase 1!** 🚀
