# ⚡ Maya Gateway - Quick Start
## התחלה מהירה - שינויים הכרחיים

---

## ✅ מה כבר מוכן / What's Ready

- ✅ MayaAuthContext.tsx - State management
- ✅ MayaGateway.tsx - Authentication orchestrator
- ✅ FaceScanner.tsx - Face recognition component
- ✅ MayaOverlay.tsx - Updated with employee context
- ✅ Backend routes - /verify-face, /verify-pin, /check-clocked-in
- ✅ Database migrations - face_embedding + audit logs

---

## 🔧 שינוי יחיד נדרש / Single Change Required

### קובץ: `frontend_source/src/App.jsx`

**שורות 7 ו-40 - לפני:**
```jsx
import MayaOverlay from "./components/maya/MayaOverlay";

// ...

<ThemeProvider>
  <ConnectionProvider>
    <MayaOverlay />  {/* ❌ ישיר - ללא Auth */}
    <Suspense fallback={<LoadingFallback message="טוען מודולים..." />}>
      <FullRoutes />
    </Suspense>
  </ConnectionProvider>
</ThemeProvider>
```

**אחרי:**
```jsx
import { MayaAuthProvider } from "./context/MayaAuthContext";
import { MayaGateway } from "./components/maya/MayaGateway";

// ...

<ThemeProvider>
  <ConnectionProvider>
    <MayaAuthProvider>  {/* ✅ הוסף Provider */}
      <MayaGateway />   {/* ✅ Gateway במקום Overlay */}
      <Suspense fallback={<LoadingFallback message="טוען מודולים..." />}>
        <FullRoutes />
      </Suspense>
    </MayaAuthProvider>
  </ConnectionProvider>
</ThemeProvider>
```

**קובץ מלא לאחר השינוי:**
```jsx
import React, { useEffect, useState, lazy, Suspense } from "react";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SplashScreen from "@/components/SplashScreen";
import LoadingFallback from "@/components/LoadingFallback";

// ✅ NEW IMPORTS
import { MayaAuthProvider } from "./context/MayaAuthContext";
import { MayaGateway } from "./components/maya/MayaGateway";

const FullRoutes = lazy(() => import("./Routes"));
const LiteRoutes = lazy(() => import("./LiteRoutes"));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const isLite = import.meta.env.VITE_APP_MODE === 'lite';

  // Effect hooks remain the same...

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  // LITE MODE: No changes needed
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

  // FULL MODE: ✅ Updated with Maya Gateway
  return (
    <ThemeProvider>
      <ConnectionProvider>
        <MayaAuthProvider>
          <MayaGateway />
          <Suspense fallback={<LoadingFallback message="טוען מודולים..." />}>
            <FullRoutes />
          </Suspense>
        </MayaAuthProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

export default App;
```

---

## 🧪 בדיקה מהירה / Quick Test

### 1. הפעל את השרת
```bash
cd /sessions/eager-intelligent-euler/mnt/my_app/backend
node server.js
```

### 2. פתח את האפליקציה
```
http://localhost:4028
```

### 3. לחץ על כפתור Maya (✨ בפינה שמאל למטה)

### 4. צפוי לראות:
- ✅ מודאל נפתח עם "Maya Gateway"
- ✅ מצלמה מופעלת אוטומטית
- ✅ סריקת פנים מתחילה ("מזהה פנים...")

### 5. אם יש פנים רשומות:
- ✅ "בודק במערכת..." (Matching)
- ✅ "היי {שם}! 👋" (Identified)
- ✅ מעבר לצ'אט או לבקשת clock-in

### 6. אם אין פנים רשומות:
- ❌ "שגיאה: No matching employee found"
- ➡️ לך ל-`/admin/enroll-face` לרשום פנים

---

## 🎯 בעיות נפוצות / Troubleshooting

### "MayaAuthProvider is not exported"
**פתרון:** ודא ש-`MayaAuthContext.tsx` קיים בתיקייה:
```
frontend_source/src/context/MayaAuthContext.tsx
```

### "MayaGateway is not exported"
**פתרון:** ודא ש-`MayaGateway.tsx` קיים ב:
```
frontend_source/src/components/maya/MayaGateway.tsx
```

### "Camera not working"
**פתרון:**
1. בדוק הרשאות דפדפן
2. ודא HTTPS או localhost
3. נסה דפדפן אחר

### "No matching employee found"
**פתרון:**
1. לך ל-`http://localhost:4028/admin/enroll-face`
2. רשום את הפנים שלך
3. נסה שוב

---

## 📚 מסמכים נוספים

- **MAYA_GATEWAY_SUMMARY.md** - סיכום מלא של כל מה שנבנה
- **INTEGRATION_GUIDE.md** - מדריך אינטגרציה מפורט
- **Plan file** - `/.claude/plans/sharded-jingling-shore.md`

---

## ✨ זהו! זה הכל.

שינוי **יחיד** ב-`App.jsx` והמערכת תעבוד.

**Phase 3 הושלמה בהצלחה! 🎉**

---

*Questions? Issues? בדוק את INTEGRATION_GUIDE.md למדריך מלא.*
